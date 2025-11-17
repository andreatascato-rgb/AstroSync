import pg from 'pg';

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL non trovato nel file .env');
    }
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
        rejectUnauthorized: false
      }
    });
    
    // Test connessione al caricamento
    pool.on('error', (err) => {
      console.error('Errore imprevisto nel pool del database:', err);
    });
  }
  
  return pool;
}

export default getPool;

