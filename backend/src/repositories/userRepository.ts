import { DB } from '../db/database';
import { ConflictError } from '../errors';
import { NewUser, Role, User } from '../types';
import { UserRepository } from './interfaces';

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: string;
}

const toUser = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  passwordHash: row.password_hash,
  role: row.role,
  createdAt: row.created_at,
});

export class SqliteUserRepository implements UserRepository {
  constructor(private readonly db: DB) {}

  create(user: NewUser): User {
    try {
      const info = this.db
        .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
        .run(user.name, user.email, user.passwordHash, user.role);
      return this.findById(Number(info.lastInsertRowid)) as User;
    } catch (err) {
      // Covers the race between the service's "email exists?" check and the insert.
      if ((err as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new ConflictError('Email is already registered');
      }
      throw err;
    }
  }

  findByEmail(email: string): User | undefined {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
    return row ? toUser(row) : undefined;
  }

  findById(id: number): User | undefined {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    return row ? toUser(row) : undefined;
  }
}
