import rateLimit from 'express-rate-limit';

/**
 * Limiteur de requêtes pour éviter le bruteforce sur /login
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives maximum
  message: {
    error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
