/* eslint-disable no-unused-vars */

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error("[error]", err);

  if (res.headersSent) {
    // Streaming response already started — best we can do is end it.
    return res.end();
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || "Internal server error",
  });
}

module.exports = { notFoundHandler, errorHandler };
