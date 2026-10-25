import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors';
import { AuthContext, Role } from '../types';

export interface TokenService {
  sign(subject: AuthContext): string;
  verify(token: string): AuthContext;
}

const isRole = (value: unknown): value is Role => value === 'user' || value === 'admin';

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  sign({ id, role }: AuthContext): string {
    return jwt.sign({ role }, this.secret, {
      subject: String(id),
      expiresIn: this.expiresIn as jwt.SignOptions['expiresIn'],
      algorithm: 'HS256',
    });
  }

  verify(token: string): AuthContext {
    try {
      const payload = jwt.verify(token, this.secret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
      const id = Number(payload.sub);
      if (!Number.isInteger(id) || !isRole(payload.role)) {
        throw new Error('Malformed token payload');
      }
      return { id, role: payload.role };
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}
