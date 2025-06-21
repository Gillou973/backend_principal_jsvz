import { query } from '../utils/db.js';
//import { query } from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { signupSchema } from '../validators/user.validator.js';

/**
 * @route   POST /api/v1/users/signup
 * @desc    Inscription d'un nouvel utilisateur
 */
export const signup = async (req, res) => {

  //validator
  const parseResult = signupSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const { nom, prenom, adresse, email, telephone, password } = req.body;

  // Validation basique (à remplacer par Joi/Zod dans un second temps)
  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  try {
    // Vérifier que l'email n'existe pas déjà
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    const result = await query(
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
    const result = await query(`SELECT * FROM users WHERE email = $1`, [email]);
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
    const result = await query(
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
 * @route   GET /api/v1/users?limit=10&offset=0
 * @desc    Récupérer une liste paginée des utilisateurs (admin uniquement)
 */
export const getAllUsers = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;     // valeur par défaut = 10
  const offset = parseInt(req.query.offset) || 0;

  try {
    const result = await query(
      `SELECT id, nom, prenom, adresse, email, telephone, role, date_creation
       FROM users
       ORDER BY date_creation DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const count = await query(`SELECT COUNT(*) FROM users`);
    const total = parseInt(count.rows[0].count);

    res.json({
      meta: {
        total,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
        pages: Math.ceil(total / limit)
      },
      users: result.rows
    });
  } catch (err) {
    console.error('❌ Erreur getAllUsers paginé :', err);
    res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs" });
  }
};


/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Supprimer un utilisateur (admin uniquement)
 */
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json({ message: `Utilisateur ${id} supprimé avec succès` });
  } catch (err) {
    console.error('❌ Erreur deleteUser :', err);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
};
