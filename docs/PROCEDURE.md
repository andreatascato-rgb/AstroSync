# Troubleshooting & Procedures

## Port Management

### Automatic Port Cleanup
Lo script `scripts/check-ports.js` viene eseguito automaticamente quando usi `npm run dev`. Esso:
- Verifica se le porte 3000 e 3001 sono occupate
- Libera automaticamente le porte se necessario
- Avvia l'app solo quando le porte sono libere

### Manual Port Cleanup
Se hai problemi con le porte, puoi eseguire manualmente:
```bash
npm run check-ports
```

Questo libera le porte senza avviare l'app.

### Kill All Node Processes
Se lo script automatico non funziona:
```powershell
# Windows PowerShell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

## Common Issues

### Issue: EADDRINUSE - Port already in use
**Error**: `Error: listen EADDRINUSE: address already in use :::3001`
**Root cause**: Node.js process still running from previous session
**Solution**:
- Lo script `check-ports.js` dovrebbe gestirlo automaticamente
- Se persiste: `npm run check-ports` o kill manuale dei processi Node.js

### Issue: DATABASE_URL not found
**Error**: `ERRORE: DATABASE_URL non trovato nel file .env`
**Root cause**: 
1. File .env non esiste in backend/
2. dotenv.config() chiamato dopo import pool (risolto con lazy init pattern)
**Solution**:
- Verificare `backend/.env` esiste
- Verificare formato: `DATABASE_URL=postgresql://...` (no spaces around =)
- Riavviare server

### Issue: 500 Internal Server Error in Frontend
**Symptoms**: Browser console shows "Failed to load resource: 500"
**Root cause**: Backend error (check terminal logs)
**Debug steps**:
1. Verify backend running: `curl http://localhost:3001/api/health`
2. Check backend terminal for error messages
3. Verify CORS enabled in backend
4. Check database connection: `curl http://localhost:3001/api/db/test`

### Issue: Database connection fails
**Error**: Connection timeout or refused
**Root cause**: 
- Invalid DATABASE_URL
- Database not active
- SSL configuration wrong
**Solution**:
- Verify DATABASE_URL format includes `?sslmode=require`
- Check Neon dashboard for database status
- Verify SSL config in `db/config.js` (rejectUnauthorized: false for Neon)

## File Creation Patterns

### New API Route
**Location**: `backend/routes/[name]Route.js`
**Pattern**:
```javascript
import express from 'express';
import getPool from '../db/config.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT ...');
    res.json({ status: 'ok', data: result.rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
```
**Registration**: Add to `server.js`: `app.use('/api/[path]', router)`

### New React Component
**Location**: `frontend/src/components/[Name]Component.jsx`
**Pattern**:
```jsx
import { useState, useEffect } from 'react';

function NameComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/endpoint')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Error loading data</div>;

  return <div>{/* JSX */}</div>;
}

export default NameComponent;
```

### New Database Table
**Location**: `backend/db/init.sql` (append)
**Pattern**:
```sql
CREATE TABLE IF NOT EXISTS table_name (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  column_name TYPE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_table_name_user_id ON table_name(user_id);
```
**After adding**: Run `npm run db:init` in backend/

## Debug Procedures

### Backend Debugging
- **Logs**: Check terminal where `npm run dev` is running
- **Test endpoint**: `curl http://localhost:3001/api/[endpoint]`
- **Database query**: Add console.log(result.rows) in route handler
- **Error details**: Check error.message in catch block

### Frontend Debugging
- **Console**: F12 -> Console tab
- **Network**: F12 -> Network tab (check API calls)
- **React DevTools**: Install extension for component inspection
- **State**: Add console.log(state) in useEffect

### Database Debugging
- **Test connection**: `curl http://localhost:3001/api/db/test`
- **Query directly**: Use Neon SQL editor in dashboard
- **Check tables**: `SELECT * FROM information_schema.tables WHERE table_schema = 'public'`

## Environment Variables

### Backend (.env)
Required variables:
```
PORT=3001
DATABASE_URL=postgresql://...
JWT_SECRET=your-super-secret-key-change-in-production
```

**JWT_SECRET**: Genera una chiave casuale sicura per produzione:
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Setup Verification Checklist

After initial setup, verify:
- [ ] `npm run install:all` completed without errors
- [ ] `backend/.env` exists with DATABASE_URL and JWT_SECRET
- [ ] `npm run db:init` created tables successfully
- [ ] `npm run dev` starts both servers (check ports are free)
- [ ] `http://localhost:3001/api/health` returns 200
- [ ] `http://localhost:3001/api/db/test` returns 200 with data
- [ ] `http://localhost:3000` shows frontend with login/register

## Code Quality Checks

Before committing:
- [ ] No console.log in production code (use proper logging)
- [ ] All async functions have try-catch
- [ ] API responses follow standard format
- [ ] Database queries use parameterized queries (no string concatenation)
- [ ] Error messages are user-friendly (no stack traces exposed)

## Git Workflow

- **Branch**: Work on feature branches
- **Commits**: Descriptive messages
- **Ignore**: `.env` files, `node_modules/`, `dist/`
- **Before push**: Test locally with `npm run dev`
