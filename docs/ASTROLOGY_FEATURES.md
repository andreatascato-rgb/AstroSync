# AstroSync - Funzionalità Astrologiche

## Overview
App astrologica multi-utente ispirata ad Astro-Seek.com con calcoli natali, effemeridi e gestione persone.

## Funzionalità Principali

### 1. Tema Natale (Birth Chart)
- **Input**: Data, ora, luogo di nascita
- **Output**: Carta natale completa con:
  - Posizioni planetarie (Sole, Luna, Mercurio, Venere, Marte, Giove, Saturno, Urano, Nettuno, Plutone)
  - Case astrologiche (12 case)
  - Ascendente
  - Aspetti tra pianeti
  - Segni zodiacali
- **Storage**: Salvare carte natali nel database per accesso rapido

### 2. Cielo del Momento (Current Sky)
- **Input**: Data/ora corrente (o data/ora specifica)
- **Output**: Posizioni planetarie attuali
- **Uso**: Transiti, cielo del momento per confronti

### 3. Posizione Pianeti nella Storia
- **Input**: Data/ora storica
- **Output**: Posizioni planetarie per quella data
- **Uso**: Analisi storiche, eventi passati

### 4. Effemeridi
- **Input**: Range di date (es. mese, anno)
- **Output**: Tabella con posizioni planetarie giorno per giorno
- **Formato**: Tabella esportabile (CSV/JSON)

### 5. Registro Persone (CORE FEATURE)
- **Funzionalità**: Database personale di persone per analisi astrologiche
- **Dati salvati**: Nome, data/ora/luogo nascita, note, relazione (es. "Io", "Mamma", "Amico", "Celebrità")
- **Multi-utente**: Ogni utente vede solo le proprie persone salvate
- **Operazioni**: Aggiungere, modificare, eliminare, cercare, categorizzare
- **Uso principale**: 
  - Salvare se stessi e altre persone importanti
  - Calcolare temi natali di qualsiasi persona salvata
  - Fare sinastria/composite tra due persone salvate
  - Vedere transiti su qualsiasi persona salvata
  - Analizzare relazioni e compatibilità

## Database Schema

### Tabella: persons
```sql
CREATE TABLE persons (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TIME,  -- NULL se ora sconosciuta (solo Sole/Luna/Ascendente approssimati)
  birth_place VARCHAR(255) NOT NULL,  -- Nome luogo (es. "Roma, Italia")
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  timezone VARCHAR(50),  -- es. "Europe/Rome" o offset UTC
  relation VARCHAR(100),  -- "Io", "Famiglia", "Amici", "Celebrità", etc.
  notes TEXT,
  is_primary BOOLEAN DEFAULT FALSE,  -- Persona principale dell'utente
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_persons_user_id ON persons(user_id);
CREATE INDEX idx_persons_user_primary ON persons(user_id, is_primary);
```

### Tabella: charts (cache carte natali)
```sql
CREATE TABLE charts (
  id SERIAL PRIMARY KEY,
  person_id INTEGER NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  chart_type VARCHAR(50) NOT NULL,  -- 'natal', 'transit', 'synastry'
  chart_date TIMESTAMP NOT NULL,  -- Data/ora del calcolo
  chart_data JSONB NOT NULL,  -- Dati completi della carta (posizioni, case, aspetti)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (person_id) REFERENCES persons(id)
);
```

## Libreria Calcoli Astrologici

**SCELTA: Swiss Ephemeris (swisseph)**
- **Precisione**: Standard industriale, estremamente precisa
- **Supporto**: Molti sistemi astrologici (tropicale, siderale, etc.)
- **Range date**: Supporta date molto lontane nel passato/futuro
- **Implementazione**: Node.js wrapper per Swiss Ephemeris C library
- **File dati**: Richiede file ephemeris (SEPL_430, etc.) - da includere nel progetto

**Package**: `swisseph` (npm)
**File dati**: Swiss Ephemeris data files (gratuiti, da scaricare da astro.com)

## API Endpoints

### Persons
- `GET /api/persons` - Lista persone utente
- `POST /api/persons` - Crea nuova persona
- `GET /api/persons/:id` - Dettagli persona
- `PUT /api/persons/:id` - Modifica persona
- `DELETE /api/persons/:id` - Elimina persona

### Charts
- `POST /api/charts/calculate` - Calcola carta natale
  - Body: `{ personId, chartType: 'natal'|'transit'|'synastry'|'composite', date? }`
  - Se chartType='synastry' o 'composite': `{ personId1, personId2, chartType }`
- `GET /api/charts/person/:personId` - Carte salvate di una persona
- `GET /api/charts/current` - Cielo del momento (transiti attuali)
- `POST /api/charts/transits` - Transiti su una persona
  - Body: `{ personId, date? }` - Transiti planetari su carta natale
- `POST /api/charts/historical` - Posizioni storiche
  - Body: `{ date, time?, latitude?, longitude? }`
- `POST /api/charts/synastry` - Sinastria tra due persone
  - Body: `{ personId1, personId2 }`
- `POST /api/charts/composite` - Carta composite tra due persone
  - Body: `{ personId1, personId2 }`

### Ephemeris
- `POST /api/ephemeris` - Genera effemeridi
  - Body: `{ startDate, endDate, planets? }`
  - Response: Array di posizioni giornaliere

## Frontend Components

### Person Management
- `PersonList` - Lista persone con ricerca/filtri/categorie
- `PersonForm` - Form aggiunta/modifica persona (con geocoding automatico)
- `PersonDetail` - Dettagli persona con:
  - Tema natale calcolato
  - Transiti attuali
  - Carte salvate
  - Relazioni (sinastrie con altre persone)
- `PersonSelector` - Componente per selezionare persona da lista (per sinastrie/composite)

### Chart Display
- `ChartViewer` - Visualizzatore carta natale (grafico circolare SVG)
  - Supporta: Natal, Transit, Synastry (doppia ruota), Composite
- `PlanetPositions` - Tabella posizioni planetarie (segno, grado, casa)
- `AspectsTable` - Tabella aspetti tra pianeti
- `HousesTable` - Tabella case astrologiche (cuspidi)
- `SynastryViewer` - Visualizzatore sinastria (due ruote sovrapposte)
- `TransitViewer` - Visualizzatore transiti (carta natale + transiti attuali)

### Tools
- `CurrentSky` - Cielo del momento
- `EphemerisTable` - Tabella effemeridi
- `HistoricalQuery` - Query posizioni storiche

## Calcoli Necessari

### Posizioni Planetarie
- Coordinate eclittiche (longitudine, latitudine)
- Coordinate equatoriali (se necessario)
- Retrogradazione

### Case Astrologiche
- Calcolo case (Placidus, Koch, Equal, etc.)
- Ascendente, Medio Cielo
- Cuspidi case

### Aspetti
- Congiunzione (0°)
- Sestile (60°)
- Quadrato (90°)
- Trigono (120°)
- Opposizione (180°)
- Orb (tolleranza)

## Coordinate Geografiche

### Geocoding
- Convertire nome luogo → lat/long
- Opzioni:
  - **Nominatim** (OpenStreetMap) - Gratuito, no API key
  - **Google Geocoding** - Richiede API key (a pagamento dopo free tier)
  - **Mapbox** - Free tier limitato

**Scelta**: Nominatim per iniziare (gratuito, illimitato)

## Visualizzazione Carta Natale

### Opzioni
1. **SVG/Canvas** - Disegno custom con React
2. **Libreria chart** - Usare libreria esistente
3. **Immagine generata** - Backend genera immagine

**Scelta**: SVG custom per controllo totale e performance

## Performance Considerations

### Caching
- Cache carte natali calcolate (tabella `charts`)
- Cache effemeridi per range comuni
- Cache geocoding (salvare lat/long con persona)

### Ottimizzazioni
- Calcoli lato backend (più veloce)
- Lazy loading carte salvate
- Paginazione liste persone

## Workflow Utente Tipico

1. **Registrazione/Login** → Accede al proprio account
2. **Aggiunge prima persona** → Se stesso (marca come "primary")
3. **Aggiunge altre persone** → Familiari, amici, celebrità, etc.
4. **Calcola tema natale** → Di qualsiasi persona salvata
5. **Vede transiti** → Transiti attuali su qualsiasi persona
6. **Fa sinastria** → Confronta due persone salvate
7. **Consulta effemeridi** → Per analisi dettagliate

## Prossimi Passi Implementazione

1. ✅ Setup base multi-utente (completato)
2. [ ] Installare Swiss Ephemeris (swisseph) e file dati
3. [ ] Creare schema database (persons, charts)
4. [ ] Implementare geocoding (Nominatim) per convertire luogo → lat/long
5. [ ] Implementare API persons (CRUD completo)
6. [ ] Implementare calcolo posizioni planetarie con Swiss Ephemeris
7. [ ] Implementare calcolo case astrologiche (Placidus, Koch, etc.)
8. [ ] Implementare calcolo aspetti
9. [ ] Creare componenti frontend gestione persone
10. [ ] Creare visualizzatore carta natale (SVG circolare)
11. [ ] Implementare sinastria (due carte sovrapposte)
12. [ ] Implementare transiti
13. [ ] Implementare effemeridi
14. [ ] Implementare cielo del momento

