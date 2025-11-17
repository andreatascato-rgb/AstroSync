import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica le variabili d'ambiente
dotenv.config({ path: join(__dirname, '../.env') });

import getPool from './config.js';

async function adminTask() {
  const pool = getPool();
  try {
    console.log('🔧 Operazioni amministrative database...\n');

    // Verifica utente ID 1
    const user1 = await pool.query('SELECT id, email, role FROM users WHERE id = 1');
    if (user1.rows.length > 0) {
      console.log(`📋 Utente ID 1 trovato: ${user1.rows[0].email} (ruolo: ${user1.rows[0].role})`);
      console.log('🗑️  Eliminazione utente ID 1...');
      await pool.query('DELETE FROM users WHERE id = 1');
      console.log('✅ Utente ID 1 eliminato\n');
    } else {
      console.log('⚠️  Utente ID 1 non trovato\n');
    }

    // Verifica utente ID 2
    const user2 = await pool.query('SELECT id, email, role FROM users WHERE id = 2');
    if (user2.rows.length === 0) {
      console.log('❌ ERRORE: Utente ID 2 non trovato!');
      process.exit(1);
    }

    console.log(`📋 Utente ID 2 trovato: ${user2.rows[0].email} (ruolo attuale: ${user2.rows[0].role})`);
    console.log('👑 Impostazione ruolo creator per utente ID 2...');
    
    await pool.query('UPDATE users SET role = $1 WHERE id = 2', ['creator']);
    
    // Verifica
    const updated = await pool.query('SELECT id, email, role FROM users WHERE id = 2');
    console.log(`✅ Utente ID 2 ora è: ${updated.rows[0].email} (ruolo: ${updated.rows[0].role})\n`);

    // Mostra tutti gli utenti rimanenti
    const allUsers = await pool.query('SELECT id, email, name, role, created_at FROM users ORDER BY id');
    console.log('📊 Utenti nel database:');
    console.log('─'.repeat(60));
    allUsers.rows.forEach(user => {
      console.log(`ID: ${user.id} | Email: ${user.email} | Ruolo: ${user.role || 'N/A'}`);
    });
    console.log('─'.repeat(60));
    console.log(`\n✅ Operazioni completate!\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Errore durante le operazioni:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

adminTask();

