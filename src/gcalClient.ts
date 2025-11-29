/**
 * Cliente de Google Calendar con autenticación OAuth2 o Service Account
 */

import * as fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import { calendar_v3, google } from 'googleapis';
import { createAuthError } from './utils/errors.js';
import { logger } from './utils/logger.js';

let calendarClient: calendar_v3.Calendar | null = null;
let defaultCalendarId = 'primary';

/**
 * Detecta el modo de autenticación basado en las variables de entorno
 */
function getAuthMode(): 'oauth2' | 'service_account' {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return 'service_account';
  }
  return 'oauth2';
}

/**
 * Crea cliente con Service Account
 */
async function createServiceAccountClient(): Promise<calendar_v3.Calendar> {
  let credentials: Record<string, unknown>;
  
  // Opción 1: Archivo JSON de credenciales
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE) {
    const keyFilePath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
    
    if (!fs.existsSync(keyFilePath)) {
      throw createAuthError(
        `No se encontró el archivo de Service Account: ${keyFilePath}`,
        { keyFilePath }
      );
    }
    
    const keyFileContent = fs.readFileSync(keyFilePath, 'utf-8');
    credentials = JSON.parse(keyFileContent);
    logger.info('Usando Service Account desde archivo', { keyFilePath });
  }
  // Opción 2: JSON en variable de entorno
  else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    logger.info('Usando Service Account desde variable de entorno');
  }
  else {
    throw createAuthError('No se encontraron credenciales de Service Account');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const authClient = await auth.getClient();
  
  return google.calendar({ version: 'v3', auth: authClient as OAuth2Client });
}

/**
 * Crea cliente con OAuth2
 */
async function createOAuth2Client(): Promise<calendar_v3.Calendar> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';

  // Validar variables requeridas
  const missingVars: string[] = [];
  
  if (!clientId) missingVars.push('GOOGLE_CLIENT_ID');
  if (!clientSecret) missingVars.push('GOOGLE_CLIENT_SECRET');
  if (!refreshToken) missingVars.push('GOOGLE_REFRESH_TOKEN');

  if (missingVars.length > 0) {
    throw createAuthError(
      `Faltan variables de entorno requeridas: ${missingVars.join(', ')}`,
      { missingVars }
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  // Verificar que podemos obtener un access token
  try {
    const tokenResponse = await oauth2Client.getAccessToken();
    if (!tokenResponse.token) {
      throw createAuthError('No se pudo obtener el access token');
    }
    logger.info('Access token obtenido correctamente (OAuth2)');
  } catch (error) {
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      throw createAuthError(
        'El refresh token es inválido o ha expirado. Genera uno nuevo.',
        { originalError: error.message }
      );
    }
    throw error;
  }

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Inicializa y devuelve el cliente de Google Calendar
 * Detecta automáticamente si usar OAuth2 o Service Account
 */
export async function getCalendarClient(): Promise<calendar_v3.Calendar> {
  if (calendarClient) {
    return calendarClient;
  }

  defaultCalendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  
  const authMode = getAuthMode();
  logger.info(`Modo de autenticación: ${authMode}`);

  if (authMode === 'service_account') {
    calendarClient = await createServiceAccountClient();
  } else {
    calendarClient = await createOAuth2Client();
  }
  
  return calendarClient;
}

/**
 * Obtiene el ID del calendario por defecto
 */
export function getDefaultCalendarId(): string {
  return defaultCalendarId;
}

/**
 * Obtiene el calendarId a usar, priorizando el parámetro sobre el default
 */
export function resolveCalendarId(calendarId?: string): string {
  return calendarId || defaultCalendarId || 'primary';
}

/**
 * Reinicia el cliente (útil para tests o cambio de credenciales)
 */
export function resetClient(): void {
  calendarClient = null;
  defaultCalendarId = 'primary';
}
