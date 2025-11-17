import express from 'express';
import getPool from '../db/config.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Tutte le route richiedono autenticazione e ruolo admin/creator
router.use(authenticateToken);
router.use(requireAdmin());

// Lista tutti gli utenti (solo admin/creator)
router.get('/users', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      status: 'ok',
      data: {
        users: result.rows
      }
    });
  } catch (error) {
    console.error('Errore lista utenti:', error);
    res.status(500).json({
      status: 'error',
      message: 'Errore durante il recupero utenti',
      error: error.message
    });
  }
});

// Statistiche utenti
router.get('/stats', async (req, res) => {
  try {
    const pool = getPool();
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'creator' THEN 1 END) as creators,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as users,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as users_last_7_days,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as users_last_30_days
      FROM users
    `);

    res.json({
      status: 'ok',
      data: {
        stats: stats.rows[0]
      }
    });
  } catch (error) {
    console.error('Errore statistiche:', error);
    res.status(500).json({
      status: 'error',
      message: 'Errore durante il recupero statistiche',
      error: error.message
    });
  }
});

// Assegna ruolo a utente
router.put('/users/:userId/role', async (req, res) => {
  try {
    const pool = getPool();
    const { userId } = req.params;
    const { role } = req.body;

    // Validazione ruolo
    const validRoles = ['user', 'admin', 'creator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Ruolo non valido. Ruoli validi: user, admin, creator'
      });
    }

    // Non permettere di cambiare ruolo del creator (solo se sei creator)
    if (req.user.role !== 'creator' && role === 'creator') {
      return res.status(403).json({
        status: 'error',
        message: 'Solo il creator può assegnare il ruolo creator'
      });
    }

    // Non permettere di rimuovere creator da se stesso
    if (parseInt(userId) === req.user.userId && role !== 'creator') {
      return res.status(400).json({
        status: 'error',
        message: 'Non puoi rimuovere il ruolo creator da te stesso'
      });
    }

    // Verifica che l'utente esista
    const userCheck = await pool.query(
      'SELECT id, role FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Utente non trovato'
      });
    }

    // Aggiorna ruolo
    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, role',
      [role, userId]
    );

    res.json({
      status: 'ok',
      message: 'Ruolo aggiornato con successo',
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Errore aggiornamento ruolo:', error);
    res.status(500).json({
      status: 'error',
      message: 'Errore durante l\'aggiornamento del ruolo',
      error: error.message
    });
  }
});

// Elimina utente (solo creator)
router.delete('/users/:userId', async (req, res) => {
  try {
    const pool = getPool();
    const { userId } = req.params;

    // Solo creator può eliminare utenti
    if (req.user.role !== 'creator') {
      return res.status(403).json({
        status: 'error',
        message: 'Solo il creator può eliminare utenti'
      });
    }

    // Non permettere di eliminare se stesso
    if (parseInt(userId) === req.user.userId) {
      return res.status(400).json({
        status: 'error',
        message: 'Non puoi eliminare il tuo account'
      });
    }

    // Verifica che l'utente esista
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Utente non trovato'
      });
    }

    // Elimina utente (CASCADE eliminerà anche i dati associati)
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({
      status: 'ok',
      message: 'Utente eliminato con successo'
    });
  } catch (error) {
    console.error('Errore eliminazione utente:', error);
    res.status(500).json({
      status: 'error',
      message: 'Errore durante l\'eliminazione dell\'utente',
      error: error.message
    });
  }
});

export default router;

