var SayfaMenusu = (function() {
    'use strict';

    function toggle(e) {
        if (e) e.stopPropagation();
        var menu = document.getElementById('notum-more-dropdown');
        if (!menu) return;
        var isHidden = menu.style.display === 'none';
        
        if (isHidden) {
            // Bildirim panelini kapat
            if (typeof Notifications !== 'undefined' && Notifications.closePanel) {
                Notifications.closePanel();
            }

            // Hide other open dropdowns
            var otherMenus = document.querySelectorAll('.notum-more-dropdown');
            otherMenus.forEach(function (m) {
                if (m.id !== 'notum-more-dropdown') {
                    m.style.display = 'none';
                }
            });
        }
        
        menu.style.display = isHidden ? 'flex' : 'none';
        
        if (isHidden) {
            // Sync current active settings
            syncSettings();
        }
    }

    function syncSettings() {
        var contentBody = document.querySelector('.content-body');
        if (!contentBody) return;

        // 1. Font selector
        var fontType = 'default';
        if (contentBody.classList.contains('font-serif')) fontType = 'serif';
        else if (contentBody.classList.contains('font-mono')) fontType = 'mono';

        var btns = document.querySelectorAll('.notum-font-btn');
        btns.forEach(function(btn) {
            var onclickStr = btn.getAttribute('onclick') || '';
            var match = onclickStr.match(/'([^']+)'/);
            if (match) {
                var btnFont = match[1];
                btn.classList.toggle('active', btnFont === fontType);
            }
        });

        // 2. Small Text
        var isSmallText = contentBody.classList.contains('text-small');
        var smallTextCheckbox = document.getElementById('notum-toggle-small-text');
        if (smallTextCheckbox) smallTextCheckbox.checked = isSmallText;

        // 2b. Large Text
        var isLargeText = contentBody.classList.contains('text-large');
        var largeTextCheckbox = document.getElementById('notum-toggle-large-text');
        if (largeTextCheckbox) largeTextCheckbox.checked = isLargeText;

        // 3. Full Width
        var isFullWidth = contentBody.classList.contains('layout-full-width');
        var fullWidthCheckbox = document.getElementById('notum-toggle-full-width');
        if (fullWidthCheckbox) fullWidthCheckbox.checked = isFullWidth;

        // 4. Lock Page
        var isLocked = isPageLocked();
        var lockCheckbox = document.getElementById('notum-toggle-lock-page');
        if (lockCheckbox) lockCheckbox.checked = isLocked;
    }

    function isPageLocked() {
        var textareas = document.querySelectorAll('.content-body textarea:not([readonly])');
        var inputs = document.querySelectorAll('.content-body input[type="text"]:not([readonly])');
        var lockedTextareas = document.querySelectorAll('.content-body textarea[readonly]');
        return lockedTextareas.length > 0 && textareas.length === 0;
    }

    function filter(query) {
        var q = query.trim().toLowerCase();
        var menuItems = document.querySelectorAll('.notum-dropdown-scroll .notum-menu-item, .notum-dropdown-scroll .notum-menu-action-btn');
        menuItems.forEach(function(item) {
            var searchData = item.getAttribute('data-search') || '';
            var text = item.innerText || '';
            var match = !q || searchData.toLowerCase().includes(q) || text.toLowerCase().includes(q);
            item.style.display = match ? 'flex' : 'none';
        });
    }

    function setFont(fontType, e) {
        if (e) e.stopPropagation();
        var contentBody = document.querySelector('.content-body');
        if (!contentBody) return;

        contentBody.classList.remove('font-serif', 'font-mono');
        if (fontType === 'serif') contentBody.classList.add('font-serif');
        if (fontType === 'mono') contentBody.classList.add('font-mono');

        // Update active class on buttons
        var btns = document.querySelectorAll('.notum-font-btn');
        btns.forEach(function(btn) {
            var onclickStr = btn.getAttribute('onclick') || '';
            btn.classList.toggle('active', onclickStr.includes("'" + fontType + "'"));
        });

        localStorage.setItem('notion_font_preference', fontType);
    }

    function toggleSmallText(enabled) {
        var contentBody = document.querySelector('.content-body');
        if (!contentBody) return;

        contentBody.classList.toggle('text-small', enabled);
        localStorage.setItem('notion_small_text_preference', enabled ? 'true' : 'false');

        if (enabled) {
            contentBody.classList.remove('text-large');
            localStorage.setItem('notion_large_text_preference', 'false');
            var largeCheckbox = document.getElementById('notum-toggle-large-text');
            if (largeCheckbox) largeCheckbox.checked = false;
        }
    }

    function toggleLargeText(enabled) {
        var contentBody = document.querySelector('.content-body');
        if (!contentBody) return;

        contentBody.classList.toggle('text-large', enabled);
        localStorage.setItem('notion_large_text_preference', enabled ? 'true' : 'false');

        if (enabled) {
            contentBody.classList.remove('text-small');
            localStorage.setItem('notion_small_text_preference', 'false');
            var smallCheckbox = document.getElementById('notum-toggle-small-text');
            if (smallCheckbox) smallCheckbox.checked = false;
        }
    }

    function toggleFullWidth(enabled) {
        var contentBody = document.querySelector('.content-body');
        if (!contentBody) return;

        contentBody.classList.toggle('layout-full-width', enabled);
        localStorage.setItem('notion_full_width_preference', enabled ? 'true' : 'false');
    }

    function toggleLockPage(enabled) {
        var inputs = document.querySelectorAll('.content-body input:not(.emoji-search-input), .content-body textarea');
        inputs.forEach(function(el) {
            if (enabled) {
                el.setAttribute('readonly', 'true');
            } else {
                el.removeAttribute('readonly');
            }
        });
        localStorage.setItem('notion_lock_page_preference', enabled ? 'true' : 'false');
        
        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show(enabled ? "Sayfa düzenleme kilitlendi" : "Sayfa kilidi açıldı", "success");
        }
    }

    function copyLink() {
        navigator.clipboard.writeText(window.location.href);
        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show("Sayfa bağlantısı kopyalandı!", "success");
        } else {
            alert("Sayfa bağlantısı kopyalandı!");
        }
        closeMenu();
    }

    function copyContents() {
        var textToCopy = "";
        
        var noteModal = document.getElementById('note-modal-overlay');
        if (noteModal && noteModal.style.display !== 'none') {
            var title = document.getElementById('note-title-input') ? document.getElementById('note-title-input').value : "";
            var desc = document.getElementById('note-desc-input') ? document.getElementById('note-desc-input').value : "";
            textToCopy = (title ? title + "\n\n" : "") + desc;
        }
        else {
            var activeSec = document.querySelector('.section-panel.active');
                    if (activeSec) {
                        var texts = [];
                        activeSec.querySelectorAll('h1, h2, h3, p, span, li').forEach(function(el) {
                            if (el.offsetWidth > 0 && el.offsetHeight > 0 && !el.closest('button') && !el.closest('svg') && !el.classList.contains('notum-more-dropdown') && !el.closest('.notum-more-dropdown')) {
                                var text = el.innerText.trim();
                                if (text && text.length > 1 && !texts.includes(text)) {
                                    texts.push(text);
                                }
                            }
                        });
                        textToCopy = texts.join('\n');
                    }
        }

        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy);
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show("İçerik başarıyla kopyalandı!", "success");
            } else {
                alert("İçerik başarıyla kopyalandı!");
            }
        } else {
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show("Kopyalanacak içerik bulunamadı.", "warning");
            }
        }
        closeMenu();
    }

    function exportText() {
        var textToExport = "";
        var fileName = "export.txt";

        var noteModal = document.getElementById('note-modal-overlay');
        if (noteModal && noteModal.style.display !== 'none') {
            var title = document.getElementById('note-title-input') ? document.getElementById('note-title-input').value : "Not";
            var desc = document.getElementById('note-desc-input') ? document.getElementById('note-desc-input').value : "";
            textToExport = title + "\n\n" + desc;
            fileName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".txt";
        }
        else {
            var activeSec = document.querySelector('.section-panel.active');
            if (activeSec) {
                var texts = [];
                activeSec.querySelectorAll('h1, h2, h3, p, span, li').forEach(function(el) {
                    if (el.offsetWidth > 0 && el.offsetHeight > 0 && !el.closest('button') && !el.closest('svg') && !el.classList.contains('notum-more-dropdown') && !el.closest('.notum-more-dropdown')) {
                        var text = el.innerText.trim();
                        if (text && text.length > 1 && !texts.includes(text)) {
                            texts.push(text);
                        }
                    }
                });
                textToExport = texts.join('\n');
                fileName = activeSec.id + ".txt";
            }
        }

        if (textToExport) {
            var blob = new Blob([textToExport], { type: "text/plain;charset=utf-8" });
            var link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show("Metin dosyası başarıyla indirildi!", "success");
            }
        } else {
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show("Aktarılacak içerik bulunamadı.", "warning");
            }
        }
        closeMenu();
    }

    function undoAction() {
        var activeModal = document.querySelector('.reminder-modal-overlay.active, .board-section-modal-overlay.active, .modal-overlay.active, #note-modal-overlay.active');
        if (activeModal) {
            var lastFocused = activeModal.querySelector('textarea:focus, input:focus');
            if (!lastFocused) {
                lastFocused = activeModal.querySelector('textarea, input[type="text"]');
            }
            if (lastFocused) {
                lastFocused.focus();
            }
        } else {
            var activeSec = document.querySelector('.section-panel.active');
            if (activeSec) {
                var lastFocused = activeSec.querySelector('textarea:focus, input:focus');
                if (!lastFocused) {
                    lastFocused = activeSec.querySelector('textarea, input[type="text"]');
                }
                if (lastFocused) {
                    lastFocused.focus();
                }
            }
        }
        try {
            document.execCommand('undo', false, null);
        } catch (e) {
            console.error("Undo error:", e);
        }
        closeMenu();
    }

    function getActiveContent() {
        var title = "";
        var content = "";
        
        var noteModal = document.getElementById('note-modal-overlay');
        if (noteModal && noteModal.style.display !== 'none') {
            title = document.getElementById('note-title-input') ? document.getElementById('note-title-input').value : "";
            content = document.getElementById('note-desc-input') ? document.getElementById('note-desc-input').value : "";
        }
        else {
            var activeSec = document.querySelector('.section-panel.active');
            if (activeSec) {
                title = activeSec.id;
                var texts = [];
                activeSec.querySelectorAll('h1, h2, h3, p, span, li').forEach(function(el) {
                    if (el.offsetWidth > 0 && el.offsetHeight > 0 && !el.closest('button') && !el.closest('svg') && !el.classList.contains('notum-more-dropdown') && !el.closest('.notum-more-dropdown')) {
                        var text = el.innerText.trim();
                        if (text && text.length > 1 && !texts.includes(text)) {
                            texts.push(text);
                        }
                    }
                });
                content = texts.join('\n');
            }
        }
        return { title: title, content: content };
    }



    function moveToTrash() {
        var itemDeleted = false;

        // 1. Check if note editor is open
        var noteModal = document.getElementById('note-modal-overlay');
        if (noteModal && noteModal.style.display !== 'none') {
            var editingId = noteModal.getAttribute('data-editing-id');
            if (editingId && typeof Notes !== 'undefined') {
                Notes.closeModal();
                Notes.confirmDelete(editingId);
                itemDeleted = true;
            }
        }
        else {
            // 2. Check if notes detail is open
            var notesDetail = document.getElementById('notes-detail-container');
            if (notesDetail && notesDetail.innerHTML !== '') {
                var delBtn = notesDetail.querySelector('button[onclick*="Notes.confirmDelete"]');
                if (delBtn) {
                    var onclickAttr = delBtn.getAttribute('onclick') || '';
                    var match = onclickAttr.match(/confirmDelete\('([^']+)'\)/);
                    if (match && match[1] && typeof Notes !== 'undefined') {
                        Notes.closeDetail();
                        Notes.confirmDelete(match[1]);
                        itemDeleted = true;
                    }
                }
            }
        }

        // 3. Check if currently viewing a custom sub-section page
        if (!itemDeleted) {
            var currentSection = localStorage.getItem('app_current_section');
            if (currentSection && currentSection.indexOf('_sub_') !== -1) {
                if (typeof App !== 'undefined' && App.deleteSubSection && App.createSubSection) {
                    var parentView = currentSection.split('_sub_')[0];
                    
                    // Find index of currentSection in sidebar_sub_sections to keep its position
                    var targetIndex = -1;
                    try {
                        var subSections = JSON.parse(localStorage.getItem('sidebar_sub_sections') || '[]');
                        targetIndex = subSections.findIndex(function(sub) { return sub.id === currentSection; });
                    } catch(e) {}

                    App.deleteSubSection(currentSection, true); // delete silently
                    App.createSubSection(parentView, targetIndex, true); // create new default section at same index and show it
                    itemDeleted = true;
                    if (typeof Toast !== 'undefined' && Toast.show) {
                        Toast.show("Bölüm silindi ve yerine varsayılan yeni bölüm eklendi.", "success");
                    }
                }
            }
        }

        // 4. Handle main sections - move all section data to trash and reset
        if (!itemDeleted) {
            var currentSection = localStorage.getItem('app_current_section');
            if (currentSection && currentSection.indexOf('_sub_') === -1) {
                var sectionCleared = false;

                if (currentSection === 'notes' && typeof Notes !== 'undefined') {
                    var nNotes = Notes.getNotes ? Notes.getNotes() : [];
                    if (nNotes && nNotes.length > 0) {
                        nNotes.forEach(function(n) {
                            if (typeof Trash !== 'undefined' && Trash.addToTrash) {
                                Trash.addToTrash('note', n.id, n.title || 'Adsız Not', n.description || '', n, true);
                            }
                        });
                        if (Notes.saveNotes) Notes.saveNotes([]);
                        Notes.render();
                        sectionCleared = true;
                    }
                }
                else if (currentSection === 'finance' && typeof Finance !== 'undefined') {
                    var fEntries = Finance.getEntries ? Finance.getEntries() : [];
                    if (fEntries && fEntries.length > 0) {
                        fEntries.forEach(function(e) {
                            if (typeof Trash !== 'undefined' && Trash.addToTrash) {
                                Trash.addToTrash('finance', e.id, e.title || e.category || 'Adsız Finans', '', e, true);
                            }
                        });
                        if (Finance.saveEntries) Finance.saveEntries([]);
                        Finance.render();
                        if (window.FinanceCalendar) FinanceCalendar.render();
                        sectionCleared = true;
                    }
                }
                else if (currentSection === 'reminders' && typeof Reminders !== 'undefined') {
                    var rItems = Reminders.getReminders ? Reminders.getReminders() : [];
                    if (rItems && rItems.length > 0) {
                        rItems.forEach(function(r) {
                            if (typeof Trash !== 'undefined' && Trash.addToTrash) {
                                Trash.addToTrash('reminder', r.id, r.title || 'Adsız Hatırlatıcı', r.notes || '', r, true);
                            }
                        });
                        if (Reminders.saveReminders) Reminders.saveReminders([]);
                        Reminders.render();
                        if (window.ReminderCalendar) ReminderCalendar.render();
                        sectionCleared = true;
                    }
                }

                else if (currentSection === 'board' && typeof Board !== 'undefined') {
                    var bCols = Board.getColumns ? Board.getColumns() : [];
                    if (bCols && bCols.length > 0) {
                        var boardItemsFound = false;
                        bCols.forEach(function(col) {
                            if (col.items && col.items.length > 0) {
                                col.items.forEach(function(item) {
                                    if (typeof Trash !== 'undefined' && Trash.addToTrash) {
                                        Trash.addToTrash('board_item', item.id || Date.now(), item.title || 'Adsız Görev', '', { colId: col.id, item: item }, true);
                                        boardItemsFound = true;
                                    }
                                });
                            }
                        });
                        // Board uses direct localStorage, clear it
                        var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
                        if (user) {
                            localStorage.setItem('board_columns_' + user.email, JSON.stringify([]));
                            localStorage.setItem('board_sections_' + user.email, JSON.stringify([]));
                        }
                        Board.render();
                        sectionCleared = true;
                    }
                }

                if (sectionCleared) {
                    itemDeleted = true;
                    if (typeof Toast !== 'undefined' && Toast.show) {
                        Toast.show('Bölüm içeriği çöp kutusuna taşındı.', 'success');
                    }
                }
            }
        }

        if (!itemDeleted) {
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show("Lütfen silmek istediğiniz notu, günlüğü veya alt bölümü seçin.", "warning");
            } else {
                alert("Lütfen silmek istediğiniz notu, günlüğü veya alt bölümü seçin.");
            }
        }
        closeMenu();
    }

    function closeMenu() {
        var menu = document.getElementById('notum-more-dropdown');
        if (menu) menu.style.display = 'none';
    }

    function init() {
        // 1. Click away listener
        document.addEventListener('click', function(e) {
            var btn = document.getElementById('notum-style-more-btn');
            var wrapper = btn ? btn.closest('.notum-more-menu-wrapper') : null;
            if (wrapper && !wrapper.contains(e.target)) {
                closeMenu();
            }
        });

        // 2. Load preferences
        var savedFont = localStorage.getItem('notion_font_preference');
        if (savedFont) {
            setFont(savedFont);
        }
        var savedSmall = localStorage.getItem('notion_small_text_preference') === 'true';
        if (savedSmall) {
            toggleSmallText(true);
        }
        var savedLarge = localStorage.getItem('notion_large_text_preference') === 'true';
        if (savedLarge) {
            toggleLargeText(true);
        }
        var savedFull = localStorage.getItem('notion_full_width_preference') === 'true';
        if (savedFull) {
            toggleFullWidth(true);
        }
        var savedLock = localStorage.getItem('notion_lock_page_preference') === 'true';
        if (savedLock) {
            setTimeout(function() { toggleLockPage(true); }, 500);
        }

        // 3. Listen to section change to re-apply lock page state if needed
        var originalShowSection = (typeof App !== 'undefined') ? App.showSection : null;
        if (originalShowSection) {
            App.showSection = function() {
                originalShowSection.apply(this, arguments);
                setTimeout(function() {
                    var isLocked = localStorage.getItem('notion_lock_page_preference') === 'true';
                    if (isLocked) {
                        toggleLockPage(true);
                    }
                    var currentFont = localStorage.getItem('notion_font_preference') || 'default';
                    setFont(currentFont);
                    var isSmall = localStorage.getItem('notion_small_text_preference') === 'true';
                    toggleSmallText(isSmall);
                    var isLarge = localStorage.getItem('notion_large_text_preference') === 'true';
                    toggleLargeText(isLarge);
                    var isFull = localStorage.getItem('notion_full_width_preference') === 'true';
                    toggleFullWidth(isFull);
                    
                    // Sync custom background colors
                    if (typeof PageCustomizer !== 'undefined' && PageCustomizer.applyAllSavedColors) {
                        PageCustomizer.applyAllSavedColors();
                    }
                }, 100);
            };
        }


    }

    function openVersionHistory(e) {
        if (e) e.stopPropagation();
        closeMenu();

        var overlay = document.getElementById('note-modal-overlay');
        var noteId = overlay ? overlay.getAttribute('data-editing-id') : null;
        if (!noteId) {
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show("Sürüm geçmişini görmek için bir not açık olmalıdır.", "warning");
            } else {
                alert("Sürüm geçmişini görmek için bir not açık olmalıdır.");
            }
            return;
        }

        showVersionHistoryModal(noteId);
    }

    function showVersionHistoryModal(noteId) {
        if (typeof Notes === 'undefined') return;
        var notes = Notes.getNotes();
        var note = notes.find(function (n) { return String(n.id) === String(noteId); });
        if (!note) return;

        var versions = note.versions || [];
        versions = versions.slice().reverse(); // Show latest first

        var backdrop = document.createElement('div');
        backdrop.id = 'notum-version-history-modal';
        backdrop.className = 'modal-overlay active';
        backdrop.style.zIndex = '99999';

        var styleEl = document.createElement('style');
        styleEl.textContent = 
            '#notum-version-history-modal .modal-content {' +
            '    width: 900px !important;' +
            '    max-width: 95vw !important;' +
            '    height: 600px !important;' +
            '    max-height: 85vh !important;' +
            '    display: flex !important;' +
            '    flex-direction: column !important;' +
            '    padding: 0 !important;' +
            '    overflow: hidden !important;' +
            '    border-radius: 16px !important;' +
            '}' +
            '.vh-container {' +
            '    display: flex;' +
            '    flex: 1;' +
            '    min-height: 0;' +
            '    background: var(--color-bg);' +
            '}' +
            '.vh-sidebar {' +
            '    width: 280px;' +
            '    border-right: 1px solid var(--color-border-subtle, #e2e8f0);' +
            '    display: flex;' +
            '    flex-direction: column;' +
            '    background: var(--color-bg-subtle, #f8fafc);' +
            '}' +
            '.vh-sidebar-header {' +
            '    padding: 16px 20px;' +
            '    border-bottom: 1px solid var(--color-border-subtle, #e2e8f0);' +
            '}' +
            '.vh-sidebar-title {' +
            '    font-size: 13px;' +
            '    font-weight: 600;' +
            '    color: var(--color-text-secondary);' +
            '    text-transform: uppercase;' +
            '    letter-spacing: 0.5px;' +
            '}' +
            '.vh-list {' +
            '    flex: 1;' +
            '    overflow-y: auto;' +
            '    padding: 12px 8px;' +
            '    display: flex;' +
            '    flex-direction: column;' +
            '    gap: 4px;' +
            '}' +
            '.vh-item {' +
            '    padding: 12px 16px;' +
            '    border-radius: 8px;' +
            '    cursor: pointer;' +
            '    transition: all 0.15s ease;' +
            '    border: 1px solid transparent;' +
            '    display: flex;' +
            '    flex-direction: column;' +
            '    gap: 2px;' +
            '    position: relative;' +
            '}' +
            '.vh-item:hover {' +
            '    background: rgba(99, 102, 241, 0.04);' +
            '}' +
            '.vh-item.active {' +
            '    background: rgba(99, 102, 241, 0.08);' +
            '    border-color: rgba(99, 102, 241, 0.15);' +
            '}' +
            '.vh-item.active::before {' +
            '    content: "";' +
            '    position: absolute;' +
            '    left: 0;' +
            '    top: 12px;' +
            '    bottom: 12px;' +
            '    width: 3px;' +
            '    background: var(--color-primary, #6366f1);' +
            '    border-radius: 0 4px 4px 0;' +
            '}' +
            '.vh-item-title {' +
            '    font-size: 13px;' +
            '    font-weight: 600;' +
            '    color: var(--color-text);' +
            '}' +
            '.vh-item-time {' +
            '    font-size: 11px;' +
            '    color: var(--color-text-secondary);' +
            '}' +
            '.vh-main {' +
            '    flex: 1;' +
            '    display: flex;' +
            '    flex-direction: column;' +
            '    background: var(--color-bg);' +
            '    min-width: 0;' +
            '}' +
            '.vh-main-header {' +
            '    padding: 16px 24px;' +
            '    border-bottom: 1px solid var(--color-border-subtle, #e2e8f0);' +
            '    display: flex;' +
            '    justify-content: space-between;' +
            '    align-items: center;' +
            '}' +
            '.vh-preview-area {' +
            '    flex: 1;' +
            '    padding: 24px;' +
            '    overflow-y: auto;' +
            '    background: var(--color-bg);' +
            '}' +
            '.notum-version-preview-content {' +
            '    background: var(--color-bg);' +
            '    color: var(--color-text);' +
            '    font-size: 14px;' +
            '    line-height: 1.6;' +
            '}' +
            '.notum-version-preview-content .notum-db-wrapper {' +
            '    margin: 12px 0 !important;' +
            '    margin-right: 0 !important;' +
            '    width: 100% !important;' +
            '}' +
            '.vh-footer {' +
            '    padding: 16px 24px;' +
            '    border-top: 1px solid var(--color-border-subtle, #e2e8f0);' +
            '    display: flex;' +
            '    justify-content: space-between;' +
            '    align-items: center;' +
            '    background: var(--color-bg-subtle, #f8fafc);' +
            '}' +
            '.vh-info-badge {' +
            '    font-size: 11px;' +
            '    color: var(--color-text-secondary);' +
            '    display: flex;' +
            '    align-items: center;' +
            '    gap: 6px;' +
            '}';
        backdrop.appendChild(styleEl);

        var card = document.createElement('div');
        card.className = 'modal-content';
        card.onclick = function(ev) { ev.stopPropagation(); };

        var vhContainer = document.createElement('div');
        vhContainer.className = 'vh-container';

        var sidebar = document.createElement('div');
        sidebar.className = 'vh-sidebar';
        
        var sidebarHeader = document.createElement('div');
        sidebarHeader.className = 'vh-sidebar-header';
        sidebarHeader.innerHTML = '<div class="vh-sidebar-title">Sürümler</div>';
        sidebar.appendChild(sidebarHeader);

        var listContainer = document.createElement('div');
        listContainer.className = 'vh-list';

        var mainContent = document.createElement('div');
        mainContent.className = 'vh-main';

        var mainHeader = document.createElement('div');
        mainHeader.className = 'vh-main-header';
        mainHeader.innerHTML = 
            '<div>' +
            '  <h3 style="margin:0; font-size:16px; font-weight:700; color:var(--color-text);">Sürüm Geçmişi</h3>' +
            '  <div style="font-size:12px; color:var(--color-text-secondary); margin-top:2px;">"' + note.title + '" sayfası için önceki sürümler</div>' +
            '</div>' +
            '<button type="button" style="background:transparent; border:none; color:var(--color-text-secondary); cursor:pointer; font-size:24px; padding:4px;" onclick="document.getElementById(\'notum-version-history-modal\').remove()">&times;</button>';
        mainContent.appendChild(mainHeader);

        var previewArea = document.createElement('div');
        previewArea.className = 'vh-preview-area';
        
        var previewContent = document.createElement('div');
        previewContent.className = 'notum-version-preview-content';
        previewContent.innerHTML = '<div style="color:var(--color-text-secondary); font-size:13px; text-align:center; padding-top:40px;">Önizlemek için soldan bir sürüm seçin.</div>';
        previewArea.appendChild(previewContent);
        mainContent.appendChild(previewArea);

        vhContainer.appendChild(sidebar);
        vhContainer.appendChild(mainContent);
        card.appendChild(vhContainer);

        var selectedVersion = null;

        if (versions.length === 0) {
            var empty = document.createElement('div');
            empty.style.color = 'var(--color-text-secondary)';
            empty.style.fontSize = '12px';
            empty.style.textAlign = 'center';
            empty.style.padding = '20px 10px';
            empty.textContent = 'Kayıtlı sürüm bulunmuyor.';
            listContainer.appendChild(empty);
        } else {
            versions.forEach(function (v, idx) {
                var item = document.createElement('div');
                item.className = 'vh-item';
                
                var dateStr = new Date(v.timestamp).toLocaleString('tr-TR', {
                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                });

                item.innerHTML = 
                    '<span class="vh-item-title">' + (v.title || 'Adsız Not') + '</span>' +
                    '<span class="vh-item-time">' + dateStr + '</span>';

                item.onclick = function() {
                    listContainer.querySelectorAll('.vh-item').forEach(function(el) {
                        el.classList.remove('active');
                    });
                    item.classList.add('active');
                    
                    previewContent.innerHTML = v.description || '<div style="color:var(--color-text-secondary); text-align:center; padding-top:40px;">Bu sürümde içerik bulunmuyor.</div>';
                    selectedVersion = v;
                    restoreBtn.disabled = false;
                };

                listContainer.appendChild(item);

                if (idx === 0) {
                    item.click();
                }
            });
        }
        sidebar.appendChild(listContainer);

        var footer = document.createElement('div');
        footer.className = 'vh-footer';
        
        var info = document.createElement('div');
        info.className = 'vh-info-badge';
        info.innerHTML = 
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-primary);"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' +
            '<span>Geri yüklemeden önceki son haliniz geçmişe kaydedilir.</span>';
        
        var actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';

        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn';
        cancelBtn.style.padding = '8px 16px';
        cancelBtn.style.fontSize = '13px';
        cancelBtn.style.background = 'var(--color-bg)';
        cancelBtn.style.border = '1px solid var(--color-border)';
        cancelBtn.style.color = 'var(--color-text)';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.textContent = 'Kapat';
        cancelBtn.onclick = function() { backdrop.remove(); };

        var restoreBtn = document.createElement('button');
        restoreBtn.type = 'button';
        restoreBtn.className = 'btn btn-primary';
        restoreBtn.style.padding = '8px 16px';
        restoreBtn.style.fontSize = '13px';
        restoreBtn.style.cursor = 'pointer';
        restoreBtn.textContent = 'Sürümü Geri Yükle';
        restoreBtn.disabled = true;
        restoreBtn.onclick = function() {
            if (!selectedVersion) return;
            Notes.restoreNoteVersion(noteId, selectedVersion);
            backdrop.remove();
        };

        actions.appendChild(cancelBtn);
        actions.appendChild(restoreBtn);
        
        footer.appendChild(info);
        footer.appendChild(actions);
        card.appendChild(footer);

        backdrop.appendChild(card);
        backdrop.onclick = function() { backdrop.remove(); };
        document.body.appendChild(backdrop);
    }

    return {
        init: init,
        toggle: toggle,
        closeMenu: closeMenu,
        setFont: setFont,
        toggleSmallText: toggleSmallText,
        toggleLargeText: toggleLargeText,
        toggleFullWidth: toggleFullWidth,
        toggleLockPage: toggleLockPage,
        copyLink: copyLink,
        copyContents: copyContents,
        exportText: exportText,
        moveToTrash: moveToTrash,
        filter: filter,
        undoAction: undoAction,
        openVersionHistory: openVersionHistory
    };
})();

// Auto-run init on load
document.addEventListener('DOMContentLoaded', function() {
    SayfaMenusu.init();
});
