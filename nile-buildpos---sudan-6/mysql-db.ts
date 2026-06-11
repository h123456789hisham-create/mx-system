import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Load connection details from environment variables
const MYSQL_HOST = process.env.MYSQL_HOST || '';
const MYSQL_PORT = Number(process.env.MYSQL_PORT) || 3306;
const MYSQL_USER = process.env.MYSQL_USER || '';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || '';

// Connection URL fallback (e.g. DATABASE_URL or MYSQL_URL)
const MYSQL_URL = process.env.MYSQL_URL || process.env.DATABASE_URL || '';

let pool: mysql.Pool | null = null;
let isConnected = false;

// Initialize MySQL Pool if config is present
export async function initMySQL(): Promise<boolean> {
  // If no host, database or URL is defined, gracefully disable MySQL and use JSON fallback
  if (!MYSQL_HOST && !MYSQL_URL) {
    console.log('⚠️ [MySQL] No connection details in .env. Falling back to Local JSON Files (Offline Mode).');
    return false;
  }

  try {
    const config: mysql.PoolOptions = MYSQL_URL 
      ? { uri: MYSQL_URL }
      : {
          host: MYSQL_HOST,
          port: MYSQL_PORT,
          user: MYSQL_USER,
          password: MYSQL_PASSWORD,
          database: MYSQL_DATABASE,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        };

    console.log(`🔌 [MySQL] Connecting to database on ${MYSQL_URL ? 'supplied connection string' : `${MYSQL_HOST}:${MYSQL_PORT}`}...`);
    pool = mysql.createPool(config);

    // Test the pool by getting a connection
    const connection = await pool.getConnection();
    console.log('✅ [MySQL] Connection established successfully.');
    connection.release();

    // Create the tables if they don't exist
    await createTables();
    isConnected = true;
    return true;
  } catch (error: any) {
    console.error('❌ [MySQL] Connection failed. Falling back to Local JSON Files.', error.message);
    pool = null;
    isConnected = false;
    return false;
  }
}

// Get raw pool if needed
export function getPool() {
  return pool;
}

// Check connection status
export function isMySQLEnabled(): boolean {
  return isConnected && pool !== null;
}

// Setup and bootstrap tables
async function createTables() {
  if (!pool) return;

  try {
    // 1. Create table for global settings (singular key-value rows)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS global_store (
        store_key VARCHAR(100) PRIMARY KEY,
        data LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Create table for multi-tenant data structures
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenant_store (
        tenant_id VARCHAR(100) NOT NULL,
        entity_key VARCHAR(100) NOT NULL,
        data LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (tenant_id, entity_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('📦 [MySQL] Database tables checked & verified.');
  } catch (error) {
    console.error('❌ [MySQL] Error creating tables:', error);
    throw error;
  }
}

// Helper: load global data state from database
export async function loadGlobalFromDB(dbCache: any) {
  if (!pool) return;
  try {
    const [rows]: any = await pool.query('SELECT store_key, data FROM global_store');
    console.log(`⬇️ [MySQL] Loading global states: ${rows.length} keys retrieved.`);
    for (const row of rows) {
      try {
        const parsed = JSON.parse(row.data);
        dbCache[row.store_key] = parsed;
      } catch (e) {
        console.error(`Error parsing global state for key ${row.store_key}:`, e);
      }
    }
  } catch (err) {
    console.error('❌ [MySQL] Error loading global state, fallback to current memory state:', err);
  }
}

// Helper: save dynamic global keys to store
export async function saveGlobalToDB(key: string, value: any) {
  if (!pool || !isConnected) return;
  try {
    const content = JSON.stringify(value);
    await pool.query(
      'INSERT INTO global_store (store_key, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = ?',
      [key, content, content]
    );
  } catch (err) {
    console.error(`❌ [MySQL] Failed to write global key ${key}:`, err);
  }
}

// Helper: load all tenant profiles into caches
export async function loadAllTenantsFromDB(tenantCache: any) {
  if (!pool) return;
  try {
    const [rows]: any = await pool.query('SELECT tenant_id, entity_key, data FROM tenant_store');
    console.log(`⬇️ [MySQL] Loading multi-tenant states: ${rows.length} entries retrieved.`);
    for (const row of rows) {
      try {
        const tid = row.tenant_id;
        const key = row.entity_key;
        const parsed = JSON.parse(row.data);
        
        if (!tenantCache[tid]) {
          tenantCache[tid] = {};
        }
        tenantCache[tid][key] = parsed;
      } catch (e) {
        console.error(`Error parsing tenant state for tenant ${row.tenant_id} key ${row.entity_key}:`, e);
      }
    }
  } catch (err) {
    console.error('❌ [MySQL] Error loading tenant states:', err);
  }
}

// Helper: save dynamic key-value states per tenant
export async function saveTenantToDB(tenantId: string, key: string, value: any) {
  if (!pool || !isConnected) return;
  try {
    const content = JSON.stringify(value);
    await pool.query(
      'INSERT INTO tenant_store (tenant_id, entity_key, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = ?',
      [tenantId, key, content, content]
    );
  } catch (err) {
    console.error(`❌ [MySQL] Failed to write tenant data for ${tenantId} [${key}]:`, err);
  }
}
