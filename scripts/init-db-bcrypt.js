// scripts/init-db.js -- avec bcrypt
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ou config détaillée anuelle avec host/user/password/db
});

const resetAndInitDB = `
  DROP TABLE IF EXISTS users;

  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  CREATE TABLE IF NOT EXISTS public.users (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      nom VARCHAR(100) NOT NULL,
      prenom VARCHAR(100) NOT NULL,
      adresse TEXT NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      telephone VARCHAR(20) NOT NULL,
      date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      password VARCHAR(255),
      role VARCHAR(20) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
      is_active BOOLEAN DEFAULT true
  );
`;

const createHashedUsers = async () => {
  const passwordUser = await bcrypt.hash('motdepasse123', 10);
  const passwordAdmin = await bcrypt.hash('adminsecret456', 10);

  const insertUsers = `
    INSERT INTO users (nom, prenom, adresse, email, telephone, password, role)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7),
      ($8, $9, $10, $11, $12, $13, $14)
  `;

  const values = [
    'Doe', 'John', '1 rue de Paris', 'john@example.com', '0600000000', passwordUser, 'user',
    'Admin', 'Super', '2 avenue Admin', 'admin@example.com', '0700000000', passwordAdmin, 'admin',
  ];

  await pool.query(insertUsers, values);
};

(async () => {
  try {
    console.log("🔄 Réinitialisation de la base...");
    await pool.query(resetAndInitDB);
    console.log("✅ Table 'users' recréée.");

    console.log("🔐 Insertion d’utilisateurs avec mots de passe hachés...");
    await createHashedUsers();
    console.log("✅ Comptes de test insérés avec succès.");
  } catch (err) {
    console.error("❌ Erreur :", err);
  } finally {
    await pool.end();
  }
})();