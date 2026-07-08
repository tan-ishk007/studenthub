// Catches any request that didn't match a route above it.
// Must be registered AFTER all other app.use('/', ...routes) calls.
export function notFound(req, res, next) {
  res.status(404).render('error', {
    status: 404,
    title: 'Page Not Found',
    message: "That page doesn't exist, or it's been moved.",
  });
}

// Centralized error handler. Catches:
// - errors passed via next(err) from controllers
// - thrown errors in sync route handlers
// - Mongoose CastErrors from malformed ObjectIds (e.g. /resources/not-a-valid-id)
// Must be registered last, after notFound, with 4 params so Express recognizes it as an error handler.
export function errorHandler(err, req, res, next) {
  console.error(err);

  // Malformed MongoDB ObjectId (e.g. someone edits the URL or an old link is stale)
  if (err.name === 'CastError') {
    return res.status(404).render('error', {
      status: 404,
      title: 'Record Not Found',
      message: "That resource doesn't exist, or the link is invalid.",
    });
  }

  const status = err.status || 500;
  const titles = { 404: 'Record Not Found', 500: 'Something Went Wrong' };
  res.status(status).render('error', {
    status,
    title: titles[status] || 'Error',
    message:
      status === 500
        ? "An unexpected error occurred on our end. It's been logged — try again in a moment."
        : err.message || 'An error occurred.',
  });
}
