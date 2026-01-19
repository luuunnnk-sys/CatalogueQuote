/**
 * Gestion des devis - Extension de App
 */

// Étendre l'objet App avec les méthodes de devis
Object.assign(App, {

    // ==================
    // CHAPITRE SELECTION MODAL
    // ==================

    openChapterSelectModal() {
        if (this.selectedProducts.length === 0) return;

        document.getElementById('chapterModalProductCount').textContent = this.selectedProducts.length;

        const listContainer = document.getElementById('chapterSelectList');

        if (this.quoteChapters.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align:center;padding:20px;color:var(--text-muted);">
                    <p>Aucun chapitre existant.</p>
                    <p style="font-size:0.9rem;margin-top:8px;">Créez un nouveau chapitre ci-dessous.</p>
                </div>`;
        } else {
            listContainer.innerHTML = this.quoteChapters.map((chapter, idx) => `
                <button class="chapter-select-btn" onclick="App.addToSpecificChapter(${idx})">
                    <span style="font-weight:500;">${chapter.name}</span>
                    <span style="color:var(--text-muted);font-size:0.85rem;">${chapter.products.length} produit(s)</span>
                </button>
            `).join('');
        }

        document.getElementById('chapterSelectModal').classList.add('show');
    },

    closeChapterModal() {
        document.getElementById('chapterSelectModal').classList.remove('show');
    },

    createAndAddToChapter() {
        const name = prompt('Nom du nouveau chapitre:', 'Nouveau chapitre');
        if (name) {
            this.quoteChapters.push({ name, products: [] });
            this.addToSpecificChapter(this.quoteChapters.length - 1);
        }
    },

    addToSpecificChapter(chapterIdx) {
        this.selectedProducts.forEach(p => {
            if (!this.quoteChapters[chapterIdx].products.some(q => q.code === p.code)) {
                this.quoteChapters[chapterIdx].products.push({ ...p, qty: 1 });
            }
        });

        this.closeChapterModal();
        this.clearSelection();
        document.querySelector('[data-tab="quote"]').click();
        this.updateQuoteView();
    },

    // ==================
    // GESTION DES CHAPITRES
    // ==================

    addChapter() {
        const name = prompt('Nom du chapitre:', 'Nouveau chapitre');
        if (name) {
            this.quoteChapters.push({ name, products: [] });
            this.updateQuoteView();
        }
    },

    renameChapter(idx) {
        const name = prompt('Nouveau nom:', this.quoteChapters[idx].name);
        if (name) {
            this.quoteChapters[idx].name = name;
            this.updateQuoteView();
        }
    },

    deleteChapter(idx) {
        if (confirm('Supprimer ce chapitre et ses produits ?')) {
            this.quoteChapters.splice(idx, 1);
            this.updateQuoteView();
        }
    },

    duplicateChapter(idx) {
        const original = this.quoteChapters[idx];
        const copy = {
            name: original.name + ' (copie)',
            products: JSON.parse(JSON.stringify(original.products))
        };
        this.quoteChapters.splice(idx + 1, 0, copy);
        this.updateQuoteView();
    },

    moveChapterUp(idx) {
        if (idx > 0) {
            [this.quoteChapters[idx - 1], this.quoteChapters[idx]] = [this.quoteChapters[idx], this.quoteChapters[idx - 1]];
            this.updateQuoteView();
        }
    },

    moveChapterDown(idx) {
        if (idx < this.quoteChapters.length - 1) {
            [this.quoteChapters[idx], this.quoteChapters[idx + 1]] = [this.quoteChapters[idx + 1], this.quoteChapters[idx]];
            this.updateQuoteView();
        }
    },

    updateChapterQty(chapterIdx, prodIdx, val) {
        this.quoteChapters[chapterIdx].products[prodIdx].qty = parseInt(val) || 1;
        this.updateQuoteView();
    },

    removeFromChapter(chapterIdx, prodIdx) {
        this.quoteChapters[chapterIdx].products.splice(prodIdx, 1);
        this.updateQuoteView();
    },

    clearQuote() {
        if (confirm('Vider tout le devis ?')) {
            this.quoteChapters = [];
            this.quoteClientInfo = { name: '', address: '', project: '' };
            this.saveCurrentQuote();
            this.updateQuoteView();
            this.updateClientInfoFields();
        }
    },

    // ==================
    // DRAG & DROP
    // ==================

    handleChapterDragStart(e, idx) {
        this.draggedChapterIdx = idx;
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    },

    handleChapterDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    },

    handleChapterDrop(e, targetIdx) {
        e.preventDefault();
        if (this.draggedChapterIdx !== null && this.draggedChapterIdx !== targetIdx) {
            const draggedChapter = this.quoteChapters.splice(this.draggedChapterIdx, 1)[0];
            this.quoteChapters.splice(targetIdx, 0, draggedChapter);
            this.updateQuoteView();
        }
    },

    handleChapterDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
        this.draggedChapterIdx = null;
    },

    // ==================
    // CLIENT INFO
    // ==================

    toggleClientInfo() {
        const body = document.getElementById('clientInfoBody');
        const toggle = document.getElementById('clientInfoToggle');
        body.classList.toggle('collapsed');
        toggle.style.transform = body.classList.contains('collapsed') ? 'rotate(-90deg)' : '';
    },

    updateClientInfo() {
        this.quoteClientInfo.name = document.getElementById('clientName')?.value || '';
        this.quoteClientInfo.address = document.getElementById('clientAddress')?.value || '';
        this.quoteClientInfo.project = document.getElementById('clientProject')?.value || '';
        this.saveCurrentQuote();
    },

    updateClientInfoFields() {
        const nameField = document.getElementById('clientName');
        const addressField = document.getElementById('clientAddress');
        const projectField = document.getElementById('clientProject');
        if (nameField) nameField.value = this.quoteClientInfo.name || '';
        if (addressField) addressField.value = this.quoteClientInfo.address || '';
        if (projectField) projectField.value = this.quoteClientInfo.project || '';
    },

    // ==================
    // HISTORIQUE
    // ==================

    getQuoteHistory() {
        try {
            return JSON.parse(localStorage.getItem('chubb_quoteHistory')) || [];
        } catch (e) { return []; }
    },

    saveQuoteToHistory(name) {
        const history = this.getQuoteHistory();
        const quote = {
            id: Date.now(),
            name: name || `Devis du ${new Date().toLocaleDateString('fr-FR')}`,
            chapters: JSON.parse(JSON.stringify(this.quoteChapters)),
            clientInfo: { ...this.quoteClientInfo },
            savedAt: new Date().toISOString(),
            total: this.quoteChapters.reduce((sum, c) => sum + c.products.reduce((s, p) => s + (parseFloat(p.price?.replace(',', '.')) || 0) * p.qty, 0), 0)
        };
        history.unshift(quote);
        if (history.length > 20) history.pop();
        localStorage.setItem('chubb_quoteHistory', JSON.stringify(history));
        return quote.id;
    },

    loadQuoteFromHistory(id) {
        const history = this.getQuoteHistory();
        const quote = history.find(q => q.id === id);
        if (quote) {
            this.quoteChapters = JSON.parse(JSON.stringify(quote.chapters));
            this.quoteClientInfo = { ...quote.clientInfo };
            this.saveCurrentQuote();
            this.updateQuoteView();
            this.updateClientInfoFields();
        }
    },

    deleteQuoteFromHistory(id) {
        let history = this.getQuoteHistory();
        history = history.filter(q => q.id !== id);
        localStorage.setItem('chubb_quoteHistory', JSON.stringify(history));
    },

    showQuoteHistory() {
        const history = this.getQuoteHistory();
        const container = document.getElementById('historyList');

        if (history.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px;">Aucun devis sauvegardé</p>`;
        } else {
            container.innerHTML = history.map(q => `
                <div class="history-item">
                    <div class="history-info">
                        <div class="history-name">${q.name}</div>
                        <div class="history-meta">${new Date(q.savedAt).toLocaleDateString('fr-FR')} • ${q.chapters?.length || 0} chapitres • ${q.total?.toFixed(2) || '0.00'} €</div>
                    </div>
                    <div class="history-actions">
                        <button class="btn btn-outline btn-sm" onclick="App.loadQuoteFromHistory(${q.id}); App.closeHistoryModal();">Charger</button>
                        <button class="btn btn-outline btn-sm" style="color:var(--danger);border-color:var(--danger);" onclick="App.deleteQuoteFromHistory(${q.id}); App.showQuoteHistory();">Suppr.</button>
                    </div>
                </div>
            `).join('');
        }

        document.getElementById('historyModal').classList.add('show');
    },

    closeHistoryModal() {
        document.getElementById('historyModal').classList.remove('show');
    },

    saveCurrentQuoteToHistory() {
        if (this.quoteChapters.length === 0) {
            Toast.warning('Le devis est vide.');
            return;
        }
        const name = prompt('Nom du devis:', this.quoteClientInfo.name || `Devis du ${new Date().toLocaleDateString('fr-FR')}`);
        if (name) {
            this.saveQuoteToHistory(name);
            Toast.success('Devis sauvegardé dans l\'historique.');
        }
    },

    // ==================
    // RENDU DU DEVIS
    // ==================

    updateQuoteView() {
        const container = document.getElementById('quoteContent');

        if (this.quoteChapters.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:60px 20px;background:var(--bg-white);border-radius:12px;border:2px dashed var(--border);">
                    <div style="font-size:3rem;margin-bottom:16px;">📋</div>
                    <p style="color:var(--text-muted);margin-bottom:20px;">Aucun chapitre créé. Créez un chapitre puis ajoutez des produits.</p>
                    <button class="btn btn-primary" onclick="App.addChapter()">+ Créer un chapitre</button>
                </div>`;
            this.saveCurrentQuote();
            return;
        }

        let html = '<div id="chaptersContainer">';
        let grandTotal = 0;

        this.quoteChapters.forEach((chapter, chapterIdx) => {
            const chapterTotal = chapter.products.reduce((sum, p) => sum + (parseFloat(p.price?.replace(',', '.')) || 0) * p.qty, 0);
            grandTotal += chapterTotal;

            html += `
            <div class="quote-chapter" draggable="true" data-chapter="${chapterIdx}"
                ondragstart="App.handleChapterDragStart(event, ${chapterIdx})"
                ondragover="App.handleChapterDragOver(event)"
                ondrop="App.handleChapterDrop(event, ${chapterIdx})"
                ondragend="App.handleChapterDragEnd(event)">
                <div class="chapter-header">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <span class="drag-handle" style="cursor:grab;opacity:0.6;font-size:1.2rem;">⋮⋮</span>
                        <span style="font-weight:600;font-size:1.1rem;">${chapter.name}</span>
                        <button onclick="App.renameChapter(${chapterIdx})" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:4px 8px;border-radius:4px;cursor:pointer;display:flex;align-items:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                    </div>
                    <div style="display:flex;align-items:center;gap:16px;">
                        <div style="display:flex;gap:4px;">
                            <button onclick="App.moveChapterUp(${chapterIdx})" ${chapterIdx === 0 ? 'disabled' : ''} style="background:rgba(255,255,255,0.2);border:none;color:white;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:0.8rem;">▲</button>
                            <button onclick="App.moveChapterDown(${chapterIdx})" ${chapterIdx === this.quoteChapters.length - 1 ? 'disabled' : ''} style="background:rgba(255,255,255,0.2);border:none;color:white;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:0.8rem;">▼</button>
                        </div>
                        <button onclick="App.duplicateChapter(${chapterIdx})" title="Dupliquer" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:4px 8px;border-radius:4px;cursor:pointer;display:flex;align-items:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
                        <span style="font-size:0.85rem;opacity:0.9;">${chapter.products.length} article(s)</span>
                        <span style="font-weight:700;font-size:1.1rem;">${chapterTotal.toFixed(2)} €</span>
                        <button onclick="App.deleteChapter(${chapterIdx})" style="background:rgba(255,0,0,0.3);border:none;color:white;padding:4px 8px;border-radius:4px;cursor:pointer;display:flex;align-items:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                    </div>
                </div>
                <div class="chapter-products ${chapter.products.length === 0 ? 'empty' : ''}" data-chapter="${chapterIdx}">`;

            if (chapter.products.length === 0) {
                html += `<p style="color:var(--text-muted);font-size:0.9rem;padding:20px;">Ajoutez des produits depuis le catalogue</p>`;
            } else {
                chapter.products.forEach((p, prodIdx) => {
                    const lineTotal = (parseFloat(p.price?.replace(',', '.')) || 0) * p.qty;
                    html += `
                    <div class="quote-product" data-chapter="${chapterIdx}" data-product="${prodIdx}">
                        <span style="opacity:0.4;">⋮⋮</span>
                        <div>
                            <div style="font-weight:500;color:var(--text-dark);font-size:0.95rem;">${p.code}</div>
                            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px;">${p.name}</div>
                        </div>
                        <input type="number" value="${p.qty}" min="1"
                            style="width:100%;padding:6px;border:1px solid var(--border);border-radius:4px;text-align:center;font-size:0.9rem;background:var(--bg-white);color:var(--text-dark);"
                            onchange="App.updateChapterQty(${chapterIdx}, ${prodIdx}, this.value)"
                            onclick="event.stopPropagation()">
                        <div style="text-align:right;color:var(--text-muted);font-size:0.9rem;">${p.price || '-'} €</div>
                        <div style="text-align:right;font-weight:600;color:var(--primary);font-size:0.95rem;">${lineTotal.toFixed(2)} €</div>
                        <button onclick="App.removeFromChapter(${chapterIdx}, ${prodIdx}); event.stopPropagation();"
                            style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:1rem;opacity:0.6;"
                            onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6">✕</button>
                    </div>`;
                });
            }

            html += '</div></div>';
        });

        html += '</div>';

        // Grand total
        const totalProducts = this.quoteChapters.reduce((sum, c) => sum + c.products.length, 0);
        html += `
        <div class="quote-total">
            <div>
                <div style="font-size:1rem;font-weight:500;">TOTAL GÉNÉRAL HT</div>
                <div style="font-size:0.8rem;opacity:0.8;margin-top:4px;">${totalProducts} produit(s) • ${this.quoteChapters.length} chapitre(s)</div>
            </div>
            <div style="font-size:2.2rem;font-weight:700;">${grandTotal.toFixed(2)} €</div>
        </div>`;

        // Export buttons
        html += `
        <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="App.exportQuotePDF()"><svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Exporter PDF</button>
            <button class="btn btn-outline" onclick="App.exportQuoteExcel()"><svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg> Exporter Excel</button>
            <button class="btn btn-outline" onclick="App.clearQuote()" style="margin-left:auto;color:var(--danger);border-color:var(--danger);"><svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg> Vider le devis</button>
        </div>`;

        container.innerHTML = html;
        this.saveCurrentQuote();
    },

    // ==================
    // FLASH INFO
    // ==================

    renderFlashInfo() {
        const query = this.normalize(document.getElementById('flashSearch')?.value || '');
        let filtered = this.flashInfo;
        if (query) {
            filtered = this.flashInfo.filter(f => this.normalize(f.title || '').includes(query));
        }

        const container = document.getElementById('flashList');
        if (!container) return;

        container.innerHTML = filtered.slice(0, 50).map(f => `
            <a href="${f.url}" target="_blank" class="doc-item">
                <span style="color:var(--text-muted);min-width:40px;">${f.year || ''}</span>
                <span>${f.title || 'Sans titre'}</span>
            </a>
        `).join('');
    }
});
