import request from 'supertest';
import { bearer, camry, createAdminToken, createTestContext, model3, registerUser, TestContext } from '../helpers/testApp';

describe('Inventory API', () => {
  let ctx: TestContext;
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    ctx = createTestContext();
    userToken = await registerUser(ctx);
    adminToken = await createAdminToken(ctx);
  });
  afterEach(() => ctx.close());

  describe('POST /api/vehicles/:id/purchase', () => {
    it('decreases quantity by one and returns the updated vehicle', async () => {
      const { id } = ctx.vehicles.create(camry);
      const res = await request(ctx.app).post(`/api/vehicles/${id}/purchase`).set(...bearer(userToken));
      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(camry.quantity - 1);
      expect(ctx.vehicles.findById(id)?.quantity).toBe(camry.quantity - 1);
    });

    it('supports an explicit quantity', async () => {
      const { id } = ctx.vehicles.create(camry);
      const res = await request(ctx.app).post(`/api/vehicles/${id}/purchase`).set(...bearer(userToken)).send({ quantity: 3 });
      expect(res.body.quantity).toBe(2);
    });

    it('returns 409 for a sold-out vehicle and keeps quantity at zero', async () => {
      const { id } = ctx.vehicles.create(model3);
      const res = await request(ctx.app).post(`/api/vehicles/${id}/purchase`).set(...bearer(userToken));
      expect(res.status).toBe(409);
      expect(ctx.vehicles.findById(id)?.quantity).toBe(0);
    });

    it('returns 409 when asking for more units than available', async () => {
      const { id } = ctx.vehicles.create({ ...camry, quantity: 2 });
      expect((await request(ctx.app).post(`/api/vehicles/${id}/purchase`).set(...bearer(userToken)).send({ quantity: 3 })).status).toBe(409);
    });

    it('never oversells under concurrent purchases', async () => {
      const { id } = ctx.vehicles.create({ ...camry, quantity: 3 });
      const responses = await Promise.all(
        Array.from({ length: 8 }, () => request(ctx.app).post(`/api/vehicles/${id}/purchase`).set(...bearer(userToken))),
      );
      const statuses = responses.map((r) => r.status);
      expect(statuses.filter((s) => s === 200)).toHaveLength(3);
      expect(statuses.filter((s) => s === 409)).toHaveLength(5);
      expect(ctx.vehicles.findById(id)?.quantity).toBe(0);
    });

    it('returns 404 for an unknown vehicle', async () => {
      expect((await request(ctx.app).post('/api/vehicles/999/purchase').set(...bearer(userToken))).status).toBe(404);
    });

    it('returns 400 for an invalid quantity', async () => {
      const { id } = ctx.vehicles.create(camry);
      expect((await request(ctx.app).post(`/api/vehicles/${id}/purchase`).set(...bearer(userToken)).send({ quantity: 0 })).status).toBe(400);
    });
  });

  describe('POST /api/vehicles/:id/restock', () => {
    it('lets an admin increase quantity', async () => {
      const { id } = ctx.vehicles.create(model3);
      const res = await request(ctx.app).post(`/api/vehicles/${id}/restock`).set(...bearer(adminToken)).send({ quantity: 10 });
      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(10);
    });

    it('forbids regular users (403) and leaves stock unchanged', async () => {
      const { id } = ctx.vehicles.create(camry);
      const res = await request(ctx.app).post(`/api/vehicles/${id}/restock`).set(...bearer(userToken)).send({ quantity: 10 });
      expect(res.status).toBe(403);
      expect(ctx.vehicles.findById(id)?.quantity).toBe(camry.quantity);
    });

    it('requires a positive quantity (400)', async () => {
      const { id } = ctx.vehicles.create(camry);
      expect((await request(ctx.app).post(`/api/vehicles/${id}/restock`).set(...bearer(adminToken)).send({})).status).toBe(400);
      expect((await request(ctx.app).post(`/api/vehicles/${id}/restock`).set(...bearer(adminToken)).send({ quantity: -2 })).status).toBe(400);
    });

    it('returns 404 for an unknown vehicle', async () => {
      expect((await request(ctx.app).post('/api/vehicles/999/restock').set(...bearer(adminToken)).send({ quantity: 1 })).status).toBe(404);
    });
  });
});
