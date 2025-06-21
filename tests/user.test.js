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