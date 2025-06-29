import { ValidationError } from './errorHandler.js';

/**
 * Middleware de validation avec Zod
 * @param {ZodSchema} schema - Schéma Zod pour la validation
 * @param {string} source - Source des données à valider ('body', 'query', 'params')
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const dataToValidate = req[source];
    const result = schema.safeParse(dataToValidate);
    
    if (!result.success) {
      const formattedErrors = result.error.flatten();
      throw new ValidationError('Données invalides', formattedErrors);
    }
    
    // Remplacer les données par les données validées et nettoyées
    req[source] = result.data;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware de validation pour les paramètres d'URL
 */
export const validateParams = (schema) => validate(schema, 'params');

/**
 * Middleware de validation pour les query parameters
 */
export const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validation conditionnelle (ne valide que si des données sont présentes)
 */
export const validateOptional = (schema, source = 'body') => (req, res, next) => {
  try {
    const dataToValidate = req[source];
    
    // Si pas de données, on passe
    if (!dataToValidate || Object.keys(dataToValidate).length === 0) {
      return next();
    }
    
    const result = schema.safeParse(dataToValidate);
    
    if (!result.success) {
      const formattedErrors = result.error.flatten();
      throw new ValidationError('Données invalides', formattedErrors);
    }
    
    req[source] = result.data;
    next();
  } catch (error) {
    next(error);
  }
};