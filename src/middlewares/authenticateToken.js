import jwt from 'jsonwebtoken';
import { AuthenticationError, asyncHandler } from './errorHandler.js';

/**
 * Middleware d'authentification par JWT
 * Vérifie que le token est présent et valide
 */
export const authenticateToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Vérifie la présence et le format du header Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError("Token d'authentification manquant ou invalide");
  }

  const token = authHeader.split(' ')[1];

  try {
    // Vérifie et décode le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'backend-principal',
      audience: 'frontend-app'
    });

    // Vérification supplémentaire : le token contient-il les champs requis ?
    if (!decoded.id || !decoded.email || !decoded.role) {
      throw new AuthenticationError('Token invalide : données manquantes');
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token expiré, veuillez vous reconnecter');
    }
    if (err.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Token invalide');
    }
    throw err; // Relancer l'erreur si ce n'est pas une erreur JWT connue
  }
});

/**
 * Middleware optionnel d'authentification
 * N'échoue pas si le token est absent, mais le valide s'il est présent
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Pas de token, on continue sans utilisateur
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'backend-principal',
      audience: 'frontend-app'
    });

    if (decoded.id && decoded.email && decoded.role) {
      req.user = decoded;
    }
  } catch (err) {
    // On ignore les erreurs de token en mode optionnel
    console.warn('Token optionnel invalide:', err.message);
  }

  next();
});