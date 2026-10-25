import { Request, Response } from 'express';
import { InventoryService } from '../services/inventoryService';
import { idParamSchema, parseOrThrow, purchaseBodySchema, restockBodySchema } from '../validation/schemas';

export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  purchase = (req: Request, res: Response): void => {
    const id = parseOrThrow(idParamSchema, req.params.id);
    const { quantity } = parseOrThrow(purchaseBodySchema, req.body ?? {});
    res.json(this.inventory.purchase(id, quantity));
  };

  restock = (req: Request, res: Response): void => {
    const id = parseOrThrow(idParamSchema, req.params.id);
    const { quantity } = parseOrThrow(restockBodySchema, req.body ?? {});
    res.json(this.inventory.restock(id, quantity));
  };
}
