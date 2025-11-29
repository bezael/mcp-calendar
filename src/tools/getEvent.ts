/**
 * Tool para obtener un evento específico de Google Calendar
 */

import { getCalendarClient, resolveCalendarId } from '../gcalClient.js';
import { validateRequired, parseGoogleError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { GetEventParams, EventResponse } from '../types/index.js';

/**
 * Obtiene un evento por su ID
 * 
 * @param params - Parámetros con el eventId y calendarId opcional
 * @returns El evento completo
 */
export async function getEvent(params: GetEventParams): Promise<EventResponse> {
  logger.toolRequest('get_event', params as unknown as Record<string, unknown>);

  // Validar campo requerido
  validateRequired(params.eventId, 'eventId');

  const calendarId = resolveCalendarId(params.calendarId);

  try {
    const calendar = await getCalendarClient();

    const response = await calendar.events.get({
      calendarId,
      eventId: params.eventId,
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

    logger.toolResponse('get_event', { eventId: result.id });

    return result;
  } catch (error) {
    throw parseGoogleError(error);
  }
}

