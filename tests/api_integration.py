import urllib.request,urllib.error,json,uuid,datetime,concurrent.futures,sys
sys.stdout.reconfigure(encoding='utf-8')
import os
base=os.environ['TECHASSET_TEST_URL'];checks=[];tag=uuid.uuid4().hex[:8]
def req(method,path,data=None,token=None,expected=200,label=None):
 headers={'Content-Type':'application/json'}
 if token:headers['Authorization']='Bearer '+token
 request=urllib.request.Request(base+path,data=json.dumps(data).encode() if data is not None else None,headers=headers,method=method)
 try:
  with urllib.request.urlopen(request,timeout=20) as response:status=response.status;raw=response.read()
 except urllib.error.HTTPError as e:status=e.code;raw=e.read()
 value=json.loads(raw) if raw else None
 allowed=[expected] if isinstance(expected,int) else expected
 if status not in allowed:raise AssertionError(f'{method} {path}: esperado {allowed}, llegó {status}: {value}')
 if label:checks.append(label);print('OK',label)
 return value

def login(email,password):
 session=req('POST','/auth/login',{'email':email,'password':password},expected=[200,401])
 if 'token' not in session:
  session=req('POST','/auth/login',{'email':email,'password':'Personal.'+password+'#2026'})
 if session['user']['mustChangePassword']:
  session=req('POST','/auth/change-password',{'currentPassword':password,'newPassword':'Personal.'+password+'#2026','confirmation':'Personal.'+password+'#2026'},session['token'])
 return session
a=login('admin@techasset.com',os.environ['TECHASSET_TEST_ADMIN_PASSWORD']);admin=a['token'];t=login('tech@techasset.com',os.environ['TECHASSET_TEST_TECH_PASSWORD']);tech=t['token'];c=login('colab@techasset.com',os.environ['TECHASSET_TEST_COLAB_PASSWORD']);colab=c['token'];cid=c['user']['id']
checks.append('Inicio de sesión de los tres roles')
req('GET','/users',expected=401,label='Listado de usuarios exige autenticación')
req('GET','/users',token=colab,expected=403,label='Colaborador no puede consultar datos de otros usuarios')
u={'nombres':'Prueba','apellidos':'Integración','correo':f'prueba.{tag}@techasset.com','area':'Evaluación','password':'Clave#123','rol':'Colaborador'}
created=req('POST','/users',u,admin,201,'Registrar usuario');uid=created['id']
req('POST','/users',{**u,'correo':u['correo'].upper()},admin,[400,409],'RN-08 correo único sin distinguir mayúsculas')
req('POST','/users',{**u,'correo':'invalido'},admin,400,'Formato de correo validado')
req('POST','/users',{**u,'correo':'otro@techasset.com','nombres':'   '},admin,400,'Campos con solo espacios rechazados')
req('POST','/users',{**u,'correo':'otro@techasset.com','password':'123'},admin,400,'Longitud mínima de contraseña')
req('PUT','/users/'+uid,{**u,'nombres':'Usuario actualizado','password':''},admin,200,'Editar usuario sin exigir cambiar contraseña')
req('POST','/auth/register',{**u,'correo':f'publico.{tag}@techasset.com','rol':'Administrador'},expected=401,label='Las cuentas se crean únicamente desde administración')
# Provisioning, mandatory activation and password reset on a disposable account.
security_user={**u,'correo':f'seguridad.{tag}@techasset.com'}
sec=req('POST','/users',security_user,admin,201,'Nueva cuenta requiere cambio de contraseña');assert sec['mustChangePassword']
session=req('POST','/auth/login',{'email':security_user['correo'],'password':security_user['password']},label='Contraseña temporal permite únicamente activar la cuenta');restricted=session['token']
blocked=req('GET','/equipment',token=restricted,expected=403,label='Servidor bloquea módulos antes de cambiar contraseña');assert blocked['code']=='PASSWORD_CHANGE_REQUIRED'
req('GET','/users',token=restricted,expected=403,label='No se puede omitir la activación con una URL directa')
req('GET','/auth/support-contacts',label='Ayuda muestra administradores activos sin exigir acceso')
for password,label in [('Ab#1234','longitud'),('abcde#123','mayúscula'),('ABCDE#123','minúscula'),('Abcdefg#!','número'),('Abcdef123','símbolo'),('Abcdef12 ','espacio no sustituye símbolo')]:
 req('POST','/auth/change-password',{'currentPassword':security_user['password'],'newPassword':password,'confirmation':password},restricted,400,'Política exige '+label)
change={'currentPassword':security_user['password'],'newPassword':'Mi.Personal#2026','confirmation':'Mi.Personal#2026'}
req('POST','/auth/change-password',{**change,'currentPassword':'Incorrecta#2026'},restricted,400,'Verificar contraseña actual')
req('POST','/auth/change-password',{**change,'confirmation':'Diferente#2026'},restricted,400,'Confirmación se valida en backend')
req('POST','/auth/change-password',{**change,'newPassword':security_user['password'],'confirmation':security_user['password']},restricted,400,'Rechazar reutilización de contraseña temporal')
activated=req('POST','/auth/change-password',change,restricted,label='Activar cuenta con contraseña personal');assert not activated['user']['mustChangePassword'] and activated['user']['passwordChangedAt']
req('GET','/equipment',token=restricted,expected=401,label='Token temporal queda revocado después del cambio')
req('GET','/equipment',token=activated['token'],label='Nueva sesión accede después de activar')
req('PUT','/users/'+sec['id'],{**security_user,'password':'Restablecida#2026'},admin,label='Administrador restablece con contraseña temporal')
req('GET','/equipment',token=activated['token'],expected=401,label='Restablecimiento revoca sesiones existentes')
reset=req('POST','/auth/login',{'email':security_user['correo'],'password':'Restablecida#2026'});assert reset['user']['mustChangePassword']
req('GET','/equipment',token=reset['token'],expected=403,label='Restablecimiento vuelve a exigir activación')
req('POST','/auth/login',{'email':security_user['correo'],'password':'Mi.Personal#2026'},expected=401,label='Contraseña anterior deja de funcionar')
for password in ['abcde#123','ABCDE#123','Abcdefg#!','Abcdef123']:
 req('POST','/users',{**u,'correo':f'weak.{tag}@techasset.com','password':password},admin,400,'Alta de usuario valida composición en backend')
e={'codigoPatrimonial':'TEST-'+tag,'nombre':'Laptop de evaluación','categoria':'Laptops','marca':'Dell','estado':'Disponible'}
equip=req('POST','/equipment',e,tech,201,'Registrar equipo desde Tecnología');eid=equip['id']
req('POST','/equipment',{**e,'codigoPatrimonial':e['codigoPatrimonial'].lower()},admin,[400,409],'RN-07 código patrimonial único')
req('POST','/equipment',{**e,'codigoPatrimonial':'INV-'+tag,'estado':'Inventado'},admin,400,'Estado inválido rechazado')
req('POST','/equipment',{**e,'codigoPatrimonial':'PRE-'+tag,'estado':'Prestado'},admin,400,'No crear estado Prestado sin préstamo')
req('POST','/equipment',e,colab,403,'Colaborador no puede crear equipos')
now=datetime.datetime.now(datetime.timezone.utc);date=lambda d:d.isoformat()
l={'usuarioId':uid,'equipoId':eid,'fechaPrestamo':date(now-datetime.timedelta(hours=1)),'observacion':'Entrega con cargador'}
req('POST','/loans',l,colab,403,'Solo Tecnología o Administración asigna préstamos')
loan=req('POST','/loans',l,tech,201,'Registrar préstamo y conservar responsable');lid=loan['id'];assert loan['responsableId']==t['user']['id']
assert req('GET','/equipment/'+eid,token=admin)['estado']=='Prestado'
req('POST','/loans',l,admin,400,'RN-01 bloquear segundo préstamo activo')
req('PUT','/equipment/'+eid,{**e,'estado':'Disponible'},admin,400,'Impedir liberar equipo mientras tiene préstamo activo')
req('DELETE','/equipment/'+eid,token=admin,expected=400,label='RN-06 no eliminar equipo con historial')
req('POST',f'/loans/{lid}/return',{'fechaDevolucion':date(now),'observacion':'   '},tech,400,'RN-10 devolución requiere observaciones')
req('POST',f'/loans/{lid}/return',{'fechaDevolucion':l['fechaPrestamo'],'observacion':'Devuelto'},tech,400,'RN-04 devolución estrictamente posterior')
req('POST',f'/loans/{lid}/return',{'fechaDevolucion':date(now),'observacion':'Devuelto'},colab,403,'Colaborador no registra devolución')
returned=req('POST',f'/loans/{lid}/return',{'fechaDevolucion':date(now),'observacion':'Requiere mantenimiento','estadoEquipo':'Mantenimiento'},tech,200,'Registrar devolución hacia mantenimiento');assert returned['observacion']=='Entrega con cargador';assert returned['observacionDevolucion']=='Requiere mantenimiento'
checks.append('Observaciones de entrega y devolución preservadas')
req('POST','/loans',l,admin,400,'RN-02 no prestar equipos en mantenimiento')
req('PATCH',f'/equipment/{eid}/state',{'estado':'Baja'},admin,200,'Actualizar estado de equipo')
req('POST','/loans',l,admin,400,'RN-03 no prestar equipos de baja')
req('PATCH',f'/equipment/{eid}/state',{'estado':'Disponible'},admin,200)
request=req('POST','/requests',{'equipoId':eid,'motivo':'Trabajo de colaborador'},colab,201,'Colaborador solicita equipo')
req('POST',f"/requests/{request['id']}/approve",{},colab,403,'Colaborador no puede aprobar solicitudes')
approved=req('POST',f"/requests/{request['id']}/approve",{},tech,200,'Tecnología aprueba solicitud y registra préstamo');assert approved['usuarioId']==cid
own=req('GET','/loans/history',token=colab,label='Colaborador consulta solo su historial');assert all(x['usuarioId']==cid for x in own)
req('GET','/loans/equipment/'+eid,token=colab,expected=403,label='Historial global de equipos protegido')
req('POST',f"/loans/{approved['id']}/return",{'fechaDevolucion':date(datetime.datetime.now(datetime.timezone.utc)),'observacion':'Completo y operativo'},tech,200,'Devolver y liberar equipo')
req('PATCH','/equipment/'+eid+'/state',{'estado':'Disponible'},admin,200,'Actualizar estado de mantenimiento a disponible')
request=req('POST','/requests',{'equipoId':eid,'motivo':'Trabajo del colaborador'},colab,201,'Colaborador solicita equipo')
req('POST',f"/requests/{request['id']}/approve",{},colab,403,'Colaborador no puede aprobar solicitudes')
approved=req('POST',f"/requests/{request['id']}/approve",{},tech,200,'Tecnología aprueba solicitud y asigna equipo')
req('POST',f"/requests/{request['id']}/approve",{},tech,400,'Solicitud no puede aprobarse dos veces')
req('POST',f"/loans/{approved['id']}/return",{'fechaDevolucion':date(datetime.datetime.now(datetime.timezone.utc)),'observacion':'Devolución de solicitud'},admin,200,'Devolver préstamo aprobado')
# Two simultaneous calls must not produce two active loans.
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 futures=[pool.submit(req,'POST','/loans',l,admin,[201,400,409]) for _ in range(2)]
 results=[f.result() for f in futures]
assert sum(1 for x in results if 'id' in x)==1;checks.append('Concurrencia: solo uno de dos préstamos simultáneos se registra');print('OK',checks[-1])
active=req('GET','/loans/active',token=admin,label='Consultar préstamos activos');assert sum(x['equipoId']==eid for x in active)==1
req('GET','/equipment',token=admin,label='Consultar inventario')
for route,label in [('dashboard','Dashboard operativo'),('loans-by-area','Reporte de préstamos por área'),('most-used-equipment','Reporte de equipos más utilizados')]:req('GET','/reports/'+route,token=admin,label=label)
movements=req('GET','/movements',token=admin,label='Historial de movimientos con auditoría');assert any(x['entidadId']==eid for x in movements)
req('DELETE','/users/'+uid,token=tech,expected=403,label='RN-09 solo administrador deshabilita')
user_session=login(u['correo'],'Clave#123')['token']
req('DELETE','/users/'+uid,token=admin,expected=204,label='Administrador deshabilita usuario')
req('GET','/equipment',token=user_session,expected=401,label='Sesión anterior revocada tras deshabilitar')
req('POST','/loans',{**l,'equipoId':req('POST','/equipment',{**e,'codigoPatrimonial':'NEW-'+tag},admin,201)['id']},admin,400,'Usuario deshabilitado no recibe préstamos')
print('\nTOTAL:',len(checks),'comprobaciones correctas')
from pathlib import Path
Path(__file__).with_name('test-results.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'persistentEquipmentId':eid},ensure_ascii=False,indent=2),encoding='utf-8')
