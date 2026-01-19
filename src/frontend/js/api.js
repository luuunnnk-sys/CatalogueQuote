/**
 * API Client - Gestion des appels au backend
 * Toutes les communications avec le serveur passent par ce module
 */

const API = {
    baseUrl: '/api',
    token: null,

    /**
     * Initialise le token depuis le localStorage
     */
    init() {
        this.token = localStorage.getItem('chubb_token');
    },

    /**
     * Configure le token d'authentification
     */
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('chubb_token', token);
        } else {
            localStorage.removeItem('chubb_token');
        }
    },

    /**
     * Effectue une requête HTTP
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Gérer les erreurs d'authentification
            if (response.status === 401) {
                this.setToken(null);
                window.location.reload();
                throw new Error('Session expirée');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur serveur');
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    },

    // ==================
    // AUTH
    // ==================
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        this.setToken(data.token);
        return data;
    },

    async getMe() {
        return this.request('/auth/me');
    },

    async changePassword(currentPassword, newPassword) {
        return this.request('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    },

    logout() {
        this.setToken(null);
        localStorage.removeItem('chubb_user');
        localStorage.removeItem('chubb_preferences');
        window.location.reload();
    },

    // ==================
    // USERS (Admin)
    // ==================
    async getUsers() {
        return this.request('/users');
    },

    async createUser(userData) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    async updateUser(id, userData) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },

    async resetUserPassword(id, newPassword) {
        return this.request(`/users/${id}/password`, {
            method: 'PUT',
            body: JSON.stringify({ newPassword })
        });
    },

    async deleteUser(id) {
        return this.request(`/users/${id}`, {
            method: 'DELETE'
        });
    },

    // ==================
    // PRODUCTS
    // ==================
    async getProducts() {
        return this.request('/products');
    },

    async searchProducts(params) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/products/search?${query}`);
    },

    async getFamilies() {
        return this.request('/products/families');
    },

    // ==================
    // DEVIS
    // ==================
    async getDevis() {
        return this.request('/devis');
    },

    async getDevisById(id) {
        return this.request(`/devis/${id}`);
    },

    async createDevis(devisData) {
        return this.request('/devis', {
            method: 'POST',
            body: JSON.stringify(devisData)
        });
    },

    async updateDevis(id, devisData) {
        return this.request(`/devis/${id}`, {
            method: 'PUT',
            body: JSON.stringify(devisData)
        });
    },

    async deleteDevis(id) {
        return this.request(`/devis/${id}`, {
            method: 'DELETE'
        });
    },

    // ==================
    // FAVORIS
    // ==================
    async getFavoris() {
        return this.request('/favoris');
    },

    async addFavori(code) {
        return this.request('/favoris', {
            method: 'POST',
            body: JSON.stringify({ code_produit: code })
        });
    },

    async removeFavori(code) {
        return this.request(`/favoris/${code}`, {
            method: 'DELETE'
        });
    },

    // ==================
    // PREFERENCES
    // ==================
    async getPreferences() {
        return this.request('/preferences');
    },

    async updatePreferences(prefs) {
        return this.request('/preferences', {
            method: 'PUT',
            body: JSON.stringify(prefs)
        });
    },

    async setDarkMode(darkMode) {
        return this.request('/preferences/dark-mode', {
            method: 'PUT',
            body: JSON.stringify({ darkMode })
        });
    }
};

// Initialiser au chargement
API.init();
