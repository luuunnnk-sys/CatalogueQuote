/**
 * Routes de gestion des utilisateurs (Admin)
 */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { adminRequired } = require('../middleware/auth');

/**
 * GET /api/users
 * Lister tous les utilisateurs
 */
router.get('/', adminRequired, (req, res) => {
    try {
        const users = User.findAll();
        res.json(users);
    } catch (error) {
        console.error('Erreur liste users:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * POST /api/users
 * Créer un utilisateur
 */
router.post('/', adminRequired, (req, res) => {
    try {
        const { email, password, nom, prenom, role } = req.body;

        // Validations
        if (!email || !password || !nom || !prenom) {
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Le mot de passe doit faire au moins 8 caractères' });
        }

        // Vérifier si l'email existe déjà
        if (User.findByEmail(email)) {
            return res.status(409).json({ error: 'Cet email est déjà utilisé' });
        }

        const user = User.create({
            email,
            password,
            nom,
            prenom,
            role: role || 'commercial'
        });

        res.status(201).json(user);
    } catch (error) {
        console.error('Erreur création user:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * GET /api/users/:id
 * Récupérer un utilisateur
 */
router.get('/:id', adminRequired, (req, res) => {
    try {
        const user = User.findById(parseInt(req.params.id));

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.json(user);
    } catch (error) {
        console.error('Erreur get user:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * PUT /api/users/:id
 * Modifier un utilisateur
 */
router.put('/:id', adminRequired, (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { email, nom, prenom, role, actif } = req.body;

        const existingUser = User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Vérifier si l'email est pris par un autre utilisateur
        const emailUser = User.findByEmail(email);
        if (emailUser && emailUser.id !== userId) {
            return res.status(409).json({ error: 'Cet email est déjà utilisé' });
        }

        const user = User.update(userId, {
            email: email || existingUser.email,
            nom: nom || existingUser.nom,
            prenom: prenom || existingUser.prenom,
            role: role || existingUser.role,
            actif: actif !== undefined ? actif : existingUser.actif
        });

        res.json(user);
    } catch (error) {
        console.error('Erreur update user:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * PUT /api/users/:id/password
 * Réinitialiser le mot de passe d'un utilisateur
 */
router.put('/:id/password', adminRequired, (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'Le mot de passe doit faire au moins 8 caractères' });
        }

        const user = User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        User.updatePassword(userId, newPassword);
        res.json({ message: 'Mot de passe réinitialisé' });
    } catch (error) {
        console.error('Erreur reset password:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * DELETE /api/users/:id
 * Supprimer un utilisateur
 */
router.delete('/:id', adminRequired, (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Empêcher de se supprimer soi-même
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
        }

        const user = User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        User.delete(userId);
        res.json({ message: 'Utilisateur supprimé' });
    } catch (error) {
        console.error('Erreur delete user:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
