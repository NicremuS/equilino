import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export type DbKey = 'properties' | 'tenants' | 'payments' | 'contracts' | 'tickets' | 'notifications' | 'inspections' | 'chartData' | 'occupancyData' | 'paymentStatusData' | 'user' | 'users' | 'notices' | 'payment_logs' | 'rent_reminders' | 'digital_contracts' | 'contract_templates';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = Record<DbKey, any>;

export function readDb(): Db {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as Db;
  } catch (err) {
    throw new Error(`Failed to read database: ${err instanceof Error ? err.message : err}`);
  }
}

export function writeDb(data: Db): void {
  try {
    const tmp = DB_PATH + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, DB_PATH);
  } catch (err) {
    throw new Error(`Failed to write database: ${err instanceof Error ? err.message : err}`);
  }
}

export function getCollection<T>(key: DbKey): T[] {
  return readDb()[key] as T[];
}

export function getById<T extends { id: string }>(key: DbKey, id: string): T | null {
  const items = getCollection<T>(key);
  return items.find((item) => item.id === id) ?? null;
}

export function createItem<T extends { id: string }>(key: DbKey, item: T): T {
  const db = readDb();
  (db[key] as T[]).push(item);
  writeDb(db);
  return item;
}

export function updateItem<T extends { id: string }>(key: DbKey, id: string, patch: Partial<T>): T | null {
  const db = readDb();
  const items = db[key] as T[];
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch };
  writeDb(db);
  return items[idx];
}

export function deleteItem(key: DbKey, id: string): boolean {
  const db = readDb();
  const items = db[key] as { id: string }[];
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  writeDb(db);
  return true;
}
