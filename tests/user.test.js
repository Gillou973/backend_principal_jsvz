import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/config/db.js';

describe('🧪 Tests API Utilisateurs', () => {
  const userData = {
    nom: 'Testeur',
    prenom: 'Jest',
    adresse: '42 rue du Code',
    email: `jest${Date.now()}@example.com`,
    telephone: '0600000000',
    password: 'Test123456'
  };

  let userToken;
  let adminToken;
  let createdUserId;

  // Configuration d'un admin pour les tests
  beforeAll(async () => {
    const bcrypt = await import('bcrypt');
    const { query } = await import('../src/utils/db.js');
    
    const adminData = {
      nom: 'Admin',
      prenom: 'Test',
      adresse: '1 rue Admin',
      email: `admin${Date.now()}@example.com`,
      telephone: '0700000000',
      password: 'Admin123456'
    };

    const hashedPassword = await bcrypt.default.hash(adminData.password, 12);
    
    await query(
      `INSERT INTO users (id, nom, prenom, adresse, email, telephone, password, role)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'admin')`,
      [adminData.nom, adminData.prenom, adminData.adresse, adminData.email, adminData.telephone, hashedPassword]
    );

    // Login admin
    const adminLoginRes = await request(app)
      .post('/api/v1/users/login')
      .send({
        email: adminData.email,
        password: adminData.password
      });

    adminToken = adminLoginRes.body.data.token;
  });

  describe('POST /api/v1/users/signup', () => {
    it('devrait créer un nouvel utilisateur avec des données valides', async () => {
      const res = await request(app)
        .post('/api/v1/users/signup')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe(userData.email.toLowerCase());
      expect(res.body.data.user).not.toHaveProperty('password');
      
      createdUserId = res.body.data.user.id;
    });

    it('devrait rejeter un email déjà utilisé', async () => {
      const res = await request(app)
        .post('/api/v1/users/signup')
        .send(userData);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT_ERROR');
    });

    it('devrait rejeter des données invalides', async () => {
      const invalidData = {
        ...userData,
        email: 'email-invalide',
        password: '123' // trop court
      };

      const res = await request(app)
        .post('/api/v1/users/signup')
        .send(invalidData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/users/login', () => {
    it('devrait connecter un utilisateur avec des identifiants valides', async () => {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user).not.toHaveProperty('password');
      
      userToken = res.body.data.token;
    });

    it('devrait rejeter des identifiants incorrects', async () => {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: userData.email,
          password: 'mauvais-mot-de-passe'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('devrait valider le format des données de connexion', async () => {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'email-invalide',
          password: ''
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/users/me', () => {
    it('devrait retourner le profil de l\'utilisateur connecté', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('email', userData.email.toLowerCase());
      expect(res.body.data.user).toHaveProperty('nom', userData.nom);
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('devrait rejeter une requête sans token', async () => {
      const res = await request(app)
        .get('/api/v1/users/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('PUT /api/v1/users/me', () => {
    it('devrait mettre à jour le profil utilisateur', async () => {
      const updateData = {
        nom: 'Nouveau Nom',
        telephone: '0611111111'
      };

      const res = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.nom).toBe(updateData.nom);
      expect(res.body.data.user.telephone).toBe(updateData.telephone);
    });
  });

  describe('Admin Routes', () => {
    describe('GET /api/v1/users', () => {
      it('devrait lister les utilisateurs (admin)', async () => {
        const res = await request(app)
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('users');
        expect(res.body.data).toHaveProperty('pagination');
        expect(Array.isArray(res.body.data.users)).toBe(true);
      });

      it('devrait rejeter l\'accès pour un utilisateur normal', async () => {
        const res = await request(app)
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${userToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('AUTHORIZATION_ERROR');
      });
    });

    describe('PATCH /api/v1/users/:id/toggle-status', () => {
      it('devrait activer/désactiver un utilisateur (admin)', async () => {
        const res = await request(app)
          .patch(`/api/v1/users/${createdUserId}/toggle-status`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user).toHaveProperty('is_active');
      });
    });

    describe('DELETE /api/v1/users/:id', () => {
      it('devrait supprimer un utilisateur (admin)', async () => {
        const res = await request(app)
          .delete(`/api/v1/users/${createdUserId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('supprimé avec succès');
      });
    });
  });

  describe('Routes de santé', () => {
    it('GET / devrait retourner le statut de l\'API', async () => {
      const res = await request(app).get('/');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('version');
    });

    it('GET /health devrait retourner les métriques de santé', async () => {
      const res = await request(app).get('/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('memory');
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait retourner 404 pour une route inexistante', async () => {
      const res = await request(app).get('/api/v1/route-inexistante');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND_ERROR');
    });
  });

  // Nettoyage après tous les tests
  afterAll(async () => {
    await pool.end();
  });
});