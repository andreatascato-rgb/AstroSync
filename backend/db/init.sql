-- Script di inizializzazione database
-- Esegui questo script su Neon per creare le tabelle necessarie

-- Tabella utenti per autenticazione multi-utente
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aggiungi campo role se non esiste (per database esistenti)
-- Nota: Eseguire manualmente se necessario:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Indice per ricerca email veloce
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Esempio: template per tabelle dati utente
-- Ogni tabella dati deve includere user_id per isolamento dati
-- CREATE TABLE IF NOT EXISTS items (
--   id SERIAL PRIMARY KEY,
--   user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (user_id) REFERENCES users(id)
-- );
-- CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);

