/**
 * Tipos compartidos para el MCP de Google Calendar
 */

/** Tipos de error para respuestas estructuradas */
export type ErrorType = 'auth_error' | 'validation_error' | 'google_api_error' | 'not_found_error' | 'unknown_error';

/** Estructura de error estándar */
export interface MCPError {
  type: ErrorType;
  message: string;
  details?: Record<string, unknown>;
}

/** Información de un asistente/attendee */
export interface Attendee {
  email: string;
  responseStatus?: string;
  displayName?: string;
}

/** Parámetros para crear un evento */
export interface CreateEventParams {
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  calendarId?: string;
  timeZone?: string;
  attendees?: string[];
}

/** Parámetros para obtener un evento */
export interface GetEventParams {
  eventId: string;
  calendarId?: string;
}

/** Parámetros para listar eventos */
export interface ListEventsParams {
  timeMin: string;
  timeMax: string;
  maxResults?: number;
  calendarId?: string;
  q?: string;
}

/** Parámetros para actualizar un evento */
export interface UpdateEventParams {
  eventId: string;
  calendarId?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: string;
  end?: string;
  timeZone?: string;
  attendees?: string[];
}

/** Parámetros para eliminar un evento */
export interface DeleteEventParams {
  eventId: string;
  calendarId?: string;
}

/** Respuesta básica de un evento */
export interface EventResponse {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status?: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
  attendees?: Attendee[];
}

/** Respuesta de eliminación exitosa */
export interface DeleteResponse {
  success: boolean;
  message: string;
}

/** Configuración del cliente de Google Calendar */
export interface GCalConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  redirectUri: string;
  calendarId: string;
}

