export class AppError extends Error {
  constructor(message, { status = 500, code = 'SERVER_ERROR', details } = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function isAppError(err) {
  return err instanceof AppError;
}
