import { Request, Response } from 'express';
import { VehicleService } from '../services/vehicleService';
import {
  createVehicleSchema,
  idParamSchema,
  parseOrThrow,
  searchQuerySchema,
  updateVehicleSchema,
} from '../validation/schemas';

export class VehicleController {
  constructor(private readonly vehicles: VehicleService) {}

  list = (_req: Request, res: Response): void => {
    res.json(this.vehicles.list());
  };

  search = (req: Request, res: Response): void => {
    const filters = parseOrThrow(searchQuerySchema, req.query);
    res.json(this.vehicles.search(filters));
  };

  getOne = (req: Request, res: Response): void => {
    res.json(this.vehicles.get(parseOrThrow(idParamSchema, req.params.id)));
  };

  create = (req: Request, res: Response): void => {
    const input = parseOrThrow(createVehicleSchema, req.body);
    res.status(201).json(this.vehicles.create(input));
  };

  update = (req: Request, res: Response): void => {
    const id = parseOrThrow(idParamSchema, req.params.id);
    const patch = parseOrThrow(updateVehicleSchema, req.body);
    res.json(this.vehicles.update(id, patch));
  };

  remove = (req: Request, res: Response): void => {
    this.vehicles.remove(parseOrThrow(idParamSchema, req.params.id));
    res.status(204).send();
  };
}
