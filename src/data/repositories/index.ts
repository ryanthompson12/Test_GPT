/**
 * Repository factory — the single swap point.
 *
 * Today it returns the SQLite implementation. To migrate to Supabase later,
 * add a `createSupabaseRepositories()` and switch here (e.g. by config/auth);
 * nothing in the UI or feature hooks changes.
 */
import { createSqliteRepositories } from './sqlite';
import type { Repositories } from './types';

let instance: Repositories | null = null;

export function getRepositories(): Repositories {
  if (!instance) {
    instance = createSqliteRepositories();
  }
  return instance;
}

export type { Repositories } from './types';
