import express from 'express';
import { signup, login, getProfile, getAllUsers, deleteUser } from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/authenticateToken.js';
import { authorizeRole } from '../middlewares/authorizeRole.js'; // à créer si besoin
import { signupSchema } from '../validators/user.validator.js';
import { validate } from '../middlewares/validate.js';




const router = express.Router();

/**
 * @route   POST /api/v1/users/signup
 * @desc    Créer un nouvel utilisateur
 * @access  Public
 */
router.post('/signup', validate(signupSchema), signup);
/* router.post('/signup', signup); */

/**
 * @route   POST /api/v1/users/login
 * @desc    Authentifier un utilisateur et renvoyer un token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/v1/users/me
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @access  Privé (JWT)
 */
router.get('/me', authenticateToken, getProfile);

router.get('/', authenticateToken, authorizeRole('admin'), getAllUsers);


/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Supprimer un utilisateur (admin uniquement)
 * @access  Privé (admin)
 */
router.delete('/:id', authenticateToken, authorizeRole('admin'), deleteUser);


export default router;