import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      status: 'error', 
      message: 'Token di autenticazione mancante' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Token non valido o scaduto' 
      });
    }
    req.user = user; // Aggiunge user info alla request
    next();
  });
}

export function generateToken(userId, email, role) {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '7d' } // Token valido 7 giorni
  );
}

// Middleware per verificare ruolo
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Autenticazione richiesta'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Permessi insufficienti'
      });
    }

    next();
  };
}

// Middleware per verificare se è creator o admin
export function requireAdmin() {
  return requireRole('creator', 'admin');
}

