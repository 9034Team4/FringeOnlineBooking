import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler to properly catch and forward errors to Express error middleware
 * @param handler Async route handler function
 * @returns Express middleware function
 */
export const wrapHandler = (handler: any): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await Promise.resolve(handler(req, res, next));
    } catch (error) {
      next(error);
    }
  };
}; 