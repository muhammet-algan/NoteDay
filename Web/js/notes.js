var Notes = (function () {
    'use strict';

    var STORAGE_KEY = 'user_notes';
    var _pendingDeleteId = null;
    var MAX_PHOTOS = 5;
    var _tempPhotos = [];      // Modal açıkken tutulan fotoğraflar (base64)
    var noteComments = [];
    var showNoteCommentInput = false;
    var visibleReplies = {};
    var activeReplyInput = null;
    var selectedLocation = null;
    var searchTimeout = null;

    function autoExpandTextarea(textarea) {
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    // Notları localStorage'dan al
    function getNotes() {
        var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
        if (!user) return [];
        try {
            var subSuffix = '';
            var currentSection = localStorage.getItem('app_current_section');
            if (currentSection && (currentSection.indexOf('team_instance_') === 0 || currentSection.indexOf('notes_instance_') === 0)) {
                subSuffix = '_' + currentSection;
            } else if (typeof App !== 'undefined' && App.activeSubSection && App.activeSubSection['notes']) {
                subSuffix = '_' + App.activeSubSection['notes'];
            }
            var data = localStorage.getItem(STORAGE_KEY + subSuffix + '_' + user.email);
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    }

    // Notları localStorage'a kaydet
    function saveNotes(notes) {
        var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
        if (!user) return;
        try {
            var subSuffix = '';
            var currentSection = localStorage.getItem('app_current_section');
            if (currentSection && (currentSection.indexOf('team_instance_') === 0 || currentSection.indexOf('notes_instance_') === 0)) {
                subSuffix = '_' + currentSection;
            } else if (typeof App !== 'undefined' && App.activeSubSection && App.activeSubSection['notes']) {
                subSuffix = '_' + App.activeSubSection['notes'];
            }
            localStorage.setItem(STORAGE_KEY + subSuffix + '_' + user.email, JSON.stringify(notes));
        } catch (e) { }
    }

    // Benzersiz ID oluştur
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // Tarih formatlama
    function formatDate(dateStr) {
        var d = new Date(dateStr);
        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function formatDateTime(dateStr) {
        var d = new Date(dateStr);
        var pad = function(n) { return n < 10 ? '0' + n : n; };
        var datePart = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        var timePart = pad(d.getHours()) + ':' + pad(d.getMinutes());
        return datePart + ', ' + timePart;
    }

    function getDOMTitleFontFamily(titleInput) {
        if (!titleInput) return 'Outfit';
        var font = titleInput.style.fontFamily || '';
        if (font.indexOf('Lobster') !== -1) return 'Lobster';
        if (font.indexOf('Bungee') !== -1) return 'Bungee';
        return 'Outfit';
    }

    // HTML kaçışı
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function getNoteIconHtml(note) {
        if (note.icon && typeof App !== 'undefined' && App.CUSTOM_ICONS && App.CUSTOM_ICONS[note.icon]) {
            return App.CUSTOM_ICONS[note.icon].replace('width="14" height="14"', 'width="20" height="20"').replace('stroke-width="2"', 'stroke-width="1.5"');
        }
        // Default document-with-lines icon for Notes
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
    }

    // Not kartlarını render et
    function render() {
        var container = document.getElementById('notes-grid');
        if (!container) return;

        var notes = getNotes();

        if (notes.length === 0) {
            container.innerHTML =
                '<div class="notes-empty">' +
                '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>' +
                '<polyline points="14 2 14 8 20 8"/>' +
                '<line x1="16" y1="13" x2="8" y2="13"/>' +
                '<line x1="16" y1="17" x2="8" y2="17"/>' +
                '</svg>' +
                '<p>Henüz notunuz yok</p>' +
                '<span>İlk notunuzu eklemek için + butonuna tıklayın</span>' +
                '</div>';
            return;
        }

        // Load customizer layout and options state
        var layout = localStorage.getItem('notes_cust_layout') || 'simple';
        var options = {
            columns: 3, // Default for notes is 3
            propertyIcons: true,
            showDate: true
        };
        try {
            var saved = localStorage.getItem('notes_cust_options');
            if (saved) {
                var parsed = JSON.parse(saved);
                for (var k in parsed) {
                    options[k] = parsed[k];
                }
            }
        } catch (e) {}

        // Show/hide sidebar widgets and modify notes-layout grid template
        var layoutEl = document.querySelector('.notes-layout');
        var sidebarEl = document.querySelector('.notes-sidebar');
        var calendarWidget = document.querySelector('.calendar-widget.notes-calendar');
        var specialDaysWidget = document.getElementById('notes-special-days');
        
        var showCalendar = options.calendar !== false;
        var showSpecialDays = options.specialDays !== false;
        
        if (calendarWidget) {
            calendarWidget.style.display = showCalendar ? 'block' : 'none';
        }
        if (specialDaysWidget) {
            specialDaysWidget.style.display = showSpecialDays ? 'block' : 'none';
        }
        
        if (sidebarEl) {
            var showSidebar = showCalendar || showSpecialDays;
            sidebarEl.style.display = showSidebar ? 'block' : 'none';
            
            if (layoutEl) {
                if (showSidebar) {
                    layoutEl.style.display = 'grid';
                    layoutEl.style.gridTemplateColumns = '1fr 280px';
                } else {
                    layoutEl.style.display = 'block';
                }
            }
        }

        // Initialize notes calendar
        if (window.NotesCalendar) NotesCalendar.render();

        // Apply grid column layout styles
        var cols = options.columns || 3;
        if (layout === 'list' || cols === 1) {
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gridTemplateColumns = 'none';
            if (layout === 'list') {
                container.classList.add('list-layout-active');
            } else {
                container.classList.remove('list-layout-active');
            }
        } else {
            container.style.display = 'grid';
            container.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
            container.style.flexDirection = 'none';
            container.classList.remove('list-layout-active');
        }

        /* Drag & Drop: kayıtlı sıraya göre sırala */
        var orderKey = 'personal-notes';
        var currentSection = localStorage.getItem('app_current_section');
        if (currentSection && (currentSection.indexOf('team_instance_') === 0 || currentSection.indexOf('notes_instance_') === 0)) {
            orderKey = 'team-notes-' + currentSection;
        }
        notes = (typeof DragDrop !== 'undefined') ? DragDrop.applySavedOrder(notes, orderKey) : notes;

        var html = '';
        notes.forEach(function (note) {
            var photoCount = (note.photos && note.photos.length) || 0;
            var commentCount = (note.comments && note.comments.length) || 0;

            if (layout === 'list') {
                // List layout - flat list view with icon, title, date
                var iconSvg = getNoteIconHtml(note);
                var titleStyle = 'font-weight: ' + ((note.isBold !== false) ? '700' : '400') + '; ' +
                    'font-style: ' + (note.isItalic ? 'italic' : 'normal') + '; ' +
                    'text-decoration: ' + (note.isUnderline ? 'underline' : 'none') + '; ' +
                    'font-family: ' + getFontFamilyStyle(note.fontFamily || 'Outfit') + '; ' +
                    'color: ' + (note.textColor || 'var(--color-text)') + ';';
                var commentHtml = '';
                if (commentCount > 0) {
                    commentHtml = '  <span class="list-view-item-comment-badge" style="display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--color-text-secondary, #64748b); flex-shrink: 0; margin-left: 4px; line-height: 1;">' +
                                  '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-tertiary, #94a3b8); display: inline-block; vertical-align: middle;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="8" y1="9" x2="16" y2="9"></line><line x1="8" y1="13" x2="14" y2="13"></line></svg>' +
                                  '    <span style="font-weight: 500;">' + commentCount + '</span>' +
                                  '  </span>';
                }
                html +=
                    '<div class="list-view-item" data-drag-id="' + note.id + '" data-note-id="' + note.id + '" draggable="true" onclick="Notes.openDetail(\'' + note.id + '\')">' +
                    '  <div class="list-view-item-icon">' + iconSvg + '</div>' +
                    '  <div class="list-view-item-title-wrapper" style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0;">' +
                    '    <span class="list-view-item-title" style="flex: 0 1 auto !important; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; ' + titleStyle + '">' + escapeHtml(note.title || 'Başlıksız') + '</span>' +
                    commentHtml +
                    '  </div>' +
                    (options.showDate !== false ? '  <span class="list-view-item-date">' + formatDate(note.createdAt) + '</span>' : '') +
                    '  <div class="list-view-item-actions" onclick="event.stopPropagation();">' +
                    '    <button class="list-view-item-more-btn" onclick="Notes.toggleMenu(event, \'' + note.id + '\')" title="İşlemler">' +
                    '      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>' +
                    '    </button>' +
                    '    <div id="list-view-menu-' + note.id + '" class="list-view-item-dropdown">' +
                    '      <div class="list-view-item-dropdown-item" onclick="Notes.handleMenuAction(\'edit\', \'' + note.id + '\')">' +
                    '        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
                    '        <span>Düzenle</span>' +
                    '      </div>' +
                    '      <div class="list-view-item-dropdown-item" onclick="Notes.handleMenuAction(\'share\', \'' + note.id + '\')">' +
                    '        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' +
                    '        <span>Paylaş</span>' +
                    '      </div>' +
                    '      <div class="list-view-item-dropdown-item delete" onclick="Notes.handleMenuAction(\'delete\', \'' + note.id + '\')">' +
                    '        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>' +
                    '        <span>Sil</span>' +
                    '      </div>' +
                    '    </div>' +
                    '  </div>' +
                    '</div>';
            } else if (layout === 'split') {
                // Tablo design
                var editDeleteHtml = 
                    '<div class="tablo-card-actions" style="display: flex; gap: 8px; margin-left: auto;">' +
                    '  <button class="tablo-action-btn edit-btn" onclick="event.stopPropagation(); Notes.closeDetail(); Notes.openEditModal(\'' + note.id + '\')" style="background:#ffffff; border:1px solid var(--color-border, #cbd5e1); border-radius:6px; padding:6px; display:flex; align-items:center; justify-content:center; color:var(--color-text-secondary); cursor:pointer;">' +
                    '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
                    '  </button>' +
                    '  <button class="tablo-action-btn delete-btn" onclick="event.stopPropagation(); Notes.confirmDelete(\'' + note.id + '\')" style="background:#ffffff; border:1px solid var(--color-border, #cbd5e1); border-radius:6px; padding:6px; display:flex; align-items:center; justify-content:center; color:var(--color-text-secondary); cursor:pointer;">' +
                    '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>' +
                    '  </button>' +
                    '</div>';

                var imageHtml = '';
                if (note.photos && note.photos.length > 0) {
                    imageHtml = '<div class="tablo-card-image" style="margin-top: 12px; border-radius: 8px; overflow: hidden; height: 120px;">' +
                                '  <img src="' + note.photos[0] + '" style="width: 100%; height: 100%; object-fit: cover;" alt="Note Image">' +
                                '</div>';
                }

                var commentHtml = '';
                if (commentCount > 0) {
                    commentHtml = '    <span class="tablo-comment-badge" style="background: var(--color-bg-subtle, #f1f5f9); color: var(--color-text-secondary, #475569); border: 1px solid var(--color-border-subtle, #e2e8f0); padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;">' +
                                  '      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-tertiary, #94a3b8);"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="8" y1="9" x2="16" y2="9"></line><line x1="8" y1="13" x2="14" y2="13"></line></svg>' +
                                  '      <span>' + commentCount + '</span>' +
                                  '    </span>';
                }

                    var titleStyle = 'font-size: 18px; font-weight: ' + ((note.isBold !== false) ? '700' : '400') + '; ' +
                        'font-style: ' + (note.isItalic ? 'italic' : 'normal') + '; ' +
                        'text-decoration: ' + (note.isUnderline ? 'underline' : 'none') + '; ' +
                        'font-family: ' + getFontFamilyStyle(note.fontFamily || 'Outfit') + '; ' +
                        'color: ' + (note.textColor || 'var(--color-text, #0f172a)') + '; ' +
                        'margin-bottom: 8px;';
                html +=
                    '<div class="note-card tablo-style-card" data-drag-id="' + note.id + '" onclick="Notes.openDetail(\'' + note.id + '\')">' +
                    '  <div class="tablo-card-top-row" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; width: 100%;">' +
                    (options.showDate !== false ? '    <span class="tablo-date-badge" style="background: #2b3139; color: #ffffff; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; white-space: nowrap;">' + formatDate(note.createdAt) + '</span>' : '') +
                    commentHtml +
                    editDeleteHtml +
                    '  </div>' +
                    '  <div style="border-top: 1px solid var(--color-border-subtle, #e2e8f0); margin: 0 -18px 12px -18px;"></div>' +
                    '  <div class="note-card-body" style="flex:1;">' +
                    '    <h3 class="diary-card-title" style="' + titleStyle + '">' + escapeHtml(note.title || 'Başlıksız') + '</h3>' +
                    (note.description ? '    <p class="diary-card-desc" style="font-size: 13px; color: var(--color-text-secondary, #475569); line-height: 1.5;">' + parseDescription(note, true) + '</p>' : '') +
                    imageHtml +
                    '  </div>' +
                    '</div>';
            } else {
                // Default notes layout
                var commentHtml = '';
                if (commentCount > 0) {
                    commentHtml = '<span class="note-card-comment-badge" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--color-text-secondary, #64748b); font-weight: 500; margin-right: 4px;">' +
                                  '  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-tertiary, #94a3b8); vertical-align: middle;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="8" y1="9" x2="16" y2="9"></line><line x1="8" y1="13" x2="14" y2="13"></line></svg>' +
                                  '  <span>' + commentCount + '</span>' +
                                  '</span>';
                }

                var titleStyle = 'font-weight: ' + ((note.isBold !== false) ? '700' : '400') + '; ' +
                    'font-style: ' + (note.isItalic ? 'italic' : 'normal') + '; ' +
                    'text-decoration: ' + (note.isUnderline ? 'underline' : 'none') + '; ' +
                    'font-family: ' + getFontFamilyStyle(note.fontFamily || 'Outfit') + '; ' +
                    'color: ' + (note.textColor || 'var(--color-text)') + ';';

                html +=
                    '<div class="note-card" data-drag-id="' + note.id + '" onclick="Notes.openDetail(\'' + note.id + '\')">' +
                    '<div class="note-card-body">' +
                    '<h3 class="note-card-title" style="' + titleStyle + '">' + escapeHtml(note.title) + '</h3>' +
                    (note.description ? '<p class="note-card-desc">' + parseDescription(note, true) + '</p>' : '') +
                    '</div>' +
                    '<div class="note-card-footer" style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">' +
                    '<div class="note-card-footer-left" style="display: flex; align-items: center; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; flex: 1;"></div>' +
                    '<div class="note-card-footer-right" style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">' +
                    (photoCount > 0 ?
                        '<span class="note-card-photo-badge" style="margin-right: 12px;">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>' +
                        '<circle cx="8.5" cy="8.5" r="1.5"/>' +
                        '<polyline points="21 15 16 10 5 21"/>' +
                        '</svg> ' + photoCount +
                        '</span>' : '') +
                    commentHtml +
                    (options.showDate !== false ? '<span class="note-card-date">' + formatDate(note.createdAt) + '</span>' : '') +
                    '</div>' +
                    '</div>' +
                    '</div>';
            }
        });

        container.innerHTML = html;

        /* Drag & Drop init */
        if (typeof DragDrop !== 'undefined') {
            var orderKey = 'personal-notes';
            var currentSection = localStorage.getItem('app_current_section');
            if (currentSection && (currentSection.indexOf('team_instance_') === 0 || currentSection.indexOf('notes_instance_') === 0)) {
                orderKey = 'team-notes-' + currentSection;
            }
            DragDrop.init(container, orderKey);
        }

        /* Not → Sidebar sürükle-bırak: her liste öğesine dragstart ekle */
        var listItems = container.querySelectorAll('.list-view-item[data-note-id]');
        listItems.forEach(function (el) {
            el.addEventListener('dragstart', function (e) {
                var noteId = el.getAttribute('data-note-id');
                e.dataTransfer.setData('application/notum-note-id', noteId);
                e.dataTransfer.effectAllowed = 'copy';
                el.classList.add('note-dragging-to-sidebar');
            });
            el.addEventListener('dragend', function () {
                el.classList.remove('note-dragging-to-sidebar');
                /* Sidebar hedef göstergesini temizle */
                var sidebar = document.querySelector('.sidebar');
                if (sidebar) sidebar.classList.remove('sidebar-note-drop-active');
                var indicator = document.getElementById('sidebar-note-drop-indicator');
                if (indicator) indicator.remove();
            });
        });
    }

    // ===== FOTOĞRAF YÖNETİMİ =====

    function renderPhotoPreview() {
        var container = document.getElementById('note-photo-preview');
        var dropzone = document.getElementById('note-photo-add-btn');
        if (!container) return;

        if (_tempPhotos.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            if (dropzone) dropzone.style.display = '';
            return;
        }

        // Fotoğraf varsa dropzone gizle, thumbnail satırı göster
        if (dropzone) dropzone.style.display = 'none';
        container.style.display = 'flex';

        var html = '';
        _tempPhotos.forEach(function (photo, index) {
            html +=
                '<div class="note-photo-thumb">' +
                '<img src="' + photo + '" alt="Fotoğraf ' + (index + 1) + '">' +
                '<button class="note-photo-remove" onclick="event.stopPropagation(); Notes.removePhoto(' + index + ')" title="Kaldır">' +
                '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">' +
                '<line x1="18" y1="6" x2="6" y2="18"/>' +
                '<line x1="6" y1="6" x2="18" y2="18"/>' +
                '</svg>' +
                '</button>' +
                '</div>';
        });

        // 5'ten az fotoğraf varsa inline + butonu ekle
        if (_tempPhotos.length < MAX_PHOTOS) {
            html +=
                '<div class="note-photo-add-inline" onclick="Notes.triggerPhotoUpload()" title="Fotoğraf ekle">' +
                '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
                '<line x1="12" y1="5" x2="12" y2="19"/>' +
                '<line x1="5" y1="12" x2="19" y2="12"/>' +
                '</svg>' +
                '</div>';
        }

        container.innerHTML = html;
        autoSaveNote();
    }

    function triggerPhotoUpload() {
        if (_tempPhotos.length >= MAX_PHOTOS) {
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show('En fazla ' + MAX_PHOTOS + ' fotoğraf ekleyebilirsiniz', 'error');
            }
            return;
        }
        var input = document.getElementById('note-photo-input');
        if (input) input.click();
    }

    function handlePhotoSelect(event) {
        var files = event.target.files;
        if (!files || files.length === 0) return;

        var remaining = MAX_PHOTOS - _tempPhotos.length;
        var toProcess = Math.min(files.length, remaining);

        for (var i = 0; i < toProcess; i++) {
            (function (file) {
                if (!file.type.startsWith('image/')) return;
                var reader = new FileReader();
                reader.onload = function (e) {
                    // Fotoğrafı sıkıştır (max 400px)
                    compressImage(e.target.result, 400, function (compressed) {
                        _tempPhotos.push(compressed);
                        renderPhotoPreview();
                    });
                };
                reader.readAsDataURL(file);
            })(files[i]);
        }

        // Input'u sıfırla (aynı dosyayı tekrar seçebilmek için)
        event.target.value = '';
    }

    function compressImage(dataUrl, maxSize, callback) {
        var img = new Image();
        img.onload = function () {
            var canvas = document.createElement('canvas');
            var w = img.width;
            var h = img.height;
            if (w > maxSize || h > maxSize) {
                if (w > h) {
                    h = Math.round(h * maxSize / w);
                    w = maxSize;
                } else {
                    w = Math.round(w * maxSize / h);
                    h = maxSize;
                }
            }
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            callback(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = dataUrl;
    }

    function removePhoto(index) {
        _tempPhotos.splice(index, 1);
        renderPhotoPreview();
    }

    function openModal() {
        if (localStorage.getItem('notion_lock_page_preference') === 'true') {
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show("Bu sayfa kilitli. Düzenlemek için kilidi açın.", "warning");
            }
            return;
        }
        var overlay = document.getElementById('note-modal-overlay');
        if (!overlay) return;
        overlay.setAttribute('data-is-new', 'true');

        // Başlık
        var headerEl = overlay.querySelector('.reminder-modal-header h3');
        var currentSection = localStorage.getItem('app_current_section');
        var isTeamInstance = currentSection && currentSection.indexOf('team_instance_') === 0;
        if (headerEl) headerEl.textContent = isTeamInstance ? 'Yeni Sayfa' : 'Yeni Not';

        var dateVal = document.getElementById('note-property-date');
        if (dateVal) dateVal.textContent = formatDate(new Date().toISOString());

        // Düzenlenme Tarihini Gizle
        var updatedRow = document.getElementById('note-property-updated-row');
        if (updatedRow) updatedRow.style.display = 'none';

        // Custom properties temizle
        var customPropsContainer = document.getElementById('note-custom-properties');
        if (customPropsContainer) {
            var customRows = customPropsContainer.querySelectorAll('.notum-property-row:not([data-property-type="location"]):not([data-property-type="date"]):not([data-property-type="updated-date"])');
            for (var i = 0; i < customRows.length; i++) {
                customRows[i].remove();
            }
        }

        // Default properties sıfırla
        var locRow = document.getElementById('note-property-location-row');
        if (locRow) locRow.style.display = 'none';

        // Konumu Sıfırla
        selectedLocation = null;
        var propLoc = document.getElementById('note-property-location');
        if (propLoc) {
            propLoc.textContent = 'Konum Ekle';
            propLoc.classList.add('notum-property-value-empty');
        }
        var locLabelSpan = document.querySelector('#note-property-location-row .notum-property-label span');
        if (locLabelSpan) locLabelSpan.textContent = 'Konum';
        var locSvg = document.querySelector('#note-property-location-row .notum-property-label svg');
        if (locSvg) {
            locSvg.outerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
        }

        var titleInput = document.getElementById('note-title-input');
        var descInput = document.getElementById('note-desc-input');
        if (titleInput) {
            titleInput.value = '';
            titleInput.placeholder = isTeamInstance ? 'Yeni Sayfa' : 'Yeni not';
            titleInput.style.fontFamily = getFontFamilyStyle('Outfit');
            titleInput.style.setProperty('color', '#334155', 'important');
            titleInput.style.fontWeight = '400';
            titleInput.style.fontStyle = 'normal';
            titleInput.style.textDecoration = 'none';
        }
        if (descInput) {
            descInput.innerHTML = '';
        }

        // Kaydet butonunu yeni not moduna ayarla
        var saveBtn = document.getElementById('note-save-btn');
        if (saveBtn) saveBtn.setAttribute('onclick', 'Notes.saveNote()');

        // Editing ID'yi temizle
        overlay.removeAttribute('data-editing-id');

        // Fotoğrafları temizle
        _tempPhotos = [];
        renderPhotoPreview();

        noteComments = [];
        showNoteCommentInput = false;
        renderNoteComments();

        // Emoji seçiciyi kapat/sıfırla
        var emojiPicker = document.getElementById('note-emoji-picker');
        if (emojiPicker) emojiPicker.style.display = 'none';
        var wrapper = emojiPicker ? emojiPicker.closest('.diary-textarea-wrapper') : null;
        if (wrapper) wrapper.classList.remove('emoji-picker-open');

        if (customPropsContainer) {
            PropertyMenu.initDragAndDrop(customPropsContainer, 'notes');
        }
        overlay.style.display = 'flex';
        requestAnimationFrame(function () {
            overlay.classList.add('active');
        });

        if (typeof App !== 'undefined' && App.updateHeaderActiveItem) {
            App.updateHeaderActiveItem(isTeamInstance ? 'Yeni Sayfa' : 'Yeni Not');
        }

        if (titleInput) setTimeout(function () { titleInput.focus(); }, 200);
    }

    function closeModal() {
        var overlay = document.getElementById('note-modal-overlay');
        if (!overlay) return;

        var isNew = overlay.getAttribute('data-is-new') === 'true';
        if (isNew) {
            var editingId = overlay.getAttribute('data-editing-id');
            var titleInput = document.getElementById('note-title-input');
            var descInput = document.getElementById('note-desc-input');
            var title = titleInput ? titleInput.value.trim() : '';
            var description = descInput ? descInput.innerHTML : '';
            if (description === '<br>' || description === '<div><br></div>') description = '';
            description = description.trim();
            if (editingId && !title && !description) {
                var notes = getNotes();
                notes = notes.filter(function (n) { return String(n.id) !== String(editingId); });
                saveNotes(notes);
                render();
            }
        }
        overlay.removeAttribute('data-is-new');

        overlay.classList.remove('active');

        // Emoji seçiciyi kapat/sıfırla
        var emojiPicker = document.getElementById('note-emoji-picker');
        if (emojiPicker) emojiPicker.style.display = 'none';
        var wrapper = emojiPicker ? emojiPicker.closest('.diary-textarea-wrapper') : null;
        if (wrapper) wrapper.classList.remove('emoji-picker-open');

        if (typeof App !== 'undefined' && App.updateHeaderActiveItem) {
            App.updateHeaderActiveItem('Not Başlıkları');
        }

        setTimeout(function () {
            overlay.style.display = 'none';
        }, 200);
    }

    // ===== DÜZENLEME MODALİ =====

    function openEditModal(id) {
        if (localStorage.getItem('notion_lock_page_preference') === 'true') {
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show("Bu sayfa kilitli. Düzenlemek için kilidi açın.", "warning");
            }
            return;
        }
        var notes = getNotes();
        var note = notes.find(function (n) { return n.id === id; });
        if (!note) return;

        createVersionCheckpoint(id, true);

        var overlay = document.getElementById('note-modal-overlay');
        if (!overlay) return;
        overlay.removeAttribute('data-is-new');

        // Başlığı düzenleme moduna ayarla
        var headerEl = overlay.querySelector('.reminder-modal-header h3');
        if (headerEl) headerEl.textContent = 'Notu Düzenle';

        var dateVal = document.getElementById('note-property-date');
        if (dateVal && note.createdAt) dateVal.textContent = formatDate(note.createdAt);

        // Düzenlenme Tarihi
        var updatedRow = document.getElementById('note-property-updated-row');
        var updatedDateVal = document.getElementById('note-property-updated-date');
        if (updatedRow && updatedDateVal) {
            updatedDateVal.innerHTML = formatDateTime(note.updatedAt || note.createdAt);
            updatedRow.style.display = '';
        }

        // Konum
        selectedLocation = note.location || null;
        var propLoc = document.getElementById('note-property-location');
        if (propLoc) {
            if (note.location) {
                propLoc.textContent = note.location;
                propLoc.classList.remove('notum-property-value-empty');
            } else {
                propLoc.textContent = 'Konum Ekle';
                propLoc.classList.add('notum-property-value-empty');
            }
        }
        var locLabelSpan = document.querySelector('#note-property-location-row .notum-property-label span');
        if (locLabelSpan) locLabelSpan.textContent = note.locationLabel || 'Konum';
        var locSvg = document.querySelector('#note-property-location-row .notum-property-label svg');
        if (locSvg) {
            if (note.locationIcon) {
                locSvg.outerHTML = note.locationIcon;
            } else {
                locSvg.outerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
            }
        }

        // Custom properties yükle
        loadCustomProperties(note.customProperties || []);
        var noteContainer = document.getElementById('note-custom-properties');
        if (noteContainer && note.propertyOrder) {
            PropertyMenu.applyPropertyOrder(noteContainer, note.propertyOrder);
        }
        if (noteContainer) {
            PropertyMenu.initDragAndDrop(noteContainer, 'notes');
        }

        // Default property visibility
        var locRowEl = document.getElementById('note-property-location-row');
        if (locRowEl) {
            locRowEl.style.display = (note.hiddenProperties && note.hiddenProperties.indexOf('location') !== -1) ? 'none' : '';
        }

        var titleInput = document.getElementById('note-title-input');
        var descInput = document.getElementById('note-desc-input');
        if (titleInput) {
            titleInput.value = note.title || '';
            titleInput.style.fontFamily = getFontFamilyStyle(note.fontFamily || 'Outfit');
            titleInput.style.setProperty('color', note.textColor || '#334155', 'important');
            titleInput.style.fontWeight = (note.isBold !== false) ? '700' : '400';
            titleInput.style.fontStyle = note.isItalic ? 'italic' : 'normal';
            titleInput.style.textDecoration = note.isUnderline ? 'underline' : 'none';
        }
        if (descInput) {
            descInput.innerHTML = note.description || '';
        }

        // Kaydet butonunu düzenleme moduna ayarla
        var saveBtn = document.getElementById('note-save-btn');
        if (saveBtn) saveBtn.setAttribute('onclick', 'Notes.updateNote()');

        // Editing ID'yi kaydet
        overlay.setAttribute('data-editing-id', id);

        // Fotoğrafları yükle
        _tempPhotos = (note.photos && note.photos.slice()) || [];
        renderPhotoPreview();

        noteComments = note.comments || [];
        showNoteCommentInput = false;
        renderNoteComments();

        // Emoji seçiciyi kapat/sıfırla
        var emojiPicker = document.getElementById('note-emoji-picker');
        if (emojiPicker) emojiPicker.style.display = 'none';
        var wrapper = emojiPicker ? emojiPicker.closest('.diary-textarea-wrapper') : null;
        if (wrapper) wrapper.classList.remove('emoji-picker-open');

        overlay.style.display = 'flex';
        requestAnimationFrame(function () {
            overlay.classList.add('active');
        });

        if (typeof App !== 'undefined' && App.updateHeaderActiveItem) {
            App.updateHeaderActiveItem(note.title || 'Adsız Not');
        }

        if (titleInput) setTimeout(function () { titleInput.focus(); }, 200);
    }

    // ===== NOT KAYDET (YENİ) =====

    function saveNote() {
        var titleInput = document.getElementById('note-title-input');
        var descInput = document.getElementById('note-desc-input');

        var title = titleInput ? titleInput.value.trim() : '';
        var description = descInput ? descInput.innerHTML : '';
        if (description === '<br>' || description === '<div><br></div>') description = '';
        description = description.trim();

        if (!title) {
            if (titleInput) {
                titleInput.style.borderColor = '#ef4444';
                titleInput.focus();
                setTimeout(function () { titleInput.style.borderColor = ''; }, 2000);
            }
            return;
        }

        var notes = getNotes();
        var locLabelSpan = document.querySelector('#note-property-location-row .notum-property-label span');
        var locSvg = document.querySelector('#note-property-location-row .notum-property-label svg');
        
        var overlay = document.getElementById('note-modal-overlay');
        var editingId = overlay ? overlay.getAttribute('data-editing-id') : null;

        if (editingId) {
            var noteIndex = notes.findIndex(function (n) { return String(n.id) === String(editingId); });
            if (noteIndex !== -1) {
                notes[noteIndex].title = title;
                notes[noteIndex].description = description;
                notes[noteIndex].photos = _tempPhotos.slice();
                notes[noteIndex].location = selectedLocation;
                notes[noteIndex].locationLabel = locLabelSpan ? locLabelSpan.textContent.trim() : 'Konum';
                notes[noteIndex].locationIcon = locSvg ? locSvg.outerHTML : null;
                notes[noteIndex].createdAt = new Date().toISOString();
                notes[noteIndex].comments = noteComments.slice();
                notes[noteIndex].customProperties = getCustomProperties();
                notes[noteIndex].hiddenProperties = getHiddenProperties();
                notes[noteIndex].propertyOrder = PropertyMenu.getPropertyOrder('note-custom-properties');
                
                // Style properties
                notes[noteIndex].fontFamily = getDOMTitleFontFamily(titleInput) || notes[noteIndex].fontFamily || 'Outfit';
                notes[noteIndex].textColor = titleInput.style.color || notes[noteIndex].textColor || '#334155';
                notes[noteIndex].isBold = (titleInput.style.fontWeight === '700');
                notes[noteIndex].isItalic = (titleInput.style.fontStyle === 'italic');
                notes[noteIndex].isUnderline = (titleInput.style.textDecoration.indexOf('underline') !== -1);

                saveNotes(notes);
                closeModal();
                render();
                if (typeof Toast !== 'undefined' && Toast.show) {
                    Toast.show('Not oluşturuldu', 'success');
                }
                return;
            }
        }

        // Fallback
        var newId = generateId();
        notes.unshift({
            id: newId,
            title: title,
            description: description,
            photos: _tempPhotos.slice(),
            location: selectedLocation,
            locationLabel: locLabelSpan ? locLabelSpan.textContent.trim() : 'Konum',
            locationIcon: locSvg ? locSvg.outerHTML : null,
            createdAt: new Date().toISOString(),
            comments: noteComments.slice(),
            customProperties: getCustomProperties(),
            hiddenProperties: getHiddenProperties(),
            propertyOrder: PropertyMenu.getPropertyOrder('note-custom-properties'),
            fontFamily: getDOMTitleFontFamily(titleInput),
            textColor: titleInput.style.color || '#334155',
            isBold: (titleInput.style.fontWeight === '700'),
            isItalic: (titleInput.style.fontStyle === 'italic'),
            isUnderline: (titleInput.style.textDecoration.indexOf('underline') !== -1)
        });
        saveNotes(notes);
        closeModal();
        render();

        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show('Not oluşturuldu', 'success');
        }
    }

    // ===== NOT GÜNCELLE =====

    function updateNote() {
        var overlay = document.getElementById('note-modal-overlay');
        var editingId = overlay ? overlay.getAttribute('data-editing-id') : null;
        if (!editingId) return;

        var titleInput = document.getElementById('note-title-input');
        var descInput = document.getElementById('note-desc-input');

        var title = titleInput ? titleInput.value.trim() : '';
        var description = descInput ? descInput.innerHTML : '';
        if (description === '<br>' || description === '<div><br></div>') description = '';
        description = description.trim();

        if (!title) {
            if (titleInput) {
                titleInput.style.borderColor = '#ef4444';
                titleInput.focus();
                setTimeout(function () { titleInput.style.borderColor = ''; }, 2000);
            }
            return;
        }

        var notes = getNotes();
        var noteIndex = notes.findIndex(function (n) { return n.id === editingId; });
        if (noteIndex === -1) return;

        notes[noteIndex].title = title;
        notes[noteIndex].description = description;
        notes[noteIndex].photos = _tempPhotos.slice();
        notes[noteIndex].location = selectedLocation;
        var locLabelSpan = document.querySelector('#note-property-location-row .notum-property-label span');
        if (locLabelSpan) notes[noteIndex].locationLabel = locLabelSpan.textContent.trim();
        var locSvg = document.querySelector('#note-property-location-row .notum-property-label svg');
        notes[noteIndex].locationIcon = locSvg ? locSvg.outerHTML : null;
        notes[noteIndex].updatedAt = new Date().toISOString();
        notes[noteIndex].comments = noteComments.slice();
        notes[noteIndex].customProperties = getCustomProperties();
        notes[noteIndex].hiddenProperties = getHiddenProperties();
        notes[noteIndex].propertyOrder = PropertyMenu.getPropertyOrder('note-custom-properties');
        
        // Style properties
        notes[noteIndex].fontFamily = getDOMTitleFontFamily(titleInput) || notes[noteIndex].fontFamily || 'Outfit';
        notes[noteIndex].textColor = titleInput.style.color || notes[noteIndex].textColor || '#334155';
        notes[noteIndex].isBold = (titleInput.style.fontWeight === '700');
        notes[noteIndex].isItalic = (titleInput.style.fontStyle === 'italic');
        notes[noteIndex].isUnderline = (titleInput.style.textDecoration.indexOf('underline') !== -1);

        saveNotes(notes);
        closeModal();
        render();

        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show('Not güncellendi', 'success');
        }
    }

    function autoSaveNote() {
        var overlay = document.getElementById('note-modal-overlay');
        if (!overlay || overlay.style.display === 'none') return;

        var titleInput = document.getElementById('note-title-input');
        var descInput = document.getElementById('note-desc-input');

        var title = titleInput ? titleInput.value.trim() : '';
        var description = descInput ? descInput.innerHTML : '';
        if (description === '<br>' || description === '<div><br></div>') description = '';
        description = description.trim();

        var editingId = overlay.getAttribute('data-editing-id');

        if (!title && !description && noteComments.length === 0) {
            if (editingId) {
                var notes = getNotes();
                notes = notes.filter(function (n) { return String(n.id) !== String(editingId); });
                saveNotes(notes);
                render();
                overlay.removeAttribute('data-editing-id');
                if (typeof App !== 'undefined' && App.updateHeaderActiveItem) {
                    var cs = localStorage.getItem('app_current_section');
                    var isTeam = cs && (cs.indexOf('team_instance_') === 0 || cs.indexOf('notes_instance_') === 0);
                    App.updateHeaderActiveItem(isTeam ? 'Yeni Sayfa' : 'Yeni Not');
                }
            }
            return;
        }
        var cs2 = localStorage.getItem('app_current_section');
        var isTeam2 = cs2 && (cs2.indexOf('team_instance_') === 0 || cs2.indexOf('notes_instance_') === 0);
        var finalTitle = title || (isTeam2 ? 'Yeni Sayfa' : 'Yeni Not');

        var notes = getNotes();

        if (editingId) {
            var noteIndex = notes.findIndex(function (n) { return String(n.id) === String(editingId); });
            if (noteIndex !== -1) {
                notes[noteIndex].title = finalTitle;
                notes[noteIndex].description = description;
                notes[noteIndex].photos = _tempPhotos.slice();
                notes[noteIndex].location = selectedLocation;
                var locLabelSpan = document.querySelector('#note-property-location-row .notum-property-label span');
                if (locLabelSpan) notes[noteIndex].locationLabel = locLabelSpan.textContent.trim();
                var locSvg = document.querySelector('#note-property-location-row .notum-property-label svg');
                notes[noteIndex].locationIcon = locSvg ? locSvg.outerHTML : null;
                notes[noteIndex].updatedAt = new Date().toISOString();
                notes[noteIndex].comments = noteComments.slice();
                notes[noteIndex].customProperties = getCustomProperties();
                notes[noteIndex].hiddenProperties = getHiddenProperties();
                notes[noteIndex].propertyOrder = PropertyMenu.getPropertyOrder('note-custom-properties');
                
                // Preserve or init title styling
                if (notes[noteIndex].fontFamily === undefined) notes[noteIndex].fontFamily = 'Outfit';
                if (notes[noteIndex].textColor === undefined) notes[noteIndex].textColor = '#334155';
                if (notes[noteIndex].isBold === undefined) notes[noteIndex].isBold = true;
                if (notes[noteIndex].isItalic === undefined) notes[noteIndex].isItalic = false;
                if (notes[noteIndex].isUnderline === undefined) notes[noteIndex].isUnderline = false;

                saveNotes(notes);
                createVersionCheckpoint(editingId, false);
                render();

                if (typeof App !== 'undefined' && App.updateHeaderActiveItem) {
                    App.updateHeaderActiveItem(finalTitle);
                }
            }
        } else {
            var newId = generateId();
            overlay.setAttribute('data-editing-id', newId);
            var locLabelSpan = document.querySelector('#note-property-location-row .notum-property-label span');
            var locSvg = document.querySelector('#note-property-location-row .notum-property-label svg');
            notes.unshift({
                id: newId,
                title: finalTitle,
                description: description,
                photos: _tempPhotos.slice(),
                location: selectedLocation,
                locationLabel: locLabelSpan ? locLabelSpan.textContent.trim() : 'Konum',
                locationIcon: locSvg ? locSvg.outerHTML : null,
                createdAt: new Date().toISOString(),
                comments: noteComments.slice(),
                customProperties: getCustomProperties(),
                hiddenProperties: getHiddenProperties(),
                propertyOrder: PropertyMenu.getPropertyOrder('note-custom-properties'),
                fontFamily: 'Outfit',
                textColor: '#334155',
                isBold: true,
                isItalic: false,
                isUnderline: false
            });
            saveNotes(notes);
            render();

            if (typeof App !== 'undefined' && App.updateHeaderActiveItem) {
                App.updateHeaderActiveItem(finalTitle);
            }
        }
    }

    // ===== SİLME ONAYI =====

    function confirmDelete(id) {
        if (localStorage.getItem('notion_lock_page_preference') === 'true') {
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show("Bu sayfa kilitli. Düzenlemek için kilidi açın.", "warning");
            }
            return;
        }
        _pendingDeleteId = id;
        var notes = getNotes();
        var note = notes.find(function (n) { return n.id === id; });
        if (!note) return;

        var dateDisplay = formatDate(note.createdAt);
        var preview = (note.description || '');
        if (preview.length > 500) {
            preview = preview.substring(0, 500) + '...';
        }

        var titleHtml = '';
        if (note.title && note.title.trim()) {
            titleHtml = '<h4 style="font-size: 15px; font-weight: 700; color: var(--color-text, #1e293b); margin: 0 0 6px 0; text-align: left; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + escapeHtml(note.title) + '</h4>';
        }

        var html = '<div class="modal-overlay" onclick="Notes.closeDeleteModal()">' +
            '<div class="modal-content confirm-modal" style="max-width: 380px;" onclick="event.stopPropagation()">' +
            '<div class="confirm-modal-icon" style="color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: inherit;">' +
                '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                    '<polyline points="3 6 5 6 21 6"></polyline>' +
                    '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
                    '<line x1="10" y1="11" x2="10" y2="17"></line>' +
                    '<line x1="14" y1="11" x2="14" y2="17"></line>' +
                '</svg>' +
            '</div>' +
            '<h3 class="confirm-modal-title">Bu öğeyi silmek istediğine emin misin?</h3>' +
            '<div class="confirm-modal-detail" style="padding: 20px; text-align: left; display: flex; flex-direction: column; align-items: flex-start; gap: 0; background: #f8fafc; margin-top: 24px; margin-bottom: 24px;">' +
            '  <div style="background-color: #2d3748; color: #ffffff; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; display: inline-block; margin-bottom: 12px;">' + dateDisplay + '</div>' +
            '  <div style="width: 100%; border-top: 1px solid var(--color-border-subtle, #e2e8f0); margin-bottom: 12px;"></div>' +
            titleHtml +
            '  <p style="font-size: 13px; color: var(--color-text-secondary, #64748b); line-height: 1.5; margin: 0; text-align: left; width: 100%; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; white-space: pre-wrap;">' + escapeHtml(preview) + '</p>' +
            '</div>' +
            '<div class="confirm-modal-actions">' +
            '<button class="btn btn-secondary" onclick="Notes.closeDeleteModal()">İptal</button>' +
            '<button class="btn btn-danger" onclick="Notes.executeDelete()">Çöp Kutusuna Taşı</button>' +
            '</div></div></div>';

        var container = document.getElementById('notes-delete-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notes-delete-modal-container';
            document.body.appendChild(container);
        }
        container.innerHTML = html;
    }

    function closeDeleteModal() {
        _pendingDeleteId = null;
        var container = document.getElementById('notes-delete-modal-container');
        if (container) container.innerHTML = '';
    }

    function executeDelete() {
        if (!_pendingDeleteId) return;
        var notes = getNotes();
        var original = notes.find(function (n) { return n.id === _pendingDeleteId; });
        if (original && typeof Trash !== 'undefined') {
            Trash.addToTrash('note', _pendingDeleteId, original.title || 'Adsız Not', original.description || '', original);
        }
        notes = notes.filter(function (n) { return n.id !== _pendingDeleteId; });
        saveNotes(notes);
        closeDeleteModal();
        closeDetail();
        render();

        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show('Not silindi', 'success');
        }
    }

    // ===== NOT DETAY GÖRÜNÜMÜ =====

    function openDetail(id) {
        var notes = getNotes();
        var note = notes.find(function (n) { return n.id === id; });
        if (!note) return;

        var date = formatDate(note.createdAt);
        var photos = (note.photos && note.photos.length) ? note.photos : [];

        var photoHtml = '';
        if (photos.length > 0) {
            photoHtml = '<div class="diary-detail-photos">';
            photos.forEach(function (photo) {
                photoHtml += '<div class="diary-detail-photo">' +
                    '<img src="' + photo + '" alt="Fotoğraf">' +
                    '</div>';
            });
            photoHtml += '</div>';
        }

        var descHtml = parseDescription(note);

        var titleStyle = 'font-weight: ' + ((note.isBold !== false) ? '700' : '400') + '; ' +
            'font-style: ' + (note.isItalic ? 'italic' : 'normal') + '; ' +
            'text-decoration: ' + (note.isUnderline ? 'underline' : 'none') + '; ' +
            'font-family: ' + getFontFamilyStyle(note.fontFamily || 'Outfit') + '; ' +
            'color: ' + (note.textColor || 'var(--color-text)') + ';';

        var commentsHtml = '';
        var comments = note.comments || [];
        if (comments.length > 0) {
            commentsHtml = '<div class="diary-detail-comments" style="margin-top: 14px; margin-bottom: 8px; border-bottom: 1px solid var(--color-border-subtle, #e2e8f0); padding-bottom: 12px; max-height: 180px; overflow-y: auto; padding-right: 4px;">';
            commentsHtml += '  <div style="font-size: 11px; font-weight: 600; color: var(--color-text-secondary, #64748b); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Yorumlar</div>';
            comments.forEach(function (comment) {
                var name = ((comment.firstName || '') + ' ' + (comment.lastName || '')).trim() || 'Kullanıcı';
                var relativeTime = getRelativeTimeString(comment.date);
                commentsHtml +=
                    '    <div class="comment-item" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start;">' +
                    '      <div style="margin-top: 2px;">' + getCommentAvatarHtml(comment) + '</div>' +
                    '      <div class="comment-body" style="flex: 1; min-width: 0;">' +
                    '        <div class="comment-header" style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 1px;">' +
                    '          <span class="comment-author" style="font-weight: 600; font-size: 12px; color: var(--color-text, #1e293b);">' + escapeHtml(name) + '</span>' +
                    '          <span class="comment-time" style="font-size: 10px; color: var(--color-text-secondary, #94a3b8);">' + relativeTime + '</span>' +
                    '        </div>' +
                    '        <div class="comment-text" style="font-size: 12px; color: var(--color-text); line-height: 1.35; word-break: break-word;">' + escapeHtml(comment.text) + '</div>' +
                    '      </div>' +
                    '      <div style="clear: both;"></div>' +
                    '    </div>';
            });
            commentsHtml += '</div>';
        }

        var html = '<div class="modal-overlay" onclick="Notes.closeDetail()">' +
            '<div class="modal-content diary-detail-modal notes-detail-modal" onclick="event.stopPropagation()">' +
            '<div class="diary-detail-header">' +
            '<div class="diary-detail-date">' + date + '</div>' +
            '<div class="diary-detail-actions-card">' +
            '<button class="diary-detail-edit-icon-btn" onclick="Notes.closeDetail(); Notes.openEditModal(\'' + id + '\')" title="Düzenle">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">' +
            '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>' +
            '<path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>' +
            '</svg>' +
            '</button>' +
            '<button class="diary-detail-edit-icon-btn" onclick="event.stopPropagation(); Notes.shareToTeam(\'' + id + '\')" title="Ekiple Paylaş">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">' +
            '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>' +
            '<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>' +
            '</svg>' +
            '</button>' +
            '<button class="diary-detail-delete-icon-btn" onclick="Notes.closeDetail(); Notes.confirmDelete(\'' + id + '\')" title="Sil">' +
            '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">' +
            '<polyline points="3 6 5 6 21 6"/>' +
            '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' +
            '<line x1="10" y1="11" x2="10" y2="17"></line>' +
            '<line x1="14" y1="11" x2="14" y2="17"></line>' +
            '</svg>' +
            '</button>' +
            '</div>' +
            '</div>' +
            '<h2 class="diary-detail-title" style="' + titleStyle + '">' + escapeHtml(note.title || 'Başlıksız') + '</h2>' +
            commentsHtml +
            (note.description ?
                '<div class="diary-detail-text-wrapper"><div class="diary-detail-text">' + descHtml + '</div></div>' :
                '') +
            photoHtml +
            '</div></div>';

        var container = document.getElementById('notes-detail-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notes-detail-container';
            document.body.appendChild(container);
        }
        container.innerHTML = html;

        if (typeof App !== 'undefined' && App.updateHeaderActiveItem) {
            App.updateHeaderActiveItem(note.title || 'Adsız Not');
        }
    }

    function closeDetail() {
        var container = document.getElementById('notes-detail-container');
        if (container) container.innerHTML = '';

        if (typeof App !== 'undefined' && App.updateHeaderActiveItem) {
            App.updateHeaderActiveItem('Not Başlıkları');
        }
    }

    // ===== EKİPLE PAYLAŞ =====

    function shareToTeam(id) {
        var notes = getNotes();
        var note = notes.find(function (n) { return n.id === id; });
        if (!note) return;

        /* Kullanıcının ekiplerini al */
        var teams = [];
        try {
            var workspaces = JSON.parse(localStorage.getItem('sidebar_group_items_workspace') || '[]');
            workspaces.forEach(function(item) {
                teams.push({
                    id: item.id,
                    name: item.label,
                    color: 'blue'
                });
            });
        } catch (e) {}
        if (!teams || teams.length === 0) {
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show('Henüz bir ekibiniz yok.', 'warning');
            }
            return;
        }

        /* Ekip listesi HTML'i oluştur */
        var TEAM_COLORS = [
            { id: 'blue', hex: '#3b82f6' }, { id: 'purple', hex: '#8b5cf6' },
            { id: 'green', hex: '#10b981' }, { id: 'red', hex: '#ef4444' },
            { id: 'orange', hex: '#f59e0b' }, { id: 'pink', hex: '#ec4899' },
            { id: 'teal', hex: '#14b8a6' }, { id: 'indigo', hex: '#6366f1' },
            { id: 'gray', hex: '#64748b' }, { id: 'black', hex: '#1e293b' }
        ];

        var teamListHtml = '';
        teams.forEach(function (team) {
            var initials = (team.name || '').split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().substr(0, 2);
            var colorHex = '#6366f1';
            var c = TEAM_COLORS.find(function (tc) { return tc.id === team.color; });
            if (c) colorHex = c.hex;

            var avatarHtml = team.photo
                ? '<img src="' + team.photo + '" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">'
                : '<div class="fs-team-avatar" style="background:' + colorHex + '">' + initials + '</div>';

            teamListHtml +=
                '<button type="button" class="fs-team-option" data-team-id="' + team.id + '" onclick="Notes.toggleShareTeam(this)">' +
                '<div class="fs-team-option-left">' +
                avatarHtml +
                '<span>' + escapeHtml(team.name) + '</span>' +
                '</div>' +
                '<div class="fs-team-check">' +
                '<svg class="fs-team-check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>' +
                '</div>' +
                '</button>';
        });

        var html =
            '<div class="modal-overlay" onclick="Notes.closeShareModal()">' +
            '<div class="modal-content" style="max-width:420px;" onclick="event.stopPropagation()">' +
            '<button class="modal-close" onclick="Notes.closeShareModal()">&times;</button>' +
            '<h3 class="finance-edit-modal-title">Ekiple Paylaş</h3>' +
            '<p style="color:var(--color-text-secondary);margin-bottom:12px;">"' + escapeHtml(note.title || 'Not') + '" notunu göndermek istediğiniz ekipleri seçin:</p>' +
            '<div class="form-group">' +
            '<div class="fs-team-dropdown-wrapper">' +
            '<button type="button" class="fs-team-trigger" id="note-share-trigger" onclick="Notes.toggleShareDropdown()">' +
            '<span id="note-share-trigger-label">Seçiniz...</span>' +
            '<svg width="14" height="14" viewBox="0 0 14 14"><path fill="currentColor" d="M7 9.5L2.5 5 3.56 3.94 7 7.38 10.44 3.94 11.5 5z"/></svg>' +
            '</button>' +
            '<div class="fs-team-panel" id="note-share-panel">' +
            teamListHtml +
            '</div>' +
            '</div>' +
            '</div>' +
            '<input type="hidden" id="note-share-id" value="' + id + '">' +
            '<div class="finance-edit-actions">' +
            '<button type="button" class="btn" onclick="Notes.closeShareModal()">İptal</button>' +
            '<button type="button" class="btn btn-primary" onclick="Notes.doShareToTeam()">Paylaş</button>' +
            '</div>' +
            '</div></div>';

        var container = document.getElementById('notes-share-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notes-share-container';
            document.body.appendChild(container);
        }
        container.innerHTML = html;
    }

    function closeShareModal() {
        var container = document.getElementById('notes-share-container');
        if (container) container.innerHTML = '';
    }

    function toggleShareDropdown() {
        var trigger = document.getElementById('note-share-trigger');
        var panel = document.getElementById('note-share-panel');
        if (!trigger || !panel) return;
        var isOpen = panel.classList.contains('open');
        trigger.classList.toggle('open', !isOpen);
        panel.classList.toggle('open', !isOpen);
    }

    function toggleShareTeam(btn) {
        btn.classList.toggle('selected');
        var selected = document.querySelectorAll('#notes-share-container .fs-team-option.selected');
        var label = document.getElementById('note-share-trigger-label');
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

    function doShareToTeam() {
        var noteId = document.getElementById('note-share-id').value;
        var notes = getNotes();
        var note = notes.find(function (n) { return n.id === noteId; });
        if (!note) { closeShareModal(); return; }

        var selectedTeamIds = [];
        var selectedOpts = document.querySelectorAll('#notes-share-container .fs-team-option.selected');
        selectedOpts.forEach(function (opt) {
            selectedTeamIds.push(opt.getAttribute('data-team-id'));
        });

        if (selectedTeamIds.length === 0) {
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show('Lütfen en az bir ekip seçin.', 'warning');
            }
            return;
        }

        /* Ekip notlarına ekle */
        var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
        var userEmail = user ? user.email : '';

        try {
            selectedTeamIds.forEach(function (teamId) {
                var teamNotesKey = 'user_notes_' + teamId + '_' + userEmail;
                var teamNotes = JSON.parse(localStorage.getItem(teamNotesKey) || '[]');
                
                // Copy the note properties
                var newNote = Object.assign({}, note);
                // Assign a fresh ID and update dates
                newNote.id = generateId();
                newNote.createdAt = new Date().toISOString();
                newNote.updatedAt = new Date().toISOString();
                
                teamNotes.push(newNote);
                localStorage.setItem(teamNotesKey, JSON.stringify(teamNotes));
            });
        } catch (ex) { }

        /* Ekip isimlerini bul (toast için) */
        var workspaces = [];
        try {
            workspaces = JSON.parse(localStorage.getItem('sidebar_group_items_workspace') || '[]');
        } catch (e) {}
        var teamNames = [];
        selectedTeamIds.forEach(function (tid) {
            var t = workspaces.find(function (w) { return w.id === tid; });
            if (t) teamNames.push(t.label);
        });

        closeShareModal();
        if (typeof Toast !== 'undefined' && Toast.show) {
            if (teamNames.length === 1) {
                Toast.show('"' + teamNames[0] + '" ekibi ile paylaşıldı!', 'success');
            } else {
                Toast.show(selectedTeamIds.length + ' ekiple paylaşıldı!', 'success');
            }
        }
    }

    // ===== EMOCİ SEÇİCİ (Emoji Picker) =====
    var EMOJI_CATEGORIES = {
        smileys: [
            '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'
        ],
        animals: [
            '🐵', '🙈', '🙉', '🙊', '💥', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🦬', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦫', '🦔', '🦇', '🐻', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅', '🦆', '🦢', '🦉', '🦤', '🦩', '🦚', '🦜', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🦭', '🐟', '🐠', '🐡', '🦈', '🐙', '🐚', '🐌', '🦋', '🐛', '🐜', '🐝', '🪲', '🐞', '🦗', '🕷️', '🕸️', '🦂', '🦟', '🪰', '🪱', '💐', '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '🍀', '🍁', '🍂', '🍃'
        ],
        food: [
            '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🧅', '🧄', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫓', '🍳', '🥘', '🍲', '🫕', '🥣', '🥗', '🍿', '🍟', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🦑', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🫖', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧃', '🧉', '🧊'
        ],
        activities: [
            '👾', '🎮', '🕹️', '🎰', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🥍', '🏏', '🪃', '⛳', '🏹', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤾', '🏌️', '🏄', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🎗️', '🎫', '🎟️', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻'
        ],
        travel: [
            '🚗', '🚕', '🚙', '🚌', '🦽', '🦼', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛴', '🚲', '🛺', '🚨', '✈️', '🛫', '🛬', 'Helikopter', '🛸', '🛰️', '🚀', '🛶', '⛵', '🛥️', '🚤', '⛴️', '🚢', '⚓', '🛟', '🗺️', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🪨', '🪵', '🛖', '🏠', '🏡', '🏢', '🏣', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌅', '🌆', '🌇', '🌉', '🎡', '🎢', '🎠', '⛱️', '🌌', '🪐', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '☀️', '🌞', '⭐', '🌟', '🌠', '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '💨', '❄️', '☃️', '⛄', '☄️', '🔥', '💧', '🌊'
        ],
        objects: [
            '🔇', '🔈', '🔉', '🔊', '📢', '📣', '📯', '🔔', '🔕', '📻', '📱', '📲', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🎥', '🎞️', '📽️', '📺', '📷', '📸', '📹', '📼', '🔍', '🔎', '🕯️', '💡', '🔦', '🏮', '📔', '📕', '📖', '📗', '📘', '📙', '📚', '📓', '📒', '📝', '✉️', '📧', '📨', '📩', '📤', '📥', '📦', '🏷️', '💳', '💸', '💵', '💴', '💶', '💷', '🪙', '💹', '📬', '📭', '📮', '🗳️', '✏️', '✒️', '🖊️', '🖋️', '🖌️', '🖍️', '💼', '📁', '📂', '📅', '📆', '🪞', '🔑', '🗝️', '🔨', '🔧', '🔩', '⚙️', '🪛', '🪓', '🔫', '💣', '🔪', '🗡️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '🔬', '🔭', '📡', '🪟', '🛏️', '🛋️', '🪑', '🚽', '🪠', '🚿', '🛁', '🛀', '🚪', '🧹', '🧺', '🧻', '🧼', '🧽', '🧯', '🛒', '🧳', '🎈', '🎉', '🎊', '🧸', '🪄', '🪅', '🪆'
        ],
        symbols: [
            '💘', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💯', '💢', '💬', '👁️‍🗨️', '🗯️', '💭', '💤', '🌐', '🌀', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄', '🎴', '➕', '➖', '✖️', '➗', '♾️', '💲', '💱', '™️', '©️', '®️', '🔤', '🔡', '🔠', '🆎', '🅰️', '🅱️', '🚾', '🚹', '🚺', '🚻', '🚼', '♿', '🚮', '🚭', '🚰', '⚠️', '🚸', '⛔', '🚫', '🚳', '🚯', '🚱', '🚷', '☣️', '☢️', '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔄', '🔁', '🔀', '⏩', '⏭️', '⏯️', '◀️', '⏮️', '⏪', '⏫', '⏬', '🔼', '🔽', '⏸️', '⏹️', '⏺️', '🎦', '🎛️', '🎵', '🎶', '⚪', '⚫', '🔴', '🔵', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔲', '🔳', '🟥', '🟦', '🟧', '🟨', '🟩', '🟪', '🟫'
        ]
    };

    function toggleEmojiPicker(e) {
        if (e && e.preventDefault) e.preventDefault();
        var picker = document.getElementById('note-emoji-picker');
        if (!picker) return;

        var wrapper = picker.closest('.diary-textarea-wrapper');
        if (picker.style.display === 'none') {
            picker.style.display = 'flex';
            if (wrapper) wrapper.classList.add('emoji-picker-open');
            changeEmojiCategory('smileys');
        } else {
            picker.style.display = 'none';
            if (wrapper) wrapper.classList.remove('emoji-picker-open');
        }
    }

    function changeEmojiCategory(categoryName, e) {
        if (e && e.preventDefault) e.preventDefault();
        var picker = document.getElementById('note-emoji-picker');
        if (!picker) return;

        var tabs = picker.querySelectorAll('.emoji-tab-btn');
        tabs.forEach(function (tab) {
            tab.classList.remove('active');
        });

        var activeTab = Array.prototype.slice.call(tabs).find(function(tab) {
            return tab.getAttribute('onclick') && tab.getAttribute('onclick').indexOf(categoryName) !== -1;
        });
        if (activeTab) {
            activeTab.classList.add('active');
        }

        var grid = picker.querySelector('.emoji-picker-grid');
        if (!grid) return;

        grid.scrollTop = 0;
        var emojis = EMOJI_CATEGORIES[categoryName] || [];
        var html = '';
        emojis.forEach(function (emoji) {
            html += '<span class="emoji-item" onclick="Notes.insertEmoji(\'' + emoji + '\')">' + emoji + '</span>';
        });
        grid.innerHTML = html;
    }

    function getHtmlLines(html) {
        var temp = document.createElement('div');
        temp.innerHTML = html;
        var lines = [];
        var currentLineNodes = [];
        
        function flushCurrentLine() {
            if (currentLineNodes.length > 0) {
                var div = document.createElement('div');
                currentLineNodes.forEach(function(node) {
                    div.appendChild(node.cloneNode(true));
                });
                lines.push(div.innerHTML);
                currentLineNodes = [];
            }
        }
        
        for (var i = 0; i < temp.childNodes.length; i++) {
            var node = temp.childNodes[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
                var tagName = node.tagName.toUpperCase();
                if (tagName === 'BR') {
                    if (currentLineNodes.length === 0) {
                        lines.push('');
                    } else {
                        flushCurrentLine();
                    }
                } else if (tagName === 'DIV' || tagName === 'P' || tagName === 'H1' || tagName === 'H2' || tagName === 'H3' || tagName === 'LI') {
                    flushCurrentLine();
                    lines.push(node.innerHTML);
                } else {
                    currentLineNodes.push(node);
                }
            } else if (node.nodeType === Node.TEXT_NODE) {
                currentLineNodes.push(node);
            }
        }
        flushCurrentLine();
        
        if (lines.length === 0 && html) {
            lines.push('');
        }
        return lines;
    }

    function stripCheckboxPrefix(lineHtml) {
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = lineHtml;
        
        function findFirstTextNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                return node;
            }
            for (var i = 0; i < node.childNodes.length; i++) {
                var res = findFirstTextNode(node.childNodes[i]);
                if (res) return res;
            }
            return null;
        }
        
        var firstTextNode = findFirstTextNode(tempDiv);
        if (firstTextNode) {
            var text = firstTextNode.nodeValue;
            var trimmedText = text.trimStart();
            var prefixes = ['[ ]', '[x]', '☐', '☑'];
            for (var i = 0; i < prefixes.length; i++) {
                var p = prefixes[i];
                if (trimmedText.startsWith(p)) {
                    var indexInText = text.indexOf(p);
                    if (indexInText !== -1) {
                        firstTextNode.nodeValue = text.substring(0, indexInText) + text.substring(indexInText + p.length).trimStart();
                        break;
                    }
                }
            }
        }
        return tempDiv.innerHTML;
    }

    function insertEmoji(emoji) {
        var input = document.getElementById('note-desc-input');
        if (!input) return;

        input.focus();
        
        var isContentEditable = (input.tagName === 'DIV' && input.contentEditable === 'true');
        if (isContentEditable) {
            var sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                var range = sel.getRangeAt(0);
                if (input.contains(range.commonAncestorContainer)) {
                    document.execCommand('insertText', false, emoji);
                    autoSaveNote();
                    return;
                }
            }
            input.innerHTML += emoji;
            autoSaveNote();
            return;
        }

        var startPos = input.selectionStart;
        var endPos = input.selectionEnd;
        var text = input.value;

        if (typeof startPos !== 'number' || typeof endPos !== 'number') {
            input.value = text + emoji;
            input.focus();
            autoSaveNote();
            return;
        }

        input.value = text.substring(0, startPos) + emoji + text.substring(endPos);

        var newCursorPos = startPos + emoji.length;
        input.selectionStart = newCursorPos;
        input.selectionEnd = newCursorPos;
        input.focus();
        autoSaveNote();
    }

    function insertCheckbox(e) {
        if (e && e.preventDefault) e.preventDefault();
        var input = document.getElementById('note-desc-input');
        if (!input) return;

        input.focus();
        var isContentEditable = (input.tagName === 'DIV' && input.contentEditable === 'true');
        if (isContentEditable) {
            var sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                var range = sel.getRangeAt(0);
                if (input.contains(range.commonAncestorContainer)) {
                    document.execCommand('insertText', false, '☐ ');
                    autoSaveNote();
                    return;
                }
            }
            input.innerHTML += '☐ ';
            autoSaveNote();
            return;
        }

        var startPos = input.selectionStart;
        var endPos = input.selectionEnd;
        var text = input.value;

        // Insert "☐ " at the start of the current line
        var lineStart = text.lastIndexOf('\n', startPos - 1) + 1;
        var before = text.substring(0, lineStart);
        var after = text.substring(lineStart);
        
        // Check if the current line already starts with a checkbox
        var currentLine = after.split('\n')[0];
        var trimmedLine = currentLine.trim();
        if (trimmedLine.startsWith('☐') || trimmedLine.startsWith('☑') || trimmedLine.startsWith('[ ]') || trimmedLine.startsWith('[x]')) {
            input.focus();
            return;
        }

        input.value = before + '☐ ' + after;
        var newPos = startPos + 2;
        input.focus();
        input.setSelectionRange(newPos, newPos);
        input.focus();
        autoSaveNote();
    }

    function toggleTodoItem(noteId, lineIndex, event) {
        if (event) event.stopPropagation();
        var notes = getNotes();
        var noteIndex = notes.findIndex(function (n) { return n.id === noteId; });
        if (noteIndex === -1) return;

        var note = notes[noteIndex];
        var htmlLines = getHtmlLines(note.description);
        if (lineIndex >= 0 && lineIndex < htmlLines.length) {
            var lineHtml = htmlLines[lineIndex];
            
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = lineHtml;
            
            function findFirstTextNode(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                    return node;
                }
                for (var i = 0; i < node.childNodes.length; i++) {
                    var res = findFirstTextNode(node.childNodes[i]);
                    if (res) return res;
                }
                return null;
            }
            
            var firstText = findFirstTextNode(tempDiv);
            if (firstText) {
                var text = firstText.nodeValue;
                var trimmed = text.trimStart();
                var leadingSpaceCount = text.length - trimmed.length;
                var leadingSpace = text.substring(0, leadingSpaceCount);
                
                if (trimmed.startsWith('[ ]')) {
                    firstText.nodeValue = leadingSpace + '[x]' + trimmed.substring(3);
                } else if (trimmed.startsWith('[x]')) {
                    firstText.nodeValue = leadingSpace + '[ ]' + trimmed.substring(3);
                } else if (trimmed.startsWith('☐')) {
                    firstText.nodeValue = leadingSpace + '☑' + trimmed.substring(1);
                } else if (trimmed.startsWith('☑')) {
                    firstText.nodeValue = leadingSpace + '☐' + trimmed.substring(1);
                }
                
                htmlLines[lineIndex] = tempDiv.innerHTML;
            }
            
            note.description = htmlLines.map(function(line) {
                return '<div>' + line + '</div>';
            }).join('');
            
            saveNotes(notes);
            render();

            // If detail view is open, refresh it
            var detailOverlay = document.getElementById('notes-detail-container');
            if (detailOverlay && detailOverlay.innerHTML !== '') {
                openDetail(noteId);
            }
        }
    }

    function parseDescription(note, isPreview) {
        if (!note.description) return '';
        
        var htmlLines = getHtmlLines(note.description);
        
        var hasCheckboxes = htmlLines.some(function (lineHtml) {
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = lineHtml;
            var plainText = tempDiv.textContent || tempDiv.innerText || '';
            var t = plainText.trim();
            return t.startsWith('[ ]') || t.startsWith('[x]') || t.startsWith('☐') || t.startsWith('☑');
        });
        
        if (!hasCheckboxes) {
            return note.description;
        }

        var html = '<span class="note-todo-list" style="display: block; gap: 4px; margin-top: 4px;">';
        htmlLines.forEach(function (lineHtml, idx) {
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = lineHtml;
            var plainText = tempDiv.textContent || tempDiv.innerText || '';
            var trimmed = plainText.trim();
            
            var isTodo = false;
            var isChecked = false;
            
            if (trimmed.startsWith('[ ]')) {
                isTodo = true;
                isChecked = false;
            } else if (trimmed.startsWith('[x]')) {
                isTodo = true;
                isChecked = true;
            } else if (trimmed.startsWith('☐')) {
                isTodo = true;
                isChecked = false;
            } else if (trimmed.startsWith('☑')) {
                isTodo = true;
                isChecked = true;
            }
            
            if (isTodo) {
                var contentHtml = stripCheckboxPrefix(lineHtml);
                if (isPreview) {
                    if (!isChecked) {
                        html += '<span style="display: block; font-size: 14px; color: var(--color-text-secondary); margin-bottom: 4px;">' + contentHtml + '</span>';
                    }
                } else {
                    var strikeStyle = isChecked ? 'text-decoration: line-through; opacity: 0.6;' : '';
                    html += '<span class="note-todo-item" onclick="event.stopPropagation();" style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; cursor: pointer;' + (isChecked ? ' opacity: 0.6;' : '') + '">' +
                        '<input type="checkbox" ' + (isChecked ? 'checked' : '') + ' onchange="Notes.toggleTodoItem(\'' + note.id + '\', ' + idx + ', event)" style="width: 16px; height: 16px; accent-color: #3b82f6; cursor: pointer; flex-shrink: 0; margin: 0;">' +
                        '<span style="' + strikeStyle + ' font-size: 14px; color: var(--color-text-secondary);">' + contentHtml + '</span>' +
                        '</span>';
                }
            } else {
                html += '<span style="display: block; font-size: 14px; color: var(--color-text-secondary); padding-left: ' + (isPreview ? '0' : '24px') + '; margin-bottom: 4px;">' + lineHtml + '</span>';
            }
        });
        html += '</span>';
        return html;
    }

    function toggleMenu(e, id) {
        e.stopPropagation();
        var dropdowns = document.querySelectorAll('.list-view-item-dropdown');
        dropdowns.forEach(function (dd) {
            if (dd.id !== 'list-view-menu-' + id) {
                dd.style.display = 'none';
                var parent = dd.closest('.list-view-item');
                if (parent) parent.classList.remove('menu-open');
            }
        });

        var menu = document.getElementById('list-view-menu-' + id);
        if (menu) {
            var isOpen = menu.style.display === 'flex';
            menu.style.display = isOpen ? 'none' : 'flex';
            var parentItem = menu.closest('.list-view-item');
            if (parentItem) {
                parentItem.classList.toggle('menu-open', !isOpen);
            }
        }
    }

    function handleMenuAction(action, id) {
        var menu = document.getElementById('list-view-menu-' + id);
        if (menu) {
            menu.style.display = 'none';
            var parentItem = menu.closest('.list-view-item');
            if (parentItem) parentItem.classList.remove('menu-open');
        }

        if (action === 'edit') {
            closeDetail();
            openEditModal(id);
        } else if (action === 'share') {
            shareToTeam(id);
        } else if (action === 'delete') {
            closeDetail();
            confirmDelete(id);
        }
    }

    document.addEventListener('click', function (e) {
        var openDropdowns = document.querySelectorAll('.list-view-item-dropdown');
        openDropdowns.forEach(function (dd) {
            if (dd.style.display === 'flex' && !dd.contains(e.target) && !e.target.closest('.list-view-item-more-btn')) {
                dd.style.display = 'none';
                var parent = dd.closest('.list-view-item');
                if (parent) parent.classList.remove('menu-open');
            }
        });
        
        var commentDropdowns = document.querySelectorAll('.comment-dropdown');
        commentDropdowns.forEach(function (d) {
            if (d.style.display !== 'none' && !d.contains(e.target) && !e.target.closest('.comment-more-btn')) {
                d.style.display = 'none';
                var trg = d.closest('.comment-actions-trigger');
                if (trg) trg.classList.remove('active');
            }
        });
    });

    function bindAutoSaveEvents() {
        var titleInput = document.getElementById('note-title-input');
        var descInput = document.getElementById('note-desc-input');
        if (titleInput) {
            titleInput.addEventListener('input', autoSaveNote);
        }
        if (descInput) {
            descInput.addEventListener('input', autoSaveNote);
        }
        initNotesFormatting();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindAutoSaveEvents);
    } else {
        bindAutoSaveEvents();
    }

    function openLocationSearch() {
        var locPanel = document.getElementById('note-location-panel');
        if (locPanel) {
            locPanel.style.display = 'flex';
            var searchInput = document.getElementById('note-location-search-input');
            if (searchInput) {
                searchInput.value = '';
                setTimeout(function () { searchInput.focus(); }, 100);
            }
            renderLocations("");
        }
    }

    function closeLocationSearch() {
        var locPanel = document.getElementById('note-location-panel');
        if (locPanel) {
            locPanel.style.display = 'none';
        }
    }

    function getLocationIconSVG(type) {
        if (type === 'running') {
            return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="4" r="1"/><path d="M14 9.5L12 5H9L7 11h2l1-4 2 2.5V17h2v-6.5l2-1z"/></svg>';
        } else if (type === 'park') {
            return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L3 9h3v10h12V9h3L12 2z"/><path d="M12 22V9"/></svg>';
        } else if (type === 'shopping') {
            return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
        } else if (type === 'museum') {
            return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="22" x2="22" y2="22"/><line x1="4" y1="22" x2="4" y2="10"/><line x1="8" y1="22" x2="8" y2="10"/><line x1="12" y1="22" x2="12" y2="10"/><line x1="16" y1="22" x2="16" y2="10"/><line x1="20" y1="22" x2="20" y2="10"/><path d="M2 10L12 2l10 8z"/></svg>';
        }
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
    }

    function renderLocations(query) {
        query = (query || "").trim();
        if (!query) {
            renderRecommendedLocations();
        } else {
            searchLocations(query);
        }
    }

    function searchLocations(val) {
        if (searchTimeout) clearTimeout(searchTimeout);
        
        var listContainer = document.getElementById('note-location-list');
        if (!listContainer) return;

        val = (val || "").trim();
        if (!val) {
            renderRecommendedLocations();
            return;
        }

        listContainer.innerHTML = '<div style="text-align:center;padding:30px;color:var(--color-text-secondary);font-size:14px;"><div class="spinner" style="display:inline-block;width:20px;height:20px;border:2px solid var(--color-border-subtle);border-top-color:var(--color-accent);border-radius:50%;animation:spin 0.8s linear infinite;margin-bottom:8px;"></div><div>Aranıyor...</div></div>';

        searchTimeout = setTimeout(function () {
            fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(val) + '&addressdetails=1&limit=8', {
                headers: {
                    'Accept-Language': 'tr,en'
                }
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                renderSearchResults(data);
            })
            .catch(function (err) {
                console.error(err);
                renderLocalSearchResults(val);
            });
        }, 400);
    }

    function renderSearchResults(data) {
        var listContainer = document.getElementById('note-location-list');
        if (!listContainer) return;

        if (!data || data.length === 0) {
            listContainer.innerHTML = '<div style="text-align:center;padding:20px;color:var(--color-text-secondary);font-size:14px;">Sonuç bulunamadı</div>';
            return;
        }

        var html = '';
        data.forEach(function (item) {
            var fullName = item.display_name;
            var parts = fullName.split(',');
            var mainName = parts[0].trim();
            var subName = parts.slice(1, 4).map(function(p){ return p.trim(); }).join(', ');
            
            var type = 'pin';
            var lowerFull = fullName.toLowerCase();
            if (lowerFull.indexOf('stadyum') !== -1 || lowerFull.indexOf('stadı') !== -1 || lowerFull.indexOf('spor') !== -1 || item.class === 'stadium') {
                type = 'running';
            } else if (lowerFull.indexOf('park') !== -1 || item.class === 'park' || item.class === 'leisure') {
                type = 'park';
            } else if (lowerFull.indexOf('avm') !== -1 || lowerFull.indexOf('merkezi') !== -1 || item.class === 'shop') {
                type = 'shopping';
            } else if (lowerFull.indexOf('müze') !== -1 || item.class === 'tourism' || item.class === 'historic') {
                type = 'museum';
            }

            var displayName = mainName;
            if (subName) {
                displayName += ' (' + subName + ')';
            }

            html += '<div class="diary-location-item" onclick="Notes.selectLocation(\'' + displayName.replace(/'/g, "\\'") + '\')">' +
                '<div class="diary-location-item-icon-wrapper">' +
                getLocationIconSVG(type) +
                '</div>' +
                '<div class="diary-location-item-content" style="display:flex; flex-direction:column; gap:2px; flex:1; overflow:hidden;">' +
                '<span class="diary-location-item-name" style="font-weight:600; text-overflow:ellipsis; white-space:nowrap; overflow:hidden; display:block;">' + escapeHtml(mainName) + '</span>' +
                '<span class="diary-location-item-sub" style="font-size:12px; color:var(--color-text-secondary); text-overflow:ellipsis; white-space:nowrap; overflow:hidden; display:block;">' + escapeHtml(subName) + '</span>' +
                '</div>' +
                '</div>';
        });
        listContainer.innerHTML = html;
    }

    function renderRecommendedLocations() {
        var listContainer = document.getElementById('note-location-list');
        if (!listContainer) return;

        var html = '<div style="padding:6px 12px 4px;font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.05em;">Önerilen Konumlar</div>';
        if (typeof RECOMMENDED_LOCATIONS !== 'undefined') {
            RECOMMENDED_LOCATIONS.forEach(function (loc) {
                html += '<div class="diary-location-item" onclick="Notes.selectLocation(\'' + loc.name.replace(/'/g, "\\'") + '\')">'
                    + '<div class="diary-location-item-icon-wrapper">'
                    + getLocationIconSVG(loc.type)
                    + '</div>'
                    + '<div class="diary-location-item-content" style="display:flex;flex-direction:column;gap:1px;flex:1;overflow:hidden;">'
                    + '<span class="diary-location-item-name" style="font-weight:600;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;display:block;">' + escapeHtml(loc.name) + '</span>'
                    + (loc.sub ? '<span class="diary-location-item-sub" style="font-size:11px;color:var(--color-text-secondary);text-overflow:ellipsis;white-space:nowrap;overflow:hidden;display:block;">' + escapeHtml(loc.sub) + '</span>' : '')
                    + '</div>'
                    + '</div>';
            });
        }
        listContainer.innerHTML = html;
    }

    function renderLocalSearchResults(query) {
        var listContainer = document.getElementById('note-location-list');
        if (!listContainer) return;

        var filtered = [];
        if (typeof searchLocalDB !== 'undefined') {
            filtered = searchLocalDB(query);
        }

        if (filtered.length === 0) {
            listContainer.innerHTML = '<div style="text-align:center;padding:20px;color:var(--color-text-secondary);font-size:14px;">Sonuç bulunamadı</div>';
            return;
        }

        var html = '';
        filtered.forEach(function (loc) {
            html += '<div class="diary-location-item" onclick="Notes.selectLocation(\'' + loc.name.replace(/'/g, "\\'") + '\')">'
                + '<div class="diary-location-item-icon-wrapper">'
                + getLocationIconSVG(loc.type)
                + '</div>'
                + '<div class="diary-location-item-content" style="display:flex;flex-direction:column;gap:1px;flex:1;overflow:hidden;">'
                + '<span class="diary-location-item-name" style="font-weight:600;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;display:block;">' + escapeHtml(loc.name) + '</span>'
                + (loc.sub ? '<span class="diary-location-item-sub" style="font-size:11px;color:var(--color-text-secondary);text-overflow:ellipsis;white-space:nowrap;overflow:hidden;display:block;">' + escapeHtml(loc.sub) + '</span>' : '')
                + '</div>'
                + '</div>';
        });
        listContainer.innerHTML = html;
    }

    function selectLocation(name) {
        selectedLocation = name;
        var propLoc = document.getElementById('note-property-location');
        if (propLoc) {
            propLoc.textContent = name;
            propLoc.classList.remove('notum-property-value-empty');
        }
        closeLocationSearch();
        autoSaveNote();
    }

    function clearSelectedLocation() {
        selectedLocation = null;
        var propLoc = document.getElementById('note-property-location');
        if (propLoc) {
            propLoc.textContent = 'Konum Ekle';
            propLoc.classList.add('notum-property-value-empty');
        }
        autoSaveNote();
    }

    // ===== PROPERTY DROPDOWN =====

    function togglePropertyDropdown(event) {
        event.stopPropagation();
        var dropdown = document.getElementById('note-property-dropdown');
        if (!dropdown) return;
        var isActive = dropdown.classList.contains('active');
        // Close all dropdowns first
        document.querySelectorAll('.notum-property-add-dropdown.active').forEach(function(d) {
            d.classList.remove('active');
        });
        if (!isActive) {
            dropdown.classList.add('active');
            // Close on outside click
            setTimeout(function() {
                document.addEventListener('click', closePropertyDropdownOutside);
            }, 0);
        }
    }

    function closePropertyDropdownOutside(e) {
        var dropdown = document.getElementById('note-property-dropdown');
        if (dropdown && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
            document.removeEventListener('click', closePropertyDropdownOutside);
        }
    }

    function addProperty(type) {
        var dropdown = document.getElementById('note-property-dropdown');
        if (dropdown) dropdown.classList.remove('active');
        document.removeEventListener('click', closePropertyDropdownOutside);



        if (type === 'comments') {
            showNoteCommentInput = true;
            renderNoteComments();
            setTimeout(function() {
                var input = document.getElementById('note-comment-input');
                if (input) input.focus();
            }, 50);
            return;
        }

        if (type === 'location') {
            var locRow = document.getElementById('note-property-location-row');
            if (locRow) {
                if (locRow.style.display === 'none') {
                    locRow.style.display = '';
                    return;
                }
                // Already visible, max 1
                return;
            }
            return;
        }

        var container = document.getElementById('note-custom-properties');
        if (!container) return;

        var row = document.createElement('div');
        row.className = 'notum-property-row removable';
        row.setAttribute('data-property-type', type);

        if (type === 'tag') {
            row.innerHTML =
                '<span class="notum-property-label clickable-menu" onclick="PropertyMenu.show(event, this, \'tag\', \'notes\')" style="cursor: pointer;">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>' +
                '<span>Etiket</span>' +
                '</span>' +
                '<div class="notum-property-tag-container" style="flex: 1; display: flex; align-items: center;">' +
                '<input type="text" class="notum-property-tag-input" placeholder="Etiket yazın..." oninput="Notes.autoSaveNote()" onkeydown="if(event.key === \'Enter\') { Notes.saveTagProperty(this); }">' +
                '<div class="notum-property-tag-badge" onclick="Notes.editTagProperty(this)" style="display: none !important;"></div>' +
                '</div>' +
                '<button type="button" class="notum-property-remove-btn" onclick="Notes.removeCustomProperty(this)" title="Kaldır">&times;</button>';
        } else if (type === 'status') {
            row.innerHTML =
                '<span class="notum-property-label clickable-menu" onclick="PropertyMenu.show(event, this, \'status\', \'notes\')" style="cursor: pointer;">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>' +
                '<span>Durum</span>' +
                '</span>' +
                '<div class="notum-property-status-wrapper" style="flex: 1; display: flex; align-items: center; position: relative;">' +
                '<span class="notum-property-status-badge status-not-started" onclick="Notes.toggleStatusDropdown(event, this)">Başlamadı</span>' +
                '<div class="notum-property-status-dropdown">' +
                '<div class="notum-property-status-option status-not-started" onclick="Notes.selectStatus(this, \'Başlamadı\', \'not-started\')">Başlamadı</div>' +
                '<div class="notum-property-status-option status-in-progress" onclick="Notes.selectStatus(this, \'Devam ediyor\', \'in-progress\')">Devam ediyor</div>' +
                '<div class="notum-property-status-option status-completed" onclick="Notes.selectStatus(this, \'Tamamlandı\', \'completed\')">Tamamlandı</div>' +
                '</div>' +
                '</div>' +
                '<button type="button" class="notum-property-remove-btn" onclick="Notes.removeCustomProperty(this)" title="Kaldır">&times;</button>';
        } else if (type === 'checkbox') {
            row.innerHTML =
                '<span class="notum-property-label clickable-menu" onclick="PropertyMenu.show(event, this, \'checkbox\', \'notes\')" style="cursor: pointer;">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 12l2 2 4-4"></path></svg>' +
                '<span>Onay Kutusu</span>' +
                '</span>' +
                '<div style="display: flex; align-items: center; gap: 8px; flex: 1;">' +
                '<div class="notum-property-checkbox" onclick="Notes.toggleCheckbox(this)">' +
                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
                '</div>' +
                '<input type="text" class="notum-property-checkbox-label" placeholder="" oninput="Notes.autoSaveNote()">' +
                '</div>' +
                '<button type="button" class="notum-property-remove-btn" onclick="Notes.removeCustomProperty(this)" title="Kald\u0131r">&times;</button>';
        }

        // Insert in correct order: tags first, then statuses, then checkboxes
        var existingRows = container.querySelectorAll('.notum-property-row');
        var inserted = false;
        var typeOrder = { tag: 0, status: 1, checkbox: 2 };
        var newOrder = typeOrder[type] !== undefined ? typeOrder[type] : 99;
        for (var i = 0; i < existingRows.length; i++) {
            var existingType = existingRows[i].getAttribute('data-property-type');
            var existingOrder = typeOrder[existingType] !== undefined ? typeOrder[existingType] : 99;
            if (existingOrder > newOrder) {
                container.insertBefore(row, existingRows[i]);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            container.appendChild(row);
        }
        PropertyMenu.initDragAndDrop(container, 'notes');

        // Focus the input
        var input = row.querySelector('input[type="text"]');
        if (input) setTimeout(function() { input.focus(); }, 50);

        autoSaveNote();
    }

    function removeDefaultProperty(type) {
        if (type === 'location') {
            var locRow = document.getElementById('note-property-location-row');
            if (locRow) locRow.style.display = 'none';
            selectedLocation = null;
        }
        autoSaveNote();
    }

    function removeCustomProperty(btnElement) {
        var row = btnElement.closest('.notum-property-row');
        if (row) row.remove();
        autoSaveNote();
    }

    function toggleCheckbox(el) {
        el.classList.toggle('checked');
        autoSaveNote();
    }

    function saveTagProperty(input) {
        var val = input.value.trim();
        if (val) {
            var container = input.closest('.notum-property-tag-container');
            if (container) {
                var badge = container.querySelector('.notum-property-tag-badge');
                if (badge) {
                    badge.textContent = val;
                    badge.style.setProperty('display', 'inline-flex', 'important');
                    input.style.setProperty('display', 'none', 'important');
                }
            }
        }
        autoSaveNote();
    }

    function editTagProperty(badge) {
        var container = badge.closest('.notum-property-tag-container');
        if (container) {
            var input = container.querySelector('.notum-property-tag-input');
            if (input) {
                badge.style.setProperty('display', 'none', 'important');
                input.style.setProperty('display', 'inline-block', 'important');
                input.focus();
            }
        }
    }

    function toggleStatusDropdown(e, badge) {
        e.stopPropagation();
        var wrapper = badge.closest('.notum-property-status-wrapper');
        if (!wrapper) return;
        var dropdown = wrapper.querySelector('.notum-property-status-dropdown');
        if (!dropdown) return;

        // Close all other status dropdowns first
        var allDropdowns = document.querySelectorAll('.notum-property-status-dropdown');
        allDropdowns.forEach(function (d) {
            if (d !== dropdown) d.classList.remove('active');
        });

        var isActive = dropdown.classList.contains('active');
        if (isActive) {
            dropdown.classList.remove('active');
            document.removeEventListener('click', closeStatusDropdownsOutside);
        } else {
            dropdown.classList.add('active');
            setTimeout(function() {
                document.addEventListener('click', closeStatusDropdownsOutside);
            }, 0);
        }
    }

    function closeStatusDropdownsOutside(e) {
        var openDropdowns = document.querySelectorAll('.notum-property-status-dropdown.active');
        var closedAny = false;
        openDropdowns.forEach(function (dd) {
            if (!dd.contains(e.target)) {
                dd.classList.remove('active');
                closedAny = true;
            }
        });
        if (closedAny) {
            document.removeEventListener('click', closeStatusDropdownsOutside);
        }
    }

    function selectStatus(optionElement, text, statusClassSuffix) {
        var wrapper = optionElement.closest('.notum-property-status-wrapper');
        if (!wrapper) return;
        var badge = wrapper.querySelector('.notum-property-status-badge');
        if (badge) {
            badge.textContent = text;
            badge.className = 'notum-property-status-badge status-' + statusClassSuffix;
        }
        var dropdown = wrapper.querySelector('.notum-property-status-dropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
        autoSaveNote();
    }

    function getCustomProperties() {
        var container = document.getElementById('note-custom-properties');
        if (!container) return [];
        var props = [];
        var rows = container.querySelectorAll('.notum-property-row');
        for (var i = 0; i < rows.length; i++) {
            var type = rows[i].getAttribute('data-property-type');
            if (type === 'location' || type === 'date' || type === 'updated-date') continue;
            var labelSpan = rows[i].querySelector('.notum-property-label span');
            var labelVal = labelSpan ? labelSpan.textContent.trim() : '';
            var svgEl = rows[i].querySelector('.notum-property-label svg');
            var svgHtml = svgEl ? svgEl.outerHTML : '';
            if (type === 'tag') {
                var input = rows[i].querySelector('.notum-property-tag-input');
                props.push({ type: 'tag', label: labelVal, value: input ? input.value : '', icon: svgHtml });
            } else if (type === 'status') {
                var badge = rows[i].querySelector('.notum-property-status-badge');
                props.push({ type: 'status', label: labelVal, value: badge ? badge.textContent : 'Başlamadı', icon: svgHtml });
            } else if (type === 'checkbox') {
                var cb = rows[i].querySelector('.notum-property-checkbox');
                var input = rows[i].querySelector('.notum-property-checkbox-label');
                props.push({ type: 'checkbox', label: labelVal, checked: cb ? cb.classList.contains('checked') : false, value: input ? input.value : '', icon: svgHtml });
            }
        }
        return props;
    }

    function loadCustomProperties(properties) {
        var container = document.getElementById('note-custom-properties');
        if (!container) return;
        var customRows = container.querySelectorAll('.notum-property-row:not([data-property-type="location"]):not([data-property-type="date"]):not([data-property-type="updated-date"])');
        for (var i = 0; i < customRows.length; i++) {
            customRows[i].remove();
        }
        if (!properties || !properties.length) return;
        for (var i = 0; i < properties.length; i++) {
            var prop = properties[i];
            var row = document.createElement('div');
            row.className = 'notum-property-row removable';
            row.setAttribute('data-property-type', prop.type);

            if (prop.type === 'tag') {
                var hasVal = !!(prop.value || '').trim();
                var labelName = prop.label || 'Etiket';
                var defaultIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>';
                var iconHtml = prop.icon || defaultIcon;
                row.innerHTML =
                    '<span class="notum-property-label clickable-menu" onclick="PropertyMenu.show(event, this, \'tag\', \'notes\')" style="cursor: pointer;">' +
                    iconHtml +
                    '<span>' + escapeHtml(labelName) + '</span>' +
                    '</span>' +
                    '<div class="notum-property-tag-container" style="flex: 1; display: flex; align-items: center;">' +
                    '<input type="text" class="notum-property-tag-input" placeholder="Etiket yazın..." value="' + escapeHtml(prop.value || '') + '" oninput="Notes.autoSaveNote()" onkeydown="if(event.key === \'Enter\') { Notes.saveTagProperty(this); }" style="' + (hasVal ? 'display: none !important;' : '') + '">' +
                    '<div class="notum-property-tag-badge" onclick="Notes.editTagProperty(this)" style="' + (hasVal ? 'display: inline-flex !important;' : 'display: none !important;') + '">' + escapeHtml(prop.value || '') + '</div>' +
                    '</div>' +
                    '<button type="button" class="notum-property-remove-btn" onclick="Notes.removeCustomProperty(this)" title="Kaldır">&times;</button>';
            } else if (prop.type === 'status') {
                var val = prop.value || 'Başlamadı';
                var cls = 'status-not-started';
                if (val === 'Devam ediyor') cls = 'status-in-progress';
                else if (val === 'Tamamlandı') cls = 'status-completed';
                var labelName = prop.label || 'Durum';
                var defaultIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>';
                var iconHtml = prop.icon || defaultIcon;

                row.innerHTML =
                    '<span class="notum-property-label clickable-menu" onclick="PropertyMenu.show(event, this, \'status\', \'notes\')" style="cursor: pointer;">' +
                    iconHtml +
                    '</span>' +
                    '<div class="notum-property-status-wrapper" style="flex: 1; display: flex; align-items: center; position: relative;">' +
                    '<span class="notum-property-status-badge ' + cls + '" onclick="Notes.toggleStatusDropdown(event, this)">' + escapeHtml(val) + '</span>' +
                    '<div class="notum-property-status-dropdown">' +
                    '<div class="notum-property-status-option status-not-started" onclick="Notes.selectStatus(this, \'Başlamadı\', \'not-started\')">Başlamadı</div>' +
                    '<div class="notum-property-status-option status-in-progress" onclick="Notes.selectStatus(this, \'Devam ediyor\', \'in-progress\')">Devam ediyor</div>' +
                    '<div class="notum-property-status-option status-completed" onclick="Notes.selectStatus(this, \'Tamamlandı\', \'completed\')">Tamamlandı</div>' +
                    '</div>' +
                    '</div>' +
                    '<button type="button" class="notum-property-remove-btn" onclick="Notes.removeCustomProperty(this)" title="Kaldır">&times;</button>';
            } else if (prop.type === 'checkbox') {
                var labelName = prop.label || 'Onay Kutusu';
                var defaultIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 12l2 2 4-4"></path></svg>';
                var iconHtml = prop.icon || defaultIcon;
                row.innerHTML =
                    '<span class="notum-property-label clickable-menu" onclick="PropertyMenu.show(event, this, \'checkbox\', \'notes\')" style="cursor: pointer;">' +
                    iconHtml +
                    '<span>' + escapeHtml(labelName) + '</span>' +
                    '</span>' +
                    '<div style="display: flex; align-items: center; gap: 8px; flex: 1;">' +
                    '<div class="notum-property-checkbox' + (prop.checked ? ' checked' : '') + '" onclick="Notes.toggleCheckbox(this)">' +
                    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
                    '</div>' +
                    '<input type="text" class="notum-property-checkbox-label" placeholder="" value="' + escapeHtml(prop.value || '') + '" oninput="Notes.autoSaveNote()">' +
                    '</div>' +
                    '<button type="button" class="notum-property-remove-btn" onclick="Notes.removeCustomProperty(this)" title="Kaldır">&times;</button>';
            }
            container.appendChild(row);
        }
    }

    // Formatting and Selection logic for Notes
    function getFontFamilyStyle(font) {
        switch (font) {
            case 'Lobster': return "'Lobster', cursive";
            case 'Bungee': return "'Bungee', sans-serif";
            default: return "'Outfit', sans-serif";
        }
    }

    function changeFont(fontName) {
        var overlay = document.getElementById('note-modal-overlay');
        var entryId = overlay ? overlay.getAttribute('data-editing-id') : null;
        var notes = getNotes();

        if (entryId) {
            var note = notes.find(function(n) { return String(n.id) === String(entryId); });
            if (note) {
                note.fontFamily = fontName;
                saveNotes(notes);
            }
        }

        var titleInput = document.getElementById('note-title-input');
        if (titleInput) {
            titleInput.style.fontFamily = getFontFamilyStyle(fontName);
        }

        updateFontDropdownSelection(fontName);
        autoSaveNote();
    }

    function changeColor(hexCode) {
        var overlay = document.getElementById('note-modal-overlay');
        var entryId = overlay ? overlay.getAttribute('data-editing-id') : null;
        var notes = getNotes();

        if (entryId) {
            var note = notes.find(function(n) { return String(n.id) === String(entryId); });
            if (note) {
                note.textColor = hexCode;
                saveNotes(notes);
            }
        }

        var titleInput = document.getElementById('note-title-input');
        if (titleInput) {
            titleInput.style.setProperty('color', hexCode, 'important');
        }

        updateColorDropdownSelection(hexCode);

        var titleColorDropdown = document.getElementById('note-title-float-color-picker-dropdown');
        if (titleColorDropdown) {
            titleColorDropdown.style.display = 'none';
        }
        autoSaveNote();
    }

    function toggleTitleBold(event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        var overlay = document.getElementById('note-modal-overlay');
        var entryId = overlay ? overlay.getAttribute('data-editing-id') : null;
        var notes = getNotes();

        var note = entryId ? notes.find(function(n) { return String(n.id) === String(entryId); }) : null;
        var isBold = note ? (note.isBold !== false) : true;
        isBold = !isBold;
        
        if (note) {
            note.isBold = isBold;
            saveNotes(notes);
        }

        var titleInput = document.getElementById('note-title-input');
        if (titleInput) {
            titleInput.style.fontWeight = isBold ? '700' : '400';
        }

        updateNoteTitleFloatingMenuStates();
        autoSaveNote();
    }

    function toggleTitleItalic(event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        var overlay = document.getElementById('note-modal-overlay');
        var entryId = overlay ? overlay.getAttribute('data-editing-id') : null;
        var notes = getNotes();

        var note = entryId ? notes.find(function(n) { return String(n.id) === String(entryId); }) : null;
        var isItalic = note ? !!note.isItalic : false;
        isItalic = !isItalic;
        
        if (note) {
            note.isItalic = isItalic;
            saveNotes(notes);
        }

        var titleInput = document.getElementById('note-title-input');
        if (titleInput) {
            titleInput.style.fontStyle = isItalic ? 'italic' : 'normal';
        }

        updateNoteTitleFloatingMenuStates();
        autoSaveNote();
    }

    function toggleTitleUnderline(event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        var overlay = document.getElementById('note-modal-overlay');
        var entryId = overlay ? overlay.getAttribute('data-editing-id') : null;
        var notes = getNotes();

        var note = entryId ? notes.find(function(n) { return String(n.id) === String(entryId); }) : null;
        var isUnderline = note ? !!note.isUnderline : false;
        isUnderline = !isUnderline;
        
        if (note) {
            note.isUnderline = isUnderline;
            saveNotes(notes);
        }

        var titleInput = document.getElementById('note-title-input');
        if (titleInput) {
            titleInput.style.textDecoration = isUnderline ? 'underline' : 'none';
        }

        updateNoteTitleFloatingMenuStates();
        autoSaveNote();
    }

    function applyFormat(command, value) {
        document.execCommand(command, false, value || null);
        autoSaveNote();
        updateNoteFloatingMenuStates();
    }

    function changeWordColor(hexCode) {
        applyFormat('foreColor', hexCode);
        var underline = document.querySelector('#note-float-btn-color-trigger span');
        if (underline) {
            underline.style.borderBottomColor = hexCode;
        }
        var dropdown = document.getElementById('note-float-color-picker-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }

    function updateFontDropdownSelection(fontName) {
        var prefix = 'note-title-float-btn-';
        ['outfit', 'lobster', 'bungee'].forEach(function(f) {
            var el = document.getElementById(prefix + f);
            if (el) {
                if (f === fontName.toLowerCase()) {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            }
        });
    }

    function updateColorDropdownSelection(color) {
        var cells = document.querySelectorAll('.word-color-cell');
        cells.forEach(function(cell) {
            if (cell.getAttribute('title') === color) {
                cell.classList.add('active');
            } else {
                cell.classList.remove('active');
            }
        });
    }

    function updateNoteFloatingMenuStates() {
        var btnBold = document.getElementById('note-float-btn-bold');
        var btnItalic = document.getElementById('note-float-btn-italic');
        var btnUnderline = document.getElementById('note-float-btn-underline');
        if (!btnBold || !btnItalic || !btnUnderline) return;
        
        if (document.queryCommandState('bold')) btnBold.classList.add('active');
        else btnBold.classList.remove('active');
        
        if (document.queryCommandState('italic')) btnItalic.classList.add('active');
        else btnItalic.classList.remove('active');
        
        if (document.queryCommandState('underline')) btnUnderline.classList.add('active');
        else btnUnderline.classList.remove('active');
    }

    function updateNoteTitleFloatingMenuStates() {
        var overlay = document.getElementById('note-modal-overlay');
        var entryId = overlay ? overlay.getAttribute('data-editing-id') : null;

        var notes = getNotes();
        var note = notes.find(function(n) { return String(n.id) === String(entryId); });
        
        var isBold = note ? (note.isBold !== false) : true;
        var isItalic = note ? !!note.isItalic : false;
        var isUnderline = note ? !!note.isUnderline : false;
        var font = note ? (note.fontFamily || 'Outfit') : 'Outfit';
        var color = note ? (note.textColor || '#334155') : '#334155';

        var btnBold = document.getElementById('note-title-float-btn-bold');
        var btnItalic = document.getElementById('note-title-float-btn-italic');
        var btnUnderline = document.getElementById('note-title-float-btn-underline');
        if (!btnBold || !btnItalic || !btnUnderline) return;

        if (isBold) btnBold.classList.add('active');
        else btnBold.classList.remove('active');

        if (isItalic) btnItalic.classList.add('active');
        else btnItalic.classList.remove('active');

        if (isUnderline) btnUnderline.classList.add('active');
        else btnUnderline.classList.remove('active');

        updateFontDropdownSelection(font);
        updateColorDropdownSelection(color);
    }

    var noteSelectionTimer = null;
    function handleNoteSelectionChange() {
        if (noteSelectionTimer) clearTimeout(noteSelectionTimer);
        noteSelectionTimer = setTimeout(function() {
            var overlay = document.getElementById('note-modal-overlay');
            var isOpen = overlay && overlay.style.display !== 'none';
            if (!isOpen) return;

            var descInput = document.getElementById('note-desc-input');
            var menu = document.getElementById('note-floating-menu');
            if (!descInput || !menu) return;

            var sel = window.getSelection();
            if (!sel || sel.isCollapsed || sel.toString().trim() === '') {
                hideNoteFloatingMenu();
                return;
            }

            var range = sel.getRangeAt(0);
            if (!descInput.contains(range.commonAncestorContainer)) {
                hideNoteFloatingMenu();
                return;
            }

            var rect = range.getBoundingClientRect();
            if (menu.parentElement !== document.body) {
                document.body.appendChild(menu);
                menu.style.position = 'absolute';
            }

            menu.style.display = 'flex';
            
            var menuWidth = menu.offsetWidth || 150;
            var menuHeight = menu.offsetHeight || 38;

            var top = rect.bottom + window.pageYOffset + 10;
            var left = rect.left + window.pageXOffset + (rect.width / 2) - (menuWidth / 2);

            var viewportBottom = window.innerHeight + window.pageYOffset;
            if (top + menuHeight > viewportBottom) {
                top = rect.top + window.pageYOffset - menuHeight - 10;
            }

            if (left < 10) left = 10;
            if (left + menuWidth > window.innerWidth - 10) {
                left = window.innerWidth - menuWidth - 10;
            }

            menu.style.top = top + 'px';
            menu.style.left = left + 'px';
            menu.classList.add('show');

            updateNoteFloatingMenuStates();
        }, 100);
    }

    function hideNoteFloatingMenu() {
        var menu = document.getElementById('note-floating-menu');
        if (menu) {
            menu.classList.remove('show');
            setTimeout(function() {
                if (!menu.classList.contains('show')) {
                    menu.style.display = 'none';
                }
            }, 200);
        }
    }

    function handleNoteTitleSelection(e) {
        setTimeout(function() {
            var overlay = document.getElementById('note-modal-overlay');
            var isOpen = overlay && overlay.style.display !== 'none';
            if (!isOpen) return;

            var titleInput = document.getElementById('note-title-input');
            var menu = document.getElementById('note-title-floating-menu');
            if (!titleInput || !menu) return;

            var start = titleInput.selectionStart;
            var end = titleInput.selectionEnd;

            if (start !== end) {
                var selectedText = titleInput.value.substring(start, end).trim();
                if (selectedText.length > 0) {
                    if (menu.parentElement !== document.body) {
                        document.body.appendChild(menu);
                        menu.style.position = 'absolute';
                    }

                    menu.style.display = 'flex';
                    
                    var menuWidth = menu.offsetWidth || 160;
                    var menuHeight = menu.offsetHeight || 150;

                    var top, left;
                    if (e && e.pageX && e.pageY) {
                        top = e.pageY + 15;
                        left = e.pageX - (menuWidth / 2);
                    } else {
                        var rect = titleInput.getBoundingClientRect();
                        top = rect.bottom + window.pageYOffset + 5;
                        left = rect.left + window.pageXOffset + (rect.width / 2) - (menuWidth / 2);
                    }

                    var viewportBottom = window.innerHeight + window.pageYOffset;
                    if (top + menuHeight > viewportBottom) {
                        if (e && e.pageY) {
                            top = e.pageY - menuHeight - 15;
                        } else {
                            var rect = titleInput.getBoundingClientRect();
                            top = rect.top + window.pageYOffset - menuHeight - 5;
                        }
                    }

                    if (left < 10) left = 10;
                    if (left + menuWidth > window.innerWidth - 10) {
                        left = window.innerWidth - menuWidth - 10;
                    }

                    menu.style.top = top + 'px';
                    menu.style.left = left + 'px';
                    menu.classList.add('show');
                    
                    updateNoteTitleFloatingMenuStates();
                }
            } else {
                hideNoteTitleFloatingMenu();
            }
        }, 50);
    }

    function hideNoteTitleFloatingMenu() {
        var menu = document.getElementById('note-title-floating-menu');
        if (menu) {
            menu.classList.remove('show');
            setTimeout(function() {
                if (!menu.classList.contains('show')) {
                    menu.style.display = 'none';
                }
            }, 200);
        }
    }

    function renderNoteColorPicker() {
        var dropdown = document.getElementById('note-float-color-picker-dropdown');
        if (!dropdown) return;
        var html = '';
        html += '<div class="word-color-section-title" style="margin-top: 0 !important;">Tema Renkleri</div>';
        html += '<div class="word-color-grid-theme">';
        var themePalette = [
            ['#FFFFFF', '#000000', '#EEF2F6', '#1E293B', '#3B82F6', '#F97316', '#22C55E', '#06B6D4', '#A855F7', '#FACC15'],
            ['#F8FAFC', '#7F8D9F', '#F8FAFC', '#E2E8F0', '#EFF6FF', '#FFF7ED', '#F0FDF4', '#ECFEFF', '#FAF5FF', '#FEFCE8'],
            ['#F1F5F9', '#64748B', '#F1F5F9', '#CBD5E1', '#DBEAFE', '#FFEDD5', '#DCFCE7', '#CFFAFE', '#F3E8FF', '#FEF9C3'],
            ['#E2E8F0', '#475569', '#E2E8F0', '#94A3B8', '#BFDBFE', '#FED7AA', '#BBF7D0', '#A5F3FC', '#E9D5FF', '#FEF08A'],
            ['#CBD5E1', '#334155', '#CBD5E1', '#475569', '#2563EB', '#EA580C', '#16A34A', '#0891B2', '#9333EA', '#CA8A04'],
            ['#94A3B8', '#0F172A', '#94A3B8', '#0F172A', '#1D4ED8', '#C2410C', '#15803D', '#0E7490', '#7E22CE', '#A16207']
        ];
        for (var row = 0; row < themePalette.length; row++) {
            for (var col = 0; col < 10; col++) {
                var hex = themePalette[row][col];
                html += '<div class="word-color-cell" style="background-color: ' + hex + ';" onclick="Notes.changeWordColor(\'' + hex + '\')" title="' + hex + '"></div>';
            }
        }
        html += '</div>';
        html += '<div class="word-color-section-title" style="margin-top: 4px;">Standart Renkler</div>';
        html += '<div class="word-color-grid-standard">';
        var standardColors = ['#8B0000', '#EF4444', '#F97316', '#FACC15', '#A3E635', '#22C55E', '#06B6D4', '#3B82F6', '#1E3A8A', '#A855F7'];
        for (var i = 0; i < standardColors.length; i++) {
            var hex = standardColors[i];
            html += '<div class="word-color-cell" style="background-color: ' + hex + ';" onclick="Notes.changeWordColor(\'' + hex + '\')" title="' + hex + '"></div>';
        }
        html += '</div>';
        dropdown.innerHTML = html;
    }

    function renderNoteTitleColorPicker() {
        var dropdown = document.getElementById('note-title-float-color-picker-dropdown');
        if (!dropdown) return;
        var html = '';
        html += '<div class="word-color-section-title" style="margin-top: 0 !important;">Tema Renkleri</div>';
        html += '<div class="word-color-grid-theme">';
        var themePalette = [
            ['#FFFFFF', '#000000', '#EEF2F6', '#1E293B', '#3B82F6', '#F97316', '#22C55E', '#06B6D4', '#A855F7', '#FACC15'],
            ['#F8FAFC', '#7F8D9F', '#F8FAFC', '#E2E8F0', '#EFF6FF', '#FFF7ED', '#F0FDF4', '#ECFEFF', '#FAF5FF', '#FEFCE8'],
            ['#F1F5F9', '#64748B', '#F1F5F9', '#CBD5E1', '#DBEAFE', '#FFEDD5', '#DCFCE7', '#CFFAFE', '#F3E8FF', '#FEF9C3'],
            ['#E2E8F0', '#475569', '#E2E8F0', '#94A3B8', '#BFDBFE', '#FED7AA', '#BBF7D0', '#A5F3FC', '#E9D5FF', '#FEF08A'],
            ['#CBD5E1', '#334155', '#CBD5E1', '#475569', '#2563EB', '#EA580C', '#16A34A', '#0891B2', '#9333EA', '#CA8A04'],
            ['#94A3B8', '#0F172A', '#94A3B8', '#0F172A', '#1D4ED8', '#C2410C', '#15803D', '#0E7490', '#7E22CE', '#A16207']
        ];
        for (var row = 0; row < themePalette.length; row++) {
            for (var col = 0; col < 10; col++) {
                var hex = themePalette[row][col];
                html += '<div class="word-color-cell" style="background-color: ' + hex + ';" onclick="Notes.changeColor(\'' + hex + '\')" title="' + hex + '"></div>';
            }
        }
        html += '</div>';
        html += '<div class="word-color-section-title" style="margin-top: 4px;">Standart Renkler</div>';
        html += '<div class="word-color-grid-standard">';
        var standardColors = ['#8B0000', '#EF4444', '#F97316', '#FACC15', '#A3E635', '#22C55E', '#06B6D4', '#3B82F6', '#1E3A8A', '#A855F7'];
        for (var i = 0; i < standardColors.length; i++) {
            var hex = standardColors[i];
            html += '<div class="word-color-cell" style="background-color: ' + hex + ';" onclick="Notes.changeColor(\'' + hex + '\')" title="' + hex + '"></div>';
        }
        html += '</div>';
        dropdown.innerHTML = html;
    }

    function initNotesFormatting() {
        renderNoteColorPicker();
        renderNoteTitleColorPicker();

        var titleInput = document.getElementById('note-title-input');
        if (titleInput) {
            titleInput.addEventListener('mouseup', handleNoteTitleSelection);
            titleInput.addEventListener('keyup', handleNoteTitleSelection);
            titleInput.addEventListener('dblclick', handleNoteTitleSelection);
        }

        document.addEventListener('selectionchange', handleNoteSelectionChange);

        var floatMenu = document.getElementById('note-floating-menu');
        if (floatMenu) {
            floatMenu.addEventListener('mousedown', function(e) { e.preventDefault(); });
        }
        var titleMenu = document.getElementById('note-title-floating-menu');
        if (titleMenu) {
            titleMenu.addEventListener('mousedown', function(e) { e.preventDefault(); });
        }

        var btnBold = document.getElementById('note-float-btn-bold');
        if (btnBold) btnBold.onclick = function() { applyFormat('bold'); };
        var btnItalic = document.getElementById('note-float-btn-italic');
        if (btnItalic) btnItalic.onclick = function() { applyFormat('italic'); };
        var btnUnderline = document.getElementById('note-float-btn-underline');
        if (btnUnderline) btnUnderline.onclick = function() { applyFormat('underline'); };

        var btnH1 = document.getElementById('note-float-btn-h1');
        if (btnH1) btnH1.onclick = function() { applyFormat('formatBlock', '<h1>'); };
        var btnH2 = document.getElementById('note-float-btn-h2');
        if (btnH2) btnH2.onclick = function() { applyFormat('formatBlock', '<h2>'); };
        var btnH3 = document.getElementById('note-float-btn-h3');
        if (btnH3) btnH3.onclick = function() { applyFormat('formatBlock', '<h3>'); };

        var colorTrigger = document.getElementById('note-float-btn-color-trigger');
        if (colorTrigger) {
            colorTrigger.onclick = function(e) {
                e.stopPropagation();
                var dropdown = document.getElementById('note-float-color-picker-dropdown');
                if (dropdown) {
                    var isShowing = dropdown.style.display === 'flex';
                    dropdown.style.display = isShowing ? 'none' : 'flex';
                }
            };
        }

        var titleColorTrigger = document.getElementById('note-title-float-btn-color-trigger');
        if (titleColorTrigger) {
            titleColorTrigger.onclick = function(e) {
                e.stopPropagation();
                var dropdown = document.getElementById('note-title-float-color-picker-dropdown');
                if (dropdown) {
                    var isShowing = dropdown.style.display === 'flex';
                    dropdown.style.display = isShowing ? 'none' : 'flex';
                }
            };
        }

        var titleBtnBold = document.getElementById('note-title-float-btn-bold');
        if (titleBtnBold) titleBtnBold.onclick = function(e) { toggleTitleBold(e); };
        var titleBtnItalic = document.getElementById('note-title-float-btn-italic');
        if (titleBtnItalic) titleBtnItalic.onclick = function(e) { toggleTitleItalic(e); };
        var titleBtnUnderline = document.getElementById('note-title-float-btn-underline');
        if (titleBtnUnderline) titleBtnUnderline.onclick = function(e) { toggleTitleUnderline(e); };

        document.addEventListener('click', function(e) {
            var noteTitleMenu = document.getElementById('note-title-floating-menu');
            if (noteTitleMenu && !e.target.closest('#note-title-input') && !e.target.closest('#note-title-floating-menu')) {
                hideNoteTitleFloatingMenu();
            }
            var noteMenu = document.getElementById('note-floating-menu');
            if (noteMenu && !e.target.closest('#note-desc-input') && !e.target.closest('#note-floating-menu')) {
                hideNoteFloatingMenu();
            }
        });
    }

    function createVersionCheckpoint(noteId, force) {
        var notes = getNotes();
        var noteIndex = notes.findIndex(function (n) { return String(n.id) === String(noteId); });
        if (noteIndex === -1) return;

        var note = notes[noteIndex];
        if (!note.versions) note.versions = [];

        var lastVersion = note.versions[note.versions.length - 1];
        var hasChanged = !lastVersion || lastVersion.title !== note.title || lastVersion.description !== note.description;
        if (!hasChanged) return;

        if (!force && lastVersion) {
            var lastTime = new Date(lastVersion.timestamp).getTime();
            if (Date.now() - lastTime < 5 * 60 * 1000) { // 5 minutes throttle
                return;
            }
        }

        note.versions.push({
            id: Date.now().toString(),
            title: note.title || '',
            description: note.description || '',
            timestamp: new Date().toISOString(),
            photos: (note.photos || []).slice(),
            customProperties: JSON.parse(JSON.stringify(note.customProperties || []))
        });

        if (note.versions.length > 50) {
            note.versions.shift();
        }

        saveNotes(notes);
    }

    function restoreNoteVersion(noteId, version) {
        var notes = getNotes();
        var noteIndex = notes.findIndex(function (n) { return String(n.id) === String(noteId); });
        if (noteIndex === -1) return;

        // Force save a checkpoint of current state before restoring
        createVersionCheckpoint(noteId, true);

        notes[noteIndex].title = version.title;
        notes[noteIndex].description = version.description;
        if (version.photos) notes[noteIndex].photos = version.photos;
        if (version.customProperties) notes[noteIndex].customProperties = version.customProperties;
        notes[noteIndex].updatedAt = new Date().toISOString();

        saveNotes(notes);
        render();

        // Reload editor inputs in real-time
        openEditModal(noteId);

        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show('Sürüm başarıyla geri yüklendi!', 'success');
        }
    }

    function getHiddenProperties() {
        var hidden = [];
        var locRow = document.getElementById('note-property-location-row');
        if (locRow && locRow.style.display === 'none') hidden.push('location');
        return hidden;
    }

    return {
        render: render,
        getNotes: getNotes,
        saveNotes: saveNotes,
        openModal: openModal,
        closeModal: closeModal,
        openEditModal: openEditModal,
        openDetail: openDetail,
        closeDetail: closeDetail,
        toggleMenu: toggleMenu,
        handleMenuAction: handleMenuAction,
        saveNote: saveNote,
        updateNote: updateNote,
        confirmDelete: confirmDelete,
        closeDeleteModal: closeDeleteModal,
        executeDelete: executeDelete,
        triggerPhotoUpload: triggerPhotoUpload,
        handlePhotoSelect: handlePhotoSelect,
        removePhoto: removePhoto,
        shareToTeam: shareToTeam,
        closeShareModal: closeShareModal,
        toggleShareDropdown: toggleShareDropdown,
        toggleShareTeam: toggleShareTeam,
        doShareToTeam: doShareToTeam,
        toggleEmojiPicker: toggleEmojiPicker,
        changeEmojiCategory: changeEmojiCategory,
        insertEmoji: insertEmoji,
        insertCheckbox: insertCheckbox,
        toggleTodoItem: toggleTodoItem,
        parseDescription: parseDescription,
        autoSaveNote: autoSaveNote,
        openLocationSearch: openLocationSearch,
        closeLocationSearch: closeLocationSearch,
        searchLocations: searchLocations,
        selectLocation: selectLocation,
        clearSelectedLocation: clearSelectedLocation,
        togglePropertyDropdown: togglePropertyDropdown,
        addProperty: addProperty,
        removeDefaultProperty: removeDefaultProperty,
        removeCustomProperty: removeCustomProperty,
        toggleCheckbox: toggleCheckbox,
        saveTagProperty: saveTagProperty,
        editTagProperty: editTagProperty,
        toggleStatusDropdown: toggleStatusDropdown,
        selectStatus: selectStatus,
        addComment: addComment,
        toggleCommentDropdown: toggleCommentDropdown,
        editComment: editComment,
        saveCommentEdit: saveCommentEdit,
        cancelCommentEdit: cancelCommentEdit,
        deleteComment: deleteComment,
        likeComment: likeComment,
        dislikeComment: dislikeComment,
        showReplyInput: showReplyInput,
        hideReplyInput: hideReplyInput,
        addReply: addReply,
        toggleReplies: toggleReplies,
        changeFont: changeFont,
        changeColor: changeColor,
        changeWordColor: changeWordColor,
        restoreNoteVersion: restoreNoteVersion
    };

    function getRelativeTimeString(dateStr) {
        var date = new Date(dateStr);
        var now = new Date();
        var diffMs = now - date;
        var diffMins = Math.floor(diffMs / 60000);
        var diffHours = Math.floor(diffMs / 3600000);
        var diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'şimdi';
        if (diffMins < 60) return diffMins + ' dk önce';
        if (diffHours < 24) return diffHours + ' sa önce';
        if (diffDays < 7) return diffDays + ' gün önce';
        
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) + ', ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }

    function getCommentAvatarHtml(comment) {
        var email = comment.email || 'default';
        var firstName = comment.firstName || 'U';
        var lastName = comment.lastName || '';
        var initials = (firstName.charAt(0) + (lastName.charAt(0) || '')).toUpperCase();
        
        var avatarUrl = null;
        try {
            avatarUrl = localStorage.getItem('avatar_' + email);
        } catch(e) {}
        
        var avatarStyle = '';
        var avatarContent = '';
        
        if (avatarUrl) {
            avatarStyle = 'background-image: url(\'' + avatarUrl + '\'); background-size: cover; background-position: center;';
        } else {
            avatarStyle = 'background-color: #64748b; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 500; font-size: 12px;';
            avatarContent = escapeHtml(initials);
        }
        
        return '<div class="comment-avatar-wrapper" style="width: 30px; height: 30px; flex-shrink: 0; user-select: none;">' +
               '  <div class="comment-avatar" style="width: 30px; height: 30px; border-radius: 50%; ' + avatarStyle + '\">' + avatarContent + '</div>' +
               '</div>';
    }

    function buildNoteCommentsHTML(commentsList) {
        var list = commentsList || [];
        var count = list.length;
        var showInput = showNoteCommentInput;
        
        var container = document.getElementById('note-comments-section');
        if (count === 0 && !showInput) {
            if (container) container.style.display = 'none';
            return '';
        } else {
            if (container) container.style.display = 'block';
        }
        
        var html = 
            '<div class="comments-container" style="margin-top: 0px;">' +
            '  <div style="font-size: 12px; font-weight: 500; color: var(--color-text-secondary, #64748b); margin-bottom: 8px; display: flex; align-items: center;">' +
            '    <span>Yorumlar</span>' +
            '  </div>';
            
        html += '  <div class="comments-list" style="padding-right: 4px;">';
        
        var user = (typeof Auth !== 'undefined') ? Auth.getUser() : null;
        var currentUserEmail = user ? (user.email || 'default') : 'default';
        var curFirstName = (user && user.firstName) ? user.firstName : 'Burak';
        var curLastName = (user && user.lastName) ? user.lastName : 'Aktürk';
        var curEmail = (user && user.email) ? user.email : 'burak@noteday.com';
        var curUserAvatar = getCommentAvatarHtml({ firstName: curFirstName, lastName: curLastName, email: curEmail });

        if (count > 0) {
            list.forEach(function (comment) {
                var name = ((comment.firstName || '') + ' ' + (comment.lastName || '')).trim() || 'Kullanıcı';
                var relativeTime = getRelativeTimeString(comment.date);
                var commentText = escapeHtml(comment.text);
                var likes = comment.likes || [];
                var dislikes = comment.dislikes || [];
                var replies = comment.replies || [];
                
                var hasLiked = likes.includes(currentUserEmail);
                var hasDisliked = dislikes.includes(currentUserEmail);
                
                var likeIcon = hasLiked ? 
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-accent, #3b82f6);"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>' :
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>';
                var dislikeIcon = hasDisliked ?
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-accent, #3b82f6);"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>' :
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>';

                var timeBadge = relativeTime + (comment.edited ? ' (düzenlendi)' : '');

                html +=
                    '    <div class="comment-item" style="display: flex; gap: 10px; margin-bottom: 12px; align-items: flex-start; position: relative;">' +
                    '      <div style="margin-top: 8px;">' + getCommentAvatarHtml(comment) + '</div>' +
                    '      <div class="comment-body" style="flex: 1; min-width: 0; margin-top: 2px; padding-right: 24px;">' +
                    '        <div class="comment-header" style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 2px;">' +
                    '          <span class="comment-author" style="font-weight: 600; font-size: 13px; color: var(--color-text, #1e293b);">' + escapeHtml(name) + '</span>' +
                    '          <span class="comment-time" style="font-size: 11px; color: var(--color-text-secondary, #94a3b8);">' + timeBadge + '</span>' +
                    '        </div>' +
                    '        <div id="comment-text-' + comment.id + '" data-raw-text="' + escapeHtml(comment.text) + '" class="comment-text" style="font-size: 13px; color: var(--color-text); line-height: 1.4; word-break: break-word;">' + commentText + '</div>' +
                    
                    // Likes, Dislikes, Reply Action Buttons
                    '        <div class="comment-action-buttons" style="display: flex; align-items: center; gap: 14px; margin-top: 6px; font-size: 11px; color: var(--color-text-secondary, #64748b);">' +
                    '          <button type="button" onclick="Notes.likeComment(\'' + comment.id + '\')" style="display: inline-flex !important; align-items: center !important; border: none !important; background: transparent !important; cursor: pointer !important; color: inherit !important; padding: 0 !important; margin: 0 !important; outline: none !important; height: 14px !important; line-height: 1 !important; transform: none !important; transition: none !important;">' +
                    '            ' + likeIcon +
                    '            ' + (likes.length > 0 ? '<span style="font-size: 11px; margin-left: 4px; line-height: 1; display: inline-block;">' + likes.length + '</span>' : '') +
                    '          </button>' +
                    '          <button type="button" onclick="Notes.dislikeComment(\'' + comment.id + '\')" style="display: inline-flex !important; align-items: center !important; border: none !important; background: transparent !important; cursor: pointer !important; color: inherit !important; padding: 0 !important; margin: 0 !important; outline: none !important; height: 14px !important; line-height: 1 !important; transform: none !important; transition: none !important;">' +
                    '            ' + dislikeIcon +
                    '          </button>' +
                    '          <button type="button" onclick="Notes.showReplyInput(\'' + comment.id + '\')" style="border: none; background: transparent; cursor: pointer; color: var(--color-text-secondary, #64748b); font-weight: 600; padding: 0; font-size: 11px; outline: none;">' +
                    '            Yanıtla' +
                    '          </button>' +
                    '        </div>' +
                    
                    // Reply Input Box
                    '        <div id="reply-input-row-' + comment.id + '" style="display: ' + (activeReplyInput === comment.id ? 'flex' : 'none') + '; gap: 8px; margin-top: 16px; align-items: center;">' +
                    '          <div style="flex-shrink: 0;">' + curUserAvatar + '</div>' +
                    '          <input type="text" id="reply-field-' + comment.id + '" class="comment-input-field" placeholder="Yanıt ekleyin..." style="flex: 1; border: none; outline: none; background: transparent; font-size: 12px; color: var(--color-text); padding: 4px 0;" onkeydown="if(event.key === \'Enter\') { Notes.addReply(\'' + comment.id + '\'); }" oninput="var btn = document.getElementById(\'reply-submit-btn-\' + \'' + comment.id + '\'); if (this.value.trim()) { btn.style.background = \'#0f172a\'; btn.style.color = \'#ffffff\'; } else { btn.style.background = \'#f1f5f9\'; btn.style.color = \'#cbd5e1\'; }">' +
                    '          <button type="button" id="reply-submit-btn-' + comment.id + '" class="comment-submit-btn" onclick="Notes.addReply(\'' + comment.id + '\')" style="background: #f1f5f9; color: #cbd5e1; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease; outline: none; padding: 0; flex-shrink: 0;">' +
                    '            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>' +
                    '          </button>' +
                    '        </div>';

                // Replies Toggle Button
                if (replies.length > 0) {
                    var isRepliesVisible = !!visibleReplies[comment.id];
                    var toggleText = isRepliesVisible ? 'Yanıtları gizle' : (replies.length + ' yanıt');
                    var toggleIcon = isRepliesVisible ? 
                        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>' :
                        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';

                    html +=
                        '        <div style="margin-top: 8px;">' +
                        '          <button type="button" onclick="Notes.toggleReplies(\'' + comment.id + '\')" style="border: none; background: transparent; cursor: pointer; color: #3b82f6; font-weight: 600; font-size: 11px; display: flex; align-items: center; gap: 4px; padding: 0; outline: none;">' +
                        '            <span>' + toggleText + '</span>' +
                        '            ' + toggleIcon +
                        '          </button>' +
                        '        </div>';

                    // Nested Replies List
                    if (isRepliesVisible) {
                        html += '        <div class="replies-list-container">';
                        replies.forEach(function (reply) {
                            var rName = ((reply.firstName || '') + ' ' + (reply.lastName || '')).trim() || 'Kullanıcı';
                            var rRelativeTime = getRelativeTimeString(reply.date);
                            var rLikes = reply.likes || [];
                            var rDislikes = reply.dislikes || [];
                            var rHasLiked = rLikes.includes(currentUserEmail);
                            var rHasDisliked = rDislikes.includes(currentUserEmail);
                            
                            var rLikeIcon = rHasLiked ? 
                                '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-accent, #3b82f6);"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>' :
                                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>';
                            var rDislikeIcon = rHasDisliked ?
                                '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-accent, #3b82f6);"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>' :
                                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>';

                            var rTimeBadge = rRelativeTime + (reply.edited ? ' (düzenlendi)' : '');

                            html +=
                                '          <div class="reply-item-wrapper">' +
                                '            <div style="margin-top: 4px; transform: scale(0.85);">' + getCommentAvatarHtml(reply) + '</div>' +
                                '            <div class="reply-body" style="flex: 1; min-width: 0; margin-top: 2px;">' +
                                '              <div class="reply-header" style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 2px;">' +
                                '                <span class="reply-author" style="font-weight: 600; font-size: 12px; color: var(--color-text, #1e293b);">' + escapeHtml(rName) + '</span>' +
                                '                <span class="reply-time" style="font-size: 10px; color: var(--color-text-secondary, #94a3b8);">' + rTimeBadge + '</span>' +
                                '              </div>' +
                                '              <div id="comment-text-' + reply.id + '" data-raw-text="' + escapeHtml(reply.text) + '" class="reply-text" style="font-size: 12px; color: var(--color-text); line-height: 1.4; word-break: break-word;">' + escapeHtml(reply.text) + '</div>' +
                                '              <div class="reply-action-buttons" style="display: flex; align-items: center; gap: 12px; margin-top: 4px; font-size: 10px; color: var(--color-text-secondary, #64748b);">' +
                                '                <button type="button" onclick="Notes.likeComment(\'' + comment.id + '\', \'' + reply.id + '\')" style="display: inline-flex !important; align-items: center !important; border: none !important; background: transparent !important; cursor: pointer !important; color: inherit !important; padding: 0 !important; margin: 0 !important; outline: none !important; height: 12px !important; line-height: 1 !important; transform: none !important; transition: none !important;">' +
                                '                  ' + rLikeIcon +
                                '                  ' + (rLikes.length > 0 ? '<span style="font-size: 10px; margin-left: 3px; line-height: 1; display: inline-block;">' + rLikes.length + '</span>' : '') +
                                '                </button>' +
                                '                <button type="button" onclick="Notes.dislikeComment(\'' + comment.id + '\', \'' + reply.id + '\')" style="display: inline-flex !important; align-items: center !important; border: none !important; background: transparent !important; cursor: pointer !important; color: inherit !important; padding: 0 !important; margin: 0 !important; outline: none !important; height: 12px !important; line-height: 1 !important; transform: none !important; transition: none !important;">' +
                                '                  ' + rDislikeIcon +
                                '                </button>' +
                                '                <button type="button" onclick="Notes.showReplyInput(\'' + comment.id + '\')" style="border: none; background: transparent; cursor: pointer; color: var(--color-text-secondary, #64748b); font-weight: 600; padding: 0; font-size: 10px; outline: none;">' +
                                '                  Yanıtla' +
                                '                </button>' +
                                '              </div>' +
                                '            </div>' +
                                
                                // 3 dots action menu for reply
                                '            <div class="comment-actions-trigger" style="margin-left: auto; flex-shrink: 0; align-self: flex-start; margin-top: 4px;">' +
                                '              <button type="button" class="comment-more-btn" onclick="Notes.toggleCommentDropdown(event, \'' + reply.id + '\')" title="İşlemler">' +
                                '                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>' +
                                '              </button>' +
                                '              <div id="comment-dropdown-' + reply.id + '" class="comment-dropdown" style="right: 0; left: auto;">' +
                                '                <div class="comment-dropdown-item" onclick="Notes.editComment(\'' + comment.id + '\', \'' + reply.id + '\')">' +
                                '                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
                                '                  <span>Düzenle</span>' +
                                '                </div>' +
                                '                <div class="comment-dropdown-item delete" onclick="Notes.deleteComment(\'' + comment.id + '\', \'' + reply.id + '\')">' +
                                '                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>' +
                                '                  <span>Çöp Kutusuna Taşı</span>' +
                                '                </div>' +
                                '              </div>' +
                                '            </div>' +
                                '          </div>';
                        });
                        html += '        </div>';
                    }
                }

                html +=
                    '      </div>' + // comment-body
                    '      <div class="comment-actions-trigger">' +
                    '        <button type="button" class="comment-more-btn" onclick="Notes.toggleCommentDropdown(event, \'' + comment.id + '\')" title="İşlemler">' +
                    '          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>' +
                    '        </button>' +
                    '        <div id="comment-dropdown-' + comment.id + '" class="comment-dropdown">' +
                    '          <div class="comment-dropdown-item" onclick="Notes.editComment(\'' + comment.id + '\')">' +
                    '            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
                    '            <span>Düzenle</span>' +
                    '          </div>' +
                    '          <div class="comment-dropdown-item" onclick="event.stopPropagation();">' +
                    '            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' +
                    '            <span>Paylaş</span>' +
                    '          </div>' +
                    '          <div class="comment-dropdown-item delete" onclick="Notes.deleteComment(\'' + comment.id + '\')">' +
                    '            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>' +
                    '            <span>Çöp Kutusuna Taşı</span>' +
                    '          </div>' +
                    '        </div>' +
                    '      </div>' +
                    '    </div>';
            });
        }
        html += '  </div>';
        
        var inputRowStyle = showInput ? 'display: flex;' : 'display: none;';
 
        html += 
            '  <div class="comment-input-row" style="' + inputRowStyle + ' gap: 10px; margin-top: 14px; align-items: center;">' +
            '    ' + curUserAvatar +
            '    <input type="text" id="note-comment-input" class="comment-input-field" placeholder="Yorum yazın..." style="flex: 1; border: none; outline: none; background: transparent; font-size: 13px; color: var(--color-text); padding: 4px 0;" onkeydown="if(event.key === \'Enter\') { Notes.addComment(); }" oninput="var btn = document.getElementById(this.id + \'-btn\'); if (this.value.trim()) { btn.style.background = \'#0f172a\'; btn.style.color = \'#ffffff\'; } else { btn.style.background = \'#f1f5f9\'; btn.style.color = \'#cbd5e1\'; }">' +
            '    <button type="button" id="note-comment-input-btn" class="comment-submit-btn" onclick="Notes.addComment()" style="background: #f1f5f9; color: #cbd5e1; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease; outline: none; padding: 0; flex-shrink: 0;">' +
            '      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>' +
            '    </button>' +
            '  </div>' +
            '</div>';
            
        return html;
    }

    function renderNoteComments() {
        var container = document.getElementById('note-comments-section');
        if (!container) return;
        container.innerHTML = buildNoteCommentsHTML(noteComments);
        
        var topContainer = document.getElementById('note-comments-top-section');
        if (topContainer) {
            topContainer.innerHTML = '';
            topContainer.style.display = 'none';
        }
    }

    function addComment() {
        var input = document.getElementById('note-comment-input');
        if (!input) return;
        var text = input.value.trim();
        if (!text) return;
        
        var user = (typeof Auth !== 'undefined') ? Auth.getUser() : null;
        var firstName = (user && user.firstName) ? user.firstName : 'Burak';
        var lastName = (user && user.lastName) ? user.lastName : 'Aktürk';
        var email = (user && user.email) ? user.email : 'burak@noteday.com';
        
        var comment = {
            id: generateId(),
            firstName: firstName,
            lastName: lastName,
            email: email,
            text: text,
            date: new Date().toISOString()
        };
        
        noteComments.push(comment);
        input.value = '';
        showNoteCommentInput = false;
        renderNoteComments();
        autoSaveNote();
    }

    function toggleCommentDropdown(event, commentId) {
        event.stopPropagation();
        var dropdowns = document.querySelectorAll('.comment-dropdown');
        dropdowns.forEach(function (d) {
            if (d.id !== 'comment-dropdown-' + commentId) {
                d.style.display = 'none';
                var trg = d.closest('.comment-actions-trigger');
                if (trg) trg.classList.remove('active');
            }
        });
        
        var d = document.getElementById('comment-dropdown-' + commentId);
        if (d) {
            var isShowing = d.style.display === 'none' || d.style.display === '';
            d.style.display = isShowing ? 'block' : 'none';
            var trg = d.closest('.comment-actions-trigger');
            if (trg) {
                if (isShowing) {
                    trg.classList.add('active');
                } else {
                    trg.classList.remove('active');
                }
            }
        }
    }

    function editComment(commentId, replyId) {
        var targetId = replyId || commentId;
        var textContainer = document.getElementById('comment-text-' + targetId);
        if (!textContainer) return;
        var currentText = textContainer.getAttribute('data-raw-text') || textContainer.textContent;
        
        // Hide the dropdown menu
        var d = document.getElementById('comment-dropdown-' + targetId);
        if (d) {
            d.style.display = 'none';
            var trg = d.closest('.comment-actions-trigger');
            if (trg) trg.classList.remove('active');
        }
        
        var saveFn = 'Notes.saveCommentEdit(\'' + commentId + '\', ' + (replyId ? '\'' + replyId + '\'' : 'null') + ')';
        var cancelFn = 'Notes.cancelCommentEdit(\'' + commentId + '\')';
        
        var editHtml = 
            '<div class="comment-edit-row" style="display: flex; gap: 8px; align-items: center; width: 100%; margin-top: 4px;">' +
            '  <input type="text" id="comment-edit-input-' + targetId + '" class="comment-edit-field" style="flex: 1; border: none; outline: none; background: transparent; font-size: 13px; color: var(--color-text); padding: 4px 0;" value="' + escapeHtml(currentText) + '" onkeydown="if(event.key === \'Enter\') { ' + saveFn + '; } else if(event.key === \'Escape\') { ' + cancelFn + '; }" oninput="var btn = document.getElementById(\'comment-edit-save-btn-' + targetId + '\'); if (this.value.trim()) { btn.style.background = \'#0f172a\'; btn.style.color = \'#ffffff\'; btn.disabled = false; } else { btn.style.background = \'#f1f5f9\'; btn.style.color = \'#cbd5e1\'; btn.disabled = true; }">' +
            '  <button type="button" onclick="' + cancelFn + '" style="background: transparent; color: var(--color-text-secondary, #64748b); border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease; outline: none; padding: 0; flex-shrink: 0;" onmouseover="this.style.background=\'var(--color-hover, #f1f5f9)\'" onmouseout="this.style.background=\'transparent\'" title="İptal">' +
            '    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
            '  </button>' +
            '  <button type="button" id="comment-edit-save-btn-' + targetId + '" onclick="' + saveFn + '" style="background: #0f172a; color: #ffffff; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease; outline: none; padding: 0; flex-shrink: 0;" title="Kaydet">' +
            '    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>' +
            '  </button>' +
            '</div>';
            
        textContainer.innerHTML = editHtml;
        var input = document.getElementById('comment-edit-input-' + targetId);
        if (input) {
            input.focus();
            var val = input.value;
            input.value = '';
            input.value = val;
        }
    }

    function saveCommentEdit(commentId, replyId) {
        var targetId = replyId || commentId;
        var input = document.getElementById('comment-edit-input-' + targetId);
        if (!input) return;
        var text = input.value.trim();
        if (!text) return;
        
        var comment = noteComments.find(function (c) { return String(c.id) === String(commentId); });
        if (comment) {
            if (replyId) {
                var replies = comment.replies || [];
                var reply = replies.find(function (r) { return String(r.id) === String(replyId); });
                if (reply) {
                    reply.text = text;
                    reply.date = new Date().toISOString();
                    reply.edited = true;
                }
            } else {
                comment.text = text;
                comment.date = new Date().toISOString();
                comment.edited = true;
            }
        }
        
        renderNoteComments();
        autoSaveNote();
    }

    function cancelCommentEdit(commentId) {
        renderNoteComments();
    }

    function deleteComment(commentId, replyId) {
        var targetId = replyId || commentId;
        // Hide the dropdown menu
        var d = document.getElementById('comment-dropdown-' + targetId);
        if (d) {
            d.style.display = 'none';
            var trg = d.closest('.comment-actions-trigger');
            if (trg) trg.classList.remove('active');
        }

        var confirmMsg = replyId ? 'Bu yanıtı silmek istediğinizden emin misiniz?' : 'Bu yorumu çöp kutusuna taşımak istediğinizden emin misiniz?';
        if (confirm(confirmMsg)) {
            if (replyId) {
                var comment = noteComments.find(function (c) { return String(c.id) === String(commentId); });
                if (comment) {
                    comment.replies = (comment.replies || []).filter(function (r) { return String(r.id) !== String(replyId); });
                }
            } else {
                noteComments = noteComments.filter(function (c) { return String(c.id) !== String(commentId); });
            }
            renderNoteComments();
            autoSaveNote();
        }
    }

    function likeComment(commentId, replyId) {
        var user = (typeof Auth !== 'undefined') ? Auth.getUser() : null;
        var email = user ? (user.email || 'default') : 'default';
        
        var comment = noteComments.find(function (c) { return String(c.id) === String(commentId); });
        if (!comment) return;
        
        var target = comment;
        if (replyId) {
            var replies = comment.replies || [];
            target = replies.find(function (r) { return String(r.id) === String(replyId); });
        }
        if (!target) return;
        
        if (!target.likes) target.likes = [];
        if (!target.dislikes) target.dislikes = [];
        
        var idx = target.likes.indexOf(email);
        if (idx > -1) {
            target.likes.splice(idx, 1);
        } else {
            target.likes.push(email);
            var dIdx = target.dislikes.indexOf(email);
            if (dIdx > -1) target.dislikes.splice(dIdx, 1);
        }
        
        renderNoteComments();
        autoSaveNote();
    }

    function dislikeComment(commentId, replyId) {
        var user = (typeof Auth !== 'undefined') ? Auth.getUser() : null;
        var email = user ? (user.email || 'default') : 'default';
        
        var comment = noteComments.find(function (c) { return String(c.id) === String(commentId); });
        if (!comment) return;
        
        var target = comment;
        if (replyId) {
            var replies = comment.replies || [];
            target = replies.find(function (r) { return String(r.id) === String(replyId); });
        }
        if (!target) return;
        
        if (!target.likes) target.likes = [];
        if (!target.dislikes) target.dislikes = [];
        
        var idx = target.dislikes.indexOf(email);
        if (idx > -1) {
            target.dislikes.splice(idx, 1);
        } else {
            target.dislikes.push(email);
            var lIdx = target.likes.indexOf(email);
            if (lIdx > -1) target.likes.splice(lIdx, 1);
        }
        
        renderNoteComments();
        autoSaveNote();
    }

    function showReplyInput(commentId) {
        activeReplyInput = commentId;
        renderNoteComments();
        setTimeout(function() {
            var f = document.getElementById('reply-field-' + commentId);
            if (f) f.focus();
        }, 50);
    }

    function hideReplyInput() {
        activeReplyInput = null;
        renderNoteComments();
    }

    function addReply(commentId) {
        var input = document.getElementById('reply-field-' + commentId);
        if (!input) return;
        var text = input.value.trim();
        if (!text) return;
        
        var comment = noteComments.find(function (c) { return String(c.id) === String(commentId); });
        if (!comment) return;
        
        var user = (typeof Auth !== 'undefined') ? Auth.getUser() : null;
        var firstName = (user && user.firstName) ? user.firstName : 'Burak';
        var lastName = (user && user.lastName) ? user.lastName : 'Aktürk';
        var email = (user && user.email) ? user.email : 'burak@noteday.com';
        
        var reply = {
            id: generateId(),
            firstName: firstName,
            lastName: lastName,
            email: email,
            text: text,
            date: new Date().toISOString(),
            likes: [],
            dislikes: [],
            edited: false
        };
        
        if (!comment.replies) comment.replies = [];
        comment.replies.push(reply);
        visibleReplies[commentId] = true;
        activeReplyInput = null;
        
        renderNoteComments();
        autoSaveNote();
    }

    function toggleReplies(commentId) {
        visibleReplies[commentId] = !visibleReplies[commentId];
        renderNoteComments();
    }
})();