export function sendSuccess(req, res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: {
      request_id: req.id || 'req_unknown',
      timestamp: new Date().toISOString()
    }
  });
}

export function sendPaginated(req, res, data, pagination, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    pagination,
    meta: {
      request_id: req.id || 'req_unknown',
      timestamp: new Date().toISOString()
    }
  });
}
