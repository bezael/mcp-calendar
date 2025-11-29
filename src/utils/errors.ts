/**
 * Utilidades para manejo de errores del MCP
 */

import type { ErrorType, MCPError } from '../types/index.js';

/**
 * Clase personalizada para errores del MCP
 */
export class MCPCalendarError extends Error {
  public readonly type: ErrorType;
  public readonly details?: Record<string, unknown>;

  constructor(type: ErrorType, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'MCPCalendarError';
    this.type = type;
    this.details = details;
  }

  /**
   * Convierte el error a formato MCPError para respuestas JSON
   */
  toMCPError(): MCPError {
    return {
      type: this.type,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * Crea un error de autenticación
 */
export function createAuthError(message: string, details?: Record<string, unknown>): MCPCalendarError {
  return new MCPCalendarError('auth_error', message, details);
}

/**
 * Crea un error de validación
 */
export function createValidationError(message: string, details?: Record<string, unknown>): MCPCalendarError {
  return new MCPCalendarError('validation_error', message, details);
}

/**
 * Crea un error de la API de Google
 */
export function createGoogleApiError(message: string, details?: Record<string, unknown>): MCPCalendarError {
  return new MCPCalendarError('google_api_error', message, details);
}

/**
 * Crea un error de recurso no encontrado
 */
export function createNotFoundError(message: string, details?: Record<string, unknown>): MCPCalendarError {
  return new MCPCalendarError('not_found_error', message, details);
}

/**
 * Parsea errores de Google API y los convierte en MCPCalendarError
 */
export function parseGoogleError(error: unknown): MCPCalendarError {
  if (error instanceof MCPCalendarError) {
    return error;
  }

  // Errores de Google API tienen una estructura específica
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    
    // Error con response de Google API
    if ('response' in err && typeof err.response === 'object' && err.response !== null) {
      const response = err.response as Record<string, unknown>;
      const status = response.status as number | undefined;
      const data = response.data as Record<string, unknown> | undefined;
      
      if (status === 401 || status === 403) {
        return createAuthError(
          'Error de autenticación con Google Calendar. Verifica tus credenciales.',
          { status, data }
        );
      }
      
      if (status === 404) {
        return createNotFoundError(
          'El recurso solicitado no existe en Google Calendar.',
          { status, data }
        );
      }
      
      const message = data?.error && typeof data.error === 'object' 
        ? (data.error as Record<string, unknown>).message as string || 'Error de Google API'
        : 'Error de Google API';
        
      return createGoogleApiError(message, { status, data });
    }
    
    // Error genérico con mensaje
    if ('message' in err && typeof err.message === 'string') {
      return createGoogleApiError(err.message);
    }
  }

  return new MCPCalendarError(
    'unknown_error',
    'Ha ocurrido un error desconocido',
    { originalError: String(error) }
  );
}

/**
 * Valida que una fecha ISO 8601 sea válida
 */
export function validateISODate(dateString: string, fieldName: string): void {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw createValidationError(
      `El campo '${fieldName}' debe ser una fecha válida en formato ISO 8601`,
      { field: fieldName, value: dateString }
    );
  }
}

/**
 * Valida que un campo requerido esté presente
 */
export function validateRequired(value: unknown, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw createValidationError(
      `El campo '${fieldName}' es requerido`,
      { field: fieldName }
    );
  }
}

