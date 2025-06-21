// scripts/audit-roles.js
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const query = `
  SELECT
    r.rolname AS role,
    r.rolsuper AS is_superuser,
    r.rolcanlogin AS can_login,
    d.datname AS database,
    pg_catalog.has_database_privilege(r.rolname, d.datname, 'CONNECT') AS has_connect
  FROM pg_roles r
  CROSS JOIN pg_database d
  WHERE d.datistemplate = false
  ORDER BY r.rolname, d.datname;
`;

(async () => {
  try {
    console.log("🔍 Audit des rôles et accès aux bases PostgreSQL :\n");
    const res = await pool.query(query);

    res.rows.forEach(row => {
      console.log(`👤 ${row.role} | Superuser: ${row.is_superuser} | Login: ${row.can_login} | DB: ${row.database} | Access: ${row.has_connect}`);
    });
  } catch (err) {
    console.error("❌ Erreur durant l’audit :", err);
  } finally {
    await pool.end();
  }
})();