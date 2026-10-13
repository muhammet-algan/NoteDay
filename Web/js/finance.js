/* ========================================
   GELİR/GİDER TAKİBİ MODÜLÜ
   Gelir ve gider kayıtlarını yönetir.
   Ekleme, düzenleme, silme, tarih filtreleme
   ve özet hesaplama özellikleri.
   ======================================== */
var Finance = (function () {
    'use strict';

    /* localStorage anahtarı */
    var STORAGE_KEY = 'finance_entries';
    /* Aktif tarih filtresi (varsayılan: bu ay) */
    var currentFilter = 'this-month';
    /* Özel tarih aralığı (başlangıç ve bitiş) */
    var customStart = null;
    var customEnd = null;

    /* Tüm gelir/gider kayıtlarını localStorage'dan okuma */
    function getEntries() {
        var key = STORAGE_KEY;
        if (typeof App !== 'undefined' && App.activeSubSection && App.activeSubSection['finance']) {
            key = STORAGE_KEY + '_' + App.activeSubSection['finance'];
        }
        return DB.getForUser(key) || [];
    }

    /* Kayıtları localStorage'a yazma */
    function saveEntries(entries) {
        var key = STORAGE_KEY;
        if (typeof App !== 'undefined' && App.activeSubSection && App.activeSubSection['finance']) {
            key = STORAGE_KEY + '_' + App.activeSubSection['finance'];
        }
        DB.setForUser(key, entries);
    }

    /* Modül başlatma - Gelir/gider ekleme formunu ayarla */
    function init() {
        var form = document.getElementById('finance-form');
        if (form) {
            form.addEventListener('submit', handleAdd);
        }
        /* Tekrarlayan işlemleri kontrol et */
        checkRecurring();
    }

    /* Yeni kayıt ekleme veya mevcut kaydı güncelleme */
    function handleAdd(e) {
        e.preventDefault();

        var form = e.target;

        /* Form alanlarını al */
        var typeSelect = document.getElementById('finance-type');
        var amountInput = document.getElementById('finance-amount');
        var categoryInput = document.getElementById('finance-category');
        var descInput = document.getElementById('finance-desc');

        var type = typeSelect.value;           /* Tür: 'income' (gelir) veya 'expense' (gider) */
        var amount = parseFloat(amountInput.value);  /* Tutar */
        var category = categoryInput.value;     /* Kategori */
        var desc = descInput.value.trim();     /* Açıklama */

        /* Zorunlu alan kontrolü */
        if (!type || isNaN(amount) || amount <= 0) return;

        var entries = getEntries();
        var editingId = form.getAttribute('data-editing-id');

        if (editingId) {
            /* Mevcut kaydı güncelle */
            var id = parseInt(editingId, 10);
            var entry = entries.find(function (e) { return e.id === id; });
            if (entry) {
                entry.type = type;
                entry.amount = amount;
                entry.category = category;
                entry.description = desc;
            }
            form.removeAttribute('data-editing-id');
            var submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Ekle';
        } else {
            /* Yeni kayıt oluştur ve listenin başına ekle */
            entries.unshift({
                id: Date.now(),
                type: type,
                amount: amount,
                category: category,
                description: desc,
                date: new Date().toISOString()
            });
        }

        /* Kaydet ve formu sıfırla */
        saveEntries(entries);
        amountInput.value = '';
        categoryInput.value = '';
        descInput.value = '';
        render();
    }

    /* Kaydı düzenleme - Modal açarak düzenleme formu göster */
    function editEntry(id) {
        openEditModal(id);
    }

    /* Silme onay modalını gösterme (kaydın detayları ile) */
    function confirmDelete(id) {
        var entries = getEntries();
        var entry = entries.find(function (e) { return e.id === id; });
        if (!entry) return;

        var sign = entry.type === 'income' ? '+' : '-';
        var typeLabel = entry.type === 'income' ? 'Gelir' : 'Gider';

        /* Onay modalı HTML yapısı (tür + kategori + tutar bilgileri) */
        var html = '<div class="modal-overlay" onclick="Finance.closeModal()">' +
            '<div class="modal-content confirm-modal" onclick="event.stopPropagation()">' +
            '<div class="confirm-modal-icon">⚠️</div>' +
            '<h3 class="confirm-modal-title">İşlemi Silmek İstediğinizden Emin Misiniz?</h3>' +
            '<div class="confirm-modal-detail">' +
            '<div class="confirm-detail-row">' +
            '<span class="confirm-detail-label">Tür:</span>' +
            '<span class="confirm-detail-value">' + typeLabel + '</span>' +
            '</div>' +
            '<div class="confirm-detail-row">' +
            '<span class="confirm-detail-label">Kategori:</span>' +
            '<span class="confirm-detail-value">' + escapeHtml(entry.category || '-') + '</span>' +
            '</div>' +
            '<div class="confirm-detail-row">' +
            '<span class="confirm-detail-label">Tutar:</span>' +
            '<span class="confirm-detail-value finance-amount ' + entry.type + '">' + sign + formatMoney(entry.amount) + ' TL</span>' +
            '</div>' +
            '</div>' +
            '<p class="confirm-modal-warning">Bu işlem geri alınamaz.</p>' +
            '<div class="confirm-modal-actions">' +
            '<button class="btn btn-secondary" onclick="Finance.closeModal()">İptal</button>' +
            '<button class="btn btn-danger" onclick="Finance.deleteEntry(' + id + ')">Sil</button>' +
            '</div>' +
            '</div></div>';

        /* Modalı DOM'a ekle */
        var container = document.getElementById('finance-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'finance-modal-container';
            document.body.appendChild(container);
        }
        container.innerHTML = html;
    }

    /* Onay modalını kapatma */
    function closeModal() {
        var container = document.getElementById('finance-modal-container');
        if (container) container.innerHTML = '';
    }

    /* Kaydı silme */
    function deleteEntry(id) {
        var entries = getEntries();
        var original = entries.find(function (e) { return e.id === id; });
        if (original && typeof Trash !== 'undefined') {
            Trash.addToTrash('finance', id, original.description || original.category || 'Adsız Gelir/Gider', (original.type === 'income' ? 'Gelir: +' : 'Gider: -') + original.amount + ' TL', original);
        }
        entries = entries.filter(function (e) { return e.id !== id; });
        saveEntries(entries);
        closeModal();
        render();
    }

    /* Tarih filtresini değiştirme (bu ay, geçen ay, son 3 ay, yıllık, özel) */
    function setFilter(filter) {
        currentFilter = filter;

        /* Aktif filtre butonunu vurgula */
        var buttons = document.querySelectorAll('.finance-date-filters .filter-btn');
        buttons.forEach(function (btn) {
            btn.classList.remove('active');
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active');
            }
        });

        /* Özel tarih aralığı alanını göster/gizle */
        var customDateEl = document.getElementById('finance-custom-date');
        if (customDateEl) {
            customDateEl.style.display = filter === 'custom' ? 'flex' : 'none';
        }

        /* Özel tarih harici filtrelerde hemen yenile */
        if (filter !== 'custom') {
            render();
        }
    }

    /* Özel tarih aralığını uygulama */
    function applyCustomDate() {
        var startInput = document.getElementById('finance-date-start');
        var endInput = document.getElementById('finance-date-end');

        if (startInput.value) {
            customStart = new Date(startInput.value);
            customStart.setHours(0, 0, 0, 0);
        } else {
            customStart = null;
        }

        if (endInput.value) {
            customEnd = new Date(endInput.value);
            customEnd.setHours(23, 59, 59, 999);
        } else {
            customEnd = null;
        }

        render();
    }

    /* Aktif filtreye göre tarih aralığını hesaplama */
    function getDateRange() {
        var now = new Date();
        var start, end;

        switch (currentFilter) {
            case 'this-month':   /* Bu ay */
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'last-month':   /* Geçen ay */
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                break;
            case 'last-3-months': /* Son 3 ay */
                start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'yearly':       /* Yıllık */
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            case 'custom':       /* Özel tarih aralığı */
                start = customStart;
                end = customEnd;
                break;
            default:
                start = null;
                end = null;
        }

        return { start: start, end: end };
    }

    /* Kayıtları tarih aralığına göre filtreleme */
    function filterEntries(entries) {
        var range = getDateRange();
        if (!range.start && !range.end) return entries;

        return entries.filter(function (entry) {
            var entryDate = new Date(entry.date);
            if (range.start && entryDate < range.start) return false;
            if (range.end && entryDate > range.end) return false;
            return true;
        });
    }


    /* ---- DÜZENLEME MODALI ---- */

    /* Kayıt düzenleme modalını açma */
    function openEditModal(id) {
        var entries = getEntries();
        var entry = entries.find(function (e) { return e.id === id; });
        if (!entry) return;

        var typeLabel = entry.type === 'income' ? 'Gelir' : 'Gider';
        var incomeActive = entry.type === 'income' ? ' active' : '';
        var expenseActive = entry.type === 'expense' ? ' active' : '';

        var MONTH_NAMES = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];
        var entryDateObj = entry.date ? new Date(entry.date) : new Date();
        if (isNaN(entryDateObj.getTime())) entryDateObj = new Date();
        var entryDateStr = entryDateObj.getFullYear() + '-' +
            String(entryDateObj.getMonth() + 1).padStart(2, '0') + '-' +
            String(entryDateObj.getDate()).padStart(2, '0');
        var entryDateDisplay = entryDateObj.getDate() + ' ' + MONTH_NAMES[entryDateObj.getMonth()] + ' ' + entryDateObj.getFullYear();

        var html = '<div class="modal-overlay" onclick="Finance.closeModal()">' +
            '<div class="modal-content finance-edit-modal" onclick="event.stopPropagation()">' +
            '<button class="modal-close" onclick="Finance.closeModal()">&times;</button>' +
            '<h3 class="finance-edit-modal-title">İşlemi Düzenle</h3>' +
            '<form id="finance-edit-form" onsubmit="Finance.saveEditModal(event)">' +
            '<input type="hidden" id="finance-edit-id" value="' + id + '">' +
            '<div class="form-group">' +
            '<label>Tarih</label>' +
            '<input type="hidden" id="finance-edit-date" value="' + entryDateStr + '">' +
            '<button type="button" class="finance-date-trigger" id="finance-edit-date-btn" onclick="FinanceCalendarPicker.open(\'finance-edit-date\',\'finance-edit-date-label\')">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' +
            '</svg>' +
            '<span id="finance-edit-date-label">' + entryDateDisplay + '</span>' +
            '</button>' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Tür</label>' +
            '<input type="hidden" id="finance-edit-type" value="' + entry.type + '">' +
            '<div class="styled-select" id="finance-edit-type-select">' +
            '<div class="styled-select-trigger" onclick="toggleStyledSelect(\'finance-edit-type-select\')">' +
            '<span class="trigger-label" id="finance-edit-type-label">' + typeLabel + '</span>' +
            '<svg class="trigger-chevron" width="14" height="14" viewBox="0 0 14 14">' +
            '<path fill="currentColor" d="M7 9.5L2.5 5 3.56 3.94 7 7.38 10.44 3.94 11.5 5z"/>' +
            '</svg>' +
            '</div>' +
            '<div class="styled-select-dropdown">' +
            '<div class="styled-select-option' + incomeActive + '" data-value="income" onclick="selectStyledOption(\'finance-edit-type-select\',\'income\',\'Gelir\')">' +
            '<span>Gelir</span>' +
            '</div>' +
            '<div class="styled-select-option' + expenseActive + '" data-value="expense" onclick="selectStyledOption(\'finance-edit-type-select\',\'expense\',\'Gider\')">' +
            '<span>Gider</span>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Tutar (TL)</label>' +
            '<input type="number" id="finance-edit-amount" class="form-control" step="0.01" min="0" value="' + entry.amount + '" required ' +
            'inputmode="decimal" onkeypress="return (event.charCode >= 48 && event.charCode <= 57) || event.charCode === 46 || event.charCode === 44">' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Kategori</label>' +
            '<input type="text" id="finance-edit-category" class="form-control" value="' + escapeHtml(entry.category || '') + '" maxlength="60" required>' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Açıklama</label>' +
            '<input type="text" id="finance-edit-desc" class="form-control" value="' + escapeHtml(entry.description || '') + '" maxlength="80">' +
            '</div>' +
            '<div class="finance-edit-actions">' +
            '<button type="button" class="btn" onclick="Finance.closeModal()">İptal</button>' +
            '<button type="submit" class="btn btn-primary">Kaydet</button>' +
            '</div>' +
            '</form>' +
            '</div></div>';

        var container = document.getElementById('finance-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'finance-modal-container';
            document.body.appendChild(container);
        }
        container.innerHTML = html;
    }

    /* Düzenleme modalındaki değişiklikleri kaydetme */
    function saveEditModal(e) {
        e.preventDefault();

        var id = parseInt(document.getElementById('finance-edit-id').value, 10);
        var dateInput = document.getElementById('finance-edit-date');
        var dateVal = dateInput ? dateInput.value : '';
        var type = document.getElementById('finance-edit-type').value;
        var amount = parseFloat(document.getElementById('finance-edit-amount').value);
        var category = document.getElementById('finance-edit-category').value;
        var desc = document.getElementById('finance-edit-desc').value.trim();

        if (!type || isNaN(amount) || amount <= 0) return;

        var entries = getEntries();
        var entry = entries.find(function (e) { return e.id === id; });
        if (entry) {
            entry.type = type;
            entry.amount = amount;
            entry.category = category;
            entry.description = desc;
            if (dateVal) {
                var origDate = entry.date ? new Date(entry.date) : new Date();
                var timePart = !isNaN(origDate.getTime())
                    ? String(origDate.getHours()).padStart(2, '0') + ':' +
                      String(origDate.getMinutes()).padStart(2, '0') + ':' +
                      String(origDate.getSeconds()).padStart(2, '0')
                    : '12:00:00';
                var parsed = new Date(dateVal + 'T' + timePart);
                entry.date = !isNaN(parsed.getTime()) ? parsed.toISOString() : new Date(dateVal).toISOString();
            }
        }

        entries.sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });

        saveEntries(entries);
        closeModal();
        render();
    }

    /* Tutarı Türk Lirası formatında gösterme (virgül ile) */
    function formatMoney(amount) {
        return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /* ISO tarihini GG.AA.YYYY formatına çevirme */
    function formatDate(iso) {
        var d = new Date(iso);
        return String(d.getDate()).padStart(2, '0') + '.' +
            String(d.getMonth() + 1).padStart(2, '0') + '.' +
            d.getFullYear();
    }

    /* HTML özel karakterlerini güvenli hale getirme (XSS koruması) */
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /* Gelir/gider listesini ekranda oluşturma */
    function render() {
        // Load finance customizer options
        var options = {
            calendar: true
        };
        try {
            var saved = localStorage.getItem('finance_cust_options');
            if (saved) {
                var parsed = JSON.parse(saved);
                for (var k in parsed) {
                    options[k] = parsed[k];
                }
            }
        } catch (e) {}

        // Apply calendar layout
        var layoutEl = document.querySelector('.finance-layout');
        var sidebarEl = document.querySelector('.finance-sidebar');
        var showCalendar = options.calendar !== false;
        
        if (sidebarEl) {
            sidebarEl.style.display = showCalendar ? 'block' : 'none';
            if (layoutEl) {
                if (showCalendar) {
                    layoutEl.style.display = 'grid';
                    layoutEl.style.gridTemplateColumns = '1fr 280px';
                } else {
                    layoutEl.style.display = 'block';
                }
            }
        }

        var allEntries = getEntries();
        var entries = filterEntries(allEntries);

        /* Kayıt listesini oluştur */
        var listBody = document.getElementById('finance-list-body');
        if (!listBody) return;

        if (entries.length === 0) {
            listBody.innerHTML = '<div class="empty-state"><p>Bu dönemde kayıt yok.</p></div>';
            if (window.FinanceCalendar) {
                FinanceCalendar.render();
            }
            return;
        }

        /* Tekrarlayan işlemlerin ID'lerini tespit et */
        var recurring = getRecurring();
        var recurringIds = {};
        recurring.forEach(function (r) { recurringIds[r.entryId] = true; });

        /* Her kayıt için satır oluştur */
        var html = '';
        entries.forEach(function (entry) {
            var sign = entry.type === 'income' ? '+' : '-';
            var recurClass = recurringIds[entry.id] ? ' finance-item-recurring' : '';
            html += '<div class="finance-item' + recurClass + '" onclick="Finance.openDetail(' + entry.id + ')">' +
                '<span>' + (recurringIds[entry.id] ? '<span style="font-size:18px">🔁</span> ' : '') + escapeHtml(entry.description || entry.category) + '</span>' +
                '<span>' + escapeHtml(entry.category) + '</span>' +
                '<span class="finance-amount ' + entry.type + '">' + sign + formatMoney(entry.amount) + '</span>' +
                '<span class="text-secondary text-sm">' + formatDate(entry.date) + '</span>' +
                '<button class="finance-item-kebab" onclick="event.stopPropagation(); Finance.showContextMenu(event, ' + entry.id + ')" title="Seçenekler">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>' +
                '</button>' +
                '</div>';
        });
        listBody.innerHTML = html;

        if (window.FinanceCalendar) {
            FinanceCalendar.render();
        }
    }

    /* ---- İŞLEMİ TEKRARLA MODALI ---- */

    var RECURRING_KEY = 'finance_recurring';

    function getRecurring() {
        var key = RECURRING_KEY;
        if (typeof App !== 'undefined' && App.activeSubSection && App.activeSubSection['finance']) {
            key = RECURRING_KEY + '_' + App.activeSubSection['finance'];
        }
        return DB.getForUser(key) || [];
    }

    function saveRecurring(list) {
        var key = RECURRING_KEY;
        if (typeof App !== 'undefined' && App.activeSubSection && App.activeSubSection['finance']) {
            key = RECURRING_KEY + '_' + App.activeSubSection['finance'];
        }
        DB.setForUser(key, list);
    }

    /* Tekrar modalını açma */
    function openRepeatModal(id) {
        var entries = getEntries();
        var entry = entries.find(function (e) { return e.id === id; });
        if (!entry) return;

        var sign = entry.type === 'income' ? '+' : '-';
        var typeLabel = entry.type === 'income' ? 'Gelir' : 'Gider';

        var html = '<div class="modal-overlay" onclick="Finance.closeModal()">' +
            '<div class="modal-content finance-repeat-modal" onclick="event.stopPropagation()">' +
            '<button class="modal-close" onclick="Finance.closeModal()">&times;</button>' +
            '<h3 class="finance-edit-modal-title">İşlemi Tekrarla</h3>' +
            '<div class="finance-repeat-info">' +
            '<div class="confirm-detail-row"><span class="confirm-detail-label">' + typeLabel + ':</span>' +
            '<span class="confirm-detail-value">' + escapeHtml(entry.description || entry.category) + '</span></div>' +
            '<div class="confirm-detail-row"><span class="confirm-detail-label">Tutar:</span>' +
            '<span class="confirm-detail-value finance-amount ' + entry.type + '">' + sign + formatMoney(entry.amount) + ' TL</span></div>' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Tekrar Sıklığı</label>' +
            '<div class="finance-repeat-options">' +
            '<button type="button" class="finance-repeat-btn" data-freq="daily" onclick="Finance.selectRepeatFreq(this)">Her gün</button>' +
            '<button type="button" class="finance-repeat-btn" data-freq="weekly" onclick="Finance.selectRepeatFreq(this)">Her hafta</button>' +
            '<button type="button" class="finance-repeat-btn active" data-freq="monthly" onclick="Finance.selectRepeatFreq(this)">Her ay</button>' +
            '<button type="button" class="finance-repeat-btn" data-freq="custom" onclick="Finance.selectRepeatFreq(this)">Tarih seçin</button>' +
            '</div>' +
            '</div>' +
            '<div class="form-group" id="finance-repeat-custom-date" style="display:none">' +
            '<label>Başlangıç Tarihi</label>' +
            '<input type="hidden" id="finance-repeat-date">' +
            '<button type="button" class="finance-date-trigger" onclick="FinanceCalendarPicker.open(\'finance-repeat-date\',\'finance-repeat-date-label\')">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' +
            '</svg>' +
            '<span id="finance-repeat-date-label">Tarih seçin</span>' +
            '</button>' +
            '</div>' +
            '<input type="hidden" id="finance-repeat-id" value="' + id + '">' +
            '<input type="hidden" id="finance-repeat-freq" value="monthly">' +
            '<div class="finance-edit-actions">' +
            '<button type="button" class="btn" onclick="Finance.closeModal()">İptal</button>' +
            '<button type="button" class="btn btn-primary" onclick="Finance.saveRepeat()">Kaydet</button>' +
            '</div>' +
            '</div></div>';

        var container = document.getElementById('finance-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'finance-modal-container';
            document.body.appendChild(container);
        }
        container.innerHTML = html;
    }

    /* Tekrar sıklığı buton seçimi */
    function selectRepeatFreq(btn) {
        var btns = document.querySelectorAll('.finance-repeat-btn');
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var freq = btn.getAttribute('data-freq');
        document.getElementById('finance-repeat-freq').value = freq;
        var customBox = document.getElementById('finance-repeat-custom-date');
        if (customBox) customBox.style.display = freq === 'custom' ? 'block' : 'none';
    }

    /* Tekrar kaydını kaydetme */
    function saveRepeat() {
        var id = parseInt(document.getElementById('finance-repeat-id').value, 10);
        var freq = document.getElementById('finance-repeat-freq').value;
        var entries = getEntries();
        var entry = entries.find(function (e) { return e.id === id; });
        if (!entry) return;

        var now = new Date();
        var startDate = now.toISOString().split('T')[0];

        if (freq === 'custom') {
            var dateInput = document.getElementById('finance-repeat-date');
            if (dateInput && dateInput.value) {
                startDate = dateInput.value;
            }
        }

        var recurring = getRecurring();
        /* Aynı entry için mevcut tekrarı kaldır */
        recurring = recurring.filter(function (r) { return r.entryId !== id; });
        recurring.push({
            entryId: id,
            type: entry.type,
            amount: entry.amount,
            category: entry.category,
            description: entry.description,
            frequency: freq,
            startDate: startDate,
            lastAdded: now.toISOString().split('T')[0],
            createdAt: now.toISOString()
        });
        saveRecurring(recurring);
        closeModal();
        render();
        Toast.success('Tekrarlayan işlem kaydedildi!');
    }

    /* Tekrarlayan işlemi kaldırma */
    function removeRepeat(id) {
        var recurring = getRecurring();
        recurring = recurring.filter(function (r) { return r.entryId !== id; });
        saveRecurring(recurring);
        render();
        Toast.success('İşlem tekrarı kaldırıldı!');
    }

    /* Sayfa açılışında tekrarlayan işlemleri kontrol et */
    function checkRecurring() {
        var recurring = getRecurring();
        if (recurring.length === 0) return;

        var entries = getEntries();
        var now = new Date();
        var todayStr = now.toISOString().split('T')[0];
        var changed = false;

        recurring.forEach(function (r) {
            if (!r.lastAdded) r.lastAdded = r.startDate;
            var lastDate = new Date(r.lastAdded);
            var nextDate;

            if (r.frequency === 'daily') {
                nextDate = new Date(lastDate);
                nextDate.setDate(nextDate.getDate() + 1);
            } else if (r.frequency === 'weekly') {
                nextDate = new Date(lastDate);
                nextDate.setDate(nextDate.getDate() + 7);
            } else if (r.frequency === 'monthly') {
                nextDate = new Date(lastDate);
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else if (r.frequency === 'custom') {
                nextDate = new Date(lastDate);
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else {
                return;
            }

            var nextStr = nextDate.toISOString().split('T')[0];

            /* Bugüne kadar olan tüm eksik kayıtları ekle */
            while (nextStr <= todayStr) {
                entries.unshift({
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    type: r.type,
                    amount: r.amount,
                    category: r.category,
                    description: r.description,
                    date: nextDate.toISOString(),
                    recurring: true
                });
                r.lastAdded = nextStr;
                changed = true;

                /* Sonraki tarihi hesapla */
                if (r.frequency === 'daily') {
                    nextDate.setDate(nextDate.getDate() + 1);
                } else if (r.frequency === 'weekly') {
                    nextDate.setDate(nextDate.getDate() + 7);
                } else {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }
                nextStr = nextDate.toISOString().split('T')[0];
            }
        });

        if (changed) {
            saveEntries(entries);
            saveRecurring(recurring);
        }
    }

    /* ---- KEBAB CONTEXT MENU ---- */

    function closeContextMenu() {
        var container = document.getElementById('finance-ctx-container');
        if (container) container.innerHTML = '';
    }

    function showContextMenu(e, id, fromDetail) {
        closeContextMenu();

        /* Tekrarlayan mı kontrol et */
        var recurring = getRecurring();
        var isRecurring = recurring.some(function (r) { return r.entryId === id; });

        var html = '<div class="team-task-ctx-menu" id="finance-ctx-menu">';
        
        /* 1. Düzenle */
        html += '<button onclick="Finance.closeContextMenu(); ' + (fromDetail ? 'Finance.closeDetail(); ' : '') + 'Finance.openEditModal(' + id + ')">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
            '<span>İşlemi düzenle</span></button>';

        /* 2. Paylaş */
        html += '<button onclick="Finance.closeContextMenu(); Finance.openShareModal(' + id + ')">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' +
            '<span>Ekiple paylaş</span></button>';

        /* 3. İsteğe bağlı Tekrar seçenekleri (sadece liste görünümünde) */
        if (!fromDetail) {
            if (isRecurring) {
                html += '<button onclick="Finance.closeContextMenu(); Finance.removeRepeat(' + id + ')">' +
                    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>' +
                    '<span>İşlem tekrarını kapat</span></button>';
            } else {
                html += '<button onclick="Finance.closeContextMenu(); Finance.openRepeatModal(' + id + ')">' +
                    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>' +
                    '<span>İşlemi tekrarla</span></button>';
            }
        }

        html += '<div class="team-task-ctx-divider"></div>';
        
        /* 4. Sil */
        html += '<button class="danger" onclick="Finance.closeContextMenu(); ' + (fromDetail ? 'Finance.closeDetail(); ' : '') + 'Finance.confirmDelete(' + id + ')">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
            '<span>İşlemi sil</span></button>';
        html += '</div>';

        var container = document.getElementById('finance-ctx-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'finance-ctx-container';
            document.body.appendChild(container);
        }
        container.innerHTML = html;

        var menu = document.getElementById('finance-ctx-menu');
        if (menu) {
            var btnRect = e.currentTarget.getBoundingClientRect();
            var menuHeight = 200; // Expected max height
            var spaceBelow = window.innerHeight - btnRect.bottom;
            
            if (spaceBelow < menuHeight) {
                menu.style.bottom = (window.innerHeight - btnRect.top + 4) + 'px';
                menu.style.top = 'auto';
            } else {
                menu.style.top = btnRect.bottom + 4 + 'px';
                menu.style.bottom = 'auto';
            }
            
            menu.style.right = (window.innerWidth - btnRect.right) + 'px';
            requestAnimationFrame(function () { menu.classList.add('open'); });
        }

        /* Dışarı tıklayınca kapat */
        setTimeout(function () {
            document.addEventListener('click', function closeOnOutside(ev) {
                if (!ev.target.closest('#finance-ctx-menu') && !ev.target.closest('.finance-item-kebab')) {
                    closeContextMenu();
                    document.removeEventListener('click', closeOnOutside);
                }
            });
        }, 0);
    }

    /* ---- EKİPLE PAYLAŞ MODALI ---- */

    function openShareModal(id) {
        var entries = getEntries();
        var entry = entries.find(function (e) { return e.id === id; });
        if (!entry) return;

        var sign = entry.type === 'income' ? '+' : '-';

        /* Ekipleri al */
        var teams = [];
        try {
            var teamsData = DB.getForUser('user_teams');
            if (Array.isArray(teamsData)) teams = teamsData;
        } catch (ex) { }

        /* Ekip listesi HTML'i oluştur */
        var teamListHtml = '';
        if (teams.length === 0) {
            teamListHtml = '<p class="text-secondary text-sm" style="padding:12px">Kayıtlı ekip bulunamadı.</p>';
        } else {
            teams.forEach(function (team) {
                var initials = (team.name || '').split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().substr(0, 2);
                var colorHex = '#6366f1';
                var TEAM_COLORS = [
                    { id: 'blue', hex: '#3b82f6' }, { id: 'purple', hex: '#8b5cf6' },
                    { id: 'green', hex: '#10b981' }, { id: 'red', hex: '#ef4444' },
                    { id: 'orange', hex: '#f59e0b' }, { id: 'pink', hex: '#ec4899' },
                    { id: 'teal', hex: '#14b8a6' }, { id: 'indigo', hex: '#6366f1' },
                    { id: 'gray', hex: '#64748b' }, { id: 'black', hex: '#1e293b' }
                ];
                var c = TEAM_COLORS.find(function (tc) { return tc.id === team.color; });
                if (c) colorHex = c.hex;

                var avatarHtml = team.photo
                    ? '<img src="' + team.photo + '" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">'
                    : '<div class="fs-team-avatar" style="background:' + colorHex + '">' + initials + '</div>';

                teamListHtml +=
                    '<button type="button" class="fs-team-option" data-team-id="' + team.id + '" onclick="Finance.toggleShareTeam(this)">' +
                    '<div class="fs-team-option-left">' +
                    avatarHtml +
                    '<span>' + escapeHtml(team.name) + '</span>' +
                    '</div>' +
                    '<div class="fs-team-check">' +
                    '<svg class="fs-team-check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>' +
                    '</div>' +
                    '</button>';
            });
        }

        var html = '<div class="modal-overlay" onclick="Finance.closeModal()">' +
            '<div class="modal-content finance-share-modal" onclick="event.stopPropagation()">' +
            '<button class="modal-close" onclick="Finance.closeModal()">&times;</button>' +
            '<h3 class="finance-edit-modal-title">Ekiple Paylaş</h3>' +
            '<div class="finance-repeat-info">' +
            '<div class="confirm-detail-row"><span class="confirm-detail-label">Kategori:</span>' +
            '<span class="confirm-detail-value">' + escapeHtml(entry.category || '-') + '</span></div>' +
            '<div class="confirm-detail-row"><span class="confirm-detail-label">Tutar:</span>' +
            '<span class="confirm-detail-value finance-amount ' + entry.type + '">' + sign + formatMoney(entry.amount) + ' TL</span></div>' +
            (entry.description ? '<div class="confirm-detail-row"><span class="confirm-detail-label">Açıklama:</span>' +
                '<span class="confirm-detail-value">' + escapeHtml(entry.description) + '</span></div>' : '') +
            '</div>' +
            '<div class="form-group">' +
            '<label class="finance-share-section-title">Hangi ekiple paylaşılsın?</label>' +
            '<div class="fs-team-dropdown-wrapper">' +
            '<button type="button" class="fs-team-trigger" id="fs-team-trigger" onclick="Finance.toggleShareDropdown()">' +
            '<span id="fs-team-trigger-label">Seçiniz...</span>' +
            '<svg width="14" height="14" viewBox="0 0 14 14"><path fill="currentColor" d="M7 9.5L2.5 5 3.56 3.94 7 7.38 10.44 3.94 11.5 5z"/></svg>' +
            '</button>' +
            '<div class="fs-team-panel" id="fs-team-panel">' +
            teamListHtml +
            '</div>' +
            '</div>' +
            '</div>' +
            '<input type="hidden" id="finance-share-id" value="' + id + '">' +
            '<div class="finance-edit-actions">' +
            '<button type="button" class="btn" onclick="Finance.closeModal()">İptal</button>' +
            '<button type="button" class="btn btn-primary" onclick="Finance.saveShare()">Paylaş</button>' +
            '</div>' +
            '</div></div>';

        var container = document.getElementById('finance-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'finance-modal-container';
            document.body.appendChild(container);
        }
        container.innerHTML = html;
    }

    /* Dropdown aç/kapat */
    function toggleShareDropdown() {
        var trigger = document.getElementById('fs-team-trigger');
        var panel = document.getElementById('fs-team-panel');
        if (!trigger || !panel) return;
        var isOpen = panel.classList.contains('open');
        trigger.classList.toggle('open', !isOpen);
        panel.classList.toggle('open', !isOpen);
    }

    /* Ekip seçim toggle — daire radio */
    function toggleShareTeam(btn) {
        btn.classList.toggle('selected');

        /* Trigger label güncelle */
        var selected = document.querySelectorAll('.fs-team-option.selected');
        var label = document.getElementById('fs-team-trigger-label');
        if (!label) return;
        if (selected.length === 0) {
            label.textContent = 'Seçiniz...';
        } else if (selected.length === 1) {
            var name = selected[0].querySelector('span');
            label.textContent = name ? name.textContent : '1 ekip';
        } else {
            label.textContent = selected.length + ' ekip seçildi';
        }
    }

    /* Paylaşımı kaydetme — seçili ekiplerin finans kayıtlarına ekle */
    function saveShare() {
        var id = parseInt(document.getElementById('finance-share-id').value, 10);

        /* Seçili ekipleri topla */
        var selectedTeamIds = [];
        var selectedOpts = document.querySelectorAll('.fs-team-option.selected');
        selectedOpts.forEach(function (opt) {
            selectedTeamIds.push(opt.getAttribute('data-team-id'));
        });

        if (selectedTeamIds.length === 0) {
            Toast.warning('Lütfen en az bir ekip seçin.');
            return;
        }

        var entries = getEntries();
        var entry = entries.find(function (e) { return e.id === id; });
        if (!entry) return;

        /* Kişisel kayda hangi ekiplerle paylaşıldığını işaretle */
        entry.sharedWith = selectedTeamIds;
        saveEntries(entries);

        /* Her seçili ekibin finans kayıtlarına bu işlemi ekle */
        var user = DB.currentUser();
        var userName = user ? (user.firstName + ' ' + user.lastName) : 'Anonim';

        try {
            var teamFinance = DB.getForUser('user_team_finance') || [];
            selectedTeamIds.forEach(function (teamId) {
                teamFinance.push({
                    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                    teamId: teamId,
                    type: entry.type,
                    description: entry.description || entry.category,
                    category: entry.category,
                    amount: entry.amount,
                    author: userName,
                    date: entry.date ? entry.date.split('T')[0] : new Date().toISOString().split('T')[0],
                    visibility: 'everyone',
                    visibleTo: [],
                    sharedFromPersonal: true
                });
            });
            DB.setForUser('user_team_finance', teamFinance);
        } catch (ex) { }

        closeModal();
        Toast.success('İşlem ' + selectedTeamIds.length + ' ekiple paylaşıldı!');
    }

    /* ---- Tutarları Gizle/Göster ---- */
    var amountsHidden = false;

    function toggleAmountVisibility() {
        amountsHidden = !amountsHidden;

        var els = document.querySelectorAll('#finance-total-income, #finance-total-expense, #finance-balance');
        var iconEl = document.getElementById('finance-eye-icon');

        if (amountsHidden) {
            /* Tutarları gizle */
            els.forEach(function (el) {
                if (!el.dataset.realText) el.dataset.realText = el.textContent;
                el.textContent = '••••••';
                el.classList.add('hidden-amount');
            });
            /* Üstü çizili göz ikonu */
            if (iconEl) {
                iconEl.innerHTML =
                    '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>' +
                    '<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>' +
                    '<path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>' +
                    '<line x1="1" y1="1" x2="23" y2="23"/>';
            }
        } else {
            /* Tutarları göster */
            els.forEach(function (el) {
                if (el.dataset.realText) el.textContent = el.dataset.realText;
                el.classList.remove('hidden-amount');
            });
            /* Normal göz ikonu */
            if (iconEl) {
                iconEl.innerHTML =
                    '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>' +
                    '<circle cx="12" cy="12" r="3"/>';
            }
        }

        /* LocalStorage'a kaydet */
        try { localStorage.setItem('finance_amounts_hidden', amountsHidden ? '1' : '0'); } catch (e) { }
    }

    /* Sayfa yüklendiğinde gizli durumu geri yükle */
    function restoreAmountVisibility() {
        try {
            if (localStorage.getItem('finance_amounts_hidden') === '1') {
                toggleAmountVisibility();
            }
        } catch (e) { }
    }

    /* init fonksiyonuna eklenmesi gereken çağrı */
    var originalInit = init;
    init = function () {
        originalInit();
        restoreAmountVisibility();
    };

    /* ---- İŞLEM DETAY GÖRÜNÜMÜ ---- */

    function openDetail(id) {
        var entries = getEntries();
        var entry = entries.find(function (e) { return e.id === id; });
        if (!entry) return;

        var date = formatDate(entry.date);
        var sign = entry.type === 'income' ? '+' : '-';
        var typeLabel = entry.type === 'income' ? 'Gelir' : 'Gider';
        var typeClass = entry.type === 'income' ? 'income' : 'expense';

        var html = '<div class="modal-overlay" onclick="Finance.closeDetail()">' +
            '<div class="modal-content diary-detail-modal finance-detail-modal" onclick="event.stopPropagation()">' +
            '<div class="diary-detail-header">' +
            '<div class="diary-detail-date">' + date + '</div>' +
            '<div class="diary-detail-actions-card">' +
            '<button class="diary-detail-edit-icon-btn" onclick="event.stopPropagation(); Finance.closeDetail(); Finance.openEditModal(' + id + ')" title="Düzenle">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">' +
            '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>' +
            '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>' +
            '</svg>' +
            '</button>' +
            '<button class="diary-detail-edit-icon-btn" onclick="event.stopPropagation(); Finance.closeDetail(); Finance.openShareModal(' + id + ')" title="Ekiple Paylaş">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">' +
            '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>' +
            '<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>' +
            '</svg>' +
            '</button>' +
            '<button class="diary-detail-delete-icon-btn" onclick="event.stopPropagation(); Finance.closeDetail(); Finance.confirmDelete(' + id + ')" title="Sil">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">' +
            '<polyline points="3 6 5 6 21 6"/>' +
            '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' +
            '</svg>' +
            '</button>' +
            '</div>' +
            '</div>' +
            '<div class="finance-detail-body">' +
            '<div class="finance-detail-row">' +
            '<span class="finance-detail-label">Tür</span>' +
            '<span class="finance-detail-value"><span class="finance-detail-type-badge ' + typeClass + '">' + typeLabel + '</span></span>' +
            '</div>' +
            '<div class="finance-detail-row">' +
            '<span class="finance-detail-label">Kategori</span>' +
            '<span class="finance-detail-value">' + escapeHtml(entry.category || '-') + '</span>' +
            '</div>' +
            '<div class="finance-detail-row">' +
            '<span class="finance-detail-label">Tutar</span>' +
            '<span class="finance-detail-value finance-amount ' + typeClass + '">' + sign + formatMoney(entry.amount) + ' TL</span>' +
            '</div>' +
            (entry.description ? '<div class="finance-detail-row">' +
                '<span class="finance-detail-label">Açıklama</span>' +
                '<span class="finance-detail-value">' + escapeHtml(entry.description) + '</span>' +
                '</div>' : '') +
            (entry.recurring ? '<div class="finance-detail-row">' +
                '<span class="finance-detail-label">Durum</span>' +
                '<span class="finance-detail-value"><span class="finance-detail-type-badge recurring">Tekrarlayan</span></span>' +
                '</div>' : '') +
            '</div>' +
            '</div></div>';

        var container = document.getElementById('finance-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'finance-modal-container';
            document.body.appendChild(container);
        }
        container.innerHTML = html;
    }

    function closeDetail() {
        var container = document.getElementById('finance-modal-container');
        if (container) container.innerHTML = '';
    }

    /* ---- HAREKETLERİM EKRANI ---- */

    var historyFilter = 'today';
    var historyCustomStart = null;
    var historyCustomEnd = null;

    /* Hareketlerim overlay'ini açma */
    function openHistory() {
        historyFilter = 'today';
        historyCustomStart = null;
        historyCustomEnd = null;
        var overlay = document.getElementById('finance-history-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            renderHistory();
        }
    }

    /* Hareketlerim overlay'ini kapatma */
    function closeHistory() {
        var overlay = document.getElementById('finance-history-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    /* Hareketlerim filtre değiştirme */
    function setHistoryFilter(filter) {
        historyFilter = filter;

        var buttons = document.querySelectorAll('.fh-filter-btn');
        buttons.forEach(function (btn) {
            btn.classList.remove('active');
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active');
            }
        });

        var customBox = document.getElementById('fh-custom-date');
        if (customBox) customBox.style.display = filter === 'pick' ? 'flex' : 'none';

        if (filter !== 'pick') {
            renderHistory();
        }
    }

    /* Özel tarih uygulama */
    function applyHistoryDate() {
        var startInput = document.getElementById('fh-date-start');
        var endInput = document.getElementById('fh-date-end');

        if (startInput && startInput.value) {
            historyCustomStart = new Date(startInput.value);
            historyCustomStart.setHours(0, 0, 0, 0);
        } else {
            historyCustomStart = null;
        }

        if (endInput && endInput.value) {
            historyCustomEnd = new Date(endInput.value);
            historyCustomEnd.setHours(23, 59, 59, 999);
        } else {
            historyCustomEnd = null;
        }

        renderHistory();
    }

    /* Hareketlerim tarih aralığını hesaplama */
    function getHistoryDateRange() {
        var now = new Date();
        var start, end;

        switch (historyFilter) {
            case 'today':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                break;
            case 'this-week':
                var day = now.getDay();
                var diff = day === 0 ? 6 : day - 1;
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
                end = new Date(start);
                end.setDate(end.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this-month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'this-year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            case 'pick':
                start = historyCustomStart;
                end = historyCustomEnd;
                break;
            default:
                start = null;
                end = null;
        }

        return { start: start, end: end };
    }

    /* Hareketlerim ekranını render etme */
    function renderHistory() {
        var allEntries = getEntries();
        var range = getHistoryDateRange();

        var filtered = allEntries;
        if (range.start || range.end) {
            filtered = allEntries.filter(function (entry) {
                var d = new Date(entry.date);
                if (range.start && d < range.start) return false;
                if (range.end && d > range.end) return false;
                return true;
            });
        }

        /* Toplam gelir, gider, bakiye hesapla */
        var totalIncome = 0;
        var totalExpense = 0;
        filtered.forEach(function (e) {
            if (e.type === 'income') totalIncome += e.amount;
            else totalExpense += e.amount;
        });
        var balance = totalIncome - totalExpense;

        /* Özet kartlarını güncelle */
        var incEl = document.getElementById('fh-total-income');
        var expEl = document.getElementById('fh-total-expense');
        var balEl = document.getElementById('fh-balance');
        if (incEl) incEl.textContent = '+' + formatMoney(totalIncome) + ' TL';
        if (expEl) expEl.textContent = '-' + formatMoney(totalExpense) + ' TL';
        if (balEl) {
            balEl.textContent = formatMoney(balance) + ' TL';
            balEl.className = 'fh-summary-amount ' + (balance >= 0 ? 'income' : 'expense');
        }

        /* İşlem listesini oluştur */
        var listEl = document.getElementById('fh-list-body');
        if (!listEl) return;

        if (filtered.length === 0) {
            listEl.innerHTML = '<div class="empty-state"><p>Bu dönemde kayıt yok.</p></div>';
            return;
        }

        var html = '';
        filtered = (typeof DragDrop !== 'undefined') ? DragDrop.applySavedOrder(filtered, 'personal-finance') : filtered;
        filtered.forEach(function (entry) {
            var sign = entry.type === 'income' ? '+' : '-';
            html += '<div class="finance-item fh-item" data-drag-id="' + entry.id + '" onclick="Finance.openHistoryDetail(' + entry.id + ')">' +
                '<span>' + escapeHtml(entry.description || entry.category) + '</span>' +
                '<span>' + escapeHtml(entry.category) + '</span>' +
                '<span class="finance-amount ' + entry.type + '">' + sign + formatMoney(entry.amount) + '</span>' +
                '<span class="text-secondary text-sm">' + formatDate(entry.date) + '</span>' +
                '</div>';
        });
        listEl.innerHTML = html;

        /* Drag & Drop init */
        if (typeof DragDrop !== 'undefined') {
            DragDrop.init(listEl, 'personal-finance');
        }
    }

    /* Salt-okunur detay modalı */
    function openHistoryDetail(id) {
        var entries = getEntries();
        var entry = entries.find(function (e) { return e.id === id; });
        if (!entry) return;

        var date = formatDate(entry.date);
        var sign = entry.type === 'income' ? '+' : '-';
        var typeLabel = entry.type === 'income' ? 'Gelir' : 'Gider';
        var typeClass = entry.type === 'income' ? 'income' : 'expense';

        var html = '<div class="modal-overlay" onclick="Finance.closeModal()">' +
            '<div class="modal-content diary-detail-modal finance-detail-modal" onclick="event.stopPropagation()">' +
            '<div class="diary-detail-header">' +
            '<div class="diary-detail-date">' + date + '</div>' +
            '<div class="diary-detail-actions-card">' +
            '<button class="diary-detail-edit-icon-btn" onclick="Finance.closeModal()" title="Kapat">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">' +
            '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
            '</svg>' +
            '</button>' +
            '</div>' +
            '</div>' +
            '<div class="finance-detail-body">' +
            '<div class="finance-detail-row">' +
            '<span class="finance-detail-label">Tür</span>' +
            '<span class="finance-detail-value"><span class="finance-detail-type-badge ' + typeClass + '">' + typeLabel + '</span></span>' +
            '</div>' +
            '<div class="finance-detail-row">' +
            '<span class="finance-detail-label">Kategori</span>' +
            '<span class="finance-detail-value">' + escapeHtml(entry.category || '-') + '</span>' +
            '</div>' +
            '<div class="finance-detail-row">' +
            '<span class="finance-detail-label">Tutar</span>' +
            '<span class="finance-detail-value finance-amount ' + typeClass + '">' + sign + formatMoney(entry.amount) + ' TL</span>' +
            '</div>' +
            (entry.description ? '<div class="finance-detail-row">' +
                '<span class="finance-detail-label">Açıklama</span>' +
                '<span class="finance-detail-value">' + escapeHtml(entry.description) + '</span>' +
                '</div>' : '') +
            '</div>' +
            '</div></div>';

        var container = document.getElementById('finance-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'finance-modal-container';
            document.body.appendChild(container);
        }
        container.innerHTML = html;
    }

    /* ---- YENİ KAYIT EKLEME MODALI (Header Butonu İçin) ---- */

    function openAddModal() {
        var MONTH_NAMES = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];
        var today = new Date();
        var todayStr = today.getFullYear() + '-' +
            String(today.getMonth() + 1).padStart(2, '0') + '-' +
            String(today.getDate()).padStart(2, '0');
        var todayDisplay = today.getDate() + ' ' + MONTH_NAMES[today.getMonth()] + ' ' + today.getFullYear();

        var html = '<div class="modal-overlay" onclick="Finance.closeModal()">' +
            '<div class="modal-content finance-edit-modal" onclick="event.stopPropagation()">' +
            '<button class="modal-close" onclick="Finance.closeModal()">&times;</button>' +
            '<h3 class="finance-edit-modal-title">Yeni Kayıt Oluştur</h3>' +
            '<form id="finance-add-form" onsubmit="Finance.saveAddModal(event)">' +
            '<div class="form-group">' +
            '<label>Tarih</label>' +
            '<input type="hidden" id="finance-add-date" value="' + todayStr + '">' +
            '<button type="button" class="finance-date-trigger" id="finance-add-date-btn" onclick="FinanceCalendarPicker.open(\'finance-add-date\',\'finance-add-date-label\')">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' +
            '</svg>' +
            '<span id="finance-add-date-label">' + todayDisplay + '</span>' +
            '</button>' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Tür</label>' +
            '<input type="hidden" id="finance-add-type" value="expense">' +
            '<div class="styled-select" id="finance-add-type-select">' +
            '<div class="styled-select-trigger" onclick="toggleStyledSelect(\'finance-add-type-select\')">' +
            '<span class="trigger-label" id="finance-add-type-label">Gider</span>' +
            '<svg class="trigger-chevron" width="14" height="14" viewBox="0 0 14 14">' +
            '<path fill="currentColor" d="M7 9.5L2.5 5 3.56 3.94 7 7.38 10.44 3.94 11.5z"/>' +
            '</svg>' +
            '</div>' +
            '<div class="styled-select-dropdown">' +
            '<div class="styled-select-option" data-value="income" onclick="selectStyledOption(\'finance-add-type-select\',\'income\',\'Gelir\')">' +
            '<span>Gelir</span>' +
            '</div>' +
            '<div class="styled-select-option active" data-value="expense" onclick="selectStyledOption(\'finance-add-type-select\',\'expense\',\'Gider\')">' +
            '<span>Gider</span>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Kategori</label>' +
            '<input type="text" id="finance-add-category" class="form-control" placeholder="Örn: Yemek, Kira, Maaş..." maxlength="60" required>' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Tutar (TL)</label>' +
            '<input type="number" id="finance-add-amount" class="form-control" step="0.01" min="0" placeholder="0.00" required ' +
            'inputmode="decimal" onkeypress="return (event.charCode >= 48 && event.charCode <= 57) || event.charCode === 46 || event.charCode === 44">' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Açıklama</label>' +
            '<input type="text" id="finance-add-desc" class="form-control" placeholder="İsteğe bağlı açıklama" maxlength="80">' +
            '</div>' +
            '<div class="finance-edit-actions">' +
            '<button type="button" class="btn" onclick="Finance.closeModal()">İptal</button>' +
            '<button type="submit" class="btn btn-primary">Kaydet</button>' +
            '</div>' +
            '</form>' +
            '</div></div>';

        var container = document.getElementById('finance-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'finance-modal-container';
            document.body.appendChild(container);
        }
        container.innerHTML = html;

        /* Kategoriye odaklan */
        setTimeout(function () {
            var catInput = document.getElementById('finance-add-category');
            if (catInput) catInput.focus();
        }, 100);
    }

    /* Yeni kayıt ekleme modalındaki değişiklikleri kaydetme */
    function saveAddModal(e) {
        e.preventDefault();

        var dateInput = document.getElementById('finance-add-date');
        var dateVal = dateInput ? dateInput.value : '';
        var type = document.getElementById('finance-add-type').value;
        var amount = parseFloat(document.getElementById('finance-add-amount').value);
        var category = document.getElementById('finance-add-category').value;
        var desc = document.getElementById('finance-add-desc').value.trim();

        if (!type || isNaN(amount) || amount <= 0) return;

        var entryDate;
        if (dateVal) {
            var now = new Date();
            var timePart = String(now.getHours()).padStart(2, '0') + ':' +
                String(now.getMinutes()).padStart(2, '0') + ':' +
                String(now.getSeconds()).padStart(2, '0');
            var parsed = new Date(dateVal + 'T' + timePart);
            entryDate = !isNaN(parsed.getTime()) ? parsed.toISOString() : new Date(dateVal).toISOString();
        } else {
            entryDate = new Date().toISOString();
        }

        var entries = getEntries();
        entries.unshift({
            id: Date.now(),
            type: type,
            amount: amount,
            category: category,
            description: desc,
            date: entryDate
        });

        entries.sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });

        saveEntries(entries);
        closeModal();
        render();
        if (typeof Toast !== 'undefined' && Toast.success) {
            Toast.success('Kayıt oluşturuldu!');
        }
    }

    /* Dışarıya açılan fonksiyonlar */
    return {
        init: init,
        render: render,
        getEntries: getEntries,
        saveEntries: saveEntries,
        deleteEntry: deleteEntry,
        confirmDelete: confirmDelete,
        closeModal: closeModal,
        editEntry: editEntry,
        showContextMenu: showContextMenu,
        closeContextMenu: closeContextMenu,
        saveEditModal: saveEditModal,
        setFilter: setFilter,
        applyCustomDate: applyCustomDate,
        openRepeatModal: openRepeatModal,
        selectRepeatFreq: selectRepeatFreq,
        saveRepeat: saveRepeat,
        removeRepeat: removeRepeat,
        openShareModal: openShareModal,
        selectShareTarget: toggleShareTeam,
        toggleShareTeam: toggleShareTeam,
        toggleShareDropdown: toggleShareDropdown,
        saveShare: saveShare,
        toggleAmountVisibility: toggleAmountVisibility,
        openDetail: openDetail,
        closeDetail: closeDetail,
        openEditModal: openEditModal,
        openAddModal: openAddModal,
        saveAddModal: saveAddModal,
        openHistory: openHistory,
        closeHistory: closeHistory,
        setHistoryFilter: setHistoryFilter,
        applyHistoryDate: applyHistoryDate,
        renderHistory: renderHistory,
        openHistoryDetail: openHistoryDetail
    };
})();
