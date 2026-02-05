import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email?: string | null;
      };
      cookies?: Record<string, string>;
    }
  }
}

export {};
