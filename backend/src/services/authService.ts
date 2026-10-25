import { ConflictError, UnauthorizedError } from '../errors';
import { UserRepository } from '../repositories/interfaces';
import { PublicUser, User } from '../types';
import { PasswordHasher } from './passwordHasher';
import { TokenService } from './tokenService';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}

const toPublicUser = ({ id, name, email, role }: User): PublicUser => ({ id, name, email, role });

/**
 * Registration and login. Public sign-up always creates a regular "user";
 * admins are provisioned out-of-band (see the seed script) to prevent privilege escalation.
 */
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    if (this.users.findByEmail(email)) {
      throw new ConflictError('Email is already registered');
    }

    const passwordHash = await this.hasher.hash(input.password);
    const user = this.users.create({ name: input.name.trim(), email, passwordHash, role: 'user' });
    return this.buildResult(user);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = this.users.findByEmail(input.email.trim().toLowerCase());
    // Same message for "unknown email" and "wrong password" so attackers can't enumerate accounts.
    const invalid = new UnauthorizedError('Invalid email or password');
    if (!user) throw invalid;

    const matches = await this.hasher.compare(input.password, user.passwordHash);
    if (!matches) throw invalid;

    return this.buildResult(user);
  }

  getProfile(userId: number): PublicUser {
    const user = this.users.findById(userId);
    if (!user) throw new UnauthorizedError('Account no longer exists');
    return toPublicUser(user);
  }

  private buildResult(user: User): AuthResult {
    return {
      user: toPublicUser(user),
      token: this.tokens.sign({ id: user.id, role: user.role }),
    };
  }
}
