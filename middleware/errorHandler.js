/**
 * Global error handler middleware
 */

// Log detailed errors in development, simpler ones in production
function logError(err) {
    const environment = process.env.NODE_ENV || 'development';
    
    if (environment === 'development') {
      console.error('❌ ERROR DETAILS:', {
        message: err.message,
        stack: err.stack,
        status: err.status,
        code: err.code,
        name: err.name
      });
    } else {
      console.error(`❌ ERROR: ${err.message || 'Unknown error'}`);
    }
  }
  
  // Main error handler
  function errorHandler(err, req, res, next) {
    logError(err);
    
    // If headers already sent, let Express handle it
    if (res.headersSent) {
      return next(err);
    }
    
    // Determine status code
    const statusCode = err.status || err.statusCode || 500;
    
    // Handle different types of errors
    if (err.code === 'EBADCSRFTOKEN') {
      return res.status(403).render('error', { 
        title: 'Security Error', 
        message: 'Invalid form submission, please try again',
        status: 403
      });
    }
    
    if (err.name === 'SequelizeConnectionError' || 
        err.name === 'SequelizeConnectionRefusedError' ||
        (err.message && err.message.includes('database'))) {
      return res.status(503).render('error', { 
        title: 'Database Error', 
        message: 'Unable to connect to the database. Please try again later.',
        status: 503
      });
    }
    
    if (statusCode === 404) {
      return res.status(404).render('error', { 
        title: 'Page Not Found', 
        message: 'The page you requested does not exist.',
        status: 404
      });
    }
    
    // Use appropriate user message based on environment
    const userMessage = process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred. Please try again later.' 
      : err.message || 'Unknown error occurred';
    
    // Render error page with appropriate status code
    res.status(statusCode).render('error', { 
      title: 'Error', 
      message: userMessage,
      status: statusCode,
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
  
  module.exports = errorHandler;