import { NotFoundError } from '../../src/errors';
import { VehicleService } from '../../src/services/vehicleService';
import { InMemoryVehicleRepository, sampleVehicle } from '../helpers/fakes';

describe('VehicleService', () => {
  let repo: InMemoryVehicleRepository;
  let service: VehicleService;

  beforeEach(() => {
    repo = new InMemoryVehicleRepository();
    service = new VehicleService(repo);
  });

  it('creates a vehicle with a unique id', () => {
    const a = service.create(sampleVehicle);
    const b = service.create({ ...sampleVehicle, model: 'Corolla' });
    expect(a.id).not.toBe(b.id);
    expect(a).toMatchObject(sampleVehicle);
  });

  it('lists all vehicles', () => {
    service.create(sampleVehicle);
    service.create({ ...sampleVehicle, make: 'Honda' });
    expect(service.list()).toHaveLength(2);
  });

  it('gets a vehicle by id', () => {
    const { id } = service.create(sampleVehicle);
    expect(service.get(id).model).toBe('Camry');
  });

  it('throws NotFoundError for an unknown id', () => {
    expect(() => service.get(42)).toThrow(NotFoundError);
    expect(() => service.update(42, { price: 1 })).toThrow(NotFoundError);
    expect(() => service.remove(42)).toThrow(NotFoundError);
  });

  it('updates only the provided fields', () => {
    const { id } = service.create(sampleVehicle);
    const updated = service.update(id, { price: 30000 });
    expect(updated.price).toBe(30000);
    expect(updated.make).toBe('Toyota');
  });

  it('removes a vehicle', () => {
    const { id } = service.create(sampleVehicle);
    service.remove(id);
    expect(service.list()).toHaveLength(0);
  });

  it('delegates search filters to the repository', () => {
    service.create(sampleVehicle);
    const filters = { make: 'toy', minPrice: 1000 };
    expect(service.search(filters)).toHaveLength(1);
    expect(repo.search).toHaveBeenCalledWith(filters);
  });
});
