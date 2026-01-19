# Catalogue Pro - Portail Produits SSI

Application web multi-utilisateurs pour la gestion d'un catalogue produits Sécurité Incendie.

## Fonctionnalités

### Catalogue Produits
- **Recherche avancée** : Par code, nom ou mots-clés
- **Filtres** : Par fonction SSI, type système (adressable/conventionnel), présence de fiche
- **Tri** : Par code, nom ou prix
- **Fiches techniques** : Accès direct aux PDF

### Générateur de Devis
- **Chapitres** : Organisation des produits par sections
- **Quantités** : Modification directe dans le devis
- **Informations client** : Nom, adresse, référence projet
- **Historique** : Sauvegarde et chargement des devis précédents
- **Export PDF** : Devis formaté pour impression
- **Export Excel** : Fichier XLS modifiable

### Multi-utilisateurs
- **Authentification sécurisée** : JWT + mots de passe hashés
- **Rôles** : Administrateur / Commercial
- **Données individuelles** : Chaque commercial a ses propres devis et favoris
- **Interface admin** : Gestion des comptes utilisateurs

### Interface
- **Mode sombre** : Préférence sauvegardée par utilisateur
- **Responsive** : Adapté mobile/tablette/desktop
- **Raccourcis clavier** :
  - `Ctrl+F` : Focus sur la recherche
  - `Ctrl+S` : Sauvegarder le devis
  - `Ctrl+D` : Aller à l'onglet Devis
  - `Escape` : Fermer les modals

---

## Installation locale

### Prérequis
- Node.js 18+
- npm

### Installation

1. **Cloner le projet**
```bash
git clone <url-du-repo>
cd catalogue-pro
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**
```bash
cp .env.example .env
```

Éditer `.env` avec vos paramètres.

4. **Initialiser la base de données**
```bash
npm run init-db
```

5. **Démarrer le serveur**
```bash
npm start
```

L'application est accessible sur `http://localhost:3000`

---

## Déploiement

L'application est containerisée avec Docker et peut être déployée sur n'importe quelle plateforme compatible (Koyeb, Railway, Render, etc.).

### Variables d'environnement requises

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Clé secrète pour les tokens (min 32 caractères) |
| `ADMIN_EMAIL` | Email du compte administrateur initial |
| `ADMIN_PASSWORD` | Mot de passe du compte administrateur initial |
| `NODE_ENV` | `production` en déploiement |
| `PORT` | Port du serveur (défaut: 3000) |

---

## Structure du Projet

```
catalogue-pro/
├── src/
│   ├── backend/
│   │   ├── config/          # Configuration base de données
│   │   ├── middleware/      # Authentification JWT
│   │   ├── models/          # Modèles de données
│   │   ├── routes/          # Routes API
│   │   ├── utils/           # Utilitaires
│   │   └── server.js        # Serveur Express
│   │
│   └── frontend/
│       ├── css/             # Styles
│       ├── js/              # Modules JavaScript
│       ├── assets/          # Images, favicon
│       └── index.html       # Page principale
│
├── data/                    # Base de données SQLite
├── Fiche catalogue/         # PDFs des fiches produits
├── prices_data.json         # Données produits
├── fiche_matching.json      # Associations produits-fiches
├── package.json
├── Dockerfile
└── README.md
```

---

## Utilisation

### Onglet Catalogue
- Liste des produits avec recherche et filtres
- Cliquer sur un produit pour voir les détails
- Cocher les produits puis "Ajouter au devis"

### Onglet Notes Techniques
- Liste des documents Flash Info et notes techniques
- Recherche par titre

### Onglet Devis
- **Informations client** : Cliquer pour déplier/replier
- **Chapitres** : Glisser-déposer pour réorganiser
- **Produits** : Modifier les quantités, supprimer
- **Actions** : Historique, Sauvegarder, Export PDF/Excel

---

## Gestion des Utilisateurs (Admin)

Accessible via le menu utilisateur → "Gestion utilisateurs"

- **Créer** : Nouvel utilisateur avec email, nom, rôle
- **Modifier** : Changer les informations d'un compte
- **Réinitialiser** : Nouveau mot de passe
- **Désactiver** : Bloquer l'accès sans supprimer le compte

---

## Sécurité

- Mots de passe hashés (bcrypt)
- Tokens JWT avec expiration
- HTTPS forcé en production
- Rate limiting sur les endpoints
- Headers sécurisés (Helmet.js)

---

## Support

Pour toute question ou problème, contacter l'administrateur système.

---

**Portail Produits SSI v2.0**
