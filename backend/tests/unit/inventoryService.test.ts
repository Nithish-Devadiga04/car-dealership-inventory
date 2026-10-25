import { ConflictError, NotFoundError } from '../../src/errors';
import { InventoryService } from '../../src/services/inventoryService';
import { InMemoryVehicleRepository, sampleVehicle } from '../helpers/fakes';

describe('InventoryService', () => {
  let repo: InMemoryVehicleRepository;
  let service: InventoryService;

  beforeEach(() => {
    repo = new InMemoryVehicleRepository();
    service = new InventoryService(repo);
  });

  describe('purchase', () => {
    it('decreases quantity by one by default', () => {
      const { id } = repo.create({ ...sampleVehicle, quantity: 3 });
      expect(service.purchase(id).quantity).toBe(2);
    });

    it('supports buying several units at once', () => {
      const { id } = repo.create({ ...sampleVehicle, quantity: 5 });
      expect(service.purchase(id, 3).quantity).toBe(2);
    });

    it('allows buying the last unit', () => {
      const { id } = repo.create({ ...sampleVehicle, quantity: 1 });
      expect(service.purchase(id).quantity).toBe(0);
    });

    it('refuses to purchase a sold-out vehicle', () => {
      const { id } = repo.create({ ...sampleVehicle, quantity: 0 });
      expect(() => service.purchase(id)).toThrow(ConflictError);
    });

    it('refuses to buy more units than are in stock and leaves stock untouched', () => {
      const { id } = repo.create({ ...sampleVehicle, quantity: 2 });
      expect(() => service.purchase(id, 3)).toThrow(ConflictError);
      expect(repo.findById(id)?.quantity).toBe(2);
    });

    it('throws NotFoundError for an unknown vehicle', () => {
      expect(() => service.purchase(99)).toThrow(NotFoundError);
    });
  });

  describe('restock', () => {
    it('increases quantity', () => {
      const { id } = repo.create({ ...sampleVehicle, quantity: 0 });
      expect(service.restock(id, 10).quantity).toBe(10);
    });

    it('throws NotFoundError for an unknown vehicle', () => {
      expect(() => service.restock(99, 5)).toThrow(NotFoundError);
    });
  });
});
