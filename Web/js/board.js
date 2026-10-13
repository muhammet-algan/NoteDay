/* ========================================
   PANOM (BOARD) MODÜLÜ
   ======================================== */
var Board = (function () {
    'use strict';

    var STORAGE_KEY = 'board_columns';
    var STORAGE_KEY_SECTIONS = 'board_sections';
    var _columns = [];
    var _sections = [];
    var _dragState = null;
    var _colDragState = null;
    var _autoScrollId = null;
    var _addModalColId = null;
    var _sectionDragState = null;

    function userKey() {
        var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
        var subSuffix = '';
        if (typeof App !== 'undefined' && App.activeSubSection && App.activeSubSection['board']) {
            subSuffix = '_' + App.activeSubSection['board'];
        }
        return STORAGE_KEY + subSuffix + (user ? '_' + user.email : '');
    }

    var _firstLoad = true;

    function load() {
        try {
            var raw = localStorage.getItem(userKey());
            _columns = raw ? JSON.parse(raw) : null;
        } catch (e) { _columns = null; }
        if (_columns === null && _firstLoad) { _columns = getDefaults(); save(); }
        if (!_columns) _columns = [];
        try {
            var rawS = localStorage.getItem(userKey() + '_sec');
            _sections = rawS ? JSON.parse(rawS) : [];
        } catch (e) { _sections = []; }
        _firstLoad = false;
    }

    function save() {
        try { localStorage.setItem(userKey(), JSON.stringify(_columns)); } catch (e) { }
    }

    function saveSections() {
        try { localStorage.setItem(userKey() + '_sec', JSON.stringify(_sections)); } catch (e) { }
    }

    function getDefaults() {
        return [
            { id: genId(), name: 'Yapılacaklar', type: 'todo', pixelWidth: 340, color: '#3b82f6', items: [] },
            { id: genId(), name: 'Hedefler', type: 'goals', pixelWidth: 340, color: '#8b5cf6', items: [] },
            { id: genId(), name: 'Tamamlananlar', type: 'completed', pixelWidth: 340, color: '#10b981', items: [] }
        ];
    }

    var TYPE_ICONS = {
        'custom': 'custom-list', 'todo': 'check-square', 'shopping': 'shopping-cart', 'tasks': 'clipboard',
        'goals': 'target', 'notes': 'file-text', 'reminders': 'bell',
        'finance': 'dollar', 'completed': 'check-square'
    };

    var ADD_LABELS = {
        'goals': 'Yeni Hedef',
        'todo': 'Yeni Görev',
        'shopping': 'Yeni Ürün',
        'tasks': 'Yeni Görev',
        'notes': 'Yeni Not',
        'reminders': 'Yeni Hatırlatıcı',
        'finance': 'Yeni İşlem',
        'custom': 'Yeni Ekle'
    };

    function genId() { return 'b_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

    var TEMPLATES = [
        { key: 'custom', label: 'Özel Pano', type: 'custom' },
        { key: 'todo', label: 'Yapılacaklar Listesi', type: 'todo' },
        { key: 'shopping', label: 'Alışveriş Listesi', type: 'shopping' },
        { key: 'tasks', label: 'Görevlerim', type: 'tasks' },
        { key: 'goals', label: 'Hedeflerim', type: 'goals' },
        { key: 'notes', label: 'Notlarım', type: 'notes' },
        { key: 'reminders', label: 'Hatırlatıcılarım', type: 'reminders' },
        { key: 'finance', label: 'Finanslarım', type: 'finance' }
    ];

    function ico(name, sz) {
        sz = sz || 16;
        var a = 'width="' + sz + '" height="' + sz + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
        var m = {
            'layers': '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
            'list': '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
            'check-square': '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
            'shopping-cart': '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
            'clipboard': '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
            'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
            'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
            'briefcase': '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
            'book': '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M4 15h16"/>',
            'bell': '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
            'dollar': '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
            'plus': '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
            'trash': '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
            'edit': '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
            'more': '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
            'grip': '<circle cx="9" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="19" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="19" r="1" fill="currentColor" stroke="none"/>',
            'x': '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
            'move': '<polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>',
            'section': '<rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="10" rx="1"/><rect x="14" y="17" width="7" height="4" rx="1"/>',
            'custom-list': '<path d="M12 2l1.8 3.6L18 6.5l-3 2.9.7 4.1L12 11.5l-3.7 1.9.7-4.1-3-2.9 4.2-.9L12 2z"/><path d="M5 20h14"/><path d="M8 17l1 3"/><path d="M16 17l-1 3"/>',
            'share': '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
            'arrow-left': '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
            'trending-up': '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'
        };
        return '<svg ' + a + '>' + (m[name] || '') + '</svg>';
    }

    var COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#14b8a6', '#64748b'];
    function colColor(i) { return COLORS[i % COLORS.length]; }

    function init() { load(); }

    function render() {
        var c = document.getElementById('board-columns');
        if (!c) return;
        load();
        // Collect columns already in sections
        var usedColIds = [];
        _sections.forEach(function (s) { usedColIds = usedColIds.concat(s.columnIds || []); });
        var h = '';
        // Render sections first (they appear at the left)
        _sections.forEach(function (sec, i) { h += renderSection(sec, i); });
        // Render regular columns NOT in any section
        _columns.forEach(function (col, i) {
            if (usedColIds.indexOf(col.id) === -1) h += renderCol(col, i);
        });
        c.innerHTML = h;
        setupDragAndDrop();
        setupResize();
        setupColumnDrag();
        setupSectionColDrag();
        setupClickRename();
        setupSectionDrag();
        setupSectionResize();
        setupSectionDropZone();
    }

    function renderCol(col, idx) {
        var color = col.color || colColor(idx);
        var w = col.pixelWidth || 340;
        var cnt = col.items ? col.items.length : 0;
        var done = col.items ? col.items.filter(function (i) { return i.completed; }).length : 0;
        var hdrBg = hexToRgba(color, 0.07);
        var typeIcon = TYPE_ICONS[col.type] || 'list';

        var h = '<div class="board-col" data-col-id="' + col.id + '" data-col-idx="' + idx + '" style="width:' + w + 'px">';

        h += '<div class="board-col-header" style="background:' + hdrBg + ';border-bottom:2px solid ' + color + ';cursor:grab">';
        h += '<div class="board-col-header-left">';
        h += '<span class="board-col-type-icon" style="color:' + color + '">' + ico(typeIcon, 16) + '</span>';
        h += '<span class="board-col-name" id="col-name-' + col.id + '" data-col-id="' + col.id + '" title="Düzenlemek için tıklayın">' + esc(col.name) + '</span>';
        h += '<span class="board-col-count">' + cnt + '</span>';
        h += '</div>';
        h += '<div class="board-col-header-right">';
        h += '<button class="board-col-menu-btn" onclick="event.stopPropagation();Board.toggleColMenu(\'' + col.id + '\')" title="Menü">' + ico('more', 16) + '</button>';
        h += '</div>';
        h += '<div class="board-col-menu" id="col-menu-' + col.id + '">';
        h += '<button onclick="Board.startRename(\'' + col.id + '\')">' + ico('edit', 14) + ' Yeniden Adlandır</button>';
        h += '<div class="board-col-menu-divider"></div>';
        h += '<button class="board-col-menu-danger" onclick="Board.deleteColumn(\'' + col.id + '\')">' + ico('trash', 14) + ' Sil</button>';
        h += '</div>';
        h += '</div>';

        // Goals progress (removed — now shown per-item)

        // Items
        h += '<div class="board-col-items" data-col-id="' + col.id + '">';
        if (col.items && col.items.length) {
            col.items.forEach(function (item) { h += renderItem(col, item, color); });
        } else {
            h += '<div class="board-col-empty">' + ico('list', 20) + '<span>Henüz öğe yok</span></div>';
        }
        h += '</div>';

        // Add button
        var addLabel = ADD_LABELS[col.type] || 'Yeni Ekle';
        h += '<button class="board-col-add" onclick="Board.openAddModal(\'' + col.id + '\')">'
        h += ico('plus', 15) + ' <span>' + addLabel + '</span>';
        h += '</button>';

        // Resize handle
        h += '<div class="board-col-resize" data-col-id="' + col.id + '"></div>';

        h += '</div>';
        return h;
    }

    function renderItem(col, item, color) {
        var ck = item.completed ? ' checked' : '';
        var dc = item.completed ? ' board-item-done' : '';
        var h = '<div class="board-item' + dc + '" data-item-id="' + item.id + '" data-col-id="' + col.id + '" draggable="true" onclick="Board.openItemDetail(\'' + col.id + '\',\'' + item.id + '\')">';
        h += '<label class="board-item-check"><input type="checkbox"' + ck + ' onchange="Board.toggleItem(\'' + col.id + '\',\'' + item.id + '\')"><span class="board-item-checkmark" style="--check-color:' + color + '"></span></label>';
        h += '<div class="board-item-content">';
        
        // Title is always shown
        h += '<span class="board-item-title">' + esc(item.title) + '</span>';

        // For specific types, show minimal extra info
        if ((col.type === 'goals' || item.hasGoal) && item.goalAmount) {
            var amt = item.goalAmount || 0;
            var unt = item.goalUnit || '';
            var prog = item.progress || 0;
            var pctItem = amt ? Math.min(100, Math.round((prog / amt) * 100)) : 0;
            h += '<div class="board-item-meta-row">';
            h += '<span class="board-item-meta" style="color:' + color + '; font-weight:600; font-size:11px">' + prog + '/' + amt + (unt ? ' ' + unt : '') + '</span>';
            h += '<span class="board-item-meta-pct">' + pctItem + '% tamamlandı</span>';
            h += '</div>';
        } else if (col.type === 'finance' && item.amount) {
            var ac = item.finType === 'expense' ? 'expense' : 'income';
            var pf = item.finType === 'expense' ? '-' : '+';
            h += '<span class="board-item-amount ' + ac + '">' + pf + fmtMoney(item.amount) + '</span>';
        } else if (col.type === 'reminders' && item.date) {
            h += '<span class="board-item-meta">' + ico('bell', 10) + ' ' + esc(item.date) + ' ' + esc(item.time || '') + '</span>';
        } else if (item.isCustom) {
            if (item.hasGoal && item.goalAmount) {
                var cAmt = item.goalAmount || 0;
                var cUnt = item.goalUnit || '';
                var cProg = item.progress || 0;
                var cPct = cAmt ? Math.min(100, Math.round((cProg / cAmt) * 100)) : 0;
                h += '<div class="board-item-meta-row">';
                h += '<span class="board-item-meta" style="color:' + color + '; font-weight:600; font-size:11px">' + cProg + '/' + cAmt + (cUnt ? ' ' + cUnt : '') + '</span>';
                h += '<span class="board-item-meta-pct">' + cPct + '% tamamlandı</span>';
                h += '</div>';
            } else {
                if (item.hasGoal) h += '<span class="board-item-meta">' + ico('target', 10) + ' Hedef</span>';
            }
            if (item.hasRem) h += '<span class="board-item-meta">' + ico('bell', 10) + ' Hatırlatıcı</span>';
        }
        
        h += '</div>';
        // 3-dot context menu (replaces X delete button)
        var hasGoalMenu = (col.type === 'goals' || item.hasGoal) && item.goalAmount;
        h += '<div class="board-item-actions">';
        h += '<button class="board-item-more-btn" onclick="event.stopPropagation();Board.toggleItemMenu(\'' + col.id + '\',\'' + item.id + '\')" title="Menü">' + ico('more', 16) + '</button>';
        h += '<div class="board-item-menu" id="item-menu-' + col.id + '-' + item.id + '">';
        h += '<button onclick="event.stopPropagation();Board.toggleItem(\'' + col.id + '\',\'' + item.id + '\')">' + ico('check-square', 14) + ' Tamamlandı</button>';
        h += '<button onclick="event.stopPropagation();Board.openEditItemModal(\'' + col.id + '\',\'' + item.id + '\')">' + ico('edit', 14) + ' Düzenle</button>';
        h += '<button onclick="event.stopPropagation();Board.openShareModal(\'' + col.id + '\',\'' + item.id + '\')">' + ico('share', 14) + ' Paylaş</button>';
        if (hasGoalMenu) {
            h += '<button onclick="event.stopPropagation();Board.openProgressUpdateModal(\'' + col.id + '\',\'' + item.id + '\')">' + ico('trending-up', 14) + ' İlerleme Güncelle</button>';
        }
        h += '<div class="board-item-menu-divider"></div>';
        h += '<button class="board-item-menu-danger" onclick="event.stopPropagation();Board.deleteItem(\'' + col.id + '\',\'' + item.id + '\')">' + ico('trash', 14) + ' Sil</button>';
        h += '</div>';
        h += '</div></div>';
        return h;
    }

    /* ===== Add Item Modal ===== */
    function openAddModal(colId) {
        _addModalColId = colId;
        var col = _columns.find(function (c) { return c.id === colId; });
        if (!col) {
            // Fallback: reload from storage in case memory is stale
            load();
            col = _columns.find(function (c) { return c.id === colId; });
        }
        if (!col) {
            console.error('Board: Column not found for openAddModal', colId);
            return;
        }

        var type = col.type;
        var modalType = type;
        if (type === 'todo') modalType = 'tasks';
        if (type === 'completed') modalType = 'tasks';

        var overlayId = 'board-add-' + modalType + '-modal';
        var overlay = document.getElementById(overlayId);

        if (!overlay) {
            overlay = document.getElementById('board-add-custom-modal');
            modalType = 'custom';
        }

        if (!overlay) {
            console.error('Board: Critical - Even fallback modal not found!');
            return;
        }

        // Null-safe field reset
        function val(id, v) { var el = document.getElementById(id); if (el) el.value = v || ''; }
        function chk(id, v) { var el = document.getElementById(id); if (el) el.checked = !!v; }
        function txt(id, v) { var el = document.getElementById(id); if (el) el.textContent = v || ''; }
        function dsp(id, v) { var el = document.getElementById(id); if (el) el.style.display = v || 'none'; }

        if (modalType === 'tasks') {
            val('board-task-title'); val('board-task-desc'); val('board-task-due');
            var dtl = document.getElementById('board-task-due-label'); if (dtl) { var sp = dtl.querySelector('span'); if (sp) sp.textContent = 'Tarih seçin'; }
        } else if (modalType === 'goals') {
            val('board-goal-title'); val('board-goal-amount'); val('board-goal-unit');
        } else if (modalType === 'shopping') {
            val('board-shopping-title'); val('board-shopping-note');
        } else if (modalType === 'notes') {
            val('board-notes-title'); val('board-notes-content');
            txt('board-notes-modal-title', 'Yeni Not');
        } else if (modalType === 'finance') {
            val('board-finance-type', 'expense'); val('board-finance-amount'); val('board-finance-title');
        } else if (modalType === 'reminders') {
            val('board-reminders-title'); val('board-reminders-date'); val('board-reminders-time', '09:00');
            var rdl = document.getElementById('board-reminders-date-label'); if (rdl) { var sp2 = rdl.querySelector('span'); if (sp2) sp2.textContent = 'Tarih seçin'; }
        } else if (modalType === 'custom') {
            val('board-custom-item-title'); val('board-custom-item-desc');
            chk('board-custom-toggle-goal'); chk('board-custom-toggle-rem');
            dsp('board-custom-goal-fields'); dsp('board-custom-rem-fields');
            txt('board-custom-file-label', 'Dosya seçilmedi');
            val('board-custom-file-input');
        }

        overlay.querySelectorAll('input, textarea, select').forEach(function (el) {
            el.style.borderColor = '';
        });

        overlay.style.display = 'flex';
        requestAnimationFrame(function () {
            overlay.classList.add('active');
            var firstInput = overlay.querySelector('input[type="text"], input[type="number"]');
            if (firstInput) firstInput.focus();
        });
    }

    function saveSpecialized(type) {
        console.log('Board: Saving specialized item of type:', type);
        var colId = _addModalColId;
        var col = _columns.find(function (c) { return c.id === colId; });
        
        if (!col) {
            // Check if col is somehow buried in memory or different (this shouldn't happen but defensive)
            console.error('Board: Column not found in _columns for ID:', colId);
            return;
        }

        var item = { 
            id: genId(), 
            completed: false, 
            createdAt: new Date().toISOString() 
        };

        if (type === 'tasks') {
            var titleEl = document.getElementById('board-task-title');
            item.title = titleEl ? titleEl.value.trim() : '';
            item.note = document.getElementById('board-task-desc').value.trim();
            item.date = document.getElementById('board-task-due').value;
        } else if (type === 'goals') {
            var titleEl = document.getElementById('board-goal-title');
            item.title = titleEl ? titleEl.value.trim() : '';
            item.goalAmount = document.getElementById('board-goal-amount').value;
            item.goalUnit = document.getElementById('board-goal-unit').value.trim();
            item.progress = 0;
        } else if (type === 'shopping') {
            var titleEl = document.getElementById('board-shopping-title');
            item.title = titleEl ? titleEl.value.trim() : '';
            item.note = document.getElementById('board-shopping-note').value.trim();
        } else if (type === 'notes') {
            var titleEl = document.getElementById('board-notes-title');
            item.title = titleEl ? titleEl.value.trim() : '';
            item.note = document.getElementById('board-notes-content').value.trim();
        } else if (type === 'finance') {
            var titleEl = document.getElementById('board-finance-title');
            item.title = titleEl ? titleEl.value.trim() : '';
            item.amount = parseFloat(document.getElementById('board-finance-amount').value);
            item.finType = document.getElementById('board-finance-type').value;
            if (!item.title || isNaN(item.amount)) {
                if (titleEl && !item.title) titleEl.style.borderColor = 'var(--color-danger)';
                return;
            }
        } else if (type === 'reminders') {
            var titleEl = document.getElementById('board-reminders-title');
            item.title = titleEl ? titleEl.value.trim() : '';
            item.date = document.getElementById('board-reminders-date').value;
            item.time = document.getElementById('board-reminders-time').value;
        } else if (type === 'custom') {
            var titleEl = document.getElementById('board-custom-item-title');
            item.title = titleEl ? titleEl.value.trim() : '';
            item.note = document.getElementById('board-custom-item-desc').value.trim();
            item.isCustom = true;
            item.hasGoal = document.getElementById('board-custom-toggle-goal').checked;
            item.hasRem = document.getElementById('board-custom-toggle-rem').checked;
            if (item.hasGoal) {
                item.goalAmount = document.getElementById('board-custom-goal-amount').value;
                item.goalUnit = document.getElementById('board-custom-goal-unit').value.trim();
                item.progress = 0;
            }
            if (item.hasRem) {
                item.date = document.getElementById('board-custom-rem-date').value;
            }
        }

        // Shared title validation for all types except finance (handled above)
        if (type !== 'finance' && !item.title) {
            var tEls = document.querySelectorAll('#board-add-' + type + '-modal input[type="text"]');
            if (tEls.length > 0) {
                tEls[0].style.borderColor = 'var(--color-danger)';
                tEls[0].focus();
            }
            return;
        }

        if (!col.items) col.items = [];
        col.items.unshift(item);
        
        save(); 
        render(); 
        closeAddModal();
        
        if (typeof Toast !== 'undefined') Toast.show('Öğe eklendi', 'success');
    }

    function toggleCustomFields(type) {
        var box = document.getElementById('board-custom-' + type + '-fields');
        var toggle = document.getElementById('board-custom-toggle-' + type);
        if (box && toggle) {
            box.style.display = toggle.checked ? 'block' : 'none';
        }
    }

    function onCustomFileChange(input) {
        var label = document.getElementById('board-custom-file-label');
        if (label) {
            label.textContent = input.files && input.files.length ? input.files[0].name : 'Dosya seçilmedi';
        }
    }

    function closeAddModal() {
        document.querySelectorAll('.reminder-modal-overlay, .team-modal-overlay, .board-section-modal-overlay').forEach(function (ov) {
            if (ov.id && ov.id.startsWith('board-add-')) {
                ov.classList.remove('active');
                setTimeout(function () { ov.style.display = 'none'; }, 300);
            }
        });
        var legacy = document.getElementById('board-add-modal-overlay');
        if (legacy) legacy.style.display = 'none';
        _addModalColId = null;
    }

    function saveAddModal() {
        if (!_addModalColId) return;
        var col = _columns.find(function (c) { return c.id === _addModalColId; });
        if (!col) return;
        var titleInp = document.getElementById('board-add-item-title');
        var noteInp = document.getElementById('board-add-item-note');
        var title = titleInp ? titleInp.value.trim() : '';
        if (!title) {
            if (titleInp) { titleInp.style.borderColor = 'var(--color-danger)'; titleInp.focus(); }
            return;
        }
        var item = { id: genId(), title: title, completed: false };
        if (noteInp && noteInp.value.trim()) item.note = noteInp.value.trim();
        if (col.type === 'goals') {
            var r = document.getElementById('board-add-progress-range');
            item.progress = r ? parseInt(r.value, 10) : 0;
        }
        if (col.type === 'finance') {
            var amt = document.getElementById('board-add-finance-amount');
            var typ = document.getElementById('board-add-finance-type');
            item.amount = amt ? parseFloat(amt.value) || 0 : 0;
            item.finType = (typ && typ.value === 'expense') ? 'expense' : 'income';
        }
        col.items.push(item);
        save();
        render();
        closeAddModal();
        if (typeof Toast !== 'undefined') Toast.show('Öğe eklendi', 'success');
    }

    function onProgressRangeInput() {
        var r = document.getElementById('board-add-progress-range');
        var v = document.getElementById('board-add-progress-val');
        if (r && v) v.textContent = '%' + r.value;
    }

    /* ===== Column Operations ===== */
    function createColumn(templateKey) {
        if (templateKey === 'custom') { openCustomListModal(); closeNewListDropdown(); return; }
        var tmpl = TEMPLATES.find(function (t) { return t.key === templateKey; }) || TEMPLATES[0];
        _columns.push({ id: genId(), name: tmpl.label, type: tmpl.type, pixelWidth: 340, items: [] });
        save(); render(); closeNewListDropdown();
        var sa = document.querySelector('.board-scroll-area');
        if (sa) setTimeout(function () { sa.scrollLeft = sa.scrollWidth; }, 50);
        if (typeof Toast !== 'undefined') Toast.show('"' + tmpl.label + '" oluşturuldu', 'success');
    }

    /* Custom list creation modal — Renk seçimi YOK (sadece bölüm oluştururken çıkar) */
    function openCustomListModal() {
        var html = '<div class="modal-overlay board-section-modal-overlay" id="board-custom-modal" onclick="Board.closeCustomModal()">'
            + '<div class="board-section-modal-card" onclick="event.stopPropagation()">'
            + '<div class="board-section-modal-header">'
            + '<h3 class="board-section-modal-title">Özel Pano Oluştur</h3>'
            + '<button class="board-section-modal-close" onclick="Board.closeCustomModal()">' + ico('x', 18) + '</button>'
            + '</div>'
            + '<div class="board-section-modal-body">'
            + '<div class="board-section-modal-field">'
            + '<label class="board-section-modal-label">Pano Adı</label>'
            + '<div class="board-create-input-row">'
            + '<span class="board-create-input-icon">' + ico('edit', 16) + '</span>'
            + '<input type="text" id="board-custom-name" class="board-section-modal-input" placeholder="Pano adını girin" maxlength="50">'
            + '</div>'
            + '</div>'
            + '<div class="board-create-toggle-row">'
            + '<span class="board-create-toggle-label">' + ico('target', 16) + ' Hedef takibi</span>'
            + '<label class="settings-switch"><input type="checkbox" id="board-custom-goals"><span class="settings-switch-slider"></span></label>'
            + '</div>'
            + '</div>'
            + '<div class="board-section-modal-footer">'
            + '<button class="btn btn-secondary" onclick="Board.closeCustomModal()">İptal</button>'
            + '<button class="btn btn-primary board-section-modal-create-btn" onclick="Board.saveCustomList()">' + ico('plus', 15) + ' Oluştur</button>'
            + '</div></div></div>';
        var c = document.getElementById('board-custom-modal-container');
        if (!c) { c = document.createElement('div'); c.id = 'board-custom-modal-container'; document.body.appendChild(c); }
        c.innerHTML = html;
        setTimeout(function () { var n = document.getElementById('board-custom-name'); if (n) n.focus(); }, 100);
    }
    function closeCustomModal() {
        var c = document.getElementById('board-custom-modal-container');
        if (c) c.innerHTML = '';
    }
    function selectCustomColor(el) {
        document.querySelectorAll('#board-custom-colors .board-section-color-swatch').forEach(function (d) { d.classList.remove('selected'); });
        el.classList.add('selected');
    }
    function saveCustomList() {
        var nameEl = document.getElementById('board-custom-name');
        var name = nameEl ? nameEl.value.trim() : '';
        if (!name) { if (nameEl) { nameEl.style.borderColor = 'var(--color-danger)'; nameEl.focus(); } return; }
        // Renk otomatik atanır — liste oluştururken renk seçimi yok
        var color = colColor(_columns.length);
        var isGoals = document.getElementById('board-custom-goals');
        var type = (isGoals && isGoals.checked) ? 'goals' : 'custom';
        _columns.push({ id: genId(), name: name, type: type, pixelWidth: 340, color: color, items: [] });
        save(); render(); closeCustomModal();
        var sa = document.querySelector('.board-scroll-area');
        if (sa) setTimeout(function () { sa.scrollLeft = sa.scrollWidth; }, 50);
        if (typeof Toast !== 'undefined') Toast.show('"' + name + '" oluşturuldu', 'success');
    }

    function deleteColumn(colId) {
        var col = _columns.find(function (c) { return c.id === colId; });
        if (!col) return;
        closeColMenu(colId);
        var html = '<div id="board-delete-confirm-modal" class="modal-overlay" onclick="Board.closeDeleteModal()">' +
            '<div class="modal-content confirm-modal" onclick="event.stopPropagation()">' +
            '<div class="confirm-modal-icon">⚠️</div>' +
            '<h3 class="confirm-modal-title">Listeyi Silmek İstediğinizden Emin Misiniz?</h3>' +
            '<div class="confirm-modal-detail">' +
            '<div class="confirm-detail-row"><span class="confirm-detail-label">Liste:</span><span class="confirm-detail-value">' + esc(col.name) + '</span></div>' +
            '<div class="confirm-detail-row"><span class="confirm-detail-label">Öğe sayısı:</span><span class="confirm-detail-value">' + (col.items ? col.items.length : 0) + '</span></div>' +
            '</div>' +
            '<p class="confirm-modal-warning">Bu işlem geri alınamaz.</p>' +
            '<div class="confirm-modal-actions">' +
            '<button class="btn btn-secondary" onclick="Board.closeDeleteModal()">İptal</button>' +
            '<button class="btn btn-danger" onclick="Board.doDeleteColumn(\'' + colId + '\')">' + ico('trash', 14) + ' Sil</button>' +
            '</div></div></div>';
        var c = document.getElementById('board-delete-modal-container');
        if (!c) { c = document.createElement('div'); c.id = 'board-delete-modal-container'; document.body.appendChild(c); }
        c.innerHTML = html;
    }
    function closeDeleteModal() {
        var c = document.getElementById('board-delete-modal-container');
        if (c) c.innerHTML = '';
    }
    function doDeleteColumn(colId) {
        _columns = _columns.filter(function (c) { return c.id !== colId; });
        save(); render(); closeDeleteModal();
        if (typeof Toast !== 'undefined') Toast.show('Liste silindi', 'info');
    }

    function startRename(colId) {
        closeColMenu(colId);
        var el = document.getElementById('col-name-' + colId);
        var col = _columns.find(function (c) { return c.id === colId; });
        if (!el || !col) return;
        el.setAttribute('contenteditable', 'true');
        el.classList.add('editing');
        el.focus();
        var range = document.createRange(); range.selectNodeContents(el);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        function finish() {
            el.removeAttribute('contenteditable'); el.classList.remove('editing');
            var n = el.textContent.trim();
            if (n && n !== col.name) { col.name = n; save(); } else el.textContent = col.name;
            el.removeEventListener('blur', finish); el.removeEventListener('keydown', onK);
        }
        function onK(e) {
            if (e.key === 'Enter') { e.preventDefault(); finish(); }
            if (e.key === 'Escape') { el.textContent = col.name; finish(); }
        }
        el.addEventListener('blur', finish); el.addEventListener('keydown', onK);
    }

    function toggleColMenu(colId) {
        var menu = document.getElementById('col-menu-' + colId);
        if (!menu) return;
        var was = menu.classList.contains('open');
        document.querySelectorAll('.board-col-menu.open').forEach(function (m) { m.classList.remove('open'); });
        if (!was) menu.classList.add('open');
    }
    function closeColMenu(colId) {
        var m = document.getElementById('col-menu-' + colId);
        if (m) m.classList.remove('open');
    }

    /* ===== Item Operations ===== */
    function toggleItem(colId, itemId) {
        var col = _columns.find(function (c) { return c.id === colId; });
        if (!col) return;
        var item = col.items.find(function (i) { return i.id === itemId; });
        if (!item) return;
        item.completed = !item.completed;
        if (item.completed) {
            var cc = _columns.find(function (c) { return c.type === 'completed'; });
            if (cc && cc.id !== colId) {
                col.items = col.items.filter(function (i) { return i.id !== itemId; });
                cc.items.unshift(item);
            }
        }
        save(); render();
    }

    function deleteItem(colId, itemId) {
        var col = _columns.find(function (c) { return c.id === colId; });
        if (!col) return;
        var original = col.items.find(function (i) { return i.id === itemId; });
        if (original && typeof Trash !== 'undefined') {
            Trash.addToTrash('board_item', itemId, original.title || 'Adsız Görev', original.description || '', { colId: colId, item: original });
        }
        col.items = col.items.filter(function (i) { return i.id !== itemId; });
        save(); render();
        closeItemDetail();
    }

    /* ===== Item Detail Panel ===== */
    function closeItemDetail() {
        var c = document.getElementById('board-item-detail-overlay');
        if (c) { c.classList.remove('active'); setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 280); }
    }

    function openItemDetail(colId, itemId) {
        var col = _columns.find(function (c) { return c.id === colId; });
        if (!col) return;
        var item = col.items.find(function (i) { return i.id === itemId; });
        if (!item) return;

        closeItemDetail();

        var color = col.color || colColor(_columns.indexOf(col));

        var badgeDateStr = '';
        if (item.createdAt) {
            try {
                var cd = new Date(item.createdAt);
                var months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
                badgeDateStr = cd.getDate() + ' ' + months[cd.getMonth()] + ' ' + cd.getFullYear();
            } catch(e) { badgeDateStr = item.createdAt; }
        } else {
            var now = new Date();
            var m2 = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
            badgeDateStr = now.getDate() + ' ' + m2[now.getMonth()] + ' ' + now.getFullYear();
        }

        var dateStr = '';
        if (item.date) {
            try { var d = new Date(item.date); dateStr = d.toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' }); } catch(e) { dateStr = item.date; }
        }

        var h = '<div id="board-item-detail-overlay" class="board-detail-overlay" onclick="Board.closeItemDetail()">';
        h += '<div class="board-detail-panel-v2" onclick="event.stopPropagation()" style="--detail-accent:' + color + '">';

        // Header: date badge + edit/delete icons
        h += '<div class="board-detail-v2-header">';
        h += '<div class="board-detail-v2-date-badge">' + esc(badgeDateStr) + '</div>';
        h += '<div class="board-detail-v2-actions">';
        h += '<button class="board-detail-v2-action-btn board-detail-v2-edit-btn" onclick="Board.openEditItemModal(\'' + colId + '\',\'' + itemId + '\')" title="Düzenle">';
        h += '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
        h += '</button>';
        h += '<button class="board-detail-v2-action-btn board-detail-v2-delete-btn" onclick="Board.deleteItem(\'' + colId + '\',\'' + itemId + '\')" title="Sil">';
        h += '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
        h += '</button>';
        h += '</div></div>';

        // Horizontal divider after header
        h += '<div class="board-detail-v2-divider"></div>';

        // Title
        h += '<div class="board-detail-v2-title">' + esc(item.title) + '</div>';

        // Scrollable body
        h += '<div class="board-detail-v2-body">';

        if (item.note) {
            h += '<div class="board-detail-v2-note">' + esc(item.note).replace(/\n/g, '<br>') + '</div>';
        }

        // Status
        h += '<div class="board-detail-v2-status-row">';
        if (item.completed) {
            h += '<span class="board-detail-v2-status-badge done">' + ico('check-square', 12) + ' Tamamlandı</span>';
        } else {
            h += '<span class="board-detail-v2-status-badge pending">' + ico('bell', 12) + ' Devam ediyor</span>';
        }
        h += '</div>';

        // Goals card (for goals type OR custom with hasGoal)
        if ((col.type === 'goals' || item.hasGoal) && item.goalAmount) {
            var pct = Math.min(100, Math.round(((item.progress || 0) / item.goalAmount) * 100));
            h += '<div class="board-detail-v2-card">';
            h += '<div class="board-detail-v2-card-label">' + ico('target', 14) + ' Hedef</div>';
            h += '<div class="board-detail-v2-goal-info">' + (item.progress || 0) + ' / ' + item.goalAmount + ' ' + esc(item.goalUnit || '') + ' (%' + pct + ')</div>';
            h += '<div class="board-detail-v2-progress"><div class="board-detail-v2-progress-fill" style="width:' + pct + '%;background:' + color + '"></div></div>';
            h += '</div>';
        }

        // Finance
        if (col.type === 'finance' && item.amount) {
            var fc = item.finType === 'expense' ? '#ef4444' : '#10b981';
            var fp = item.finType === 'expense' ? '−' : '+';
            h += '<div class="board-detail-v2-card">';
            h += '<div class="board-detail-v2-card-label">' + ico('dollar', 14) + ' Tutar</div>';
            h += '<div class="board-detail-v2-amount" style="color:' + fc + '">' + fp + item.amount.toLocaleString('tr-TR') + ' ₺</div>';
            h += '</div>';
        }

        // Deadline / date (for items with date, or custom with hasDeadline/hasRem)
        if (dateStr) {
            h += '<div class="board-detail-v2-card">';
            h += '<div class="board-detail-v2-card-label">' + ico('bell', 14) + ' Son Tarih</div>';
            h += '<div class="board-detail-v2-date-val">' + dateStr + (item.time ? ' — ' + item.time : '') + '</div>';
            h += '</div>';
        }

        h += '</div>'; // end body

        // Footer
        h += '<div class="board-detail-v2-footer">';
        h += '<button class="board-detail-v2-toggle-btn" onclick="Board.toggleItem(\'' + colId + '\',\'' + itemId + '\');Board.closeItemDetail()">';
        if (item.completed) {
            h += ico('x', 15) + ' Tamamlanmadı olarak işaretle';
        } else {
            h += ico('check-square', 15) + ' Tamamlandı olarak işaretle';
        }
        h += '</button></div>';

        h += '</div></div>';

        var c = document.createElement('div');
        c.innerHTML = h;
        document.body.appendChild(c.firstChild);
        requestAnimationFrame(function () {
            var ov = document.getElementById('board-item-detail-overlay');
            if (ov) ov.classList.add('active');
        });
    }

    /* ===== Edit Item Modal ===== */
    function openEditItemModal(colId, itemId) {
        var col = _columns.find(function (c) { return c.id === colId; });
        if (!col) return;
        var item = col.items.find(function (i) { return i.id === itemId; });
        if (!item) return;

        closeItemDetail();

        var h = '<div id="board-edit-item-overlay" class="modal-overlay board-section-modal-overlay" style="display:flex" onclick="Board.closeEditItemModal()">';
        h += '<div class="board-section-modal-card" onclick="event.stopPropagation()">';
        h += '<div class="board-section-modal-header">';
        h += '<h3 class="board-section-modal-title">Öğeyi Düzenle</h3>';
        h += '<button class="board-section-modal-close" onclick="Board.closeEditItemModal()">' + ico('x', 18) + '</button>';
        h += '</div>';
        h += '<div class="board-section-modal-body">';

        // Title
        h += '<div class="board-section-modal-field">';
        h += '<label class="board-section-modal-label">Başlık</label>';
        h += '<div class="board-create-input-row">';
        h += '<span class="board-create-input-icon">' + ico('edit', 15) + '</span>';
        h += '<input type="text" id="board-edit-title" class="board-section-modal-input" value="' + esc(item.title).replace(/"/g, '&quot;') + '" maxlength="100">';
        h += '</div></div>';

        // Description
        h += '<div class="board-section-modal-field">';
        h += '<label class="board-section-modal-label">Açıklama</label>';
        h += '<textarea id="board-edit-desc" class="board-section-modal-input board-add-textarea" rows="3" placeholder="Açıklama girin...">' + esc(item.note || '') + '</textarea>';
        h += '</div>';

        // Goal toggle (for custom or goals type)
        if (col.type === 'custom' || col.type === 'goals' || item.hasGoal) {
            var gChecked = (item.hasGoal || col.type === 'goals') ? ' checked' : '';
            h += '<div class="board-create-toggle-row">';
            h += '<span class="board-create-toggle-label">' + ico('target', 14) + ' Hedef takibi</span>';
            h += '<label class="settings-switch"><input type="checkbox" id="board-edit-toggle-goal"' + gChecked + ' onchange="Board.toggleEditField(\'goal\')"><span class="settings-switch-slider"></span></label>';
            h += '</div>';
            var gDisp = (item.hasGoal || col.type === 'goals') ? 'block' : 'none';
            h += '<div id="board-edit-goal-fields" style="display:' + gDisp + '; margin-top:8px">';
            h += '<div class="board-add-row">';
            h += '<input type="number" id="board-edit-goal-amount" class="board-section-modal-input" placeholder="Miktar" value="' + (item.goalAmount || '') + '" style="flex:1">';
            h += '<input type="text" id="board-edit-goal-unit" class="board-section-modal-input" placeholder="Birim" value="' + esc(item.goalUnit || '') + '" style="flex:1">';
            h += '</div></div>';
        }

        // Deadline toggle (for custom type or items with date)
        if (col.type === 'custom' || item.hasRem || item.date) {
            var dChecked = (item.hasRem || item.date) ? ' checked' : '';
            h += '<div class="board-create-toggle-row">';
            h += '<span class="board-create-toggle-label">' + ico('bell', 14) + ' Son tarih</span>';
            h += '<label class="settings-switch"><input type="checkbox" id="board-edit-toggle-deadline"' + dChecked + ' onchange="Board.toggleEditField(\'deadline\')"><span class="settings-switch-slider"></span></label>';
            h += '</div>';
            var dDisp = (item.hasRem || item.date) ? 'block' : 'none';
            h += '<div id="board-edit-deadline-fields" style="display:' + dDisp + '; margin-top:8px">';
            h += '<input type="hidden" id="board-edit-date" value="' + (item.date || '') + '">';
            h += '<button type="button" class="board-add-date-btn" id="board-edit-date-label" onclick="FinanceCalendarPicker.open(\'board-edit-date\',\'board-edit-date-label\')">';
            h += ico('bell', 14);
            var dlabel = item.date || 'Tarih seçin';
            h += ' <span>' + dlabel + '</span></button>';
            h += '</div>';
        }

        h += '</div>'; // end body

        // Footer
        h += '<div class="board-section-modal-footer">';
        h += '<button class="btn btn-secondary" onclick="Board.closeEditItemModal()">İptal</button>';
        h += '<button class="btn btn-primary board-section-modal-create-btn" onclick="Board.saveEditItem(\'' + colId + '\',\'' + itemId + '\')">' + ico('check-square', 14) + ' Kaydet</button>';
        h += '</div>';

        h += '</div></div>';

        var ex = document.getElementById('board-edit-item-overlay');
        if (ex) ex.remove();
        document.body.insertAdjacentHTML('beforeend', h);
        setTimeout(function () {
            var titleInp = document.getElementById('board-edit-title');
            if (titleInp) titleInp.focus();
        }, 100);
    }

    function closeEditItemModal() {
        var el = document.getElementById('board-edit-item-overlay');
        if (el) el.remove();
    }

    function toggleEditField(type) {
        var toggle = document.getElementById('board-edit-toggle-' + type);
        var fields = document.getElementById('board-edit-' + type + '-fields');
        if (toggle && fields) fields.style.display = toggle.checked ? 'block' : 'none';
    }

    function saveEditItem(colId, itemId) {
        var col = _columns.find(function (c) { return c.id === colId; });
        if (!col) return;
        var item = col.items.find(function (i) { return i.id === itemId; });
        if (!item) return;

        var titleEl = document.getElementById('board-edit-title');
        var title = titleEl ? titleEl.value.trim() : '';
        if (!title) { if (titleEl) { titleEl.style.borderColor = 'var(--color-danger)'; titleEl.focus(); } return; }

        item.title = title;
        var descEl = document.getElementById('board-edit-desc');
        item.note = descEl ? descEl.value.trim() : '';

        var goalToggle = document.getElementById('board-edit-toggle-goal');
        if (goalToggle) {
            item.hasGoal = goalToggle.checked;
            if (item.hasGoal) {
                var amtEl = document.getElementById('board-edit-goal-amount');
                var unitEl = document.getElementById('board-edit-goal-unit');
                item.goalAmount = amtEl ? amtEl.value : item.goalAmount;
                item.goalUnit = unitEl ? unitEl.value.trim() : item.goalUnit;
                if (typeof item.progress === 'undefined') item.progress = 0;
            }
        }

        var deadlineToggle = document.getElementById('board-edit-toggle-deadline');
        if (deadlineToggle) {
            item.hasRem = deadlineToggle.checked;
            if (item.hasRem) {
                var dateEl = document.getElementById('board-edit-date');
                item.date = dateEl ? dateEl.value : item.date;
            } else {
                item.date = '';
            }
        }

        save();
        render();
        closeEditItemModal();
        if (typeof Toast !== 'undefined') Toast.show('Öğe güncellendi', 'success');
    }

    function setProgress(colId, itemId, val) {
        var col = _columns.find(function (c) { return c.id === colId; });
        if (!col) return;
        var item = col.items.find(function (i) { return i.id === itemId; });
        if (!item) return;
        item.progress = parseInt(val, 10);
        if (item.progress >= 100) item.completed = true;
        save(); render();
    }

    /* ===== Item Context Menu (3-dot) ===== */
    function toggleItemMenu(colId, itemId) {
        var menuId = 'item-menu-' + colId + '-' + itemId;
        var menu = document.getElementById(menuId);
        if (!menu) return;
        var wasOpen = menu.classList.contains('open');
        closeAllItemMenus();
        if (!wasOpen) {
            // Find the 3-dot button that triggered this
            var btn = menu.parentElement.querySelector('.board-item-more-btn');
            if (!btn) return;
            var btnRect = btn.getBoundingClientRect();
            var viewH = window.innerHeight;
            var menuW = 190; // min-width

            // Show menu to measure its height
            menu.classList.remove('menu-up');
            menu.style.visibility = 'hidden';
            menu.classList.add('open');
            var menuH = menu.offsetHeight;

            // Position: default aşağı açılır
            var top = btnRect.bottom + 4;
            var left = btnRect.right - menuW;
            if (left < 8) left = 8;

            // Eğer altta yeterli alan yoksa, yukarı aç
            if (top + menuH > viewH - 10) {
                top = btnRect.top - menuH - 4;
                menu.classList.add('menu-up');
            }
            if (top < 8) top = 8;

            menu.style.top = top + 'px';
            menu.style.left = left + 'px';
            menu.style.visibility = 'visible';
        }
    }

    function closeAllItemMenus() {
        document.querySelectorAll('.board-item-menu.open').forEach(function (m) {
            m.classList.remove('open');
            m.classList.remove('menu-up');
            m.style.top = '';
            m.style.left = '';
        });
    }

    /* ===== Share Modal ===== */
    var _shareSelection = { type: null, value: null, colId: null, itemId: null }; // type: 'member'|'whatsapp'|'telegram'|'team', value: email or teamId

    function openShareModal(colId, itemId) {
        closeAllItemMenus();
        var col = _columns.find(function (c) { return c.id === colId; });
        if (!col) return;
        var item = col.items.find(function (i) { return i.id === itemId; });
        if (!item) return;

        _shareSelection = { type: null, value: null, colId: colId, itemId: itemId };

        // Get teams for sharing
        var teams = (typeof Team !== 'undefined' && Team.getTeams) ? Team.getTeams() : [];
        // Get team members for "Mesaj olarak gönder" section
        var allMembers = [];
        var memberEmails = {};
        teams.forEach(function (t) {
            if (t.members) {
                t.members.forEach(function (m) {
                    if (!memberEmails[m.email]) {
                        memberEmails[m.email] = true;
                        allMembers.push(m);
                    }
                });
            }
        });

        var h = '<div id="board-share-overlay" class="board-share-overlay" onclick="if(event.target===this)Board.closeShareModal()">';
        h += '<div class="board-share-card" onclick="event.stopPropagation()">';

        // Page 1: Main share
        h += '<div class="board-share-page-main" id="board-share-page-main">';

        // Header
        h += '<div class="board-share-header">';
        h += '<span class="board-share-title">Mesaj olarak gönder</span>';
        h += '<button class="board-share-close" onclick="Board.closeShareModal()">' + ico('x', 18) + '</button>';
        h += '</div>';

        // Users
        if (allMembers.length > 0) {
            h += '<div class="board-share-users">';
            allMembers.forEach(function (m) {
                var initials = (m.name || m.email || 'A').split(' ').map(function (w) { return w[0] || ''; }).join('').toUpperCase().substr(0, 2);
                h += '<div class="board-share-user" data-share-type="member" data-share-value="' + esc(m.email) + '" onclick="Board.selectShareTarget(\'member\',\'' + esc(m.email) + '\',this)">';
                if (m.photo) {
                    h += '<img class="board-share-user-avatar" src="' + m.photo + '" alt="" style="object-fit:cover">';
                } else {
                    h += '<div class="board-share-user-avatar">' + initials + '</div>';
                }
                h += '<span class="board-share-user-name">' + esc(m.name || m.email) + '</span>';
                h += '</div>';
            });
            h += '</div>';
        } else {
            h += '<div style="padding:12px 0;color:var(--color-text-tertiary);font-size:13px;text-align:center">Henüz ekip üyesi yok</div>';
        }

        h += '<div class="board-share-divider"></div>';

        // Platforms: Ekip, WhatsApp, Telegram
        h += '<div class="board-share-section-title">Şurada paylaş:</div>';
        h += '<div class="board-share-platforms">';

        // Ekip
        h += '<button class="board-share-platform" onclick="Board.openTeamSharePage(\'' + colId + '\',\'' + itemId + '\')">';
        h += '<div class="board-share-platform-icon" style="background:rgba(99,102,241,0.12);color:#6366f1">';
        h += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
        h += '</div>';
        h += '<span class="board-share-platform-name">Ekip</span>';
        h += '</button>';

        // WhatsApp
        h += '<button class="board-share-platform" data-share-type="whatsapp" onclick="Board.selectShareTarget(\'whatsapp\',\'whatsapp\',this)">';
        h += '<div class="board-share-platform-icon" style="background:rgba(37,211,102,0.12);color:#25d366">';
        h += '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
        h += '</div>';
        h += '<span class="board-share-platform-name">WhatsApp</span>';
        h += '</button>';

        // Telegram
        h += '<button class="board-share-platform" data-share-type="telegram" onclick="Board.selectShareTarget(\'telegram\',\'telegram\',this)">';
        h += '<div class="board-share-platform-icon" style="background:rgba(38,165,224,0.12);color:#26a5e4">';
        h += '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>';
        h += '</div>';
        h += '<span class="board-share-platform-name">Telegram</span>';
        h += '</button>';

        h += '</div>'; // platforms

        // Confirm button (disabled until selection)
        h += '<div class="board-share-footer" id="board-share-footer">';
        h += '<button class="btn btn-primary board-share-confirm-btn" id="board-share-confirm-btn" onclick="Board.confirmShare()" disabled>' + ico('share', 14) + ' Paylaş</button>';
        h += '</div>';

        h += '</div>'; // page-main

        // Page 2: Team selection
        h += '<div class="board-share-teams-page" id="board-share-page-teams">';
        h += '<button class="board-share-back-btn" onclick="Board.backToShareMain()">' + ico('arrow-left', 16) + ' Geri</button>';
        h += '<div class="board-share-section-title">Ekip Seçin</div>';

        if (teams.length > 0) {
            h += '<div class="board-share-team-list">';
            teams.forEach(function (t) {
                var tColor = t.color || '#6366f1';
                var tInitials = (t.name || 'E').substr(0, 2).toUpperCase();
                var memberCount = t.members ? t.members.length : 0;
                h += '<div class="board-share-team-item" data-share-type="team" data-share-value="' + t.id + '" onclick="Board.selectShareTarget(\'team\',\'' + t.id + '\',this)">';
                if (t.photo) {
                    h += '<img class="board-share-team-avatar" src="' + t.photo + '" alt="" style="object-fit:cover;width:40px;height:40px;border-radius:50%">';
                } else {
                    h += '<div class="board-share-team-avatar" style="background:' + tColor + '">' + tInitials + '</div>';
                }
                h += '<div class="board-share-team-info">';
                h += '<span class="board-share-team-name">' + esc(t.name) + '</span>';
                h += '<span class="board-share-team-members">' + memberCount + ' üye</span>';
                h += '</div>';
                h += '<div class="board-share-team-check" id="share-team-check-' + t.id + '" style="display:none">';
                h += '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
                h += '</div>';
                h += '</div>';
            });
            h += '</div>';
        } else {
            h += '<div style="padding:24px 0;color:var(--color-text-tertiary);font-size:13px;text-align:center">Henüz ekip oluşturulmamış</div>';
        }

        // Team page confirm button
        h += '<div class="board-share-footer" id="board-share-team-footer">';
        h += '<button class="btn btn-primary board-share-confirm-btn" id="board-share-team-confirm-btn" onclick="Board.confirmShare()" disabled>' + ico('share', 14) + ' Paylaş</button>';
        h += '</div>';

        h += '</div>'; // page-teams
        h += '</div></div>'; // card + overlay

        var existing = document.getElementById('board-share-container');
        if (existing) existing.remove();
        var container = document.createElement('div');
        container.id = 'board-share-container';
        container.innerHTML = h;
        document.body.appendChild(container);

        requestAnimationFrame(function () {
            var ov = document.getElementById('board-share-overlay');
            if (ov) ov.classList.add('active');
        });
    }

    function selectShareTarget(type, value, el) {
        _shareSelection.type = type;
        _shareSelection.value = value;

        // Remove previous selections
        document.querySelectorAll('.board-share-user.selected, .board-share-platform.selected, .board-share-team-item.selected').forEach(function (s) {
            s.classList.remove('selected');
        });
        // Hide all team checks
        document.querySelectorAll('.board-share-team-check').forEach(function (c) { c.style.display = 'none'; });

        // Mark current as selected
        if (el) el.classList.add('selected');
        if (type === 'team') {
            var chk = document.getElementById('share-team-check-' + value);
            if (chk) chk.style.display = 'flex';
        }

        // Enable confirm buttons
        var btn1 = document.getElementById('board-share-confirm-btn');
        var btn2 = document.getElementById('board-share-team-confirm-btn');
        if (btn1) btn1.disabled = false;
        if (btn2) btn2.disabled = false;
    }

    function confirmShare() {
        if (!_shareSelection.type) return;
        var colId = _shareSelection.colId;
        var itemId = _shareSelection.itemId;

        if (_shareSelection.type === 'member') {
            shareToMember(_shareSelection.value, colId, itemId);
        } else if (_shareSelection.type === 'whatsapp') {
            shareToWhatsApp(colId, itemId);
        } else if (_shareSelection.type === 'telegram') {
            shareToTelegram(colId, itemId);
        } else if (_shareSelection.type === 'team') {
            shareToTeam(_shareSelection.value, colId, itemId, true);
            closeShareModal();
        }
    }

    function closeShareModal() {
        var ov = document.getElementById('board-share-overlay');
        if (ov) {
            ov.classList.remove('active');
            setTimeout(function () {
                var c = document.getElementById('board-share-container');
                if (c) c.remove();
            }, 300);
        }
    }

    function openTeamSharePage(colId, itemId) {
        var main = document.getElementById('board-share-page-main');
        var teams = document.getElementById('board-share-page-teams');
        if (main) main.style.display = 'none';
        if (teams) teams.classList.add('active');
    }

    function backToShareMain() {
        var main = document.getElementById('board-share-page-main');
        var teams = document.getElementById('board-share-page-teams');
        if (main) main.style.display = 'block';
        if (teams) teams.classList.remove('active');
    }

    function getShareText(colId, itemId) {
        var col = _columns.find(function (c) { return c.id === colId; });
        if (!col) return '';
        var item = col.items.find(function (i) { return i.id === itemId; });
        if (!item) return '';
        var text = '📋 ' + item.title;
        if (item.goalAmount) {
            var prog = item.progress || 0;
            text += '\n🎯 İlerleme: ' + prog + '/' + item.goalAmount + ' ' + (item.goalUnit || '');
        }
        if (item.note) text += '\n📝 ' + item.note;
        text += '\n\n— NoteDay';
        return text;
    }

    function shareToWhatsApp(colId, itemId) {
        var text = getShareText(colId, itemId);
        window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
        closeShareModal();
    }

    function shareToTelegram(colId, itemId) {
        var text = getShareText(colId, itemId);
        window.open('https://t.me/share/url?url=' + encodeURIComponent(window.location.href) + '&text=' + encodeURIComponent(text), '_blank');
        closeShareModal();
    }

    function shareToMember(email, colId, itemId) {
        var text = getShareText(colId, itemId);
        if (typeof Toast !== 'undefined') Toast.show(esc(email) + ' kişisine paylaşıldı', 'success');
        closeShareModal();
    }

    function shareToTeam(teamId, colId, itemId, checked) {
        if (!checked) return;
        var col = _columns.find(function (c) { return c.id === colId; });
        if (!col) return;
        var item = col.items.find(function (i) { return i.id === itemId; });
        if (!item) return;

        // Send message to team chat
        if (typeof Team !== 'undefined' && Team.getTeams) {
            var teams = Team.getTeams();
            var team = teams.find(function (t) { return t.id === teamId; });
            if (team) {
                var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
                var CHAT_KEY = 'user_team_chat_' + (user ? user.email + '_' : '') + teamId;
                var messages = [];
                try {
                    var raw = localStorage.getItem(CHAT_KEY);
                    messages = raw ? JSON.parse(raw) : [];
                } catch (e) { messages = []; }

                var shareText = '📋 Panom\'dan paylaşım:\n\n';
                shareText += '📌 ' + item.title;
                if (item.goalAmount) {
                    var prog = item.progress || 0;
                    var pct = Math.min(100, Math.round((prog / item.goalAmount) * 100));
                    shareText += '\n🎯 İlerleme: ' + prog + '/' + item.goalAmount + ' ' + (item.goalUnit || '') + ' (%' + pct + ')';
                }
                if (item.note) shareText += '\n📝 ' + item.note;

                var msg = {
                    id: genId(),
                    teamId: teamId,
                    senderName: user ? (user.firstName + ' ' + (user.lastName || '')) : 'Ben',
                    senderEmail: user ? user.email : '',
                    text: shareText,
                    time: new Date().toISOString()
                };
                messages.push(msg);
                try { localStorage.setItem(CHAT_KEY, JSON.stringify(messages)); } catch (e) { }
                if (typeof Toast !== 'undefined') Toast.show('"' + team.name + '" ekibine paylaşıldı', 'success');
            }
        }
    }

    /* ===== Progress Update Modal ===== */
    function openProgressUpdateModal(colId, itemId) {
        closeAllItemMenus();
        var col = _columns.find(function (c) { return c.id === colId; });
        if (!col) return;
        var item = col.items.find(function (i) { return i.id === itemId; });
        if (!item || !item.goalAmount) return;

        var color = col.color || colColor(_columns.indexOf(col));
        var prog = item.progress || 0;
        var amt = parseInt(item.goalAmount, 10) || 0;
        var pct = amt > 0 ? Math.min(100, Math.round((prog / amt) * 100)) : 0;
        var barClass = pct >= 100 ? ' complete' : '';

        var h = '<div id="board-progress-overlay" class="board-progress-modal-overlay" onclick="if(event.target===this)Board.closeProgressModal()">';
        h += '<div class="board-progress-modal" onclick="event.stopPropagation()">';
        h += '<div class="board-progress-modal-title">' + ico('trending-up', 18) + ' İlerleme Güncelle</div>';
        h += '<div style="font-size:14px;font-weight:600;color:var(--color-text);margin-bottom:16px">' + esc(item.title) + '</div>';
        h += '<div class="board-progress-modal-info">';
        h += '<span>Mevcut: ' + prog + ' / ' + amt + ' ' + esc(item.goalUnit || '') + '</span>';
        h += '</div>';
        h += '<div class="board-progress-modal-pct" id="board-progress-pct-display">%' + pct + '</div>';
        h += '<div class="board-progress-modal-bar"><div class="board-progress-modal-bar-fill' + barClass + '" id="board-progress-bar-fill" style="width:' + pct + '%"></div></div>';
        h += '<div class="board-progress-modal-input-row">';
        h += '<input type="number" id="board-progress-input" class="board-progress-modal-input" value="' + prog + '" min="0" max="' + amt + '" oninput="Board.onProgressInput(\'' + amt + '\')">';
        h += '<span class="board-progress-modal-unit">/ ' + amt + ' ' + esc(item.goalUnit || '') + '</span>';
        h += '</div>';
        h += '<div class="board-progress-modal-actions">';
        h += '<button class="btn btn-secondary" onclick="Board.closeProgressModal()">İptal</button>';
        h += '<button class="btn btn-primary" onclick="Board.saveProgressUpdate(\'' + colId + '\',\'' + itemId + '\')">' + ico('check-square', 14) + ' Kaydet</button>';
        h += '</div>';
        h += '</div></div>';

        var existing = document.getElementById('board-progress-container');
        if (existing) existing.remove();
        var container = document.createElement('div');
        container.id = 'board-progress-container';
        container.innerHTML = h;
        document.body.appendChild(container);

        requestAnimationFrame(function () {
            var ov = document.getElementById('board-progress-overlay');
            if (ov) ov.classList.add('active');
            var inp = document.getElementById('board-progress-input');
            if (inp) inp.focus();
        });
    }

    function closeProgressModal() {
        var ov = document.getElementById('board-progress-overlay');
        if (ov) {
            ov.classList.remove('active');
            setTimeout(function () {
                var c = document.getElementById('board-progress-container');
                if (c) c.remove();
            }, 200);
        }
    }

    function onProgressInput(maxAmount) {
        var inp = document.getElementById('board-progress-input');
        if (!inp) return;
        var val = parseInt(inp.value, 10) || 0;
        var max = parseInt(maxAmount, 10) || 1;
        var pct = Math.min(100, Math.round((val / max) * 100));
        var display = document.getElementById('board-progress-pct-display');
        var bar = document.getElementById('board-progress-bar-fill');
        if (display) display.textContent = '%' + pct;
        if (bar) {
            bar.style.width = pct + '%';
            if (pct >= 100) bar.classList.add('complete');
            else bar.classList.remove('complete');
        }
    }

    function saveProgressUpdate(colId, itemId) {
        var col = _columns.find(function (c) { return c.id === colId; });
        if (!col) return;
        var item = col.items.find(function (i) { return i.id === itemId; });
        if (!item) return;
        var inp = document.getElementById('board-progress-input');
        if (!inp) return;
        var val = parseInt(inp.value, 10) || 0;
        var amt = parseInt(item.goalAmount, 10) || 0;
        if (val < 0) val = 0;
        if (amt > 0 && val > amt) val = amt;
        item.progress = val;
        if (amt > 0 && val >= amt) item.completed = true;
        save(); render();
        closeProgressModal();
        if (typeof Toast !== 'undefined') Toast.show('İlerleme güncellendi', 'success');
    }

    /* ===== Horizontal Resize ===== */
    function setupResize() {
        document.querySelectorAll('.board-col-resize').forEach(function (handle) {
            handle.addEventListener('mousedown', function (e) {
                e.preventDefault();
                var colEl = handle.closest('.board-col');
                var colId = handle.dataset.colId;
                var startX = e.clientX;
                var startW = colEl.offsetWidth;

                function onMove(ev) {
                    var newW = Math.max(220, Math.min(700, startW + (ev.clientX - startX)));
                    colEl.style.width = newW + 'px';
                }
                function onUp(ev) {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    document.body.style.cursor = '';
                    document.body.classList.remove('board-resizing');
                    var col = _columns.find(function (c) { return c.id === colId; });
                    if (col) { col.pixelWidth = colEl.offsetWidth; save(); }
                }
                document.body.style.cursor = 'col-resize';
                document.body.classList.add('board-resizing');
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        });
    }

    /* ===== Column Drag (reorder + drop into sections) ===== */
    function setupColumnDrag() {
        var cols = document.querySelectorAll('.board-col');
        var container = document.getElementById('board-columns');
        var scrollArea = document.querySelector('.board-scroll-area');
        if (!container) return;
        cols.forEach(function (colEl) {
            // Columns inside sections are handled by setupSectionColDrag
            if (colEl.closest('.board-section')) return;
            var header = colEl.querySelector('.board-col-header');
            if (!header) return;
            header.addEventListener('mousedown', function (e) {
                if (e.target.closest('.board-col-menu-btn') || e.target.closest('.board-col-menu') || e.target.closest('.board-col-name')) return;
                e.preventDefault();
                var rect = colEl.getBoundingClientRect();
                var offsetX = e.clientX - rect.left;
                var offsetY = e.clientY - rect.top;
                var ph = document.createElement('div');
                ph.className = 'board-col-placeholder';
                ph.style.width = colEl.offsetWidth + 'px';
                ph.style.height = colEl.offsetHeight + 'px';
                colEl.classList.add('board-col-dragging');
                colEl.style.width = rect.width + 'px';
                colEl.style.position = 'fixed';
                colEl.style.top = rect.top + 'px';
                colEl.style.left = rect.left + 'px';
                colEl.style.zIndex = '999';
                colEl.parentNode.insertBefore(ph, colEl);
                document.body.appendChild(colEl);
                var cAuto = null;
                var _hoverSection = null;

                function findSectionUnder(x, y) {
                    var zones = document.querySelectorAll('.board-section-inner');
                    for (var i = 0; i < zones.length; i++) {
                        var r = zones[i].getBoundingClientRect();
                        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return zones[i];
                    }
                    // Also check full section area (header + inner)
                    var secs = document.querySelectorAll('.board-section');
                    for (var j = 0; j < secs.length; j++) {
                        var sr = secs[j].getBoundingClientRect();
                        if (x >= sr.left && x <= sr.right && y >= sr.top && y <= sr.bottom) {
                            return secs[j].querySelector('.board-section-inner');
                        }
                    }
                    return null;
                }

                function onMove(ev) {
                    colEl.style.left = (ev.clientX - offsetX) + 'px';
                    colEl.style.top = (ev.clientY - offsetY) + 'px';
                    if (scrollArea) {
                        var sr = scrollArea.getBoundingClientRect();
                        if (ev.clientX < sr.left + 60) { if (!cAuto) cAuto = setInterval(function () { scrollArea.scrollLeft -= 6; }, 16); }
                        else if (ev.clientX > sr.right - 60) { if (!cAuto) cAuto = setInterval(function () { scrollArea.scrollLeft += 6; }, 16); }
                        else { if (cAuto) { clearInterval(cAuto); cAuto = null; } }
                    }
                    // Check if hovering over a section
                    var zone = findSectionUnder(ev.clientX, ev.clientY);
                    if (zone !== _hoverSection) {
                        if (_hoverSection) _hoverSection.classList.remove('board-section-drop-hover');
                        _hoverSection = zone;
                        if (_hoverSection) _hoverSection.classList.add('board-section-drop-hover');
                    }
                    // If NOT over a section, do normal column reorder
                    if (!zone) {
                        var all = container.querySelectorAll('.board-col:not(.board-col-dragging):not(.board-section .board-col), .board-col-placeholder');
                        for (var i = 0; i < all.length; i++) { var r = all[i].getBoundingClientRect(); if (ev.clientX < r.left + r.width / 2) { container.insertBefore(ph, all[i]); return; } }
                        container.appendChild(ph);
                    }
                }
                function onUp(ev) {
                    document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp);
                    if (cAuto) { clearInterval(cAuto); cAuto = null; }
                    if (_hoverSection) _hoverSection.classList.remove('board-section-drop-hover');

                    // Check if dropped on a section
                    var zone = findSectionUnder(ev.clientX, ev.clientY);
                    if (zone) {
                        var secId = zone.dataset.sectionId;
                        var colId = colEl.dataset.colId;
                        if (secId && colId) {
                            // Remove from all other sections first
                            _sections.forEach(function (s) {
                                s.columnIds = (s.columnIds || []).filter(function (id) { return id !== colId; });
                            });
                            var sec = _sections.find(function (s) { return s.id === secId; });
                            if (sec) {
                                if (!sec.columnIds) sec.columnIds = [];
                                if (sec.columnIds.indexOf(colId) === -1) sec.columnIds.push(colId);
                                saveSections();
                            }
                        }
                        ph.remove();
                        colEl.classList.remove('board-col-dragging');
                        colEl.style.position = ''; colEl.style.top = ''; colEl.style.left = ''; colEl.style.zIndex = '';
                        if (colEl.parentNode === document.body) colEl.remove();
                        render();
                        if (typeof Toast !== 'undefined') Toast.show('Liste bölüme eklendi', 'success');
                        return;
                    }

                    // Normal column reorder
                    if (colEl.parentNode === document.body) container.insertBefore(colEl, ph);
                    else container.insertBefore(colEl, ph);
                    ph.remove();
                    colEl.classList.remove('board-col-dragging');
                    colEl.style.position = ''; colEl.style.top = ''; colEl.style.left = ''; colEl.style.zIndex = '';
                    var newOrder = [];
                    container.querySelectorAll('.board-col:not(.board-section .board-col)').forEach(function (c) {
                        var f = _columns.find(function (col) { return col.id === c.dataset.colId; });
                        if (f) newOrder.push(f);
                    });
                    if (newOrder.length) {
                        // Keep columns in sections at their positions, update free columns
                        var secColIds = [];
                        _sections.forEach(function (s) { secColIds = secColIds.concat(s.columnIds || []); });
                        var fullOrder = [];
                        _columns.forEach(function (col) {
                            if (secColIds.indexOf(col.id) !== -1) fullOrder.push(col);
                        });
                        newOrder.forEach(function (col) { fullOrder.push(col); });
                        if (fullOrder.length === _columns.length) { _columns = fullOrder; save(); }
                    }
                    render();
                }
                document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
            });
        });
    }

    function setupClickRename() {
        document.querySelectorAll('.board-col-name').forEach(function (el) {
            el.addEventListener('click', function (e) { e.stopPropagation(); var cid = el.dataset.colId; if (cid) startRename(cid); });
        });
        // Section name inline rename
        document.querySelectorAll('.board-section-name').forEach(function (el) {
            el.addEventListener('click', function (e) { e.stopPropagation(); var sid = el.dataset.sectionId; if (sid) startSectionRename(sid); });
        });
    }

    function startSectionRename(secId) {
        var el = document.getElementById('sec-name-' + secId);
        var sec = _sections.find(function (s) { return s.id === secId; });
        if (!el || !sec) return;
        el.setAttribute('contenteditable', 'true');
        el.classList.add('editing');
        el.focus();
        var range = document.createRange(); range.selectNodeContents(el);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        function finish() {
            el.removeAttribute('contenteditable'); el.classList.remove('editing');
            var n = el.textContent.trim();
            if (n && n !== sec.name) { sec.name = n; saveSections(); } else el.textContent = sec.name;
            el.removeEventListener('blur', finish); el.removeEventListener('keydown', onK);
        }
        function onK(e) {
            if (e.key === 'Enter') { e.preventDefault(); finish(); }
            if (e.key === 'Escape') { el.textContent = sec.name; finish(); }
        }
        el.addEventListener('blur', finish); el.addEventListener('keydown', onK);
    }




    /* ===== Drag & Drop with auto-scroll ===== */
    function setupDragAndDrop() {
        var items = document.querySelectorAll('.board-item[draggable="true"]');
        var containers = document.querySelectorAll('.board-col-items');
        var scrollArea = document.querySelector('.board-scroll-area');

        items.forEach(function (el) {
            el.addEventListener('dragstart', function (e) {
                _dragState = { itemId: el.dataset.itemId, fromColId: el.closest('.board-col-items').dataset.colId };
                el.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', el.dataset.itemId);
            });
            el.addEventListener('dragend', function () {
                el.classList.remove('dragging');
                _dragState = null;
                stopAutoScroll();
                document.querySelectorAll('.board-col-items.drag-over').forEach(function (c) { c.classList.remove('drag-over'); });
            });
        });

        containers.forEach(function (cont) {
            cont.addEventListener('dragover', function (e) {
                e.preventDefault(); e.dataTransfer.dropEffect = 'move';
                cont.classList.add('drag-over');
            });
            cont.addEventListener('dragleave', function (e) {
                if (!cont.contains(e.relatedTarget)) cont.classList.remove('drag-over');
            });
            cont.addEventListener('drop', function (e) {
                e.preventDefault(); cont.classList.remove('drag-over');
                if (!_dragState) return;
                var toColId = cont.dataset.colId, fromColId = _dragState.fromColId, itemId = _dragState.itemId;
                if (fromColId === toColId) return;
                var fromCol = _columns.find(function (c) { return c.id === fromColId; });
                var toCol = _columns.find(function (c) { return c.id === toColId; });
                if (!fromCol || !toCol) return;
                var idx = fromCol.items.findIndex(function (i) { return i.id === itemId; });
                if (idx === -1) return;
                toCol.items.push(fromCol.items.splice(idx, 1)[0]);
                _dragState = null; save(); render();
            });
        });

        // Auto-scroll when dragging near edges
        if (scrollArea) {
            scrollArea.addEventListener('dragover', function (e) {
                if (!_dragState) return;
                var rect = scrollArea.getBoundingClientRect();
                var edgeSize = 80;
                var x = e.clientX;
                if (x < rect.left + edgeSize) {
                    startAutoScroll(scrollArea, -8);
                } else if (x > rect.right - edgeSize) {
                    startAutoScroll(scrollArea, 8);
                } else {
                    stopAutoScroll();
                }
            });
        }
    }

    function startAutoScroll(el, speed) {
        if (_autoScrollId) return;
        _autoScrollId = setInterval(function () { el.scrollLeft += speed; }, 16);
    }
    function stopAutoScroll() {
        if (_autoScrollId) { clearInterval(_autoScrollId); _autoScrollId = null; }
    }

    /* ===== Section (Bölüm) ===== */
    var SECTION_COLORS = [
        { label: 'Lavendır', value: '#ede9fe' },
        { label: 'Mavi', value: '#dbeafe' },
        { label: 'Yeşil', value: '#d1fae5' },
        { label: 'Sarı', value: '#fef3c7' },
        { label: 'Pembe', value: '#fce7f3' },
        { label: 'Turuncu', value: '#ffedd5' },
        { label: 'Gri', value: '#f3f4f6' },
        { label: 'Buz Mavisi', value: '#e0f2fe' },
        { label: 'Beyaz', value: '#ffffff' },
        { label: 'Koyu Lavendır', value: '#c4b5fd' },
        { label: 'Koyu Mavi', value: '#93c5fd' },
        { label: 'Koyu Yeşil', value: '#6ee7b7' },
        { label: 'Mercan', value: '#fecaca' },
        { label: 'Nane', value: '#a7f3d0' },
        { label: 'Gül', value: '#fbcfe8' },
        { label: 'Amber', value: '#fde68a' },
        { label: 'Taş', value: '#e2e8f0' },
        { label: 'Leylak', value: '#ddd6fe' }
    ];

    function renderSection(sec, idx) {
        var bgColor = sec.color || '#f1f5f9';
        var w = sec.pixelWidth || 560;
        // Find columns in this section
        var sectionCols = (sec.columnIds || []).map(function (cid) {
            return _columns.find(function (c) { return c.id === cid; });
        }).filter(Boolean);
        // Available columns not already in any section
        var usedColIds = [];
        _sections.forEach(function (s) { usedColIds = usedColIds.concat(s.columnIds || []); });
        var availableCols = _columns.filter(function (c) { return usedColIds.indexOf(c.id) === -1 || (sec.columnIds || []).indexOf(c.id) !== -1; });

        var isVertical = sec.vertical || false;
        var layoutIcon = isVertical
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="5" rx="1"/><rect x="3" y="10" width="18" height="5" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/></svg>'
            : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="18" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>';
        var layoutTitle = isVertical ? 'Yatay düzene geç' : 'Dikey düzene geç';
        var h = '<div class="board-section' + (isVertical ? ' board-section-vertical' : '') + '" data-section-id="' + sec.id + '" style="background:' + bgColor + ';width:' + w + 'px">';
        h += '<div class="board-section-header" title="Taşımak için sürükleyin">';
        h += '<div class="board-section-header-left">';
        h += '<span class="board-section-icon">' + ico('layers', 16) + '</span>';
        h += '<span class="board-section-name" id="sec-name-' + sec.id + '" data-section-id="' + sec.id + '" title="Düzenlemek için tıklayın">' + esc(sec.name) + '</span>';
        h += '</div>';
        h += '<div class="board-section-header-right">';
        h += '<button class="board-section-layout-btn" onclick="event.stopPropagation();Board.toggleSectionLayout(\'' + sec.id + '\')" title="' + layoutTitle + '">' + layoutIcon + '</button>';
        h += '<button class="board-section-add-btn" onclick="event.stopPropagation();Board.toggleSectionAddDropdown(\'' + sec.id + '\')" title="Liste ekle">' + ico('plus', 14) + '</button>';
        h += '<button class="board-section-delete-btn" onclick="event.stopPropagation();Board.deleteSection(\'' + sec.id + '\')" title="Bölümü sil">' + ico('x', 14) + '</button>';
        h += '</div>';
        // Add list dropdown
        h += '<div class="board-section-add-dropdown" id="sec-add-dd-' + sec.id + '">';
        if (availableCols.length === 0) {
            h += '<div class="board-section-add-dd-empty">Eklenecek liste yok</div>';
        } else {
            availableCols.forEach(function (col) {
                var inSec = (sec.columnIds || []).indexOf(col.id) !== -1;
                if (inSec) {
                    h += '<button class="board-section-add-dd-item active" onclick="Board.removeColFromSection(\'' + sec.id + '\',\'' + col.id + '\')">' + ico('x', 12) + ' ' + esc(col.name) + ' <span class="board-section-dd-hint">Çıkar</span></button>';
                } else {
                    h += '<button class="board-section-add-dd-item" onclick="Board.addColToSection(\'' + sec.id + '\',\'' + col.id + '\')">' + ico('plus', 12) + ' ' + esc(col.name) + '</button>';
                }
            });
        }
        h += '</div>';
        h += '</div>';
        // Section inner columns area
        h += '<div class="board-section-inner' + (isVertical ? ' board-section-inner-vertical' : '') + '" data-section-id="' + sec.id + '">';
        if (sectionCols.length === 0) {
            h += '<div class="board-section-empty">' + ico('layers', 28) + '<span>Listeleri sürükleyerek buraya bırakın</span><span class="board-section-empty-hint">veya sağ üstteki + butonunu kullanın</span></div>';
        } else {
            sectionCols.forEach(function (col, i) { h += renderCol(col, i); });
        }
        h += '</div>';
        h += '<div class="board-section-resize" data-section-id="' + sec.id + '"></div>';
        h += '</div>';
        return h;
    }

    function toggleSectionLayout(secId) {
        var sec = _sections.find(function (s) { return s.id === secId; });
        if (!sec) return;
        sec.vertical = !sec.vertical;
        saveSections();
        render();
    }

    function openNewSectionModal() {
        var html = '<div class="modal-overlay board-section-modal-overlay" id="board-section-modal" onclick="Board.closeNewSectionModal()">'
            + '<div class="board-section-modal-card" onclick="event.stopPropagation()">'
            + '<div class="board-section-modal-header">'
            + '<h3 class="board-section-modal-title">Yeni Bölüm</h3>'
            + '<button class="board-section-modal-close" onclick="Board.closeNewSectionModal()">' + ico('x', 18) + '</button>'
            + '</div>'
            + '<div class="board-section-modal-body">'
            + '<div class="board-section-modal-field">'
            + '<div class="board-create-input-row">'
            + '<span class="board-create-input-icon">' + ico('edit', 16) + '</span>'
            + '<input type="text" id="board-section-name-input" class="board-section-modal-input" placeholder="Bölüm adı" maxlength="50">'
            + '</div>'
            + '</div>'
            + '<div class="board-section-modal-field">'
            + '<label class="board-section-modal-label">Arka Plan</label>'
            + '<div class="board-section-color-grid" id="board-section-color-row"></div>'
            + '<div class="board-section-color-preview" id="board-section-preview"><span>Önizleme</span></div>'
            + '</div>'
            + '</div>'
            + '<div class="board-section-modal-footer">'
            + '<button class="btn btn-secondary" onclick="Board.closeNewSectionModal()">İptal</button>'
            + '<button class="btn btn-primary board-section-modal-create-btn" onclick="Board.saveNewSection()">' + ico('plus', 15) + ' Oluştur</button>'
            + '</div></div></div>';
        var c = document.getElementById('board-section-modal-container');
        if (!c) { c = document.createElement('div'); c.id = 'board-section-modal-container'; document.body.appendChild(c); }
        c.innerHTML = html;
        var cp = document.getElementById('board-section-color-row');
        var preview = document.getElementById('board-section-preview');
        if (cp) {
            var ch = '';
            SECTION_COLORS.forEach(function (sc, i) {
                ch += '<button class="board-section-color-swatch' + (i === 0 ? ' selected' : '') + '" data-color="' + sc.value + '" style="background:' + sc.value + '" title="' + sc.label + '" onclick="Board.selectSectionColor(this)"></button>';
            });
            cp.innerHTML = ch;
            if (preview) preview.style.background = SECTION_COLORS[0].value;
        }
        setTimeout(function () { var n = document.getElementById('board-section-name-input'); if (n) n.focus(); }, 100);
    }

    function closeNewSectionModal() {
        var c = document.getElementById('board-section-modal-container');
        if (c) c.innerHTML = '';
    }

    function selectSectionColor(el) {
        document.querySelectorAll('.board-section-color-swatch').forEach(function (d) { d.classList.remove('selected'); });
        el.classList.add('selected');
        var preview = document.getElementById('board-section-preview');
        if (preview) preview.style.background = el.dataset.color;
    }

    function saveNewSection() {
        var nameEl = document.getElementById('board-section-name-input');
        var name = nameEl ? nameEl.value.trim() : '';
        if (!name) { if (nameEl) { nameEl.style.borderColor = 'var(--color-danger)'; nameEl.focus(); } return; }
        var selColor = document.querySelector('.board-section-color-swatch.selected');
        var color = selColor ? selColor.dataset.color : SECTION_COLORS[0].value;
        var sec = { id: genId(), name: name, color: color, pixelWidth: 560, columnIds: [] };
        _sections.unshift(sec); // always leftmost
        saveSections(); render();
        closeNewSectionModal();
        if (typeof Toast !== 'undefined') Toast.show('"' + name + '" bölümü oluşturuldu', 'success');
    }

    function deleteSection(secId) {
        var sec = _sections.find(function (s) { return s.id === secId; });
        if (!sec) return;
        var listCount = (sec.columnIds || []).length;
        var html = '<div class="modal-overlay" onclick="Board.closeSectionDeleteModal()">'
            + '<div class="modal-content confirm-modal" onclick="event.stopPropagation()">'
            + '<div class="confirm-modal-icon">⚠️</div>'
            + '<h3 class="confirm-modal-title">Bölümü Silmek İstediğinizden Emin Misiniz?</h3>'
            + '<div class="confirm-modal-detail">'
            + '<div class="confirm-detail-row"><span class="confirm-detail-label">Bölüm:</span><span class="confirm-detail-value">' + esc(sec.name) + '</span></div>'
            + '<div class="confirm-detail-row"><span class="confirm-detail-label">İçindeki liste sayısı:</span><span class="confirm-detail-value">' + listCount + '</span></div>'
            + '</div>'
            + '<p class="confirm-modal-warning">Bölüm silinecek, içindeki listeler korunacaktır.</p>'
            + '<div class="confirm-modal-actions">'
            + '<button class="btn btn-secondary" onclick="Board.closeSectionDeleteModal()">İptal</button>'
            + '<button class="btn btn-danger" onclick="Board.doDeleteSection(\'' + secId + '\')">' + ico('trash', 14) + ' Sil</button>'
            + '</div></div></div>';
        var c = document.getElementById('board-section-delete-container');
        if (!c) { c = document.createElement('div'); c.id = 'board-section-delete-container'; document.body.appendChild(c); }
        c.innerHTML = html;
    }

    function closeSectionDeleteModal() {
        var c = document.getElementById('board-section-delete-container');
        if (c) c.innerHTML = '';
    }

    function doDeleteSection(secId) {
        _sections = _sections.filter(function (s) { return s.id !== secId; });
        saveSections(); render(); closeSectionDeleteModal();
        if (typeof Toast !== 'undefined') Toast.show('Bölüm silindi', 'info');
    }

    function toggleSectionAddDropdown(secId) {
        var dd = document.getElementById('sec-add-dd-' + secId);
        if (!dd) return;
        var wasOpen = dd.classList.contains('open');
        // Close all
        document.querySelectorAll('.board-section-add-dropdown.open').forEach(function (d) { d.classList.remove('open'); });
        if (!wasOpen) dd.classList.add('open');
    }

    function addColToSection(secId, colId) {
        var sec = _sections.find(function (s) { return s.id === secId; });
        if (!sec) return;
        if (!sec.columnIds) sec.columnIds = [];
        if (sec.columnIds.indexOf(colId) === -1) sec.columnIds.push(colId);
        saveSections(); render();
        if (typeof Toast !== 'undefined') Toast.show('Liste eklendi', 'success');
    }

    function removeColFromSection(secId, colId) {
        var sec = _sections.find(function (s) { return s.id === secId; });
        if (!sec) return;
        sec.columnIds = (sec.columnIds || []).filter(function (id) { return id !== colId; });
        saveSections(); render();
        if (typeof Toast !== 'undefined') Toast.show('Liste çıkarıldı', 'info');
    }

    function setupSectionDrag() {
        document.querySelectorAll('.board-section').forEach(function (secEl) {
            var header = secEl.querySelector('.board-section-header');
            if (!header) return;
            header.addEventListener('mousedown', function (e) {
                if (e.target.closest('.board-section-add-btn') || e.target.closest('.board-section-delete-btn') ||
                    e.target.closest('.board-section-add-dropdown') || e.target.closest('.board-section-name') ||
                    e.target.closest('.board-section-layout-btn')) return;
                e.preventDefault();
                var container = document.getElementById('board-columns');
                var scrollArea = document.querySelector('.board-scroll-area');
                var rect = secEl.getBoundingClientRect();
                var offsetX = e.clientX - rect.left;
                var offsetY = e.clientY - rect.top;
                var ph = document.createElement('div');
                ph.className = 'board-col-placeholder';
                ph.style.width = secEl.offsetWidth + 'px';
                ph.style.height = secEl.offsetHeight + 'px';
                secEl.classList.add('board-col-dragging');
                secEl.style.width = rect.width + 'px';
                secEl.style.position = 'fixed';
                secEl.style.top = rect.top + 'px';
                secEl.style.left = rect.left + 'px';
                secEl.style.zIndex = '999';
                document.body.style.cursor = 'grabbing';
                secEl.parentNode.insertBefore(ph, secEl);
                document.body.appendChild(secEl);
                var cAuto = null;
                function onMove(ev) {
                    secEl.style.left = (ev.clientX - offsetX) + 'px';
                    secEl.style.top = (ev.clientY - offsetY) + 'px';
                    if (scrollArea) {
                        var sr = scrollArea.getBoundingClientRect();
                        if (ev.clientX < sr.left + 60) { if (!cAuto) cAuto = setInterval(function () { scrollArea.scrollLeft -= 6; }, 16); }
                        else if (ev.clientX > sr.right - 60) { if (!cAuto) cAuto = setInterval(function () { scrollArea.scrollLeft += 6; }, 16); }
                        else { if (cAuto) { clearInterval(cAuto); cAuto = null; } }
                    }
                    var all = container.querySelectorAll('.board-section:not(.board-col-dragging), .board-col:not(.board-col-dragging), .board-col-placeholder');
                    for (var i = 0; i < all.length; i++) { var r = all[i].getBoundingClientRect(); if (ev.clientX < r.left + r.width / 2) { container.insertBefore(ph, all[i]); return; } }
                    container.appendChild(ph);
                }
                function onUp() {
                    document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp);
                    if (cAuto) { clearInterval(cAuto); cAuto = null; }
                    document.body.style.cursor = '';
                    container.insertBefore(secEl, ph); ph.remove();
                    secEl.classList.remove('board-col-dragging');
                    secEl.style.position = ''; secEl.style.top = ''; secEl.style.left = ''; secEl.style.zIndex = ''; secEl.style.width = '';
                    var newSections = [];
                    container.querySelectorAll('.board-section').forEach(function (el) {
                        var f = _sections.find(function (s) { return s.id === el.dataset.sectionId; });
                        if (f) newSections.push(f);
                    });
                    if (newSections.length === _sections.length) { _sections = newSections; saveSections(); }
                    render();
                }
                document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
            });
        });
    }

    function setupSectionResize() {
        document.querySelectorAll('.board-section-resize').forEach(function (handle) {
            handle.addEventListener('mousedown', function (e) {
                e.preventDefault();
                var secEl = handle.closest('.board-section');
                var secId = handle.dataset.sectionId;
                var startX = e.clientX;
                var startW = secEl.offsetWidth;
                function onMove(ev) {
                    var newW = Math.max(320, startW + (ev.clientX - startX));
                    secEl.style.width = newW + 'px';
                }
                function onUp(ev) {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    document.body.classList.remove('board-resizing');
                    var sec = _sections.find(function (s) { return s.id === secId; });
                    if (sec) { sec.pixelWidth = secEl.offsetWidth; saveSections(); }
                }
                document.body.classList.add('board-resizing');
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        });
    }

    /* ===== Dropdown ===== */
    function openNewListDropdown() {
        var dd = document.getElementById('board-new-list-dropdown');
        if (dd) dd.classList.toggle('open');
    }
    function closeNewListDropdown() {
        var dd = document.getElementById('board-new-list-dropdown');
        if (dd) dd.classList.remove('open');
    }

    /* ===== Helpers ===== */
    function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
    function fmtMoney(n) { return Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function hexToRgba(hex, alpha) {
        var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }
    function getColumns() { load(); return _columns; }

    // Close menus on outside click
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.board-col-menu-btn') && !e.target.closest('.board-col-menu'))
            document.querySelectorAll('.board-col-menu.open').forEach(function (m) { m.classList.remove('open'); });
        if (!e.target.closest('.board-item-more-btn') && !e.target.closest('.board-item-menu'))
            closeAllItemMenus();
        if (!e.target.closest('#board-new-list-dropdown') && !e.target.closest('#section-action-btn') && !e.target.closest('#board-section-btn'))
            closeNewListDropdown();
        if (!e.target.closest('.board-section-add-btn') && !e.target.closest('.board-section-add-dropdown'))
            document.querySelectorAll('.board-section-add-dropdown.open').forEach(function (d) { d.classList.remove('open'); });
    });

    /* setupSectionDropZone — column drop is now handled in setupColumnDrag */
    function setupSectionDropZone() { /* no-op, integrated into setupColumnDrag */ }

    /* ===== Drag columns OUT of a section (or between sections) ===== */
    function setupSectionColDrag() {
        var container = document.getElementById('board-columns');
        var scrollArea = document.querySelector('.board-scroll-area');
        if (!container) return;

        document.querySelectorAll('.board-section .board-col').forEach(function (colEl) {
            var header = colEl.querySelector('.board-col-header');
            if (!header) return;

            header.addEventListener('mousedown', function (e) {
                if (e.target.closest('.board-col-menu-btn') || e.target.closest('.board-col-menu') || e.target.closest('.board-col-name')) return;
                e.preventDefault();

                var fromSecInner = colEl.closest('.board-section-inner');
                var fromSecId = fromSecInner ? fromSecInner.dataset.sectionId : null;
                var colId = colEl.dataset.colId;

                var rect = colEl.getBoundingClientRect();
                var offsetX = e.clientX - rect.left;
                var offsetY = e.clientY - rect.top;

                var ph = document.createElement('div');
                ph.className = 'board-col-placeholder';
                ph.style.width = colEl.offsetWidth + 'px';
                ph.style.height = colEl.offsetHeight + 'px';

                colEl.classList.add('board-col-dragging');
                colEl.style.width = rect.width + 'px';
                colEl.style.position = 'fixed';
                colEl.style.top = rect.top + 'px';
                colEl.style.left = rect.left + 'px';
                colEl.style.zIndex = '999';
                colEl.parentNode.insertBefore(ph, colEl);
                document.body.appendChild(colEl);

                var cAuto = null;
                var _hoverSection = null;

                function findSectionUnder(x, y) {
                    var zones = document.querySelectorAll('.board-section-inner');
                    for (var i = 0; i < zones.length; i++) {
                        var r = zones[i].getBoundingClientRect();
                        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return zones[i];
                    }
                    var secs = document.querySelectorAll('.board-section');
                    for (var j = 0; j < secs.length; j++) {
                        var sr = secs[j].getBoundingClientRect();
                        if (x >= sr.left && x <= sr.right && y >= sr.top && y <= sr.bottom) {
                            return secs[j].querySelector('.board-section-inner');
                        }
                    }
                    return null;
                }

                function cleanup() {
                    colEl.classList.remove('board-col-dragging');
                    colEl.style.position = ''; colEl.style.top = ''; colEl.style.left = ''; colEl.style.zIndex = '';
                    if (_hoverSection) { _hoverSection.classList.remove('board-section-drop-hover'); _hoverSection = null; }
                    if (cAuto) { clearInterval(cAuto); cAuto = null; }
                }

                function onMove(ev) {
                    colEl.style.left = (ev.clientX - offsetX) + 'px';
                    colEl.style.top = (ev.clientY - offsetY) + 'px';
                    if (scrollArea) {
                        var sr = scrollArea.getBoundingClientRect();
                        if (ev.clientX < sr.left + 60) { if (!cAuto) cAuto = setInterval(function () { scrollArea.scrollLeft -= 6; }, 16); }
                        else if (ev.clientX > sr.right - 60) { if (!cAuto) cAuto = setInterval(function () { scrollArea.scrollLeft += 6; }, 16); }
                        else { if (cAuto) { clearInterval(cAuto); cAuto = null; } }
                    }
                    var zone = findSectionUnder(ev.clientX, ev.clientY);
                    if (zone !== _hoverSection) {
                        if (_hoverSection) _hoverSection.classList.remove('board-section-drop-hover');
                        _hoverSection = zone;
                        if (_hoverSection) _hoverSection.classList.add('board-section-drop-hover');
                    }
                }

                function onUp(ev) {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    if (cAuto) { clearInterval(cAuto); cAuto = null; }
                    if (_hoverSection) _hoverSection.classList.remove('board-section-drop-hover');

                    var zone = findSectionUnder(ev.clientX, ev.clientY);
                    var toSecId = zone ? zone.dataset.sectionId : null;

                    ph.remove();
                    if (colEl.parentNode === document.body) colEl.remove();
                    cleanup();

                    if (toSecId && toSecId !== fromSecId) {
                        // Move to another section
                        _sections.forEach(function (s) {
                            s.columnIds = (s.columnIds || []).filter(function (id) { return id !== colId; });
                        });
                        var toSec = _sections.find(function (s) { return s.id === toSecId; });
                        if (toSec) {
                            if (!toSec.columnIds) toSec.columnIds = [];
                            toSec.columnIds.push(colId);
                        }
                        saveSections(); render();
                        if (typeof Toast !== 'undefined') Toast.show('Liste taşındı', 'success');
                    } else if (!zone) {
                        // Dropped outside any section — remove from current section
                        _sections.forEach(function (s) {
                            s.columnIds = (s.columnIds || []).filter(function (id) { return id !== colId; });
                        });
                        saveSections(); render();
                        if (typeof Toast !== 'undefined') Toast.show('Liste bölümden çıkarıldı', 'info');
                    } else {
                        // Dropped back in same section — no change
                        render();
                    }
                }

                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        });
    }

    return {
        init: init, render: render, createColumn: createColumn, deleteColumn: deleteColumn,
        doDeleteColumn: doDeleteColumn, closeDeleteModal: closeDeleteModal,
        startRename: startRename, toggleColMenu: toggleColMenu,
        openAddModal: openAddModal, closeAddModal: closeAddModal,
        onProgressRangeInput: onProgressRangeInput,
        toggleItem: toggleItem, deleteItem: deleteItem, setProgress: setProgress, save: save,
        openNewListDropdown: openNewListDropdown, closeNewListDropdown: closeNewListDropdown,
        openItemDetail: openItemDetail, closeItemDetail: closeItemDetail,
        openCustomListModal: openCustomListModal, closeCustomModal: closeCustomModal,
        selectCustomColor: selectCustomColor, saveCustomList: saveCustomList,
        getColumns: getColumns,
        openNewSectionModal: openNewSectionModal, closeNewSectionModal: closeNewSectionModal,
        selectSectionColor: selectSectionColor, saveNewSection: saveNewSection,
        deleteSection: deleteSection, closeSectionDeleteModal: closeSectionDeleteModal,
        doDeleteSection: doDeleteSection,
        toggleSectionAddDropdown: toggleSectionAddDropdown,
        addColToSection: addColToSection, removeColFromSection: removeColFromSection,
        startSectionRename: startSectionRename,
        saveSpecialized: saveSpecialized,
        toggleCustomFields: toggleCustomFields,
        onCustomFileChange: onCustomFileChange,
        toggleSectionLayout: toggleSectionLayout,
        openEditItemModal: openEditItemModal,
        closeEditItemModal: closeEditItemModal,
        toggleEditField: toggleEditField,
        saveEditItem: saveEditItem,
        /* Item context menu */
        toggleItemMenu: toggleItemMenu,
        closeAllItemMenus: closeAllItemMenus,
        /* Share modal */
        openShareModal: openShareModal,
        closeShareModal: closeShareModal,
        openTeamSharePage: openTeamSharePage,
        backToShareMain: backToShareMain,
        shareToWhatsApp: shareToWhatsApp,
        shareToTelegram: shareToTelegram,
        shareToMember: shareToMember,
        shareToTeam: shareToTeam,
        selectShareTarget: selectShareTarget,
        confirmShare: confirmShare,
        /* Progress update modal */
        openProgressUpdateModal: openProgressUpdateModal,
        closeProgressModal: closeProgressModal,
        onProgressInput: onProgressInput,
        saveProgressUpdate: saveProgressUpdate
    };
})();
