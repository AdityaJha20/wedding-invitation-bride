import { Request, Response, NextFunction } from 'express';

// Prevents browsers and proxies from caching responses that contain invitation data
export const noStore = (_req: Request, res: Response, next: NextFunction): void => {
  res.set('Cache-Control', 'no-store');
  next();
};

// Private guest pages: never cached and never indexed by search engines
export const privatePage = (_req: Request, res: Response, next: NextFunction): void => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Robots-Tag', 'noindex, nofollow');
  next();
};

// Mutating admin requests must be JSON. Cross-site HTML forms cannot send
// application/json without a CORS preflight, which the CORS policy rejects.
export const requireJsonContent = (req: Request, res: Response, next: NextFunction): void => {
  const contentType = req.headers['content-type'] || '';
  if (!/^application\/json\b/i.test(contentType)) {
    res.status(415).json({
      success: false,
      message: 'Requests must be sent as JSON.',
    });
    return;
  }
  next();
};
