import express from 'express';
import { 
  signup, 
  login, 
  getProfile, 
  updateProfile,
  getAllUsers, 
  deleteUser,
  toggleUserStatus
} from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/authenticateToken.js';
import { authorizeRole, authorizeOwnerOrAdmin } from '../middlewares/authorizeRole.js';
import { 
  signupSchema, 
  loginSchema, 
  updateProfileSchema 
} from '../validators/user.validator.js';
import { validate } from '../middlewares/validate.js';
import { loginRateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/v1/users/signup
 * @desc    Créer un nouvel utilisateur
 * @access  Public
 */
router.post('/signup', validate(signupSchema), signup);

/**
 * @route   POST /api/v1/users/login
 * @desc    Authentifier un utilisateur et renvoyer un token
 * @access  Public
 */
router.post('/login', validate(loginSchema), loginRateLimiter, login);

/**
 * @route   GET /api/v1/users/me
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @access  Privé (JWT)
 */
router.get('/me', authenticateToken, getProfile);

/**
 * @route   PUT /api/v1/users/me
 * @desc    Mettre à jour le profil de l'utilisateur connecté
 * @access  Privé (JWT)
 */
router.put('/me', authenticateToken, validate(updateProfileSchema), updateProfile);

/**
 * @route   GET /api/v1/users
 * @desc    Récupérer une liste paginée des utilisateurs avec recherche
 * @access  Privé (admin uniquement)
 * @query   ?limit=10&offset=0&search=john
 */
router.get('/', authenticateToken, authorizeRole('admin'), getAllUsers);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Supprimer un utilisateur (admin uniquement)
 * @access  Privé (admin)
 */
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteUser);

/**
 * @route   PATCH /api/v1/users/:id/toggle-status
 * @desc    Activer/désactiver un utilisateur (admin uniquement)
 * @access  Privé (admin)
 */
router.patch('/:id/toggle-status', authenticateToken, authorizeRole('admin'), toggleUserStatus);

export default router;