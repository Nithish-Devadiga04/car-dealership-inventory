import { DB } from '../db/database';
import { NewVehicle, Vehicle, VehicleSearchFilters, VehicleUpdate } from '../types';
import { VehicleRepository } from './interfaces';

interface VehicleRow {
  id: number;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

const toVehicle = (row: VehicleRow): Vehicle => ({
  id: row.id,
  make: row.make,
  model: row.model,
  category: row.category,
  price: row.price,
  quantity: row.quantity,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** Escapes LIKE wildcards so user input such as "50%" is matched literally. */
const escapeLike = (value: string): string => value.replace(/[\\%_]/g, '\\$&');

/** Whitelist of updatable columns: keeps dynamic SQL safe from injection. */
const UPDATABLE_COLUMNS: ReadonlyArray<keyof NewVehicle> = ['make', 'model', 'category', 'price', 'quantity'];

const ORDER_BY = 'ORDER BY make COLLATE NOCASE, model COLLATE NOCASE, id';

export class SqliteVehicleRepository implements VehicleRepository {
  constructor(private readonly db: DB) {}

  create(vehicle: NewVehicle): Vehicle {
    const info = this.db
      .prepare('INSERT INTO vehicles (make, model, category, price, quantity) VALUES (?, ?, ?, ?, ?)')
      .run(vehicle.make, vehicle.model, vehicle.category, vehicle.price, vehicle.quantity);
    return this.findById(Number(info.lastInsertRowid)) as Vehicle;
  }

  findAll(): Vehicle[] {
    const rows = this.db.prepare(`SELECT * FROM vehicles ${ORDER_BY}`).all() as VehicleRow[];
    return rows.map(toVehicle);
  }

  findById(id: number): Vehicle | undefined {
    const row = this.db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id) as VehicleRow | undefined;
    return row ? toVehicle(row) : undefined;
  }

  search(filters: VehicleSearchFilters): Vehicle[] {
    const clauses: string[] = [];
    const params: Array<string | number> = [];

    // SQLite's LIKE is case-insensitive for ASCII, giving us case-insensitive "contains" matching.
    const addLike = (column: 'make' | 'model' | 'category', value?: string): void => {
      if (value) {
        clauses.push(`${column} LIKE ? ESCAPE '\\'`);
        params.push(`%${escapeLike(value)}%`);
      }
    };

    addLike('make', filters.make);
    addLike('model', filters.model);
    addLike('category', filters.category);

    if (filters.minPrice !== undefined) {
      clauses.push('price >= ?');
      params.push(filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      clauses.push('price <= ?');
      params.push(filters.maxPrice);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = this.db.prepare(`SELECT * FROM vehicles ${where} ${ORDER_BY}`).all(...params) as VehicleRow[];
    return rows.map(toVehicle);
  }

  update(id: number, patch: VehicleUpdate): Vehicle | undefined {
    const columns = UPDATABLE_COLUMNS.filter((column) => patch[column] !== undefined);
    if (columns.length === 0) {
      return this.findById(id);
    }

    const assignments = columns.map((column) => `${column} = ?`).join(', ');
    const values = columns.map((column) => patch[column] as string | number);
    const info = this.db
      .prepare(`UPDATE vehicles SET ${assignments}, updated_at = datetime('now') WHERE id = ?`)
      .run(...values, id);

    return info.changes === 1 ? this.findById(id) : undefined;
  }

  delete(id: number): boolean {
    return this.db.prepare('DELETE FROM vehicles WHERE id = ?').run(id).changes === 1;
  }

  decrementQuantity(id: number, amount: number): boolean {
    // Single atomic statement: the stock check and the decrement can't be interleaved
    // with another purchase, so we never oversell even under concurrent requests.
    const info = this.db
      .prepare(
        `UPDATE vehicles SET quantity = quantity - ?, updated_at = datetime('now')
         WHERE id = ? AND quantity >= ?`,
      )
      .run(amount, id, amount);
    return info.changes === 1;
  }

  incrementQuantity(id: number, amount: number): boolean {
    const info = this.db
      .prepare(`UPDATE vehicles SET quantity = quantity + ?, updated_at = datetime('now') WHERE id = ?`)
      .run(amount, id);
    return info.changes === 1;
  }
}
