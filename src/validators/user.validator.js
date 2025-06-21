import { z } from 'zod';

export const signupSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  adresse: z.string().min(1, 'Adresse requise'),
  email: z.string().email('Email invalide'),
  telephone: z.string().min(1, 'Téléphone requis'),
  password: z.string().min(6, 'Mot de passe trop court'),
});