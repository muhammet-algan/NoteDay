var Settings = (function () {
    'use strict';

    var _settings = {};

    function loadSettings() {
        try {
            var stored = localStorage.getItem('app_settings');
            _settings = stored ? JSON.parse(stored) : {};
        } catch (e) {
            _settings = {};
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem('app_settings', JSON.stringify(_settings));
        } catch (e) { }
    }

    // ===== Tema Değiştirme =====
    function setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        _settings.theme = theme;
        saveSettings();

        // Tema kartlarını güncelle
        var lightBtn = document.getElementById('theme-light');
        var darkBtn = document.getElementById('theme-dark');
        if (lightBtn && darkBtn) {
            if (theme === 'dark') {
                lightBtn.classList.remove('active');
                darkBtn.classList.add('active');
            } else {
                lightBtn.classList.add('active');
                darkBtn.classList.remove('active');
            }
        }
    }

    function applyTheme() {
        if (_settings.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    // ===== Kullanıcı Dropdown Menü =====
    var _dropdownMoved = false;

    var activeTriggerId = 'sidebar-user-trigger';
    function toggleUserMenu(triggerId) {
        var dropdown = document.getElementById('user-dropdown');
        if (!dropdown) return;

        var targetTriggerId = triggerId || 'sidebar-user-trigger';

        // İlk seferde dropdown'ı body'ye taşı (sidebar layout'tan ayır)
        if (!_dropdownMoved) {
            document.body.appendChild(dropdown);
            _dropdownMoved = true;
        }

        var isOpen = dropdown.classList.contains('open');
        if (isOpen) {
            if (activeTriggerId === targetTriggerId) {
                dropdown.classList.remove('open');
                return;
            }
        }

        activeTriggerId = targetTriggerId;

        // Kullanıcı bilgilerini doldur
        var user = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
        if (user) {
            var emailEl = document.getElementById('udm-email');
            var nameEl = document.getElementById('udm-name');
            var avatarEl = document.getElementById('udm-avatar');
            if (emailEl) emailEl.textContent = user.email || '';
            if (nameEl) nameEl.textContent = ((user.firstName || '') + ' ' + (user.lastName || '')).trim() || 'Kullanıcı';
            if (avatarEl) {
                var initials = (user.firstName ? user.firstName.charAt(0) : 'U').toUpperCase();
                // Fotoğraf kontrolü
                var dataUrl = null;
                try { dataUrl = localStorage.getItem('avatar_' + user.email); } catch (e) { }
                if (dataUrl) {
                    avatarEl.textContent = '';
                    avatarEl.style.backgroundImage = 'url(' + dataUrl + ')';
                } else {
                    avatarEl.textContent = initials;
                    avatarEl.style.backgroundImage = '';
                    
                    // E-posta adresine göre benzersiz ama kalıcı renk belirleme
                    var avatarColors = ['#927568', '#9c8170', '#809282', '#788599', '#8a7b93', '#b38282', '#b3947b', '#7b9fb3', '#b37ba9'];
                    var hash = 0;
                    var email = user.email || '';
                    for (var i = 0; i < email.length; i++) {
                        hash = email.charCodeAt(i) + ((hash << 5) - hash);
                    }
                    var colorIndex = Math.abs(hash) % avatarColors.length;
                    avatarEl.style.backgroundColor = avatarColors[colorIndex];
                }
            }
        }

        // Profil butonunun altında konumla (üst tarafta olduğu için aşağı açılır)
        var trigger = document.getElementById(activeTriggerId);
        if (trigger) {
            var rect = trigger.getBoundingClientRect();
            // Aşağı doğru aç
            dropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
            if (activeTriggerId === 'header-user-avatar') {
                dropdown.style.left = (rect.right - 240) + 'px'; // 240px is the width of user-dropdown or similar
            } else {
                dropdown.style.left = rect.left + 'px';
            }
        }
        dropdown.classList.add('open');
    }

    function closeUserMenu() {
        var dropdown = document.getElementById('user-dropdown');
        if (dropdown) dropdown.classList.remove('open');
    }

    // Sayfa herhangi bir yerine tıklanınca menüyü kapat
    document.addEventListener('click', function (e) {
        var trigger1 = document.getElementById('sidebar-user-trigger');
        var trigger2 = document.getElementById('header-user-avatar');
        var dropdown = document.getElementById('user-dropdown');
        if (!dropdown) return;
        
        var clickedTrigger = (trigger1 && trigger1.contains(e.target)) || (trigger2 && trigger2.contains(e.target));
        if (!clickedTrigger && !dropdown.contains(e.target)) {
            closeUserMenu();
        }
    });

    // ===== Ayarlar Tam Sayfa Overlay =====
    function openSettingsPage() {
        closeUserMenu();
        loadSettings();
        var overlay = document.getElementById('settings-overlay');
        if (overlay) {
            overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
            fillSettingsForm();
            try { localStorage.setItem('app_settings_open', 'true'); } catch (e) { }

            // notum-style settings: open saved tab or default to general
            var savedTab = localStorage.getItem('app_settings_tab') || 'general';
            switchTab(savedTab);
        }
        // Bildirimleri gizle
        var notifBtn = document.getElementById('notif-floating-btn');
        var notifPanel = document.getElementById('notif-panel');
        if (notifBtn) notifBtn.style.display = 'none';
        if (notifPanel) { notifPanel.style.display = 'none'; notifPanel.classList.remove('open'); }
        // Arama kutusunu temizle
        var searchInput = document.getElementById('settings-search-input');
        if (searchInput) searchInput.value = '';
    }

    function closeSettingsPage() {
        var overlay = document.getElementById('settings-overlay');
        if (overlay) {
            overlay.classList.remove('open');
            document.body.style.overflow = '';
            try { localStorage.removeItem('app_settings_open'); localStorage.removeItem('app_settings_tab'); } catch (e) { }
        }
        // Bildirimleri geri göster
        var notifBtn = document.getElementById('notif-floating-btn');
        if (notifBtn) notifBtn.style.display = '';
    }

    // ===== Bölüme Scroll =====
    function switchTab(tabName) {
        // notum-style settings: switch active sidebar item and content pane
        var tabs = document.querySelectorAll('.settings-sidebar-item');
        tabs.forEach(function (t) {
            t.classList.toggle('active', t.getAttribute('data-tab') === tabName);
        });

        var panes = document.querySelectorAll('.settings-content-pane');
        panes.forEach(function (p) {
            p.classList.toggle('active', p.getAttribute('id') === 'pane-' + tabName);
        });

        try {
            localStorage.setItem('app_settings_tab', tabName);
        } catch (e) { }
    }

    // ===== Form Doldur =====
    function fillSettingsForm() {
        var user = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
        var firstname = document.getElementById('settings-firstname');
        var lastname = document.getElementById('settings-lastname');
        var email = document.getElementById('settings-email');
        if (firstname && user) firstname.value = user.firstName || '';
        if (lastname && user) lastname.value = user.lastName || '';
        if (email && user) email.value = user.email || '';

        // Sidebar user card bilgilerini güncelle
        var sidebarName = document.getElementById('settings-sidebar-name');
        var sidebarEmail = document.getElementById('settings-sidebar-email');
        var sidebarInitials = document.getElementById('settings-sidebar-avatar-initials');
        var sidebarAvatarImg = document.getElementById('settings-sidebar-avatar-img');
        if (user) {
            var fullName = ((user.firstName || '') + ' ' + (user.lastName || '')).trim() || 'Kullanıcı';
            if (sidebarName) sidebarName.textContent = fullName;
            if (sidebarEmail) sidebarEmail.textContent = user.email || '';
            if (sidebarInitials) sidebarInitials.textContent = ((user.firstName || 'U').charAt(0) + (user.lastName || '').charAt(0)).toUpperCase();

            // Sidebar avatar fotoğrafı
            var dataUrl = null;
            try { dataUrl = localStorage.getItem('avatar_' + user.email); } catch (e) { }
            if (dataUrl && sidebarAvatarImg) {
                sidebarAvatarImg.src = dataUrl;
                sidebarAvatarImg.style.display = 'block';
                if (sidebarInitials) sidebarInitials.style.display = 'none';
            } else {
                if (sidebarAvatarImg) { sidebarAvatarImg.style.display = 'none'; sidebarAvatarImg.src = ''; }
                if (sidebarInitials) sidebarInitials.style.display = '';
            }
        }

        // Kullanıcı Profilinde Rozetleri Listele
        if (typeof Budget !== 'undefined' && Budget.renderProfileBadges) {
            Budget.renderProfileBadges();
        }

        // Bildirimler
        var notifyRem = document.getElementById('settings-notify-reminders');
        var notifySound = document.getElementById('settings-notify-sound');
        if (notifyRem) notifyRem.checked = _settings.notifyReminders !== false;
        if (notifySound) notifySound.checked = _settings.notifySound !== false;

        // Para birimi
        var currency = document.getElementById('settings-currency');
        if (currency && _settings.currency) currency.value = _settings.currency;

        // Menü Düzeni toggle'larını doldur
        var layout = getMenuLayout();
        var sections = ['reminders', 'board', 'notes', 'finance'];
        sections.forEach(function (s) {
            var toggle = document.getElementById('menu-toggle-' + s);
            if (toggle) toggle.checked = layout[s] !== false;
        });

        // Para birimi dropdown'u güncelle
        var currencyVal = _settings.currency || 'TRY';
        var currencyMap = { 'TRY': 'TRY', 'USD': 'USD', 'EUR': 'EUR' };
        var ddValue = document.getElementById('currency-dropdown-value');
        if (ddValue) ddValue.textContent = currencyMap[currencyVal] || currencyMap['TRY'];
        var ddItems = document.querySelectorAll('#currency-dropdown-menu .custom-dropdown-item');
        ddItems.forEach(function(item) {
            item.classList.toggle('active', item.getAttribute('data-value') === currencyVal);
        });

        // Profil avatarı yükle
        loadAvatar();



        // Şifre alanlarını temizle
        var oldPw = document.getElementById('settings-old-password');
        var newPw = document.getElementById('settings-new-password');
        var confirmPw = document.getElementById('settings-confirm-password');
        var pwError = document.getElementById('password-change-error');
        if (oldPw) oldPw.value = '';
        if (newPw) newPw.value = '';
        if (confirmPw) confirmPw.value = '';
        if (pwError) { pwError.style.display = 'none'; pwError.textContent = ''; }

        // Aktif oturumları render et
        renderActiveSessions();
    }

    // ===== Genel Toggle Değişikliği =====
    function onGeneralToggle(el) {
        // No status text update needed as status labels are removed
    }

    // ===== Profil Kaydet =====
    function saveProfile() {
        var firstname = document.getElementById('settings-firstname');
        var lastname = document.getElementById('settings-lastname');
        var emailInput = document.getElementById('settings-email');
        if (!firstname || !lastname) return;

        var user = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
        if (user) {
            user.firstName = firstname.value.trim();
            user.lastName = lastname.value.trim();
            if (emailInput && emailInput.value.trim()) {
                user.email = emailInput.value.trim();
            }
            if (typeof Auth.updateUser === 'function') {
                Auth.updateUser(user);
            }
            // Sidebar kullanıcı adını güncelle
            var nameEl = document.getElementById('user-name');
            if (nameEl) nameEl.textContent = user.firstName + ' ' + user.lastName;
        }
        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show('Profil güncellendi', 'success');
        }
    }

    // ===== Para Birimi — Custom Dropdown =====
    function toggleCurrencyDropdown() {
        var dd = document.getElementById('currency-dropdown');
        if (dd) dd.classList.toggle('open');
    }

    function selectCurrency(el) {
        var value = el.getAttribute('data-value');
        var label = el.textContent;
        // Değeri güncelle
        var ddValue = document.getElementById('currency-dropdown-value');
        if (ddValue) ddValue.textContent = label;
        // Aktif sınıfı güncelle
        var items = el.parentElement.querySelectorAll('.custom-dropdown-item');
        items.forEach(function(item) { item.classList.remove('active'); });
        el.classList.add('active');
        // Dropdown'u kapat
        var dd = document.getElementById('currency-dropdown');
        if (dd) dd.classList.remove('open');
        // Kaydet
        _settings.currency = value;
        saveSettings();
        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show('Para birimi güncellendi', 'success');
        }
    }

    function saveCurrency() { /* eski uyumluluk */ }

    // Dropdown dışına tıklayınca kapat
    document.addEventListener('click', function(e) {
        var dd = document.getElementById('currency-dropdown');
        if (dd && !dd.contains(e.target)) {
            dd.classList.remove('open');
        }
    });

    // ===== Veri Dışa Aktar =====
    function exportData() {
        try {
            var data = {};
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                data[key] = localStorage.getItem(key);
            }
            var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'psikolojik-destek-veri-' + new Date().toISOString().split('T')[0] + '.json';
            a.click();
            URL.revokeObjectURL(url);
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show('Veriler dışa aktarıldı', 'success');
            }
        } catch (e) {
            alert('Dışa aktarma sırasında hata oluştu.');
        }
    }

    // ===== Tüm Verileri Sil =====
    function clearAllData() {
        if (confirm('Tüm verileriniz silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?')) {
            localStorage.clear();
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show('Tüm veriler silindi', 'success');
            }
            closeSettingsPage();
            if (typeof App !== 'undefined' && App.handleLogout) {
                App.handleLogout();
            }
        }
    }

    // ===== Profil Fotoğrafı =====
    function handleAvatarUpload(input) {
        if (!input.files || !input.files[0]) return;
        var file = input.files[0];
        if (!file.type.startsWith('image/')) return;

        var reader = new FileReader();
        reader.onload = function (e) {
            var dataUrl = e.target.result;
            // Avatarı localStore'a kaydet
            var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
            if (user) {
                try { localStorage.setItem('avatar_' + user.email, dataUrl); } catch (err) { }
            }
            // Görseli göster
            var img = document.getElementById('profile-avatar-img');
            var initials = document.getElementById('profile-avatar-initials');
            if (img) { img.src = dataUrl; img.style.display = 'block'; }
            if (initials) initials.style.display = 'none';

            // Sidebar ve Header avatarlarını güncelle
            var sidebarAvatar = document.getElementById('user-avatar');
            if (sidebarAvatar) {
                sidebarAvatar.textContent = '';
                sidebarAvatar.style.backgroundImage = 'url(' + dataUrl + ')';
                sidebarAvatar.style.backgroundSize = 'cover';
                sidebarAvatar.style.backgroundPosition = 'center';
            }
            var headerAvatar = document.getElementById('header-user-avatar');
            if (headerAvatar) {
                headerAvatar.textContent = '';
                headerAvatar.style.backgroundImage = 'url(' + dataUrl + ')';
                headerAvatar.style.backgroundSize = 'cover';
                headerAvatar.style.backgroundPosition = 'center';
            }

            // Settings sidebar avatar güncelle
            var settingsSidebarImg = document.getElementById('settings-sidebar-avatar-img');
            var settingsSidebarInitials = document.getElementById('settings-sidebar-avatar-initials');
            if (settingsSidebarImg) {
                settingsSidebarImg.src = dataUrl;
                settingsSidebarImg.style.display = 'block';
                if (settingsSidebarInitials) settingsSidebarInitials.style.display = 'none';
            }

            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show('Profil fotoğrafı güncellendi', 'success');
            }
        };
        reader.readAsDataURL(file);
    }

    function loadAvatar() {
        var user = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
        if (!user) return;

        var dataUrl = null;
        try { dataUrl = localStorage.getItem('avatar_' + user.email); } catch (e) { }

        var img = document.getElementById('profile-avatar-img');
        var initialsEl = document.getElementById('profile-avatar-initials');

        if (dataUrl && img) {
            img.src = dataUrl;
            img.style.display = 'block';
            if (initialsEl) initialsEl.style.display = 'none';
        } else {
            if (img) { img.style.display = 'none'; img.src = ''; }
            if (initialsEl) {
                initialsEl.style.display = '';
                initialsEl.textContent = (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
            }
        }

        // Sidebar ve Header avatarlarını güncelle
        var sidebarAvatar = document.getElementById('user-avatar');
        var headerAvatar = document.getElementById('header-user-avatar');
        var initials = (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
        
        if (dataUrl) {
            if (sidebarAvatar) {
                sidebarAvatar.textContent = '';
                sidebarAvatar.style.backgroundImage = 'url(' + dataUrl + ')';
                sidebarAvatar.style.backgroundSize = 'cover';
                sidebarAvatar.style.backgroundPosition = 'center';
            }
            if (headerAvatar) {
                headerAvatar.textContent = '';
                headerAvatar.style.backgroundImage = 'url(' + dataUrl + ')';
                headerAvatar.style.backgroundSize = 'cover';
                headerAvatar.style.backgroundPosition = 'center';
            }
        } else {
            if (sidebarAvatar) {
                sidebarAvatar.textContent = initials;
                sidebarAvatar.style.backgroundImage = '';
            }
            if (headerAvatar) {
                var headerInitials = (user.firstName ? user.firstName.charAt(0) : 'U').toUpperCase();
                headerAvatar.textContent = headerInitials;
                headerAvatar.style.backgroundImage = '';
                
                // E-posta adresine göre benzersiz ama kalıcı renk belirleme
                var avatarColors = ['#927568', '#9c8170', '#809282', '#788599', '#8a7b93', '#b38282', '#b3947b', '#7b9fb3', '#b37ba9'];
                var hash = 0;
                var email = user.email || '';
                for (var i = 0; i < email.length; i++) {
                    hash = email.charCodeAt(i) + ((hash << 5) - hash);
                }
                var colorIndex = Math.abs(hash) % avatarColors.length;
                headerAvatar.style.backgroundColor = avatarColors[colorIndex];
            }
        }
    }

    // ===== Şifre Güncelleme =====
    function changePassword() {
        var oldPw = document.getElementById('settings-old-password');
        var newPw = document.getElementById('settings-new-password');
        var confirmPw = document.getElementById('settings-confirm-password');
        var errorEl = document.getElementById('password-change-error');

        if (!oldPw || !newPw || !confirmPw || !errorEl) return;

        // Hata mesajını sıfırla
        errorEl.style.display = 'none';
        errorEl.classList.remove('settings-password-success');

        var oldVal = oldPw.value;
        var newVal = newPw.value;
        var confirmVal = confirmPw.value;

        if (!oldVal || !newVal || !confirmVal) {
            errorEl.textContent = 'Lütfen tüm alanları doldurun.';
            errorEl.style.display = 'block';
            return;
        }

        if (newVal.length < 6) {
            errorEl.textContent = 'Şifre en az 6 karakter olmalıdır.';
            errorEl.style.display = 'block';
            return;
        }

        if (newVal !== confirmVal) {
            errorEl.textContent = 'Yeni şifreler eşleşmiyor.';
            errorEl.style.display = 'block';
            return;
        }

        // Mevcut kullanıcıyı bul ve eski şifresini kontrol et
        var currentUser = (typeof Auth !== 'undefined' && Auth.getUser) ? Auth.getUser() : null;
        if (!currentUser) return;

        var users = DB.getUsers();
        var userRecord = users.find(function (u) { return u.email === currentUser.email; });

        if (!userRecord || userRecord.password !== oldVal) {
            errorEl.textContent = 'Mevcut şifre hatalı.';
            errorEl.style.display = 'block';
            return;
        }

        // Şifreyi güncelle
        userRecord.password = newVal;
        DB.saveUsers(users);

        // Alanları temizle
        oldPw.value = '';
        newPw.value = '';
        confirmPw.value = '';

        // Başarı mesajı
        errorEl.textContent = 'Şifreniz başarıyla güncellendi.';
        errorEl.classList.add('settings-password-success');
        errorEl.style.display = 'block';

        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show('Şifre güncellendi', 'success');
        }
    }

    // ===== Aktif Oturumlar =====
    function renderActiveSessions() {
        var container = document.getElementById('active-sessions-list');
        if (!container) return;

        var ua = navigator.userAgent;
        var browser = 'Bilinmeyen Tarayıcı';
        var os = 'Bilinmeyen İşletim Sistemi';
        var deviceIcon = '';

        // Tarayıcı algılama
        if (ua.indexOf('Edg') > -1) browser = 'Microsoft Edge';
        else if (ua.indexOf('OPR') > -1 || ua.indexOf('Opera') > -1) browser = 'Opera';
        else if (ua.indexOf('Chrome') > -1) browser = 'Google Chrome';
        else if (ua.indexOf('Safari') > -1) browser = 'Safari';
        else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';

        // İşletim sistemi algılama
        if (ua.indexOf('Windows') > -1) { os = 'Windows'; deviceIcon = 'desktop'; }
        else if (ua.indexOf('Mac OS') > -1 || ua.indexOf('Macintosh') > -1) { os = 'macOS'; deviceIcon = 'desktop'; }
        else if (ua.indexOf('Linux') > -1 && ua.indexOf('Android') === -1) { os = 'Linux'; deviceIcon = 'desktop'; }
        else if (ua.indexOf('Android') > -1) { os = 'Android'; deviceIcon = 'mobile'; }
        else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) { os = 'iOS'; deviceIcon = 'mobile'; }

        // Cihaz ikonu SVG'si
        var iconSvg = deviceIcon === 'mobile'
            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>'
            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';

        // Oturum zamanı
        var now = new Date();
        var timeStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) +
            ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        container.innerHTML =
            '<div class="session-card session-current">' +
            '<div class="session-card-icon">' + iconSvg + '</div>' +
            '<div class="session-card-info">' +
            '<div class="session-card-title">' + browser + ' (' + os + ')</div>' +
            '<div class="session-card-detail">Son etkinlik: ' + timeStr + '</div>' +
            '</div>' +
            '<span class="session-card-badge">Bu cihaz</span>' +
            '</div>';
    }

    // ===== Menü Düzeni =====
    function getMenuLayout() {
        try {
            var stored = localStorage.getItem('app_menu_layout');
            if (stored) return JSON.parse(stored);
        } catch (e) { }
        return { reminders: true, board: true, notes: true, finance: true };
    }

    function saveMenuLayout(layout) {
        try {
            localStorage.setItem('app_menu_layout', JSON.stringify(layout));
        } catch (e) { }
    }

    function applyMenuLayout() {
        var layout = getMenuLayout();
        var sections = ['reminders', 'board', 'notes', 'finance'];
        sections.forEach(function (s) {
            var navItem = document.querySelector('.sidebar-nav-item[data-view="' + s + '"]');
            if (navItem) {
                navItem.style.display = layout[s] !== false ? '' : 'none';
            }
        });
    }

    function onMenuToggleChange() {
        var sections = ['reminders', 'board', 'notes', 'finance'];
        var layout = {};
        sections.forEach(function (s) {
            var toggle = document.getElementById('menu-toggle-' + s);
            layout[s] = toggle ? toggle.checked : true;
        });
        saveMenuLayout(layout);
        applyMenuLayout();

        // Eğer aktif bölüm kapatıldıysa, açık olan ilk bölüme geçiş yap
        var currentSection = localStorage.getItem('app_current_section') || 'notes';
        if (layout[currentSection] === false) {
            var firstVisible = sections.find(function (s) { return layout[s] !== false; });
            if (firstVisible && typeof App !== 'undefined' && App.showSection) {
                App.showSection(firstVisible);
            }
        }
    }

    // ===== Ayar Arama Sistemi =====
    var _searchIndex = [
        { title: 'Profil Fotoğrafı', category: 'Hesaplar', tab: 'profile', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>', cardIndex: 0 },
        { title: 'Kişisel Bilgiler', category: 'Hesaplar', tab: 'profile', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', cardIndex: 1 },
        { title: 'İsim Değiştir', category: 'Hesaplar', tab: 'profile', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', cardIndex: 1 },
        { title: 'E-posta', category: 'Hesaplar', tab: 'profile', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>', cardIndex: 1 },
        { title: 'Şifre Güncelleme', category: 'Gizlilik ve Güvenlik', tab: 'security', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>', cardIndex: 0 },
        { title: 'Mevcut Şifre', category: 'Gizlilik ve Güvenlik', tab: 'security', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>', cardIndex: 0 },
        { title: 'Aktif Oturumlar', category: 'Gizlilik ve Güvenlik', tab: 'security', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>', cardIndex: 1 },
        { title: 'Tema Seçimi', category: 'Kişiselleştirme', tab: 'appearance', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>', cardIndex: 0 },
        { title: 'Açık Tema', category: 'Kişiselleştirme', tab: 'appearance', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/></svg>', cardIndex: 0 },
        { title: 'Koyu Tema', category: 'Kişiselleştirme', tab: 'appearance', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>', cardIndex: 0 },
        { title: 'Karanlık Mod', category: 'Kişiselleştirme', tab: 'appearance', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>', cardIndex: 0 },

        { title: 'Menü Düzeni', category: 'Uygulamalar', tab: 'menulayout', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>', cardIndex: 0 },
        { title: 'Hatırlatıcı', category: 'Uygulamalar', tab: 'menulayout', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/></svg>', cardIndex: 0 },
        { title: 'Notlarım', category: 'Uygulamalar', tab: 'menulayout', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/></svg>', cardIndex: 0 },
        { title: 'Finanslarım', category: 'Uygulamalar', tab: 'menulayout', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/></svg>', cardIndex: 0 }
    ];

    function handleSearchInput() {
        var input = document.getElementById('settings-search-input');
        var dropdown = document.getElementById('settings-search-dropdown');
        var clearBtn = document.getElementById('settings-search-clear');
        if (!input || !dropdown) return;

        var query = input.value.trim().toLowerCase();
        clearBtn.style.display = query.length > 0 ? 'flex' : 'none';

        if (query.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        // Türkçe karakter normalize
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
        var results = _searchIndex.filter(function (item) {
            return normalize(item.title).indexOf(normalizedQuery) !== -1 ||
                normalize(item.category).indexOf(normalizedQuery) !== -1;
        });

        // Duplicate filter (same title)
        var seen = {};
        results = results.filter(function (item) {
            var key = item.title + '|' + item.tab;
            if (seen[key]) return false;
            seen[key] = true;
            return true;
        });

        if (results.length === 0) {
            dropdown.innerHTML = '<div class="settings-search-no-result">Sonuç bulunamadı</div>';
            dropdown.style.display = 'block';
            return;
        }

        var html = '';
        results.forEach(function (item) {
            html += '<div class="settings-search-result" data-tab="' + item.tab + '" data-card="' + item.cardIndex + '">' +
                '<div class="settings-search-result-icon">' + item.icon + '</div>' +
                '<div class="settings-search-result-text">' +
                '<div class="settings-search-result-title">' + item.title + '</div>' +
                '<div class="settings-search-result-category">' + item.category + '</div>' +
                '</div>' +
                '<svg class="settings-search-result-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>' +
                '</div>';
        });
        dropdown.innerHTML = html;
        dropdown.style.display = 'block';

        // Click handlers
        var items = dropdown.querySelectorAll('.settings-search-result');
        items.forEach(function (el) {
            el.addEventListener('click', function () {
                var tab = el.getAttribute('data-tab');
                var cardIdx = parseInt(el.getAttribute('data-card'), 10);
                navigateToSetting(tab, cardIdx);
            });
        });
    }

    function navigateToSetting(tabName, cardIndex) {
        var dropdown = document.getElementById('settings-search-dropdown');
        if (dropdown) dropdown.style.display = 'none';

        // Bölüme scroll yap
        switchTab(tabName);
    }

    function clearSearch() {
        var input = document.getElementById('settings-search-input');
        var dropdown = document.getElementById('settings-search-dropdown');
        var clearBtn = document.getElementById('settings-search-clear');
        if (input) { input.value = ''; input.focus(); }
        if (dropdown) dropdown.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'none';
    }

    // Search input listener
    document.addEventListener('DOMContentLoaded', function () {
        var input = document.getElementById('settings-search-input');
        if (input) {
            input.addEventListener('input', handleSearchInput);
            input.addEventListener('focus', function () {
                if (input.value.trim().length > 0) handleSearchInput();
            });
        }
        // Dropdown dışı tıklama
        document.addEventListener('click', function (e) {
            var wrapper = document.querySelector('.settings-search-wrapper');
            var dropdown = document.getElementById('settings-search-dropdown');
            if (wrapper && dropdown && !wrapper.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    });

    // Init
    loadSettings();
    applyTheme();

    // Sayfa yenilendiğinde ayarlar açıksa tekrar aç
    if (localStorage.getItem('app_settings_open') === 'true') {
        setTimeout(function () {
            openSettingsPage();
            var savedTab = localStorage.getItem('app_settings_tab');
            if (savedTab) switchTab(savedTab);
        }, 100);
    }

    return {
        toggleUserMenu: toggleUserMenu,
        closeUserMenu: closeUserMenu,
        openSettingsPage: openSettingsPage,
        closeSettingsPage: closeSettingsPage,
        switchTab: switchTab,
        setTheme: setTheme,
        saveProfile: saveProfile,
        saveCurrency: saveCurrency,
        toggleCurrencyDropdown: toggleCurrencyDropdown,
        selectCurrency: selectCurrency,
        exportData: exportData,
        clearAllData: clearAllData,
        getMenuLayout: getMenuLayout,
        applyMenuLayout: applyMenuLayout,
        onMenuToggleChange: onMenuToggleChange,
        onGeneralToggle: onGeneralToggle,
        handleAvatarUpload: handleAvatarUpload,
        loadAvatar: loadAvatar,
        changePassword: changePassword,
        clearSearch: clearSearch
    };
})();
