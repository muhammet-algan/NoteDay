var Search = (function () {
    'use strict';

    var _activeFilter = 'all';
    var _searchResults = [];

    // SVG icon map matching project's feather-style icons
    var _icons = {
        notes: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"></path><path d="M14 3v4a2 2 0 0 0 2 2h4"></path><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="13" y2="17"></line></svg>',
        board: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>',
        reminders: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
        finance: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
        team: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>',
        search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'
    };

    function init() {
        // Event Listeners
        var searchInput = document.getElementById('global-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', performSearch);
            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closeSearchPage();
                }
            });
        }

        // Global key shortcut Ctrl + K
        document.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                var overlay = document.getElementById('search-overlay');
                if (overlay && overlay.classList.contains('open')) {
                    closeSearchPage();
                } else {
                    openSearchPage();
                }
            } else if (e.key === 'Escape') {
                closeSearchPage();
            }
        });
    }

    function openSearchPage() {
        // Close settings page if open
        if (typeof Settings !== 'undefined' && Settings.closeSettingsPage) {
            Settings.closeSettingsPage();
        }
        // Close user dropdown if open
        if (typeof Settings !== 'undefined' && Settings.closeUserMenu) {
            Settings.closeUserMenu();
        }

        var overlay = document.getElementById('search-overlay');
        if (overlay) {
            overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
            
            var input = document.getElementById('global-search-input');
            if (input) {
                input.value = '';
                setTimeout(function() {
                    input.focus();
                }, 100);
            }
            
            clearSearch();
        }
    }

    function closeSearchPage() {
        var overlay = document.getElementById('search-overlay');
        if (overlay) {
            overlay.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    function clearSearch() {
        var input = document.getElementById('global-search-input');
        if (input) {
            input.value = '';
            input.focus();
        }
        var clearBtn = document.getElementById('global-search-clear');
        if (clearBtn) clearBtn.style.display = 'none';
        
        setFilter('all');
        renderEmptyState();
    }

    function setFilter(filterName) {
        _activeFilter = filterName;
        
        var items = document.querySelectorAll('.search-filter-chip');
        items.forEach(function(item) {
            item.classList.toggle('active', item.getAttribute('data-filter') === filterName);
        });

        // Re-render search results with new filter
        renderResults();
    }

    function stripHtml(html) {
        if (!html) return '';
        var tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Custom highlighting that handles Turkish characters correctly
    function highlightText(text, query) {
        if (!text) return '';
        if (!query) return escapeHtml(text);
        
        var normalize = function (str) {
            return str.toLowerCase()
                .replace(/ı/g, 'i').replace(/İ/g, 'i')
                .replace(/ö/g, 'o').replace(/Ö/g, 'o')
                .replace(/ü/g, 'u').replace(/Ü/g, 'u')
                .replace(/ş/g, 's').replace(/Ş/g, 's')
                .replace(/ç/g, 'c').replace(/Ç/g, 'c')
                .replace(/ğ/g, 'g').replace(/Ğ/g, 'g');
        };
        
        var normalizedText = normalize(text);
        var normalizedQuery = normalize(query);
        var index = normalizedText.indexOf(normalizedQuery);
        
        if (index === -1) return escapeHtml(text);
        
        var parts = [];
        var lastIndex = 0;
        while (index !== -1) {
            parts.push(escapeHtml(text.substring(lastIndex, index)));
            parts.push('<mark>' + escapeHtml(text.substring(index, index + query.length)) + '</mark>');
            lastIndex = index + query.length;
            index = normalizedText.indexOf(normalizedQuery, lastIndex);
        }
        parts.push(escapeHtml(text.substring(lastIndex)));
        return parts.join('');
    }

    // Relative time formatter (Turkish)
    function relativeTime(date) {
        if (!date || isNaN(date.getTime())) return '';
        
        var now = new Date();
        var diffMs = now.getTime() - date.getTime();
        if (diffMs < 0) diffMs = 0;
        
        var diffSec = Math.floor(diffMs / 1000);
        var diffMin = Math.floor(diffSec / 60);
        var diffHour = Math.floor(diffMin / 60);
        var diffDay = Math.floor(diffHour / 24);
        
        if (diffSec < 60) return '1 dakika';
        if (diffMin < 60) return diffMin + ' dakika';
        if (diffHour < 24) return diffHour + ' saat';
        return diffDay + ' gün';
    }

    function performSearch() {
        var input = document.getElementById('global-search-input');
        if (!input) return;

        var query = input.value.trim();
        var clearBtn = document.getElementById('global-search-clear');
        if (clearBtn) {
            clearBtn.style.display = query.length > 0 ? 'block' : 'none';
        }

        if (query.length === 0) {
            _searchResults = [];
            renderEmptyState();
            return;
        }

        var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
        var email = user ? user.email : '';
        
        var subSections = [];
        try {
            subSections = JSON.parse(localStorage.getItem('sidebar_sub_sections') || '[]');
        } catch (e) {}

        var matches = [];

        var normalize = function (str) {
            return str.toLowerCase()
                .replace(/ı/g, 'i').replace(/İ/g, 'i')
                .replace(/ö/g, 'o').replace(/Ö/g, 'o')
                .replace(/ü/g, 'u').replace(/Ü/g, 'u')
                .replace(/ş/g, 's').replace(/Ş/g, 's')
                .replace(/ç/g, 'c').replace(/Ç/g, 'c')
                .replace(/ğ/g, 'g').replace(/Ğ/g, 'g');
        };

        var normalizedQuery = normalize(query);

        var checkMatch = function(title) {
            var t = title ? normalize(title) : '';
            return t.indexOf(normalizedQuery) !== -1;
        };

        // 1. NOTES
        try {
            // Main notes
            var mainNotes = JSON.parse(localStorage.getItem('user_notes_' + email) || '[]');
            mainNotes.forEach(function(item) {
                var title = item.title || 'İsimsiz Not';
                var desc = item.description || '';
                if (checkMatch(title)) {
                    matches.push({
                        id: item.id,
                        title: title,
                        desc: desc,
                        category: 'Notlarım',
                        tab: 'notes',
                        icon: 'notes',
                        rawDate: item.createdAt ? new Date(item.createdAt) : null,
                        meta: item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : ''
                    });
                }
            });

            // Sub-sections
            subSections.forEach(function(sub) {
                if (sub.parentId === 'notes') {
                    var subNotes = JSON.parse(localStorage.getItem('user_notes_' + sub.id + '_' + email) || '[]');
                    subNotes.forEach(function(item) {
                        var title = item.title || 'İsimsiz Not';
                        var desc = item.description || '';
                        if (checkMatch(title)) {
                            matches.push({
                                id: item.id,
                                subId: sub.id,
                                title: title,
                                desc: desc,
                                category: 'Notlarım',
                                tab: 'notes',
                                icon: 'notes',
                                rawDate: item.createdAt ? new Date(item.createdAt) : null,
                                meta: item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : ''
                            });
                        }
                    });
                }
            });
        } catch (e) { console.error(e); }


        // 3. TASKS & BOARD CARDS
        try {
            // Main board columns
            var mainColKey = 'board_columns' + (email ? '_' + email : '');
            var mainCols = JSON.parse(localStorage.getItem(mainColKey) || '[]');
            mainCols.forEach(function(col) {
                var colName = col.name || 'Kolon';
                var items = col.items || [];
                items.forEach(function(item) {
                    var title = item.title || 'İsimsiz Kart';
                    var desc = (item.note || '') + (item.progress ? ' (İlerleme: %' + item.progress + ')' : '');
                    if (checkMatch(title)) {
                        matches.push({
                            id: item.id,
                            colId: col.id,
                            title: title,
                            desc: desc,
                            category: 'Panom',
                            tab: 'board',
                            icon: 'board',
                            rawDate: item.dueDate ? new Date(item.dueDate) : null,
                            meta: item.dueDate ? item.dueDate : ''
                        });
                    }
                });
            });

            // Sub-sections
            subSections.forEach(function(sub) {
                if (sub.parentId === 'board') {
                    var subColKey = 'board_columns_' + sub.id + (email ? '_' + email : '');
                    var subCols = JSON.parse(localStorage.getItem(subColKey) || '[]');
                    subCols.forEach(function(col) {
                        var colName = col.name || 'Kolon';
                        var items = col.items || [];
                        items.forEach(function(item) {
                            var title = item.title || 'İsimsiz Kart';
                            var desc = (item.note || '') + (item.progress ? ' (İlerleme: %' + item.progress + ')' : '');
                            if (checkMatch(title)) {
                                matches.push({
                                    id: item.id,
                                    colId: col.id,
                                    subId: sub.id,
                                    title: title,
                                    desc: desc,
                                    category: 'Panom',
                                    tab: 'board',
                                    icon: 'board',
                                    rawDate: item.dueDate ? new Date(item.dueDate) : null,
                                    meta: item.dueDate ? item.dueDate : ''
                                });
                            }
                        });
                    });
                }
            });
        } catch (e) { console.error(e); }

        // 4. REMINDERS
        try {
            var remindersKey = 'user_' + email + '_reminders';
            var rems = JSON.parse(localStorage.getItem(remindersKey) || '[]');
            rems.forEach(function(item) {
                var title = item.title || 'İsimsiz Hatırlatıcı';
                var desc = item.note || '';
                if (checkMatch(title)) {
                    var timeStr = (item.hour !== undefined && item.minute !== undefined) ? 
                        (' ' + String(item.hour).padStart(2, '0') + ':' + String(item.minute).padStart(2, '0')) : '';
                    matches.push({
                        id: item.id,
                        title: title,
                        desc: desc,
                        category: 'Hatırlatıcılarım',
                        tab: 'reminders',
                        icon: 'reminders',
                        rawDate: item.customDate ? new Date(item.customDate) : null,
                        meta: (item.customDate || '') + timeStr
                    });
                }
            });
        } catch (e) { console.error(e); }

        // 5. FINANCE
        try {
            var financeKey = 'user_' + email + '_finance_entries';
            var financeEntries = JSON.parse(localStorage.getItem(financeKey) || '[]');
            financeEntries.forEach(function(item) {
                var title = item.description || 'Açıklamasız İşlem';
                var desc = item.category + ' | ' + (item.type === 'expense' ? '-' : '+') + item.amount + ' TL';
                if (checkMatch(title)) {
                    matches.push({
                        id: item.id,
                        title: title,
                        desc: desc,
                        category: 'Finanslarım',
                        tab: 'finance',
                        icon: 'finance',
                        rawDate: item.date ? new Date(item.date) : null,
                        meta: item.date ? new Date(item.date).toLocaleDateString('tr-TR') : ''
                    });
                }
            });

            // Sub-sections
            subSections.forEach(function(sub) {
                if (sub.parentId === 'finance') {
                    var subFinKey = 'user_' + email + '_finance_entries_' + sub.id;
                    var subEntries = JSON.parse(localStorage.getItem(subFinKey) || '[]');
                    subEntries.forEach(function(item) {
                        var title = item.description || 'Açıklamasız İşlem';
                        var desc = item.category + ' | ' + (item.type === 'expense' ? '-' : '+') + item.amount + ' TL';
                        if (checkMatch(title)) {
                            matches.push({
                                id: item.id,
                                subId: sub.id,
                                title: title,
                                desc: desc,
                                category: 'Finanslarım',
                                tab: 'finance',
                                icon: 'finance',
                                rawDate: item.date ? new Date(item.date) : null,
                                meta: item.date ? new Date(item.date).toLocaleDateString('tr-TR') : ''
                            });
                        }
                    });
                }
            });
        } catch (e) { console.error(e); }


        // 7. DYNAMIC TEAMS NOTES
        try {
            var workspaces = JSON.parse(localStorage.getItem('sidebar_group_items_workspace') || '[]');
            workspaces.forEach(function(team) {
                var teamNotesKey = 'user_notes_' + team.id + '_' + email;
                var teamNotes = JSON.parse(localStorage.getItem(teamNotesKey) || '[]');
                teamNotes.forEach(function(item) {
                    var title = item.title || 'İsimsiz Not';
                    var desc = item.description || '';
                    if (checkMatch(title)) {
                        matches.push({
                            id: item.id,
                            title: title,
                            desc: desc,
                            category: team.label,
                            tab: team.id,
                            icon: 'team',
                            rawDate: item.createdAt ? new Date(item.createdAt) : null,
                            meta: item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : ''
                        });
                    }
                });
            });
        } catch (e) { console.error(e); }

        _searchResults = matches;
        renderResults();
    }

    function renderResults() {
        var container = document.getElementById('search-results-list');
        if (!container) return;

        var input = document.getElementById('global-search-input');
        var query = input ? input.value.trim() : '';

        // Filter results
        var filtered = _searchResults;
        if (_activeFilter !== 'all') {
            filtered = _searchResults.filter(function(item) {
                return item.tab === _activeFilter;
            });
        }

        if (filtered.length === 0 && query.length > 0) {
            container.innerHTML = '<div class="search-empty-state">' +
                '<div class="search-empty-icon">' + _icons.search + '</div>' +
                '<h3>Sonuç Bulunamadı</h3>' +
                '<p>"' + escapeHtml(query) + '" için eşleşen kayıt bulunmamaktadır.</p>' +
                '</div>';
            return;
        }

        if (filtered.length === 0) {
            renderEmptyState();
            return;
        }

        var html = '';
        filtered.forEach(function(item) {
            var highlightedTitle = highlightText(item.title, query);
            var iconSvg = _icons[item.icon] || _icons.search;
            var dateStr = relativeTime(item.rawDate);

            html += '<div class="search-result-card" onclick="Search.selectResult(' + JSON.stringify(item).replace(/"/g, '&quot;') + ')">' +
                '  <div class="search-result-icon-box">' + iconSvg + '</div>' +
                '  <div class="search-result-details">' +
                '    <div class="search-result-title">' + highlightedTitle + '</div>' +
                '    <div class="search-result-category">' + escapeHtml(item.category) + '</div>' +
                '  </div>' +
                (dateStr ? '  <div class="search-result-date">' + escapeHtml(dateStr) + '</div>' : '') +
                '</div>';
        });

        container.innerHTML = html;
    }

    function renderEmptyState() {
        var container = document.getElementById('search-results-list');
        if (!container) return;

        var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
        var email = user ? user.email : '';
        var subSections = [];
        try { subSections = JSON.parse(localStorage.getItem('sidebar_sub_sections') || '[]'); } catch (e) {}

        var allItems = [];

        // Collect all items with createdAt / date
        try {
            var mainNotes = JSON.parse(localStorage.getItem('user_notes_' + email) || '[]');
            mainNotes.forEach(function(item) {
                if (item.createdAt) allItems.push({ title: item.title || 'İsimsiz Not', category: 'Notlarım', tab: 'notes', icon: 'notes', id: item.id, date: new Date(item.createdAt) });
            });
            subSections.forEach(function(sub) {
                if (sub.parentId === 'notes') {
                    var subNotes = JSON.parse(localStorage.getItem('user_notes_' + sub.id + '_' + email) || '[]');
                    subNotes.forEach(function(item) {
                        if (item.createdAt) allItems.push({ title: item.title || 'İsimsiz Not', category: 'Notlarım', tab: 'notes', icon: 'notes', id: item.id, subId: sub.id, date: new Date(item.createdAt) });
                    });
                }
            });
        } catch (e) {}


        try {
            var mainColKey = 'board_columns' + (email ? '_' + email : '');
            var mainCols = JSON.parse(localStorage.getItem(mainColKey) || '[]');
            mainCols.forEach(function(col) {
                (col.items || []).forEach(function(item) {
                    var d = item.createdAt ? new Date(item.createdAt) : (item.dueDate ? new Date(item.dueDate) : null);
                    if (d) allItems.push({ title: item.title || 'İsimsiz Kart', category: 'Panom', tab: 'board', icon: 'board', id: item.id, colId: col.id, date: d });
                });
            });
            subSections.forEach(function(sub) {
                if (sub.parentId === 'board') {
                    var subCols = JSON.parse(localStorage.getItem('board_columns_' + sub.id + (email ? '_' + email : '') ) || '[]');
                    subCols.forEach(function(col) {
                        (col.items || []).forEach(function(item) {
                            var d = item.createdAt ? new Date(item.createdAt) : (item.dueDate ? new Date(item.dueDate) : null);
                            if (d) allItems.push({ title: item.title || 'İsimsiz Kart', category: 'Panom', tab: 'board', icon: 'board', id: item.id, colId: col.id, subId: sub.id, date: d });
                        });
                    });
                }
            });
        } catch (e) {}

        try {
            var remindersKey = 'user_' + email + '_reminders';
            var rems = JSON.parse(localStorage.getItem(remindersKey) || '[]');
            rems.forEach(function(item) {
                var d = item.customDate ? new Date(item.customDate) : (item.createdAt ? new Date(item.createdAt) : null);
                if (d) allItems.push({ title: item.title || 'İsimsiz Hatırlatıcı', category: 'Hatırlatıcılarım', tab: 'reminders', icon: 'reminders', id: item.id, date: d });
            });
        } catch (e) {}

        try {
            var financeKey = 'user_' + email + '_finance_entries';
            var financeEntries = JSON.parse(localStorage.getItem(financeKey) || '[]');
            financeEntries.forEach(function(item) {
                var d = item.date ? new Date(item.date) : null;
                if (d) allItems.push({ title: item.description || 'Açıklamasız İşlem', category: 'Finanslarım', tab: 'finance', icon: 'finance', id: item.id, date: d });
            });
            subSections.forEach(function(sub) {
                if (sub.parentId === 'finance') {
                    var subEntries = JSON.parse(localStorage.getItem('user_' + email + '_finance_entries_' + sub.id) || '[]');
                    subEntries.forEach(function(item) {
                        var d = item.date ? new Date(item.date) : null;
                        if (d) allItems.push({ title: item.description || 'Açıklamasız İşlem', category: 'Finanslarım', tab: 'finance', icon: 'finance', id: item.id, subId: sub.id, date: d });
                    });
                }
            });
        } catch (e) {}


        // 7. DYNAMIC TEAMS NOTES (RECENT)
        try {
            var workspaces = JSON.parse(localStorage.getItem('sidebar_group_items_workspace') || '[]');
            workspaces.forEach(function(team) {
                var teamNotesKey = 'user_notes_' + team.id + '_' + email;
                var teamNotes = JSON.parse(localStorage.getItem(teamNotesKey) || '[]');
                teamNotes.forEach(function(item) {
                    var d = item.createdAt ? new Date(item.createdAt) : null;
                    if (d) allItems.push({
                        title: item.title || 'İsimsiz Not',
                        category: team.label,
                        tab: team.id,
                        icon: 'team',
                        id: item.id,
                        date: d
                    });
                });
            });
        } catch (e) {}

        // Sort by date descending
        allItems.sort(function(a, b) { return b.date.getTime() - a.date.getTime(); });

        // Group by today / this week / this month (up to 30 days)
        var now = new Date();
        var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1)); // Monday

        var groups = { today: [], week: [], month: [] };
        allItems.forEach(function(item) {
            var diffMs = now.getTime() - item.date.getTime();
            var diffSec = Math.floor(diffMs / 1000);
            var diffMin = Math.floor(diffSec / 60);
            var diffHour = Math.floor(diffMin / 60);
            var diffDay = Math.floor(diffHour / 24);

            if (diffDay > 30) {
                // Ignore if 31 days or more
                return;
            }

            if (item.date >= todayStart) {
                groups.today.push(item);
            } else if (item.date >= weekStart) {
                groups.week.push(item);
            } else {
                groups.month.push(item);
            }
        });

        var hasAny = groups.today.length > 0 || groups.week.length > 0 || groups.month.length > 0;

        if (!hasAny) {
            // No recent items – show sidebar section shortcuts
            var sections = [
                { view: 'notes', label: 'Notlarım', icon: _icons.notes },
                { view: 'board', label: 'Panom', icon: _icons.board },
                { view: 'reminders', label: 'Hatırlatıcılarım', icon: _icons.reminders },
                { view: 'finance', label: 'Finanslarım', icon: _icons.finance }
            ];
            var html = '<div class="search-quick-create">';
            html += '<div class="search-quick-create-title">Yeni Oluştur</div>';
            sections.forEach(function(sec) {
                html += '<div class="search-quick-create-item" onclick="Search.closeSearchPage(); App.showSection(\'' + sec.view + '\')">' +
                    '<div class="search-quick-create-icon">' + sec.icon + '</div>' +
                    '<span class="search-quick-create-label">' + sec.label + '</span>' +
                    '</div>';
            });
            html += '</div>';
            container.innerHTML = html;
            return;
        }

        // Render grouped recent items
        var html = '';
        var groupDefs = [
            { key: 'today', label: 'Bugün' },
            { key: 'week', label: 'Bu Hafta' },
            { key: 'month', label: 'Bu Ay' }
        ];

        groupDefs.forEach(function(g) {
            var items = groups[g.key];
            if (items.length === 0) return;
            html += '<div class="search-recent-group-title">' + g.label + '</div>';
            items.forEach(function(item) {
                var iconSvg = _icons[item.icon] || _icons.search;
                var timeStr = relativeTime(item.date);
                var itemJson = JSON.stringify({
                    id: item.id,
                    tab: item.tab,
                    subId: item.subId || '',
                    colId: item.colId || '',
                    teamId: item.teamId || '',
                    subTab: item.subTab || ''
                }).replace(/"/g, '&quot;');
                html += '<div class="search-recent-item" onclick="Search.selectResult(' + itemJson + ')">' +
                    '<div class="search-recent-item-icon">' + iconSvg + '</div>' +
                    '<div class="search-recent-item-info">' +
                    '<div class="search-recent-item-title">' + escapeHtml(item.title) + '</div>' +
                    '<div class="search-recent-item-category">' + escapeHtml(item.category) + '</div>' +
                    '</div>' +
                    '<div class="search-recent-item-time">' + timeStr + '</div>' +
                    '</div>';
            });
        });

        container.innerHTML = html;
    }

    function selectResult(item) {
        closeSearchPage();

        // 1. If it's a sub-section item, activate the sub-section
        if (item.subId) {
            if (typeof App !== 'undefined' && App.showSection) {
                // Expand parent menu if collapsed
                var parentItem = document.querySelector('.sidebar-nav-item[data-view="' + item.tab + '"]');
                if (parentItem && parentItem.classList.contains('sub-collapsed')) {
                    App.toggleParentExpand(item.tab);
                }
                
                App.showSection(item.subId);
            }
        } else {
            // Main section
            if (typeof App !== 'undefined' && App.showSection) {
                App.showSection(item.tab);
            }
        }

        // 2. Open item detail or modal
        setTimeout(function() {
            if (item.tab === 'notes' || item.tab.indexOf('team_instance_') === 0) {
                if (typeof Notes !== 'undefined' && Notes.openDetail) {
                    Notes.openDetail(item.id);
                }
            } else if (item.tab === 'reminders') {
                if (typeof Reminders !== 'undefined' && Reminders.openDetail) {
                    Reminders.openDetail(item.id);
                }
            } else if (item.tab === 'finance') {
                if (typeof Finance !== 'undefined' && Finance.openDetail) {
                    Finance.openDetail(item.id);
                }
            } else if (item.tab === 'board') {
                if (typeof Board !== 'undefined' && Board.openItemDetail) {
                    Board.openItemDetail(item.colId, item.id);
                }
            }
        }, 150);
    }

    return {
        init: init,
        openSearchPage: openSearchPage,
        closeSearchPage: closeSearchPage,
        clearSearch: clearSearch,
        setFilter: setFilter,
        performSearch: performSearch,
        selectResult: selectResult
    };
})();

// Initialize search module when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    Search.init();
});
