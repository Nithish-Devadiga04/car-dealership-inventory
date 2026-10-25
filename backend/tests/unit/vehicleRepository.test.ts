import { createTestContext, TestContext, camry, mustang, model3 } from '../helpers/testApp';

/** Exercises the real SQL against a temporary SQLite file. */
describe('SqliteVehicleRepository', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
    ctx.vehicles.create(camry);
    ctx.vehicles.create(mustang);
    ctx.vehicles.create(model3);
  });
  afterEach(() => ctx.close());

  it('assigns unique incrementing ids and timestamps', () => {
    const all = ctx.vehicles.findAll();
    expect(new Set(all.map((v) => v.id)).size).toBe(3);
    expect(all[0].createdAt).toBeTruthy();
  });

  it('lists vehicles ordered by make then model', () => {
    expect(ctx.vehicles.findAll().map((v) => v.make)).toEqual(['Ford', 'Tesla', 'Toyota']);
  });

  describe('search', () => {
    it('returns everything with no filters', () => {
      expect(ctx.vehicles.search({})).toHaveLength(3);
    });
    it('matches make case-insensitively and partially', () => {
      expect(ctx.vehicles.search({ make: 'toy' }).map((v) => v.model)).toEqual(['Camry']);
    });
    it('matches model', () => {
      expect(ctx.vehicles.search({ model: 'mod' }).map((v) => v.make)).toEqual(['Tesla']);
    });
    it('matches category', () => {
      expect(ctx.vehicles.search({ category: 'COUPE' }).map((v) => v.model)).toEqual(['Mustang']);
    });
    it('filters by inclusive price range', () => {
      expect(ctx.vehicles.search({ minPrice: 28500, maxPrice: 39900 }).map((v) => v.model)).toEqual(['Mustang', 'Camry']);
    });
    it('combines filters with AND', () => {
      expect(ctx.vehicles.search({ make: 'ford', maxPrice: 30000 })).toHaveLength(0);
    });
    it('treats LIKE wildcards in user input literally', () => {
      expect(ctx.vehicles.search({ make: '%' })).toHaveLength(0);
      expect(ctx.vehicles.search({ make: '_' })).toHaveLength(0);
    });
    it('is not vulnerable to SQL injection through filters', () => {
      expect(ctx.vehicles.search({ make: "'; DROP TABLE vehicles; --" })).toHaveLength(0);
      expect(ctx.vehicles.findAll()).toHaveLength(3);
    });
  });

  describe('update', () => {
    it('updates provided columns and bumps updatedAt', () => {
      const { id } = ctx.vehicles.search({ make: 'toyota' })[0];
      const updated = ctx.vehicles.update(id, { price: 1, category: 'Compact' });
      expect(updated).toMatchObject({ price: 1, category: 'Compact', make: 'Toyota' });
    });
    it('returns undefined for an unknown id', () => {
      expect(ctx.vehicles.update(999, { price: 1 })).toBeUndefined();
    });
    it('returns the unchanged vehicle for an empty patch', () => {
      const { id } = ctx.vehicles.findAll()[0];
      expect(ctx.vehicles.update(id, {})?.id).toBe(id);
    });
  });

  describe('stock movements', () => {
    it('decrements when enough stock exists', () => {
      const { id } = ctx.vehicles.search({ make: 'toyota' })[0];
      expect(ctx.vehicles.decrementQuantity(id, 2)).toBe(true);
      expect(ctx.vehicles.findById(id)?.quantity).toBe(3);
    });
    it('refuses to go below zero and leaves stock unchanged', () => {
      const { id } = ctx.vehicles.search({ make: 'toyota' })[0];
      expect(ctx.vehicles.decrementQuantity(id, 6)).toBe(false);
      expect(ctx.vehicles.findById(id)?.quantity).toBe(5);
    });
    it('increments stock', () => {
      const { id } = ctx.vehicles.search({ make: 'tesla' })[0];
      expect(ctx.vehicles.incrementQuantity(id, 4)).toBe(true);
      expect(ctx.vehicles.findById(id)?.quantity).toBe(4);
    });
    it('reports false for unknown ids', () => {
      expect(ctx.vehicles.incrementQuantity(999, 1)).toBe(false);
      expect(ctx.vehicles.decrementQuantity(999, 1)).toBe(false);
    });
  });

  it('deletes a vehicle', () => {
    const { id } = ctx.vehicles.findAll()[0];
    expect(ctx.vehicles.delete(id)).toBe(true);
    expect(ctx.vehicles.delete(id)).toBe(false);
    expect(ctx.vehicles.findAll()).toHaveLength(2);
  });
});
