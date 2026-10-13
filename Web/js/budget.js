/* ==========================================================================
   BÜTÇE TAKİBİ, LİMİTLER, RAPORLAMA, TASARRUF VE OYUNLAŞTIRMA MODÜLÜ
   Bilgisayar Mühendisliği Bütçe Takip Projesi
   
   Özellikler:
   1. Kategori bazlı işlem filtreleme
   2. Kategori harcama limitleri ve %80 (sarı) / %100 (kırmızı) uyarı sistemi
   3. Aylık özet ve kategori harcama dağılımı grafiği/tablosu
   4. Tasarruf hedefleri yönetimi, ilerleme çubukları ve para ayırma
   5. Oyunlaştırma (3 adet rozet: Disiplinli Bütçeci, Hedef Avcısı, Düzenli Kayıtçı)
   ========================================================================== */

var Budget = (function () {
    'use strict';

    // Sabitler
    var STORAGE_LIMITS = 'budget_category_limits';
    var STORAGE_GOALS = 'budget_savings_goals';
    var STORAGE_BADGES = 'budget_badges';
    var STORAGE_ACTIVE_TAB = 'budget_active_tab';

    // Standart hazır kategoriler
    var DEFAULT_CATEGORIES = [
        'Market', 'Ulaşım', 'Fatura', 'Eğlence', 
        'Eğitim', 'Sağlık', 'Burs/Maaş', 'Alışveriş', 
        'Kira', 'Yemek', 'Diğer'
    ];

    var CATEGORY_ICONS = {
        'Market': '🛒',
        'Ulaşım': '🚗',
        'Fatura': '📄',
        'Eğlence': '🎉',
        'Eğitim': '🎓',
        'Sağlık': '💊',
        'Burs/Maaş': '💼',
        'Alışveriş': '🛍️',
        'Kira': '🏠',
        'Yemek': '🍔',
        'Diğer': '🏷️'
    };

    var CATEGORY_COLORS = {
        'Market': '#3b82f6',
        'Ulaşım': '#06b6d4',
        'Fatura': '#f97316',
        'Eğlence': '#ec4899',
        'Eğitim': '#8b5cf6',
        'Sağlık': '#10b981',
        'Burs/Maaş': '#14b8a6',
        'Alışveriş': '#f43f5e',
        'Kira': '#6366f1',
        'Yemek': '#eab308',
        'Diğer': '#64748b'
    };

    // Durum değişkenleri
    var activeTab = 'transactions'; // 'transactions' | 'budgets' | 'reports' | 'goals' | 'badges'
    var categoryFilter = ''; // '' = tümü
    var reportDate = new Date(); // Rapor ayı için tarih nesnesi

    /* ==========================================================================
       VERİ YÖNETİMİ (STORAGE HELPERS)
       ========================================================================== */

    function getLimits() {
        return DB.getForUser(STORAGE_LIMITS) || {};
    }

    function saveLimits(limits) {
        DB.setForUser(STORAGE_LIMITS, limits);
    }

    function getGoals() {
        return DB.getForUser(STORAGE_GOALS) || [];
    }

    function saveGoals(goals) {
        DB.setForUser(STORAGE_GOALS, goals);
    }

    function getBadges() {
        var defaultBadges = {
            disciplined: { id: 'disciplined', title: 'Disiplinli Bütçeci', unlocked: false, unlockedAt: null },
            hunter: { id: 'hunter', title: 'Hedef Avcısı', unlocked: false, unlockedAt: null },
            streak: { id: 'streak', title: 'Düzenli Kayıtçı', unlocked: false, unlockedAt: null }
        };
        return DB.getForUser(STORAGE_BADGES) || defaultBadges;
    }

    function saveBadges(badges) {
        DB.setForUser(STORAGE_BADGES, badges);
    }

    function formatMoney(amount) {
        if (typeof amount !== 'number') amount = parseFloat(amount) || 0;
        return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
    }

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function getMonthKey(date) {
        var d = date ? new Date(date) : new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }

    function getMonthName(date) {
        var MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        var d = date ? new Date(date) : new Date();
        return MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    }

    /* ==========================================================================
       BAŞLATMA (INIT)
       ========================================================================== */

    function init() {
        var savedTab = localStorage.getItem(STORAGE_ACTIVE_TAB);
        if (savedTab && ['transactions', 'budgets', 'reports', 'goals', 'badges'].indexOf(savedTab) !== -1) {
            activeTab = savedTab;
        }

        // Sekme butonlarını dinle
        bindEvents();

        // Rozet durumlarını kontrol et
        checkAllBadges(false);

        // Bakiye göstergesini güncelle
        updateUserBalanceDisplay();
        renderProfileBadges();

        // Sekmeyi aktif et
        switchTab(activeTab, false);
    }

    function bindEvents() {
        // Modal dışına tıklandığında kapatma vb. delegasyonlar
    }

    /* ==========================================================================
       SEKME YÖNETİMİ (TABS)
       ========================================================================== */

    function switchTab(tabId, savePreference) {
        activeTab = tabId;
        if (savePreference !== false) {
            try { localStorage.setItem(STORAGE_ACTIVE_TAB, tabId); } catch(e){}
        }

        // Sekme butonlarının aktiflik sınıfını güncelle
        var tabBtns = document.querySelectorAll('.finance-tab-btn');
        tabBtns.forEach(function (btn) {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Sekme içerik panellerini göster/gizle
        var contents = document.querySelectorAll('.finance-tab-content');
        contents.forEach(function (content) {
            if (content.id === 'finance-tab-' + tabId) {
                content.style.display = 'block';
                content.classList.add('active');
            } else {
                content.style.display = 'none';
                content.classList.remove('active');
            }
        });

        // İlgili sekmenin içeriğini render et
        if (tabId === 'transactions') {
            if (typeof Finance !== 'undefined' && Finance.render) {
                Finance.render();
            }
        } else if (tabId === 'budgets') {
            renderBudgets();
        } else if (tabId === 'reports') {
            renderReports();
        } else if (tabId === 'goals') {
            renderGoals();
        } else if (tabId === 'badges') {
            renderBadges();
        }

        updateAlertBadgesUI();
    }

    /* Kategori filtreleme kaldırıldı */
    function renderCategoryFilter() {}
    function setCategoryFilter() {}
    function getCurrentCategoryFilter() { return ''; }

    /* ==========================================================================
       2. BÜTÇE LİMİTLERİ & UYARI SİSTEMİ (%80 Sarı, %100 Kırmızı)
       ========================================================================== */

    function calculateCategoryExpensesForMonth(targetDate) {
        var targetMonthKey = getMonthKey(targetDate);
        var entries = (typeof Finance !== 'undefined' && Finance.getEntries) ? Finance.getEntries() : [];
        var categoryTotals = {};

        entries.forEach(function (entry) {
            if (entry.type === 'expense' && entry.date) {
                var entryMonthKey = getMonthKey(entry.date);
                if (entryMonthKey === targetMonthKey) {
                    var cat = (entry.category || 'Diğer').trim();
                    categoryTotals[cat] = (categoryTotals[cat] || 0) + (parseFloat(entry.amount) || 0);
                }
            }
        });

        return categoryTotals;
    }

    function renderBudgets() {
        var container = document.getElementById('budget-limits-list');
        if (!container) return;

        var limits = getLimits();
        var currentExpenses = calculateCategoryExpensesForMonth(new Date());
        var limitKeys = Object.keys(limits);

        var currentMonthText = getMonthName(new Date());
        var headerMonthEl = document.getElementById('budget-limits-month-label');
        if (headerMonthEl) headerMonthEl.textContent = currentMonthText + ' Bütçe Durumu';

        if (limitKeys.length === 0) {
            container.innerHTML = 
                '<div class="budget-empty-state">' +
                '  <div class="budget-empty-icon">🎯</div>' +
                '  <h4>Henüz Bütçe Limiti Belirlemediniz</h4>' +
                '  <p>Harcamalarınızı kontrol altında tutmak için kategorilere aylık limit koyun. Limitin %80\'ine ulaştığınızda sarı, aştığınızda kırmızı uyarı alırsınız.</p>' +
                '  <button type="button" class="btn btn-primary" onclick="Budget.openLimitModal()">' +
                '    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
                '    <span>İlk Limiti Belirle</span>' +
                '  </button>' +
                '</div>';
            return;
        }

        var html = '<div class="budget-cards-grid">';
        var warningCount = 0;
        var dangerCount = 0;

        limitKeys.forEach(function (cat) {
            var limit = parseFloat(limits[cat]) || 0;
            var spent = currentExpenses[cat] || 0;
            var pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            var remaining = limit - spent;
            var icon = CATEGORY_ICONS[cat] || '🏷️';
            var catColor = CATEGORY_COLORS[cat] || '#3b82f6';

            // Durum belirleme: normal, warning (%80-99), danger (%100+)
            var statusClass = 'status-safe';
            var statusBadge = '';
            var barColor = catColor;

            if (pct >= 100) {
                statusClass = 'status-danger';
                barColor = '#ef4444';
                dangerCount++;
                var overAmount = spent - limit;
                statusBadge = '<span class="budget-badge badge-danger">🚨 Limit Aşıldı (Aşım: +' + formatMoney(overAmount) + ', %' + pct + ')</span>';
            } else if (pct >= 80) {
                statusClass = 'status-warning';
                barColor = '#f59e0b';
                warningCount++;
                statusBadge = '<span class="budget-badge badge-warning">⚠️ %80\'e Ulaştı (%' + pct + ')</span>';
            } else {
                statusBadge = '<span class="budget-badge badge-safe">✅ Güvenli (%' + pct + ')</span>';
            }

            var progressWidth = Math.min(pct, 100);

            html += 
                '<div class="budget-limit-card ' + statusClass + '">' +
                '  <div class="bl-card-header">' +
                '    <div class="bl-card-title-group">' +
                '      <span class="bl-category-icon">' + icon + '</span>' +
                '      <div>' +
                '        <h4 class="bl-category-title">' + escapeHtml(cat) + '</h4>' +
                '        <span class="bl-month-sub">' + currentMonthText + '</span>' +
                '      </div>' +
                '    </div>' +
                '    <div class="bl-card-actions">' +
                '      <button type="button" class="bl-btn-icon" title="Düzenle" onclick="Budget.openLimitModal(\'' + escapeHtml(cat) + '\')">' +
                '        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' +
                '      </button>' +
                '      <button type="button" class="bl-btn-icon bl-btn-delete" title="Sil" onclick="Budget.deleteLimit(\'' + escapeHtml(cat) + '\')">' +
                '        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
                '      </button>' +
                '    </div>' +
                '  </div>' +

                '  <div class="bl-amounts">' +
                '    <div class="bl-amount-row">' +
                '      <span class="bl-label">Harcama / Limit:</span>' +
                '      <span class="bl-values"><strong>' + formatMoney(spent) + '</strong> / ' + formatMoney(limit) + '</span>' +
                '    </div>' +
                '    <div class="bl-amount-row">' +
                '      <span class="bl-label">Kalan Bütçe:</span>' +
                '      <span class="bl-remaining ' + (remaining < 0 ? 'text-danger' : 'text-success') + '">' + 
                         (remaining < 0 ? '-' + formatMoney(Math.abs(remaining)) + ' (Aşım)' : formatMoney(remaining)) + 
                       '</span>' +
                '    </div>' +
                '  </div>' +

                '  <div class="bl-progress-wrapper">' +
                '    <div class="bl-progress-track">' +
                '      <div class="bl-progress-fill" style="width: ' + progressWidth + '%; background-color: ' + barColor + ';"></div>' +
                '    </div>' +
                '  </div>' +

                '  <div class="bl-card-footer">' +
                '    ' + statusBadge +
                '  </div>' +
                '</div>';
        });

        html += '</div>';
        container.innerHTML = html;

        // Sekme üzerindeki uyarı noktasını güncelle
        var alertDot = document.getElementById('budget-alert-badge');
        if (alertDot) {
            if (dangerCount > 0 || warningCount > 0) {
                alertDot.style.display = 'inline-block';
                alertDot.className = 'badge-dot-alert ' + (dangerCount > 0 ? 'dot-danger' : 'dot-warning');
            } else {
                alertDot.style.display = 'none';
            }
        }
    }

    function openLimitModal(existingCategory) {
        var limits = getLimits();
        var currentLimitVal = existingCategory && limits[existingCategory] ? limits[existingCategory] : '';
        var categories = getAvailableCategories();

        var isEdit = !!existingCategory;
        var modalTitle = isEdit ? 'Bütçe Limitini Düzenle' : 'Yeni Kategori Bütçe Limiti';

        var optionsHtml = '';
        categories.forEach(function (cat) {
            var selected = (existingCategory && existingCategory === cat) ? ' selected' : '';
            var icon = CATEGORY_ICONS[cat] || '🏷️';
            optionsHtml += '<option value="' + escapeHtml(cat) + '"' + selected + '>' + icon + ' ' + escapeHtml(cat) + '</option>';
        });

        var html = 
            '<div class="modal-overlay" onclick="Budget.closeModal()">' +
            '  <div class="modal-content budget-modal" onclick="event.stopPropagation()">' +
            '    <button class="modal-close" onclick="Budget.closeModal()">&times;</button>' +
            '    <h3 class="budget-modal-title">' + modalTitle + '</h3>' +
            '    <p class="budget-modal-subtitle">Belirlediğiniz kategoride aylık harcamanız %80\'e ulaştığında sarı, limiti aştığında kırmızı uyarı verilir.</p>' +
            '    <form id="budget-limit-form" onsubmit="Budget.saveLimitModal(event)">' +
            '      <div class="form-group">' +
            '        <label>Kategori</label>' +
            (isEdit 
                ? '<input type="text" id="bl-form-category" class="form-control" value="' + escapeHtml(existingCategory) + '" readonly style="background: var(--color-bg-inset, #f1f5f9); cursor: not-allowed;">'
                : '<div style="display:flex; gap:8px;">' +
                  '  <select id="bl-form-category-select" class="form-control" onchange="document.getElementById(\'bl-form-category\').value = this.value;">' +
                  '    <option value="">Kategori seçin...</option>' +
                  optionsHtml +
                  '  </select>' +
                  '  <input type="text" id="bl-form-category" class="form-control" placeholder="veya özel kategori yazın" required maxlength="50">' +
                  '</div>'
            ) +
            '      </div>' +
            '      <div class="form-group">' +
            '        <label>Aylık Harcama Limiti (TL)</label>' +
            '        <input type="number" id="bl-form-limit" class="form-control" step="1" min="1" placeholder="Örn: 1500" value="' + (currentLimitVal || '') + '" required>' +
            '      </div>' +
            '      <div class="budget-modal-actions">' +
            '        <button type="button" class="btn" onclick="Budget.closeModal()">İptal</button>' +
            '        <button type="submit" class="btn btn-primary">Limiti Kaydet</button>' +
            '      </div>' +
            '    </form>' +
            '  </div>' +
            '</div>';

        var container = document.getElementById('budget-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'budget-modal-container';
            document.body.appendChild(container);
        }
        container.innerHTML = html;

        setTimeout(function() {
            var limitInput = document.getElementById('bl-form-limit');
            if (limitInput) limitInput.focus();
        }, 100);
    }

    function saveLimitModal(e) {
        e.preventDefault();
        var catInput = document.getElementById('bl-form-category');
        var limitInput = document.getElementById('bl-form-limit');

        if (!catInput || !limitInput) return;
        var category = catInput.value.trim();
        var limit = parseFloat(limitInput.value);

        if (!category || isNaN(limit) || limit <= 0) {
            if (typeof Toast !== 'undefined') Toast.show('Lütfen geçerli bir kategori ve tutar girin.', 'warning');
            return;
        }

        var limits = getLimits();
        limits[category] = limit;
        saveLimits(limits);

        closeModal();
        renderBudgets();
        checkAllBadges(false);

        if (typeof Toast !== 'undefined') {
            Toast.show('"' + category + '" için aylık limit ' + formatMoney(limit) + ' olarak kaydedildi.', 'success');
        }
    }

    function deleteLimit(category) {
        if (!confirm('"' + category + '" kategorisine ait bütçe limitini silmek istediğinize emin misiniz?')) {
            return;
        }
        var limits = getLimits();
        delete limits[category];
        saveLimits(limits);
        renderBudgets();
        checkAllBadges(false);
        if (typeof Toast !== 'undefined') Toast.show('Bütçe limiti silindi.', 'info');
    }

    // İşlem eklendiğinde anlık bildirim kontrolü
    function checkTransactionLimitAlert(newEntry) {
        if (!newEntry || newEntry.type !== 'expense') return;
        var cat = (newEntry.category || '').trim();
        if (!cat) return;

        var limits = getLimits();
        if (!limits[cat]) return;

        var limit = parseFloat(limits[cat]) || 0;
        if (limit <= 0) return;

        var currentExpenses = calculateCategoryExpensesForMonth(new Date());
        var spent = currentExpenses[cat] || 0;
        var pct = Math.round((spent / limit) * 100);

        if (pct >= 100) {
            var overAmount = spent - limit;
            if (typeof Toast !== 'undefined') {
                Toast.show('🚨 DİKKAT: "' + cat + '" kategorisinde limit aşıldı! Aşım Miktarı: +' + formatMoney(overAmount) + ' (Harcama: ' + formatMoney(spent) + ', Limit: ' + formatMoney(limit) + ')', 'error', 6500);
            }
        } else if (pct >= 80) {
            if (typeof Toast !== 'undefined') {
                Toast.show('⚠️ UYARI: "' + cat + '" kategorisinde aylık limitin %' + pct + '\'ine ulaşıldı!', 'warning', 5000);
            }
        }
    }

    /* ==========================================================================
       3. AYLIK ÖZET & KATEGORİ DAĞILIMI (Raporlar)
       ========================================================================== */

    function prevReportMonth() {
        reportDate.setMonth(reportDate.getMonth() - 1);
        renderReports();
    }

    function nextReportMonth() {
        reportDate.setMonth(reportDate.getMonth() + 1);
        renderReports();
    }

    function setReportMonthToCurrent() {
        reportDate = new Date();
        renderReports();
    }

    function renderReports() {
        var monthLabelEl = document.getElementById('budget-report-month-title');
        if (monthLabelEl) {
            monthLabelEl.textContent = getMonthName(reportDate);
        }

        var targetMonthKey = getMonthKey(reportDate);
        var entries = (typeof Finance !== 'undefined' && Finance.getEntries) ? Finance.getEntries() : [];

        var totalIncome = 0;
        var totalExpense = 0;
        var categoryTotals = {};
        var categoryCount = {};

        entries.forEach(function (entry) {
            if (entry.date && getMonthKey(entry.date) === targetMonthKey) {
                var amt = parseFloat(entry.amount) || 0;
                if (entry.type === 'income') {
                    totalIncome += amt;
                } else if (entry.type === 'expense') {
                    totalExpense += amt;
                    var cat = (entry.category || 'Diğer').trim();
                    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
                    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
                }
            }
        });

        var netBalance = totalIncome - totalExpense;

        // 1. Özet Kartları
        var incomeEl = document.getElementById('report-total-income');
        var expenseEl = document.getElementById('report-total-expense');
        var balanceEl = document.getElementById('report-net-balance');

        if (incomeEl) incomeEl.textContent = '+' + formatMoney(totalIncome);
        if (expenseEl) expenseEl.textContent = '-' + formatMoney(totalExpense);
        if (balanceEl) {
            balanceEl.textContent = (netBalance >= 0 ? '+' : '-') + formatMoney(Math.abs(netBalance));
            balanceEl.className = 'report-summary-val ' + (netBalance >= 0 ? 'text-success' : 'text-danger');
        }

        // 2. Kategori Dağılım Listesi & Tablosu
        var breakdownContainer = document.getElementById('budget-category-breakdown');
        if (!breakdownContainer) return;

        var sortedCategories = Object.keys(categoryTotals).sort(function (a, b) {
            return categoryTotals[b] - categoryTotals[a];
        });

        if (sortedCategories.length === 0) {
            breakdownContainer.innerHTML = 
                '<div class="budget-empty-state" style="padding: 30px;">' +
                '  <p style="color: var(--color-text-secondary); margin:0;">Bu ay için kaydedilmiş gider işlemi bulunmuyor.</p>' +
                '</div>';
            return;
        }

        var html = '<div class="report-distribution-section">';
        
        // Yüzdelerin toplamının tam olarak %100 olmasını garantile
        var catPcts = {};
        var sumPcts = 0;
        var totalTxCount = 0;
        sortedCategories.forEach(function (cat) {
            var spent = categoryTotals[cat];
            totalTxCount += (categoryCount[cat] || 1);
            var p = totalExpense > 0 ? parseFloat(((spent / totalExpense) * 100).toFixed(1)) : 0;
            catPcts[cat] = p;
            sumPcts += p;
        });

        // Küçük yuvarlama farklarını normalize et (toplamı tam 100.0 yap)
        if (sortedCategories.length > 0 && totalExpense > 0) {
            var diff = +(100.0 - sumPcts).toFixed(1);
            if (Math.abs(diff) > 0 && Math.abs(diff) < 2) {
                var firstCat = sortedCategories[0];
                catPcts[firstCat] = +(catPcts[firstCat] + diff).toFixed(1);
            }
        }

        // Dağılım Çubuğu (Görsel Yüzdelik Bar)
        html += '<div class="report-multi-bar" title="Kategori Harcama Dağılımı (Toplam %100)">';
        sortedCategories.forEach(function (cat) {
            var spent = categoryTotals[cat];
            var pct = (catPcts[cat] !== undefined) ? catPcts[cat].toFixed(1) : '0.0';
            var color = CATEGORY_COLORS[cat] || '#64748b';
            html += '<div class="report-multi-bar-seg" style="width: ' + pct + '%; background-color: ' + color + ';" title="' + escapeHtml(cat) + ': %' + pct + ' (' + formatMoney(spent) + ')"></div>';
        });
        html += '</div>';

        // Detaylı Dağılım Tablosu
        html += 
            '<div class="report-table-wrapper">' +
            '  <table class="report-table">' +
            '    <thead>' +
            '      <tr>' +
            '        <th>Kategori</th>' +
            '        <th>İşlem Sayısı</th>' +
            '        <th>Toplam Tutar</th>' +
            '        <th>Pay (%)</th>' +
            '        <th style="width: 140px;">Görsel Dağılım</th>' +
            '      </tr>' +
            '    </thead>' +
            '    <tbody>';

        sortedCategories.forEach(function (cat) {
            var spent = categoryTotals[cat];
            var count = categoryCount[cat] || 1;
            var pct = (catPcts[cat] !== undefined) ? catPcts[cat].toFixed(1) : '0.0';
            var icon = CATEGORY_ICONS[cat] || '🏷️';
            var color = CATEGORY_COLORS[cat] || '#3b82f6';

            html += 
                '      <tr>' +
                '        <td>' +
                '          <div style="display:flex; align-items:center; gap:8px;">' +
                '            <span style="font-size:16px;">' + icon + '</span>' +
                '            <span style="font-weight:600; color:var(--color-text);">' + escapeHtml(cat) + '</span>' +
                '          </div>' +
                '        </td>' +
                '        <td style="color:var(--color-text-secondary);">' + count + ' işlem</td>' +
                '        <td style="font-weight:700; color:var(--color-text);">' + formatMoney(spent) + '</td>' +
                '        <td><span class="report-pct-badge" style="background-color: ' + color + '20; color: ' + color + ';">%' + pct + '</span></td>' +
                '        <td>' +
                '          <div class="bl-progress-track" style="height:8px;">' +
                '            <div class="bl-progress-fill" style="width:' + pct + '%; background-color:' + color + ';"></div>' +
                '          </div>' +
                '        </td>' +
                '      </tr>';
        });

        html += 
            '    </tbody>' +
            '    <tfoot>' +
            '      <tr style="font-weight:700; border-top: 2px solid var(--color-border-subtle, #e2e8f0); background: var(--color-bg-inset, #f8fafc);">' +
            '        <td>Toplam</td>' +
            '        <td style="color:var(--color-text-secondary);">' + totalTxCount + ' işlem</td>' +
            '        <td style="color:var(--color-danger, #ef4444);">' + formatMoney(totalExpense) + '</td>' +
            '        <td><span class="report-pct-badge" style="background:#10b98125; color:#059669; font-weight:800;">%100.0</span></td>' +
            '        <td>' +
            '          <div class="bl-progress-track" style="height:8px;">' +
            '            <div class="bl-progress-fill" style="width:100%; background-color:#10b981;"></div>' +
            '          </div>' +
            '        </td>' +
            '      </tr>' +
            '    </tfoot>' +
            '  </table>' +
            '</div>';

        html += '</div>';
        breakdownContainer.innerHTML = html;
    }

    /* ==========================================================================
       4. TASARRUF HEDEFLERİ (Savings Goals & Add Savings)
       ========================================================================== */

    function renderGoals() {
        var container = document.getElementById('budget-goals-list');
        if (!container) return;

        var goals = getGoals();

        if (goals.length === 0) {
            container.innerHTML = 
                '<div class="budget-empty-state">' +
                '  <div class="budget-empty-icon">💰</div>' +
                '  <h4>Henüz Bir Tasarruf Hedefi Belirlemediniz</h4>' +
                '  <p>Almak istediğiniz bir eşya (örn: "Yeni Laptop – 25.000 TL") veya birikim için hedef oluşturun ve para ayırarak ilerlemenizi takip edin.</p>' +
                '  <button type="button" class="btn btn-primary" onclick="Budget.openAddGoalModal()">' +
                '    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
                '    <span>Yeni Hedef Oluştur</span>' +
                '  </button>' +
                '</div>';
            return;
        }

        var html = '<div class="budget-goals-grid">';

        goals.forEach(function (g) {
            var target = parseFloat(g.targetAmount) || 0;
            var current = parseFloat(g.currentAmount) || 0;
            var pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
            var remaining = Math.max(target - current, 0);
            var isCompleted = current >= target;

            html += 
                '<div class="budget-goal-card ' + (isCompleted ? 'goal-completed' : '') + '">' +
                '  <div class="bg-card-header">' +
                '    <div class="bg-card-title-group">' +
                '      <div class="bg-icon-badge">' + (isCompleted ? '🏆' : '🎯') + '</div>' +
                '      <div>' +
                '        <h4 class="bg-goal-title">' + escapeHtml(g.title) + '</h4>' +
                (g.note ? '        <p class="bg-goal-note">' + escapeHtml(g.note) + '</p>' : '') +
                '      </div>' +
                '    </div>' +
                '    <button type="button" class="bl-btn-icon bl-btn-delete" title="Hedefi Sil" onclick="Budget.deleteGoal(' + g.id + ')">' +
                '      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
                '    </button>' +
                '  </div>' +

                '  <div class="bg-amounts-box">' +
                '    <div class="bg-amount-row">' +
                '      <span class="text-secondary text-sm">Biriken:</span>' +
                '      <span class="bg-curr-amount">' + formatMoney(current) + '</span>' +
                '    </div>' +
                '    <div class="bg-amount-row">' +
                '      <span class="text-secondary text-sm">Hedef:</span>' +
                '      <span class="bg-target-amount">' + formatMoney(target) + '</span>' +
                '    </div>' +
                '  </div>' +

                '  <div class="bl-progress-wrapper" style="margin: 14px 0 8px 0;">' +
                '    <div class="bl-progress-track" style="height: 12px; border-radius: 6px;">' +
                '      <div class="bl-progress-fill ' + (isCompleted ? 'fill-completed' : '') + '" style="width: ' + pct + '%;"></div>' +
                '    </div>' +
                '  </div>' +

                '  <div class="bg-card-meta">' +
                '    <span class="bg-pct-label font-bold ' + (isCompleted ? 'text-success' : '') + '">%' + pct + ' Tamamlandı</span>' +
                '    <span class="text-secondary text-sm">' + (isCompleted ? '🎉 Hedefe Ulaşıldı!' : formatMoney(remaining) + ' kaldı') + '</span>' +
                '  </div>' +

                '  <div class="bg-card-actions">' +
                (isCompleted 
                    ? '<div class="bg-complete-banner"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Hedef Başarıyla Tamamlandı!</div>'
                    : '<button type="button" class="btn btn-primary btn-sm btn-block" onclick="Budget.openAddSavingsModal(' + g.id + ')">' +
                      '  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
                      '  <span>Para Ayır / Biriktir</span>' +
                      '</button>'
                ) +
                '  </div>' +
                '</div>';
        });

        html += '</div>';
        container.innerHTML = html;
    }

    function openAddGoalModal() {
        var html = 
            '<div class="modal-overlay" onclick="Budget.closeModal()">' +
            '  <div class="modal-content budget-modal" onclick="event.stopPropagation()">' +
            '    <button class="modal-close" onclick="Budget.closeModal()">&times;</button>' +
            '    <h3 class="budget-modal-title">Yeni Tasarruf Hedefi Oluştur</h3>' +
            '    <p class="budget-modal-subtitle">Ulaşmak istediğiniz bir hedef belirleyin ve bu hedefe para ayırarak birikiminizi izleyin.</p>' +
            '    <form id="budget-goal-form" onsubmit="Budget.saveGoalModal(event)">' +
            '      <div class="form-group">' +
            '        <label>Hedef Başlığı</label>' +
            '        <input type="text" id="bg-form-title" class="form-control" placeholder="Örn: Yeni Laptop, Tatil Fonu, Araba..." required maxlength="70">' +
            '      </div>' +
            '      <div class="form-group">' +
            '        <label>Hedeflenen Tutar (TL)</label>' +
            '        <input type="number" id="bg-form-target" class="form-control" step="1" min="1" placeholder="Örn: 25000" required>' +
            '      </div>' +
            '      <div class="form-group">' +
            '        <label>Şu Ana Kadar Biriken Tutar (TL) <small class="text-secondary">(İsteğe bağlı)</small></label>' +
            '        <input type="number" id="bg-form-current" class="form-control" step="1" min="0" placeholder="0" value="0">' +
            '      </div>' +
            '      <div class="form-group">' +
            '        <label>Açıklama / Not <small class="text-secondary">(İsteğe bağlı)</small></label>' +
            '        <input type="text" id="bg-form-note" class="form-control" placeholder="Hedefiniz hakkında kısa bir not" maxlength="100">' +
            '      </div>' +
            '      <div class="budget-modal-actions">' +
            '        <button type="button" class="btn" onclick="Budget.closeModal()">İptal</button>' +
            '        <button type="submit" class="btn btn-primary">Hedefi Başlat</button>' +
            '      </div>' +
            '    </form>' +
            '  </div>' +
            '</div>';

        var container = document.getElementById('budget-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'budget-modal-container';
            document.body.appendChild(container);
        }
        container.innerHTML = html;

        setTimeout(function() {
            var input = document.getElementById('bg-form-title');
            if (input) input.focus();
        }, 100);
    }

    function saveGoalModal(e) {
        e.preventDefault();
        var title = (document.getElementById('bg-form-title').value || '').trim();
        var targetAmount = parseFloat(document.getElementById('bg-form-target').value) || 0;
        var currentAmount = parseFloat(document.getElementById('bg-form-current').value) || 0;
        var note = (document.getElementById('bg-form-note').value || '').trim();

        if (!title || targetAmount <= 0) {
            if (typeof Toast !== 'undefined') Toast.show('Lütfen geçerli bir hedef başlığı ve tutar girin.', 'warning');
            return;
        }

        var goals = getGoals();
        var newGoal = {
            id: Date.now(),
            title: title,
            targetAmount: targetAmount,
            currentAmount: currentAmount,
            note: note,
            createdAt: new Date().toISOString(),
            completed: currentAmount >= targetAmount,
            completedAt: currentAmount >= targetAmount ? new Date().toISOString() : null
        };

        goals.push(newGoal);
        saveGoals(goals);

        closeModal();
        renderGoals();
        checkAllBadges(true);

        if (typeof Toast !== 'undefined') {
            Toast.show('"' + title + '" tasarruf hedefi başarıyla oluşturuldu! 🎯', 'success');
        }
    }

    function openAddSavingsModal(goalId) {
        var goals = getGoals();
        var goal = goals.find(function(g) { return g.id === goalId; });
        if (!goal) return;

        var html = 
            '<div class="modal-overlay" onclick="Budget.closeModal()">' +
            '  <div class="modal-content budget-modal" onclick="event.stopPropagation()">' +
            '    <button class="modal-close" onclick="Budget.closeModal()">&times;</button>' +
            '    <h3 class="budget-modal-title">Hedefe Para Ayır / Biriktir</h3>' +
            '    <p class="budget-modal-subtitle"><strong>' + escapeHtml(goal.title) + '</strong> hedefine birikim ekleyin.</p>' +
            '    <form id="budget-savings-form" onsubmit="Budget.saveSavingsModal(event, ' + goalId + ')">' +
            '      <div class="form-group">' +
            '        <label>Eklenecek Tutar (TL)</label>' +
            '        <input type="number" id="bs-form-amount" class="form-control" step="1" min="1" placeholder="Örn: 500" required>' +
            '      </div>' +
            '      <div class="budget-modal-actions">' +
            '        <button type="button" class="btn" onclick="Budget.closeModal()">İptal</button>' +
            '        <button type="submit" class="btn btn-primary">Kumbaraya Ekle 💰</button>' +
            '      </div>' +
            '    </form>' +
            '  </div>' +
            '</div>';

        var container = document.getElementById('budget-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'budget-modal-container';
            document.body.appendChild(container);
        }
        container.innerHTML = html;

        setTimeout(function() {
            var input = document.getElementById('bs-form-amount');
            if (input) input.focus();
        }, 100);
    }

    function saveSavingsModal(e, goalId) {
        e.preventDefault();
        var amtInput = document.getElementById('bs-form-amount');
        if (!amtInput) return;
        var addAmount = parseFloat(amtInput.value) || 0;
        if (addAmount <= 0) return;

        var goals = getGoals();
        var goal = goals.find(function(g) { return g.id === goalId; });
        if (!goal) return;

        var prevCompleted = goal.completed;
        goal.currentAmount = (parseFloat(goal.currentAmount) || 0) + addAmount;
        
        var justCompleted = false;
        if (goal.currentAmount >= goal.targetAmount && !prevCompleted) {
            goal.completed = true;
            goal.completedAt = new Date().toISOString();
            justCompleted = true;
        }

        saveGoals(goals);
        closeModal();
        renderGoals();
        checkAllBadges(true);

        if (justCompleted) {
            if (typeof Toast !== 'undefined') {
                Toast.show('🎉 TEBRİKLER! "' + goal.title + '" hedefinize başarıyla ulaştınız!', 'success', 6000);
            }
        } else {
            if (typeof Toast !== 'undefined') {
                Toast.show(formatMoney(addAmount) + ' başarıyla hedefe aktarıldı. 💰', 'success');
            }
        }
    }

    function deleteGoal(goalId) {
        if (!confirm('Bu tasarruf hedefini silmek istediğinize emin misiniz?')) return;
        var goals = getGoals();
        goals = goals.filter(function(g) { return g.id !== goalId; });
        saveGoals(goals);
        renderGoals();
        if (typeof Toast !== 'undefined') Toast.show('Tasarruf hedefi silindi.', 'info');
    }

    /* ==========================================================================
       5. OYUNLAŞTIRMA VE ROZETLER (Badges System)
       Rozet 1: Disiplinli Bütçeci (Hiçbir kategori limitini aşmayan)
       Rozet 2: Hedef Avcısı (İlk tasarruf hedefini tamamlayan)
       Rozet 3: Düzenli Kayıtçı (30 gün üst üste işlem giren)
       ========================================================================== */

    function checkAllBadges(showToastOnNew) {
        var badges = getBadges();
        var newlyUnlocked = [];

        // 1. Hedef Avcısı Kontrolü (İlk tasarruf hedefini tamamlayan)
        if (!badges.hunter.unlocked) {
            var goals = getGoals();
            var anyCompleted = goals.some(function(g) { return g.completed || (g.currentAmount >= g.targetAmount && g.targetAmount > 0); });
            if (anyCompleted) {
                badges.hunter.unlocked = true;
                badges.hunter.unlockedAt = new Date().toISOString();
                newlyUnlocked.push(badges.hunter.title);
            }
        }

        // 2. Düzenli Kayıtçı Kontrolü (30 gün üst üste işlem giren)
        var streakInfo = calculateStreak();
        if (!badges.streak.unlocked) {
            if (streakInfo.currentStreak >= 30) {
                badges.streak.unlocked = true;
                badges.streak.unlockedAt = new Date().toISOString();
                newlyUnlocked.push(badges.streak.title);
            }
        }

        // 3. Disiplinli Bütçeci Kontrolü (Hiçbir kategori limitini aşmayan)
        if (!badges.disciplined.unlocked) {
            var limits = getLimits();
            var limitKeys = Object.keys(limits);
            if (limitKeys.length >= 1) { // En az bir limit belirlenmiş olmalı
                var currentExpenses = calculateCategoryExpensesForMonth(new Date());
                var anyExceeded = false;
                limitKeys.forEach(function(cat) {
                    var limit = parseFloat(limits[cat]) || 0;
                    var spent = currentExpenses[cat] || 0;
                    if (spent > limit) anyExceeded = true;
                });

                // Eğer limit belirlenmiş ve hiç aşım yoksa ve ayda en az 5 işlem varsa
                var entries = (typeof Finance !== 'undefined' && Finance.getEntries) ? Finance.getEntries() : [];
                var currentMonthKey = getMonthKey(new Date());
                var thisMonthCount = entries.filter(function(e) { return e.date && getMonthKey(e.date) === currentMonthKey; }).length;

                if (!anyExceeded && thisMonthCount >= 3) {
                    badges.disciplined.unlocked = true;
                    badges.disciplined.unlockedAt = new Date().toISOString();
                    newlyUnlocked.push(badges.disciplined.title);
                }
            }
        }

        saveBadges(badges);

        // Yeni kazanılan rozetler için tebrik bildirimi
        if (showToastOnNew && newlyUnlocked.length > 0) {
            newlyUnlocked.forEach(function (badgeTitle) {
                if (typeof Toast !== 'undefined') {
                    Toast.show('🎖️ TEBRİKLER! Yeni Rozet Kazandınız: "' + badgeTitle + '"!', 'success', 6000);
                }
            });
        }

        updateAlertBadgesUI();
        return badges;
    }

    function calculateStreak() {
        var entries = (typeof Finance !== 'undefined' && Finance.getEntries) ? Finance.getEntries() : [];
        if (entries.length === 0) return { currentStreak: 0, datesCount: 0 };

        // İşlem tarihlerini topla (YYYY-MM-DD formatında benzersiz)
        var dateSet = {};
        entries.forEach(function (e) {
            if (e.date) {
                var d = new Date(e.date);
                if (!isNaN(d.getTime())) {
                    var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                    dateSet[key] = true;
                }
            }
        });

        var dates = Object.keys(dateSet).sort();
        if (dates.length === 0) return { currentStreak: 0, datesCount: 0 };

        // Bugünden geriye doğru kesintisiz gün sayısını bul
        var today = new Date();
        var todayKey = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        var yesterdayKey = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');

        var streak = 0;
        var checkDate = new Date();

        // Eğer bugün işlem girilmişse bugünden, girilmemişse dünden başlat
        if (dateSet[todayKey]) {
            checkDate = today;
        } else if (dateSet[yesterdayKey]) {
            checkDate = yesterday;
        } else {
            // Seri kırılmış ama geçmişteki en yüksek seriyi veya toplam gün sayısını da kontrol edebiliriz
            return { currentStreak: 0, datesCount: dates.length };
        }

        while (true) {
            var k = checkDate.getFullYear() + '-' + String(checkDate.getMonth() + 1).padStart(2, '0') + '-' + String(checkDate.getDate()).padStart(2, '0');
            if (dateSet[k]) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return { currentStreak: streak, datesCount: dates.length };
    }

    function renderBadges() {
        var container = document.getElementById('budget-badges-list');
        if (!container) return;

        var badges = checkAllBadges(false);
        var streakInfo = calculateStreak();

        var badgeCards = [
            {
                id: 'disciplined',
                badge: badges.disciplined,
                icon: '🏅',
                title: 'Disiplinli Bütçeci',
                desc: 'Bir ayı hiçbir kategori limitini aşmadan tamamlayan kullanıcıya verilir.',
                progressText: badges.disciplined.unlocked ? 'Kazanıldı' : 'Aktif ay takip ediliyor',
                progressPct: badges.disciplined.unlocked ? 100 : 70
            },
            {
                id: 'hunter',
                badge: badges.hunter,
                icon: '🎯',
                title: 'Hedef Avcısı',
                desc: 'İlk tasarruf hedefini başarıyla %100 tamamlayan kullanıcıya verilir.',
                progressText: badges.hunter.unlocked ? 'Kazanıldı' : 'Bir hedef tamamlayın',
                progressPct: badges.hunter.unlocked ? 100 : 40
            },
            {
                id: 'streak',
                badge: badges.streak,
                icon: '🔥',
                title: 'Düzenli Kayıtçı',
                desc: '30 gün üst üste en az bir işlem kaydı giren kullanıcıya verilir.',
                progressText: badges.streak.unlocked ? 'Kazanıldı (30+ Gün)' : streakInfo.currentStreak + ' / 30 Gün Serisi',
                progressPct: badges.streak.unlocked ? 100 : Math.min(Math.round((streakInfo.currentStreak / 30) * 100), 100)
            }
        ];

        var html = '<div class="budget-badges-grid">';

        badgeCards.forEach(function (b) {
            var isUnlocked = b.badge && b.badge.unlocked;
            var unlockedDateStr = isUnlocked && b.badge.unlockedAt 
                ? new Date(b.badge.unlockedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                : null;

            html += 
                '<div class="budget-badge-card ' + (isUnlocked ? 'badge-unlocked' : 'badge-locked') + '">' +
                '  <div class="bb-glow-effect"></div>' +
                '  <div class="bb-icon-circle">' + b.icon + '</div>' +
                '  <h4 class="bb-title">' + escapeHtml(b.title) + '</h4>' +
                '  <p class="bb-desc">' + escapeHtml(b.desc) + '</p>' +
                '  <div class="bb-status-box">' +
                (isUnlocked 
                    ? '<span class="bb-status-pill pill-unlocked">✨ KAZANILDI</span>' +
                      '<span class="bb-date-meta">' + unlockedDateStr + '</span>'
                    : '<span class="bb-status-pill pill-locked">🔒 KİLİTLİ</span>' +
                      '<div class="bl-progress-track" style="height:6px; margin-top:8px;">' +
                      '  <div class="bl-progress-fill" style="width:' + b.progressPct + '%; background:#6366f1;"></div>' +
                      '</div>' +
                      '<span class="bb-progress-sub">' + b.progressText + '</span>'
                ) +
                '  </div>' +
                '</div>';
        });

        html += '</div>';
        container.innerHTML = html;
    }

    function updateAlertBadgesUI() {
        var badges = getBadges();
        var unlockedCount = 0;
        if (badges.disciplined && badges.disciplined.unlocked) unlockedCount++;
        if (badges.hunter && badges.hunter.unlocked) unlockedCount++;
        if (badges.streak && badges.streak.unlocked) unlockedCount++;

        var countPill = document.getElementById('badge-unlocked-count');
        if (countPill) {
            countPill.textContent = unlockedCount + '/3';
            if (unlockedCount > 0) countPill.classList.add('has-badge');
        }
    }

    function closeModal() {
        var container = document.getElementById('budget-modal-container');
        if (container) {
            container.innerHTML = '';
        }
    }

    // İşlem eklendiğinde/silindiğinde otomatik tetiklenecek fonksiyon
    function onTransactionChanged(newEntry) {
        if (newEntry) {
            checkTransactionLimitAlert(newEntry);
        }
        checkAllBadges(true);
        if (activeTab === 'budgets') renderBudgets();
        else if (activeTab === 'reports') renderReports();
        else if (activeTab === 'badges') renderBadges();
        updateAlertBadgesUI();
        updateUserBalanceDisplay();
        renderProfileBadges();
    }

    /* Güncel Bakiye Hesaplama ve Ekranda Güncelleme */
    function getCurrentBalance() {
        var entries = (typeof Finance !== 'undefined' && Finance.getEntries) ? Finance.getEntries() : [];
        var totalIncome = 0;
        var totalExpense = 0;
        entries.forEach(function (e) {
            var amt = parseFloat(e.amount) || 0;
            if (e.type === 'income') totalIncome += amt;
            else if (e.type === 'expense') totalExpense += amt;
        });
        return totalIncome - totalExpense;
    }

    function updateUserBalanceDisplay() {
        var bal = getCurrentBalance();
        var formatted = (bal >= 0 ? '+' : '-') + formatMoney(Math.abs(bal));

        // Kenar çubuğu bakiye göstergesi
        var sidebarBal = document.getElementById('sidebar-user-balance');
        if (sidebarBal) {
            sidebarBal.textContent = 'Bakiye: ' + formatted;
            sidebarBal.className = 'sidebar-user-balance ' + (bal >= 0 ? 'text-pos' : 'text-neg');
        }

        // Header bakiye hapı
        var headerBal = document.getElementById('header-user-balance');
        if (headerBal) {
            headerBal.textContent = formatted;
            headerBal.className = 'hub-amount ' + (bal >= 0 ? 'text-pos' : 'text-neg');
        }
    }

    /* Kullanıcı Profilinde Rozetlerin Listelenmesi */
    function renderProfileBadges() {
        var container = document.getElementById('profile-badges-container');
        if (!container) return;

        var badges = checkAllBadges(false);
        var streakInfo = calculateStreak();

        var badgeItems = [
            { 
                id: 'disciplined', 
                badge: badges.disciplined, 
                icon: '🏅', 
                title: 'Disiplinli Bütçeci', 
                desc: 'Bir ayı hiçbir kategori limitini aşmadan tamamlayan kullanıcıya verilir.' 
            },
            { 
                id: 'hunter', 
                badge: badges.hunter, 
                icon: '🎯', 
                title: 'Hedef Avcısı', 
                desc: 'İlk tasarruf hedefini (%100) başarıyla tamamlayan kullanıcıya verilir.' 
            },
            { 
                id: 'streak', 
                badge: badges.streak, 
                icon: '🔥', 
                title: 'Düzenli Kayıtçı', 
                desc: '30 gün üst üste işlem kaydı giren kullanıcıya verilir (Seri: ' + streakInfo.currentStreak + '/30).' 
            }
        ];

        var html = '<div class="profile-badges-grid-list">';
        badgeItems.forEach(function (b) {
            var isUnlocked = b.badge && b.badge.unlocked;
            var dateStr = (isUnlocked && b.badge.unlockedAt) 
                ? new Date(b.badge.unlockedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                : null;

            html += 
                '<div class="profile-badge-item ' + (isUnlocked ? 'badge-earned' : 'badge-unearned') + '">' +
                '  <div class="pbi-icon-wrap">' + b.icon + '</div>' +
                '  <div class="pbi-details">' +
                '    <div class="pbi-title">' + escapeHtml(b.title) + '</div>' +
                '    <div class="pbi-desc">' + escapeHtml(b.desc) + '</div>' +
                '    <div class="pbi-status">' + 
                       (isUnlocked 
                           ? '<span class="pbi-status-pill earned">✨ Kazanıldı (' + dateStr + ')</span>' 
                           : '<span class="pbi-status-pill locked">🔒 Kilitli</span>') + 
                '    </div>' +
                '  </div>' +
                '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
    }

    /* Dışarıya Açılan API */
    return {
        init: init,
        switchTab: switchTab,
        // Bakiye & Profil
        getCurrentBalance: getCurrentBalance,
        updateUserBalanceDisplay: updateUserBalanceDisplay,
        renderProfileBadges: renderProfileBadges,
        // Kategori filtreleme
        renderCategoryFilter: renderCategoryFilter,
        setCategoryFilter: setCategoryFilter,
        getCurrentCategoryFilter: getCurrentCategoryFilter,
        // Limitler
        openLimitModal: openLimitModal,
        saveLimitModal: saveLimitModal,
        deleteLimit: deleteLimit,
        renderBudgets: renderBudgets,
        // Raporlar
        renderReports: renderReports,
        prevReportMonth: prevReportMonth,
        nextReportMonth: nextReportMonth,
        setReportMonthToCurrent: setReportMonthToCurrent,
        // Tasarruf Hedefleri
        openAddGoalModal: openAddGoalModal,
        saveGoalModal: saveGoalModal,
        openAddSavingsModal: openAddSavingsModal,
        saveSavingsModal: saveSavingsModal,
        deleteGoal: deleteGoal,
        renderGoals: renderGoals,
        // Rozetler
        renderBadges: renderBadges,
        checkAllBadges: checkAllBadges,
        // Genel
        closeModal: closeModal,
        onTransactionChanged: onTransactionChanged
    };
})();
