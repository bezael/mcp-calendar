# 🚂 Despliegue en Railway

Esta guía te ayudará a desplegar el servidor MCP Calendar como API REST en Railway.

## 📋 Requisitos Previos

1. Cuenta en [Railway](https://railway.app/)
2. Repositorio Git (GitHub, GitLab, o Bitbucket)
3. Credenciales de Google Calendar configuradas

## 🚀 Pasos para Desplegar

### 1. Preparar el Repositorio

Asegúrate de que tu código esté en un repositorio Git y que todos los cambios estén commiteados:

```bash
git add .
git commit -m "feat: agregar servidor HTTP para Railway"
git push origin main
```

### 2. Crear Proyecto en Railway

1. Ve a [Railway Dashboard](https://railway.app/dashboard)
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"** (o tu proveedor Git)
4. Conecta tu repositorio y selecciona el proyecto `mcp-calendar`

### 3. Configurar Variables de Entorno

En el dashboard de Railway, ve a tu proyecto y luego a **Variables**:

#### Opción A: OAuth2 (Recomendado para uso personal)

Agrega las siguientes variables:

```
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REFRESH_TOKEN=tu-refresh-token
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
GOOGLE_CALENDAR_ID=primary
LOG_LEVEL=info
PORT=3000
```

#### Opción B: Service Account (Recomendado para producción)

Si prefieres usar Service Account, agrega:

```
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
GOOGLE_CALENDAR_ID=primary
LOG_LEVEL=info
PORT=3000
```

**Nota:** El `GOOGLE_SERVICE_ACCOUNT_KEY` debe ser el JSON completo en una sola línea o como variable de entorno multilínea en Railway.

### 4. Configurar el Build

Railway detectará automáticamente que es un proyecto Node.js y usará `railway.json` o `Procfile` para construir y ejecutar la aplicación.

El proceso será:
1. `npm install` - Instalar dependencias
2. `npm run build` - Compilar TypeScript
3. `npm start` - Iniciar el servidor HTTP

### 5. Verificar el Despliegue

Una vez desplegado, Railway te proporcionará una URL pública (ej: `https://tu-app.railway.app`).

Puedes verificar que funciona con:

```bash
curl https://tu-app.railway.app/health
```

Deberías recibir:
```json
{
  "status": "ok",
  "service": "mcp-gcal-api"
}
```

## 📡 Endpoints Disponibles

Una vez desplegado, tendrás acceso a los siguientes endpoints:

### Health Check
```
GET /health
```

### Crear Evento
```
POST /api/events
Content-Type: application/json

{
  "summary": "Reunión importante",
  "start": "2025-12-01T10:00:00+01:00",
  "end": "2025-12-01T11:00:00+01:00",
  "description": "Descripción opcional",
  "location": "Oficina",
  "attendees": ["usuario@example.com"]
}
```

### Obtener Evento
```
GET /api/events/:eventId?calendarId=primary
```

### Listar Eventos
```
GET /api/events?timeMin=2025-12-01T00:00:00Z&timeMax=2025-12-31T23:59:59Z&maxResults=50
```

### Actualizar Evento
```
PUT /api/events/:eventId
Content-Type: application/json

{
  "summary": "Nuevo título",
  "start": "2025-12-01T11:00:00+01:00"
}
```

### Eliminar Evento
```
DELETE /api/events/:eventId?calendarId=primary
```

## 🔧 Configuración Avanzada

### Dominio Personalizado

1. En Railway, ve a tu servicio
2. Click en **Settings** > **Domains**
3. Agrega tu dominio personalizado

### Variables de Entorno por Entorno

Railway permite tener diferentes variables de entorno para:
- **Production**: Variables de producción
- **Preview**: Variables para preview deployments (branches)

### Logs y Monitoreo

- **Logs en tiempo real**: Ve a tu servicio en Railway y click en **Deployments** > **View Logs**
- **Métricas**: Railway proporciona métricas básicas de CPU, memoria y red

## 🐛 Troubleshooting

### Error: "Cannot find module"

Asegúrate de que `package.json` tenga todas las dependencias necesarias y que el build se complete correctamente.

### Error: "Port already in use"

Railway asigna el puerto automáticamente a través de la variable `PORT`. No necesitas configurarlo manualmente.

### Error de Autenticación con Google

1. Verifica que todas las variables de entorno estén correctamente configuradas
2. Asegúrate de que el `refresh_token` no haya expirado
3. Si usas Service Account, verifica que el JSON esté completo y bien formateado

### El servidor no inicia

Revisa los logs en Railway:
1. Ve a tu servicio
2. Click en **Deployments**
3. Selecciona el deployment más reciente
4. Revisa los logs para ver el error específico

## 📝 Notas Importantes

- **Puerto**: Railway asigna el puerto automáticamente. Usa `process.env.PORT` (ya configurado en `server.ts`)
- **HTTPS**: Railway proporciona HTTPS automáticamente
- **Cold Starts**: El primer request después de inactividad puede tardar unos segundos
- **Límites**: Railway tiene límites en el plan gratuito. Revisa [Railway Pricing](https://railway.app/pricing)

## 🔄 Actualizar el Despliegue

Cada vez que hagas push a tu repositorio, Railway detectará los cambios y desplegará automáticamente una nueva versión.

Para desplegar manualmente:
1. Ve a tu servicio en Railway
2. Click en **Deployments**
3. Click en **Redeploy** en el deployment que quieras

## 📚 Recursos Adicionales

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Google Calendar API Docs](https://developers.google.com/calendar/api/v3/reference)

