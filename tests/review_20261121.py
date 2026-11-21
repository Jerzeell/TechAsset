from pathlib import Path
import os,json,urllib.request,urllib.error,secrets,datetime,subprocess,sys
sys.stdout.reconfigure(encoding='utf-8')
out=Path(__file__).parent/'review-output';out.mkdir(exist_ok=True)
db=os.environ['TECHASSET_REVIEW_DB'];base='http://127.0.0.1:5103/api'
results=[];now=datetime.datetime.now(datetime.timezone.utc)
def request(method,path,data=None,token=None):
 headers={'Content-Type':'application/json'}
 if token:headers['Authorization']='Bearer '+token
 r=urllib.request.Request(base+path,data=json.dumps(data).encode() if data is not None else None,headers=headers,method=method)
 try:
  with urllib.request.urlopen(r,timeout=20) as response: return response.status,json.load(response)
 except urllib.error.HTTPError as e:
  raw=e.read()
  return e.code,json.loads(raw) if raw else None
def check(case,action,expected,observed,input={},entity=None):
 assert expected==observed,(case,expected,observed)
 results.append(dict(case=case,action=action,db=db,input=input,expected=expected,observed=observed,entity=entity,result='OK'))
 (out/'essential-results.json').write_text(json.dumps({'date':now.isoformat(),'db':db,'checks':results},ensure_ascii=False,indent=2),encoding='utf-8')
def sql(q,database=db):
 s=subprocess.run(['C:/Program Files/PostgreSQL/16/bin/psql.exe','-X','-h','127.0.0.1','-U','postgres','-d',database,'-At','-v','ON_ERROR_STOP=1','-c',q],capture_output=True,encoding='utf-8',check=True)
 return json.loads(s.stdout.strip())
def login(email,password):
 status,s=request('POST','/auth/login',{'email':email,'password':password});assert status==200
 if s['user']['mustChangePassword']:
  new='Review!a2'+secrets.token_hex(16)
  status,s=request('POST','/auth/change-password',{'currentPassword':password,'newPassword':new,'confirmation':new},s['token']);assert status==200
 return s
admin=login('admin@techasset.com',os.environ['Seed__AdminPassword']);token=admin['token']
u={'nombres':'Ensayo','apellidos':'Revisión N21','correo':'qa.n21@example.invalid','area':'QA N21','rol':'Colaborador','password':'Review!a2'+secrets.token_hex(12)}
status,user=request('POST','/users',u,token)
check('N21-01','Registrar usuario',201,status,{'correo':u['correo'],'rol':u['rol']},user.get('id'))
uid=user['id']
persisted=sql('SELECT row_to_json(x) FROM (SELECT "Id"::text AS id,"Correo" AS correo,"Rol" AS rol,"MustChangePassword" AS pendiente FROM "Users" WHERE "Id"=\''+uid+'\') x')
check('N21-02','Persistencia del usuario',{'id':uid,'correo':u['correo'],'rol':'Colaborador','pendiente':True},persisted,{'userId':uid},uid)
for case,omit,weak in [('N21-03','mayúscula','abcdefgh#123'),('N21-04','minúscula','ABCDEFGH#123'),('N21-05','número','Abcdefgh#!'),('N21-06','símbolo','Abcdefgh123')]:
 status,response=request('POST','/users',{**u,'correo':case.lower()+'@example.invalid','password':weak},token)
 check(case,'Alta rechazada por falta de '+omit,400,status,{'omisión':omit,'rol':'Colaborador'})
e={'codigoPatrimonial':'QA-N21-001','nombre':'Laptop de prueba N21','categoria':'Laptops','marca':'Ensayo','estado':'Disponible'}
status,equipment=request('POST','/equipment',e,token);eid=equipment['id']
check('N21-07','Registrar equipo',201,status,e,eid)
loan_input={'usuarioId':uid,'equipoId':eid,'fechaPrestamo':(now-datetime.timedelta(minutes=10)).isoformat(),'observacion':'Entrega de ensayo N21 con cargador.'}
status,loan=request('POST','/loans',loan_input,token);lid=loan['id']
check('N21-08','Registrar préstamo',201,status,loan_input,lid)
status,response=request('POST','/loans',loan_input,token)
check('N21-09','Rechazar segundo préstamo activo',400,status,{'equipoId':eid},lid)
status,response=request('POST',f'/loans/{lid}/return',{'fechaDevolucion':now.isoformat(),'observacion':'','estadoEquipo':'Disponible'},token)
check('N21-10','Rechazar devolución sin observaciones',400,status,{'loanId':lid,'observacion':''},lid)
status,returned=request('POST',f'/loans/{lid}/return',{'fechaDevolucion':now.isoformat(),'observacion':'Recepción conforme N21.','estadoEquipo':'Disponible'},token)
check('N21-11','Registrar devolución',200,status,{'loanId':lid,'estadoEquipo':'Disponible'},lid)
detail=sql('SELECT row_to_json(x) FROM (SELECT "Id"::text AS id,"UsuarioId"::text AS usuario,"EquipoId"::text AS equipo,"Observacion" AS entrega,"ObservacionDevolucion" AS devolucion,("FechaDevolucion" IS NOT NULL) AS devuelto FROM "Loans" WHERE "Id"=\''+lid+'\') x')
check('N21-12','Persistencia de préstamo y devolución',{'id':lid,'usuario':uid,'equipo':eid,'entrega':loan_input['observacion'],'devolucion':'Recepción conforme N21.','devuelto':True},detail,{'loanId':lid},lid)
status,inventory=request('GET','/equipment',token=token)
check('N21-13','Consultar inventario y reconocer equipo',True,any(x['id']==eid and x['estado']=='Disponible' for x in inventory),{'codigo':'QA-N21-001'},eid)
personal=login(u['correo'],u['password'])
status,history=request('GET','/loans/history',token=personal['token'])
check('N21-14','Consultar historial propio',True,any(x['id']==lid for x in history) and all(x['usuarioId']==uid for x in history),{'usuarioId':uid},lid)
status,_=request('GET','/users',token=personal['token'])
check('N21-15','Colaborador sin acceso a usuarios',403,status,{'rol':'Colaborador'})
status,request_created=request('POST','/requests',{'equipoId':eid,'motivo':'Ensayo N21 de aprobación.'},personal['token']);assert status==201
rid=request_created['id']
status,_=request('POST',f'/requests/{rid}/approve',{},token);assert status==200
status,active=request('GET','/loans/active',token=token);second=next(x for x in active if x['equipoId']==eid)
status,_=request('POST',f'/loans/{second["id"]}/return',{'fechaDevolucion':(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(seconds=2)).isoformat(),'observacion':'Cierre N21 de aprobación.','estadoEquipo':'Disponible'},token);assert status==200
sql_dashboard='''SELECT row_to_json(x) FROM (SELECT (SELECT count(*) FROM "Equipments") AS "totalEquipments",(SELECT count(*) FROM "Equipments" WHERE "Estado"='Disponible') AS "availableEquipments",(SELECT count(*) FROM "Equipments" WHERE "Estado"='Prestado') AS "loanedEquipments",(SELECT count(*) FROM "Equipments" WHERE "Estado"='Mantenimiento') AS "maintenanceEquipments",(SELECT count(*) FROM "Equipments" WHERE "Estado"='Baja') AS "decommissionedEquipments",(SELECT count(*) FROM "Loans") AS "totalLoans",(SELECT "AreaPrestamo" FROM "Loans" GROUP BY "AreaPrestamo" ORDER BY count(*) DESC,"AreaPrestamo" LIMIT 1) AS "areaConMayorUso",(SELECT count(*) FROM "Loans" GROUP BY "AreaPrestamo" ORDER BY count(*) DESC,"AreaPrestamo" LIMIT 1) AS "areaConMayorUsoCantidad") x'''
status,dashboard=request('GET','/reports/dashboard',token=token)
check('N21-16','Dashboard frente a SQL independiente',sql(sql_dashboard),dashboard,{'SQL':'conteos y agrupación directa'},None)
sql_areas='''SELECT coalesce(json_agg(x),'[]'::json) FROM (SELECT "AreaPrestamo" AS area,count(*) AS "totalLoans",count(*) FILTER(WHERE "FechaDevolucion" IS NULL) AS "activeLoans" FROM "Loans" WHERE "AreaPrestamo"<>'' GROUP BY "AreaPrestamo" ORDER BY count(*) DESC,"AreaPrestamo") x'''
status,areas=request('GET','/reports/loans-by-area',token=token)
check('N21-17','Préstamos por área frente a SQL',sql(sql_areas),areas,{'area':'QA N21'})
sql_top='''SELECT coalesce(json_agg(x),'[]'::json) FROM (SELECT e."Id" AS "equipmentId",e."Nombre" AS nombre,e."CodigoPatrimonial" AS "codigoPatrimonial",e."Categoria" AS categoria,e."Marca" AS marca,count(*) AS "timesUsed" FROM "Loans" l JOIN "Equipments" e ON e."Id"=l."EquipoId" GROUP BY e."Id" ORDER BY count(*) DESC,e."CodigoPatrimonial" LIMIT 5) x'''
status,top=request('GET','/reports/most-used-equipment',token=token)
check('N21-18','Equipos más utilizados frente a SQL',sql(sql_top),top,{'codigo':'QA-N21-001'})
(out/'report-queries.sql').write_text(sql_dashboard+';\n'+sql_areas+';\n'+sql_top+';\n',encoding='utf-8')
summary={'db':db,'userId':uid,'userMarker':u['correo'],'equipmentId':eid,'equipmentMarker':e['codigoPatrimonial'],'loanId':lid,'approvedRequestId':rid,'secondLoanId':second['id'],'dashboard':dashboard,'areas':areas,'top':top}
(out/'entities.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
constraint=Path(__file__).parent/'database_constraints.sql'
p=subprocess.run(['C:/Program Files/PostgreSQL/16/bin/psql.exe','-X','-h','127.0.0.1','-U','postgres','-d',db,'-v','ON_ERROR_STOP=1','-f',str(constraint)],capture_output=True,encoding='utf-8',check=True)
(out/'constraints-utf8.txt').write_text(p.stdout+p.stderr,encoding='utf-8')
lines=[f'BASE: {db}',f'FECHA: {now.isoformat()}',f'USUARIO: {uid} / {u["correo"]}',f'EQUIPO: {eid} / {e["codigoPatrimonial"]}',f'PRESTAMO: {lid}','']
for r in results:lines.append(f'{r["case"]} | {r["action"]} | esperado={r["expected"]} | observado={r["observed"]} | OK')
lines+=['','SQL independiente: dashboard, préstamos por área y equipos más utilizados coinciden en esta base y este conjunto de datos.','No se ejecutaron pruebas de carga, filtros masivos ni exportación CSV en esta revisión.']
(out/'essential-summary.txt').write_text('\n'.join(lines),encoding='utf-8')
print(json.dumps({'checks':len(results),'db':db,'markers':[u['correo'],e['codigoPatrimonial'],lid],'constraints':p.returncode},ensure_ascii=False))
