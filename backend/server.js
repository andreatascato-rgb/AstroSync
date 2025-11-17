import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica le variabili d'ambiente PRIMA di importare il pool
dotenv.config({ path: join(__dirname, '.env') });

// Verifica che DATABASE_URL sia presente
if (!process.env.DATABASE_URL) {
  console.error('ERRORE: DATABASE_URL non trovato nel file .env');
  process.exit(1);
}

import getPool from './db/config.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  try {
    res.json({ status: 'ok', message: 'AstroSync Backend is running' });
  } catch (error) {
    console.error('Errore in /api/health:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Errore interno',
      error: error.message 
    });
  }
});

app.get('/api/db/test', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    res.json({ 
      status: 'ok', 
      message: 'Database connesso correttamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Errore in /api/db/test:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Errore connessione database',
      error: error.message 
    });
  }
});

// Auth routes
app.use('/api/auth', authRoutes);

// Admin routes (solo per creator/admin)
app.use('/api/admin', adminRoutes);

// Middleware per gestire errori (deve essere DOPO tutte le route)
app.use((err, req, res, next) => {
  console.error('Errore middleware:', err);
  console.error('Stack:', err.stack);
  res.status(500).json({ 
    status: 'error', 
    message: 'Errore interno del server',
    error: err.message 
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Gestione errori del server
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n✗ ERRORE: Porta ${PORT} già in uso!`);
    console.error('Esegui: npm run check-ports per liberare le porte\n');
    process.exit(1);
  } else {
    console.error('Errore server:', err);
    process.exit(1);
  }
});

