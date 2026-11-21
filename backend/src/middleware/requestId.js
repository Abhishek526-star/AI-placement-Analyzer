import crypto from 'crypto';

export function requestId(req, res, next) {
  const incomingId = req.headers['x-request-id'];
  const id = typeof incomingId === 'string' ? incomingId : `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
