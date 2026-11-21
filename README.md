# TechAsset

Sistema web de gestión del inventario tecnológico, solicitudes, préstamos y devoluciones para el caso práctico N2, Unidad 3 de Construcción de Software.

**Autor:** Oyola Gutierrez Jerzeell Juniors.

## Funciones

- Portal público e inicio de sesión.
- Activación mediante cambio obligatorio de contraseña temporal.
- Acceso por roles: Administrador, Responsable de Tecnología y Colaborador.
- Inventario con búsqueda, categorías y estados.
- Solicitudes, aprobación, préstamo y devolución de equipos.
- Administración de usuarios, reportes, exportación CSV y movimientos de auditoría.
- Componentes reutilizables, ayuda contextual, navegación con teclado y preferencias de lectura.

## Estructura

```text
src/frontend/                  React + TypeScript + Vite
src/backend/Api/               API ASP.NET Core
src/backend/Application/       Servicios, reglas, interfaces y DTO
src/backend/Domain/            Entidades
src/backend/Infrastructure/    EF Core, PostgreSQL y migraciones
tests/                         Verificaciones de API e integridad de datos
```

## Ejecutar en VS Code

Requisitos: SDK .NET 10, Node.js con npm y PostgreSQL 16. Iniciar el servicio de PostgreSQL. Abrir la carpeta del repositorio en VS Code.

Primera terminal PowerShell, desde la raíz:

```powershell
$env:ConnectionStrings__Default = 'Host=localhost;Port=5432;Database=TechAssetDb;Username=postgres;Password=TU_CLAVE_LOCAL'
# Generar un secreto local: no guardarlo en el repositorio.
$env:Jwt__Key = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
$env:Jwt__Issuer = 'TechAssetIssuer'
cd src/backend/Api
dotnet run
```

Segunda terminal, desde la raíz:

```powershell
cd src/frontend
npm ci
npm run dev
```

Portal: http://127.0.0.1:3000 · API: http://127.0.0.1:5001 · Swagger: http://127.0.0.1:5001/swagger.

La API aplica las migraciones al iniciar. La cuenta PostgreSQL debe tener permisos para crear la base o esta debe existir previamente. Las migraciones versionadas definen claves, relaciones, índices y restricciones. No se incluye una copia de la base personal.

Alternativa: con las variables anteriores configuradas, ejecutar `./start.ps1` desde la raíz para iniciar ambos servicios.

## Cuentas iniciales en una base nueva

Antes de iniciar la API por primera vez, define tres contraseñas temporales propias en la misma terminal:

```powershell
$env:Seed__AdminPassword = Read-Host 'Contraseña temporal para el administrador' -MaskInput
$env:Seed__TechPassword = Read-Host 'Contraseña temporal para Tecnología' -MaskInput
$env:Seed__ColabPassword = Read-Host 'Contraseña temporal para el colaborador' -MaskInput
```

Los correos iniciales son `admin@techasset.com`, `tech@techasset.com` y `colab@techasset.com`. Los usuarios deben cambiar la contraseña al ingresar. Se requieren entre 8 y 128 caracteres, mayúscula, minúscula, número y símbolo. Se almacenan hashes PBKDF2. En una base existente se conservan sus cuentas y contraseñas. Para `-MaskInput` utiliza PowerShell 7; también puedes definir las variables mediante la configuración local de tu entorno, sin publicarlas.

## Docker (opcional)

```powershell
Copy-Item .env.example .env
# Editar .env: definir la contraseña PostgreSQL, el secreto JWT y las tres contraseñas iniciales propias.
docker compose up --build
```

Los puertos se publican únicamente en localhost. La imagen y los datos de PostgreSQL permanecen en un volumen local. El archivo `.env` se excluye de Git.

## Verificación

```powershell
dotnet build src/TechAsset.sln
cd src/frontend
npm run build
```

`tests/api_integration.py` contiene la suite de API. Ejecutarla solo contra una instancia con **base desechable**, nunca contra la base personal: crea registros y cambia las contraseñas semilla del entorno de ensayo. El script requiere esas claves en variables de entorno.

```powershell
# API de ensayo ya iniciada con su propia ConnectionStrings__Default, Jwt__Key y puerto 5002.
$env:TECHASSET_TEST_URL = 'http://127.0.0.1:5002/api'
# Definir TECHASSET_TEST_ADMIN_PASSWORD, TECHASSET_TEST_TECH_PASSWORD y
# TECHASSET_TEST_COLAB_PASSWORD con las claves semilla de la base de ensayo.
python tests/api_integration.py
```

`tests/database_constraints.sql` comprueba ocho restricciones mediante `BEGIN` y `ROLLBACK`. Requiere una base de ensayo poblada que contenga al menos un préstamo devuelto y una solicitud aprobada vinculada a un préstamo. Se puede ejecutar en SQL Shell (`psql`) con `\i 'ruta/al/repositorio/tests/database_constraints.sql'`.

`tests/test-results.json` conserva el registro previo de 76 comprobaciones correctas; no representa una ejecución automática al descargar el repositorio.

## Configuración de la copia publicada

El código publicado exige definir la conexión y el secreto JWT mediante variables de entorno, en lugar de incluir claves locales en el código. El proyecto original del Escritorio y el informe Word se conservan. Este repositorio publica el software; no despliega una aplicación accesible por Internet.
