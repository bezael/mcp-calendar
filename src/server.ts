#!/usr/bin/env node
/**
 * Servidor HTTP REST API para Google Calendar
 * Expone los endpoints del MCP como API REST para despliegue en Railway
 */

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

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'mcp-gcal-api' });
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
app.listen(PORT, HOST, () => {
  logger.info(`Servidor HTTP iniciado en ${HOST}:${PORT}`);
  logger.info(`Health check disponible en /health`);
});

