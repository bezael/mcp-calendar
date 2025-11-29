#!/usr/bin/env node
/**
 * MCP Server para Google Calendar
 * 
 * Permite crear, obtener, listar, actualizar y eliminar eventos
 * de Google Calendar desde un modelo de lenguaje.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import 'dotenv/config';

import { createEvent } from './tools/createEvent.js';
import { getEvent } from './tools/getEvent.js';
import { listEvents } from './tools/listEvents.js';
import { updateEvent } from './tools/updateEvent.js';
import { deleteEvent } from './tools/deleteEvent.js';
import { MCPCalendarError } from './utils/errors.js';
import { logger } from './utils/logger.js';

/**
 * Formatea un resultado para la respuesta MCP
 */
function formatResult(result: unknown): { content: Array<{ type: 'text'; text: string }> } {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}

/**
 * Formatea un error para la respuesta MCP
 */
function formatError(error: unknown): { content: Array<{ type: 'text'; text: string }>; isError: true } {
  if (error instanceof MCPCalendarError) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(error.toMCPError(), null, 2)
      }],
      isError: true
    };
  }
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        type: 'unknown_error',
        message: error instanceof Error ? error.message : String(error)
      }, null, 2)
    }],
    isError: true
  };
}

/**
 * Inicializa y ejecuta el servidor MCP
 */
async function main(): Promise<void> {
  logger.info('Iniciando servidor MCP para Google Calendar...');

  const server = new McpServer({
    name: 'mcp-gcal',
    version: '0.1.0'
  });

  // === Tool: create_event ===
  server.registerTool(
    'create_event',
    {
      title: 'Create Event',
      description: 'Crea un nuevo evento en Google Calendar',
      inputSchema: {
        summary: z.string().describe('Título del evento (requerido)'),
        description: z.string().optional().describe('Descripción del evento'),
        location: z.string().optional().describe('Ubicación del evento'),
        start: z.string().describe('Fecha/hora de inicio en formato ISO 8601 (ej: 2025-11-30T10:00:00+01:00)'),
        end: z.string().describe('Fecha/hora de fin en formato ISO 8601'),
        calendarId: z.string().optional().describe('ID del calendario (por defecto: primary o GOOGLE_CALENDAR_ID)'),
        timeZone: z.string().optional().describe('Zona horaria (por defecto: Europe/Madrid)'),
        attendees: z.array(z.string()).optional().describe('Lista de emails de los asistentes')
      }
    },
    async (params) => {
      try {
        const result = await createEvent({
          summary: params.summary,
          description: params.description,
          location: params.location,
          start: params.start,
          end: params.end,
          calendarId: params.calendarId,
          timeZone: params.timeZone,
          attendees: params.attendees
        });
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // === Tool: get_event ===
  server.registerTool(
    'get_event',
    {
      title: 'Get Event',
      description: 'Obtiene un evento por su ID',
      inputSchema: {
        eventId: z.string().describe('ID del evento a obtener (requerido)'),
        calendarId: z.string().optional().describe('ID del calendario (por defecto: primary)')
      }
    },
    async (params) => {
      try {
        const result = await getEvent({
          eventId: params.eventId,
          calendarId: params.calendarId
        });
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // === Tool: list_events ===
  server.registerTool(
    'list_events',
    {
      title: 'List Events',
      description: 'Lista eventos en un rango de fechas',
      inputSchema: {
        timeMin: z.string().describe('Fecha/hora mínima en formato ISO 8601 (requerido)'),
        timeMax: z.string().describe('Fecha/hora máxima en formato ISO 8601 (requerido)'),
        maxResults: z.number().optional().describe('Número máximo de resultados (por defecto: 50)'),
        calendarId: z.string().optional().describe('ID del calendario (por defecto: primary)'),
        q: z.string().optional().describe('Texto de búsqueda para filtrar eventos')
      }
    },
    async (params) => {
      try {
        const result = await listEvents({
          timeMin: params.timeMin,
          timeMax: params.timeMax,
          maxResults: params.maxResults,
          calendarId: params.calendarId,
          q: params.q
        });
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // === Tool: update_event ===
  server.registerTool(
    'update_event',
    {
      title: 'Update Event',
      description: 'Actualiza parcialmente un evento existente',
      inputSchema: {
        eventId: z.string().describe('ID del evento a actualizar (requerido)'),
        calendarId: z.string().optional().describe('ID del calendario (por defecto: primary)'),
        summary: z.string().optional().describe('Nuevo título del evento'),
        description: z.string().optional().describe('Nueva descripción'),
        location: z.string().optional().describe('Nueva ubicación'),
        start: z.string().optional().describe('Nueva fecha/hora de inicio en formato ISO 8601'),
        end: z.string().optional().describe('Nueva fecha/hora de fin en formato ISO 8601'),
        timeZone: z.string().optional().describe('Nueva zona horaria'),
        attendees: z.array(z.string()).optional().describe('Nueva lista de emails de asistentes')
      }
    },
    async (params) => {
      try {
        const result = await updateEvent({
          eventId: params.eventId,
          calendarId: params.calendarId,
          summary: params.summary,
          description: params.description,
          location: params.location,
          start: params.start,
          end: params.end,
          timeZone: params.timeZone,
          attendees: params.attendees
        });
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // === Tool: delete_event ===
  server.registerTool(
    'delete_event',
    {
      title: 'Delete Event',
      description: 'Elimina un evento del calendario',
      inputSchema: {
        eventId: z.string().describe('ID del evento a eliminar (requerido)'),
        calendarId: z.string().optional().describe('ID del calendario (por defecto: primary)')
      }
    },
    async (params) => {
      try {
        const result = await deleteEvent({
          eventId: params.eventId,
          calendarId: params.calendarId
        });
        return formatResult(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // Conectar usando transporte stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('Servidor MCP conectado y listo para recibir requests');
}

// Ejecutar el servidor
main().catch((error) => {
  logger.error('Error fatal al iniciar el servidor MCP', { error: String(error) });
  process.exit(1);
});

