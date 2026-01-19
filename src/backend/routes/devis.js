/**
 * Routes de gestion des devis
 */
const express = require('express');
const router = express.Router();
const Devis = require('../models/Devis');
const { authRequired } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(authRequired);

/**
 * GET /api/devis
 * Lister les devis de l'utilisateur
 */
router.get('/', (req, res) => {
    try {
        const devis = Devis.findByUser(req.user.id);
        res.json(devis);
    } catch (error) {
        console.error('Erreur liste devis:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * POST /api/devis
 * Créer un nouveau devis
 */
router.post('/', (req, res) => {
    try {
        const { nom, client_nom, client_adresse, client_projet, contenu, total } = req.body;

        if (!nom || !contenu) {
            return res.status(400).json({ error: 'Nom et contenu requis' });
        }

        const devis = Devis.create({
            user_id: req.user.id,
            nom,
            client_nom,
            client_adresse,
            client_projet,
            contenu,
            total
        });

        res.status(201).json(devis);
    } catch (error) {
        console.error('Erreur création devis:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * GET /api/devis/:id
 * Récupérer un devis spécifique
 */
router.get('/:id', (req, res) => {
    try {
        const devisId = parseInt(req.params.id);

        // Vérifier que le devis appartient à l'utilisateur
        if (!Devis.belongsToUser(devisId, req.user.id)) {
            return res.status(404).json({ error: 'Devis non trouvé' });
        }

        const devis = Devis.findById(devisId);
        res.json(devis);
    } catch (error) {
        console.error('Erreur get devis:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * PUT /api/devis/:id
 * Mettre à jour un devis
 */
router.put('/:id', (req, res) => {
    try {
        const devisId = parseInt(req.params.id);

        // Vérifier que le devis appartient à l'utilisateur
        if (!Devis.belongsToUser(devisId, req.user.id)) {
            return res.status(404).json({ error: 'Devis non trouvé' });
        }

        const { nom, client_nom, client_adresse, client_projet, contenu, total } = req.body;

        const devis = Devis.update(devisId, {
            nom,
            client_nom,
            client_adresse,
            client_projet,
            contenu,
            total
        });

        res.json(devis);
    } catch (error) {
        console.error('Erreur update devis:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * DELETE /api/devis/:id
 * Supprimer un devis
 */
router.delete('/:id', (req, res) => {
    try {
        const devisId = parseInt(req.params.id);

        // Vérifier que le devis appartient à l'utilisateur
        if (!Devis.belongsToUser(devisId, req.user.id)) {
            return res.status(404).json({ error: 'Devis non trouvé' });
        }

        Devis.delete(devisId);
        res.json({ message: 'Devis supprimé' });
    } catch (error) {
        console.error('Erreur delete devis:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
