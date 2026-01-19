/**
 * Modèle User - Gestion des utilisateurs
 */
const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    /**
     * Créer un nouvel utilisateur
     */
    static create({ email, password, nom, prenom, role = 'commercial' }) {
        const password_hash = bcrypt.hashSync(password, 12);

        const stmt = db.prepare(`
            INSERT INTO users (email, password_hash, nom, prenom, role)
            VALUES (?, ?, ?, ?, ?)
        `);

        const result = stmt.run(email.toLowerCase(), password_hash, nom, prenom, role);
        return this.findById(result.lastInsertRowid);
    }

    /**
     * Trouver un utilisateur par ID
     */
    static findById(id) {
        const stmt = db.prepare('SELECT id, email, nom, prenom, role, actif, created_at, last_login FROM users WHERE id = ?');
        return stmt.get(id);
    }

    /**
     * Trouver un utilisateur par email
     */
    static findByEmail(email) {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email.toLowerCase());
    }

    /**
     * Vérifier le mot de passe
     */
    static verifyPassword(user, password) {
        return bcrypt.compareSync(password, user.password_hash);
    }

    /**
     * Mettre à jour la date de dernière connexion
     */
    static updateLastLogin(id) {
        const stmt = db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
        stmt.run(id);
    }

    /**
     * Lister tous les utilisateurs (pour admin)
     */
    static findAll() {
        const stmt = db.prepare(`
            SELECT id, email, nom, prenom, role, actif, created_at, last_login
            FROM users
            ORDER BY nom, prenom
        `);
        return stmt.all();
    }

    /**
     * Mettre à jour un utilisateur
     */
    static update(id, { email, nom, prenom, role, actif }) {
        const stmt = db.prepare(`
            UPDATE users
            SET email = ?, nom = ?, prenom = ?, role = ?, actif = ?
            WHERE id = ?
        `);
        stmt.run(email.toLowerCase(), nom, prenom, role, actif ? 1 : 0, id);
        return this.findById(id);
    }

    /**
     * Changer le mot de passe
     */
    static updatePassword(id, newPassword) {
        const password_hash = bcrypt.hashSync(newPassword, 12);
        const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        stmt.run(password_hash, id);
    }

    /**
     * Supprimer un utilisateur
     */
    static delete(id) {
        const stmt = db.prepare('DELETE FROM users WHERE id = ?');
        return stmt.run(id);
    }

    /**
     * Compter les utilisateurs
     */
    static count() {
        const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
        return stmt.get().count;
    }

    /**
     * Vérifier si un admin existe
     */
    static adminExists() {
        const stmt = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
        return stmt.get().count > 0;
    }
}

module.exports = User;
