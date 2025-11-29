/**
 * Tool para crear eventos en Google Calendar
 */

import { getCalendarClient, resolveCalendarId } from '../gcalClient.js';
import { validateRequired, validateISODate, parseGoogleError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { CreateEventParams, EventResponse } from '../types/index.js';

const DEFAULT_TIMEZONE = 'Europe/Madrid';

/**
 * Crea un nuevo evento en Google Calendar
 * 
 * @param params - Parámetros del evento
 * @returns El evento creado con sus datos básicos
 */
export async function createEvent(params: CreateEventParams): Promise<EventResponse> {
  logger.toolRequest('create_event', params as unknown as Record<string, unknown>);

  // Validar campos requeridos
  validateRequired(params.summary, 'summary');
  validateRequired(params.start, 'start');
  validateRequired(params.end, 'end');
  
  // Validar formato de fechas
  validateISODate(params.start, 'start');
  validateISODate(params.end, 'end');

  const calendarId = resolveCalendarId(params.calendarId);
  const timeZone = params.timeZone || DEFAULT_TIMEZONE;

  try {
    const calendar = await getCalendarClient();

    // Construir el objeto de evento para Google Calendar
    const eventBody = {
      summary: params.summary,
      description: params.description,
      location: params.location,
      start: {
        dateTime: params.start,
        timeZone,
      },
      end: {
        dateTime: params.end,
        timeZone,
      },
      attendees: params.attendees?.map(email => ({ email })),
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: eventBody,
      sendUpdates: params.attendees?.length ? 'all' : 'none',
    });

    const event = response.data;

    const result: EventResponse = {
      id: event.id!,
      summary: event.summary || undefined,
      description: event.description || undefined,
      location: event.location || undefined,
      start: event.start ? {
        dateTime: event.start.dateTime || undefined,
        date: event.start.date || undefined,
        timeZone: event.start.timeZone || undefined,
      } : undefined,
      end: event.end ? {
        dateTime: event.end.dateTime || undefined,
        date: event.end.date || undefined,
        timeZone: event.end.timeZone || undefined,
      } : undefined,
      status: event.status || undefined,
      htmlLink: event.htmlLink || undefined,
      created: event.created || undefined,
      updated: event.updated || undefined,
      attendees: event.attendees?.map(a => ({
        email: a.email!,
        responseStatus: a.responseStatus || undefined,
        displayName: a.displayName || undefined,
      })),
    };

    logger.toolResponse('create_event', { eventId: result.id });

    return result;
  } catch (error) {
    throw parseGoogleError(error);
  }
}

