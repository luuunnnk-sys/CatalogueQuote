/**
 * Configuration de la base de données SQLite
 * Gère la connexion et l'initialisation des tables
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Chemin vers le fichier de base de données
const DB_PATH = path.join(__dirname, '../../../data/chubb.db');

// S'assurer que le dossier data existe
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Créer/ouvrir la base de données
const db = new Database(DB_PATH);

// Activer les clés étrangères
db.pragma('foreign_keys = ON');

// Créer les tables si elles n'existent pas
function initTables() {
    // Table des utilisateurs
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            nom TEXT NOT NULL,
            prenom TEXT NOT NULL,
            role TEXT DEFAULT 'commercial' CHECK(role IN ('admin', 'commercial')),
            actif INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        )
    `);

    // Table des devis sauvegardés
    db.exec(`
        CREATE TABLE IF NOT EXISTS devis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            nom TEXT NOT NULL,
            client_nom TEXT,
            client_adresse TEXT,
            client_projet TEXT,
            contenu TEXT NOT NULL,
            total REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Table des favoris par utilisateur
    db.exec(`
        CREATE TABLE IF NOT EXISTS favoris (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            code_produit TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, code_produit)
        )
    `);

    // Table des préférences utilisateur
    db.exec(`
        CREATE TABLE IF NOT EXISTS preferences (
            user_id INTEGER PRIMARY KEY,
            dark_mode INTEGER DEFAULT 0,
            tri_defaut TEXT DEFAULT 'code_asc',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    console.log('Tables de la base de données initialisées');
}

// Créer le compte admin initial si nécessaire
async function createAdminIfNeeded() {
    const bcrypt = require('bcryptjs');

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.log('Variables ADMIN_EMAIL/ADMIN_PASSWORD non définies, pas de création admin auto');
        return;
    }

    // Vérifier si l'admin existe déjà
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        db.prepare(`
            INSERT INTO users (email, password_hash, nom, prenom, role, actif)
            VALUES (?, ?, 'Admin', 'Système', 'admin', 1)
        `).run(adminEmail, passwordHash);
        console.log(`Compte admin créé: ${adminEmail}`);
    } else {
        console.log(`Compte admin existant: ${adminEmail}`);
    }
}

// Initialiser les tables au chargement
initTables();
createAdminIfNeeded();

module.exports = db;
