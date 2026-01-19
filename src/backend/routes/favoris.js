/**
 * Routes de gestion des favoris
 */
const express = require('express');
const router = express.Router();
const Favoris = require('../models/Favoris');
const { authRequired } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(authRequired);

/**
 * GET /api/favoris
 * Lister les favoris de l'utilisateur
 */
router.get('/', (req, res) => {
    try {
        const favoris = Favoris.findByUser(req.user.id);
        // Retourner juste les codes produits
        const codes = favoris.map(f => f.code_produit);
        res.json(codes);
    } catch (error) {
        console.error('Erreur liste favoris:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * POST /api/favoris
 * Ajouter un favori
 */
router.post('/', (req, res) => {
    try {
        const { code_produit } = req.body;

        if (!code_produit) {
            return res.status(400).json({ error: 'Code produit requis' });
        }

        Favoris.add(req.user.id, code_produit);
        res.status(201).json({ message: 'Favori ajouté' });
    } catch (error) {
        console.error('Erreur ajout favori:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * DELETE /api/favoris/:code
 * Supprimer un favori
 */
router.delete('/:code', (req, res) => {
    try {
        Favoris.remove(req.user.id, req.params.code);
        res.json({ message: 'Favori supprimé' });
    } catch (error) {
        console.error('Erreur suppression favori:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * GET /api/favoris/:code/check
 * Vérifier si un produit est en favori
 */
router.get('/:code/check', (req, res) => {
    try {
        const isFavorite = Favoris.isFavorite(req.user.id, req.params.code);
        res.json({ isFavorite });
    } catch (error) {
        console.error('Erreur check favori:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * DELETE /api/favoris
 * Supprimer tous les favoris
 */
router.delete('/', (req, res) => {
    try {
        Favoris.clearAll(req.user.id);
        res.json({ message: 'Tous les favoris supprimés' });
    } catch (error) {
        console.error('Erreur clear favoris:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
