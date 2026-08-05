import { config } from '../config/index.js';
import { isAppError } from '../utils/errors.js';
import { fail } from '../utils/response.js';

export function notFoundHandler(_req, res) {
  return fail(res, 404, 'NOT_FOUND', 'Not found.');
}

export function errorHandler(err, _req, res, _next) {
  if (isAppError(err)) {
    return fail(res, err.status, err.code, err.message, err.details);
  }

  // Malformed JSON bodies from clients
  if (err instanceof SyntaxError && 'body' in err) {
    return fail(res, 400, 'INVALID_JSON', 'Invalid JSON body.');
  }
  if (err?.type === 'entity.parse.failed') {
    return fail(res, 400, 'INVALID_JSON', 'Invalid JSON body.');
  }

  console.error('[api]', err.message);
  if (!config.isProduction) {
    console.error(err.stack);
  }

  // Never leak SQL / stack traces to clients in production
  return fail(res, 500, 'SERVER_ERROR', 'Server temporarily unavailable.');
}
