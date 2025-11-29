# mcp-gcal

Servidor MCP (Model Context Protocol) para interactuar con Google Calendar. Permite a modelos de lenguaje crear, obtener, listar, actualizar y eliminar eventos de calendario.

## 🚀 Características

- **Crear eventos**: Crea eventos con título, descripción, ubicación, asistentes y más.
- **Obtener eventos**: Recupera información detallada de un evento por su ID.
- **Listar eventos**: Lista eventos en un rango de fechas con filtros de búsqueda.
- **Actualizar eventos**: Modifica parcialmente eventos existentes.
- **Eliminar eventos**: Elimina eventos del calendario.

## 📋 Requisitos

- Node.js 20 o superior
- Una cuenta de Google con acceso a Google Calendar
- Credenciales OAuth2 de Google Cloud Console

## ⚙️ Configuración

### 1. Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services** > **Library**
4. Busca y habilita **Google Calendar API**

### 2. Configurar credenciales OAuth2

1. Ve a **APIs & Services** > **Credentials**
2. Click en **Create Credentials** > **OAuth client ID**
3. Selecciona **Desktop app** o **Web application**
4. Configura el redirect URI: `http://localhost:3000/oauth2callback`
5. Guarda el `Client ID` y `Client Secret`

### 3. Obtener el Refresh Token

Para obtener el `refresh_token`, puedes usar el [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) de Google:

1. Ve a https://developers.google.com/oauthplayground/
2. Click en el engranaje (⚙️) arriba a la derecha
3. Marca **"Use your own OAuth credentials"**
4. Introduce tu `Client ID` y `Client Secret`
5. En la columna izquierda, busca **Google Calendar API v3**
6. Selecciona el scope: `https://www.googleapis.com/auth/calendar`
7. Click en **Authorize APIs** y autoriza tu cuenta
8. Click en **Exchange authorization code for tokens**
9. Copia el `refresh_token` del resultado

### 4. Configurar variables de entorno

Copia el archivo de ejemplo y rellena tus credenciales:

```bash
cp env.example .env
```

Edita `.env` con tus valores:

```env
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
GOOGLE_REFRESH_TOKEN=1//0xxxxxxxxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
GOOGLE_CALENDAR_ID=primary
LOG_LEVEL=info
```

## 🔧 Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Ejecutar el servidor
npm start
```

## 🚂 Despliegue en Railway

Este proyecto puede desplegarse como API REST en Railway. Consulta la [guía completa de despliegue](RAILWAY_DEPLOY.md) para instrucciones detalladas.

**Resumen rápido:**
1. Conecta tu repositorio a Railway
2. Configura las variables de entorno (Google OAuth2 o Service Account)
3. Railway construirá y desplegará automáticamente
4. Accede a tu API en la URL proporcionada por Railway

**Endpoints disponibles:**
- `GET /health` - Health check
- `POST /api/events` - Crear evento
- `GET /api/events/:eventId` - Obtener evento
- `GET /api/events` - Listar eventos
- `PUT /api/events/:eventId` - Actualizar evento
- `DELETE /api/events/:eventId` - Eliminar evento

## 🔌 Integración con Cursor/Claude

Añade el servidor a tu configuración de MCP. En Cursor, añade al archivo `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "google-calendar": {
      "command": "node",
      "args": ["ruta/a/mcp-gcal/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "tu-client-id",
        "GOOGLE_CLIENT_SECRET": "tu-client-secret",
        "GOOGLE_REFRESH_TOKEN": "tu-refresh-token",
        "GOOGLE_REDIRECT_URI": "http://localhost:3000/oauth2callback",
        "GOOGLE_CALENDAR_ID": "primary"
      }
    }
  }
}
```

## 🛠️ Tools Disponibles

### `create_event`

Crea un nuevo evento en el calendario.

**Parámetros:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `summary` | string | ✅ | Título del evento |
| `start` | string | ✅ | Fecha/hora inicio (ISO 8601) |
| `end` | string | ✅ | Fecha/hora fin (ISO 8601) |
| `description` | string | ❌ | Descripción del evento |
| `location` | string | ❌ | Ubicación |
| `calendarId` | string | ❌ | ID del calendario (default: primary) |
| `timeZone` | string | ❌ | Zona horaria (default: Europe/Madrid) |
| `attendees` | string[] | ❌ | Emails de asistentes |

### `get_event`

Obtiene un evento por su ID.

**Parámetros:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `eventId` | string | ✅ | ID del evento |
| `calendarId` | string | ❌ | ID del calendario |

### `list_events`

Lista eventos en un rango de fechas.

**Parámetros:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `timeMin` | string | ✅ | Fecha/hora mínima (ISO 8601) |
| `timeMax` | string | ✅ | Fecha/hora máxima (ISO 8601) |
| `maxResults` | number | ❌ | Máximo de resultados (default: 50) |
| `calendarId` | string | ❌ | ID del calendario |
| `q` | string | ❌ | Texto de búsqueda |

### `update_event`

Actualiza parcialmente un evento existente.

**Parámetros:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `eventId` | string | ✅ | ID del evento |
| `calendarId` | string | ❌ | ID del calendario |
| `summary` | string | ❌ | Nuevo título |
| `description` | string | ❌ | Nueva descripción |
| `location` | string | ❌ | Nueva ubicación |
| `start` | string | ❌ | Nueva fecha/hora inicio |
| `end` | string | ❌ | Nueva fecha/hora fin |
| `timeZone` | string | ❌ | Nueva zona horaria |
| `attendees` | string[] | ❌ | Nuevos asistentes |

### `delete_event`

Elimina un evento del calendario.

**Parámetros:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `eventId` | string | ✅ | ID del evento |
| `calendarId` | string | ❌ | ID del calendario |

## 💬 Ejemplos de Uso

Estos son ejemplos de prompts que puedes usar con un modelo de lenguaje conectado a este MCP:

### Crear un evento

> "Crea un evento de 30 minutos mañana a las 10:00 llamado 'Preparar presentación' en mi calendario principal."

### Listar eventos

> "Lista los eventos de la próxima semana que contengan la palabra 'reunión'."

### Actualizar un evento

> "Actualiza el evento con id 'abc123xyz' para moverlo a las 11:00."

### Eliminar un evento

> "Elimina el evento con id 'abc123xyz'."

## 📦 Estructura del Proyecto

```
mcp-gcal/
├── src/
│   ├── index.ts          # Punto de entrada del MCP
│   ├── gcalClient.ts     # Cliente OAuth2 de Google Calendar
│   ├── tools/
│   │   ├── createEvent.ts
│   │   ├── getEvent.ts
│   │   ├── listEvents.ts
│   │   ├── updateEvent.ts
│   │   ├── deleteEvent.ts
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts      # Tipos TypeScript compartidos
│   └── utils/
│       ├── errors.ts     # Manejo de errores
│       └── logger.ts     # Logging
├── dist/                 # Código compilado
├── manifest.json         # Definición del MCP
├── package.json
├── tsconfig.json
├── env.example
└── README.md
```

## 🐛 Manejo de Errores

Los errores se devuelven en formato JSON estructurado:

```json
{
  "type": "validation_error",
  "message": "El campo 'summary' es requerido",
  "details": {
    "field": "summary"
  }
}
```

**Tipos de error:**
- `auth_error`: Problemas de autenticación con Google
- `validation_error`: Parámetros inválidos o faltantes
- `google_api_error`: Errores de la API de Google Calendar
- `not_found_error`: Recurso no encontrado
- `unknown_error`: Errores no categorizados

## 📝 Licencia

MIT

