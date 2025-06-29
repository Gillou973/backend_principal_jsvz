import rateLimit from 'express-rate-limit';

/**
 * Limiteur de requêtes pour éviter le bruteforce sur /login
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives maximum par IP
  message: {
    success: false,
    error: {
      message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Personnaliser la clé pour inclure l'email si disponible
  keyGenerator: (req) => {
    return req.body?.email ? `${req.ip}-${req.body.email}` : req.ip;
  },
  // Skip les requêtes réussies du compteur
  skipSuccessfulRequests: true,
});

/**
 * Limiteur général pour les API
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: {
    success: false,
    error: {
      message: 'Trop de requêtes. Réessayez plus tard.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limiteur strict pour les opérations sensibles (création de compte)
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 créations de compte par IP par heure
  message: {
    success: false,
    error: {
      message: 'Limite de création de comptes atteinte. Réessayez dans 1 heure.',
      code: 'ACCOUNT_CREATION_LIMIT'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limiteur pour les opérations admin
 */
export const adminRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requêtes admin par 5 minutes
  message: {
    success: false,
    error: {
      message: 'Limite d\'opérations administratives atteinte.',
      code: 'ADMIN_RATE_LIMIT'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});