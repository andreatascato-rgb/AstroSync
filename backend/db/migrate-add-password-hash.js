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
    console.log('🔧 Migrazione database: aggiunta colonne mancanti...\n');

    // Verifica se la tabella users esiste
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('⚠ Tabella users non esiste. Esegui prima: npm run db:init');
      process.exit(1);
    }

    // Verifica colonne esistenti
    const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
    `);

    const existingColumns = columns.rows.map(r => r.column_name);
    console.log('Colonne esistenti:', existingColumns.join(', '));

    // Aggiungi password_hash se non esiste
    if (!existingColumns.includes('password_hash')) {
      console.log('\n➕ Aggiunta colonna password_hash...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN password_hash VARCHAR(255)
      `);
      console.log('✓ Colonna password_hash aggiunta');
    } else {
      console.log('✓ Colonna password_hash già presente');
    }

    // Aggiungi role se non esiste
    if (!existingColumns.includes('role')) {
      console.log('\n➕ Aggiunta colonna role...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(20) DEFAULT 'user'
      `);
      console.log('✓ Colonna role aggiunta');
    } else {
      console.log('✓ Colonna role già presente');
    }

    // Aggiungi name se non esiste
    if (!existingColumns.includes('name')) {
      console.log('\n➕ Aggiunta colonna name...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN name VARCHAR(255)
      `);
      console.log('✓ Colonna name aggiunta');
    } else {
      console.log('✓ Colonna name già presente');
    }

    // Aggiungi created_at se non esiste
    if (!existingColumns.includes('created_at')) {
      console.log('\n➕ Aggiunta colonna created_at...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✓ Colonna created_at aggiunta');
    } else {
      console.log('✓ Colonna created_at già presente');
    }

    // Aggiungi updated_at se non esiste
    if (!existingColumns.includes('updated_at')) {
      console.log('\n➕ Aggiunta colonna updated_at...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✓ Colonna updated_at aggiunta');
    } else {
      console.log('✓ Colonna updated_at già presente');
    }

    // Crea indici se non esistono
    console.log('\n📑 Verifica indici...');
    
    const indexes = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'users' 
      AND schemaname = 'public'
    `);
    const existingIndexes = indexes.rows.map(r => r.indexname);

    if (!existingIndexes.some(idx => idx.includes('email'))) {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
      console.log('✓ Indice idx_users_email creato');
    }

    if (!existingIndexes.some(idx => idx.includes('role'))) {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
      console.log('✓ Indice idx_users_role creato');
    }

    // Verifica se ci sono utenti esistenti senza password_hash
    const usersWithoutPassword = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE password_hash IS NULL
    `);

    const count = parseInt(usersWithoutPassword.rows[0].count);
    if (count > 0) {
      console.log(`\n⚠ ATTENZIONE: ${count} utente/i esistente/i senza password_hash.`);
      console.log('   Questi utenti dovranno reimpostare la password o essere eliminati.');
    }

    // Verifica se c'è almeno un utente, se no il primo sarà creator
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalCount = parseInt(userCount.rows[0].count);
    
    if (totalCount === 1) {
      // Se c'è un solo utente, è il creator
      await pool.query(`
        UPDATE users 
        SET role = 'creator' 
        WHERE id = (SELECT id FROM users ORDER BY created_at ASC NULLS LAST LIMIT 1)
        AND (role IS NULL OR role = 'user')
      `);
      console.log('\n✓ Primo utente impostato come creator');
    }

    console.log('\n✅ Migrazione completata con successo!');
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

