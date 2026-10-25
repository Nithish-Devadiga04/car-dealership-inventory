import { AuthService } from '../../src/services/authService';
import { ConflictError, UnauthorizedError } from '../../src/errors';
import { FakePasswordHasher, FakeTokenService, InMemoryUserRepository } from '../helpers/fakes';

describe('AuthService', () => {
  let users: InMemoryUserRepository;
  let service: AuthService;
  const input = { name: '  Ada Lovelace ', email: 'Ada@Example.com ', password: 'Secret123' };

  beforeEach(() => {
    users = new InMemoryUserRepository();
    service = new AuthService(users, new FakePasswordHasher(), new FakeTokenService());
  });

  describe('register', () => {
    it('creates a regular user, normalising name and email, and returns a token', async () => {
      const result = await service.register(input);

      expect(result.user).toEqual({ id: 1, name: 'Ada Lovelace', email: 'ada@example.com', role: 'user' });
      expect(result.token).toBe('token-1-user');
    });

    it('never stores the plain-text password', async () => {
      await service.register(input);
      expect(users.findByEmail('ada@example.com')?.passwordHash).not.toBe(input.password);
    });

    it('never exposes the password hash to callers', async () => {
      const result = await service.register(input);
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('rejects an email that is already registered (case-insensitively)', async () => {
      await service.register(input);
      await expect(service.register({ ...input, email: 'ADA@example.com' })).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await service.register(input);
    });

    it('returns the user and a token for valid credentials', async () => {
      const result = await service.login({ email: 'ada@example.com', password: 'Secret123' });
      expect(result.user.email).toBe('ada@example.com');
      expect(result.token).toBeTruthy();
    });

    it('is case-insensitive on email', async () => {
      await expect(service.login({ email: 'ADA@EXAMPLE.COM', password: 'Secret123' })).resolves.toBeDefined();
    });

    it('rejects a wrong password', async () => {
      await expect(service.login({ email: 'ada@example.com', password: 'nope' })).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('uses an identical message for unknown email and wrong password (no account enumeration)', async () => {
      const wrongPassword = await service.login({ email: 'ada@example.com', password: 'nope' }).catch((e) => e);
      const unknownEmail = await service.login({ email: 'ghost@example.com', password: 'nope' }).catch((e) => e);
      expect(unknownEmail.message).toBe(wrongPassword.message);
    });
  });

  describe('getProfile', () => {
    it('returns the public profile', async () => {
      const { user } = await service.register(input);
      expect(service.getProfile(user.id)).toEqual(user);
    });

    it('rejects when the account no longer exists', () => {
      expect(() => service.getProfile(999)).toThrow(UnauthorizedError);
    });
  });
});
