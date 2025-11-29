/**
 * Tool para listar eventos de Google Calendar por rango de fechas
 */

import { getCalendarClient, resolveCalendarId } from '../gcalClient.js';
import { validateRequired, validateISODate, parseGoogleError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { ListEventsParams, EventResponse } from '../types/index.js';

const DEFAULT_MAX_RESULTS = 50;

/**
 * Lista eventos en un rango de fechas
 * 
 * @param params - Parámetros de búsqueda
 * @returns Array de eventos básicos
 */
export async function listEvents(params: ListEventsParams): Promise<EventResponse[]> {
  logger.toolRequest('list_events', params as unknown as Record<string, unknown>);

  // Validar campos requeridos
  validateRequired(params.timeMin, 'timeMin');
  validateRequired(params.timeMax, 'timeMax');
  
  // Validar formato de fechas
  validateISODate(params.timeMin, 'timeMin');
  validateISODate(params.timeMax, 'timeMax');

  const calendarId = resolveCalendarId(params.calendarId);
  const maxResults = params.maxResults || DEFAULT_MAX_RESULTS;

  try {
    const calendar = await getCalendarClient();

    const response = await calendar.events.list({
      calendarId,
      timeMin: params.timeMin,
      timeMax: params.timeMax,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
      q: params.q,
    });

    const events = response.data.items || [];

    const result: EventResponse[] = events.map(event => ({
      id: event.id!,
      summary: event.summary || undefined,
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
    }));

    logger.toolResponse('list_events', { count: result.length });

    return result;
  } catch (error) {
    throw parseGoogleError(error);
  }
}

