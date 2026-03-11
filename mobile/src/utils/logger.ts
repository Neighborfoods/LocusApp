/**
 * Global error logging. Catches unhandled JS exceptions to prevent silent crashes
 * and surfaces them for debugging (SIGKILL/SIGABRT correlation).
 * Install early in index.js so all errors are logged.
 */

const PREFIX = '[Locus]';

export interface LoggedError {
  message: string;
  stack?: string;
  timestamp: string;
  isFatal?: boolean;
}

let lastError: LoggedError | null = null;

function formatError(error: unknown, isFatal?: boolean): LoggedError {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const entry: LoggedError = {
    message,
    stack,
    timestamp: new Date().toISOString(),
    ...(isFatal !== undefined && { isFatal }),
  };
  lastError = entry;
  return entry;
}

function logToConsole(entry: LoggedError, label: string) {
  if (__DEV__) console.error(`${PREFIX} ${label}`, entry.message, entry.stack ?? '');
  if (__DEV__ && entry.stack) console.error(entry.stack);
}

/**
 * Install global JS error handler. Call once at app entry (e.g. index.js).
 * Does not prevent crash; ensures exception is logged before process dies.
 */
export function installGlobalErrorHandler(): void {
  const existing = (global as any).ErrorUtils?.getGlobalHandler?.();
  (global as any).ErrorUtils?.setGlobalHandler?.((error: unknown, isFatal?: boolean) => {
    const entry = formatError(error, isFatal);
    logToConsole(entry, isFatal ? 'FATAL' : 'UnhandledError');
    existing?.(error, isFatal);
  });
}

/**
 * Optional: install unhandled promise rejection handler (React Native).
 */
export function installUnhandledRejectionHandler(): void {
  const tracking = (global as any).__handledRejections ?? new Set();
  (global as any).__handledRejections = tracking;

  const originalHandler = (global as any).onunhandledrejection;
  (global as any).onunhandledrejection = (e: { reason?: unknown }) => {
    const key = e?.reason ?? e;
    if (!tracking.has(key)) {
      tracking.add(key);
      const entry = formatError(e?.reason ?? e);
      logToConsole(entry, 'UnhandledRejection');
    }
    originalHandler?.(e);
  };
}

/** Last error captured by the global handler (e.g. for crash reports). */
export function getLastError(): LoggedError | null {
  return lastError;
}
