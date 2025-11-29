/**
 * Utilidades de logging para el MCP
 * Los logs se envían a stderr para no interferir con la comunicación MCP por stdout
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

/**
 * Formatea un mensaje de log con timestamp
 */
function formatMessage(level: LogLevel, message: string, data?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (data) {
    return `${prefix} ${message} ${JSON.stringify(data)}`;
  }
  
  return `${prefix} ${message}`;
}

/**
 * Escribe un log si el nivel es suficiente
 */
function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  if (LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel]) {
    // Usamos stderr para no interferir con la comunicación MCP
    console.error(formatMessage(level, message, data));
  }
}

/**
 * Logger para el MCP de Google Calendar
 */
export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => log('debug', message, data),
  info: (message: string, data?: Record<string, unknown>) => log('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) => log('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) => log('error', message, data),
  
  /**
   * Log específico para requests de tools
   */
  toolRequest: (toolName: string, params: Record<string, unknown>) => {
    log('info', `Tool request: ${toolName}`, { params });
  },
  
  /**
   * Log específico para respuestas de tools
   */
  toolResponse: (toolName: string, result: { eventId?: string; count?: number; success?: boolean }) => {
    log('info', `Tool response: ${toolName}`, result);
  },
};

