# Project Context - AstroSync

## Overview
Web application astrologica completamente gratuita e illimitata, multi-utente. Stack: Express backend, React frontend, Neon PostgreSQL, Swiss Ephemeris per calcoli astrologici.

**Funzionalità principale**: Registro persone per calcolare e confrontare temi natali, sinastrie, transiti ed effemeridi.

**Requisiti chiave:**
- ✅ Completamente gratuita (tutti i servizi free tier)
- ✅ Uso illimitato (no limiti di utenti o operazioni)
- ✅ Multi-utente (ogni utente ha i propri dati)
- ✅ Hosting gratuito (Vercel/Netlify frontend, Render/Railway backend)

## Architecture Decisions

### Backend (Express)
- **Entry point**: `backend/server.js`
- **Database config**: `backend/db/config.js` - Esporta funzione `getPool()` per lazy initialization
- **Pattern**: dotenv.config() chiamato PRIMA di importare pool per evitare errori DATABASE_URL
- **Port**: 3001
- **CORS**: Abilitato per tutte le origini
- **Error handling**: Middleware globale per catch errori, try-catch in ogni route

### Frontend (React + Vite)
- **Entry point**: `frontend/src/main.jsx`
- **App component**: `frontend/src/App.jsx`
- **Port**: 3000
- **Proxy**: Configurato in `vite.config.js` per `/api` -> `http://localhost:3001`
- **State management**: useState/useEffect (no Redux/Context per ora)

### Database (Neon PostgreSQL)
- **Connection**: Pool pattern con pg library
- **SSL**: Richiesto (rejectUnauthorized: false per Neon)
- **Initialization**: Script `backend/db/init.js` esegue `init.sql`
- **Tables**: `users` (esempio iniziale)

## File Structure

```
AstroSync/
├── backend/
│   ├── db/
│   │   ├── config.js       # Pool factory function (getPool)
│   │   ├── init.js         # Database initialization script
│   │   └── init.sql        # SQL schema
│   ├── .env                # DATABASE_URL, PORT (gitignored)
│   ├── server.js           # Express app setup
│   └── package.json        # Express, pg, cors, dotenv
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main component
│   │   └── main.jsx        # React entry
│   ├── vite.config.js      # Proxy config per /api
│   └── package.json        # React, Vite
├── docs/
│   ├── PROJECT_CONTEXT.md  # Questo file
│   ├── PROCEDURE.md        # Troubleshooting e procedure
│   └── README.md           # User-facing docs
└── package.json            # Root: concurrently per dev script
```

## Critical Implementation Details

### Database Connection Pattern
**Problema risolto**: In ES modules, gli import sono "hoisted" quindi pool veniva creato prima che dotenv caricasse variabili.

**Soluzione**: 
- `config.js` esporta funzione `getPool()` invece di pool diretto
- `server.js` chiama `dotenv.config()` PRIMA di importare getPool
- Pool creato lazy quando getPool() viene chiamato

```javascript
// backend/db/config.js
export function getPool() {
  if (!pool) {
    // Crea pool solo quando necessario, dopo dotenv.config()
  }
  return pool;
}
```

### Environment Variables
- **File**: `backend/.env` (gitignored)
- **Required**: 
  - `DATABASE_URL` - Connection string Neon PostgreSQL
  - `PORT` - Server port (default 3001)
  - `JWT_SECRET` - Secret key per JWT tokens (generare chiave casuale per produzione)
- **Loading**: dotenv.config() con path esplicito per evitare problemi

### API Response Format
Standardizzato:
```javascript
// Success
{ status: 'ok', message: '...', data: {...} }

// Error
{ status: 'error', message: '...', error: '...' }
```

## Known Issues & Solutions

### EADDRINUSE (Port in use)
**Cause**: Processo Node.js precedente ancora attivo
**Fix**: `Get-Process -Name node | Stop-Process -Force` (PowerShell)

### DATABASE_URL not found
**Cause**: dotenv.config() chiamato dopo import pool
**Fix**: Chiamare dotenv.config() PRIMA di importare getPool

### 500 Errors in Frontend
**Cause**: Backend non in esecuzione o errore nel codice
**Fix**: Verificare backend su :3001/api/health, controllare log terminale

## Development Workflow

1. **Start**: `npm run dev` (root) - avvia backend + frontend con concurrently
2. **Backend only**: `cd backend && npm run dev`
3. **Frontend only**: `cd frontend && npm run dev`
4. **DB init**: `cd backend && npm run db:init`

## Dependencies

### Backend
- express@^4.18.2
- pg@^8.11.3 (PostgreSQL client)
- cors@^2.8.5
- dotenv@^16.3.1

### Frontend
- react@^19.2.0
- react-dom@^19.2.0
- vite@^7.2.2

### Root
- concurrently@^8.2.2 (per avviare backend+frontend insieme)

## Code Conventions

- **ES Modules**: Tutti i file usano `import/export` (type: "module" in package.json)
- **Naming**: camelCase per file JS, PascalCase per componenti React
- **Error handling**: Sempre try-catch in route async, log errori in console
- **Database queries**: Usare pool.query() con parametri per prevenire SQL injection

## Current State

✅ Backend funzionante su :3001
✅ Frontend funzionante su :3000
✅ Database Neon connesso
✅ Tabella `users` creata
✅ Health check endpoints funzionanti
✅ Proxy frontend->backend configurato

## Multi-User Architecture

### Authentication Strategy
**Approccio**: JWT (JSON Web Tokens) - stateless, scalabile, gratuito
- **Library**: `jsonwebtoken` + `bcryptjs` per password hashing
- **Storage**: Token in localStorage (frontend), no session server-side
- **Flow**: 
  1. User registra/login → backend genera JWT
  2. Frontend salva JWT in localStorage
  3. Ogni richiesta API include JWT in header `Authorization: Bearer <token>`
  4. Backend verifica JWT in middleware

### User Data Isolation
- Ogni tabella dati include `user_id` foreign key
- Query sempre filtrate per `user_id` (middleware aggiunge automaticamente)
- Nessun utente può accedere ai dati di altri utenti

### Database Schema (Multi-User)
```sql
-- Users table (già esistente, da estendere)
users (
  id, email, password_hash, created_at
)

-- Esempio: ogni tabella dati include user_id
items (
  id, user_id, name, ...,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

## Hosting Strategy (Free Tier)

### Frontend
**Opzioni gratuite:**
- **Vercel** (consigliato): Deploy automatico da Git, CDN globale, SSL incluso
- **Netlify**: Simile a Vercel, buona alternativa
- **Limiti**: Illimitati per progetti personali

### Backend
**Opzioni gratuite:**
- **Render**: 750 ore/mese gratis, si spegne dopo inattività (si riaccende automaticamente)
- **Railway**: $5 crediti gratis/mese (sufficiente per uso moderato)
- **Fly.io**: 3 VM gratis, buona per sempre-on
- **Limiti**: Render ha cold start dopo inattività, ma gratuito

### Database
- **Neon**: Già configurato, free tier generoso (0.5GB storage, sufficiente per iniziare)

## Next Steps (TODO)
- [ ] Implementare autenticazione JWT (registrazione/login)
- [ ] Creare middleware auth per proteggere route
- [ ] Estendere schema database con user_id in tutte le tabelle dati
- [ ] Creare struttura routes/ per organizzare API
- [ ] Creare struttura components/ per React (Login, Register, Dashboard)
- [ ] Aggiungere validazione input (email, password)
- [ ] Preparare per deploy su hosting gratuito
- [ ] Aggiungere logging strutturato

