export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS attempts
        obj[key] = obj[key]
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
          .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};
