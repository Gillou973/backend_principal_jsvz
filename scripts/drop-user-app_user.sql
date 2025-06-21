-- 🔒 Suppression sécurisée de l'utilisateur app_user

-- 1. Révocation des privilèges sur la base et le schéma
REVOKE ALL PRIVILEGES ON DATABASE annonces_db FROM app_user;
REVOKE ALL PRIVILEGES ON SCHEMA public FROM app_user;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM app_user;

-- 2. Suppression des privilèges par défaut accordés par postgres
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE ALL ON TABLES FROM app_user;

-- 3. Transfert des objets possédés à l'utilisateur postgres
REASSIGN OWNED BY app_user TO postgres;

-- 4. Suppression définitive des objets appartenant à app_user
DROP OWNED BY app_user;

-- 5. Suppression de l'utilisateur
DROP USER app_user;