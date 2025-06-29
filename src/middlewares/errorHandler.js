/**
 * Middleware de gestion centralisée des erreurs
 */

// Classes d'erreurs personnalisées
export class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Non autorisé') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Accès refusé') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ressource non trouvée') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflit de données') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

// Middleware de gestion des erreurs
export const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';
  
  // Log de l'erreur (sans exposer les données sensibles)
  const logError = {
    message: err.message,
    statusCode: err.statusCode || 500,
    code: err.code,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    ...(isDev && { stack: err.stack })
  };

  // Ne pas logger les mots de passe ou tokens
  if (req.body && req.body.password) {
    logError.body = { ...req.body, password: '[REDACTED]' };
  }

  console.error('🚨 Erreur capturée:', logError);

  // Erreurs opérationnelles (prévues)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        ...(err.details && { details: err.details })
      }
    });
  }

  // Erreurs de validation Zod
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Données invalides',
        code: 'VALIDATION_ERROR',
        details: err.flatten()
      }
    });
  }

  // Erreurs PostgreSQL
  if (err.code && err.code.startsWith('23')) {
    let message = 'Erreur de base de données';
    
    switch (err.code) {
      case '23505': // Violation de contrainte unique
        message = 'Cette donnée existe déjà';
        break;
      case '23503': // Violation de clé étrangère
        message = 'Référence invalide';
        break;
      case '23502': // Violation de contrainte NOT NULL
        message = 'Champ requis manquant';
        break;
    }

    return res.status(400).json({
      success: false,
      error: {
        message,
        code: 'DATABASE_ERROR'
      }
    });
  }

  // Erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token invalide',
        code: 'INVALID_TOKEN'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token expiré',
        code: 'EXPIRED_TOKEN'
      }
    });
  }

  // Erreurs inattendues (500)
  res.status(500).json({
    success: false,
    error: {
      message: isDev ? err.message : 'Erreur serveur interne',
      code: 'INTERNAL_SERVER_ERROR',
      ...(isDev && { stack: err.stack })
    }
  });
};

// Middleware pour les routes non trouvées
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} non trouvée`);
  next(error);
};

// Wrapper pour les fonctions async (évite les try/catch répétitifs)
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};