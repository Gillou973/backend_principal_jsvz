import { query } from '../utils/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  ConflictError, 
  NotFoundError,
  asyncHandler 
} from '../middlewares/errorHandler.js';

/**
 * @route   POST /api/v1/users/signup
 * @desc    Inscription d'un nouvel utilisateur
 */
export const signup = asyncHandler(async (req, res) => {
  const { nom, prenom, adresse, email, telephone, password } = req.body;

  // Vérifier que l'email n'existe pas déjà
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount > 0) {
    throw new ConflictError('Cette adresse email est déjà utilisée');
  }

  // Hachage du mot de passe
  const hashedPassword = await bcrypt.hash(password, 12); // Augmentation du salt rounds
  const id = uuidv4();

  const result = await query(
    `INSERT INTO users (id, nom, prenom, adresse, email, telephone, password)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, nom, prenom, email, role, date_creation`,
    [id, nom, prenom, adresse, email, telephone, hashedPassword]
  );

  res.status(201).json({
    success: true,
    message: 'Compte créé avec succès',
    data: {
      user: result.rows[0]
    }
  });
});

/**
 * @route   POST /api/v1/users/login
 * @desc    Connexion utilisateur et génération de JWT
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Récupérer l'utilisateur avec vérification du statut actif
  const result = await query(
    `SELECT * FROM users WHERE email = $1 AND is_active = true`, 
    [email]
  );
  const user = result.rows[0];

  if (!user) {
    throw new AuthenticationError('Email ou mot de passe incorrect');
  }

  // Vérification du mot de passe
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Email ou mot de passe incorrect');
  }

  // Génération du token JWT
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '24h',
      issuer: 'backend-principal',
      audience: 'frontend-app'
    }
  );

  // Mise à jour de la dernière connexion (optionnel)
  await query(
    'UPDATE users SET date_creation = CURRENT_TIMESTAMP WHERE id = $1',
    [user.id]
  );

  // Supprimer le mot de passe du retour
  const { password: _, ...userData } = user;
  
  res.json({
    success: true,
    message: 'Connexion réussie',
    data: {
      token,
      user: userData
    }
  });
});

/**
 * @route   GET /api/v1/users/me
 * @desc    Obtenir les infos du profil connecté
 */
export const getProfile = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, nom, prenom, adresse, email, telephone, role, date_creation, is_active
     FROM users WHERE id = $1`,
    [req.user.id]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('Utilisateur introuvable');
  }

  res.json({
    success: true,
    data: {
      user: result.rows[0]
    }
  });
});

/**
 * @route   PUT /api/v1/users/me
 * @desc    Mettre à jour le profil de l'utilisateur connecté
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const updates = req.body;
  const userId = req.user.id;

  // Construction dynamique de la requête UPDATE
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  const query_text = `
    UPDATE users 
    SET ${setClause}, date_creation = CURRENT_TIMESTAMP 
    WHERE id = $${fields.length + 1} 
    RETURNING id, nom, prenom, adresse, email, telephone, role, date_creation
  `;

  const result = await query(query_text, [...values, userId]);

  if (result.rowCount === 0) {
    throw new NotFoundError('Utilisateur introuvable');
  }

  res.json({
    success: true,
    message: 'Profil mis à jour avec succès',
    data: {
      user: result.rows[0]
    }
  });
});

/**
 * @route   GET /api/v1/users?limit=10&offset=0&search=
 * @desc    Récupérer une liste paginée des utilisateurs (admin uniquement)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 par page
  const offset = Math.max(parseInt(req.query.offset) || 0, 0);
  const search = req.query.search?.trim() || '';

  let whereClause = '';
  let queryParams = [limit, offset];

  // Ajout de la recherche si fournie
  if (search) {
    whereClause = `WHERE (nom ILIKE $3 OR prenom ILIKE $3 OR email ILIKE $3)`;
    queryParams.push(`%${search}%`);
  }

  const result = await query(
    `SELECT id, nom, prenom, adresse, email, telephone, role, date_creation, is_active
     FROM users
     ${whereClause}
     ORDER BY date_creation DESC
     LIMIT $1 OFFSET $2`,
    queryParams
  );

  // Comptage total
  const countParams = search ? [`%${search}%`] : [];
  const countQuery = search 
    ? `SELECT COUNT(*) FROM users WHERE (nom ILIKE $1 OR prenom ILIKE $1 OR email ILIKE $1)`
    : `SELECT COUNT(*) FROM users`;
    
  const count = await query(countQuery, countParams);
  const total = parseInt(count.rows[0].count);

  res.json({
    success: true,
    data: {
      users: result.rows,
      pagination: {
        total,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
        pages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: offset > 0
      }
    }
  });
});

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Supprimer un utilisateur (admin uniquement)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Vérifier que l'utilisateur existe
  const userCheck = await query('SELECT id, role FROM users WHERE id = $1', [id]);
  if (userCheck.rowCount === 0) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Empêcher la suppression d'un admin par un autre admin
  if (userCheck.rows[0].role === 'admin' && req.user.role === 'admin') {
    throw new ValidationError('Impossible de supprimer un autre administrateur');
  }

  // Empêcher l'auto-suppression
  if (id === req.user.id) {
    throw new ValidationError('Impossible de supprimer votre propre compte');
  }

  const result = await query('DELETE FROM users WHERE id = $1 RETURNING id, email', [id]);

  res.json({
    success: true,
    message: `Utilisateur ${result.rows[0].email} supprimé avec succès`,
    data: {
      deletedUser: result.rows[0]
    }
  });
});

/**
 * @route   PATCH /api/v1/users/:id/toggle-status
 * @desc    Activer/désactiver un utilisateur (admin uniquement)
 */
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Empêcher la modification de son propre statut
  if (id === req.user.id) {
    throw new ValidationError('Impossible de modifier votre propre statut');
  }

  const result = await query(
    `UPDATE users 
     SET is_active = NOT is_active 
     WHERE id = $1 
     RETURNING id, email, is_active`,
    [id]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  const user = result.rows[0];
  const status = user.is_active ? 'activé' : 'désactivé';

  res.json({
    success: true,
    message: `Utilisateur ${user.email} ${status} avec succès`,
    data: {
      user
    }
  });
});