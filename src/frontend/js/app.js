/**
 * Application principale - Catalogue Chubb
 */

const App = {
    // State
    products: [],
    productIndex: {},
    selectedProducts: [],
    quoteChapters: [],
    quoteClientInfo: { name: '', address: '', project: '' },
    flashInfo: [],
    ssiCategories: {},
    stats: { total: 0, adressable: 0, conventionnel: 0 },
    favoris: [],

    // Filtres
    currentSSIFilter: 'all',
    currentTypeFilter: null,
    currentStatusFilter: null,
    currentPage: 1,
    filteredProducts: [],
    currentSortField: 'code',
    currentSortOrder: 'asc',

    // Config
    ITEMS_PER_PAGE: 50,
    DEBOUNCE_DELAY: 300,
    searchTimeout: null,
    draggedChapterIdx: null,

    /**
     * Initialise l'application
     */
    async init() {
        // Vérifier l'authentification
        const isLoggedIn = await Auth.checkSession();

        if (!isLoggedIn) {
            Auth.showLoginForm();
            return;
        }

        // Afficher l'application
        Auth.showApp();
        Auth.updateUserDisplay();

        // Appliquer les préférences
        this.applyPreferences();

        // Charger les données
        await this.loadProducts();
        await this.loadFavoris();
        this.loadCurrentQuote();

        // Initialiser l'UI
        this.setupEventListeners();
        this.updateStats();
        this.performSearch();
        this.updateQuoteView();
        this.updateClientInfoFields();
        this.renderFlashInfo();
    },

    /**
     * Applique les préférences utilisateur
     */
    applyPreferences() {
        const prefs = Auth.getPreferences();
        if (prefs.darkMode) {
            document.body.classList.add('dark-mode');
        }
        if (prefs.triDefaut) {
            const [field, order] = prefs.triDefaut.split('_');
            this.currentSortField = field || 'code';
            this.currentSortOrder = order || 'asc';
        }
    },

    /**
     * Charge les produits depuis l'API
     */
    async loadProducts() {
        try {
            this.products = [];
            const data = await API.getProducts();

            // Convertir l'objet en tableau
            for (const [code, product] of Object.entries(data)) {
                const p = {
                    code,
                    name: product.name || '',
                    price: product.price || '',
                    desc: product.description || '',
                    famille: product.famille || '',
                    sous_famille: product.sous_famille || '',
                    // Utiliser type/ssi des données si présents, sinon détecter
                    type: product.type || this.detectType(product),
                    ssi: product.ssi || this.detectSSI(product),
                    hasFiche: !!product.fiche,
                    url: product.fiche ? `/fiches/${product.fiche}` : null,
                    keywords: product.keywords || this.extractKeywords(product)
                };
                this.products.push(p);
                this.productIndex[code] = p;
            }

            // Calculer les stats
            this.stats.total = this.products.length;
            this.stats.adressable = this.products.filter(p => p.type === 'adressable').length;
            this.stats.conventionnel = this.products.filter(p => p.type === 'conventionnel').length;

            // Calculer les catégories SSI
            this.calculateSSICategories();

            console.log(`${this.products.length} produits chargés`);
        } catch (error) {
            Toast.error('Erreur lors du chargement des produits');
            console.error(error);
        }
    },

    /**
     * Détecte le type de système
     */
    detectType(product) {
        const text = `${product.name || ''} ${product.description || ''} ${product.famille || ''} ${product.sous_famille || ''}`.toLowerCase();

        // Mots-clés pour adressable
        const adressableKeywords = [
            'adressable', 'adress', 'adr ', 'nexus', 'initium', 'influence',
            'i.scan', 'iscan', 'c.scan', 'cscan', 'laser.scan', 'laserscan',
            'lon ftt', 'lon lpt', 'spectral', 'sati', 'activacom',
            'uti.com', 'utc.com', 'uth.pack', 'uti.pack', 'uti.micro',
            'uai ', 'uac ', 'ucr ', 'satc', ' sati'
        ];

        // Mots-clés pour conventionnel
        const conventionnelKeywords = [
            'conventionnel', 'convent', '4 fils', '2 fils',
            'collectif', 'directe', 'ten5', 'tsc1'
        ];

        for (const kw of adressableKeywords) {
            if (text.includes(kw)) return 'adressable';
        }

        for (const kw of conventionnelKeywords) {
            if (text.includes(kw)) return 'conventionnel';
        }

        return null;
    },

    /**
     * Détecte la catégorie SSI
     */
    detectSSI(product) {
        const famille = (product.famille || '').toLowerCase();
        const sousFamille = (product.sous_famille || '').toLowerCase();
        const text = `${famille} ${sousFamille}`;

        if (text.includes('détect') || text.includes('detect')) return 'detection';
        if (text.includes('alarm') || text.includes('signal')) return 'alarme';
        if (text.includes('central') || text.includes('ecs')) return 'centrale';
        if (text.includes('aliment')) return 'alimentation';
        if (text.includes('déclench')) return 'declencheur';
        if (text.includes('extinct')) return 'extinction';
        if (text.includes('désenfum')) return 'desenfumage';
        if (text.includes('interface') || text.includes('report')) return 'interface';
        if (text.includes('accessor')) return 'accessoire';

        return 'accessoire';
    },

    /**
     * Extrait les mots-clés pour la recherche
     */
    extractKeywords(product) {
        const text = `${product.name || ''} ${product.description || ''}`.toLowerCase();
        const keywords = [];

        const patterns = [
            { regex: /étanche|etanche|ip\d+/g, kw: 'étanche' },
            { regex: /laser/g, kw: 'laser' },
            { regex: /optique/g, kw: 'optique' },
            { regex: /thermique|chaleur/g, kw: 'thermique' },
            { regex: /dm|déclencheur manuel/g, kw: 'DM' },
            { regex: /sirène|sirene|sonore/g, kw: 'sirène' },
            { regex: /flash|lumineux/g, kw: 'flash' },
            { regex: /vesda/g, kw: 'VESDA' },
            { regex: /iscan/g, kw: 'iScan' },
            { regex: /daaf/g, kw: 'DAAF' }
        ];

        for (const { regex, kw } of patterns) {
            if (regex.test(text)) {
                keywords.push(kw);
            }
        }

        return keywords;
    },

    /**
     * Calcule les catégories SSI
     */
    calculateSSICategories() {
        this.ssiCategories = {
            detection: { name: 'Détection', count: 0 },
            alarme: { name: 'Alarme & Signalisation', count: 0 },
            centrale: { name: 'Centrales & ECS', count: 0 },
            alimentation: { name: 'Alimentation', count: 0 },
            declencheur: { name: 'Déclencheurs', count: 0 },
            extinction: { name: 'Extinction', count: 0 },
            desenfumage: { name: 'Désenfumage', count: 0 },
            interface: { name: 'Interfaces & Reports', count: 0 },
            accessoire: { name: 'Accessoires', count: 0 }
        };

        for (const p of this.products) {
            if (p.ssi && this.ssiCategories[p.ssi]) {
                this.ssiCategories[p.ssi].count++;
            }
        }
    },

    /**
     * Charge les favoris de l'utilisateur
     */
    async loadFavoris() {
        try {
            this.favoris = await API.getFavoris();
        } catch (error) {
            console.error('Erreur chargement favoris:', error);
            this.favoris = [];
        }
    },

    /**
     * Met à jour l'affichage des stats
     */
    updateStats() {
        document.getElementById('statTotal').textContent = this.stats.total.toLocaleString();
        document.getElementById('statAdressable').textContent = this.stats.adressable.toLocaleString();
        document.getElementById('statConventionnel').textContent = this.stats.conventionnel.toLocaleString();
        document.getElementById('filterAllCount').textContent = this.stats.total.toLocaleString();

        // Mettre à jour les compteurs SSI
        document.querySelectorAll('.filter-item[data-ssi]').forEach(item => {
            const ssi = item.dataset.ssi;
            if (ssi !== 'all' && this.ssiCategories[ssi]) {
                item.querySelector('.count').textContent = this.ssiCategories[ssi].count.toLocaleString();
            }
        });

        // Compteurs type
        document.querySelectorAll('.filter-item[data-type]').forEach(item => {
            const type = item.dataset.type;
            const count = this.products.filter(p => p.type === type).length;
            item.querySelector('.count').textContent = count.toLocaleString();
        });

        // Compteur fiches
        const ficheCount = this.products.filter(p => p.hasFiche || p.url).length;
        document.querySelector('[data-status="fiche"] .count').textContent = ficheCount.toLocaleString();
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-item').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.content-section').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                const tabId = document.getElementById('tab-' + tab.dataset.tab);
                if (tabId) tabId.classList.add('active');
            });
        });

        // Filtres SSI
        document.querySelectorAll('.filter-item[data-ssi]').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.filter-item[data-ssi]').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentSSIFilter = item.dataset.ssi;
                this.currentPage = 1;
                this.performSearch();
            });
        });

        // Filtres Type
        document.querySelectorAll('.filter-item[data-type]').forEach(item => {
            item.addEventListener('click', () => {
                if (item.classList.contains('active')) {
                    item.classList.remove('active');
                    this.currentTypeFilter = null;
                } else {
                    document.querySelectorAll('.filter-item[data-type]').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    this.currentTypeFilter = item.dataset.type;
                }
                this.currentPage = 1;
                this.performSearch();
            });
        });

        // Filtres Status
        document.querySelectorAll('.filter-item[data-status]').forEach(item => {
            item.addEventListener('click', () => {
                if (item.classList.contains('active')) {
                    item.classList.remove('active');
                    this.currentStatusFilter = null;
                } else {
                    document.querySelectorAll('.filter-item[data-status]').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    this.currentStatusFilter = item.dataset.status;
                }
                this.currentPage = 1;
                this.performSearch();
            });
        });

        // Recherche
        document.getElementById('searchInput').addEventListener('input', () => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => this.performSearch(), this.DEBOUNCE_DELAY);
        });

        // Flash search
        document.getElementById('flashSearch')?.addEventListener('input', () => this.renderFlashInfo());

        // Raccourcis clavier
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeChapterModal();
                this.closeHistoryModal();
            }
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                document.getElementById('searchInput')?.focus();
            }
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (this.quoteChapters.length > 0) {
                    this.saveCurrentQuoteToHistory();
                }
            }
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                document.querySelector('[data-tab="quote"]')?.click();
            }
        });

        // Fermer modals en cliquant dehors
        document.getElementById('modalOverlay')?.addEventListener('click', e => {
            if (e.target.id === 'modalOverlay') this.closeModal();
        });
        document.getElementById('chapterSelectModal')?.addEventListener('click', e => {
            if (e.target.id === 'chapterSelectModal') this.closeChapterModal();
        });
        document.getElementById('historyModal')?.addEventListener('click', e => {
            if (e.target.id === 'historyModal') this.closeHistoryModal();
        });
    },

    // ==================
    // RECHERCHE & AFFICHAGE
    // ==================

    normalize(str) {
        return (str || '').toLowerCase().replace(/[\.\s\-\/\(\)\']/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },

    performSearch() {
        const query = this.normalize(document.getElementById('searchInput').value);
        this.filteredProducts = [...this.products];

        // Recherche texte
        if (query && query.length >= 2) {
            this.filteredProducts = this.filteredProducts.filter(p => {
                if (this.normalize(p.code).includes(query)) return true;
                if (this.normalize(p.name).includes(query)) return true;
                if (p.keywords && p.keywords.some(kw => this.normalize(kw).includes(query))) return true;
                return false;
            });
        }

        // Filtre SSI
        if (this.currentSSIFilter !== 'all') {
            this.filteredProducts = this.filteredProducts.filter(p => p.ssi === this.currentSSIFilter);
        }

        // Filtre Type
        if (this.currentTypeFilter) {
            this.filteredProducts = this.filteredProducts.filter(p => p.type === this.currentTypeFilter);
        }

        // Filtre Status
        if (this.currentStatusFilter === 'fiche') {
            this.filteredProducts = this.filteredProducts.filter(p => p.hasFiche || p.url);
        }

        // Tri
        this.filteredProducts = this.applySorting(this.filteredProducts);

        this.renderProducts();
        this.renderPagination();
        this.updateSortButtons();
    },

    applySorting(products) {
        return [...products].sort((a, b) => {
            let valA, valB;
            switch (this.currentSortField) {
                case 'price':
                    valA = parseFloat(a.price?.replace(',', '.')) || 0;
                    valB = parseFloat(b.price?.replace(',', '.')) || 0;
                    break;
                case 'name':
                    valA = (a.name || '').toLowerCase();
                    valB = (b.name || '').toLowerCase();
                    break;
                default:
                    valA = a.code || '';
                    valB = b.code || '';
            }
            if (typeof valA === 'string') {
                return this.currentSortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return this.currentSortOrder === 'asc' ? valA - valB : valB - valA;
        });
    },

    sortProducts(field) {
        if (this.currentSortField === field) {
            this.currentSortOrder = this.currentSortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSortField = field;
            this.currentSortOrder = 'asc';
        }
        this.performSearch();

        // Sauvegarder la préférence
        API.updatePreferences({ triDefaut: `${field}_${this.currentSortOrder}` }).catch(() => {});
    },

    updateSortButtons() {
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.classList.remove('active', 'asc', 'desc');
            if (btn.dataset.sort === this.currentSortField) {
                btn.classList.add('active', this.currentSortOrder);
            }
        });
    },

    renderCard(product) {
        const isSelected = this.selectedProducts.some(p => p.code === product.code);
        let tags = '';

        if (product.type === 'adressable') tags += '<span class="tag tag-adressable">Adressable</span>';
        if (product.type === 'conventionnel') tags += '<span class="tag tag-conventionnel">Conventionnel</span>';
        if (product.hasFiche || product.url) tags += '<span class="tag tag-fiche">Fiche</span>';

        const priceDisplay = product.price ? `<div class="product-price">${product.price} €</div>` : '';

        return `
            <div class="product-card" onclick="App.openModal('${product.code}')">
                <input type="checkbox" class="product-checkbox" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation();App.toggleSelect('${product.code}')">
                <div class="product-code">${product.code}</div>
                <div class="product-name">${product.name}</div>
                ${priceDisplay}
                <div class="product-tags">${tags}</div>
            </div>
        `;
    },

    renderProducts() {
        const container = document.getElementById('productsGrid');
        const start = (this.currentPage - 1) * this.ITEMS_PER_PAGE;
        const end = start + this.ITEMS_PER_PAGE;
        const pageProducts = this.filteredProducts.slice(start, end);

        document.getElementById('searchResultsInfo').textContent = `${this.filteredProducts.length.toLocaleString()} résultat(s)`;

        if (pageProducts.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <h3>Aucun produit trouvé</h3>
                    <p>Essayez de modifier vos critères de recherche.</p>
                </div>`;
        } else {
            container.innerHTML = pageProducts.map(p => this.renderCard(p)).join('');
        }
    },

    renderPagination() {
        const container = document.getElementById('pagination');
        const totalPages = Math.ceil(this.filteredProducts.length / this.ITEMS_PER_PAGE);

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';
        html += `<button onclick="App.goToPage(1)" ${this.currentPage === 1 ? 'disabled' : ''}>«</button>`;
        html += `<button onclick="App.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>‹</button>`;

        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            html += `<button onclick="App.goToPage(1)">1</button>`;
            if (startPage > 2) html += `<span style="padding:0 8px;">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button onclick="App.goToPage(${i})" class="${i === this.currentPage ? 'active' : ''}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += `<span style="padding:0 8px;">...</span>`;
            html += `<button onclick="App.goToPage(${totalPages})">${totalPages}</button>`;
        }

        html += `<button onclick="App.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>›</button>`;
        html += `<button onclick="App.goToPage(${totalPages})" ${this.currentPage === totalPages ? 'disabled' : ''}>»</button>`;
        html += `<span class="pagination-info">Page ${this.currentPage} / ${totalPages}</span>`;

        container.innerHTML = html;
    },

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredProducts.length / this.ITEMS_PER_PAGE);
        this.currentPage = Math.max(1, Math.min(page, totalPages));
        this.renderProducts();
        this.renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // ==================
    // SÉLECTION
    // ==================

    toggleSelect(code) {
        const product = this.productIndex[code];
        const idx = this.selectedProducts.findIndex(p => p.code === code);
        if (idx >= 0) {
            this.selectedProducts.splice(idx, 1);
        } else {
            this.selectedProducts.push(product);
        }
        this.updateFloatingBar();
        this.renderProducts();
    },

    updateFloatingBar() {
        const bar = document.getElementById('floatingBar');
        document.getElementById('selectedCount').textContent = this.selectedProducts.length;
        bar.classList.toggle('show', this.selectedProducts.length > 0);
    },

    clearSelection() {
        this.selectedProducts = [];
        this.updateFloatingBar();
        this.renderProducts();
    },

    // ==================
    // MODAL PRODUIT
    // ==================

    openModal(code) {
        const product = this.productIndex[code];
        if (!product) return;

        document.getElementById('modalCode').textContent = product.code;
        document.getElementById('modalName').textContent = product.name;

        let html = '';

        if (product.desc) {
            html += '<div class="info-section"><div class="info-section-title">Description</div>';
            html += `<p style="color:var(--text-dark);line-height:1.6;margin:0;">${product.desc}</p></div>`;
        }

        html += '<div class="info-section"><div class="info-section-title">Informations</div><div class="info-grid">';
        html += `<div class="info-item"><div class="info-value">${product.price || '-'}</div><div class="info-label">Prix (EUR)</div></div>`;
        html += `<div class="info-item"><div class="info-value">${product.type || '-'}</div><div class="info-label">Système</div></div>`;
        html += `<div class="info-item"><div class="info-value">${product.ssi ? this.ssiCategories[product.ssi]?.name : '-'}</div><div class="info-label">Fonction SSI</div></div>`;
        html += '</div></div>';

        if (product.url) {
            html += '<div class="info-section"><div class="info-section-title">Fiche Technique</div>';
            html += `<a href="${product.url}" target="_blank" class="btn btn-primary"><svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg> Ouvrir la fiche</a></div>`;
        }

        if (product.keywords && product.keywords.length > 0) {
            html += '<div class="info-section"><div class="info-section-title">Mots-clés</div>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
            product.keywords.forEach(kw => {
                html += `<span class="tag" style="background:var(--bg-light);color:var(--text-muted);">${kw}</span>`;
            });
            html += '</div></div>';
        }

        html += `<div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--border);">
            <button class="btn btn-primary" onclick="App.addSingleToQuote('${product.code}')">Ajouter au devis</button>
        </div>`;

        document.getElementById('modalBody').innerHTML = html;
        document.getElementById('modalOverlay').classList.add('show');
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('show');
    },

    addSingleToQuote(code) {
        const product = this.productIndex[code];
        if (!this.selectedProducts.some(p => p.code === code)) {
            this.selectedProducts.push(product);
        }
        this.closeModal();
        this.openChapterSelectModal();
    },

    // ==================
    // DEVIS - suite dans la partie 2
    // ==================

    loadCurrentQuote() {
        try {
            const data = JSON.parse(localStorage.getItem('chubb_currentQuote'));
            if (data) {
                this.quoteChapters = data.chapters || [];
                this.quoteClientInfo = data.clientInfo || { name: '', address: '', project: '' };
            }
        } catch (e) { }
    },

    saveCurrentQuote() {
        const data = {
            chapters: this.quoteChapters,
            clientInfo: this.quoteClientInfo,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('chubb_currentQuote', JSON.stringify(data));
    },

    // ... Les autres méthodes de devis sont définies dans la suite
};

// Démarrer l'application au chargement
document.addEventListener('DOMContentLoaded', () => App.init());
