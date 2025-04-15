import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      file?: {
        originalname: string;
        buffer: Buffer;
      };


    }
    interface Request {
      isAuthenticated: () => boolean;
      logout: (callback: (err: Error | null) => void) => void;
      user?: JwtPayload | string;
    }
  }
}
