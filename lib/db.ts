import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DB_URL });

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function initDB() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL DEFAULT 'guest',
      merit BIGINT NOT NULL DEFAULT 0,
      is_guest BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS merit_sync_log (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      delta BIGINT NOT NULL,
      client_timestamp TIMESTAMPTZ NOT NULL,
      server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}
