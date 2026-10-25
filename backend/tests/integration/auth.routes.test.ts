import request from 'supertest';
import { bearer, createTestContext, registerUser, TestContext, validUser } from '../helpers/testApp';

describe('Auth API', () => {
  let ctx: TestContext;
  beforeEach(() => {
    ctx = createTestContext();
  });
  afterEach(() => ctx.close());

  describe('POST /api/auth/register', () => {
    it('creates a user and returns 201 with user + token', async () => {
      const res = await request(ctx.app).post('/api/auth/register').send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.user).toEqual({ id: expect.any(Number), name: validUser.name, email: validUser.email, role: 'user' });
      expect(JSON.stringify(res.body)).not.toMatch(/hash|password/i);
    });

    it('ignores any attempt to self-assign the admin role', async () => {
      const res = await request(ctx.app).post('/api/auth/register').send({ ...validUser, role: 'admin' });
      expect(res.body.user.role).toBe('user');
    });

    it('returns 409 for a duplicate email', async () => {
      await request(ctx.app).post('/api/auth/register').send(validUser);
      const res = await request(ctx.app).post('/api/auth/register').send(validUser);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('returns 400 with field details for invalid input', async () => {
      const res = await request(ctx.app).post('/api/auth/register').send({ name: 'A', email: 'bad', password: '1' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.map((d: { path: string }) => d.path)).toEqual(expect.arrayContaining(['name', 'email', 'password']));
    });

    it('returns 400 for malformed JSON', async () => {
      const res = await request(ctx.app).post('/api/auth/register').set('Content-Type', 'application/json').send('{bad json');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_JSON');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await registerUser(ctx);
    });

    it('returns 200 and a token for valid credentials', async () => {
      const res = await request(ctx.app).post('/api/auth/login').send({ email: validUser.email, password: validUser.password });
      expect(res.status).toBe(200);
      expect(res.body.token).toEqual(expect.any(String));
    });

    it('returns 401 for a wrong password', async () => {
      const res = await request(ctx.app).post('/api/auth/login').send({ email: validUser.email, password: 'WrongPass1' });
      expect(res.status).toBe(401);
    });

    it('returns 401 for an unknown user', async () => {
      const res = await request(ctx.app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'Whatever1' });
      expect(res.status).toBe(401);
    });

    it('returns 400 when fields are missing', async () => {
      const res = await request(ctx.app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the current user for a valid token', async () => {
      const token = await registerUser(ctx);
      const res = await request(ctx.app).get('/api/auth/me').set(...bearer(token));
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(validUser.email);
    });

    it('returns 401 without a token', async () => {
      expect((await request(ctx.app).get('/api/auth/me')).status).toBe(401);
    });
  });

  it('returns 404 JSON for unknown routes', async () => {
    const res = await request(ctx.app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('exposes a health check', async () => {
    expect((await request(ctx.app).get('/api/health')).body).toEqual({ status: 'ok' });
  });
});
