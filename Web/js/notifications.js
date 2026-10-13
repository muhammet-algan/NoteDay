/* ========================================
   BİLDİRİM MODÜlÜ
   Floating bildirim butonu ve panel yönetimi
   Kullanıcıya özel bildirimler + aksiyon butonları
   ======================================== */
var Notifications = (function () {
    'use strict';

    var _notifications = [];
    var _isOpen = false;

    function init() {
        loadNotifications();
        renderBadge();
        setupOutsideClick();
        generateSystemNotifications();
    }

    /* ===== Kullanıcıya özel key ===== */
    function _notifKey() {
        try {
            var user = DB.currentUser();
            if (user && user.email) return 'user_' + user.email + '_notifications';
        } catch (e) { }
        return 'app_notifications'; // fallback
    }

    /* ===== Veri Yönetimi ===== */
    function loadNotifications() {
        try {
            var stored = localStorage.getItem(_notifKey());
            if (!stored) {
                // Migrate from old global key
                var old = localStorage.getItem('app_notifications');
                if (old) {
                    _notifications = JSON.parse(old);
                    saveNotifications();
                    return;
                }
            }
            _notifications = stored ? JSON.parse(stored) : [];
        } catch (e) {
            _notifications = [];
        }
    }

    function saveNotifications() {
        try {
            localStorage.setItem(_notifKey(), JSON.stringify(_notifications));
        } catch (e) { }
    }

    /* ===== Sistem bildirimleri oluştur ===== */
    function generateSystemNotifications() {
        /* Hoş geldiniz bildirimi: Sadece kayıt sonrası 1 kez gösterilir */
        try {
            var user = DB.currentUser();
            var welcomeKey = user && user.email ? 'user_' + user.email + '_welcome_shown' : null;
            if (welcomeKey && localStorage.getItem(welcomeKey) === 'false') {
                addNotification({
                    id: 'welcome',
                    type: 'info',
                    title: 'Hoş Geldiniz!',
                    message: 'Uygulamaya hoş geldiniz. Bildirimlerinizi buradan takip edebilirsiniz.',
                    time: new Date().toISOString(),
                    read: false
                });
                localStorage.setItem(welcomeKey, 'true');
            }
        } catch (e) { }

        // Yaklaşan hatırlatıcıları bildirim olarak ekle
        if (typeof Reminders !== 'undefined' && Reminders.getReminders) {
            var reminders = Reminders.getReminders();
            var now = new Date();
            var today = now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0');

            reminders.forEach(function (r) {
                if (r.enabled === false || r.triggered === true) return;
                if (!r.customDate || r.customDate !== today) return;

                var nId = 'reminder_' + (r.id || r.title);
                var exists = _notifications.some(function (n) { return n.id === nId; });
                if (!exists) {
                    var timeStr = String(r.hour || 0).padStart(2, '0') + ':' + String(r.minute || 0).padStart(2, '0');
                    addNotification({
                        id: nId,
                        type: 'reminder',
                        title: 'Hatırlatıcı: ' + (r.title || 'Adsız'),
                        message: 'Bugün saat ' + timeStr + ' için planlandı.',
                        time: new Date().toISOString(),
                        read: false
                    });
                }
            });
        }
    }

    /* ===== Tip → Bölüm eşleşmesi ===== */
    var TYPE_SECTION_MAP = {
        reminder: 'reminders',
        finance: 'finance',
        notes: 'notes',
        team_invite: 'team',
        team_response: 'team'
    };

    /* ===== Bildirim Ekleme ===== */
    function addNotification(notification) {
        /* Aynı id ile daha önce eklenmişse tekrar ekleme */
        if (notification.id) {
            var exists = _notifications.some(function (n) { return n.id === notification.id; });
            if (exists) return;
        }
        /* Bildirim tipine göre otomatik section ata */
        if (!notification.section && notification.type) {
            notification.section = TYPE_SECTION_MAP[notification.type] || 'notes';
        }
        _notifications.unshift(notification);
        if (_notifications.length > 50) _notifications = _notifications.slice(0, 50);
        saveNotifications();
        renderBadge();
        if (_isOpen) renderPanel();
    }

    /* ===== Başka kullanıcıya bildirim gönder ===== */
    function addNotificationForUser(email, notification) {
        var key = 'user_' + email + '_notifications';
        var list = [];
        try {
            var stored = localStorage.getItem(key);
            list = stored ? JSON.parse(stored) : [];
        } catch (e) { list = []; }

        /* Aynı id ile daha önce eklenmişse tekrar ekleme */
        if (notification.id) {
            var exists = list.some(function (n) { return n.id === notification.id; });
            if (exists) return;
        }
        if (!notification.section && notification.type) {
            notification.section = TYPE_SECTION_MAP[notification.type] || 'notes';
        }
        list.unshift(notification);
        if (list.length > 50) list = list.slice(0, 50);
        try {
            localStorage.setItem(key, JSON.stringify(list));
        } catch (e) { }
    }

    /* ===== Badge (Unread Count) ===== */
    function renderBadge() {
        var badge = document.getElementById('notif-badge');
        if (!badge) return;
        var unread = _notifications.filter(function (n) { return !n.read; }).length;
        if (unread > 0) {
            badge.textContent = unread > 9 ? '9+' : unread;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    /* ===== Panel Açma/Kapama ===== */
    function togglePanel() {
        var panel = document.getElementById('notif-panel');
        var btn = document.getElementById('notif-floating-btn');
        if (!panel) return;

        // Paneli açmadan önce bildirimleri yeniden yükle (başka sekmeden gelen güncellemeler için)
        loadNotifications();

        _isOpen = !_isOpen;
        if (_isOpen) {
            // Diğer açılır menüleri kapat
            var otherMenus = document.querySelectorAll('.notum-more-dropdown');
            otherMenus.forEach(function (m) {
                m.style.display = 'none';
            });

            renderPanel();
            panel.classList.add('open');
            btn.classList.add('active');
        } else {
            panel.classList.remove('open');
            btn.classList.remove('active');
        }
    }

    function closePanel() {
        var panel = document.getElementById('notif-panel');
        var btn = document.getElementById('notif-floating-btn');
        if (panel) panel.classList.remove('open');
        if (btn) btn.classList.remove('active');
        _isOpen = false;
    }

    /* Dışarıya tıklayınca kapat */
    function setupOutsideClick() {
        document.addEventListener('click', function (e) {
            var panel = document.getElementById('notif-panel');
            var btn = document.getElementById('notif-floating-btn');
            if (!panel || !btn || !_isOpen) return;
            if (!panel.contains(e.target) && !btn.contains(e.target)) {
                closePanel();
            }
        });
    }

    /* ===== Panel İçeriği ===== */
    function renderPanel() {
        var list = document.getElementById('notif-list');
        if (!list) return;

        if (_notifications.length === 0) {
            list.innerHTML =
                '<div class="notif-empty">' +
                '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' +
                '<p>Henüz bildirim yok</p>' +
                '</div>';
            return;
        }

        var html = '';
        _notifications.forEach(function (n, i) {
            var icon = getIcon(n.type);
            var timeAgo = formatTimeAgo(n.time);
            var readClass = n.read ? '' : ' unread';

            html +=
                '<div class="notif-item' + readClass + '" onclick="Notifications.navigateToSection(' + i + ')">' +
                '<div class="notif-item-icon ' + (n.type || 'info') + '">' + icon + '</div>' +
                '<div class="notif-item-content">' +
                '<div class="notif-item-title">' + escapeHtml(n.title) + '</div>' +
                '<div class="notif-item-msg">' + escapeHtml(n.message) + '</div>';

            /* Aksiyonlu bildirimler (davet kabul/red) */
            if (n.actions && n.actions.length > 0 && !n.actionTaken) {
                html += '<div class="notif-item-actions">';
                n.actions.forEach(function (act) {
                    var btnClass = act.style === 'danger' ? 'notif-action-btn reject' :
                        act.style === 'success' ? 'notif-action-btn accept' : 'notif-action-btn';
                    html += '<button class="' + btnClass + '" onclick="event.stopPropagation(); Notifications.handleAction(' + i + ', \'' + act.action + '\')">' + escapeHtml(act.label) + '</button>';
                });
                html += '</div>';
            } else if (n.actionTaken) {
                var statusClass = n.actionTaken === 'accepted' ? 'notif-action-status accepted' : 'notif-action-status rejected';
                var statusText = n.actionTaken === 'accepted' ? '✓ Kabul edildi' : '✕ Reddedildi';
                html += '<div class="' + statusClass + '">' + statusText + '</div>';
            }

            html +=
                '<div class="notif-item-time">' + timeAgo + '</div>' +
                '</div>' +
                '<button class="notif-item-dismiss" onclick="event.stopPropagation(); Notifications.dismiss(' + i + ')" title="Kaldır">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                '</button>' +
                '</div>';
        });
        list.innerHTML = html;
    }

    function getIcon(type) {
        switch (type) {
            case 'reminder':
                return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
            case 'success':
                return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
            case 'warning':
                return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
            case 'team_invite':
            case 'team_response':
                return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
            default: // info
                return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
        }
    }

    /* ===== Okundu İşaretle ===== */
    function markRead(index) {
        if (_notifications[index]) {
            _notifications[index].read = true;
            saveNotifications();
            renderBadge();
            renderPanel();
        }
    }

    /* ===== Bildirime tıklanınca ilgili bölüme yönlendir ===== */
    function navigateToSection(index) {
        if (!_notifications[index]) return;
        var n = _notifications[index];
        /* Okundu olarak işaretle */
        n.read = true;
        saveNotifications();
        renderBadge();
        /* Paneli kapat */
        closePanel();
        /* İlgili bölüme yönlendir */
        var section = n.section || TYPE_SECTION_MAP[n.type] || 'notes';
        if (typeof App !== 'undefined' && App.showSection) {
            App.showSection(section);
        }
    }

    /* ===== Aksiyon İşleme (davet kabul/red vs) ===== */
    function handleAction(index, action) {
        if (!_notifications[index]) return;
        var n = _notifications[index];

        if (action === 'accept_invite') {
            /* Daveti kabul et */
            if (n.teamId && typeof Team !== 'undefined') {
                var user = DB.currentUser();
                if (user) {
                    Team.addMemberByInvite(n.teamId, user.firstName + ' ' + user.lastName, user.email, n.inviterEmail);
                }
            }
            n.actionTaken = 'accepted';
            n.read = true;
            saveNotifications();
            renderBadge();
            renderPanel();
            if (typeof Toast !== 'undefined') Toast.show('Ekibe başarıyla katıldınız!', 'success');

            /* Yöneticiye bildirim gönder */
            if (n.inviterEmail) {
                var currentUser = DB.currentUser();
                var memberName = currentUser ? currentUser.firstName + ' ' + currentUser.lastName : 'Üye';
                addNotificationForUser(n.inviterEmail, {
                    id: 'invite_response_' + n.teamId + '_' + Date.now(),
                    type: 'team_response',
                    title: 'Davet kabul edildi',
                    message: memberName + ' ekip davetini kabul etti.',
                    time: new Date().toISOString(),
                    read: false
                });
            }

        } else if (action === 'reject_invite') {
            /* Daveti reddet */
            n.actionTaken = 'rejected';
            n.read = true;
            saveNotifications();
            renderBadge();
            renderPanel();
            if (typeof Toast !== 'undefined') Toast.show('Davet reddedildi.', 'info');

            /* Yöneticiye bildirim gönder */
            if (n.inviterEmail) {
                var currentUser2 = DB.currentUser();
                var memberName2 = currentUser2 ? currentUser2.firstName + ' ' + currentUser2.lastName : 'Üye';
                addNotificationForUser(n.inviterEmail, {
                    id: 'invite_reject_' + n.teamId + '_' + Date.now(),
                    type: 'team_response',
                    title: 'Davet reddedildi',
                    message: memberName2 + ' ekip davetini reddetti.',
                    time: new Date().toISOString(),
                    read: false
                });
            }
        }
    }

    /* ===== Tümünü Okundu Yap ===== */
    function markAllRead() {
        _notifications.forEach(function (n) { n.read = true; });
        saveNotifications();
        renderBadge();
        renderPanel();
    }

    /* ===== Bildirim Kaldır ===== */
    function dismiss(index) {
        _notifications.splice(index, 1);
        saveNotifications();
        renderBadge();
        renderPanel();
    }

    /* ===== Tümünü Temizle – Onay Modalı Göster ===== */
    function clearAll() {
        if (_notifications.length === 0) return;
        var overlay = document.getElementById('notif-clear-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            requestAnimationFrame(function () {
                overlay.classList.add('active');
            });
        }
    }

    /* Onaylandığında tüm bildirimleri sil */
    function confirmClearAll() {
        _notifications = [];
        saveNotifications();
        renderBadge();
        renderPanel();
        closeClearModal();
    }

    /* Onay modalını kapat */
    function closeClearModal() {
        var overlay = document.getElementById('notif-clear-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(function () {
                overlay.style.display = 'none';
            }, 250);
        }
    }

    /* ===== Bildirimleri yeniden yükle (örn. login sonrası) ===== */
    function reload() {
        loadNotifications();
        renderBadge();
        if (_isOpen) renderPanel();
    }

    /* ===== Yardımcı Fonksiyonlar ===== */
    function formatTimeAgo(isoStr) {
        try {
            var date = new Date(isoStr);
            var now = new Date();
            var diff = Math.floor((now - date) / 1000);
            if (diff < 60) return 'Az önce';
            if (diff < 3600) return Math.floor(diff / 60) + ' dk önce';
            if (diff < 86400) return Math.floor(diff / 3600) + ' saat önce';
            if (diff < 604800) return Math.floor(diff / 86400) + ' gün önce';
            return date.toLocaleDateString('tr-TR');
        } catch (e) {
            return '';
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    return {
        init: init,
        togglePanel: togglePanel,
        closePanel: closePanel,
        markRead: markRead,
        markAllRead: markAllRead,
        navigateToSection: navigateToSection,
        dismiss: dismiss,
        clearAll: clearAll,
        confirmClearAll: confirmClearAll,
        closeClearModal: closeClearModal,
        addNotification: addNotification,
        addNotificationForUser: addNotificationForUser,
        handleAction: handleAction,
        reload: reload
    };
})();
