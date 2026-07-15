import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'waitlist.db');
let db;
export function getDb() {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL, stripe_customer_id TEXT, subscription_status TEXT DEFAULT 'inactive', subscription_id TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS campaigns (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, headline TEXT DEFAULT '', description TEXT DEFAULT '', bg_color TEXT DEFAULT '#0a0a0f', text_color TEXT DEFAULT '#e8e8f0', accent_color TEXT DEFAULT '#6366f1', logo_url TEXT DEFAULT '', goal INTEGER DEFAULT 100, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')), FOREIGN KEY (user_id) REFERENCES users(id));
      CREATE TABLE IF NOT EXISTS signups (id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL, email TEXT NOT NULL, name TEXT DEFAULT '', referral_code TEXT, referred_by TEXT, position INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE);
    `);
  }
  return db;
}