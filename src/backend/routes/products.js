/**
 * Routes pour les données produits
 * Sert les données produits depuis le serveur (pas exposé côté client)
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authRequired } = require('../middleware/auth');

// Chemins vers les fichiers de données
const DATA_PATH = path.join(__dirname, '../../../');
const PRICES_FILE = path.join(DATA_PATH, 'prices_data.json');
const FICHE_MATCHING_FILE = path.join(DATA_PATH, 'fiche_matching.json');

// Cache des données en mémoire
let pricesData = null;
let ficheMatching = null;

/**
 * Charger les données au démarrage
 */
function loadData() {
    try {
        if (fs.existsSync(PRICES_FILE)) {
            pricesData = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf-8'));
            console.log(`Données prix chargées: ${Object.keys(pricesData).length} produits`);
        } else {
            console.warn('Fichier prices_data.json non trouvé');
            pricesData = {};
        }

        if (fs.existsSync(FICHE_MATCHING_FILE)) {
            ficheMatching = JSON.parse(fs.readFileSync(FICHE_MATCHING_FILE, 'utf-8'));
            console.log(`Données fiches chargées: ${Object.keys(ficheMatching).length} matchings`);
        } else {
            console.warn('Fichier fiche_matching.json non trouvé');
            ficheMatching = {};
        }
    } catch (error) {
        console.error('Erreur chargement données:', error);
        pricesData = {};
        ficheMatching = {};
    }
}

// Charger les données au démarrage
loadData();

/**
 * GET /api/products
 * Récupérer tous les produits
 */
router.get('/', authRequired, (req, res) => {
    try {
        // Enrichir les données avec les fiches
        const products = {};

        for (const [code, data] of Object.entries(pricesData)) {
            // Ne pas inclure les codes commençant par 428 (doublons)
            if (code.startsWith('428')) continue;

            products[code] = {
                ...data,
                fiche: ficheMatching[code]?.fiche || null
            };
        }

        res.json(products);
    } catch (error) {
        console.error('Erreur get products:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * GET /api/products/search
 * Rechercher des produits
 */
router.get('/search', authRequired, (req, res) => {
    try {
        const { q, famille, sousFamille } = req.query;
        const results = [];

        for (const [code, data] of Object.entries(pricesData)) {
            if (code.startsWith('428')) continue;

            let match = true;

            // Filtre par recherche texte
            if (q) {
                const searchLower = q.toLowerCase();
                const nameMatch = data.name?.toLowerCase().includes(searchLower);
                const codeMatch = code.toLowerCase().includes(searchLower);
                const descMatch = data.description?.toLowerCase().includes(searchLower);

                if (!nameMatch && !codeMatch && !descMatch) {
                    match = false;
                }
            }

            // Filtre par famille
            if (match && famille) {
                if (data.famille !== famille) {
                    match = false;
                }
            }

            // Filtre par sous-famille
            if (match && sousFamille) {
                if (data.sous_famille !== sousFamille) {
                    match = false;
                }
            }

            if (match) {
                results.push({
                    code,
                    ...data,
                    fiche: ficheMatching[code]?.fiche || null
                });
            }
        }

        res.json(results);
    } catch (error) {
        console.error('Erreur search products:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * GET /api/products/families
 * Récupérer la liste des familles
 */
router.get('/families', authRequired, (req, res) => {
    try {
        const families = new Map();

        for (const [code, data] of Object.entries(pricesData)) {
            if (code.startsWith('428')) continue;

            const famille = data.famille || 'Autres';
            const sousFamille = data.sous_famille || '';

            if (!families.has(famille)) {
                families.set(famille, new Set());
            }

            if (sousFamille) {
                families.get(famille).add(sousFamille);
            }
        }

        // Convertir en objet
        const result = {};
        for (const [famille, sousFamilles] of families) {
            result[famille] = Array.from(sousFamilles).sort();
        }

        res.json(result);
    } catch (error) {
        console.error('Erreur get families:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * GET /api/products/:code
 * Récupérer un produit spécifique
 */
router.get('/:code', authRequired, (req, res) => {
    try {
        const code = req.params.code;
        const data = pricesData[code];

        if (!data) {
            return res.status(404).json({ error: 'Produit non trouvé' });
        }

        res.json({
            code,
            ...data,
            fiche: ficheMatching[code]?.fiche || null
        });
    } catch (error) {
        console.error('Erreur get product:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/**
 * POST /api/products/reload
 * Recharger les données (admin uniquement)
 */
router.post('/reload', authRequired, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }

    try {
        loadData();
        res.json({
            message: 'Données rechargées',
            products: Object.keys(pricesData).length,
            fiches: Object.keys(ficheMatching).length
        });
    } catch (error) {
        console.error('Erreur reload:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
