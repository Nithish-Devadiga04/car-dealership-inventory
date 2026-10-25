import { Request, Response } from 'express';
import { UnauthorizedError } from '../errors';
import { getAuth } from '../middleware/auth';
import { AuthService } from '../services/authService';
import { loginSchema, parseOrThrow, registerSchema } from '../validation/schemas';

export class AuthController {
  constructor(private readonly auth: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const input = parseOrThrow(registerSchema, req.body);
    res.status(201).json(await this.auth.register(input));
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const input = parseOrThrow(loginSchema, req.body);
    res.status(200).json(await this.auth.login(input));
  };

  me = (_req: Request, res: Response): void => {
    const auth = getAuth(res);
    if (!auth) throw new UnauthorizedError();
    res.json({ user: this.auth.getProfile(auth.id) });
  };
}
