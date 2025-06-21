// src/config/db.js
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL manquant dans .env');
  process.exit(1);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});
/* const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
}); */

// Log de confirmation au démarrage
pool.connect()
  .then(client => {
    console.log('✅ Connexion à PostgreSQL réussie');
    client.release();
  })
  .catch(err => {
    console.error('❌ Erreur de connexion PostgreSQL :', err);
    process.exit(1);
  });

/* export default pool; */