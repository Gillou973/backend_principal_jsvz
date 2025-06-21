// scripts/init-db.js  -- version reset
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ou config manuelle avec host/user/password/db
});

const resetAndInitDB = `
  DROP TABLE IF EXISTS users;

  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    adresse TEXT NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    password VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin'))
  );
`;

const insertDummyUsers = `
  INSERT INTO users (nom, prenom, adresse, email, telephone, password, role)
  VALUES
    ('Doe', 'John', '1 rue de Paris', 'john@example.com', '0600000000', 'hashedpassword123', 'user'),
    ('Admin', 'Super', '2 avenue Admin', 'admin@example.com', '0700000000', 'hashedadminpass456', 'admin');
`;

(async () => {
  try {
    console.log("🔄 Réinitialisation de la base...");
    await pool.query(resetAndInitDB);
    console.log("✅ Table 'users' recréée.");

    console.log("➕ Insertion de comptes fictifs...");
    await pool.query(insertDummyUsers);
    console.log("✅ Comptes de test insérés.");
  } catch (err) {
    console.error("❌ Erreur dans la réinitialisation de la BDD :", err);
  } finally {
    await pool.end();
  }
})();