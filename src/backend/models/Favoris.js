/**
 * Modèle Favoris - Gestion des produits favoris par utilisateur
 */
const db = require('../config/database');

class Favoris {
    /**
     * Ajouter un favori
     */
    static add(user_id, code_produit) {
        try {
            const stmt = db.prepare(`
                INSERT OR IGNORE INTO favoris (user_id, code_produit)
                VALUES (?, ?)
            `);
            stmt.run(user_id, code_produit);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Supprimer un favori
     */
    static remove(user_id, code_produit) {
        const stmt = db.prepare('DELETE FROM favoris WHERE user_id = ? AND code_produit = ?');
        return stmt.run(user_id, code_produit);
    }

    /**
     * Lister tous les favoris d'un utilisateur
     */
    static findByUser(user_id) {
        const stmt = db.prepare(`
            SELECT code_produit, created_at
            FROM favoris
            WHERE user_id = ?
            ORDER BY created_at DESC
        `);
        return stmt.all(user_id);
    }

    /**
     * Vérifier si un produit est en favori
     */
    static isFavorite(user_id, code_produit) {
        const stmt = db.prepare('SELECT id FROM favoris WHERE user_id = ? AND code_produit = ?');
        return stmt.get(user_id, code_produit) !== undefined;
    }

    /**
     * Compter les favoris d'un utilisateur
     */
    static countByUser(user_id) {
        const stmt = db.prepare('SELECT COUNT(*) as count FROM favoris WHERE user_id = ?');
        return stmt.get(user_id).count;
    }

    /**
     * Supprimer tous les favoris d'un utilisateur
     */
    static clearAll(user_id) {
        const stmt = db.prepare('DELETE FROM favoris WHERE user_id = ?');
        return stmt.run(user_id);
    }
}

module.exports = Favoris;
