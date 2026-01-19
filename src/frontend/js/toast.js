/**
 * Système de notifications toast
 */

const Toast = {
    container: null,

    /**
     * Initialise le conteneur de toasts
     */
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    /**
     * Affiche un toast
     */
    show(message, type = 'info', duration = 4000) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;cursor:pointer;padding:4px;margin-left:auto;">✕</button>
        `;

        this.container.appendChild(toast);

        // Auto-fermeture
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'toastOut 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);

        return toast;
    },

    /**
     * Toast de succès
     */
    success(message) {
        return this.show(message, 'success');
    },

    /**
     * Toast d'erreur
     */
    error(message) {
        return this.show(message, 'error', 6000);
    },

    /**
     * Toast d'avertissement
     */
    warning(message) {
        return this.show(message, 'warning');
    },

    /**
     * Toast d'information
     */
    info(message) {
        return this.show(message, 'info');
    }
};

// Ajouter l'animation de sortie au CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes toastOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
    }
`;
document.head.appendChild(style);
