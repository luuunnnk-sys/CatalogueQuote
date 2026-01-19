/**
 * Modèle Preferences - Préférences utilisateur
 */
const db = require('../config/database');

class Preferences {
    /**
     * Obtenir les préférences d'un utilisateur
     */
    static get(user_id) {
        const stmt = db.prepare('SELECT * FROM preferences WHERE user_id = ?');
        let prefs = stmt.get(user_id);

        // Créer les préférences par défaut si elles n'existent pas
        if (!prefs) {
            this.create(user_id);
            prefs = { user_id, dark_mode: 0, tri_defaut: 'code_asc' };
        }

        return {
            darkMode: prefs.dark_mode === 1,
            triDefaut: prefs.tri_defaut
        };
    }

    /**
     * Créer les préférences par défaut
     */
    static create(user_id) {
        const stmt = db.prepare('INSERT OR IGNORE INTO preferences (user_id) VALUES (?)');
        stmt.run(user_id);
    }

    /**
     * Mettre à jour les préférences
     */
    static update(user_id, { darkMode, triDefaut }) {
        // S'assurer que les préférences existent
        this.create(user_id);

        const stmt = db.prepare(`
            UPDATE preferences
            SET dark_mode = ?, tri_defaut = ?
            WHERE user_id = ?
        `);

        stmt.run(darkMode ? 1 : 0, triDefaut || 'code_asc', user_id);
        return this.get(user_id);
    }

    /**
     * Mettre à jour le mode sombre uniquement
     */
    static setDarkMode(user_id, darkMode) {
        this.create(user_id);
        const stmt = db.prepare('UPDATE preferences SET dark_mode = ? WHERE user_id = ?');
        stmt.run(darkMode ? 1 : 0, user_id);
    }

    /**
     * Mettre à jour le tri par défaut
     */
    static setTriDefaut(user_id, triDefaut) {
        this.create(user_id);
        const stmt = db.prepare('UPDATE preferences SET tri_defaut = ? WHERE user_id = ?');
        stmt.run(triDefaut, user_id);
    }
}

module.exports = Preferences;
