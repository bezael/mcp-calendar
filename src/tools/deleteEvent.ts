/**
 * Tool para eliminar eventos de Google Calendar
 */

import { getCalendarClient, resolveCalendarId } from '../gcalClient.js';
import { validateRequired, parseGoogleError, createNotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { DeleteEventParams, DeleteResponse } from '../types/index.js';

/**
 * Elimina un evento del calendario
 * 
 * @param params - Parámetros con eventId y calendarId opcional
 * @returns Objeto con success: true si se eliminó correctamente
 */
export async function deleteEvent(params: DeleteEventParams): Promise<DeleteResponse> {
  logger.toolRequest('delete_event', params as unknown as Record<string, unknown>);

  // Validar campo requerido
  validateRequired(params.eventId, 'eventId');

  const calendarId = resolveCalendarId(params.calendarId);

  try {
    const calendar = await getCalendarClient();

    // Primero verificar que el evento existe
    try {
      await calendar.events.get({
        calendarId,
        eventId: params.eventId,
      });
    } catch (getError) {
      const err = getError as { response?: { status?: number } };
      if (err.response?.status === 404) {
        throw createNotFoundError(
          `El evento con id '${params.eventId}' no existe en el calendario`,
          { eventId: params.eventId, calendarId }
        );
      }
      throw getError;
    }

    // Eliminar el evento
    await calendar.events.delete({
      calendarId,
      eventId: params.eventId,
      sendUpdates: 'all',
    });

    const result: DeleteResponse = {
      success: true,
      message: `Evento '${params.eventId}' eliminado correctamente`,
    };

    logger.toolResponse('delete_event', { eventId: params.eventId, success: true });

    return result;
  } catch (error) {
    throw parseGoogleError(error);
  }
}

