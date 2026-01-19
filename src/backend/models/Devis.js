/**
 * Modèle Devis - Gestion des devis sauvegardés
 */
const db = require('../config/database');

class Devis {
    /**
     * Créer un nouveau devis
     */
    static create({ user_id, nom, client_nom, client_adresse, client_projet, contenu, total }) {
        const stmt = db.prepare(`
            INSERT INTO devis (user_id, nom, client_nom, client_adresse, client_projet, contenu, total)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            user_id,
            nom,
            client_nom || '',
            client_adresse || '',
            client_projet || '',
            JSON.stringify(contenu),
            total || 0
        );

        return this.findById(result.lastInsertRowid);
    }

    /**
     * Trouver un devis par ID
     */
    static findById(id) {
        const stmt = db.prepare('SELECT * FROM devis WHERE id = ?');
        const devis = stmt.get(id);
        if (devis) {
            devis.contenu = JSON.parse(devis.contenu);
        }
        return devis;
    }

    /**
     * Lister tous les devis d'un utilisateur
     */
    static findByUser(user_id) {
        const stmt = db.prepare(`
            SELECT id, nom, client_nom, client_projet, total, created_at, updated_at
            FROM devis
            WHERE user_id = ?
            ORDER BY updated_at DESC
        `);
        return stmt.all(user_id);
    }

    /**
     * Mettre à jour un devis
     */
    static update(id, { nom, client_nom, client_adresse, client_projet, contenu, total }) {
        const stmt = db.prepare(`
            UPDATE devis
            SET nom = ?, client_nom = ?, client_adresse = ?, client_projet = ?,
                contenu = ?, total = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        stmt.run(
            nom,
            client_nom || '',
            client_adresse || '',
            client_projet || '',
            JSON.stringify(contenu),
            total || 0,
            id
        );

        return this.findById(id);
    }

    /**
     * Supprimer un devis
     */
    static delete(id) {
        const stmt = db.prepare('DELETE FROM devis WHERE id = ?');
        return stmt.run(id);
    }

    /**
     * Vérifier que le devis appartient à l'utilisateur
     */
    static belongsToUser(devisId, userId) {
        const stmt = db.prepare('SELECT id FROM devis WHERE id = ? AND user_id = ?');
        return stmt.get(devisId, userId) !== undefined;
    }

    /**
     * Compter les devis d'un utilisateur
     */
    static countByUser(user_id) {
        const stmt = db.prepare('SELECT COUNT(*) as count FROM devis WHERE user_id = ?');
        return stmt.get(user_id).count;
    }
}

module.exports = Devis;
