import { fail } from '../utils/response.js';

export function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message || 'Invalid input.';
      const code = parsed.error.errors[0]?.message?.includes('Username')
        ? 'VALIDATION_ERROR'
        : 'VALIDATION_ERROR';
      return fail(res, 400, code, message, parsed.error.flatten());
    }
    req.validated = parsed.data;
    return next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return fail(res, 400, 'VALIDATION_ERROR', 'Invalid query parameters.');
    }
    req.validatedQuery = parsed.data;
    return next();
  };
}
