/**
 * Production-safe logger
 * Replaces console.log to prevent sensitive data leakage in production
 */

const IS_PRODUCTION = import.meta.env.PROD;
const ENABLE_LOGGING = import.meta.env.VITE_ENABLE_LOGGING === 'true';

class Logger {
  log(...args: any[]) {
    if (!IS_PRODUCTION || ENABLE_LOGGING) {
      console.log('[PayMe]', ...args);
    }
  }

  error(...args: any[]) {
    if (!IS_PRODUCTION || ENABLE_LOGGING) {
      console.error('[PayMe Error]', ...args);
    }
    
    // In production, send to monitoring service
    if (IS_PRODUCTION) {
      this.sendToMonitoring('error', args);
    }
  }

  warn(...args: any[]) {
    if (!IS_PRODUCTION || ENABLE_LOGGING) {
      console.warn('[PayMe Warning]', ...args);
    }
  }

  info(...args: any[]) {
    if (!IS_PRODUCTION || ENABLE_LOGGING) {
      console.info('[PayMe Info]', ...args);
    }
  }

  private sendToMonitoring(level: string, data: any[]) {
    // TODO: Integrate with CloudWatch, Sentry, or your monitoring service
    // For now, we just prevent console output in production
    try {
      // Example: Send to CloudWatch Logs
      // await cloudwatch.putLogEvents({...});
    } catch (error) {
      // Silently fail - don't break the app
    }
  }
}

export const logger = new Logger();
