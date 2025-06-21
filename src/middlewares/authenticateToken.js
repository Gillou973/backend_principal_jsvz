import jwt from 'jsonwebtoken';

/**
 * Middleware d'authentification par JWT
 * Vérifie que le token est présent et valide
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Vérifie la présence et le format du header Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "En-tête d'authentification invalide ou manquant" });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Vérifie et décode le token
    const user = jwt.verify(token, process.env.JWT_SECRET);

    req.user = user; // On attache l'utilisateur au `req`
    next();
  } catch (err) {
    console.error('❌ Token invalide :', err.message);
    return res.status(403).json({ error: "Token invalide ou expiré" });
  }
};