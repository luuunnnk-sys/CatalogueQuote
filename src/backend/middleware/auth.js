/**
 * Middleware d'authentification JWT
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Vérifie le token JWT et ajoute l'utilisateur à la requête
 */
function authRequired(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: 'Utilisateur non trouvé' });
        }

        if (!user.actif) {
            return res.status(403).json({ error: 'Compte désactivé' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Session expirée' });
        }
        return res.status(401).json({ error: 'Token invalide' });
    }
}

/**
 * Vérifie que l'utilisateur est admin
 */
function adminRequired(req, res, next) {
    authRequired(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
        }
        next();
    });
}

/**
 * Génère un token JWT
 */
function generateToken(user) {
    const expiresIn = parseInt(process.env.JWT_EXPIRES_IN) || 24;
    return jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: `${expiresIn}h` }
    );
}

module.exports = { authRequired, adminRequired, generateToken };
