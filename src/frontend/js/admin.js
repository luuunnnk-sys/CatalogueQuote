/**
 * Gestion du panneau d'administration
 */

const Admin = {
    users: [],
    editingUserId: null,

    /**
     * Charge et affiche la liste des utilisateurs
     */
    async loadUsers() {
        try {
            this.users = await API.getUsers();
            this.renderUsersTable();
        } catch (error) {
            Toast.error('Erreur lors du chargement des utilisateurs');
        }
    },

    /**
     * Affiche le tableau des utilisateurs
     */
    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (this.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">
                        Aucun utilisateur trouvé
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>
                    <div style="font-weight:500;">${user.prenom} ${user.nom}</div>
                    <div style="font-size:0.85rem;color:var(--text-muted);">${user.email}</div>
                </td>
                <td>
                    <span class="role-badge ${user.role}">${user.role === 'admin' ? 'Admin' : 'Commercial'}</span>
                </td>
                <td>
                    <span class="user-status ${user.actif ? 'active' : 'inactive'}">
                        <span style="width:8px;height:8px;border-radius:50%;background:currentColor;"></span>
                        ${user.actif ? 'Actif' : 'Inactif'}
                    </span>
                </td>
                <td style="font-size:0.85rem;color:var(--text-muted);">
                    ${user.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : 'Jamais'}
                </td>
                <td style="font-size:0.85rem;color:var(--text-muted);">
                    ${new Date(user.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon-only" onclick="Admin.editUser(${user.id})" title="Modifier">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-icon-only" onclick="Admin.resetPassword(${user.id})" title="Réinitialiser MDP">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </button>
                        <button class="btn-icon-only danger" onclick="Admin.deleteUser(${user.id})" title="Supprimer">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    /**
     * Ouvre le modal pour créer un utilisateur
     */
    showCreateModal() {
        this.editingUserId = null;
        document.getElementById('userFormTitle').textContent = 'Nouvel utilisateur';
        document.getElementById('userForm').reset();
        document.getElementById('passwordGroup').style.display = 'block';
        document.getElementById('userPassword').required = true;
        document.getElementById('userFormModal').classList.add('show');
    },

    /**
     * Ouvre le modal pour modifier un utilisateur
     */
    editUser(id) {
        const user = this.users.find(u => u.id === id);
        if (!user) return;

        this.editingUserId = id;
        document.getElementById('userFormTitle').textContent = 'Modifier l\'utilisateur';
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userNom').value = user.nom;
        document.getElementById('userPrenom').value = user.prenom;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userActif').checked = user.actif;
        document.getElementById('passwordGroup').style.display = 'none';
        document.getElementById('userPassword').required = false;
        document.getElementById('userFormModal').classList.add('show');
    },

    /**
     * Ferme le modal utilisateur
     */
    closeModal() {
        document.getElementById('userFormModal').classList.remove('show');
        this.editingUserId = null;
    },

    /**
     * Sauvegarde l'utilisateur (création ou modification)
     */
    async saveUser(e) {
        e.preventDefault();

        const userData = {
            email: document.getElementById('userEmail').value,
            nom: document.getElementById('userNom').value,
            prenom: document.getElementById('userPrenom').value,
            role: document.getElementById('userRole').value,
            actif: document.getElementById('userActif').checked
        };

        // Mot de passe uniquement pour création
        if (!this.editingUserId) {
            userData.password = document.getElementById('userPassword').value;
        }

        try {
            if (this.editingUserId) {
                await API.updateUser(this.editingUserId, userData);
                Toast.success('Utilisateur modifié');
            } else {
                await API.createUser(userData);
                Toast.success('Utilisateur créé');
            }

            this.closeModal();
            this.loadUsers();
        } catch (error) {
            Toast.error(error.message || 'Erreur lors de l\'enregistrement');
        }
    },

    /**
     * Réinitialise le mot de passe d'un utilisateur
     */
    async resetPassword(id) {
        const user = this.users.find(u => u.id === id);
        if (!user) return;

        const newPassword = prompt(`Nouveau mot de passe pour ${user.prenom} ${user.nom}:`);
        if (!newPassword) return;

        if (newPassword.length < 8) {
            Toast.error('Le mot de passe doit faire au moins 8 caractères');
            return;
        }

        try {
            await API.resetUserPassword(id, newPassword);
            Toast.success('Mot de passe réinitialisé');
        } catch (error) {
            Toast.error(error.message || 'Erreur lors de la réinitialisation');
        }
    },

    /**
     * Supprime un utilisateur
     */
    async deleteUser(id) {
        const user = this.users.find(u => u.id === id);
        if (!user) return;

        if (!confirm(`Supprimer l'utilisateur ${user.prenom} ${user.nom} ?\n\nCette action est irréversible.`)) {
            return;
        }

        try {
            await API.deleteUser(id);
            Toast.success('Utilisateur supprimé');
            this.loadUsers();
        } catch (error) {
            Toast.error(error.message || 'Erreur lors de la suppression');
        }
    },

    /**
     * Affiche le panneau admin
     */
    show() {
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        this.loadUsers();
    },

    /**
     * Masque le panneau admin
     */
    hide() {
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
    }
};

// Événement du formulaire
document.addEventListener('DOMContentLoaded', () => {
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', (e) => Admin.saveUser(e));
    }
});
