class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Postgres / PostgREST error codes -> HTTP status
const PG_STATUS = {
  '23505': 409, // unique_violation
  '23503': 422, // foreign_key_violation
  '23502': 400, // not_null_violation
  '23514': 400, // check_violation
  '22P02': 400, // invalid_text_representation (e.g. malformed uuid)
  '22003': 400, // numeric_value_out_of_range
  '22007': 400, // invalid_datetime_format
};

function handleError(res, err) {
  const status = err.status || PG_STATUS[err.code] || 500;
  // Deliberate HttpErrors carry a safe, useful message; unexpected 500s stay generic.
  if (status === 500 && !(err instanceof HttpError)) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  return res.status(status).json({ error: err.message, details: err.details || undefined });
}

// Keep only whitelisted keys that were actually sent.
function pick(body, fields) {
  const out = {};
  for (const f of fields) {
    if (body && body[f] !== undefined) out[f] = body[f];
  }
  return out;
}

function requireFields(obj, fields) {
  const missing = fields.filter((f) => obj[f] === undefined || obj[f] === null || obj[f] === '');
  if (missing.length) throw new HttpError(400, `Missing required field(s): ${missing.join(', ')}`);
}

function assertOneOf(field, value, allowed) {
  if (value !== undefined && !allowed.includes(value)) {
    throw new HttpError(400, `${field} must be one of: ${allowed.join(', ')}`);
  }
}

function assertNotEmpty(obj) {
  if (Object.keys(obj).length === 0) throw new HttpError(400, 'No updatable fields provided');
}

// ?limit=&offset= -> { from, to } for supabase .range()
function pageRange(query, defaultLimit = 100, maxLimit = 500) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
  return { from: offset, to: offset + limit - 1 };
}

function notFound(what) {
  return new HttpError(404, `${what} not found`);
}

module.exports = {
  HttpError,
  handleError,
  pick,
  requireFields,
  assertOneOf,
  assertNotEmpty,
  pageRange,
  notFound,
};
