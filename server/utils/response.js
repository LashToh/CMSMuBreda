export function ok(res, data = null, message = 'OK', status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

export function fail(res, status, code, message, details = undefined) {
  const body = {
    success: false,
    code,
    message,
  };
  if (details !== undefined) body.details = details;
  return res.status(status).json(body);
}

export function paginated(res, { items, page, pageSize, total }) {
  return ok(res, {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
}
