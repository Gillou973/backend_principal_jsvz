import {pool} from '../config/db.js';

/**
 * Fonction utilitaire pour exécuter une requête SQL
 * @param {string} text - La requête SQL avec placeholders ($1, $2, ...)
 * @param {Array} params - Les paramètres à injecter dans la requête
 * @returns {Promise} Résultat de la requête
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('🧪 requête exécutée', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('❌ Erreur requête SQL', { text, err });
    throw err;
  }
}


/* export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('🧪 requête exécutée', { text, duration, rows: res.rowCount });
  return res;
}
 */