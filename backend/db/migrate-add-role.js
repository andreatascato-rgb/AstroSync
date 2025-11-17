import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica le variabili d'ambiente
dotenv.config({ path: join(__dirname, '../.env') });

import getPool from './config.js';

async function migrate() {
  try {
    console.log('Aggiunta campo role alla tabella users...');
    const pool = getPool();
    
    // Aggiungi campo role se non esiste
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'
    `);
    
    // Aggiorna utenti esistenti senza role (imposta 'user' come default)
    await pool.query(`
      UPDATE users 
      SET role = 'user' 
      WHERE role IS NULL
    `);
    
    // Verifica se c'è almeno un utente, se no il primo sarà creator
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const count = parseInt(userCount.rows[0].count);
    
    if (count === 1) {
      // Se c'è un solo utente, è il creator
      await pool.query(`
        UPDATE users 
        SET role = 'creator' 
        WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)
      `);
      console.log('✓ Primo utente impostato come creator');
    }
    
    // Crea indice se non esiste
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)
    `);
    
    console.log('✓ Migrazione completata!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Errore durante la migrazione:', error.message);
    process.exit(1);
  }
}

migrate();

