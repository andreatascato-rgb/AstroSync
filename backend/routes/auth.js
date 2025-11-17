import express from 'express';
import bcrypt from 'bcryptjs';
import getPool from '../db/config.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Registrazione
router.post('/register', async (req, res) => {
  try {
    const pool = getPool();
    console.log('Richiesta registrazione ricevuta');
    const { email, password, name } = req.body;
    console.log('Dati ricevuti:', { email, name: name || 'non fornito' });

    // Validazione input
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email e password sono obbligatorie'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'La password deve essere di almeno 6 caratteri'
      });
    }

    // Verifica se email già esiste
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Email già registrata'
      });
    }

    // Verifica se è il primo utente (diventa creator)
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const isFirstUser = parseInt(userCount.rows[0].count) === 0;
    const role = isFirstUser ? 'creator' : 'user';
    console.log(`Utente ${isFirstUser ? 'primo' : 'successivo'} - Ruolo: ${role}`);

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crea utente
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
      [email.toLowerCase(), passwordHash, name || null, role]
    );

    const user = result.rows[0];
    console.log('Utente creato:', { id: user.id, email: user.email, role: user.role });

    // Genera token
    const token = generateToken(user.id, user.email, user.role);
    console.log('Token generato con successo');

    res.status(201).json({
      status: 'ok',
      message: isFirstUser ? 'Registrazione completata - Sei il creator!' : 'Registrazione completata',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Errore registrazione:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Errore durante la registrazione',
      error: error.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const pool = getPool();
    const { email, password } = req.body;

    // Validazione input
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email e password sono obbligatorie'
      });
    }

    // Trova utente
    const result = await pool.query(
      'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Email o password non corretti'
      });
    }

    const user = result.rows[0];

    // Verifica password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Email o password non corretti'
      });
    }

    // Genera token
    const token = generateToken(user.id, user.email, user.role);

    res.json({
      status: 'ok',
      message: 'Login completato',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Errore login:', error);
    res.status(500).json({
      status: 'error',
      message: 'Errore durante il login',
      error: error.message
    });
  }
});

// Verifica token (per frontend)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Utente non trovato'
      });
    }

    res.json({
      status: 'ok',
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Errore verifica token:', error);
    res.status(500).json({
      status: 'error',
      message: 'Errore durante la verifica',
      error: error.message
    });
  }
});

export default router;

