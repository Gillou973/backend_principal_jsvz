import { AuthorizationError } from './errorHandler.js';

/**
 * Middleware de contrôle d'accès par rôle
 * @param {string|Array} roles - Rôle(s) autorisé(s) (ex: 'admin' ou ['admin', 'moderator'])
 */
export const authorizeRole = (roles) => {
  // Normaliser en tableau
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      throw new AuthorizationError('Authentification requise');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError(
        `Accès refusé. Rôles autorisés: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};

/**
 * Middleware pour vérifier que l'utilisateur accède à ses propres données
 * ou qu'il est admin
 */
export const authorizeOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    throw new AuthorizationError('Authentification requise');
  }

  const resourceUserId = req.params.id || req.params.userId;
  const isOwner = req.user.id === resourceUserId;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new AuthorizationError('Accès refusé : vous ne pouvez accéder qu\'à vos propres données');
  }

  next();
};

/**
 * Middleware pour vérifier que l'utilisateur est actif
 */
export const requireActiveUser = (req, res, next) => {
  if (!req.user) {
    throw new AuthorizationError('Authentification requise');
  }

  // Cette vérification nécessiterait une requête DB pour vérifier le statut actuel
  // Pour l'instant, on fait confiance au token (à améliorer si nécessaire)
  next();
};