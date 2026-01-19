/**
 * Script d'initialisation de la base de données
 * Crée les tables et l'admin initial si nécessaire
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const db = require('../config/database');
const User = require('../models/User');

console.log('Initialisation de la base de données...');
console.log('');

// Vérifier si un admin existe
if (!User.adminExists()) {
    console.log('Aucun administrateur trouvé. Création du compte admin initial...');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@chubb.fr';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

    try {
        const admin = User.create({
            email: adminEmail,
            password: adminPassword,
            nom: 'Administrateur',
            prenom: 'Système',
            role: 'admin'
        });

        console.log(`Admin créé avec succès:`);
        console.log(`  Email: ${adminEmail}`);
        console.log(`  Mot de passe: ${adminPassword}`);
        console.log('');
        console.log('IMPORTANT: Changez ce mot de passe après la première connexion!');
    } catch (error) {
        console.error('Erreur lors de la création de l\'admin:', error.message);
    }
} else {
    console.log('Un administrateur existe déjà.');
}

// Afficher les stats
const userCount = User.count();
console.log('');
console.log(`Base de données initialisée.`);
console.log(`Nombre d'utilisateurs: ${userCount}`);
console.log('');

process.exit(0);
