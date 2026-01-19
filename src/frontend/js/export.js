/**
 * Export PDF et Excel - Extension de App
 */

Object.assign(App, {

    exportQuotePDF() {
        const today = new Date().toLocaleDateString('fr-FR');
        const user = Auth.getUser();
        let grandTotal = 0;

        const ref = 'DEV-' + Date.now().toString(36).toUpperCase();

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Devis Chubb France</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a2e; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #c41e3a; }
                .logo { font-size: 28px; font-weight: 700; color: #c41e3a; }
                .logo span { color: #1e3a5f; }
                .meta { text-align: right; font-size: 12px; color: #666; }
                .client-box { background: #f8f9fa; padding: 16px 20px; border-radius: 8px; margin-bottom: 30px; }
                .client-title { font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 8px; font-weight: 600; }
                .client-name { font-size: 16px; font-weight: 600; color: #1a1a2e; }
                .client-detail { font-size: 13px; color: #666; margin-top: 4px; }
                .chapter { margin-bottom: 30px; }
                .chapter-header { background: linear-gradient(135deg, #1e3a5f, #2d4a6f); color: white; padding: 12px 16px; font-weight: 600; font-size: 14px; border-radius: 6px 6px 0 0; display: flex; justify-content: space-between; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #f8f9fa; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e9ecef; }
                td { padding: 12px; border-bottom: 1px solid #e9ecef; font-size: 13px; }
                .code { font-weight: 600; color: #1e3a5f; }
                .text-right { text-align: right; }
                .grand-total { background: linear-gradient(135deg, #c41e3a, #9a1830); color: white; padding: 20px; margin-top: 30px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
                .grand-total .label { font-size: 14px; }
                .grand-total .amount { font-size: 28px; font-weight: 700; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 11px; color: #666; text-align: center; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">CHUBB <span>France</span></div>
                <div class="meta">
                    <div style="font-weight:600;font-size:18px;color:#1a1a2e;margin-bottom:4px;">DEVIS</div>
                    <div>Date: ${today}</div>
                    <div>Réf: ${ref}</div>
                    ${user ? `<div>Commercial: ${user.prenom} ${user.nom}</div>` : ''}
                </div>
            </div>`;

        // Client info
        if (this.quoteClientInfo.name || this.quoteClientInfo.address || this.quoteClientInfo.project) {
            html += `<div class="client-box">
                <div class="client-title">Client</div>`;
            if (this.quoteClientInfo.name) html += `<div class="client-name">${this.quoteClientInfo.name}</div>`;
            if (this.quoteClientInfo.address) html += `<div class="client-detail">${this.quoteClientInfo.address}</div>`;
            if (this.quoteClientInfo.project) html += `<div class="client-detail">Projet: ${this.quoteClientInfo.project}</div>`;
            html += `</div>`;
        }

        this.quoteChapters.forEach(chapter => {
            if (chapter.products.length === 0) return;

            const chapterTotal = chapter.products.reduce((sum, p) => sum + (parseFloat(p.price?.replace(',', '.')) || 0) * p.qty, 0);
            grandTotal += chapterTotal;

            html += `
            <div class="chapter">
                <div class="chapter-header">
                    <span>${chapter.name}</span>
                    <span>${chapterTotal.toFixed(2)} €</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width:15%">Code</th>
                            <th style="width:45%">Désignation</th>
                            <th style="width:10%" class="text-right">Qté</th>
                            <th style="width:15%" class="text-right">P.U. HT</th>
                            <th style="width:15%" class="text-right">Total HT</th>
                        </tr>
                    </thead>
                    <tbody>`;

            chapter.products.forEach(p => {
                const lineTotal = (parseFloat(p.price?.replace(',', '.')) || 0) * p.qty;
                html += `
                        <tr>
                            <td class="code">${p.code}</td>
                            <td>${p.name}</td>
                            <td class="text-right">${p.qty}</td>
                            <td class="text-right">${p.price || '-'} €</td>
                            <td class="text-right" style="font-weight:500;">${lineTotal.toFixed(2)} €</td>
                        </tr>`;
            });

            html += `
                    </tbody>
                </table>
            </div>`;
        });

        html += `
            <div class="grand-total">
                <div class="label">TOTAL GÉNÉRAL HT</div>
                <div class="amount">${grandTotal.toFixed(2)} €</div>
            </div>
            <div class="footer">
                Chubb France - Devis généré le ${today} - Validité 30 jours
            </div>
        </body>
        </html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 500);
    },

    exportQuoteExcel() {
        const today = new Date().toLocaleDateString('fr-FR');
        const user = Auth.getUser();
        const ref = 'DEV-' + Date.now().toString(36).toUpperCase();
        let grandTotal = 0;

        let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
            <meta charset="UTF-8">
            <!--[if gte mso 9]>
            <xml>
                <x:ExcelWorkbook>
                    <x:ExcelWorksheets>
                        <x:ExcelWorksheet>
                            <x:Name>Devis</x:Name>
                            <x:WorksheetOptions>
                                <x:DisplayGridlines/>
                            </x:WorksheetOptions>
                        </x:ExcelWorksheet>
                    </x:ExcelWorksheets>
                </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <style>
                @page { margin: 0.5in; }
                body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
                table { border-collapse: collapse; width: 100%; }
                .header-title { font-size: 24pt; font-weight: bold; color: #c41e3a; padding: 10px 0; }
                .header-info { font-size: 10pt; color: #666; padding: 3px 0; }
                .chapter-row { background-color: #1e3a5f; color: white; font-weight: bold; font-size: 12pt; }
                .chapter-row td { padding: 10px 8px; }
                .column-header { background-color: #f0f0f0; font-weight: bold; font-size: 10pt; text-transform: uppercase; color: #333; border-bottom: 2px solid #ccc; }
                .column-header td { padding: 8px; }
                .product-row td { padding: 8px; border-bottom: 1px solid #e0e0e0; vertical-align: top; }
                .code { font-weight: bold; color: #1e3a5f; width: 120px; text-align: left; }
                .designation { width: 350px; }
                .qty { text-align: center; width: 80px; }
                .price { text-align: right; width: 100px; }
                .total { text-align: right; font-weight: 500; width: 100px; }
                .grand-total-row { background-color: #c41e3a; color: white; font-weight: bold; font-size: 14pt; }
                .grand-total-row td { padding: 15px 8px; }
                .spacer td { height: 20px; }
            </style>
        </head>
        <body>
            <table>
                <tr><td colspan="5" class="header-title">DEVIS CHUBB FRANCE</td></tr>
                <tr><td colspan="5" class="header-info">Date : ${today}</td></tr>
                <tr><td colspan="5" class="header-info">Référence : ${ref}</td></tr>`;

        if (user) {
            html += `<tr><td colspan="5" class="header-info">Commercial : ${user.prenom} ${user.nom}</td></tr>`;
        }

        if (this.quoteClientInfo.name) {
            html += `<tr><td colspan="5" class="header-info" style="padding-top:10px;"><strong>Client :</strong> ${this.quoteClientInfo.name}</td></tr>`;
        }
        if (this.quoteClientInfo.address) {
            html += `<tr><td colspan="5" class="header-info">${this.quoteClientInfo.address}</td></tr>`;
        }
        if (this.quoteClientInfo.project) {
            html += `<tr><td colspan="5" class="header-info">Projet : ${this.quoteClientInfo.project}</td></tr>`;
        }

        html += `<tr class="spacer"><td colspan="5"></td></tr>`;

        this.quoteChapters.forEach(chapter => {
            if (chapter.products.length === 0) return;

            const chapterTotal = chapter.products.reduce((sum, p) => sum + (parseFloat(p.price?.replace(',', '.')) || 0) * p.qty, 0);
            grandTotal += chapterTotal;

            html += `
                <tr class="chapter-row">
                    <td colspan="5">${chapter.name.toUpperCase()}</td>
                </tr>
                <tr class="column-header">
                    <td>Code</td>
                    <td>Désignation</td>
                    <td style="text-align:center;">Qté</td>
                    <td style="text-align:right;">P.U. HT</td>
                    <td style="text-align:right;">Total HT</td>
                </tr>`;

            chapter.products.forEach(p => {
                const price = parseFloat(p.price?.replace(',', '.')) || 0;
                const lineTotal = price * p.qty;
                html += `
                <tr class="product-row">
                    <td class="code">${p.code}</td>
                    <td class="designation">${p.name}</td>
                    <td class="qty">${p.qty}</td>
                    <td class="price">${p.price || '-'} €</td>
                    <td class="total">${lineTotal.toFixed(2)} €</td>
                </tr>`;
            });

            html += `
                <tr style="background-color:#1e3a5f;color:white;font-weight:bold;">
                    <td colspan="3"></td>
                    <td style="text-align:right;padding:10px 8px;">Sous-total ${chapter.name} :</td>
                    <td style="text-align:right;padding:10px 8px;font-size:12pt;">${chapterTotal.toFixed(2)} €</td>
                </tr>`;
            html += `<tr class="spacer"><td colspan="5"></td></tr>`;
        });

        html += `
                <tr class="grand-total-row">
                    <td colspan="4">TOTAL GÉNÉRAL HT</td>
                    <td style="text-align:right;">${grandTotal.toFixed(2)} €</td>
                </tr>
            </table>
        </body>
        </html>`;

        const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `devis_chubb_${new Date().toISOString().slice(0, 10)}.xls`;
        link.click();
    }
});
