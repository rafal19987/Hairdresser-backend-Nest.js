import { AsyncLocalStorage } from 'async_hooks';
import { NextFunction, Request, Response } from 'express';

export interface RequestContextStore {
  // Guards add userId, clientId or bookingEmail to the request later in the pipeline
  request: Request & {
    userId?: string;
    clientId?: string;
    bookingEmail?: string;
  };
}

const storage = new AsyncLocalStorage<RequestContextStore>();

export const requestContextMiddleware = (
  request: Request,
  _response: Response,
  next: NextFunction,
): void => {
  storage.run({ request }, next);
};

export const getCurrentRequest = (): RequestContextStore['request'] | null =>
  storage.getStore()?.request ?? null;
