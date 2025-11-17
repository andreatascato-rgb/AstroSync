import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica le variabili d'ambiente
dotenv.config({ path: join(__dirname, '../.env') });

import getPool from './config.js';

async function initDatabase() {
  try {
    console.log('Connessione al database...');
    const pool = getPool();
    
    // Leggi il file SQL
    const sqlFile = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Rimuovi i commenti (linee che iniziano con --)
    const cleanedSql = sql
      .split('\n')
      .map(line => {
        const commentIndex = line.indexOf('--');
        if (commentIndex >= 0) {
          return line.substring(0, commentIndex);
        }
        return line;
      })
      .join('\n');
    
    // Dividi per statement (separati da ;)
    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`Esecuzione di ${statements.length} statement SQL...`);
    
    // Esegui ogni statement
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
        console.log('✓ Statement eseguito');
      }
    }
    
    console.log('✓ Database inizializzato con successo!');
    
    // Verifica che le tabelle siano state create
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\nTabelle create:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Errore durante l\'inizializzazione:', error.message);
    process.exit(1);
  }
}

initDatabase();

