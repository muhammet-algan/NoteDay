/* ========================================
   ANA UYGULAMA KONTROLCÜSÜ
   Sayfa gezinme, görünüm yönetimi ve
   tüm modüllerin başlatılmasından sorumludur.
   ======================================== */
var App = (function () {
    'use strict';

    /* Şu anki görünüm durumu (landing, auth, dashboard) */
    var currentView = 'landing';
    var _canDragGroup = false;

    var SECTION_ICONS = {
        notes: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-primary);"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" /><path d="M14 3v4a2 2 0 0 0 2 2h4" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></svg>',
        team: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-primary);"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>',
        reminders: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-primary);"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>',
        finance: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-primary);"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>',
        board: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-primary);"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>',
        trash: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-primary);"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>',
        messages: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-primary);"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>',
        'new-table': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-primary);"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>',
        aliskanlik: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-primary);"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
    };

    /* Uygulama başlatma - Tüm modülleri yükler ve gezinmeyi ayarlar */
    function init() {
        try {
            if (window.location.protocol === 'file:') {
                setTimeout(function() {
                    if (typeof Toast !== 'undefined' && Toast.warning) {
                        Toast.warning("NoteDay'i dosya modunda (file://) çalıştırıyorsunuz. Sayfa yenilendiğinde verilerinizin kaybolmaması için lütfen 'Noteday.bat' dosyasını kullanın.", 8000);
                    } else if (typeof Toast !== 'undefined' && Toast.show) {
                        Toast.show("NoteDay'i dosya modunda (file://) çalıştırıyorsunuz. Sayfa yenilendiğinde verilerinizin kaybolmaması için lütfen 'Noteday.bat' dosyasını kullanın.", "warning", 8000);
                    }
                }, 1500);
            }

            // Eski AI ve API anahtarı artıklarını localStorage'dan temizle
            try {
                localStorage.removeItem('gemini_api_key');
                localStorage.removeItem('noteday_assistant_chats');
                localStorage.removeItem('noteday_assistant_sessions');
                localStorage.removeItem('noteday_assistant_custom_name');
                localStorage.removeItem('noteday_assistant_icon_style');
            } catch(e) {}

            /* Tüm modülleri başlat */
            if (typeof Auth !== 'undefined' && Auth.init) Auth.init();
            if (typeof NotesCalendar !== 'undefined' && NotesCalendar.init) NotesCalendar.init();

            if (typeof Reminders !== 'undefined' && Reminders.init) Reminders.init();
            if (typeof ReminderCalendar !== 'undefined' && ReminderCalendar.init) ReminderCalendar.init();
            if (typeof Finance !== 'undefined' && Finance.init) Finance.init();
            if (typeof FinanceCalendar !== 'undefined' && FinanceCalendar.init) FinanceCalendar.init();
            if (typeof Trash !== 'undefined' && Trash.init) Trash.init();

            /* Bildirim modülü başlat */
            if (typeof Notifications !== 'undefined' && Notifications.init) {
                Notifications.init();
            }



            /* Panom modülü başlat */
            if (typeof Board !== 'undefined' && Board.init) {
                Board.init();
            }



            /* Alt bölümleri yükle ve DOM'a ekle */
            loadSubSections();

            /* Kaydedilmiş grup öğelerini yükle (Tablolar, Alışkanlıklar) */
            loadGroupItems();
            loadGroupTitles();

            /* Kenar çubuğu gezinme olaylarını ayarla */
            setupNavigation();

            /* Kaydedilmiş nav sıralaması ve özel etiketleri yükle */
            loadGroupsOrder();
            loadNavOrder();
            loadCustomLabels();

            /* Sürükle-bırak başlat */
            initDragAndDrop();

            /* Not → Sidebar sürükleme dinleyicisi */
            initNoteDragToSidebar();

            /* Badge gizleme durumunu uygula */
            applyBadgeVisibility();

            /* Sabitlenenler ve Favoriler gruplarını oluştur */
            renderPinnedAndFavorites();

            /* Grup açma/kapama durumlarını yükle */
            loadGroupCollapseStates();

            /* Kullanıcı oturum açmış mı kontrol et */
            if (Auth.isLoggedIn()) {
                showDashboard();
                /* Sayfa yeniden yüklendiğinde de hatırlatıcı kontrolü yap */
                checkUpcomingReminders();
            } else {
                showLanding();
            }

            /* Başlık senkronizasyonunu başlat */
            initTitleSync();

            /* URL hash kontrolü (yeni sekmede açma) */
            checkUrlHash();

            /* Global drag/drop handlers for resetting group drag flag */
            document.addEventListener('mouseup', function () {
                _canDragGroup = false;
            });
            document.addEventListener('touchend', function () {
                _canDragGroup = false;
            });
        } catch (err) {
            console.error('[NoteDay] init hatası:', err);
        }
    }

    /* Kenar çubuğundaki menü öğelerine tıklama olayı ekleme */
    function setupNavigation() {
        var navItems = document.querySelectorAll('.sidebar-nav-item');
        navItems.forEach(function (item) {
            if (item.classList.contains('nav-listener-added')) return;
            item.classList.add('nav-listener-added');

            item.addEventListener('click', function (e) {
                /* 3 nokta veya açılır kapanır chevron butonuna tıklandıysa navigasyonu engelle */
                if (e.target.closest('.sidebar-nav-more-btn') || e.target.closest('.nav-icon-chevron')) return;
                var view = this.dataset.view;
                if (view) {
                    showSection(view);
                }
            });
        });
    }

    /* Açılış sayfasını gösterme */
    function showLanding() {
        hideAllViews();
        document.getElementById('landing-view').classList.remove('hidden');
        currentView = 'landing';
    }

    /* Giriş/Kayıt formunu gösterme */
    function showAuth(mode) {
        hideAllViews();
        document.getElementById('auth-view').classList.remove('hidden');
        if (mode === 'register') {
            Auth.showRegister();
        } else {
            Auth.showLogin();
        }
        currentView = 'auth';
    }

    /* Ana paneli (dashboard) gösterme ve kullanıcı bilgilerini güncelleme */
    function showDashboard() {
        hideAllViews();
        var dashEl = document.getElementById('dashboard-view');
        dashEl.classList.remove('hidden');
        dashEl.style.display = '';
        currentView = 'dashboard';

        /* Kenar çubuğundaki kullanıcı bilgilerini güncelle */
        var user = Auth.getUser();
        if (user) {
            var nameEl = document.getElementById('user-name');
            var emailEl = document.getElementById('user-email');
            var avatarEl = document.getElementById('user-avatar');
            var headerAvatarEl = document.getElementById('header-user-avatar');
            var initials = (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
            var fullName = user.firstName + ' ' + user.lastName;
            if (nameEl) nameEl.textContent = fullName;
            if (emailEl) emailEl.textContent = user.email;
            if (avatarEl) {
                avatarEl.textContent = initials;
                avatarEl.style.backgroundImage = '';
                avatarEl.style.backgroundSize = '';
                avatarEl.style.backgroundPosition = '';
            }
            if (headerAvatarEl) {
                var headerInitials = (user.firstName ? user.firstName.charAt(0) : 'U').toUpperCase();
                headerAvatarEl.textContent = headerInitials;
                headerAvatarEl.style.backgroundImage = '';
                headerAvatarEl.style.backgroundSize = '';
                headerAvatarEl.style.backgroundPosition = '';
                 
                // E-posta adresine göre benzersiz ama kalıcı renk belirleme
                var avatarColors = ['#927568', '#9c8170', '#809282', '#788599', '#8a7b93', '#b38282', '#b3947b', '#7b9fb3', '#b37ba9'];
                var hash = 0;
                var email = user.email || '';
                for (var i = 0; i < email.length; i++) {
                    hash = email.charCodeAt(i) + ((hash << 5) - hash);
                }
                var colorIndex = Math.abs(hash) % avatarColors.length;
                headerAvatarEl.style.backgroundColor = avatarColors[colorIndex];
            }

            // Kaydedilmiş avatarı yükle
            try {
                var savedAvatar = localStorage.getItem('avatar_' + user.email);
                if (savedAvatar) {
                    if (avatarEl) {
                        avatarEl.textContent = '';
                        avatarEl.style.backgroundImage = 'url(' + savedAvatar + ')';
                        avatarEl.style.backgroundSize = 'cover';
                        avatarEl.style.backgroundPosition = 'center';
                    }
                    if (headerAvatarEl) {
                        headerAvatarEl.textContent = '';
                        headerAvatarEl.style.backgroundImage = 'url(' + savedAvatar + ')';
                        headerAvatarEl.style.backgroundSize = 'cover';
                        headerAvatarEl.style.backgroundPosition = 'center';
                    }
                }
            } catch (e) { }
        }

        /* Kaydedilmiş bölümü yükle veya varsayılan olarak notlarım sayfasını göster */
        var savedSection = localStorage.getItem('app_current_section');
        showSection(savedSection && savedSection !== 'home' ? savedSection : 'notes');

        /* Kenar çubuğu badge'lerini güncelle */
        updateSidebarBadges();
        scheduleMidnightReset();

        /* Menü düzeni tercihlerini uygula */
        if (typeof Settings !== 'undefined' && Settings.applyMenuLayout) {
            Settings.applyMenuLayout();
        }

        /* Kaydedilmiş sidebar durumunu geri yükle */
        var sidebarCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
        var sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebarCollapsed) {
            sidebar.classList.add('collapsed');
        }
    }

    function navigateToMainSection(sectionName) {
        if ((sectionName === 'notes' || sectionName.indexOf('team_instance_') === 0 || sectionName.indexOf('notes_instance_') === 0) && typeof Notes !== 'undefined') {
            if (Notes.closeModal) Notes.closeModal();
            if (Notes.closeDetail) Notes.closeDetail();
            if (Notes.closeDeleteModal) Notes.closeDeleteModal();
        }
        showSection(sectionName);
    }

    /* Belirtilen bölümü gösterme (kenar çubuğu menü geçişi) */
    function showSection(sectionName) {
        try {
            /* Menü düzeninde kapalı olan bölüme geçişi engelle */
            if (typeof Settings !== 'undefined' && Settings.getMenuLayout) {
                var layout = Settings.getMenuLayout();
                if (layout[sectionName] === false) {
                    var sections = ['messages', 'team', 'reminders', 'board', 'notes', 'finance'];
                    var firstVisible = sections.find(function (s) { return layout[s] !== false; });
                    if (firstVisible) {
                        sectionName = firstVisible;
                    }
                }
            }

            /* Tüm menü öğelerini pasif yap */
            var navItems = document.querySelectorAll('.sidebar-nav-item');
            navItems.forEach(function (item) { item.classList.remove('active'); });

            /* Seçilen menü öğesini aktif yap */
            var activeNavs = document.querySelectorAll('.sidebar-nav-item[data-view="' + sectionName + '"]');
            activeNavs.forEach(function (item) { item.classList.add('active'); });

            var parentViewName = sectionName;
            var isSub = sectionName.indexOf('_sub_') !== -1;
            if (isSub) {
                parentViewName = sectionName.split('_sub_')[0];
                activeSubSection[parentViewName] = sectionName;
            } else {
                if (activeSubSection[sectionName] !== undefined) {
                    activeSubSection[sectionName] = null;
                }
                /* Eğer alt bölümleri olan ana menüye tıklandıysa ve kapalıysa otomatik genişlet */
                var parentItem = document.querySelector('.sidebar-nav-item[data-view="' + sectionName + '"]');
                if (parentItem && parentItem.classList.contains('has-sub-sections')) {
                    if (parentItem.classList.contains('sub-collapsed')) {
                        toggleParentExpand(sectionName);
                    }
                }
            }

            /* Tüm bölüm panellerini gizle (CSS + inline stil) */
            var panels = document.querySelectorAll('.section-panel');
            panels.forEach(function (panel) {
                panel.classList.remove('active');
                panel.style.display = 'none';
            });

            /* Seçilen bölüm panelini göster (CSS + inline stil) */
            var panelViewName = parentViewName;
            /* Sabitlenmiş not görünümleri notes panelini kullanır */
            if (parentViewName.indexOf('notes_pinned_') === 0) {
                panelViewName = 'notes';
            /* Instance görünümlerini temel panel adına çevir */
            } else if (parentViewName.indexOf('_instance_') !== -1) {
                var navItemForPanel = document.querySelector('.sidebar-nav-item[data-view="' + sectionName + '"]');
                var baseType = navItemForPanel ? navItemForPanel.getAttribute('data-view-type') : null;
                if (baseType) {
                    panelViewName = baseType;
                } else {
                    panelViewName = parentViewName.split('_instance_')[0];
                }
            }
            var panel = document.getElementById(panelViewName + '-section');
            if (panel) {
                panel.classList.add('active');
                panel.style.display = 'block';
            }

            /* Sidebar durumunu güncelle */
            var contentArea = document.querySelector('.content-area');
            var sidebar = document.querySelector('.sidebar');
            if (contentArea) {
                if (sidebar) {
                    var sidebarCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
                    if (sidebarCollapsed) {
                        sidebar.classList.add('collapsed');
                    } else {
                        sidebar.classList.remove('collapsed');
                    }
                }
            }

            /* Sayfa başlığını güncelle */
            var headerTitles = {
                team: 'Ekibim',
                reminders: 'Hatırlatıcılarım',
                notes: 'Notlarım',
                finance: 'Finanslarım',
                board: 'Panom',
                trash: 'Çöp Kutusu',
                'new-table': 'Yeni Tablo',
                aliskanlik: 'Yeni Alışkanlık'
            };

            var headerEl = document.getElementById('content-header-title');
            if (headerEl) {
                var sectionIcon = SECTION_ICONS[parentViewName] || '';
                var sectionTitleText = headerTitles[parentViewName] || '';

                /* Instance görünümleri için başlık ve ikonu çöz */
                if (parentViewName.indexOf('_instance_') !== -1) {
                    var instanceNavItem = document.querySelector('.sidebar-nav-item[data-view="' + sectionName + '"]');
                    var instanceBaseType = instanceNavItem ? instanceNavItem.getAttribute('data-view-type') : parentViewName.split('_instance_')[0];
                    var iconKey = instanceBaseType;
                    if (sectionName.indexOf('team_instance_') === 0) {
                        iconKey = 'team';
                    }
                    sectionIcon = SECTION_ICONS[iconKey] || '';
                    var instanceLabel = instanceNavItem ? instanceNavItem.querySelector('.nav-label') : null;
                    sectionTitleText = instanceLabel ? instanceLabel.textContent : (headerTitles[instanceBaseType] || '');
                }
                
                if (isSub) {
                    var navItem = document.querySelector('.sidebar-nav-item[data-view="' + sectionName + '"]');
                    var labelEl = navItem ? navItem.querySelector('.nav-label') : null;
                    if (labelEl) {
                        sectionTitleText = labelEl.textContent;
                    }
                }

                var html = '<div style="display:flex;align-items:center;gap:8px;font-size:var(--font-size-xl);font-weight:inherit;letter-spacing:inherit;">';
                html += '<div onclick="App.navigateToMainSection(\'' + parentViewName + '\')" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;">' + sectionIcon + '<span style="color:var(--color-text-primary);">' + sectionTitleText + '</span></div>';

                var isTeamInstance = parentViewName.indexOf('team_instance_') === 0;
                var hasDropdown = (parentViewName === 'notes') || isTeamInstance || (parentViewName.indexOf('notes_instance_') === 0);
                if (hasDropdown) {
                    var activeItemTitle = 'Not Başlıkları';
                    var dropdownTitle = 'Notlar';
                    html += '<span id="header-breadcrumb-separator" style="color:var(--color-text-muted);display:none;">/</span>' +
                            '<div id="header-breadcrumb-dropdown-wrapper" class="header-section-dropdown-wrapper" style="font-size:inherit;font-weight:inherit;position:relative;display:none;">' +
                            '<span class="header-section-dropdown-trigger" style="color:var(--color-text-secondary);cursor:pointer;display:inline-flex;align-items:center;gap:4px;" onclick="App.toggleHeaderDropdown(event)">' +
                            activeItemTitle + ' <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left:2px;"><polyline points="6 9 12 15 18 9"/></svg>' +
                            '</span>' +
                            '<div id="header-section-dropdown" class="header-section-dropdown-menu" onclick="event.stopPropagation()">' +
                            '<div class="header-section-dropdown-title">' + dropdownTitle + '</div>' +
                            '<div class="header-section-dropdown-list" id="header-section-dropdown-list"></div>' +
                            '</div>' +
                            '</div>';
                }

                html += '</div>';
                headerEl.innerHTML = html;

                if (hasDropdown) {
                    populateHeaderDropdown(parentViewName);
                    updateHeaderActiveItem(activeItemTitle);
                }
            }

            /* Bölüme özel eylem butonunu göster/gizle */
            var actionBtn = document.getElementById('section-action-btn');
            var actionLabel = document.getElementById('section-action-label');
            var sectionActions = {
                reminders: { action: 'Reminders.openModal()' },
                notes: { action: 'Notes.openModal()' },
                finance: { action: 'Finance.openAddModal()' },
                board: { action: 'Board.openNewListDropdown()' },
                'new-table': { action: "Tablo.addNotionRow(document.querySelector('.section-panel.active .notum-db-wrapper'))" },
                aliskanlik: { action: "App.handleGroupAdd('aliskanliklar')" }
            };
            if (actionBtn) {
                var actionKey = parentViewName;
                if (parentViewName.indexOf('team_instance_') === 0 || parentViewName.indexOf('notes_instance_') === 0) {
                    actionKey = 'notes';
                } else if (parentViewName.indexOf('new-table_instance_') === 0) {
                    actionKey = 'new-table';
                } else if (parentViewName.indexOf('aliskanlik_instance_') === 0) {
                    actionKey = 'aliskanlik';
                }
                var cfg = sectionActions[actionKey];
                if (cfg) {
                    var singular = getSingularLabel(parentViewName);
                    var labelText = 'Yeni ' + singular;
                    if (actionLabel) actionLabel.textContent = labelText;
                    actionBtn.setAttribute('onclick', cfg.action);
                    actionBtn.style.display = 'inline-flex';
                } else {
                    actionBtn.style.display = 'none';
                }
            }


            /* Çöp Kutusu: Tümünü Sil butonunu sadece çöp kutusunda göster */
            var trashClearHeaderBtn = document.getElementById('trash-clear-header-btn');
            if (trashClearHeaderBtn) {
                trashClearHeaderBtn.style.display = parentViewName === 'trash' ? 'inline-flex' : 'none';
            }

            /* Günlük filtresi butonunu göster/gizle ve başlığını güncelle */
            var filterMenuWrapper = document.getElementById('diary-filter-menu-wrapper');
            if (filterMenuWrapper) {
                filterMenuWrapper.style.display = (parentViewName === 'trash') ? 'none' : 'inline-flex';
                var filterTitleEl = document.getElementById('filter-menu-title');
                if (filterTitleEl) {
                    var filterTitles = {
                        diary: "Günlük filtreleri",
                        reminders: "Hatırlatıcı filtreleri",
                        notes: "Not filtreleri",
                        team: "Ekip filtreleri",
                        board: "Pano filtreleri"
                    };
                    filterTitleEl.textContent = filterTitles[parentViewName] || "Filtreler";
                }
            }

            /* Çöp kutusu bölümünde bildirim ve 3 nokta butonlarını gizle */
            var notifBtn = document.getElementById('notif-floating-btn');
            if (notifBtn) {
                notifBtn.style.display = (parentViewName === 'trash') ? 'none' : '';
            }
            var moreBtn = document.getElementById('notum-style-more-btn');
            if (moreBtn && moreBtn.parentElement) {
                moreBtn.parentElement.style.display = (parentViewName === 'trash') ? 'none' : '';
            }

            /* Çöp kutusu: arama çubuğunu content-header'a ekle/kaldır */
            var contentHeader = document.querySelector('.content-header');
            var existingSearch = document.getElementById('trash-header-search');
            if (parentViewName === 'trash') {
                if (!existingSearch && contentHeader) {
                    contentHeader.style.position = 'relative';
                    var searchHtml =
                        '<div class="trash-search-wrapper" id="trash-header-search">' +
                            '<div class="trash-search-bar">' +
                                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                                    '<circle cx="11" cy="11" r="8"></circle>' +
                                    '<line x1="21" y1="21" x2="16.65" y2="16.65"></line>' +
                                '</svg>' +
                                '<input type="text" id="trash-search-input" placeholder="Çöp kutusunda ara..." oninput="Trash.filterItems(this.value)">' +
                            '</div>' +
                        '</div>';
                    contentHeader.insertAdjacentHTML('beforeend', searchHtml);
                }
            } else {
                if (existingSearch) {
                    existingSearch.remove();
                }
                if (contentHeader) {
                    contentHeader.style.position = '';
                }
            }

            /* Aktif bölümü kaydet (sayfa yenilendiğinde hatırlansın) */
            _currentSection = sectionName;
            try { localStorage.setItem('app_current_section', sectionName); } catch (e) { }

            /* Bölümün içeriğini oluştur */
            renderSection(parentViewName);

            /* Bölüme girildiğinde ziyaret kaydı tut (badge silikleşsin) */
            markSectionVisited(parentViewName);

            /* Kenar çubuğu badge'lerini güncelle */
            updateSidebarBadges();
        } catch (err) {
            console.error('[NoteDay] showSection hatası:', err);
            /* Hata durumunda en azından notlarım bölümünü göstermeyi dene */
            var fallback = document.getElementById('notes-section');
            if (fallback) {
                fallback.classList.add('active');
                fallback.style.display = 'block';
            }
        }
    }

    /* Her bölümün render fonksiyonunu çağırma */
    function renderSection(sectionName) {
        switch (sectionName) {
            case 'new-table':
                if (typeof NewTable !== 'undefined') {
                    NewTable.render();
                }
                break;
            case 'aliskanlik':
                if (typeof Aliskanlik !== 'undefined') {
                    Aliskanlik.render();
                }
                break;
            case 'reminders':
                Reminders.render();          // Hatırlatıcı listesini göster
                ReminderCalendar.render();   // Hatırlatıcı takvimini çiz
                break;
            case 'finance':
                Finance.render();            // Gelir/gider kayıtlarını göster
                FinanceCalendar.render();    // Finans takvimini çiz
                break;
            case 'notes':
                Notes.render();
                break;


            case 'board':
                if (typeof Board !== 'undefined' && Board.render) {
                    Board.render();
                }
                break;
            case 'trash':
                if (typeof Trash !== 'undefined' && Trash.render) {
                    Trash.render();
                }
                break;
            default:
                /* Instance görünümlerini (ör. new-table_instance_xxx) temel render'a yönlendir */
                if (sectionName.indexOf('notes_pinned_') === 0) {
                    /* Sabitlenmiş not bölümü: notu direk aç */
                    if (typeof Notes !== 'undefined') {
                        Notes.render();
                        /* Hangi note ID'si bu bölümle eşleşiyor? */
                        var pinnedNavEl = document.querySelector('.sidebar-nav-item[data-view="' + sectionName + '"]');
                        var pinnedNoteId = pinnedNavEl ? pinnedNavEl.getAttribute('data-pinned-note-id') : null;
                        if (pinnedNoteId) {
                            setTimeout(function () {
                                if (typeof Notes !== 'undefined' && Notes.openDetail) {
                                    Notes.openDetail(pinnedNoteId);
                                }
                            }, 100);
                        }
                    }
                } else if (sectionName.indexOf('_instance_') !== -1) {
                    var navItemR = document.querySelector('.sidebar-nav-item[data-view="' + sectionName + '"]');
                    var baseViewType = navItemR ? navItemR.getAttribute('data-view-type') : sectionName.split('_instance_')[0];
                    if (baseViewType === 'new-table' && typeof NewTable !== 'undefined') {
                        NewTable.render();
                    } else if (baseViewType === 'aliskanlik' && typeof Aliskanlik !== 'undefined') {
                        Aliskanlik.render();
                    } else if ((baseViewType === 'notes' || baseViewType === 'team') && typeof Notes !== 'undefined') {
                        Notes.render();
                    }
                }
                break;
        }
    }

    /* Tüm ana görünümleri gizleme (landing, auth, dashboard) */
    function hideAllViews() {
        var views = document.querySelectorAll('.app-view');
        views.forEach(function (view) { view.classList.add('hidden'); });
    }

    /* Sidebar tamamen aç/kapat */
    function toggleSidebar() {
        var sidebar = document.querySelector('.sidebar');
        var contentArea = document.querySelector('.content-area');
        if (!sidebar) return;

        // Disable pointer events during transition to prevent hover reflows
        sidebar.style.pointerEvents = 'none';
        if (contentArea) contentArea.style.pointerEvents = 'none';

        sidebar.classList.toggle('collapsed');
        var isCollapsed = sidebar.classList.contains('collapsed');

        var cleanup = function () {
            sidebar.style.pointerEvents = '';
            if (contentArea) contentArea.style.pointerEvents = '';
            sidebar.removeEventListener('transitionend', cleanup);
        };
        sidebar.addEventListener('transitionend', cleanup);
        setTimeout(cleanup, 350);

        try {
            localStorage.setItem('sidebar_collapsed', isCollapsed ? 'true' : 'false');
        } catch (e) { }
    }

    /* Başarılı giriş sonrası paneli gösterme */
    function onLoginSuccess() {
        showDashboard();
        checkUpcomingReminders();
        if (typeof Notifications !== 'undefined' && Notifications.reload) Notifications.reload();
    }

    /**
     * Giriş yapıldığında yaklaşan hatırlatıcıları kontrol et.
     * 24 saat veya daha az kalmış hatırlatıcılar varsa bildirim paneline ekle.
     * Sayfa yenilendiğinde tekrar eklememek için sessionStorage kullanılır.
     */
    function checkUpcomingReminders() {
        /* Daha önce eklendiyse tekrar ekleme */
        if (sessionStorage.getItem('reminderToastShown')) return;

        /* Hatırlatıcı ve bildirim modülleri yüklü mü kontrol et */
        if (typeof Reminders === 'undefined' || !Reminders.getReminders) return;
        if (typeof Notifications === 'undefined' || !Notifications.addNotification) return;

        var reminders = Reminders.getReminders();
        var now = new Date();

        reminders.forEach(function (r) {
            /* Pasif veya tamamlanmış hatırlatıcıları atla */
            if (r.enabled === false || r.triggered === true) return;
            if (!r.customDate) return;

            /* Hatırlatıcı tarih+saatini Date objesine çevir */
            var parts = r.customDate.split('-');
            var reminderTime = new Date(
                parseInt(parts[0]),
                parseInt(parts[1]) - 1,
                parseInt(parts[2]),
                r.hour || 0,
                r.minute || 0,
                0
            );

            /* Farkı milisaniye cinsinden hesapla */
            var diff = reminderTime.getTime() - now.getTime();

            /* 0 ile 24 saat arasındaysa bildirim paneline ekle */
            if (diff >= 0 && diff <= 24 * 60 * 60 * 1000) {
                var timeStr = String(r.hour || 0).padStart(2, '0') + ':' + String(r.minute || 0).padStart(2, '0');
                var nId = 'login_reminder_' + (r.id || r.title) + '_' + now.toDateString();
                Notifications.addNotification({
                    id: nId,
                    type: 'reminder',
                    title: 'Hatırlatıcı: ' + (r.title || 'Adsız'),
                    message: 'Bugün saat ' + timeStr + ' için planlandı.',
                    time: new Date().toISOString(),
                    read: false
                });
            }
        });

        /* Sayfa yenilendiğinde tekrar ekleme */
        sessionStorage.setItem('reminderToastShown', 'true');
    }

    /* Çıkış sonrası açılış sayfasına dönme */
    function onLogout() {
        /* Çıkış yapıldığında toast flag'ini temizle (tekrar girişte gösterilsin) */
        sessionStorage.removeItem('reminderToastShown');

        /* Sidebar avatarını sıfırla */
        var avatarEl = document.getElementById('user-avatar');
        var headerAvatarEl = document.getElementById('header-user-avatar');
        if (avatarEl) {
            avatarEl.textContent = '';
            avatarEl.style.backgroundImage = '';
            avatarEl.style.backgroundSize = '';
            avatarEl.style.backgroundPosition = '';
        }
        if (headerAvatarEl) {
            headerAvatarEl.textContent = '';
            headerAvatarEl.style.backgroundImage = '';
            headerAvatarEl.style.backgroundSize = '';
            headerAvatarEl.style.backgroundPosition = '';
        }

        /* Dropdown'u kapat */
        var dropdown = document.getElementById('user-dropdown');
        if (dropdown) dropdown.classList.remove('open');

        showLanding();
    }

    /* Çıkış onay modalını göster */
    function handleLogout() {
        /* Dropdown'u kapat */
        var dropdown = document.getElementById('user-dropdown');
        if (dropdown) dropdown.classList.remove('open');

        var overlay = document.getElementById('logout-modal-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            /* Animasyon için küçük gecikme */
            requestAnimationFrame(function () {
                overlay.classList.add('active');
            });
        }
    }

    /* Çıkış onay modalını kapat */
    function closeLogoutModal() {
        var overlay = document.getElementById('logout-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(function () {
                overlay.style.display = 'none';
            }, 250);
        }
    }

    /* Çıkışı onayla */
    function confirmLogout() {
        closeLogoutModal();
        setTimeout(function () {
            Auth.logout();
        }, 200);
    }

    /* ========================================
       KENAR ÇUBUĞU BADGE SİSTEMİ (3 Durumlu)
       bright: Parlak/glow – kullanıcı henüz bölüme girmedi
       faded:  Silik – kullanıcı bölüme girdi ama içerik işlenmedi
       hidden: Gizli – veri yok veya içerik tamamen işlendi
       ======================================== */

    /* Aktif bölümü takip et */
    var _currentSection = 'notes';

    /* Bugünün tarih string'ini döndür (YYYY-MM-DD) */
    function getTodayStr() {
        var t = new Date();
        return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
    }

    /* Kullanıcıya özel localStorage key oluştur */
    function userKey(key) {
        var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
        return key + (user ? '_' + user.email : '');
    }

    /* Bölüm ziyaret edildi mi? (bugün için) */
    function wasSectionVisitedToday(section) {
        try {
            var val = localStorage.getItem(userKey('badge_visited_' + section));
            return val === getTodayStr();
        } catch (e) { return false; }
    }

    /* Bölümü bugün ziyaret edildi olarak işaretle */
    function markSectionVisited(section) {
        try {
            localStorage.setItem(userKey('badge_visited_' + section), getTodayStr());
        } catch (e) { }
    }

    function updateSidebarBadges() {
        try {
            var today = new Date();
            var todayStr = getTodayStr();




            /* === 3. EKİBİM: Silindi === */
            setBadge('badge-team', 0, 'hidden');

            /* === 4. HATIRLATICILARIM: Bugüne ait aktif hatırlatıcı sayısı === */
            var reminderCount = 0;
            if (typeof Reminders !== 'undefined' && Reminders.getReminders) {
                var reminders = Reminders.getReminders();
                reminders.forEach(function (r) {
                    if (r.enabled === false) return;
                    /* Tamamlanmış/tetiklenmiş hatırlatıcıları sayma */
                    if (r.triggered === true) return;
                    /* Süresi geçmiş hatırlatıcıları sayma */
                    if (r.repeat !== 'everyday' && r.repeat !== 'everyweek' && r.customDate) {
                        var parts = r.customDate.split('-');
                        var rTime = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), r.hour || 23, r.minute || 59);
                        if (rTime < today) return;
                    }
                    if (r.repeat === 'everyday') { reminderCount++; return; }
                    if (r.repeat === 'everyweek') {
                        var wParts = (r.customDate || '').split('-');
                        if (wParts.length === 3) {
                            var created = new Date(parseInt(wParts[0]), parseInt(wParts[1]) - 1, parseInt(wParts[2]));
                            if (today.getDay() === created.getDay()) reminderCount++;
                        }
                        return;
                    }
                    if (r.customDate === todayStr) reminderCount++;
                });
            }
            if (reminderCount === 0) {
                setBadge('badge-reminders', 0, 'hidden');
            } else if (wasSectionVisitedToday('reminders')) {
                setBadge('badge-reminders', reminderCount, 'faded');
            } else {
                setBadge('badge-reminders', reminderCount, 'bright');
            }

            /* === 5. NOTLARIM: Bugüne ait not sayısı === */
            var notesCount = 0;
            if (typeof Notes !== 'undefined' && Notes.getNotes) {
                var allNotes = Notes.getNotes();
                notesCount = allNotes.filter(function (n) {
                    var d = new Date(n.date || n.createdAt);
                    return d.getDate() === today.getDate() &&
                        d.getMonth() === today.getMonth() &&
                        d.getFullYear() === today.getFullYear();
                }).length;
            }
            if (notesCount === 0) {
                setBadge('badge-notes', 0, 'hidden');
            } else if (wasSectionVisitedToday('notes')) {
                setBadge('badge-notes', notesCount, 'faded');
            } else {
                setBadge('badge-notes', notesCount, 'bright');
            }

            /* === 7. GELİR/GİDER: Bugüne ait işlem sayısı === */
            var financeCount = 0;
            if (typeof Finance !== 'undefined' && Finance.getEntries) {
                var fEntries = Finance.getEntries();
                financeCount = fEntries.filter(function (e) {
                    var d = new Date(e.date);
                    return d.getDate() === today.getDate() &&
                        d.getMonth() === today.getMonth() &&
                        d.getFullYear() === today.getFullYear();
                }).length;
            }
            if (financeCount === 0) {
                setBadge('badge-finance', 0, 'hidden');
            } else if (wasSectionVisitedToday('finance')) {
                setBadge('badge-finance', financeCount, 'faded');
            } else {
                setBadge('badge-finance', financeCount, 'bright');
            }
        } catch (err) {
            console.error('[NoteDay] updateSidebarBadges hatası:', err);
        }
    }

    /**
     * Badge elementini güncelle
     * @param {string} id - Badge element ID
     * @param {number} count - Gösterilecek sayı
     * @param {string} state - 'bright', 'faded', veya 'hidden'
     */
    function setBadge(id, count, state) {
        var el = document.getElementById(id);
        if (!el) return;
        /* Önce tüm state class'larını temizle */
        el.classList.remove('badge-bright', 'badge-faded');
        if (!state || state === 'hidden' || count <= 0) {
            el.textContent = '';
            el.style.display = 'none';
        } else {
            el.textContent = '(' + count + ')';
            el.style.display = 'flex';
            el.classList.add(state === 'bright' ? 'badge-bright' : 'badge-faded');
        }
    }

    /* Gece yarısı (00:00) badge'leri ve ziyaret kayıtlarını sıfırla */
    function scheduleMidnightReset() {
        var now = new Date();
        var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
        var msUntilMidnight = midnight.getTime() - now.getTime();
        setTimeout(function () {
            /* Gün değişti: ziyaret kayıtlarını temizle */
            try {
                var sections = ['messages', 'team', 'reminders', 'board', 'notes', 'finance'];
                sections.forEach(function (s) {
                    localStorage.removeItem(userKey('badge_visited_' + s));
                });
            } catch (e) { }
            updateSidebarBadges();
            scheduleMidnightReset();
        }, msUntilMidnight);
    }

    /* ========================================
       BAĞLAM MENÜSÜ (3 Dikey Nokta)
       ======================================== */
    var _ctxViewName = null;

    function showNavContextMenu(viewName, event) {
        event.preventDefault();
        event.stopPropagation();
        _ctxViewName = viewName;

        var menu = document.getElementById('sidebar-context-menu');
        if (!menu) return;

        var createSubBtn = document.getElementById('ctx-create-sub');
        var deleteSubBtn = document.getElementById('ctx-delete-sub');

        var isSubSection = viewName.indexOf('_sub_') !== -1;
        var supportsSubSections = ['notes', 'finance', 'board'].indexOf(viewName) !== -1;

        var hideBtn = menu.querySelector('.sidebar-ctx-item[data-action="hide"]');

        if (createSubBtn) {
            createSubBtn.style.display = (supportsSubSections && !isSubSection) ? 'flex' : 'none';
        }
        if (deleteSubBtn) {
            deleteSubBtn.style.display = isSubSection ? 'flex' : 'none';
        }
        if (hideBtn) {
            hideBtn.style.display = isSubSection ? 'none' : 'flex';
        }

        var standardBtns = menu.querySelectorAll('.sidebar-ctx-item:not(#ctx-create-sub):not(#ctx-delete-sub):not([data-action="hide"])');
        standardBtns.forEach(function (btn) {
            var action = btn.getAttribute('data-action');
            if (isSubSection && (action === 'pin' || action === 'favorite')) {
                btn.style.display = 'none';
            } else {
                btn.style.display = 'flex';
            }
        });

        /* Badge label güncelle */
        var badgeLabel = document.getElementById('ctx-badge-label');
        if (badgeLabel) {
            var hiddenBadges = getBadgeHiddenState();
            badgeLabel.textContent = hiddenBadges[viewName] ? 'Öğe sayısını göster' : 'Öğe sayısını gizle';
        }

        /* Pin label güncelle */
        var pinLabel = document.getElementById('ctx-pin-label');
        if (pinLabel) {
            var pinned = getPinnedItems();
            pinLabel.textContent = pinned.indexOf(viewName) !== -1 ? 'Sabitleneni kaldır' : 'Başa sabitle';
        }

        /* Fav label güncelle */
        var favLabel = document.getElementById('ctx-fav-label');
        if (favLabel) {
            var favs = getFavoriteItems();
            favLabel.textContent = favs.indexOf(viewName) !== -1 ? 'Favorilerden çıkar' : 'Favorilere ekle';
        }

        /* Menüyü göster */
        menu.classList.add('open');

        /* Pozisyon ayarla */
        var btn = event.currentTarget;
        var rect = btn.getBoundingClientRect();
        var menuH = menu.offsetHeight;
        var menuW = menu.offsetWidth;

        var top = rect.bottom + 4;
        var left = rect.right - menuW;

        /* Ekran dışı kalmaması için kontrol */
        if (top + menuH > window.innerHeight) {
            top = rect.top - menuH - 4;
        }
        if (left < 8) left = 8;

        menu.style.top = top + 'px';
        menu.style.left = left + 'px';

        /* Click handler'lar */
        var items = menu.querySelectorAll('.sidebar-ctx-item');
        items.forEach(function (item) {
            var newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            newItem.addEventListener('click', function () {
                var action = newItem.getAttribute('data-action');
                handleCtxAction(action);
            });
        });
    }

    function closeNavContextMenu() {
        var menu = document.getElementById('sidebar-context-menu');
        if (menu) menu.classList.remove('open');
        _ctxViewName = null;
    }

    /* Dışarı tıklayınca kapat */
    document.addEventListener('click', function (e) {
        var menu = document.getElementById('sidebar-context-menu');
        if (menu && menu.classList.contains('open')) {
            if (!menu.contains(e.target) && !e.target.closest('.sidebar-nav-more-btn')) {
                closeNavContextMenu();
            }
        }
    });

    function handleCtxAction(action) {
        var viewName = _ctxViewName;
        closeNavContextMenu();
        if (!viewName) return;

        switch (action) {
            case 'pin':
                togglePinItem(viewName);
                break;
            case 'favorite':
                toggleFavoriteItem(viewName);
                break;
            case 'rename':
                renameNavItem(viewName);
                break;
            case 'newtab':
                openInNewTab(viewName);
                break;
            case 'togglebadge':
                toggleBadgeVisibility(viewName);
                break;
            case 'hide':
                hideNavItem(viewName);
                break;
            case 'createsub':
                createSubSection(viewName);
                break;
            case 'deletesub':
                deleteSubSection(viewName);
                break;
            case 'trash':
                moveToTrashAction(viewName);
                break;

        }
    }

    /* === Kenar Çubuğu Eylemleri İçin Tekil İsim Alıcı === */
    function getSingularLabel(viewName) {
        if (viewName && viewName.indexOf('team_instance_') === 0) {
            return 'Sayfa';
        }
        if (viewName && viewName.indexOf('notes_instance_') === 0) {
            return 'Not';
        }
        if (viewName && viewName.indexOf('new-table_instance_') === 0) {
            return 'Tablo';
        }
        if (viewName === 'new-table') {
            return 'Tablo';
        }
        if (viewName && viewName.indexOf('aliskanlik_instance_') === 0) {
            return 'Alışkanlık';
        }
        if (viewName === 'aliskanlik') {
            return 'Alışkanlık';
        }
        var navItem = document.querySelector('.sidebar-nav-item[data-view="' + viewName + '"]');
        var label = navItem ? navItem.querySelector('.nav-label').textContent.trim() : '';
        
        if (!label) {
            var fallbacks = {
                home: 'Günlük',
                finance: 'İşlem',
                team: 'Ekip',
                reminders: 'Hatırlatıcı',
                notes: 'Not',
                board: 'Pano',
                trash: 'Çöp'
            };
            return fallbacks[viewName] || '';
        }
        
        if (viewName === 'finance') {
            if (label === 'Finanslarım') return 'İşlem';
        }
        if (viewName === 'trash') {
            return 'Çöp';
        }
        if (viewName === 'home') {
            return 'Günlük';
        }
        
        var lower = label.toLowerCase();
        var cleaned = label;
        if (lower.endsWith('larım') || lower.endsWith('larımın')) {
            cleaned = label.slice(0, -5);
        } else if (lower.endsWith('lerim') || lower.endsWith('lerimin')) {
            cleaned = label.slice(0, -5);
        } else if (lower.endsWith('lar') || lower.endsWith('ler')) {
            cleaned = label.slice(0, -3);
        } else if (lower.endsWith('ım') || lower.endsWith('im') || lower.endsWith('um') || lower.endsWith('üm')) {
            cleaned = label.slice(0, -2);
        } else if (lower.endsWith('am') || lower.endsWith('em') || lower.endsWith('om') || lower.endsWith('öm')) {
            if (label.length > 4) {
                cleaned = label.slice(0, -1);
            }
        }
        
        // Consonant mutation recovery (yumuşama geri alma): b->p, c->ç, d->t, ğ->k
        var lastChar = cleaned.charAt(cleaned.length - 1).toLowerCase();
        if (lastChar === 'b') {
            cleaned = cleaned.slice(0, -1) + (cleaned.charAt(cleaned.length - 1) === 'B' ? 'P' : 'p');
        } else if (lastChar === 'c') {
            cleaned = cleaned.slice(0, -1) + (cleaned.charAt(cleaned.length - 1) === 'C' ? 'Ç' : 'ç');
        } else if (lastChar === 'd') {
            cleaned = cleaned.slice(0, -1) + (cleaned.charAt(cleaned.length - 1) === 'D' ? 'T' : 't');
        } else if (lastChar === 'ğ') {
            cleaned = cleaned.slice(0, -1) + (cleaned.charAt(cleaned.length - 1) === 'Ğ' ? 'K' : 'k');
        }
        
        return cleaned;
    }

    /* === Yeniden Adlandır === */
    function renameNavItem(viewName) {
        var navItem = document.querySelector('.sidebar-nav-item[data-view="' + viewName + '"]');
        if (!navItem) return;
        var labelEl = navItem.querySelector('.nav-label');
        if (!labelEl) return;

        var currentLabel = labelEl.textContent;
        var input = document.createElement('input');
        input.type = 'text';
        input.value = currentLabel;
        input.className = 'sidebar-nav-rename-input';
        input.setAttribute('maxlength', '25');

        labelEl.style.display = 'none';
        labelEl.parentNode.insertBefore(input, labelEl.nextSibling);
        input.focus();
        input.select();

        function finishRename() {
            var newName = input.value.trim();
            if (!newName) newName = navItem.getAttribute('data-default-label') || currentLabel;
            labelEl.textContent = newName;
            labelEl.style.display = '';
            if (input.parentNode) input.remove();

            /* Tooltip da güncelle */
            navItem.setAttribute('data-tooltip', newName);

            /* localStorage'a kaydet */
            saveCustomLabel(viewName, newName);

            // Save group items if it belongs to one of our dynamic groups
            var groupEl = navItem.closest('.sidebar-nav-group');
            if (groupEl) {
                var groupId = groupEl.id;
                var groupKey = null;
                if (groupId === 'sidebar-nav-group-workspace') groupKey = 'workspace';
                else if (groupId === 'sidebar-nav-group-tablolar') groupKey = 'tablolar';
                else if (groupId === 'sidebar-nav-group-aliskanliklar') groupKey = 'aliskanliklar';
                if (groupKey) {
                    saveGroupItems(groupKey);
                }
            }

            /* Başlık ve Buton Etiketini Güncelle */
            if (viewName === _currentSection) {
                showSection(viewName);
            }
        }

        input.addEventListener('blur', finishRename);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
            if (e.key === 'Escape') {
                input.value = currentLabel;
                input.blur();
            }
        });
    }

    function saveCustomLabel(viewName, label) {
        try {
            var labels = JSON.parse(localStorage.getItem('sidebar_custom_labels') || '{}');
            labels[viewName] = label;
            localStorage.setItem('sidebar_custom_labels', JSON.stringify(labels));

            if (viewName.indexOf('_sub_') !== -1) {
                var subSections = JSON.parse(localStorage.getItem('sidebar_sub_sections') || '[]');
                subSections.forEach(function (sub) {
                    if (sub.id === viewName) {
                        sub.label = label;
                    }
                });
                localStorage.setItem('sidebar_sub_sections', JSON.stringify(subSections));
            }
        } catch (e) { }
    }

    function loadCustomLabels() {
        try {
            var labels = JSON.parse(localStorage.getItem('sidebar_custom_labels') || '{}');
            Object.keys(labels).forEach(function (viewName) {
                var navItem = document.querySelector('.sidebar-nav-item[data-view="' + viewName + '"]');
                if (navItem) {
                    var labelEl = navItem.querySelector('.nav-label');
                    if (labelEl) {
                        labelEl.textContent = labels[viewName];
                        navItem.setAttribute('data-tooltip', labels[viewName]);
                    }
                }
            });
        } catch (e) { }
    }

    /* === Yeni Sekmede Aç === */
    function openInNewTab(viewName) {
        var url = window.location.href.split('#')[0] + '#section=' + viewName;
        window.open(url, '_blank');
    }

    /* === Bildirim Sayısını Gizle/Göster === */
    function getBadgeHiddenState() {
        try {
            return JSON.parse(localStorage.getItem('sidebar_badge_hidden') || '{}');
        } catch (e) { return {}; }
    }

    function toggleBadgeVisibility(viewName) {
        var state = getBadgeHiddenState();
        state[viewName] = !state[viewName];
        try {
            localStorage.setItem('sidebar_badge_hidden', JSON.stringify(state));
        } catch (e) { }
        applyBadgeVisibility();
        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show(state[viewName] ? 'Öğe sayısı gizlendi' : 'Öğe sayısı gösteriliyor', 'success');
        }
    }

    function applyBadgeVisibility() {
        var state = getBadgeHiddenState();
        var viewToBadge = {
            messages: 'badge-messages', team: 'badge-team',
            reminders: 'badge-reminders', board: 'badge-board', notes: 'badge-notes',
            finance: 'badge-finance', home: 'badge-home'
        };
        Object.keys(viewToBadge).forEach(function (v) {
            var badgeEl = document.getElementById(viewToBadge[v]);
            if (badgeEl) {
                if (state[v]) {
                    badgeEl.setAttribute('data-badge-hidden', 'true');
                    badgeEl.style.display = 'none';
                } else {
                    badgeEl.removeAttribute('data-badge-hidden');
                }
            }
        });
    }

    /* === Gizle (Ayarlar entegrasyonu) === */
    function hideNavItem(viewName) {
        if (typeof Settings !== 'undefined' && Settings.getMenuLayout) {
            var layout = Settings.getMenuLayout();
            layout[viewName] = false;
            if (typeof Settings.applyMenuLayout === 'function') {
                /* Toggle'ı ayarlar'da güncelle */
                var toggle = document.getElementById('menu-toggle-' + viewName);
                if (toggle) toggle.checked = false;

                try {
                    localStorage.setItem('app_menu_layout', JSON.stringify(layout));
                } catch (e) { }
                Settings.applyMenuLayout();

                /* Eğer aktif bölüm gizlendiyse ilk açık bölüme geç */
                var currentSection = localStorage.getItem('app_current_section') || 'notes';
                if (currentSection === viewName) {
                    var sections = ['messages', 'reminders', 'notes', 'team', 'board', 'finance'];
                    var firstVisible = sections.find(function (s) { return layout[s] !== false; });
                    if (firstVisible) showSection(firstVisible);
                }
            }
        }
        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show('Bölüm gizlendi. Ayarlar → Menü Düzeni\'nden tekrar gösterebilirsiniz.', 'info');
        }
    }

    /* === Çöp Kutusuna Taşı Eylemi === */
    function moveToTrashAction(viewName) {
        if (!viewName) return;

        var navItem = document.querySelector('.sidebar-nav-item[data-view="' + viewName + '"]');
        var label = navItem ? navItem.querySelector('.nav-label').textContent.trim() : viewName;

        // 1. Çöp kutusu modülüne ekle
        if (typeof Trash !== 'undefined' && Trash.addToTrash) {
            var type = 'item';
            if (viewName.indexOf('_instance_') !== -1) {
                type = viewName.split('_instance_')[0];
            } else if (viewName === 'new-table' || viewName === 'aliskanlik') {
                type = viewName;
            } else if (viewName.indexOf('_sub_') !== -1) {
                type = 'sub_section';
            } else {
                type = 'sidebar_section';
            }

            var itemData = {
                id: viewName,
                label: label
            };

            if (type === 'new-table') {
                itemData.new_table_title = DB.getForUser('new_table_title_' + viewName) || '';
                itemData.new_table_html = DB.getForUser('new_table_html_' + viewName) || '';
            } else if (type === 'team') {
                var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
                if (user) {
                    var email = user.email;
                    itemData.notes_data = localStorage.getItem('user_notes_' + viewName + '_' + email) || '';
                }
            } else if (type === 'aliskanlik') {
                var keys = ['title', 'comments', 'creation_date', 'checked_days', 'properties', 'selected_color', 'updated_date'];
                keys.forEach(function(k) {
                    var val = DB.getForUser('aliskanlik_' + k + '_' + viewName);
                    if (val) itemData[k] = val;
                });
            } else if (type === 'sub_section') {
                var parentId = viewName.split('_sub_')[0];
                itemData.parentId = parentId;
                var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
                if (user) {
                    var email = user.email;
                    itemData.notes_data = localStorage.getItem('user_notes_' + viewName + '_' + email) || '';
                    itemData.finance_entries = localStorage.getItem('user_' + email + '_finance_entries_' + viewName) || '';
                    itemData.finance_recurring = localStorage.getItem('user_' + email + '_finance_recurring_' + viewName) || '';
                    itemData.board_columns = localStorage.getItem('board_columns_' + viewName + '_' + email) || '';
                    itemData.board_columns_sec = localStorage.getItem('board_columns_' + viewName + '_' + email + '_sec') || '';
                }
            }

            Trash.addToTrash(type, viewName, label, '', itemData);
        }

        // 2. Kenar çubuğundan kaldır veya gizle
        if (viewName.indexOf('_instance_') !== -1 || viewName === 'new-table' || viewName === 'aliskanlik') {
            if (navItem) navItem.remove();
            
            var groupKey = 'aliskanliklar';
            if (viewName.indexOf('new-table') !== -1 || viewName === 'new-table') {
                groupKey = 'tablolar';
            } else if (viewName.indexOf('team_instance_') === 0) {
                groupKey = 'workspace';
            } else if (viewName.indexOf('notes_instance_') === 0) {
                groupKey = 'main';
            }
            saveGroupItems(groupKey);
            saveNavOrder();

            if (viewName.indexOf('new-table') !== -1 || viewName === 'new-table') {
                localStorage.removeItem(DB.userKey('new_table_html_' + viewName));
                localStorage.removeItem(DB.userKey('new_table_title_' + viewName));
            } else if (viewName.indexOf('team_instance_') === 0 || viewName.indexOf('notes_instance_') === 0) {
                var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
                if (user) {
                    localStorage.removeItem('user_notes_' + viewName + '_' + user.email);
                }
            } else {
                var keys = ['title', 'comments', 'creation_date', 'checked_days', 'properties', 'selected_color', 'updated_date'];
                keys.forEach(function(k) {
                    localStorage.removeItem(DB.userKey('aliskanlik_' + k + '_' + viewName));
                });
            }

            var currentSection = localStorage.getItem('app_current_section');
            if (currentSection === viewName) {
                showSection('notes');
            }
        } else if (viewName.indexOf('_sub_') !== -1) {
            deleteSubSection(viewName, true);
        } else {
            hideNavItem(viewName);
        }
    }

    /* === Çöp Kutusundan Geri Yükleme Eylemi === */
    function restoreNavItem(viewName, type, label, data) {
        if (!viewName) return;

        // 1. Veriyi localStorage'a geri yaz
        if (type === 'new-table') {
            if (data) {
                DB.setForUser('new_table_title_' + viewName, data.new_table_title || '');
                DB.setForUser('new_table_html_' + viewName, data.new_table_html || '');
            }
        } else if (type === 'team') {
            var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
            if (user && data && data.notes_data) {
                localStorage.setItem('user_notes_' + viewName + '_' + user.email, data.notes_data);
            }

            var groupEl = document.getElementById('sidebar-nav-group-workspace');
            if (groupEl) {
                if (groupEl.classList.contains('group-collapsed')) {
                    groupEl.classList.remove('group-collapsed');
                    localStorage.setItem('sidebar_group_collapsed_workspace', 'false');
                }

                var iconHtml = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>';

                var div = document.createElement('div');
                div.className = 'sidebar-nav-item';
                div.setAttribute('data-view', viewName);
                div.setAttribute('data-view-type', 'notes');
                div.setAttribute('data-tooltip', label);
                div.setAttribute('data-default-label', 'Yeni Ekip');
                div.setAttribute('draggable', 'true');

                div.innerHTML =
                    '<div class="nav-icon-container">' +
                    '  <span class="nav-icon-original">' + iconHtml + '</span>' +
                    '</div>' +
                    '<span class="nav-label">' + label + '</span>' +
                    '<span class="sidebar-nav-badge" id="badge-' + viewName + '"></span>' +
                    '<span class="sidebar-nav-more-btn" onclick="App.showNavContextMenu(\'' + viewName + '\', event)">' +
                    '  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>' +
                    '</span>';

                var titleEl = groupEl.querySelector('.sidebar-nav-group-title');
                if (titleEl && titleEl.nextSibling) {
                    groupEl.insertBefore(div, titleEl.nextSibling);
                } else {
                    groupEl.appendChild(div);
                }

                setupNavigation();
                initDragAndDrop();

                saveGroupItems('workspace');
                saveNavOrder();

                showSection(viewName);
                return;
            }
        } else if (type === 'aliskanlik') {
            if (data) {
                var keys = ['title', 'comments', 'creation_date', 'checked_days', 'properties', 'selected_color', 'updated_date'];
                keys.forEach(function(k) {
                    if (data[k] !== undefined) {
                        DB.setForUser('aliskanlik_' + k + '_' + viewName, data[k]);
                    }
                });
            }
        } else if (type === 'sub_section') {
            // Restore sub-section configuration
            var parentId = data ? data.parentId : viewName.split('_sub_')[0];
            var subSections = [];
            try {
                subSections = JSON.parse(localStorage.getItem('sidebar_sub_sections') || '[]');
            } catch (e) {}
            
            // Check if already in list
            var exists = subSections.some(function(sub) { return sub.id === viewName; });
            if (!exists) {
                subSections.push({
                    id: viewName,
                    parentId: parentId,
                    label: label
                });
                localStorage.setItem('sidebar_sub_sections', JSON.stringify(subSections));
            }

            // Restore internal data
            var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
            if (user && data) {
                var email = user.email;
                if (data.notes_data) localStorage.setItem('user_notes_' + viewName + '_' + email, data.notes_data);
                if (data.finance_entries) localStorage.setItem('user_' + email + '_finance_entries_' + viewName, data.finance_entries);
                if (data.finance_recurring) localStorage.setItem('user_' + email + '_finance_recurring_' + viewName, data.finance_recurring);
                if (data.board_columns) localStorage.setItem('board_columns_' + viewName + '_' + email, data.board_columns);
                if (data.board_columns_sec) localStorage.setItem('board_columns_' + viewName + '_' + email + '_sec', data.board_columns_sec);
            }

            // Re-create DOM element
            var parentItem = document.querySelector('.sidebar-nav-item[data-view="' + parentId + '"]');
            if (parentItem) {
                parentItem.classList.add('has-sub-sections');
                
                // If it is collapsed, expand it
                localStorage.setItem('sidebar_collapsed_parent_' + parentId, 'false');
                parentItem.classList.remove('sub-collapsed');
                parentItem.classList.add('sub-expanded');

                // Recreate and append DOM
                var subDOM = createSubSectionDOM(viewName, parentId, label);
                if (subDOM && !document.querySelector('.sidebar-nav-item[data-view="' + viewName + '"]')) {
                    parentItem.parentNode.insertBefore(subDOM, parentItem.nextSibling);
                    repositionSubSections();
                }
            }

            setupNavigation();
            initDragAndDrop();
            
            // Go to restored sub section
            showSection(viewName);
            return;
        } else if (type === 'sidebar_section') {
            // Standard section - unhide it
            if (typeof Settings !== 'undefined' && Settings.getMenuLayout) {
                var layout = Settings.getMenuLayout();
                layout[viewName] = true;
                localStorage.setItem('app_menu_layout', JSON.stringify(layout));
                if (typeof Settings.applyMenuLayout === 'function') {
                    var toggle = document.getElementById('menu-toggle-' + viewName);
                    if (toggle) toggle.checked = true;
                    Settings.applyMenuLayout();
                }
            }
            showSection(viewName);
            return;
        }

        // 2. Re-create the sidebar navigation item DOM for dynamic sections
        var groupKey = (type === 'new-table') ? 'tablolar' : 'aliskanliklar';
        var groupMap = {
            'tablolar': 'sidebar-nav-group-tablolar',
            'aliskanliklar': 'sidebar-nav-group-aliskanliklar'
        };
        var groupId = groupMap[groupKey];
        if (!groupId) return;
        var groupEl = document.getElementById(groupId);
        if (!groupEl) return;

        // Grubu aç
        if (groupEl.classList.contains('group-collapsed')) {
            groupEl.classList.remove('group-collapsed');
            localStorage.setItem('sidebar_group_collapsed_' + groupKey, 'false');
        }

        var iconHtml = '';
        if (type === 'new-table') {
            iconHtml = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>';
        } else if (type === 'aliskanlik') {
            iconHtml = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
        }

        var div = document.createElement('div');
        div.className = 'sidebar-nav-item';
        div.setAttribute('data-view', viewName);
        div.setAttribute('data-view-type', type);
        div.setAttribute('data-tooltip', label);
        div.setAttribute('data-default-label', type === 'new-table' ? 'Yeni Tablo' : 'Yeni Alışkanlık');
        div.setAttribute('draggable', 'true');

        div.innerHTML =
            '<div class="nav-icon-container">' +
            '  <span class="nav-icon-original">' + iconHtml + '</span>' +
            '</div>' +
            '<span class="nav-label">' + label + '</span>' +
            '<span class="sidebar-nav-badge" id="badge-' + viewName + '"></span>' +
            '<span class="sidebar-nav-more-btn" onclick="App.showNavContextMenu(\'' + viewName + '\', event)">' +
            '  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>' +
            '</span>';

        // Add navigate click event
        div.addEventListener('click', function(e) {
            if (e.target.closest('.sidebar-nav-more-btn')) return;
            showSection(viewName);
        });

        // Insert at the top of the group after the group title
        var titleEl = groupEl.querySelector('.sidebar-nav-group-title');
        if (titleEl && titleEl.nextSibling) {
            groupEl.insertBefore(div, titleEl.nextSibling);
        } else {
            groupEl.appendChild(div);
        }

        setupNavigation();
        initDragAndDrop();

        saveGroupItems(groupKey);
        saveNavOrder();
        
        // Show reconstructed page
        showSection(viewName);
    }

    /* ========================================
       BAŞA SABİTLE & FAVORİLERE EKLE
       ======================================== */

    function getPinnedItems() {
        try {
            var items = JSON.parse(localStorage.getItem('sidebar_pinned') || '[]');
            return items.filter(function(id) { return id.indexOf('_sub_') === -1; });
        } catch (e) { return []; }
    }

    function getFavoriteItems() {
        try {
            var items = JSON.parse(localStorage.getItem('sidebar_favorites') || '[]');
            return items.filter(function(id) { return id.indexOf('_sub_') === -1; });
        } catch (e) { return []; }
    }

    function togglePinItem(viewName) {
        var pinned = getPinnedItems();
        var idx = pinned.indexOf(viewName);
        if (idx !== -1) {
            pinned.splice(idx, 1);
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show('Sabitleme kaldırıldı', 'success');
            }
        } else {
            pinned.push(viewName);
            /* Favorilerden çıkar (çift yer kaplamasın) */
            var favs = getFavoriteItems();
            var fi = favs.indexOf(viewName);
            if (fi !== -1) {
                favs.splice(fi, 1);
                try { localStorage.setItem('sidebar_favorites', JSON.stringify(favs)); } catch (e) { }
            }
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show('Başa sabitlendi', 'success');
            }
        }
        try { localStorage.setItem('sidebar_pinned', JSON.stringify(pinned)); } catch (e) { }
        renderPinnedAndFavorites();
    }

    function toggleFavoriteItem(viewName) {
        var favs = getFavoriteItems();
        var idx = favs.indexOf(viewName);
        if (idx !== -1) {
            favs.splice(idx, 1);
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show('Favorilerden çıkarıldı', 'success');
            }
        } else {
            favs.push(viewName);
            /* Sabitlenmişlerden çıkar (çift yer kaplamasın) */
            var pinned = getPinnedItems();
            var pi = pinned.indexOf(viewName);
            if (pi !== -1) {
                pinned.splice(pi, 1);
                try { localStorage.setItem('sidebar_pinned', JSON.stringify(pinned)); } catch (e) { }
            }
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show('Favorilere eklendi', 'success');
            }
        }
        try { localStorage.setItem('sidebar_favorites', JSON.stringify(favs)); } catch (e) { }
        renderPinnedAndFavorites();
    }

    var _defaultGroupMap = {
        home: 'main', finance: 'main', messages: 'main', reminders: 'main', notes: 'main',
        team: 'workspace', board: 'workspace'
    };

    /* Varsayılan sıralama */
    var _defaultOrder = {
        main: ['home', 'finance', 'messages', 'reminders', 'notes'],
        workspace: ['team', 'board']
    };

    /**
     * Bir öğeyi orijinal grubuna geri yerleştir.
     * Kayıtlı sıralamaya göre doğru pozisyona koyar.
     */
    function restoreItemToOriginalGroup(item) {
        var viewName = item.getAttribute('data-view');
        if (!viewName) return;

        var origGroupName = item.getAttribute('data-original-group') || _defaultGroupMap[viewName] || 'main';
        var groupId = 'sidebar-nav-group-' + origGroupName;
        var group = document.getElementById(groupId);
        if (!group) return;

        /* Kayıtlı sıralamayı al veya varsayılanı kullan */
        var savedOrder;
        try {
            var stored = localStorage.getItem('sidebar_nav_order_v3');
            savedOrder = stored ? JSON.parse(stored) : null;
        } catch (e) { savedOrder = null; }

        var orderList = (savedOrder && savedOrder[origGroupName]) || _defaultOrder[origGroupName] || [];
        var targetIdx = orderList.indexOf(viewName);

        /* Gruptaki mevcut nav item'ları al (title hariç) */
        var existingItems = group.querySelectorAll('.sidebar-nav-item');
        var inserted = false;

        for (var i = 0; i < existingItems.length; i++) {
            var existView = existingItems[i].getAttribute('data-view');
            var existIdx = orderList.indexOf(existView);
            if (existIdx > targetIdx) {
                group.insertBefore(item, existingItems[i]);
                inserted = true;
                break;
            }
        }

        if (!inserted) {
            group.appendChild(item);
        }

        /* data-original-group temizle */
        item.removeAttribute('data-original-group');
    }

    /**
     * Tüm sabitlenmiş ve favori öğeleri orijinal yerlerine geri koy,
     * sonra grupları yeniden oluştur.
     */
    function renderPinnedAndFavorites() {
        var sidebarNav = document.querySelector('.sidebar-nav');
        if (!sidebarNav) return;

        /* 1) Mevcut pinned gruptaki öğeleri geri yerleştir */
        var pinnedGroup = document.getElementById('sidebar-nav-group-pinned');
        if (pinnedGroup) {
            var pinnedItems = pinnedGroup.querySelectorAll('.sidebar-nav-item');
            for (var i = 0; i < pinnedItems.length; i++) {
                restoreItemToOriginalGroup(pinnedItems[i]);
            }
            pinnedGroup.remove();
        }

        /* 2) Mevcut favorites gruptaki öğeleri geri yerleştir */
        var favGroup = document.getElementById('sidebar-nav-group-favorites');
        if (favGroup) {
            var favItems = favGroup.querySelectorAll('.sidebar-nav-item');
            for (var j = 0; j < favItems.length; j++) {
                restoreItemToOriginalGroup(favItems[j]);
            }
            favGroup.remove();
        }

        /* 3) Pinned grubunu oluştur */
        var pinned = getPinnedItems();
        if (pinned.length > 0) {
            var pGroup = document.createElement('div');
            pGroup.className = 'sidebar-nav-group';
            pGroup.id = 'sidebar-nav-group-pinned';
            sidebarNav.insertBefore(pGroup, sidebarNav.firstChild);

            var pTitle = document.createElement('div');
            pTitle.className = 'sidebar-nav-group-title';
            pTitle.textContent = 'Sabitlenenler';
            pGroup.appendChild(pTitle);

            pinned.forEach(function (viewName) {
                var item = document.querySelector('.sidebar-nav-item[data-view="' + viewName + '"]');
                if (item) {
                    /* Orijinal grubu kaydet (henüz kaydedilmediyse) */
                    if (!item.getAttribute('data-original-group')) {
                        var parentGroup = item.closest('.sidebar-nav-group');
                        if (parentGroup) {
                            var gid = parentGroup.id.replace('sidebar-nav-group-', '');
                            item.setAttribute('data-original-group', gid);
                        }
                    }
                    pGroup.appendChild(item);
                }
            });
        }

        /* 4) Favorites grubunu oluştur */
        var favs = getFavoriteItems();
        if (favs.length > 0) {
            var fGroup = document.createElement('div');
            fGroup.className = 'sidebar-nav-group';
            fGroup.id = 'sidebar-nav-group-favorites';

            var wsGroup = document.getElementById('sidebar-nav-group-workspace');
            if (wsGroup && wsGroup.nextElementSibling) {
                sidebarNav.insertBefore(fGroup, wsGroup.nextElementSibling);
            } else {
                sidebarNav.appendChild(fGroup);
            }

            var fTitle = document.createElement('div');
            fTitle.className = 'sidebar-nav-group-title';
            fTitle.textContent = 'Favoriler';
            fGroup.appendChild(fTitle);

            favs.forEach(function (viewName) {
                var item = document.querySelector('.sidebar-nav-item[data-view="' + viewName + '"]');
                if (item) {
                    /* Orijinal grubu kaydet (henüz kaydedilmediyse) */
                    if (!item.getAttribute('data-original-group')) {
                        var parentGroup = item.closest('.sidebar-nav-group');
                        if (parentGroup) {
                            var gid = parentGroup.id.replace('sidebar-nav-group-', '');
                            item.setAttribute('data-original-group', gid);
                        }
                    }
                    fGroup.appendChild(item);
                }
            });
        }
        repositionSubSections();
    }

    function renderPinnedGroup() {
        renderPinnedAndFavorites();
    }

    function renderFavoritesGroup() {
        /* renderPinnedAndFavorites zaten her ikisini de işliyor,
           ama çift çağrıyı önlemek için flag kullan */
    }

    /* ========================================
       SÜRÜKLE-BIRAK (Drag & Drop) Sıralama
       ======================================== */
    var _dragItem = null;
    var _dragFromGroup = null;
    var _dragGroup = null;

    function initDragAndDrop() {
        var navItems = document.querySelectorAll('.sidebar-nav-item[draggable="true"]');
        var allowedGroups = [
            'sidebar-nav-group-main',
            'sidebar-nav-group-workspace',
            'sidebar-nav-group-tablolar',
            'sidebar-nav-group-aliskanliklar'
        ];

        navItems.forEach(function (item) {
            item.addEventListener('dragstart', function (e) {
                e.stopPropagation(); // Prevent parent group from starting to drag
                _dragItem = item;
                _dragFromGroup = item.closest('.sidebar-nav-group');
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', item.getAttribute('data-view'));
            });

            item.addEventListener('dragend', function () {
                item.classList.remove('dragging');
                clearAllDragIndicators();
                _dragItem = null;
                _dragFromGroup = null;
            });

            item.addEventListener('dragover', function (e) {
                e.preventDefault();
                if (!_dragItem || _dragItem === item) return;
                e.dataTransfer.dropEffect = 'move';

                clearAllDragIndicators();

                var dragViewId = _dragItem.getAttribute('data-view') || '';
                var targetViewId = item.getAttribute('data-view') || '';
                var isDragSub = dragViewId.indexOf('_sub_') !== -1;
                var isTargetSub = targetViewId.indexOf('_sub_') !== -1;
                var allowedParents = ['notes', 'finance', 'board'];
                var targetSupportsSub = allowedParents.indexOf(targetViewId) !== -1;

                var rect = item.getBoundingClientRect();
                var relY = e.clientY - rect.top;

                if (isDragSub && targetSupportsSub && !isTargetSub) {
                    // Dragging sub-section over parent-supporting main section: split into top 25%, bottom 25%, and middle 50% (inside)
                    if (relY < rect.height * 0.25) {
                        item.classList.add('drag-over-top');
                    } else if (relY > rect.height * 0.75) {
                        item.classList.add('drag-over-bottom');
                    } else {
                        item.classList.add('drag-over-center');
                    }
                } else {
                    // Split 50/50 for top/bottom drops (regular items or items not supporting sub-sections)
                    var midY = rect.top + rect.height / 2;
                    if (e.clientY < midY) {
                        item.classList.add('drag-over-top');
                    } else {
                        item.classList.add('drag-over-bottom');
                    }
                }
            });

            item.addEventListener('dragleave', function () {
                item.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-center');
            });

            item.addEventListener('drop', function (e) {
                e.preventDefault();
                if (!_dragItem || _dragItem === item) return;

                var targetGroup = item.closest('.sidebar-nav-group');
                var dragViewId = _dragItem.getAttribute('data-view') || '';
                var targetViewId = item.getAttribute('data-view') || '';
                var isDragSub = dragViewId.indexOf('_sub_') !== -1;

                if (item.classList.contains('drag-over-center') && isDragSub) {
                    // Drop directly ON the parent section -> Make it a sub-section
                    _dragItem.classList.add('sidebar-nav-sub-item');
                    _dragItem.setAttribute('data-parent-view', targetViewId);
                    // Insert right after the parent item in the DOM
                    targetGroup.insertBefore(_dragItem, item.nextElementSibling);
                } else if (item.classList.contains('drag-over-top')) {
                    // Drop above the item -> Make it a main section
                    if (isDragSub) {
                        _dragItem.classList.remove('sidebar-nav-sub-item');
                        _dragItem.removeAttribute('data-parent-view');
                    }
                    targetGroup.insertBefore(_dragItem, item);
                } else {
                    // Drop below the item -> Make it a main section
                    if (isDragSub) {
                        _dragItem.classList.remove('sidebar-nav-sub-item');
                        _dragItem.removeAttribute('data-parent-view');
                    }
                    targetGroup.insertBefore(_dragItem, item.nextElementSibling);
                }

                clearAllDragIndicators();
                rebuildNavStateFromDOM();
                setupNavigation(); /* Event listener'ları yeniden bağla */
            });
        });

        /* Grupları da drop hedefi olarak dinle (boş gruba bırakma veya grup sıralama) */
        var groups = document.querySelectorAll('.sidebar-nav-group');
        groups.forEach(function (group) {
            // Bind mousedown/touchstart to header to enable group dragging
            var header = group.querySelector('.sidebar-nav-group-title');
            if (header) {
                header.addEventListener('mousedown', function () {
                    _canDragGroup = true;
                });
                header.addEventListener('touchstart', function () {
                    _canDragGroup = true;
                }, { passive: true });
            }

            // Group drag start
            group.addEventListener('dragstart', function (e) {
                if (_canDragGroup && allowedGroups.indexOf(group.id) !== -1) {
                    _dragGroup = group;
                    group.classList.add('group-dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', group.id);
                } else {
                    e.preventDefault();
                }
                _canDragGroup = false;
            });

            group.addEventListener('dragend', function () {
                if (_dragGroup) {
                    _dragGroup.classList.remove('group-dragging');
                }
                clearAllDragIndicators();
                _dragGroup = null;
            });

            group.addEventListener('dragover', function (e) {
                e.preventDefault();
                if (_dragGroup) {
                    if (_dragGroup === group || allowedGroups.indexOf(group.id) === -1) return;
                    e.dataTransfer.dropEffect = 'move';
                    clearAllDragIndicators();

                    var rect = group.getBoundingClientRect();
                    var midY = rect.top + rect.height / 2;
                    if (e.clientY < midY) {
                        group.classList.add('drag-over-group-top');
                    } else {
                        group.classList.add('drag-over-group-bottom');
                    }
                } else if (_dragItem) {
                    e.dataTransfer.dropEffect = 'move';
                    var navItemsInGroup = group.querySelectorAll('.sidebar-nav-item');
                    var lastItem = navItemsInGroup[navItemsInGroup.length - 1];
                    if (!lastItem || (e.target === group && !e.target.closest('.sidebar-nav-item'))) {
                        group.classList.add('drag-over-group');
                    }
                }
            });

            group.addEventListener('dragleave', function (e) {
                if (_dragGroup) {
                    group.classList.remove('drag-over-group-top', 'drag-over-group-bottom');
                } else if (!group.contains(e.relatedTarget)) {
                    group.classList.remove('drag-over-group');
                }
            });

            group.addEventListener('drop', function (e) {
                if (_dragGroup) {
                    e.preventDefault();
                    if (_dragGroup === group || allowedGroups.indexOf(group.id) === -1) return;

                    var parentContainer = group.parentNode;
                    if (!parentContainer) return;

                    if (group.classList.contains('drag-over-group-top')) {
                        parentContainer.insertBefore(_dragGroup, group);
                    } else if (group.classList.contains('drag-over-group-bottom')) {
                        parentContainer.insertBefore(_dragGroup, group.nextElementSibling);
                    }

                    clearAllDragIndicators();
                    saveGroupsOrder();
                    rebuildNavStateFromDOM();
                    setupNavigation();
                    renderPinnedAndFavorites();
                } else if (_dragItem) {
                    if (e.target.closest('.sidebar-nav-item')) return; /* Item drop'u zaten handle edildi */
                    e.preventDefault();

                    var dragViewId = _dragItem.getAttribute('data-view') || '';
                    var isDragSub = dragViewId.indexOf('_sub_') !== -1;
                    if (isDragSub) {
                        _dragItem.classList.remove('sidebar-nav-sub-item');
                        _dragItem.removeAttribute('data-parent-view');
                    }

                    group.appendChild(_dragItem);
                    clearAllDragIndicators();
                    rebuildNavStateFromDOM();
                    setupNavigation();
                }
            });
        });
    }

    function clearAllDragIndicators() {
        document.querySelectorAll('.drag-over-top, .drag-over-bottom, .drag-over-center').forEach(function (el) {
            el.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-center');
        });
        document.querySelectorAll('.drag-over-group, .drag-over-group-top, .drag-over-group-bottom').forEach(function (el) {
            el.classList.remove('drag-over-group', 'drag-over-group-top', 'drag-over-group-bottom');
        });
    }

    
    function rebuildNavStateFromDOM() {
        try {
            var subSections = JSON.parse(localStorage.getItem('sidebar_sub_sections') || '[]');
            var order = { main: [], workspace: [], tablolar: [], aliskanliklar: [] };
            
            var subMap = {};
            subSections.forEach(function(sub) {
                subMap[sub.id] = sub;
            });

            var groups = [
                { id: 'sidebar-nav-group-main', key: 'main' },
                { id: 'sidebar-nav-group-workspace', key: 'workspace' },
                { id: 'sidebar-nav-group-tablolar', key: 'tablolar' },
                { id: 'sidebar-nav-group-aliskanliklar', key: 'aliskanliklar' }
            ];

            groups.forEach(function(groupInfo) {
                var groupEl = document.getElementById(groupInfo.id);
                if (!groupEl) return;

                var currentParentId = null;
                var allowedParents = ['notes', 'finance', 'board'];

                var items = groupEl.querySelectorAll('.sidebar-nav-item');
                items.forEach(function(item) {
                    var viewId = item.getAttribute('data-view');
                    if (!viewId) return;

                    var isSubSection = viewId.indexOf('_sub_') !== -1;
                    var hasSubClass = item.classList.contains('sidebar-nav-sub-item');

                    if (isSubSection && hasSubClass && currentParentId) {
                        // It's a nested sub-section
                        var subObj = subMap[viewId];
                        if (subObj) {
                            subObj.parentId = currentParentId;
                            item.setAttribute('data-parent-view', currentParentId);
                        }
                    } else {
                        // It's a root-level section (either normal main section or promoted sub-section)
                        if (!isSubSection) {
                            if (allowedParents.indexOf(viewId) !== -1) {
                                currentParentId = viewId;
                            } else {
                                currentParentId = null;
                            }
                            order[groupInfo.key].push(viewId);
                        } else {
                            // Sub-section acting as main section
                            var subObj = subMap[viewId];
                            if (subObj) {
                                subObj.parentId = null;
                            }
                            item.classList.remove('sidebar-nav-sub-item');
                            item.removeAttribute('data-parent-view');
                            currentParentId = null;
                            order[groupInfo.key].push(viewId);
                        }
                    }
                });
            });

            localStorage.setItem('sidebar_sub_sections', JSON.stringify(subSections));
            localStorage.setItem('sidebar_nav_order_v3', JSON.stringify(order));

            updateParentStates(subSections);

        } catch (e) {
            console.error('rebuildNavStateFromDOM error:', e);
        }
    }


    function saveGroupsOrder() {
        try {
            var navContainer = document.querySelector('.sidebar-nav');
            if (!navContainer) return;
            var groups = navContainer.querySelectorAll('.sidebar-nav-group');
            var groupIds = [];
            groups.forEach(function (group) {
                if (group.id && group.id.indexOf('sidebar-nav-group-') === 0 && group.id !== 'sidebar-nav-group-pinned' && group.id !== 'sidebar-nav-group-favorites') {
                    groupIds.push(group.id);
                }
            });
            localStorage.setItem('sidebar_groups_order', JSON.stringify(groupIds));
        } catch (e) {
            console.error('saveGroupsOrder error:', e);
        }
    }

    function loadGroupsOrder() {
        try {
            var stored = localStorage.getItem('sidebar_groups_order');
            if (!stored) return;
            var groupIds = JSON.parse(stored);
            var navContainer = document.querySelector('.sidebar-nav');
            if (!navContainer) return;
            groupIds.forEach(function (id) {
                var groupEl = document.getElementById(id);
                if (groupEl) {
                    navContainer.appendChild(groupEl);
                }
            });
        } catch (e) {
            console.error('loadGroupsOrder error:', e);
        }
    }

    /* Sıralamayı kaydet */
    function saveNavOrder() {
        var order = { main: [], workspace: [], tablolar: [], aliskanliklar: [] };
        var mainGroup = document.getElementById('sidebar-nav-group-main');
        var wsGroup = document.getElementById('sidebar-nav-group-workspace');
        var tabGroup = document.getElementById('sidebar-nav-group-tablolar');
        var alGroup = document.getElementById('sidebar-nav-group-aliskanliklar');

        if (mainGroup) {
            mainGroup.querySelectorAll('.sidebar-nav-item:not(.sidebar-nav-sub-item)').forEach(function (item) {
                order.main.push(item.getAttribute('data-view'));
            });
        }
        if (wsGroup) {
            wsGroup.querySelectorAll('.sidebar-nav-item:not(.sidebar-nav-sub-item)').forEach(function (item) {
                order.workspace.push(item.getAttribute('data-view'));
            });
        }
        if (tabGroup) {
            tabGroup.querySelectorAll('.sidebar-nav-item:not(.sidebar-nav-sub-item)').forEach(function (item) {
                order.tablolar.push(item.getAttribute('data-view'));
            });
        }
        if (alGroup) {
            alGroup.querySelectorAll('.sidebar-nav-item:not(.sidebar-nav-sub-item)').forEach(function (item) {
                order.aliskanliklar.push(item.getAttribute('data-view'));
            });
        }

        /* Pinned/Favorites'teki öğeleri de orijinal gruplarına dahil et */
        var movedItems = document.querySelectorAll('.sidebar-nav-item[data-original-group]');
        movedItems.forEach(function (item) {
            var viewName = item.getAttribute('data-view');
            var origGroup = item.getAttribute('data-original-group');
            if (origGroup === 'main' && order.main.indexOf(viewName) === -1) {
                order.main.push(viewName);
            } else if (origGroup === 'workspace' && order.workspace.indexOf(viewName) === -1) {
                order.workspace.push(viewName);
            } else if (origGroup === 'tablolar' && order.tablolar.indexOf(viewName) === -1) {
                order.tablolar.push(viewName);
            } else if (origGroup === 'aliskanliklar' && order.aliskanliklar.indexOf(viewName) === -1) {
                order.aliskanliklar.push(viewName);
            }
        });

        try {
            localStorage.setItem('sidebar_nav_order_v3', JSON.stringify(order));
        } catch (e) { }
    }

    /* Kaydedilmiş sıralamayı uygula */
    function loadNavOrder() {
        try {
            var stored = localStorage.getItem('sidebar_nav_order_v3');
            if (!stored) return;
            var order = JSON.parse(stored);


            var mainGroup = document.getElementById('sidebar-nav-group-main');
            var wsGroup = document.getElementById('sidebar-nav-group-workspace');
            var tabGroup = document.getElementById('sidebar-nav-group-tablolar');
            var alGroup = document.getElementById('sidebar-nav-group-aliskanliklar');
            if (!mainGroup || !wsGroup) return;

            /* Tüm nav item'ları topla (alt bölümler hariç) */
            var allItems = {};
            document.querySelectorAll('.sidebar-nav-item:not(.sidebar-nav-sub-item)').forEach(function (item) {
                allItems[item.getAttribute('data-view')] = item;
            });

            /* Ana gruba yerleştir */
            if (order.main && order.main.length > 0) {
                order.main.forEach(function (viewName) {
                    if (allItems[viewName]) {
                        mainGroup.appendChild(allItems[viewName]);
                        delete allItems[viewName];
                    }
                });
            }

            /* Workspace grubuna yerleştir (title'dan sonra) */
            if (order.workspace && order.workspace.length > 0) {
                order.workspace.forEach(function (viewName) {
                    if (allItems[viewName]) {
                        wsGroup.appendChild(allItems[viewName]);
                        delete allItems[viewName];
                    }
                });
            }

            /* Tablolar grubuna yerleştir */
            if (order.tablolar && order.tablolar.length > 0 && tabGroup) {
                order.tablolar.forEach(function (viewName) {
                    if (allItems[viewName]) {
                        tabGroup.appendChild(allItems[viewName]);
                        delete allItems[viewName];
                    }
                });
            }

            /* Alışkanlıklar grubuna yerleştir */
            if (order.aliskanliklar && order.aliskanliklar.length > 0 && alGroup) {
                order.aliskanliklar.forEach(function (viewName) {
                    if (allItems[viewName]) {
                        alGroup.appendChild(allItems[viewName]);
                        delete allItems[viewName];
                    }
                });
            }

            /* Kalan item'ları (yeni eklenmiş olabilir) uygun gruba ekle */
            Object.keys(allItems).forEach(function (viewName) {
                if (viewName === 'new-table' && tabGroup) {
                    tabGroup.appendChild(allItems[viewName]);
                } else {
                    wsGroup.appendChild(allItems[viewName]);
                }
            });
            repositionSubSections();
        } catch (e) { }
    }

    /* ========================================
       URL HASH İLE BÖLÜM AÇMA (Yeni Sekmede)
       ======================================== */
    function checkUrlHash() {
        var hash = window.location.hash;
        if (hash && hash.indexOf('#section=') === 0) {
            var section = hash.replace('#section=', '');
            if (section) {
                setTimeout(function () {
                    showSection(section);
                }, 300);
            }
        }
    }

    /* ========================================
       setBadge — Badge gizleme entegrasyonu
       ======================================== */
    var _origSetBadge = setBadge;
    function setBadgeWithVisibility(id, count, state) {
        _origSetBadge(id, count, state);
        /* Badge gizlenmiş mi kontrol et */
        var hiddenState = getBadgeHiddenState();
         

        var viewMap = {
            'badge-messages': 'messages', 'badge-team': 'team',
            'badge-reminders': 'reminders', 'badge-board': 'board', 'badge-notes': 'notes',
            'badge-finance': 'finance', 'badge-home': 'home'
        };
        var viewName = viewMap[id];
        if (viewName && hiddenState[viewName]) {
            var el = document.getElementById(id);
            if (el) el.style.display = 'none';
        }
    }
    setBadge = setBadgeWithVisibility;


    /* ========================================
       ALT BÖLÜM VE İKON DEĞİŞTİRME YÖNETİMİ (ADDED BY ANTIGRAVITY)
       ======================================== */
    var activeSubSection = {
        notes: null,
        finance: null,
        board: null
    };



    var _activeEmojiSubId = null;
    var _tempSelectedIcon = null;

    function loadSubSections() {
        try {
            var subSections = JSON.parse(localStorage.getItem('sidebar_sub_sections') || '[]');
            subSections.forEach(function (sub) {
                if (!document.querySelector('.sidebar-nav-item[data-view="' + sub.id + '"]')) {
                    if (sub.parentId) {
                        var parentItem = document.querySelector('.sidebar-nav-item[data-view="' + sub.parentId + '"]');
                        if (parentItem) {
                            var subDOM = createSubSectionDOM(sub.id, sub.parentId, sub.label);
                            if (subDOM) {
                                parentItem.parentNode.insertBefore(subDOM, parentItem.nextSibling);
                            }
                        }
                    } else {
                        // Promoted sub-section (main section)
                        var subDOM = createSubSectionDOM(sub.id, null, sub.label);
                        if (subDOM) {
                            var isWorkspace = sub.id.startsWith('board_') || sub.id.startsWith('team_');
                            var groupEl = document.getElementById(isWorkspace ? 'sidebar-nav-group-workspace' : 'sidebar-nav-group-main');
                            if (groupEl) {
                                groupEl.appendChild(subDOM);
                            }
                        }
                    }
                }
            });

            updateParentStates(subSections);
            repositionSubSections();
        } catch (e) {
            console.error('[NoteDay] loadSubSections hatası:', e);
        }
    }

    function updateParentStates(subSections) {
        if (!subSections) {
            try {
                subSections = JSON.parse(localStorage.getItem('sidebar_sub_sections') || '[]');
            } catch (e) {
                subSections = [];
            }
        }
        var parentCounts = { notes: 0, finance: 0, board: 0 };
        subSections.forEach(function (sub) {
            if (sub.parentId && parentCounts[sub.parentId] !== undefined) {
                parentCounts[sub.parentId]++;
            }
        });

        ['notes', 'finance', 'board'].forEach(function(parentId) {
            var parentItem = document.querySelector('.sidebar-nav-item[data-view="' + parentId + '"]');
            if (parentItem) {
                if (parentCounts[parentId] > 0) {
                    parentItem.classList.add('has-sub-sections');
                } else {
                    parentItem.classList.remove('has-sub-sections');
                }

                var collapsed = localStorage.getItem('sidebar_collapsed_parent_' + parentId) === 'true';
                if (collapsed) {
                    parentItem.classList.remove('sub-expanded');
                    parentItem.classList.add('sub-collapsed');
                    var subItems = document.querySelectorAll('.sidebar-nav-sub-item[data-parent-view="' + parentId + '"]');
                    subItems.forEach(function(subItem) {
                        subItem.style.display = 'none';
                    });
                } else {
                    parentItem.classList.remove('sub-collapsed');
                    parentItem.classList.add('sub-expanded');
                    var subItems = document.querySelectorAll('.sidebar-nav-sub-item[data-parent-view="' + parentId + '"]');
                    subItems.forEach(function(subItem) {
                        subItem.style.display = 'flex';
                    });
                }
            }
        });
    }

    function createSubSectionDOM(id, parentId, label) {
        var lookupParentId = parentId || id.split('_sub_')[0];
        var parentItem = document.querySelector('.sidebar-nav-item[data-view="' + lookupParentId + '"]');


        var div = document.createElement('div');
        div.className = parentId ? 'sidebar-nav-item sidebar-nav-sub-item' : 'sidebar-nav-item';
        div.setAttribute('data-view', id);
        if (parentId) {
            div.setAttribute('data-parent-view', parentId);
        }
        div.setAttribute('data-tooltip', label);
        div.setAttribute('data-default-label', 'Alt Bölüm');
        div.setAttribute('draggable', 'true');

        var iconHtml = '';
        if (parentItem) {
            var origIconOriginal = parentItem.querySelector('.nav-icon-original');
            var origIconOriginalSvg = parentItem.querySelector('.nav-icon-original svg');
            var origIconImg = parentItem.querySelector('.diary-icon-img, .sidebar-nav-icon-img');
            var firstSvg = parentItem.querySelector('svg');
            
            if (origIconOriginalSvg) {
                iconHtml = origIconOriginalSvg.outerHTML;
            } else if (origIconImg) {
                iconHtml = origIconImg.outerHTML;
            } else if (origIconOriginal) {
                iconHtml = origIconOriginal.innerHTML;
            } else if (firstSvg) {
                iconHtml = firstSvg.outerHTML;
            } else {
                iconHtml = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" /><path d="M14 3v4a2 2 0 0 0 2 2h4" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></svg>';
            }
        } else {
            // Default fallback icon for promoted sub-sections
            iconHtml = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" /><path d="M14 3v4a2 2 0 0 0 2 2h4" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></svg>';
        }

        div.innerHTML = 
            iconHtml +
            '<span class="nav-label">' + label + '</span>' +
            '<span class="sidebar-nav-badge" id="badge-' + id + '" style="display:none;"></span>' +
            '<span class="sidebar-nav-more-btn" onclick="App.showNavContextMenu(\'' + id + '\', event)">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>' +
            '</span>';

        // Add navigate click event
        div.addEventListener('click', function(e) {
            if (e.target.closest('.sidebar-nav-more-btn')) return;
            showSection(id);
        });
        div.classList.add('nav-listener-added');

        return div;
    }

    function repositionSubSections() {
        try {
            var subSections = JSON.parse(localStorage.getItem('sidebar_sub_sections') || '[]');
            var lastInserted = {};
            subSections.forEach(function (sub) {
                var parentItem = document.querySelector('.sidebar-nav-item[data-view="' + sub.parentId + '"]');
                var subItem = document.querySelector('.sidebar-nav-item[data-view="' + sub.id + '"]');
                if (parentItem && subItem) {
                    var referenceNode = lastInserted[sub.parentId] || parentItem;
                    referenceNode.parentNode.insertBefore(subItem, referenceNode.nextSibling);
                    lastInserted[sub.parentId] = subItem;
                }
            });
        } catch (e) {}
    }

    function createSubSection(parentView, targetIndex, autoShow) {
        var subId = parentView + '_sub_' + Date.now();
        var defaultLabel = 'Yeni Alt Bölüm';

        var subSections = [];
        try {
            subSections = JSON.parse(localStorage.getItem('sidebar_sub_sections') || '[]');
        } catch (e) {}

        var newSub = {
            id: subId,
            parentId: parentView,
            label: defaultLabel
        };

        if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= subSections.length) {
            subSections.splice(targetIndex, 0, newSub);
        } else {
            subSections.push(newSub);
        }

        try {
            localStorage.setItem('sidebar_sub_sections', JSON.stringify(subSections));
        } catch (e) {}

        // Make sure parent is expanded
        localStorage.setItem('sidebar_collapsed_parent_' + parentView, 'false');
        var parentItem = document.querySelector('.sidebar-nav-item[data-view="' + parentView + '"]');
        if (parentItem) {
            parentItem.classList.add('has-sub-sections');
            parentItem.classList.remove('sub-collapsed');
            parentItem.classList.add('sub-expanded');
        }

        var subDOM = createSubSectionDOM(subId, parentView, defaultLabel);
        if (subDOM) {
            var subItems = document.querySelectorAll('.sidebar-nav-sub-item[data-parent-view="' + parentView + '"]');
            subItems.forEach(function(item) {
                item.style.display = 'flex';
            });

            parentItem.parentNode.insertBefore(subDOM, parentItem.nextSibling);
            repositionSubSections();

            setupNavigation();
            initDragAndDrop();

            if (autoShow) {
                showSection(subId);
            } else {
                renameNavItem(subId);
            }
        }
    }

    function deleteSubSection(subId, silent) {
        if (!silent) {
            if (!confirm('Bu alt bölümü ve içindeki tüm verileri silmek istediğinize emin misiniz?')) {
                return;
            }
        }

        try {
            var subSections = JSON.parse(localStorage.getItem('sidebar_sub_sections') || '[]');
            subSections = subSections.filter(function (sub) { return sub.id !== subId; });
            localStorage.setItem('sidebar_sub_sections', JSON.stringify(subSections));
        } catch (e) {}

        try {
            var labels = JSON.parse(localStorage.getItem('sidebar_custom_labels') || '{}');
            delete labels[subId];
            localStorage.setItem('sidebar_custom_labels', JSON.stringify(labels));
        } catch (e) {}

        // Clean icon
        localStorage.removeItem('sidebar_sub_icon_' + subId);

        var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
        if (user) {
            var email = user.email;
            localStorage.removeItem('user_notes_' + subId + '_' + email);
            localStorage.removeItem('user_' + email + '_finance_entries_' + subId);
            localStorage.removeItem('user_' + email + '_finance_recurring_' + subId);
            localStorage.removeItem('board_columns_' + subId + '_' + email);
            localStorage.removeItem('board_columns_' + subId + '_' + email + '_sec');
        }

        var navItem = document.querySelector('.sidebar-nav-item[data-view="' + subId + '"]');
        if (navItem) {
            navItem.remove();
        }

        var parentView = subId.split('_sub_')[0];
        var remainingSubSections = JSON.parse(localStorage.getItem('sidebar_sub_sections') || '[]');
        var remaining = remainingSubSections.filter(function(sub) { return sub.parentId === parentView; }).length;
        var parentItem = document.querySelector('.sidebar-nav-item[data-view="' + parentView + '"]');
        if (parentItem && remaining === 0) {
            parentItem.classList.remove('has-sub-sections');
            parentItem.classList.remove('sub-expanded');
            parentItem.classList.remove('sub-collapsed');
        }

        var currentSection = localStorage.getItem('app_current_section');
        if (currentSection === subId) {
            showSection(parentView);
        }
    }

    function toggleParentExpand(parentId, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        var parentItem = document.querySelector('.sidebar-nav-item[data-view="' + parentId + '"]');
        if (!parentItem) return;

        var collapsed = parentItem.classList.contains('sub-expanded');
        localStorage.setItem('sidebar_collapsed_parent_' + parentId, collapsed ? 'true' : 'false');

        if (collapsed) {
            parentItem.classList.remove('sub-expanded');
            parentItem.classList.add('sub-collapsed');
            var subItems = document.querySelectorAll('.sidebar-nav-sub-item[data-parent-view="' + parentId + '"]');
            subItems.forEach(function(item) {
                item.style.display = 'none';
            });
        } else {
            parentItem.classList.remove('sub-collapsed');
            parentItem.classList.add('sub-expanded');
            var subItems = document.querySelectorAll('.sidebar-nav-sub-item[data-parent-view="' + parentId + '"]');
            subItems.forEach(function(item) {
                item.style.display = 'flex';
            });
        }
    }
    function toggleHeaderDropdown(e) {
        if (e) e.stopPropagation();
        var dropdown = document.getElementById('header-section-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }

    function populateHeaderDropdown(sectionName) {
        var listContainer = document.getElementById('header-section-dropdown-list');
        if (!listContainer) return;

        var html = '';

        if (sectionName === 'notes') {
            var notes = (typeof Notes !== 'undefined' && Notes.getNotes) ? Notes.getNotes() : [];
            if (notes.length === 0) {
                html = '<div class="header-section-dropdown-item" style="color:var(--color-text-muted);pointer-events:none;">Kayıt yok</div>';
            } else {
                notes.forEach(function (note) {
                    var title = (note.title || 'Adsız Not').trim();
                    html += '<div class="header-section-dropdown-item" onclick="Notes.openDetail(\'' + note.id + '\'); document.getElementById(\'header-section-dropdown\').classList.remove(\'active\');">' +
                            '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;">' + title + '</span>' +
                            '</div>';
                });
            }
        } else if (sectionName === 'team') {
            var teams = (typeof Team !== 'undefined' && Team.getTeams) ? Team.getTeams() : [];
            var html = '';
            
            // Add goBack option for Team list
            html += '<div class="header-section-dropdown-item" onclick="Team.goBack(); document.getElementById(\'header-section-dropdown\').classList.remove(\'active\');" style="border-bottom: 1px solid var(--color-border-subtle, rgba(0,0,0,0.06)); font-weight: 500; color: var(--color-accent, #6366f1);">' +
                    '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;">Tüm Ekipler</span>' +
                    '</div>';

            if (teams.length === 0) {
                html += '<div class="header-section-dropdown-item" style="color:var(--color-text-muted);pointer-events:none;">Ekip yok</div>';
            } else {
                teams.forEach(function (team) {
                    var name = (team.name || 'Adsız Ekip').trim();
                    html += '<div class="header-section-dropdown-item" onclick="Team.openTeam(\'' + team.id + '\'); document.getElementById(\'header-section-dropdown\').classList.remove(\'active\');">' +
                            '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;">' + name + '</span>' +
                            '</div>';
                });
            }
        }

        listContainer.innerHTML = html;
    }

    function updateHeaderActiveItem(title) {
        var triggerLabel = document.querySelector('.header-section-dropdown-trigger');
        var separator = document.getElementById('header-breadcrumb-separator');
        var wrapper = document.getElementById('header-breadcrumb-dropdown-wrapper');
        
        var defaultPlaceholders = [
            'Günlük Başlıkları',
            'Not Başlıkları',
            'Ekiplerin İsimleri',
            'Ekipler'
        ];
        
        var shouldHide = !title || defaultPlaceholders.indexOf(title) !== -1;
        
        if (separator && wrapper) {
            if (shouldHide) {
                separator.style.setProperty('display', 'none', 'important');
                wrapper.style.setProperty('display', 'none', 'important');
            } else {
                separator.style.setProperty('display', 'inline', 'important');
                wrapper.style.setProperty('display', 'inline-block', 'important');
            }
        }
        
        if (triggerLabel) {
            triggerLabel.innerHTML = (title || '') + ' <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left:2px;"><polyline points="6 9 12 15 18 9"/></svg>';
        }
    }

    /* === Grup Başlığı Açma/Kapama (Collapse/Expand) === */
    function toggleGroupCollapse(groupKey, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        var groupMap = {
            'main': 'sidebar-nav-group-main',
            'workspace': 'sidebar-nav-group-workspace',
            'tablolar': 'sidebar-nav-group-tablolar',
            'aliskanliklar': 'sidebar-nav-group-aliskanliklar'
        };

        var groupId = groupMap[groupKey];
        if (!groupId) return;

        var groupEl = document.getElementById(groupId);
        if (!groupEl) return;

        var isCollapsed = groupEl.classList.contains('group-collapsed');

        if (isCollapsed) {
            groupEl.classList.remove('group-collapsed');
            localStorage.setItem('sidebar_group_collapsed_' + groupKey, 'false');
        } else {
            groupEl.classList.add('group-collapsed');
            localStorage.setItem('sidebar_group_collapsed_' + groupKey, 'true');
        }
    }

    /* Kaydedilmiş grup collapse durumlarını uygula */
    function loadGroupCollapseStates() {
        var groups = ['main', 'workspace', 'tablolar', 'aliskanliklar'];
        var groupMap = {
            'main': 'sidebar-nav-group-main',
            'workspace': 'sidebar-nav-group-workspace',
            'tablolar': 'sidebar-nav-group-tablolar',
            'aliskanliklar': 'sidebar-nav-group-aliskanliklar'
        };

        groups.forEach(function(key) {
            var collapsed = localStorage.getItem('sidebar_group_collapsed_' + key) === 'true';
            if (collapsed) {
                var groupEl = document.getElementById(groupMap[key]);
                if (groupEl) {
                    groupEl.classList.add('group-collapsed');
                }
            }
        });
    }

    function showGroupAddDropdown(groupKey, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        
        var existing = document.getElementById('group-add-dropdown');
        if (existing) {
            existing.remove();
        }
        
        var triggerBtn = event.currentTarget || event.target;
        var rect = triggerBtn.getBoundingClientRect();
        
        var dropdown = document.createElement('div');
        dropdown.id = 'group-add-dropdown';
        dropdown.className = 'comment-dropdown';
        dropdown.style.display = 'block';
        dropdown.style.position = 'fixed';
        dropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
        dropdown.style.left = (rect.left + window.scrollX - 120) + 'px';
        dropdown.style.zIndex = '999999';
        dropdown.style.width = '160px';
        
        var newItemLabel = "";
        var addAction = "";
        if (groupKey === 'main') {
            newItemLabel = "Yeni not";
            addAction = "App.handleGroupAdd('main')";
        } else if (groupKey === 'workspace') {
            newItemLabel = "Yeni ekip";
            addAction = "App.handleGroupAdd('workspace')";
        } else if (groupKey === 'tablolar') {
            newItemLabel = "Yeni tablo";
            addAction = "App.handleGroupAdd('tablolar')";
        } else if (groupKey === 'aliskanliklar') {
            newItemLabel = "Yeni alışkanlık";
            addAction = "App.handleGroupAdd('aliskanliklar')";
        }
        
        dropdown.innerHTML = 
            '<div class="comment-dropdown-item" onclick="App.handleRenameGroup(\'' + groupKey + '\')">' +
            '  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>' +
            '  <span>Yeniden adlandır</span>' +
            '</div>' +
            '<div class="comment-dropdown-item" onclick="' + addAction + '">' +
            '  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
            '  <span>' + newItemLabel + '</span>' +
            '</div>';
            
        document.body.appendChild(dropdown);
        
        var closeHandler = function() {
            dropdown.remove();
            document.removeEventListener('click', closeHandler);
        };
        setTimeout(function() {
            document.addEventListener('click', closeHandler);
        }, 0);
    }

    function handleRenameGroup(groupKey) {
        var groupMap = {
            'main': 'sidebar-nav-group-main',
            'workspace': 'sidebar-nav-group-workspace',
            'tablolar': 'sidebar-nav-group-tablolar',
            'aliskanliklar': 'sidebar-nav-group-aliskanliklar'
        };
        var groupEl = document.getElementById(groupMap[groupKey]);
        if (!groupEl) return;
        var titleTextEl = groupEl.querySelector('.group-title-text');
        var currentTitle = titleTextEl ? titleTextEl.textContent.trim() : "";
        
        var newTitle = prompt('Grup başlığını yeniden adlandırın:', currentTitle);
        if (newTitle !== null && newTitle.trim()) {
            newTitle = newTitle.trim();
            if (titleTextEl) titleTextEl.textContent = newTitle;
            localStorage.setItem('sidebar_group_title_' + groupKey, newTitle);
        }
    }

    function handleNewNoteFromGroup() {
        showSection('notes');
        setTimeout(function() {
            if (typeof Notes !== 'undefined' && Notes.openModal) {
                Notes.openModal();
            }
        }, 50);
    }

    function loadGroupTitles() {
        var groups = ['main', 'workspace', 'tablolar', 'aliskanliklar'];
        var groupMap = {
            'main': 'sidebar-nav-group-main',
            'workspace': 'sidebar-nav-group-workspace',
            'tablolar': 'sidebar-nav-group-tablolar',
            'aliskanliklar': 'sidebar-nav-group-aliskanliklar'
        };
        groups.forEach(function(key) {
            var title = localStorage.getItem('sidebar_group_title_' + key);
            if (title) {
                var groupEl = document.getElementById(groupMap[key]);
                if (groupEl) {
                    var titleTextEl = groupEl.querySelector('.group-title-text');
                    if (titleTextEl) {
                        titleTextEl.textContent = title;
                    }
                }
            }
        });
    }

    /* === Grup + Buton İşlemleri === */
    function handleGroupAdd(groupKey, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        switch (groupKey) {
            case 'workspace':
                if (typeof TeamCustomizer !== 'undefined') {
                    TeamCustomizer.open();
                } else {
                    var teamName = prompt('Lütfen yeni ekip ismini girin:');
                    if (teamName && teamName.trim()) {
                        addNewGroupItem('workspace', 'notes', teamName.trim());
                    }
                }
                break;
            case 'tablolar':
                // Tablolar: Yeni tablo öğesi oluştur
                addNewGroupItem('tablolar', 'new-table', 'Yeni Tablo');
                break;
            case 'aliskanliklar':
                // Alışkanlıklar: Yeni alışkanlık öğesi oluştur
                addNewGroupItem('aliskanliklar', 'aliskanlik', 'Yeni Alışkanlık');
                break;
            case 'main':
                addNewGroupItem('main', 'notes', 'Yeni not');
                break;
            default:
                break;
        }
    }

    /* Tablolar, Alışkanlıklar ve Çalışma Alanı grubuna yeni sidebar item ekle */
    function addNewGroupItem(groupKey, viewType, defaultLabel) {
        var groupMap = {
            'main': 'sidebar-nav-group-main',
            'workspace': 'sidebar-nav-group-workspace',
            'tablolar': 'sidebar-nav-group-tablolar',
            'aliskanliklar': 'sidebar-nav-group-aliskanliklar'
        };

        var groupId = groupMap[groupKey];
        if (!groupId) return;

        var groupEl = document.getElementById(groupId);
        if (!groupEl) return;

        // Grubu aç (collapse ise)
        if (groupEl.classList.contains('group-collapsed')) {
            groupEl.classList.remove('group-collapsed');
            localStorage.setItem('sidebar_group_collapsed_' + groupKey, 'false');
        }

        // Benzersiz ID oluştur
        var uniqueId = (groupKey === 'workspace' ? 'team' : viewType) + '_instance_' + Date.now();

        // Sidebar nav item için ikonları belirle
        var iconHtml = '';
        if (viewType === 'new-table') {
            iconHtml = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>';
        } else if (viewType === 'aliskanlik') {
            iconHtml = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
        } else if (viewType === 'notes') {
            iconHtml = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" /><path d="M14 3v4a2 2 0 0 0 2 2h4" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></svg>';
        } else if (groupKey === 'workspace') {
            iconHtml = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>';
        }

        // Yeni nav item DOM'u oluştur
        var div = document.createElement('div');
        div.className = 'sidebar-nav-item';
        div.setAttribute('data-view', uniqueId);
        div.setAttribute('data-view-type', viewType);
        div.setAttribute('data-tooltip', defaultLabel);
        div.setAttribute('data-default-label', defaultLabel);
        div.setAttribute('draggable', 'true');

        div.innerHTML =
            '<div class="nav-icon-container">' +
            '  <span class="nav-icon-original">' + iconHtml + '</span>' +
            '</div>' +
            '<span class="nav-label">' + defaultLabel + '</span>' +
            '<span class="sidebar-nav-badge" id="badge-' + uniqueId + '"></span>' +
            '<span class="sidebar-nav-more-btn" onclick="App.showNavContextMenu(\'' + uniqueId + '\', event)">' +
            '  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>' +
            '</span>';

        if (groupKey === 'main') {
            groupEl.appendChild(div);
        } else {
            // Grubun title'ından sonra (en üste) ekle
            var titleEl = groupEl.querySelector('.sidebar-nav-group-title');
            if (titleEl && titleEl.nextSibling) {
                groupEl.insertBefore(div, titleEl.nextSibling);
            } else {
                groupEl.appendChild(div);
            }
        }

        // Navigasyon olayını ekle ve aktif et
        setupNavigation();
        initDragAndDrop();

        // Yeni öğeyi kaydet
        saveGroupItems(groupKey);
        saveNavOrder();

        // Yeni öğeye geç
        showSection(uniqueId);
    }

    /* Grup item'larını localStorage'a kaydet */
    function saveGroupItems(groupKey) {
        var storageKey = 'sidebar_group_items_' + groupKey;
        var groupMap = {
            'main': 'sidebar-nav-group-main',
            'workspace': 'sidebar-nav-group-workspace',
            'tablolar': 'sidebar-nav-group-tablolar',
            'aliskanliklar': 'sidebar-nav-group-aliskanliklar'
        };

        var groupId = groupMap[groupKey];
        if (!groupId) return;

        var groupEl = document.getElementById(groupId);
        if (!groupEl) return;

        var items = [];
        groupEl.querySelectorAll('.sidebar-nav-item').forEach(function(item) {
            var viewId = item.getAttribute('data-view');
            var viewType = item.getAttribute('data-view-type');
            var label = item.querySelector('.nav-label');
            
            // Eğer Çalışma Alanı (main) grubundaysak, sadece dinamik oluşturulanları kaydet!
            if (groupKey === 'main' && (!viewId || (viewId.indexOf('_instance_') === -1 && viewId.indexOf('notes_pinned_') === -1))) {
                return;
            }
            
            var entry = {
                id: viewId,
                type: viewType || viewId,
                label: label ? label.textContent : ''
            };

            /* Sabitlenmiş not ise pinnedNoteId'yi de kaydet */
            var pinnedNoteId = item.getAttribute('data-pinned-note-id');
            if (pinnedNoteId) {
                entry.pinnedNoteId = pinnedNoteId;
            }

            items.push(entry);
        });

        try {
            localStorage.setItem(storageKey, JSON.stringify(items));
        } catch (e) {}
    }

    /* Kaydedilmiş grup item'larını yükle */
    function loadGroupItems() {
        ['main', 'workspace', 'tablolar', 'aliskanliklar'].forEach(function(groupKey) {
            var storageKey = 'sidebar_group_items_' + groupKey;
            var stored = localStorage.getItem(storageKey);
            if (!stored) return;

            var groupMap = {
                'main': 'sidebar-nav-group-main',
                'workspace': 'sidebar-nav-group-workspace',
                'tablolar': 'sidebar-nav-group-tablolar',
                'aliskanliklar': 'sidebar-nav-group-aliskanliklar'
            };

            var groupEl = document.getElementById(groupMap[groupKey]);
            if (!groupEl) return;

            // Çalışma Alanı (main) grubundaki statik elemanları silmeyip, sadece dinamik olanları sil
            var staticItems = groupEl.querySelectorAll('.sidebar-nav-item');
            staticItems.forEach(function(item) {
                var viewId = item.getAttribute('data-view') || '';
                if (groupKey !== 'main' || viewId.indexOf('_instance_') !== -1) {
                    item.remove();
                }
            });

            try {
                var items = JSON.parse(stored);
                items.forEach(function(item) {
                    // Zaten DOM'da var mı kontrol et
                    if (document.querySelector('.sidebar-nav-item[data-view="' + item.id + '"]')) return;

                    var viewType = item.type;
                    var iconHtml = '';
                    if (viewType === 'new-table') {
                        iconHtml = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>';
                    } else if (viewType === 'aliskanlik') {
                        iconHtml = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
                    } else if (viewType === 'notes') {
                        iconHtml = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" /><path d="M14 3v4a2 2 0 0 0 2 2h4" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></svg>';
                    } else if (groupKey === 'workspace' || item.id.indexOf('team_instance_') === 0) {
                        iconHtml = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>';
                    }

                    /* Sabitlenmiş not ise data-pinned-note-id kurtarılsın */
                    var pinnedNoteId = item.id.indexOf('notes_pinned_') === 0 ? (item.pinnedNoteId || item.id.split('_')[2]) : null;

                    var div = document.createElement('div');
                    div.className = 'sidebar-nav-item';
                    div.setAttribute('data-view', item.id);
                    div.setAttribute('data-view-type', viewType);
                    div.setAttribute('data-tooltip', item.label);
                    
                    var defaultLabel = 'Yeni Alışkanlık';
                    if (viewType === 'new-table') defaultLabel = 'Yeni Tablo';
                    else if (viewType === 'notes') defaultLabel = 'Yeni Not';
                    else if (groupKey === 'workspace') defaultLabel = 'Yeni Ekip';
                    div.setAttribute('data-default-label', defaultLabel);
                    div.setAttribute('draggable', 'true');

                    if (pinnedNoteId) {
                        div.setAttribute('data-pinned-note-id', pinnedNoteId);
                        /* Restore localStorage mapping */
                        try { localStorage.setItem('note_pin_' + pinnedNoteId, item.id); } catch(e){}
                    }

                    div.innerHTML =
                        '<div class="nav-icon-container">' +
                        '  <span class="nav-icon-original">' + iconHtml + '</span>' +
                        '</div>' +
                        '<span class="nav-label">' + item.label + '</span>' +
                        '<span class="sidebar-nav-badge" id="badge-' + item.id + '"></span>' +
                        '<span class="sidebar-nav-more-btn" onclick="App.showNavContextMenu(\'' + item.id + '\', event)">' +
                        '  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>' +
                        '</span>';

                    groupEl.appendChild(div);
                });
            } catch (e) {
                console.error('loadGroupItems error:', e);
            }
        });
    }

    /* Başlık input değiştiğinde sidebar nav label'ı güncelle */
    function initTitleSync() {
        document.addEventListener('input', function(e) {
            // Tablo başlığı senkronizasyonu
            if (e.target.id === 'new-table-title-input') {
                syncTitleToSidebar('new-table', e.target.value, 'Yeni Tablo');
            }
            // Alışkanlık başlığı senkronizasyonu
            if (e.target.id === 'aliskanlik-title-input') {
                syncTitleToSidebar('aliskanlik', e.target.value, 'Yeni Alışkanlık');
            }
        });
    }

    function syncTitleToSidebar(viewType, newTitle, defaultTitle) {
        var currentSection = _currentSection;
        if (!currentSection) return;

        // Aktif bölümün sidebar nav label'ını güncelle
        var navItem = document.querySelector('.sidebar-nav-item[data-view="' + currentSection + '"]');
        if (!navItem) return;

        // viewType kontrolü: aktif bölüm bu viewType'a ait mi?
        var itemViewType = navItem.getAttribute('data-view-type');
        var itemView = navItem.getAttribute('data-view');

        var isMatch = (itemView === viewType) || (itemViewType === viewType);
        if (!isMatch) return;

        var labelEl = navItem.querySelector('.nav-label');
        if (!labelEl) return;

        var displayTitle = newTitle.trim() || defaultTitle;
        labelEl.textContent = displayTitle;
        navItem.setAttribute('data-tooltip', displayTitle);

        // Özel etiketi kaydet
        saveCustomLabel(currentSection, displayTitle);

        // Grup item'larını da güncelle
        var groupEl = navItem.closest('.sidebar-nav-group');
        if (groupEl) {
            var groupId = groupEl.id;
            if (groupId === 'sidebar-nav-group-tablolar') {
                saveGroupItems('tablolar');
            } else if (groupId === 'sidebar-nav-group-aliskanliklar') {
                saveGroupItems('aliskanliklar');
            }
        }
    }

    /* =============================================
       NOT → SIDEBAR SÜRÜKLE-BIRAK
       Liste görünümündeki notları sidebar bölümü olarak pinine alma
       ============================================= */
    function initNoteDragToSidebar() {
        var sidebar = document.querySelector('.sidebar');
        if (!sidebar || sidebar._noteDragListened) return;
        sidebar._noteDragListened = true;

        /* Sürükleme sidebar'a girdiğinde vurgulama göster */
        sidebar.addEventListener('dragenter', function (e) {
            if (!e.dataTransfer.types || e.dataTransfer.types.indexOf('application/notum-note-id') === -1) return;
            e.preventDefault();
            sidebar.classList.add('sidebar-note-drop-active');

            /* Drop indicator bandını ekle */
            if (!document.getElementById('sidebar-note-drop-indicator')) {
                var ind = document.createElement('div');
                ind.id = 'sidebar-note-drop-indicator';
                ind.innerHTML =
                    '<span class="sndi-icon">' +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/><path d="M14 3v4a2 2 0 0 0 2 2h4"/></svg>' +
                    '</span>' +
                    '<span>Bölüm olarak ekle</span>';
                sidebar.appendChild(ind);
            }
        });

        sidebar.addEventListener('dragover', function (e) {
            if (!e.dataTransfer.types || e.dataTransfer.types.indexOf('application/notum-note-id') === -1) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        sidebar.addEventListener('dragleave', function (e) {
            /* Sidebar dışına çıkıldığında temizle */
            if (!sidebar.contains(e.relatedTarget)) {
                sidebar.classList.remove('sidebar-note-drop-active');
                var ind = document.getElementById('sidebar-note-drop-indicator');
                if (ind) ind.remove();
            }
        });

        sidebar.addEventListener('drop', function (e) {
            var noteId = e.dataTransfer.getData('application/notum-note-id');
            sidebar.classList.remove('sidebar-note-drop-active');
            var ind = document.getElementById('sidebar-note-drop-indicator');
            if (ind) ind.remove();

            if (!noteId) return;
            e.preventDefault();
            e.stopPropagation();
            addNoteAsSidebarSection(noteId);
        });
    }

    /* Bir notu sidebar'a yeni bölüm olarak ekle */
    function addNoteAsSidebarSection(noteId) {
        /* Notu DB'den al */
        var user = (typeof DB !== 'undefined' && DB.currentUser) ? DB.currentUser() : null;
        if (!user) return;

        var notes = [];
        try {
            var allNotes = DB.get('notes') || [];
            notes = allNotes.filter(function (n) { return n.userId === user.id || n.userId === user.email; });
        } catch (e) { return; }

        var note = notes.find(function (n) { return n.id === noteId; });
        if (!note) return;

        /* Zaten sidebar'da var mı kontrol et */
        var existingKey = 'note_pin_' + noteId;
        var existingId = localStorage.getItem(existingKey);
        if (existingId && document.querySelector('.sidebar-nav-item[data-view="' + existingId + '"]')) {
            /* Zaten eklenmiş: sadece o bölüme geç */
            showSection(existingId);
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show('"' + (note.title || 'Başlıksız') + '" zaten kenar çubuğunda.', 'info');
            }
            return;
        }

        /* Benzersiz ID oluştur: notun kendi ID'sini içersin (sonradan eşleştirmek için) */
        var uniqueId = 'notes_pinned_' + noteId + '_' + Date.now();

        /* İkon */
        var iconHtml = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/><path d="M14 3v4a2 2 0 0 0 2 2h4"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>';

        var label = note.title || 'Başlıksız Not';

        /* DOM oluştur */
        var div = document.createElement('div');
        div.className = 'sidebar-nav-item';
        div.setAttribute('data-view', uniqueId);
        div.setAttribute('data-view-type', 'notes');
        div.setAttribute('data-tooltip', label);
        div.setAttribute('data-default-label', label);
        div.setAttribute('data-pinned-note-id', noteId);
        div.setAttribute('draggable', 'true');

        div.innerHTML =
            '<div class="nav-icon-container">' +
            '  <span class="nav-icon-original">' + iconHtml + '</span>' +
            '</div>' +
            '<span class="nav-label">' + label + '</span>' +
            '<span class="sidebar-nav-badge" id="badge-' + uniqueId + '"></span>' +
            '<span class="sidebar-nav-more-btn" onclick="App.showNavContextMenu(\'' + uniqueId + '\', event)">' +
            '  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>' +
            '</span>';

        /* main grubuna ekle */
        var groupEl = document.getElementById('sidebar-nav-group-main');
        if (groupEl) {
            groupEl.appendChild(div);
        }

        /* Navigasyon ve sürükle-bırak yenile */
        setupNavigation();
        initDragAndDrop();
        saveGroupItems('main');
        saveNavOrder();

        /* Notu sidebar ID'siyle eşleştir (tekrarlı eklemeyi önlemek için) */
        try { localStorage.setItem(existingKey, uniqueId); } catch (e) {}

        /* O bölüme geç ve notu hemen aç */
        showSection(uniqueId);
        setTimeout(function () {
            if (typeof Notes !== 'undefined' && Notes.openDetail) {
                Notes.openDetail(noteId);
            }
        }, 150);

        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show('"' + label + '" kenar çubuğuna bölüm olarak eklendi.', 'success');
        }
    }

    /* Dışarıya açılan fonksiyonlar */
    return {
        init: init,
        showLanding: showLanding,
        showAuth: showAuth,
        showDashboard: showDashboard,
        showSection: showSection,
        onLoginSuccess: onLoginSuccess,
        onLogout: onLogout,
        handleLogout: handleLogout,
        closeLogoutModal: closeLogoutModal,
        confirmLogout: confirmLogout,
        toggleSidebar: toggleSidebar,
        updateSidebarBadges: updateSidebarBadges,
        showNavContextMenu: showNavContextMenu,
        closeNavContextMenu: closeNavContextMenu,
        toggleParentExpand: toggleParentExpand,
        
        
        
        
        activeSubSection: activeSubSection,
        
        
        createSubSection: createSubSection,
        deleteSubSection: deleteSubSection,
        restoreNavItem: restoreNavItem,
        toggleHeaderDropdown: toggleHeaderDropdown,
        populateHeaderDropdown: populateHeaderDropdown,
        updateHeaderActiveItem: updateHeaderActiveItem,
        navigateToMainSection: navigateToMainSection,
        toggleGroupCollapse: toggleGroupCollapse,
        handleGroupAdd: handleGroupAdd,
        addNewGroupItem: addNewGroupItem,
        showGroupAddDropdown: showGroupAddDropdown,
        handleRenameGroup: handleRenameGroup,
        handleNewNoteFromGroup: handleNewNoteFromGroup,
        addNoteAsSidebarSection: addNoteAsSidebarSection
    };
})();

/* Sayfa yüklendiğinde uygulamayı başlat */
document.addEventListener('DOMContentLoaded', function () {
    App.init();
});

document.addEventListener('click', function (e) {
    var dropdown = document.getElementById('header-section-dropdown');
    if (dropdown && !e.target.closest('.header-section-dropdown-trigger')) {
        dropdown.classList.remove('active');
    }
});