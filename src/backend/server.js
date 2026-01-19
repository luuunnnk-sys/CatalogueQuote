/**
 * Serveur principal Chubb Catalogue Pro
 * Application multi-utilisateurs sécurisée
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Importer les routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const devisRoutes = require('./routes/devis');
const favorisRoutes = require('./routes/favoris');
const preferencesRoutes = require('./routes/preferences');
const productsRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3000;

// Vérifier la présence du JWT_SECRET
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('REMPLACER')) {
    console.error('ERREUR: JWT_SECRET non configuré dans le fichier .env');
    console.error('Exécutez: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    console.error('Et copiez le résultat dans votre fichier .env');
    process.exit(1);
}

// Middleware de sécurité
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"]
        }
    }
}));

// CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGIN || true
        : true,
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes par fenêtre
    message: { error: 'Trop de requêtes, veuillez réessayer plus tard' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 tentatives de connexion par 15 min
    message: { error: 'Trop de tentatives de connexion, veuillez réessayer plus tard' }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/devis', devisRoutes);
app.use('/api/favoris', favorisRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/products', productsRoutes);

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Servir les fichiers PDF des fiches catalogue
app.use('/fiches', express.static(path.join(__dirname, '../../Fiche catalogue')));

// Route catch-all pour SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur interne' });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log('');
    console.log('===========================================');
    console.log('  CHUBB CATALOGUE PRO - Serveur démarré');
    console.log('===========================================');
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log('===========================================');
    console.log('');
});
