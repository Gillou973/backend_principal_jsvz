// src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes.js';
import morgan from 'morgan';

dotenv.config();

const app = express();

// Middlewares globaux
app.use(cors()); // à sécuriser en prod avec { origin: ... }
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Routes principales
app.use('/api/users', userRoutes);

// Route racine de test
app.get('/', (req, res) => {
  res.json({ message: 'API opérationnelle 🎉' });
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion globale des erreurs serveur
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

export default app;