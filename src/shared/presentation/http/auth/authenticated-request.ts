import { Request } from 'express';
import { AuthenticatedUserContext } from './authenticated-user.context';

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserContext;
}
