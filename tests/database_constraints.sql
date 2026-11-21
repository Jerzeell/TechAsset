-- Run only against a populated disposable validation database. All statements roll back.
BEGIN;
DO $$
BEGIN
 BEGIN
  UPDATE "Users" SET "SessionVersion"=-1 WHERE "Correo"='admin@techasset.com';
  RAISE EXCEPTION 'No se aplicó CHECK de versión de sesión';
 EXCEPTION WHEN check_violation THEN RAISE NOTICE 'OK: versión de sesión no negativa'; END;
 BEGIN
  UPDATE "Users" SET "MustChangePassword"=false, "PasswordChangedAt"=NULL WHERE "Correo"='admin@techasset.com';
  RAISE EXCEPTION 'No se aplicó CHECK de activación de contraseña';
 EXCEPTION WHEN check_violation THEN RAISE NOTICE 'OK: cuenta activada exige fecha de cambio de contraseña'; END;
 BEGIN
  UPDATE "Equipments" SET "Estado"='EstadoInventado' WHERE "CodigoPatrimonial"='PAT-001';
  RAISE EXCEPTION 'No se aplicó CHECK de estado';
 EXCEPTION WHEN check_violation THEN RAISE NOTICE 'OK: CHECK estado de equipo'; END;
 BEGIN
  UPDATE "Users" SET "Correo"='ADMIN@TECHASSET.COM' WHERE "Correo"='admin@techasset.com';
  RAISE EXCEPTION 'No se aplicó normalización de correo';
 EXCEPTION WHEN check_violation THEN RAISE NOTICE 'OK: correo canónico y único'; END;
 BEGIN
  UPDATE "Loans" SET "ResponsableId"=gen_random_uuid() WHERE "Id"=(SELECT "Id" FROM "Loans" LIMIT 1);
  RAISE EXCEPTION 'No se aplicó FK de responsable';
 EXCEPTION WHEN foreign_key_violation THEN RAISE NOTICE 'OK: FK de responsable del préstamo'; END;
 BEGIN
  UPDATE "Loans" SET "ObservacionDevolucion"=NULL WHERE "Id"=(SELECT "Id" FROM "Loans" WHERE "FechaDevolucion" IS NOT NULL LIMIT 1);
  RAISE EXCEPTION 'No se aplicó CHECK de devolución';
 EXCEPTION WHEN check_violation THEN RAISE NOTICE 'OK: observaciones obligatorias al devolver'; END;
 BEGIN
  UPDATE "LoanRequests" SET "PrestamoId"=NULL WHERE "Id"=(SELECT "Id" FROM "LoanRequests" WHERE "Estado"='Aprobada' LIMIT 1);
  RAISE EXCEPTION 'No se aplicó CHECK de aprobación';
 EXCEPTION WHEN check_violation THEN RAISE NOTICE 'OK: aprobación vinculada a préstamo'; END;
 BEGIN
  UPDATE "Loans" SET "FechaDevolucion"="FechaPrestamo" WHERE "Id"=(SELECT "Id" FROM "Loans" WHERE "FechaDevolucion" IS NOT NULL LIMIT 1);
  RAISE EXCEPTION 'No se aplicó CHECK de fechas';
 EXCEPTION WHEN check_violation THEN RAISE NOTICE 'OK: devolución posterior al préstamo'; END;
END $$;
ROLLBACK;
