type LogContext = Record<string, unknown>;

function format(level: string, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const base = `${timestamp} [${level}] ${message}`;
  if (context && Object.keys(context).length > 0) {
    return `${base} ${JSON.stringify(context)}`;
  }
  return base;
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.log(format('INFO', message, context));
  },
  warn(message: string, context?: LogContext) {
    console.warn(format('WARN', message, context));
  },
  error(message: string, error?: unknown, context?: LogContext) {
    const errContext: LogContext = { ...context };
    if (error instanceof Error) {
      errContext.error = error.message;
      errContext.stack = error.stack;
    } else if (error) {
      errContext.error = String(error);
    }
    console.error(format('ERROR', message, errContext));
  },
};
