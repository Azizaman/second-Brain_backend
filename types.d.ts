import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      file?: {
        originalname: string;
        buffer: Buffer;
      };
    }
  }
}
