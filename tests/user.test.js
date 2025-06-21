import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/config/db.js'; // si tu veux fermer proprement la connexion

describe('🧪 Tests API Utilisateurs', () => {
  const userData = {
    nom: 'Testeur',
    prenom: 'Jest',
    adresse: '42 rue du Code',
    email: `jest${Date.now()}@example.com`,
    telephone: '0600000000',
    password: 'test1234'
  };

  // Test Signup
  describe('POST /api/v1/users/signup', () => {
    it('devrait retourner 201 ou 409 selon que l\'email soit nouveau ou déjà utilisé', async () => {
      // 1er appel : devrait créer l'utilisateur (201)
      const res1 = await request(app)
        .post('/api/v1/users/signup')
        .send(userData);

      expect([201, 409]).toContain(res1.statusCode);

      // 2e appel avec le même email : devrait retourner 409 (conflit)
      const res2 = await request(app)
        .post('/api/v1/users/signup')
        .send(userData);

      expect(res2.statusCode).toBe(409);
    });
  });

// Test Login
describe('POST /api/v1/users/login', () => {
  it('devrait renvoyer un token si les identifiants sont corrects', async () => {
    const res = await request(app).post('/api/v1/users/login').send({
      email: userData.email,
      password: userData.password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({
      email: userData.email,
      nom: userData.nom,
      prenom: userData.prenom,
    });
  });
});

// Test Complet /me
describe('GET /api/v1/users/me', () => {
  let token;

  beforeAll(async () => {
    // Connexion pour récupérer le token
    const res = await request(app).post('/api/v1/users/login').send({
      email: userData.email,
      password: userData.password,
    });

    token = res.body.token;
  });

  it("devrait retourner le profil de l'utilisateur connecté", async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', userData.email);
    expect(res.body).toHaveProperty('nom', userData.nom);
    expect(res.body).toHaveProperty('prenom', userData.prenom);
    expect(res.body).toHaveProperty('id');
    expect(res.body).not.toHaveProperty('password'); // sécurité ✔️
  });
});

// Test Rôle Admin
describe('ADMIN - Accès restreint', () => {
  let adminToken;
  let userToDeleteId;

  const adminUser = {
    nom: 'Admin',
    prenom: 'Root',
    adresse: '1 rue du Panel',
    email: `admin${Date.now()}@example.com`,
    telephone: '0600000001',
    password: 'admin1234',
    role: 'admin'
  };

  beforeAll(async () => {
    // Créer un admin directement dans la DB
    const bcrypt = await import('bcrypt');
    const { query } = await import('../src/utils/db.js');
    const hashed = await bcrypt.default.hash(adminUser.password, 10);

    const res = await query(
      `INSERT INTO users (id, nom, prenom, adresse, email, telephone, password, role)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'admin')
       RETURNING email`,
      [adminUser.nom, adminUser.prenom, adminUser.adresse, adminUser.email, adminUser.telephone, hashed]
    );

    // Login pour récupérer le token
    const loginRes = await request(app).post('/api/v1/users/login').send({
      email: adminUser.email,
      password: adminUser.password,
    });

    adminToken = loginRes.body.token;
  });

  it('devrait lister les utilisateurs (GET /api/v1/users)', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('meta');
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThan(0);

    // On garde un ID pour tester la suppression
    userToDeleteId = res.body.users.find(u => u.role !== 'admin')?.id;
  });

  it('devrait supprimer un utilisateur (DELETE /api/v1/users/:id)', async () => {
    if (!userToDeleteId) {
      return console.warn('Aucun utilisateur à supprimer trouvé.');
    }

    const res = await request(app)
      .delete(`/api/v1/users/${userToDeleteId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});




  // Nettoyage après tous les tests (fermeture DB)
  afterAll(async () => {
    await pool.end(); // pour éviter les erreurs Jest "open handles"
  });
});


/* import request from 'supertest';
import app from '../src/app.js';

describe('🧪 Tests API Utilisateurs', () => {
  describe('POST /api/users/signup', () => {
    it(`devrait retourner 201 ou 409 selon que l'email soit nouveau ou déjà utilisé`, async () => {
      const email = 'jest-tester@example.com'; // réutilisé pour simuler doublon
      const userData = {
        nom: 'Testeur',
        prenom: 'Jest',
        adresse: '42 rue du Code',
        email,
        telephone: '0600000000',
        password: 'test1234'
      };

      // 1er appel : devrait retourner 201 (création réussie)
      const res1 = await request(app)
        .post('/api/v1/users/signup')
        .send(userData);

      expect([201, 409]).toContain(res1.statusCode);

      // 2e appel : devrait retourner 409 (email déjà utilisé)
      const res2 = await request(app)
        .post('/api/v1/users/signup')
        .send(userData);

      expect(res2.statusCode).toBe(409);
      expect(res2.body).toHaveProperty('error');
    });
  });
});
 */