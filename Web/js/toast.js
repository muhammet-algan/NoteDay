/* =============================================
   BİLDİRİM (TOAST) SİSTEMİ
   Uygulama içi bildirimler için kullanılan
   profesyonel bildirim sistemi.
   Bilgi, uyarı, hata ve başarı bildirimleri gösterir.
   ============================================= */
var Toast = (function () {
    'use strict';

    /* Bildirimlerin ekleneceği ana kapsayıcı */
    var container = null;

    /* Bildirim kapsayıcısını oluşturma veya mevcut olanı döndürme */
    function getContainer() {
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Bildirim gösterme
     * @param {string} message - Gösterilecek mesaj
     * @param {string} type - Bildirim tipi: 'info' | 'warning' | 'error' | 'success'
     * @param {number} duration - Otomatik kapanma süresi (ms), varsayılan 4000, 0 = manuel kapanma
     */
    function show(message, type, duration) {
        type = type || 'info';
        duration = duration !== undefined ? duration : 4000;

        /* Bildirim elemanını oluştur */
        var toastEl = document.createElement('div');
        toastEl.className = 'toast toast-' + type;

        /* Her bildirim tipi için SVG ikon tanımları */
        var icons = {
            info: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
            warning: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>',
            error: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
            success: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>'
        };

        /* Bildirim HTML yapısını oluştur (ikon + mesaj + kapatma butonu + ilerleme çubuğu) */
        toastEl.innerHTML =
            '<div class="toast-icon">' + (icons[type] || icons.info) + '</div>' +
            '<div class="toast-body">' +
            '<div class="toast-message">' + message + '</div>' +
            '</div>' +
            '<button class="toast-close" onclick="Toast.dismiss(this.parentElement)">' +
            '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
            '</button>' +
            '<div class="toast-progress"><div class="toast-progress-bar"></div></div>';

        /* Bildirimi kapsayıcıya ekle */
        var cont = getContainer();
        cont.appendChild(toastEl);

        /* Giriş animasyonunu tetikle */
        requestAnimationFrame(function () {
            toastEl.classList.add('toast-show');
        });

        /* İlerleme çubuğu animasyonu ve otomatik kapanma zamanlayıcısı */
        if (duration > 0) {
            var bar = toastEl.querySelector('.toast-progress-bar');
            if (bar) {
                bar.style.transition = 'width ' + duration + 'ms linear';
                requestAnimationFrame(function () {
                    bar.style.width = '0%';
                });
            }

            setTimeout(function () {
                dismiss(toastEl);
            }, duration);
        }

        return toastEl;
    }

    /* Bildirimi kapatma animasyonu ve DOM'dan kaldırma */
    function dismiss(toastEl) {
        if (!toastEl || toastEl._dismissed) return;
        toastEl._dismissed = true;
        toastEl.classList.add('toast-exit');
        setTimeout(function () {
            if (toastEl.parentElement) {
                toastEl.parentElement.removeChild(toastEl);
            }
        }, 350);
    }

    /* Kısayol fonksiyonları - Bilgi bildirimi */
    function info(msg, dur) { return show(msg, 'info', dur); }
    /* Kısayol fonksiyonları - Uyarı bildirimi */
    function warning(msg, dur) { return show(msg, 'warning', dur); }
    /* Kısayol fonksiyonları - Hata bildirimi */
    function error(msg, dur) { return show(msg, 'error', dur); }
    /* Kısayol fonksiyonları - Başarı bildirimi */
    function success(msg, dur) { return show(msg, 'success', dur); }

    /**
     * Hatırlatıcı uyarı toast'u gösterme
     * Otomatik kapanmaz, "İncele" ve "Tamam" butonları içerir.
     * @param {string} message - Gösterilecek hatırlatıcı mesajı
     */
    function showReminder(message) {
        var toastEl = document.createElement('div');
        toastEl.className = 'toast toast-warning';

        /* Çan ikonu (hatırlatıcı için) */
        var bellIcon = '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';

        toastEl.innerHTML =
            '<div class="toast-icon">' + bellIcon + '</div>' +
            '<div class="toast-body">' +
            '<div class="toast-message">' + message + '</div>' +
            '<div class="toast-actions">' +
            '<button class="toast-btn toast-btn-inspect" id="toast-reminder-inspect">İncele</button>' +
            '<button class="toast-btn toast-btn-ok" id="toast-reminder-ok">Tamam</button>' +
            '</div>' +
            '</div>';

        var cont = getContainer();
        cont.appendChild(toastEl);

        /* Giriş animasyonunu tetikle */
        requestAnimationFrame(function () {
            toastEl.classList.add('toast-show');
        });

        /* "Tamam" butonu - toast'u kapatır */
        var okBtn = toastEl.querySelector('#toast-reminder-ok');
        if (okBtn) {
            okBtn.addEventListener('click', function () {
                dismiss(toastEl);
            });
        }

        /* "İncele" butonu - Hatırlatıcılar bölümüne gider ve toast'u kapatır */
        var inspectBtn = toastEl.querySelector('#toast-reminder-inspect');
        if (inspectBtn) {
            inspectBtn.addEventListener('click', function () {
                dismiss(toastEl);
                if (typeof App !== 'undefined' && App.showSection) {
                    App.showSection('reminders');
                }
            });
        }

        return toastEl;
    }

    /* Dışarıya açılan fonksiyonlar */
    return {
        show: show,
        dismiss: dismiss,
        info: info,
        warning: warning,
        error: error,
        success: success,
        showReminder: showReminder
    };
})();
