/**
 * Routes de gestion des préférences utilisateur
 */
const express = require('express');
const router = express.Router();
const Preferences = require('../models/Preferences');
const { authRequired } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(authRequired);

/**
 * GET /api/preferences
 * Récupérer les préférences de l'utilisateur
 */
router.get('/', (req, res) => {
    try {
        const preferences = Preferences.get(req.user.id);
        res.json(preferences);
    } catch (error) {
        console.error('Erreur get preferences:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * PUT /api/preferences
 * Mettre à jour les préférences
 */
router.put('/', (req, res) => {
    try {
        const { darkMode, triDefaut } = req.body;
        const preferences = Preferences.update(req.user.id, { darkMode, triDefaut });
        res.json(preferences);
    } catch (error) {
        console.error('Erreur update preferences:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * PUT /api/preferences/dark-mode
 * Activer/désactiver le mode sombre
 */
router.put('/dark-mode', (req, res) => {
    try {
        const { darkMode } = req.body;
        Preferences.setDarkMode(req.user.id, darkMode);
        res.json({ darkMode });
    } catch (error) {
        console.error('Erreur set dark mode:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
