/**
 * Gestion de l'authentification
 */

const Auth = {
    user: null,
    preferences: null,

    /**
     * Vérifie si l'utilisateur est connecté
     */
    isLoggedIn() {
        return !!API.token;
    },

    /**
     * Vérifie si l'utilisateur est admin
     */
    isAdmin() {
        return this.user?.role === 'admin';
    },

    /**
     * Récupère l'utilisateur courant depuis le cache
     */
    getUser() {
        if (this.user) return this.user;
        try {
            this.user = JSON.parse(localStorage.getItem('chubb_user'));
            return this.user;
        } catch (e) {
            return null;
        }
    },

    /**
     * Sauvegarde l'utilisateur en cache
     */
    setUser(user) {
        this.user = user;
        localStorage.setItem('chubb_user', JSON.stringify(user));
    },

    /**
     * Récupère les préférences
     */
    getPreferences() {
        if (this.preferences) return this.preferences;
        try {
            this.preferences = JSON.parse(localStorage.getItem('chubb_preferences'));
            return this.preferences || { darkMode: false, triDefaut: 'code_asc' };
        } catch (e) {
            return { darkMode: false, triDefaut: 'code_asc' };
        }
    },

    /**
     * Sauvegarde les préférences
     */
    setPreferences(prefs) {
        this.preferences = prefs;
        localStorage.setItem('chubb_preferences', JSON.stringify(prefs));
    },

    /**
     * Gère la soumission du formulaire de connexion
     */
    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');
        const btn = document.getElementById('loginBtn');

        // Reset error
        errorDiv.classList.remove('show');
        errorDiv.textContent = '';

        // Validation basique
        if (!email || !password) {
            errorDiv.textContent = 'Veuillez remplir tous les champs';
            errorDiv.classList.add('show');
            return;
        }

        // Loading state
        btn.classList.add('loading');
        btn.disabled = true;

        try {
            const data = await API.login(email, password);

            // Sauvegarder les données
            this.setUser(data.user);
            this.setPreferences(data.preferences);

            // Recharger la page pour afficher l'application
            window.location.reload();
        } catch (error) {
            errorDiv.textContent = error.message || 'Erreur de connexion';
            errorDiv.classList.add('show');
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    },

    /**
     * Vérifie la session au chargement
     */
    async checkSession() {
        if (!this.isLoggedIn()) {
            return false;
        }

        try {
            const data = await API.getMe();
            this.setUser(data.user);
            this.setPreferences(data.preferences);
            return true;
        } catch (error) {
            // Session invalide
            API.logout();
            return false;
        }
    },

    /**
     * Affiche le formulaire de connexion
     */
    showLoginForm() {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('appPage').style.display = 'none';
    },

    /**
     * Affiche l'application principale
     */
    showApp() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('appPage').style.display = 'block';
    },

    /**
     * Met à jour l'affichage de l'utilisateur dans le header
     */
    updateUserDisplay() {
        const user = this.getUser();
        if (!user) return;

        // Avatar initiales
        const avatar = document.getElementById('userAvatar');
        if (avatar) {
            avatar.textContent = (user.prenom[0] + user.nom[0]).toUpperCase();
        }

        // Nom et rôle
        const nameEl = document.getElementById('userName');
        const roleEl = document.getElementById('userRole');
        if (nameEl) nameEl.textContent = `${user.prenom} ${user.nom}`;
        if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Administrateur' : 'Commercial';

        // Afficher/masquer le bouton admin
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn) {
            adminBtn.style.display = this.isAdmin() ? 'flex' : 'none';
        }
    },

    /**
     * Déconnexion
     */
    logout() {
        if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
            API.logout();
        }
    }
};

// Initialiser les événements du formulaire de connexion
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => Auth.handleLogin(e));
    }
});
