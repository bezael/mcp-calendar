/**
 * Tool para actualizar eventos en Google Calendar
 */

import { getCalendarClient, resolveCalendarId } from '../gcalClient.js';
import { validateRequired, validateISODate, parseGoogleError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { UpdateEventParams, EventResponse } from '../types/index.js';

/**
 * Actualiza parcialmente un evento existente
 * 
 * Primero obtiene el evento actual, luego mezcla los cambios
 * y actualiza en Google Calendar.
 * 
 * @param params - Parámetros con eventId y campos a actualizar
 * @returns El evento actualizado
 */
export async function updateEvent(params: UpdateEventParams): Promise<EventResponse> {
  logger.toolRequest('update_event', params as unknown as Record<string, unknown>);

  // Validar campo requerido
  validateRequired(params.eventId, 'eventId');

  // Validar formato de fechas si se proporcionan
  if (params.start) {
    validateISODate(params.start, 'start');
  }
  if (params.end) {
    validateISODate(params.end, 'end');
  }

  const calendarId = resolveCalendarId(params.calendarId);

  try {
    const calendar = await getCalendarClient();

    // Primero obtener el evento actual
    const currentEventResponse = await calendar.events.get({
      calendarId,
      eventId: params.eventId,
    });

    const currentEvent = currentEventResponse.data;

    // Preparar el timeZone a usar
    const timeZone = params.timeZone || currentEvent.start?.timeZone || 'Europe/Madrid';

    // Mezclar los cambios sobre el evento actual
    const updatedEvent = {
      ...currentEvent,
      summary: params.summary ?? currentEvent.summary,
      description: params.description ?? currentEvent.description,
      location: params.location ?? currentEvent.location,
      start: params.start ? {
        dateTime: params.start,
        timeZone,
      } : currentEvent.start,
      end: params.end ? {
        dateTime: params.end,
        timeZone,
      } : currentEvent.end,
      attendees: params.attendees 
        ? params.attendees.map(email => ({ email }))
        : currentEvent.attendees,
    };

    // Actualizar el evento
    const response = await calendar.events.update({
      calendarId,
      eventId: params.eventId,
      requestBody: updatedEvent,
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

    logger.toolResponse('update_event', { eventId: result.id });

    return result;
  } catch (error) {
    throw parseGoogleError(error);
  }
}

