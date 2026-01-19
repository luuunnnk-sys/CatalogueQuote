/**
 * Routes d'authentification
 */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Preferences = require('../models/Preferences');
const { generateToken, authRequired } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Connexion utilisateur
 */
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        const user = User.findByEmail(email);

        if (!user) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        if (!user.actif) {
            return res.status(403).json({ error: 'Compte désactivé. Contactez l\'administrateur.' });
        }

        if (!User.verifyPassword(user, password)) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        // Mettre à jour la date de dernière connexion
        User.updateLastLogin(user.id);

        // Générer le token
        const token = generateToken(user);

        // Récupérer les préférences
        const preferences = Preferences.get(user.id);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                nom: user.nom,
                prenom: user.prenom,
                role: user.role
            },
            preferences
        });

    } catch (error) {
        console.error('Erreur login:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * GET /api/auth/me
 * Récupérer l'utilisateur courant
 */
router.get('/me', authRequired, (req, res) => {
    try {
        const preferences = Preferences.get(req.user.id);

        res.json({
            user: {
                id: req.user.id,
                email: req.user.email,
                nom: req.user.nom,
                prenom: req.user.prenom,
                role: req.user.role
            },
            preferences
        });
    } catch (error) {
        console.error('Erreur /me:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * POST /api/auth/change-password
 * Changer son mot de passe
 */
router.post('/change-password', authRequired, (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Mot de passe actuel et nouveau requis' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 8 caractères' });
        }

        // Vérifier l'ancien mot de passe
        const user = User.findByEmail(req.user.email);
        if (!User.verifyPassword(user, currentPassword)) {
            return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
        }

        // Mettre à jour
        User.updatePassword(req.user.id, newPassword);

        res.json({ message: 'Mot de passe modifié avec succès' });
    } catch (error) {
        console.error('Erreur change-password:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
