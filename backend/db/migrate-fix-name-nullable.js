import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica le variabili d'ambiente
dotenv.config({ path: join(__dirname, '../.env') });

import getPool from './config.js';

async function migrate() {
  const pool = getPool();
  try {
    console.log('🔧 Migrazione: rendo la colonna name nullable...\n');

    // Verifica se la colonna name esiste e se è NOT NULL
    const columnInfo = await pool.query(`
      SELECT 
        column_name,
        is_nullable,
        data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
      AND column_name = 'name'
    `);

    if (columnInfo.rows.length === 0) {
      console.log('⚠ Colonna name non trovata. Niente da fare.');
      process.exit(0);
    }

    const isNullable = columnInfo.rows[0].is_nullable === 'YES';

    if (isNullable) {
      console.log('✓ Colonna name è già nullable. Niente da fare.');
      process.exit(0);
    }

    // Modifica la colonna per permettere NULL
    console.log('Modifica colonna name per permettere NULL...');
    await pool.query(`
      ALTER TABLE users 
      ALTER COLUMN name DROP NOT NULL
    `);

    console.log('✅ Colonna name ora è nullable!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Errore durante la migrazione:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

