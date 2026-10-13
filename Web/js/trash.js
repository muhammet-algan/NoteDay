/* ========================================
   ÇÖP KUTUSU (TRASH BIN) MODÜLÜ
   Silenen öğeleri 30 gün boyunca saklar.
   Geri yükleme ve kalıcı silme işlevlerini sağlar.
   ======================================== */
var Trash = (function () {
    'use strict';

    var STORAGE_KEY = 'trash_entries';
    var RETENTION_DAYS = 30;
    var _currentFilter = '';
    var _dateFilter = 'all';

    // Çöp kutusu verilerini al
    function getTrashItems() {
        return DB.getForUser(STORAGE_KEY) || [];
    }

    // Çöp kutusu verilerini kaydet
    function saveTrashItems(items) {
        DB.setForUser(STORAGE_KEY, items);
    }

    // Modül başlatma - Otomatik temizleme yapar
    function init() {
        autoCleanup();
    }

    // Öğeyi çöp kutusuna ekle
    function addToTrash(type, originalId, title, preview, data, silent) {
        var items = getTrashItems();
        items.unshift({
            id: 'trash_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: type, // 'diary' | 'note' | 'reminder' | 'finance' | 'board_item' | 'focus'
            originalId: originalId,
            deletedAt: new Date().toISOString(),
            title: title || 'Adsız Öğe',
            preview: preview || '',
            data: data
        });
        saveTrashItems(items);
        if (!silent && typeof Toast !== 'undefined' && Toast.show) {
            Toast.show('Öğe çöp kutusuna taşındı (30 gün saklanacak)', 'info');
        }
    }

    // 30 günden eski öğeleri otomatik sil
    function autoCleanup() {
        var items = getTrashItems();
        var now = Date.now();
        var msInDay = 24 * 60 * 60 * 1000;
        var filtered = items.filter(function (item) {
            var deletedTime = new Date(item.deletedAt).getTime();
            var diffDays = (now - deletedTime) / msInDay;
            return diffDays <= RETENTION_DAYS;
        });
        if (filtered.length !== items.length) {
            saveTrashItems(filtered);
        }
    }

    // Çöp kutusu görünümünü aç
    function openTrash() {
        _dateFilter = 'all';
        var buttons = document.querySelectorAll('#trash-date-filters .filter-btn');
        buttons.forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === 'all');
        });

        if (typeof Settings !== 'undefined' && Settings.closeUserMenu) {
            Settings.closeUserMenu();
        }
        if (typeof App !== 'undefined' && App.showSection) {
            App.showSection('trash');
        }
    }

    // Arama/filtreleme
    function filterItems(query) {
        _currentFilter = (query || '').toLowerCase().trim();
        render();
    }

    // Çöp kutusu arayüzünü çiz
    function render() {
        var grid = document.getElementById('trash-grid');
        if (!grid) return;

        // Her açılışta süresi geçmişleri de temizle
        autoCleanup();

        var items = getTrashItems();

        // Öğe sayısını güncelle
        var countEl = document.getElementById('trash-item-count');
        if (countEl) {
            countEl.textContent = items.length > 0 ? items.length + ' öğe' : '';
        }

        // Filtreleme uygula
        var filteredItems = items;
        if (_currentFilter) {
            filteredItems = filteredItems.filter(function (item) {
                var title = (item.title || '').toLowerCase();
                var preview = (item.preview || '').toLowerCase();
                var typeLabel = (getTypeLabel(item.type) || '').toLowerCase();
                return title.indexOf(_currentFilter) !== -1 ||
                       preview.indexOf(_currentFilter) !== -1 ||
                       typeLabel.indexOf(_currentFilter) !== -1;
            });
        }

        // Tarih filtrelemesi uygula
        if (_dateFilter !== 'all') {
            var range = getDateRange(_dateFilter);
            if (range.start || range.end) {
                filteredItems = filteredItems.filter(function (item) {
                    var d = new Date(item.deletedAt);
                    if (range.start && d < range.start) return false;
                    if (range.end && d > range.end) return false;
                    return true;
                });
            }
        }

        if (items.length === 0) {
            grid.innerHTML =
                '<div class="trash-empty">' +
                '<div class="trash-empty-icon">' +
                '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
                '<polyline points="3 6 5 6 21 6"></polyline>' +
                '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
                '</svg>' +
                '</div>' +
                '<p>Çöp kutusu boş</p>' +
                '<span>Sildiğiniz öğeler burada görünecektir</span>' +
                '</div>';
            return;
        }

        if (filteredItems.length === 0) {
            grid.innerHTML =
                '<div class="trash-empty">' +
                '<div class="trash-empty-icon">' +
                '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
                '<circle cx="11" cy="11" r="8"></circle>' +
                '<line x1="21" y1="21" x2="16.65" y2="16.65"></line>' +
                '</svg>' +
                '</div>' +
                '<p>Sonuç bulunamadı</p>' +
                '<span>Farklı bir arama terimi deneyin</span>' +
                '</div>';
            return;
        }

        var html = '';
        var now = Date.now();
        var msInDay = 24 * 60 * 60 * 1000;

        filteredItems.forEach(function (item, index) {
            var deletedTime = new Date(item.deletedAt).getTime();
            var diffDays = Math.floor((now - deletedTime) / msInDay);
            var remainingDays = Math.max(0, RETENTION_DAYS - diffDays);

            var typeLabel = getTypeLabel(item.type);

            var dateStr = new Date(item.deletedAt).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short'
            });

            var daysClass = remainingDays <= 5 ? 'trash-row-days urgent' : 'trash-row-days';

            html +=
                '<div class="trash-row" id="tcard_' + item.id + '" style="animation-delay: ' + (index * 0.03) + 's" onclick="Trash.viewDetail(\'' + item.id + '\', event)">' +
                    // Tür İkonu
                    '<div class="trash-row-icon ' + item.type + '">' +
                        getTypeIcon(item.type) +
                    '</div>' +
                    // Bilgi
                    '<div class="trash-row-info">' +
                        '<span class="trash-row-title">' + escapeHtml(item.title) + '</span>' +
                        '<div class="trash-row-meta">' +
                            '<span class="trash-row-type-badge">' + typeLabel + '</span>' +
                            '<span class="trash-row-meta-divider"></span>' +
                            '<span>' + dateStr + '</span>' +
                        '</div>' +
                    '</div>' +
                    // Kalan Gün & Bilgi İkonu
                    '<div class="trash-row-days-group" style="display: flex; align-items: center; gap: 6px; margin-right: 80px; flex-shrink: 0;" onclick="event.stopPropagation();">' +
                        '<span class="' + daysClass + '">' + remainingDays + ' gün</span>' +
                        '<span class="trash-info-icon" title="Bu öğe 30 gün sonra otomatik olarak silinecektir." style="cursor: pointer; color: var(--color-text-tertiary, #94a3b8); display: inline-flex; align-items: center;">' +
                            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>' +
                        '</span>' +
                    '</div>' +
                    // Aksiyon Butonları
                    '<div class="trash-row-actions">' +
                        '<button class="trash-action-btn restore-btn" title="Geri Yükle" onclick="event.stopPropagation(); Trash.restoreItem(\'' + item.id + '\')">' +
                            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/></svg>' +
                        '</button>' +
                        '<button class="trash-action-btn delete-btn" title="Kalıcı Sil" onclick="event.stopPropagation(); Trash.deletePermanently(\'' + item.id + '\')">' +
                            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>' +
                        '</button>' +
                    '</div>' +
                '</div>';
        });

        grid.innerHTML = html;
    }

    function getTypeLabel(type) {
        var labels = {
            note: 'Not',
            reminder: 'Hatırlatıcı',
            finance: 'Finans',
            board_item: 'Görev',
            'new-table': 'Tablo',
            aliskanlik: 'Alışkanlık',
            sub_section: 'Alt Bölüm',
            sidebar_section: 'Menü Bölümü',
            team: 'Ekip'
        };
        return labels[type] || type;
    }

    function getTypeIcon(type) {
        switch (type) {
            case 'team':
                return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>';
            case 'note':
                return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" /><path d="M14 3v4a2 2 0 0 0 2 2h4" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></svg>';
            case 'reminder':
                return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>';
            case 'finance':
                return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>';
            case 'board_item':
                return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>';
            case 'new-table':
                return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>';
            case 'aliskanlik':
                return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
            case 'sub_section':
                return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" /><path d="M14 3v4a2 2 0 0 0 2 2h4" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></svg>';
            case 'sidebar_section':
                return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>';
            default:
                return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /></svg>';
        }
    }

    // Öğeyi çöp kutusundan geri yükle
    function restoreItem(id) {
        var items = getTrashItems();
        var item = items.find(function (i) { return i.id === id; });
        if (!item) return;

        var restored = false;

        try {
            switch (item.type) {
                case 'note':
                    if (typeof Notes !== 'undefined' && Notes.getNotes && Notes.saveNotes) {
                        var notes = Notes.getNotes();
                        notes.unshift(item.data);
                        Notes.saveNotes(notes);
                        restored = true;
                    }
                    break;
                case 'reminder':
                    if (typeof Reminders !== 'undefined' && Reminders.getReminders && Reminders.saveReminders) {
                        var reminders = Reminders.getReminders();
                        reminders.unshift(item.data);
                        Reminders.saveReminders(reminders);
                        restored = true;
                    }
                    break;
                case 'finance':
                    if (typeof Finance !== 'undefined' && Finance.getEntries && Finance.saveEntries) {
                        var financeEntries = Finance.getEntries();
                        financeEntries.unshift(item.data);
                        Finance.saveEntries(financeEntries);
                        restored = true;
                    }
                    break;
                case 'board_item':
                    if (typeof Board !== 'undefined' && Board.getColumns && Board.save) {
                        var columns = Board.getColumns();
                        var targetCol = columns.find(function (c) { return c.id === item.data.colId; });
                        if (targetCol) {
                            targetCol.items.push(item.data.item);
                            Board.save();
                            restored = true;
                        } else if (columns.length > 0) {
                            columns[0].items.push(item.data.item);
                            Board.save();
                            restored = true;
                        }
                    }
                    break;
                case 'team':
                case 'new-table':
                case 'aliskanlik':
                case 'sub_section':
                case 'sidebar_section':
                    if (typeof App !== 'undefined' && App.restoreNavItem) {
                        App.restoreNavItem(item.originalId, item.type, item.title, item.data);
                        restored = true;
                    }
                    break;

            }
        } catch (err) {
            console.error('Restore item error:', err);
        }

        if (restored) {
            // Çöp kutusundan çıkar
            items = items.filter(function (i) { return i.id !== id; });
            saveTrashItems(items);
            render();

            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show('Öğe başarıyla geri yüklendi', 'success');
            }
        } else {
            alert('Öğe geri yüklenemedi. İlgili modül yüklenmemiş olabilir.');
        }
    }

    // Öğeyi kalıcı olarak sil
    function deletePermanently(id) {
        if (!confirm('Bu öğeyi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;

        var items = getTrashItems();
        items = items.filter(function (i) { return i.id !== id; });
        saveTrashItems(items);
        render();

        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show('Öğe kalıcı olarak silindi', 'success');
        }
    }

    // Çöp kutusunu boşalt
    function clearTrash() {
        var items = getTrashItems();
        if (items.length === 0) return;
        if (!confirm('Tüm çöp kutusunu boşaltmak istediğinize emin misiniz? İçindeki tüm öğeler kalıcı olarak silinecektir.')) return;

        saveTrashItems([]);
        render();

        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show('Çöp kutusu boşaltıldı', 'success');
        }
    }

    function getDateRange(filter) {
        var now = new Date();
        var start, end;

        switch (filter) {
            case 'today':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                break;
            case 'week':
                var day = now.getDay();
                var diff = day === 0 ? 6 : day - 1; // get Monday
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
                end = new Date(start);
                end.setDate(end.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            default:
                start = null;
                end = null;
        }

        return { start: start, end: end };
    }

    function setDateFilter(filter) {
        _dateFilter = filter;

        // Butonların active durumunu güncelle
        var buttons = document.querySelectorAll('#trash-date-filters .filter-btn');
        buttons.forEach(function (btn) {
            btn.classList.remove('active');
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active');
            }
        });

        render();
    }

    function viewDetail(id, event) {
        if (event) {
            event.stopPropagation();
        }

        var items = getTrashItems();
        var item = items.find(function (i) { return i.id === id; });
        if (!item) return;

        var dateStr = new Date(item.deletedAt).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        var sectionNames = {
            note: 'Notlarım',
            reminder: 'Hatırlatıcılarım',
            finance: 'Finanslarım',
            board_item: 'Panom',
            'new-table': 'Tablo',
            aliskanlik: 'Alışkanlık',
            sub_section: 'Alt Bölüm',
            sidebar_section: 'Menü Bölümü',
            team: 'Ekip'
        };
        var sectionName = sectionNames[item.type] || item.type;
        
        var sectionRowHtml = '<div class="finance-detail-row" style="display: flex; justify-content: space-between; align-items: center;">' +
            '<span class="finance-detail-label" style="color: var(--color-text-secondary); font-weight: 500; font-size: 14px;">Bölüm</span>' +
            '<span class="finance-detail-value" style="font-weight: 600; font-size: 14px; color: var(--color-text);">' + escapeHtml(sectionName) + '</span>' +
        '</div>';
        
        var sectionWrapperHtml = '<div class="trash-detail-section-row-wrapper" style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border-subtle, #f1f5f9);">' +
            sectionRowHtml +
        '</div>';

        var detailsHtml = '';

        try {
            var data = item.data;
            if (item.type === 'note') {
                detailsHtml += '<div class="diary-detail-text-wrapper"><div class="diary-detail-text">' + escapeHtml(data.description || '') + '</div></div>';
                detailsHtml += sectionWrapperHtml;
            } else if (item.type === 'reminder') {
                detailsHtml += '<div class="finance-detail-body" style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px;">' +
                    '<div class="finance-detail-row" style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-border-subtle, #f1f5f9); padding-bottom: 8px;">' +
                        '<span class="finance-detail-label" style="color: var(--color-text-secondary); font-weight: 500;">Tarih/Saat</span>' +
                        '<span class="finance-detail-value" style="font-weight: 600;">' + escapeHtml(data.customDate || data.time || '-') + '</span>' +
                    '</div>' +
                    (data.notes ? 
                    '<div class="finance-detail-row" style="display: flex; flex-direction: column; gap: 6px; border-bottom: 1px solid var(--color-border-subtle, #f1f5f9); padding-bottom: 8px;">' +
                        '<span class="finance-detail-label" style="color: var(--color-text-secondary); font-weight: 500;">Notlar</span>' +
                        '<span class="finance-detail-value" style="background: var(--color-bg-inset, #f1f5f9); padding: 10px; border-radius: 8px; font-size: 13px;">' + escapeHtml(data.notes) + '</span>' +
                    '</div>' : '') +
                    sectionRowHtml +
                '</div>';
            } else if (item.type === 'finance') {
                var sign = data.type === 'income' ? '+' : '-';
                var typeClass = data.type === 'income' ? 'income' : 'expense';
                var typeName = data.type === 'income' ? 'Gelir' : 'Gider';
                detailsHtml += '<div class="finance-detail-body" style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px;">' +
                    '<div class="finance-detail-row" style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-border-subtle, #f1f5f9); padding-bottom: 8px;">' +
                        '<span class="finance-detail-label" style="color: var(--color-text-secondary); font-weight: 500;">İşlem Türü</span>' +
                        '<span class="finance-detail-value"><span class="finance-detail-type-badge ' + typeClass + '">' + typeName + '</span></span>' +
                    '</div>' +
                    '<div class="finance-detail-row" style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-border-subtle, #f1f5f9); padding-bottom: 8px;">' +
                        '<span class="finance-detail-label" style="color: var(--color-text-secondary); font-weight: 500;">Kategori</span>' +
                        '<span class="finance-detail-value" style="font-weight: 600;">' + escapeHtml(data.category || '-') + '</span>' +
                    '</div>' +
                    '<div class="finance-detail-row" style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-border-subtle, #f1f5f9); padding-bottom: 8px;">' +
                        '<span class="finance-detail-label" style="color: var(--color-text-secondary); font-weight: 500;">Tutar</span>' +
                        '<span class="finance-detail-value finance-amount ' + typeClass + '" style="font-weight: 700;">' + sign + data.amount + ' TL</span>' +
                    '</div>' +
                    (data.description ? 
                    '<div class="finance-detail-row" style="display: flex; flex-direction: column; gap: 6px; border-bottom: 1px solid var(--color-border-subtle, #f1f5f9); padding-bottom: 8px;">' +
                        '<span class="finance-detail-label" style="color: var(--color-text-secondary); font-weight: 500;">Açıklama</span>' +
                        '<span class="finance-detail-value" style="background: var(--color-bg-inset, #f1f5f9); padding: 10px; border-radius: 8px; font-size: 13px;">' + escapeHtml(data.description) + '</span>' +
                    '</div>' : '') +
                    sectionRowHtml +
                '</div>';
            } else if (item.type === 'board_item') {
                var card = data.item || {};
                detailsHtml += '<div class="finance-detail-body" style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px;">' +
                    (card.description ? 
                    '<div class="finance-detail-row" style="display: flex; flex-direction: column; gap: 6px; border-bottom: 1px solid var(--color-border-subtle, #f1f5f9); padding-bottom: 8px;">' +
                        '<span class="finance-detail-label" style="color: var(--color-text-secondary); font-weight: 500;">Görev Açıklaması</span>' +
                        '<span class="finance-detail-value" style="background: var(--color-bg-inset, #f1f5f9); padding: 10px; border-radius: 8px; font-size: 13px;">' + escapeHtml(card.description) + '</span>' +
                    '</div>' : '<p style="color: var(--color-text-secondary); font-style: italic; border-bottom: 1px solid var(--color-border-subtle, #f1f5f9); padding-bottom: 8px; margin: 0;">Açıklama bulunmuyor.</p>') +
                    sectionRowHtml +
                '</div>';

            } else if (item.type === 'new-table') {
                detailsHtml += '<div class="finance-detail-body" style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px;">' +
                    '<p style="color: var(--color-text-secondary); font-size: 13px; line-height: 1.5; margin: 0;">Bu bir özel tablo sayfasıdır. Geri yüklediğinizde tablonuz tüm verileriyle birlikte kenar çubuğuna eklenecektir.</p>' +
                    sectionRowHtml +
                '</div>';
            } else if (item.type === 'team') {
                detailsHtml += '<div class="finance-detail-body" style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px;">' +
                    '<p style="color: var(--color-text-secondary); font-size: 13px; line-height: 1.5; margin: 0;">Bu bir ekip sayfasıdır. Geri yüklediğinizde ekibiniz tüm not verileriyle birlikte kenar çubuğuna eklenecektir.</p>' +
                    sectionRowHtml +
                '</div>';
            } else if (item.type === 'aliskanlik') {
                detailsHtml += '<div class="finance-detail-body" style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px;">' +
                    '<p style="color: var(--color-text-secondary); font-size: 13px; line-height: 1.5; margin: 0;">Bu bir alışkanlık takip sayfasıdır. Geri yüklediğinizde alışkanlığınız tüm verileriyle birlikte kenar çubuğuna eklenecektir.</p>' +
                    sectionRowHtml +
                '</div>';
            } else if (item.type === 'sub_section') {
                detailsHtml += '<div class="finance-detail-body" style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px;">' +
                    '<p style="color: var(--color-text-secondary); font-size: 13px; line-height: 1.5; margin: 0;">Bu bir alt bölümdür. Geri yüklediğinizde tüm not, finans ve pano verileriyle birlikte ana bölümün altına eklenecektir.</p>' +
                    sectionRowHtml +
                '</div>';
            } else if (item.type === 'sidebar_section') {
                detailsHtml += '<div class="finance-detail-body" style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px;">' +
                    '<p style="color: var(--color-text-secondary); font-size: 13px; line-height: 1.5; margin: 0;">Bu varsayılan bir menü bölümüdür. Geri yüklediğinizde tekrar kenar çubuğunda görünür hale gelecektir.</p>' +
                    sectionRowHtml +
                '</div>';
            }
        } catch (err) {
            console.error('Error extracting details:', err);
            detailsHtml += '<p style="color: var(--color-text-secondary); font-style: italic;">Detaylar yüklenemedi.</p>';
        }

        var html = '<div class="modal-overlay" onclick="Trash.closeDetail()" style="display: flex; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.4); z-index: 1000; animation: fadeIn 0.2s ease;">' +
            '<div class="modal-content diary-detail-modal" onclick="event.stopPropagation()">' +
                '<div class="diary-detail-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">' +
                    '<div class="diary-detail-header-left" style="display: flex; align-items: center; gap: 10px;">' +
                        '<div class="diary-detail-date">' + dateStr + '</div>' +
                    '</div>' +
                    '<div class="diary-detail-actions-card">' +
                        '<button class="diary-detail-edit-icon-btn" onclick="Trash.closeDetail()" title="Kapat" style="background: var(--color-bg-inset, #f1f5f9); border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); transition: all 0.2s;">' +
                            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '<h2 class="diary-detail-title" style="font-size: 24px; font-weight: 700; color: var(--color-text); margin: 0 0 16px 0;">' + escapeHtml(item.title) + '</h2>' +
                detailsHtml +
            '</div>' +
        '</div>';

        var container = document.getElementById('trash-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'trash-modal-container';
            document.body.appendChild(container);
        }
        container.innerHTML = html;
    }

    function closeDetail() {
        var container = document.getElementById('trash-modal-container');
        if (container) container.innerHTML = '';
    }

    function openPhotoFull(src) {
        var html = '<div class="modal-overlay diary-photo-fullscreen" onclick="this.remove()" style="display: flex; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); z-index: 1010;">' +
            '<img src="' + src + '" alt="Tam Boyut" onclick="event.stopPropagation()" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 8px;">' +
            '<button class="modal-close" onclick="this.parentElement.remove()" style="color:#fff; position: absolute; top: 20px; right: 20px; font-size: 32px; background: none; border: none; cursor: pointer;">×</button>' +
            '</div>';
        var div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div.firstChild);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    return {
        init: init,
        render: render,
        addToTrash: addToTrash,
        openTrash: openTrash,
        restoreItem: restoreItem,
        deletePermanently: deletePermanently,
        clearTrash: clearTrash,
        filterItems: filterItems,
        setDateFilter: setDateFilter,
        viewDetail: viewDetail,
        closeDetail: closeDetail,
        openPhotoFull: openPhotoFull
    };
})();
