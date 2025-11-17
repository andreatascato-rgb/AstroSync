# AstroSync

Web application completamente gratuita e illimitata.

## Quick Start

```bash
# Install dependencies
npm run install:all

# Configure database (create backend/.env with DATABASE_URL)
# Initialize database
cd backend && npm run db:init && cd ..

# Start application
npm run dev
```

Backend: http://localhost:3001  
Frontend: http://localhost:3000

## Tech Stack

- **Backend**: Express (Node.js)
- **Frontend**: React + Vite
- **Database**: Neon PostgreSQL

## Scripts

- `npm run dev` - Start backend + frontend
- `npm run dev:backend` - Start backend only
- `npm run dev:frontend` - Start frontend only
- `npm run install:all` - Install all dependencies

## Documentation

- `docs/PROJECT_CONTEXT.md` - Technical architecture and decisions
- `docs/PROCEDURE.md` - Troubleshooting and procedures
