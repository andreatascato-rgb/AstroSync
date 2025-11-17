# Deployment Guide - Free Hosting

## Overview
Strategia di deployment completamente gratuita per AstroSync multi-utente.

## Frontend Deployment (Vercel - Recommended)

### Setup
1. Push code su GitHub
2. Vercel → New Project → Import from GitHub
3. Root directory: `frontend`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Environment variables: Nessuna necessaria (API calls vanno al backend)

### Configurazione
- **Framework Preset**: Vite
- **Node Version**: 18.x o superiore
- **Auto-deploy**: Abilitato (deploy su ogni push)

### Environment Variables (se necessario)
```
VITE_API_URL=https://your-backend.onrender.com
```

## Backend Deployment (Render - Recommended)

### Setup
1. Push code su GitHub
2. Render → New → Web Service
3. Connect GitHub repository
4. Configurazione:
   - **Name**: astrosync-backend
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Environment Variables
```
DATABASE_URL=postgresql://... (da Neon)
PORT=10000 (Render usa porta dinamica, ma Express legge da env)
NODE_ENV=production
```

### Note Importanti
- **Cold Start**: Render spegne il servizio dopo 15 min di inattività
- **Wake Time**: Primo request dopo cold start può richiedere 30-60 secondi
- **Workaround**: Usare servizio di ping (UptimeRobot gratuito) per keep-alive

## Database (Neon)

### Setup
- Già configurato
- Connection string disponibile nel dashboard Neon
- **Free Tier**: 0.5GB storage, sufficiente per migliaia di utenti

### Backup
- Neon fa backup automatici
- Export manuale disponibile nel dashboard

## Alternative Hosting Options

### Frontend Alternatives
- **Netlify**: Simile a Vercel, deploy da Git
- **GitHub Pages**: Gratuito ma richiede build manuale

### Backend Alternatives
- **Railway**: $5 crediti/mese gratis, sempre-on (migliore per produzione)
- **Fly.io**: 3 VM gratis, sempre-on, buona performance
- **Heroku**: Non più gratuito (escludere)

## Post-Deployment Checklist

- [ ] Frontend deployato e accessibile
- [ ] Backend deployato e risponde a /api/health
- [ ] Database connection funzionante
- [ ] CORS configurato per dominio frontend
- [ ] Environment variables configurate
- [ ] SSL/HTTPS attivo (automatico su Vercel/Render)
- [ ] Test registrazione/login funzionante
- [ ] Test creazione dati utente funzionante

## Monitoring (Free)

- **UptimeRobot**: Monitora uptime backend (gratuito, 50 monitors)
- **Sentry**: Error tracking (free tier generoso)
- **Neon Dashboard**: Monitor database usage

## Cost Analysis

**Totale mensile: $0**
- Frontend (Vercel): $0
- Backend (Render): $0 (con cold start) o Railway $0 (con crediti)
- Database (Neon): $0 (free tier)
- Monitoring: $0

**Limiti da considerare:**
- Render: 750 ore/mese (sufficiente se non sempre-on)
- Neon: 0.5GB storage (espandibile se necessario)
- Vercel: Bandwidth illimitato per progetti personali

