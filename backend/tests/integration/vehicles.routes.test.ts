import request from 'supertest';
import { bearer, camry, createAdminToken, createTestContext, model3, mustang, registerUser, TestContext } from '../helpers/testApp';

describe('Vehicles API', () => {
  let ctx: TestContext;
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    ctx = createTestContext();
    userToken = await registerUser(ctx);
    adminToken = await createAdminToken(ctx);
  });
  afterEach(() => ctx.close());

  describe('authentication', () => {
    it.each([
      ['get', '/api/vehicles'],
      ['get', '/api/vehicles/search'],
      ['get', '/api/vehicles/1'],
      ['post', '/api/vehicles'],
      ['put', '/api/vehicles/1'],
      ['delete', '/api/vehicles/1'],
      ['post', '/api/vehicles/1/purchase'],
      ['post', '/api/vehicles/1/restock'],
    ] as const)('%s %s requires a token', async (method, url) => {
      const res = await request(ctx.app)[method](url);
      expect(res.status).toBe(401);
    });

    it('rejects an invalid token', async () => {
      const res = await request(ctx.app).get('/api/vehicles').set(...bearer('forged.token.value'));
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/vehicles', () => {
    it('lets an admin create a vehicle (201)', async () => {
      const res = await request(ctx.app).post('/api/vehicles').set(...bearer(adminToken)).send(camry);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ id: expect.any(Number), ...camry });
    });

    it('forbids regular users (403)', async () => {
      const res = await request(ctx.app).post('/api/vehicles').set(...bearer(userToken)).send(camry);
      expect(res.status).toBe(403);
    });

    it('validates the payload (400)', async () => {
      const res = await request(ctx.app).post('/api/vehicles').set(...bearer(adminToken)).send({ ...camry, price: -5, quantity: 1.5 });
      expect(res.status).toBe(400);
      expect(res.body.error.details.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/vehicles', () => {
    it('lists all vehicles, including sold-out ones, for any authenticated user', async () => {
      [camry, mustang, model3].forEach((v) => ctx.vehicles.create(v));
      const res = await request(ctx.app).get('/api/vehicles').set(...bearer(userToken));
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      expect(res.body.some((v: { quantity: number }) => v.quantity === 0)).toBe(true);
    });

    it('returns an empty array when there is no stock data', async () => {
      const res = await request(ctx.app).get('/api/vehicles').set(...bearer(userToken));
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/vehicles/search', () => {
    beforeEach(() => {
      [camry, mustang, model3].forEach((v) => ctx.vehicles.create(v));
    });
    const search = (qs: string) => request(ctx.app).get(`/api/vehicles/search${qs}`).set(...bearer(userToken));

    it('searches by make', async () => {
      expect((await search('?make=ford')).body.map((v: { model: string }) => v.model)).toEqual(['Mustang']);
    });
    it('searches by model', async () => {
      expect((await search('?model=camry')).body).toHaveLength(1);
    });
    it('searches by category', async () => {
      expect((await search('?category=electric')).body[0].make).toBe('Tesla');
    });
    it('searches by price range', async () => {
      const res = await search('?minPrice=30000&maxPrice=40000');
      expect(res.body.map((v: { model: string }) => v.model)).toEqual(['Mustang']);
    });
    it('combines filters', async () => {
      expect((await search('?make=t&maxPrice=30000')).body.map((v: { model: string }) => v.model)).toEqual(['Camry']);
    });
    it('returns everything when no filter is given', async () => {
      expect((await search('')).body).toHaveLength(3);
    });
    it('returns 400 for an invalid price', async () => {
      expect((await search('?minPrice=abc')).status).toBe(400);
    });
    it('returns 400 when minPrice > maxPrice', async () => {
      expect((await search('?minPrice=500&maxPrice=100')).status).toBe(400);
    });
  });

  describe('GET /api/vehicles/:id', () => {
    it('returns the vehicle', async () => {
      const { id } = ctx.vehicles.create(camry);
      const res = await request(ctx.app).get(`/api/vehicles/${id}`).set(...bearer(userToken));
      expect(res.body.model).toBe('Camry');
    });
    it('returns 404 for an unknown id', async () => {
      expect((await request(ctx.app).get('/api/vehicles/999').set(...bearer(userToken))).status).toBe(404);
    });
    it('returns 400 for a non-numeric id', async () => {
      expect((await request(ctx.app).get('/api/vehicles/abc').set(...bearer(userToken))).status).toBe(400);
    });
  });

  describe('PUT /api/vehicles/:id', () => {
    it('lets an admin update a vehicle', async () => {
      const { id } = ctx.vehicles.create(camry);
      const res = await request(ctx.app).put(`/api/vehicles/${id}`).set(...bearer(adminToken)).send({ price: 27000, category: 'Compact' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ price: 27000, category: 'Compact', make: 'Toyota' });
    });
    it('forbids regular users', async () => {
      const { id } = ctx.vehicles.create(camry);
      expect((await request(ctx.app).put(`/api/vehicles/${id}`).set(...bearer(userToken)).send({ price: 1 })).status).toBe(403);
    });
    it('returns 404 for an unknown id', async () => {
      expect((await request(ctx.app).put('/api/vehicles/999').set(...bearer(adminToken)).send({ price: 1 })).status).toBe(404);
    });
    it('returns 400 for an empty body', async () => {
      const { id } = ctx.vehicles.create(camry);
      expect((await request(ctx.app).put(`/api/vehicles/${id}`).set(...bearer(adminToken)).send({})).status).toBe(400);
    });
  });

  describe('DELETE /api/vehicles/:id', () => {
    it('lets an admin delete (204)', async () => {
      const { id } = ctx.vehicles.create(camry);
      expect((await request(ctx.app).delete(`/api/vehicles/${id}`).set(...bearer(adminToken))).status).toBe(204);
      expect(ctx.vehicles.findById(id)).toBeUndefined();
    });
    it('forbids regular users (403) and keeps the vehicle', async () => {
      const { id } = ctx.vehicles.create(camry);
      expect((await request(ctx.app).delete(`/api/vehicles/${id}`).set(...bearer(userToken))).status).toBe(403);
      expect(ctx.vehicles.findById(id)).toBeDefined();
    });
    it('returns 404 for an unknown id', async () => {
      expect((await request(ctx.app).delete('/api/vehicles/999').set(...bearer(adminToken))).status).toBe(404);
    });
  });
});
