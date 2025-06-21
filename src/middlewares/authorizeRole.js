/**
 * Middleware de contrôle d'accès par rôle
 * @param {string} role attendu (ex: 'admin')
 */
export const authorizeRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: "Accès refusé : rôle insuffisant" });
    }
    next();
  };
};