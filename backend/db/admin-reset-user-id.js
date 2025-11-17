import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica le variabili d'ambiente
dotenv.config({ path: join(__dirname, '../.env') });

import getPool from './config.js';

async function resetUserId() {
  const pool = getPool();
  try {
    console.log('🔧 Reset ID utente: ID 2 → ID 1\n');

    // Verifica utente ID 2
    const user2 = await pool.query('SELECT * FROM users WHERE id = 2');
    if (user2.rows.length === 0) {
      console.log('❌ ERRORE: Utente ID 2 non trovato!');
      process.exit(1);
    }

    const userData = user2.rows[0];
    console.log(`📋 Utente trovato: ${userData.email} (ruolo: ${userData.role})`);

    // Verifica se esiste già un utente con ID 1
    const user1 = await pool.query('SELECT id FROM users WHERE id = 1');
    if (user1.rows.length > 0) {
      console.log('⚠️  Utente ID 1 già esistente. Eliminazione...');
      await pool.query('DELETE FROM users WHERE id = 1');
      console.log('✓ Utente ID 1 eliminato\n');
    }

    // Elimina utente ID 2
    console.log('🗑️  Eliminazione utente ID 2...');
    await pool.query('DELETE FROM users WHERE id = 2');
    console.log('✓ Utente ID 2 eliminato\n');

    // Resetta la sequenza a 1
    console.log('🔄 Reset sequenza users_id_seq a 1...');
    await pool.query("SELECT setval('users_id_seq', 1, false)");
    console.log('✓ Sequenza resettata\n');

    // Reinserisci l'utente (avrà ID 1)
    console.log('➕ Reinserimento utente come ID 1...');
    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, email, name, role, created_at`,
      [
        1,
        userData.email,
        userData.password_hash,
        userData.name,
        userData.role,
        userData.created_at,
        new Date(),
      ]
    );

    const newUser = result.rows[0];
    console.log(`✅ Utente reinserito con ID 1: ${newUser.email} (ruolo: ${newUser.role})\n`);

    // Imposta la sequenza al prossimo valore disponibile (2)
    await pool.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users), true)");
    console.log('✓ Sequenza aggiornata al prossimo ID disponibile\n');

    // Mostra tutti gli utenti
    const allUsers = await pool.query('SELECT id, email, name, role, created_at FROM users ORDER BY id');
    console.log('📊 Utenti nel database:');
    console.log('─'.repeat(60));
    allUsers.rows.forEach((user) => {
      console.log(`ID: ${user.id} | Email: ${user.email} | Ruolo: ${user.role || 'N/A'}`);
    });
    console.log('─'.repeat(60));
    console.log(`\n✅ Operazione completata!\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Errore durante l\'operazione:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetUserId();

