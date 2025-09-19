// Mock logger for testing
export class Logger {
  info(message: string, meta?: any) {
    console.log(`[INFO] ${message}`, meta);
  }

  error(message: string, meta?: any) {
    console.error(`[ERROR] ${message}`, meta);
  }

  warn(message: string, meta?: any) {
    console.warn(`[WARN] ${message}`, meta);
  }

  debug(message: string, meta?: any) {
    console.debug(`[DEBUG] ${message}`, meta);
  }

  child(options: any) {
    return new Logger();
  }
}

export const logger = new Logger();
export default logger;
