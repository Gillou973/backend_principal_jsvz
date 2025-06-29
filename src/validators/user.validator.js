import { z } from 'zod';

// Schéma pour l'inscription
export const signupSchema = z.object({
  nom: z.string()
    .min(1, 'Nom requis')
    .max(100, 'Nom trop long (max 100 caractères)')
    .trim(),
  prenom: z.string()
    .min(1, 'Prénom requis')
    .max(100, 'Prénom trop long (max 100 caractères)')
    .trim(),
  adresse: z.string()
    .min(1, 'Adresse requise')
    .max(500, 'Adresse trop longue (max 500 caractères)')
    .trim(),
  email: z.string()
    .email('Email invalide')
    .max(150, 'Email trop long (max 150 caractères)')
    .toLowerCase()
    .trim(),
  telephone: z.string()
    .min(1, 'Téléphone requis')
    .max(20, 'Téléphone trop long (max 20 caractères)')
    .regex(/^[0-9+\-\s()]+$/, 'Format de téléphone invalide')
    .trim(),
  password: z.string()
    .min(8, 'Mot de passe trop court (min 8 caractères)')
    .max(128, 'Mot de passe trop long (max 128 caractères)')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
});

// Schéma pour la connexion
export const loginSchema = z.object({
  email: z.string()
    .email('Email invalide')
    .max(150, 'Email trop long')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'Mot de passe requis')
    .max(128, 'Mot de passe trop long')
});

// Schéma pour la mise à jour du profil
export const updateProfileSchema = z.object({
  nom: z.string()
    .min(1, 'Nom requis')
    .max(100, 'Nom trop long (max 100 caractères)')
    .trim()
    .optional(),
  prenom: z.string()
    .min(1, 'Prénom requis')
    .max(100, 'Prénom trop long (max 100 caractères)')
    .trim()
    .optional(),
  adresse: z.string()
    .min(1, 'Adresse requise')
    .max(500, 'Adresse trop longue (max 500 caractères)')
    .trim()
    .optional(),
  telephone: z.string()
    .min(1, 'Téléphone requis')
    .max(20, 'Téléphone trop long (max 20 caractères)')
    .regex(/^[0-9+\-\s()]+$/, 'Format de téléphone invalide')
    .trim()
    .optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "Au moins un champ doit être fourni pour la mise à jour"
});