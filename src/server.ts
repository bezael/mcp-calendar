#!/usr/bin/env node
/**
 * Servidor HTTP REST API para Google Calendar
 * Expone los endpoints del MCP como API REST para despliegue en Railway
 */

// Mensaje de inicio inmediato para diagnóstico
console.log('🚀 Iniciando servidor MCP Calendar API...');
console.log(`📦 Node version: ${process.version}`);
console.log(`📁 Working directory: ${process.cwd()}`);

import cors from 'cors';
import 'dotenv/config';
import express, { type Express, type Request, type Response } from 'express';

import { createEvent } from './tools/createEvent.js';
import { deleteEvent } from './tools/deleteEvent.js';
import { getEvent } from './tools/getEvent.js';
import { listEvents } from './tools/listEvents.js';
import { updateEvent } from './tools/updateEvent.js';
import { MCPCalendarError } from './utils/errors.js';
import { logger } from './utils/logger.js';

const app: Express = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    service: 'mcp-gcal-api',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      createEvent: 'POST /api/events',
      getEvent: 'GET /api/events/:eventId',
      listEvents: 'GET /api/events',
      updateEvent: 'PUT /api/events/:eventId',
      deleteEvent: 'DELETE /api/events/:eventId'
    }
  });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'mcp-gcal-api', timestamp: new Date().toISOString() });
});

// POST /api/events - Crear evento
app.post('/api/events', async (req: Request, res: Response) => {
  try {
    const { summary, description, location, start, end, calendarId, timeZone, attendees } = req.body;

    if (!summary || !start || !end) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Los campos summary, start y end son requeridos'
      });
    }

    const result = await createEvent({
      summary,
      description,
      location,
      start,
      end,
      calendarId,
      timeZone,
      attendees
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof MCPCalendarError) {
      const mcpError = error.toMCPError();
      res.status(mcpError.type === 'auth_error' ? 401 : 400).json(mcpError);
    } else {
      logger.error('Error al crear evento', { error: String(error) });
      res.status(500).json({
        error: 'unknown_error',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// GET /api/events/:eventId - Obtener evento
app.get('/api/events/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { calendarId } = req.query;

    const result = await getEvent({
      eventId,
      calendarId: calendarId as string | undefined
    });

    res.json(result);
  } catch (error) {
    if (error instanceof MCPCalendarError) {
      const mcpError = error.toMCPError();
      const statusCode = mcpError.type === 'not_found_error' ? 404 :
                        mcpError.type === 'auth_error' ? 401 : 400;
      res.status(statusCode).json(mcpError);
    } else {
      logger.error('Error al obtener evento', { error: String(error) });
      res.status(500).json({
        error: 'unknown_error',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// GET /api/events - Listar eventos
app.get('/api/events', async (req: Request, res: Response) => {
  try {
    const { timeMin, timeMax, maxResults, calendarId, q } = req.query;

    if (!timeMin || !timeMax) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Los parámetros timeMin y timeMax son requeridos'
      });
    }

    const result = await listEvents({
      timeMin: timeMin as string,
      timeMax: timeMax as string,
      maxResults: maxResults ? Number(maxResults) : undefined,
      calendarId: calendarId as string | undefined,
      q: q as string | undefined
    });

    res.json(result);
  } catch (error) {
    if (error instanceof MCPCalendarError) {
      const mcpError = error.toMCPError();
      res.status(mcpError.type === 'auth_error' ? 401 : 400).json(mcpError);
    } else {
      logger.error('Error al listar eventos', { error: String(error) });
      res.status(500).json({
        error: 'unknown_error',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// PUT /api/events/:eventId - Actualizar evento
app.put('/api/events/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { summary, description, location, start, end, calendarId, timeZone, attendees } = req.body;

    const result = await updateEvent({
      eventId,
      calendarId,
      summary,
      description,
      location,
      start,
      end,
      timeZone,
      attendees
    });

    res.json(result);
  } catch (error) {
    if (error instanceof MCPCalendarError) {
      const mcpError = error.toMCPError();
      const statusCode = mcpError.type === 'not_found_error' ? 404 :
                        mcpError.type === 'auth_error' ? 401 : 400;
      res.status(statusCode).json(mcpError);
    } else {
      logger.error('Error al actualizar evento', { error: String(error) });
      res.status(500).json({
        error: 'unknown_error',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// DELETE /api/events/:eventId - Eliminar evento
app.delete('/api/events/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { calendarId } = req.query;

    await deleteEvent({
      eventId,
      calendarId: calendarId as string | undefined
    });

    res.status(204).send();
  } catch (error) {
    if (error instanceof MCPCalendarError) {
      const mcpError = error.toMCPError();
      const statusCode = mcpError.type === 'not_found_error' ? 404 :
                        mcpError.type === 'auth_error' ? 401 : 400;
      res.status(statusCode).json(mcpError);
    } else {
      logger.error('Error al eliminar evento', { error: String(error) });
      res.status(500).json({
        error: 'unknown_error',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
});

// Manejo de rutas no encontradas
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'not_found',
    message: 'Ruta no encontrada'
  });
});

// Manejo de errores global
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  logger.error('Error no manejado', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'internal_server_error',
    message: 'Error interno del servidor'
  });
});

// Iniciar servidor
// Escuchar en 0.0.0.0 para que Railway pueda enrutar el tráfico
const HOST = process.env.HOST || '0.0.0.0';

// Validar que el puerto sea válido
if (isNaN(PORT) || PORT <= 0 || PORT > 65535) {
  logger.error('Puerto inválido', { port: PORT });
  console.error(`❌ Puerto inválido: ${PORT}`);
  process.exit(1);
}

logger.info('Iniciando servidor HTTP...', { host: HOST, port: PORT });
console.log(`🚀 Iniciando servidor en ${HOST}:${PORT}...`);

let server: ReturnType<typeof app.listen>;

try {
  server = app.listen(PORT, HOST, () => {
    logger.info(`Servidor HTTP iniciado exitosamente`, { host: HOST, port: PORT });
    logger.info(`Health check disponible en /health`);
    console.log(`✅ Servidor escuchando en http://${HOST}:${PORT}`);
    console.log(`✅ Health check: http://${HOST}:${PORT}/health`);
  });
} catch (error) {
  logger.error('Error al crear el servidor', { error: error instanceof Error ? error.message : String(error) });
  console.error('❌ Error al crear el servidor:', error);
  process.exit(1);
}

// Manejo de errores del servidor
server.on('error', (error: NodeJS.ErrnoException) => {
  logger.error('Error al iniciar el servidor', { error: error.message, code: error.code });
  console.error('❌ Error al iniciar el servidor:', error.message);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`⚠️  El puerto ${PORT} ya está en uso`);
  }
  
  process.exit(1);
});

// Manejo de cierre graceful
server.on('close', () => {
  logger.info('Servidor cerrado');
  console.log('👋 Servidor cerrado');
});

// Manejo de errores no capturados
process.on('uncaughtException', (error: Error) => {
  logger.error('Excepción no capturada', { error: error.message, stack: error.stack });
  console.error('❌ Excepción no capturada:', error);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Promesa rechazada no manejada', { reason: String(reason) });
  console.error('❌ Promesa rechazada no manejada:', reason);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Manejo de señales para cierre graceful (importante para Railway)
process.on('SIGTERM', () => {
  logger.info('Recibida señal SIGTERM, cerrando servidor...');
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  if (server) {
    server.close(() => {
      logger.info('Servidor cerrado correctamente');
      console.log('✅ Servidor cerrado correctamente');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  logger.info('Recibida señal SIGINT, cerrando servidor...');
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  if (server) {
    server.close(() => {
      logger.info('Servidor cerrado correctamente');
      console.log('✅ Servidor cerrado correctamente');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

