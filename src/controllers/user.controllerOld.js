import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

/**
 * @route   POST /api/v1/users/signup
 * @desc    Inscription d'un nouvel utilisateur
 */
export const signup = async (req, res) => {
  const { nom, prenom, adresse, email, telephone, password } = req.body;

  // Validation basique (à remplacer par Joi/Zod dans un second temps)
  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  try {
    // Vérifier que l'email n'existe pas déjà
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    const result = await pool.query(
      `INSERT INTO users (id, nom, prenom, adresse, email, telephone, password)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, role`,
      [id, nom, prenom, adresse, email, telephone, hashedPassword]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Erreur signup :', err);
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
};

/**
 * @route   POST /api/v1/users/login
 * @desc    Connexion utilisateur et génération de JWT
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Supprimer le mot de passe du retour
    const { password: _, ...userData } = user;
    res.json({ token, user: userData });
  } catch (err) {
    console.error('❌ Erreur login :', err);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
};

/**
 * @route   GET /api/v1/users/me
 * @desc    Obtenir les infos du profil connecté
 */
export const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nom, prenom, adresse, email, telephone, role, date_creation
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Erreur profil :', err);
    res.status(500).json({ error: "Erreur lors de la récupération du profil" });
  }
};


/**
 * @route   GET /api/v1/users
 * @desc    Récupérer la liste de tous les utilisateurs (admin uniquement)
 */
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nom, prenom, adresse, email, telephone, role, date_creation
       FROM users
       ORDER BY date_creation DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erreur getAllUsers :', err);
    res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs" });
  }
};