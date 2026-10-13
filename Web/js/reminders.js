/* ========================================
   HATIRLATICI MODÜLÜ (Windows Clock + Microsoft To Do Tarzı)
   Alarm tarzı saat spinner, tarih seçimi, ses seçimi,
   detay görünümü ve sade liste ile hatırlatıcı yönetimi.
   ======================================== */
var Reminders = (function () {
    'use strict';

    /* localStorage anahtarı */
    var STORAGE_KEY = 'reminders';
    /* Alarm kontrol zamanlayıcısı */
    var checkInterval = null;
    /* Web Audio API context'i */
    var audioCtx = null;
    /* Çalan sesleri takip et (üst üste çalmayı önle) */
    var activeOscillators = [];
    var activeTimeouts = [];

    /* Saat seçici durumu */
    var currentHour = 7;
    var currentMinute = 0;
    /* Takvimden seçilen özel tarih (YYYY-MM-DD) */
    var selectedCustomDate = null;
    /* Düzenleme modu (null veya hatırlatıcı id) */
    var editingId = null;
    /* Tekrar modu (null, 'everyday', 'everyweek') */
    var selectedRepeat = null;
    /* Aktif filtre ('all', 'today', 'tomorrow', 'this-week', 'important', 'past') */
    var currentFilter = 'all';

    /* Türkçe gün ve ay isimleri */
    var DAY_NAMES = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    var DAY_NAMES_FULL = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    var MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    var MONTH_NAMES_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

    /* ---- VERİ İŞLEMLERİ ---- */

    function getReminders() {
        return DB.getForUser(STORAGE_KEY) || [];
    }

    function saveReminders(reminders) {
        DB.setForUser(STORAGE_KEY, reminders);
    }

    /* ---- BAŞLATMA ---- */

    function init() {
        if (typeof ReminderCalendar !== 'undefined') {
            ReminderCalendar.init();
        }
        startAlarmChecker();

        /* Karakter sınırı – JS seviyesinde ek güvenlik */
        var titleInput = document.getElementById('reminder-title');
        if (titleInput) {
            titleInput.addEventListener('input', function () {
                if (this.value.length > 50) this.value = this.value.slice(0, 50);
            });
        }
        var noteInput = document.getElementById('reminder-note');
        if (noteInput) {
            noteInput.addEventListener('input', function () {
                if (this.value.length > 240) this.value = this.value.slice(0, 240);
            });
        }
    }

    /* ---- SAAT SPİNNER ---- */

    function updateTimeDisplay() {
        var hourEl = document.getElementById('reminder-hour-display');
        var minEl = document.getElementById('reminder-minute-display');
        if (hourEl) hourEl.textContent = String(currentHour).padStart(2, '0');
        if (minEl) minEl.textContent = String(currentMinute).padStart(2, '0');
    }

    function incrementHour() {
        currentHour = (currentHour + 1) % 24;
        updateTimeDisplay();
    }

    function decrementHour() {
        currentHour = (currentHour - 1 + 24) % 24;
        updateTimeDisplay();
    }

    function incrementMinute() {
        currentMinute = (currentMinute + 1) % 60;
        updateTimeDisplay();
    }

    function decrementMinute() {
        currentMinute = (currentMinute - 1 + 60) % 60;
        updateTimeDisplay();
    }

    /* ---- TARİH SEÇİMİ (Select dropdown) ---- */

    /* Bugünün tarih stringi */
    function todayStr() {
        var now = new Date();
        return now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0');
    }

    /* Yarının tarih stringi */
    function tomorrowStr() {
        var d = new Date();
        d.setDate(d.getDate() + 1);
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    }

    /* Gün adı yardımcı */
    function getDayName(dateStr) {
        if (!dateStr) return '';
        var parts = dateStr.split('-');
        var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return DAY_NAMES[d.getDay()];
    }

    /* Tarih dropdown aç/kapat */
    function toggleDateDropdown() {
        var dd = document.getElementById('reminder-date-dropdown');
        if (!dd) return;
        var isOpen = dd.style.display !== 'none';
        dd.style.display = isOpen ? 'none' : 'block';

        if (!isOpen) {
            /* Gün isimlerini ayarla */
            var todayDay = document.getElementById('date-opt-today-day');
            var tomDay = document.getElementById('date-opt-tomorrow-day');
            if (todayDay) todayDay.textContent = getDayName(todayStr());
            if (tomDay) tomDay.textContent = getDayName(tomorrowStr());
        }
    }

    /* Tarih seçeneği seçildiğinde */
    function selectDateOption(option) {
        var dd = document.getElementById('reminder-date-dropdown');
        if (dd) dd.style.display = 'none';

        if (option === 'today') {
            selectedCustomDate = todayStr();
            selectedRepeat = null;
            updateDateTrigger('Bugün', getDayName(todayStr()));
        } else if (option === 'tomorrow') {
            selectedCustomDate = tomorrowStr();
            selectedRepeat = null;
            updateDateTrigger('Yarın', getDayName(tomorrowStr()));
        } else if (option === 'everyday') {
            selectedCustomDate = todayStr();
            selectedRepeat = 'everyday';
            updateDateTrigger('Her gün', '');
        } else if (option === 'everyweek') {
            selectedCustomDate = todayStr();
            selectedRepeat = 'everyweek';
            updateDateTrigger('Her hafta', getDayName(todayStr()));
        } else if (option === 'pick') {
            selectedRepeat = null;
            openCalendar();
        }
    }

    /* Tarih trigger metnini güncelle */
    function updateDateTrigger(label, dayName) {
        var labelEl = document.getElementById('reminder-date-label');
        var dayEl = document.getElementById('reminder-date-day');
        if (labelEl) labelEl.textContent = label || 'Bugün';
        if (dayEl) dayEl.textContent = dayName || '';
    }

    /* Tarih trigger'ını mevcut selectedCustomDate'e göre güncelle */
    function updateDateSelect() {
        if (selectedRepeat === 'everyday') {
            updateDateTrigger('Her gün', '');
        } else if (selectedRepeat === 'everyweek') {
            updateDateTrigger('Her hafta', getDayName(selectedCustomDate));
        } else if (selectedCustomDate === todayStr()) {
            updateDateTrigger('Bugün', getDayName(todayStr()));
        } else if (selectedCustomDate === tomorrowStr()) {
            updateDateTrigger('Yarın', getDayName(tomorrowStr()));
        } else if (selectedCustomDate) {
            updateDateTrigger(formatDateDisplay(selectedCustomDate), getDayName(selectedCustomDate));
        }
    }

    /* Tarih stringini görüntüleme formatına çevirme */
    function formatDateDisplay(dateStr) {
        if (!dateStr) return '';
        var parts = dateStr.split('-');
        var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return parseInt(parts[2]) + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + parts[0] +
            ' ' + DAY_NAMES[d.getDay()];
    }

    /* Kısa tarih bilgisi (kart için) */
    function formatDateShort(dateStr) {
        if (!dateStr) return '';
        var parts = dateStr.split('-');
        var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return parseInt(parts[2]) + ' ' + MONTH_NAMES_SHORT[d.getMonth()] + ', ' + DAY_NAMES[d.getDay()];
    }

    /* ---- TAKVİM MODALI ---- */

    function openCalendar() {
        var modal = document.getElementById('reminder-calendar-modal');
        if (modal) {
            modal.style.display = 'flex';
            if (typeof ReminderCalendar !== 'undefined') {
                ReminderCalendar.render();
            }
        }
    }

    function closeCalendar() {
        var modal = document.getElementById('reminder-calendar-modal');
        if (modal) modal.style.display = 'none';
    }

    function confirmCalendarDate() {
        if (typeof ReminderCalendar !== 'undefined') {
            var date = ReminderCalendar.getSelectedDate();
            if (date) {
                var y = date.getFullYear();
                var m = String(date.getMonth() + 1).padStart(2, '0');
                var d = String(date.getDate()).padStart(2, '0');
                selectedCustomDate = y + '-' + m + '-' + d;
                updateDateSelect();
            }
        }
        closeCalendar();
    }

    /* Ses isimleri haritası */
    var SOUND_NAMES = {
        bell: 'Çan', xylophone: 'Ksilofon', chord: 'Akor', beep: 'Tıkırtı',
        chime: 'Cıngıl', melody: 'Melodi', transition: 'Geçiş', descend: 'Azalan',
        wave: 'Dalga', digital: 'Dijital', echo: 'Eko', none: 'Sessiz'
    };

    /* Ses dropdown aç/kapat */
    function toggleSoundDropdown() {
        var dd = document.getElementById('reminder-sound-dropdown');
        if (!dd) return;
        var isOpen = dd.style.display !== 'none';
        dd.style.display = isOpen ? 'none' : 'block';
    }

    /* Ses trigger metnini güncelle */
    function updateSoundTrigger(sound) {
        var labelEl = document.getElementById('reminder-sound-label');
        if (labelEl) labelEl.textContent = SOUND_NAMES[sound] || 'Çan';
    }

    /* Ses satırına tıklandığında: seç + önizle */
    function selectSound(sound) {
        var soundEl = document.getElementById('reminder-sound');
        if (soundEl) soundEl.value = sound;

        /* Aktif sınıfını güncelle */
        var rows = document.querySelectorAll('.reminder-sound-row');
        for (var i = 0; i < rows.length; i++) {
            rows[i].classList.remove('active');
            if (rows[i].getAttribute('data-sound') === sound) {
                rows[i].classList.add('active');
            }
        }

        /* Trigger label'ını güncelle */
        updateSoundTrigger(sound);

        /* Sesi çal (sessiz hariç) */
        if (sound !== 'none') {
            playAlarmSound(sound);
        }
    }

    /* Ses listesindeki aktif satırı güncelle */
    function updateSoundList(sound) {
        var rows = document.querySelectorAll('.reminder-sound-row');
        for (var i = 0; i < rows.length; i++) {
            rows[i].classList.remove('active');
            if (rows[i].getAttribute('data-sound') === sound) {
                rows[i].classList.add('active');
            }
        }
        updateSoundTrigger(sound);
    }

    /* ---- MODAL (YENİ/DÜZENLE) ---- */

    function openModal() {
        editingId = null;
        currentHour = new Date().getHours();
        currentMinute = 0;
        selectedCustomDate = todayStr();
        selectedRepeat = null;

        /* Input alanlarını sıfırla */
        var titleEl = document.getElementById('reminder-title');
        if (titleEl) titleEl.value = '';
        var soundEl = document.getElementById('reminder-sound');
        if (soundEl) soundEl.value = 'bell';
        var noteEl = document.getElementById('reminder-note');
        if (noteEl) noteEl.value = '';

        /* Tarih trigger'ını sıfırla */
        updateDateTrigger('Bugün', getDayName(todayStr()));

        /* Ses trigger/dropdown sıfırla */
        updateSoundList('bell');
        var soundDd = document.getElementById('reminder-sound-dropdown');
        if (soundDd) soundDd.style.display = 'none';

        updateTimeDisplay();

        var headerEl = document.querySelector('.reminder-modal-header h3');
        if (headerEl) headerEl.textContent = 'Yeni Hatırlatıcı';

        var overlay = document.getElementById('reminder-modal-overlay');
        if (overlay) overlay.style.display = 'flex';
    }

    function openEditModal(id) {
        var reminders = getReminders();
        var reminder = null;
        for (var i = 0; i < reminders.length; i++) {
            if (reminders[i].id === id) { reminder = reminders[i]; break; }
        }
        if (!reminder) return;

        editingId = id;
        currentHour = reminder.hour || 0;
        currentMinute = reminder.minute || 0;
        selectedCustomDate = reminder.customDate || todayStr();
        selectedRepeat = reminder.repeat || null;

        var titleEl = document.getElementById('reminder-title');
        if (titleEl) titleEl.value = reminder.title || '';
        var soundEl = document.getElementById('reminder-sound');
        if (soundEl) soundEl.value = reminder.sound || 'bell';
        var noteEl = document.getElementById('reminder-note');
        if (noteEl) noteEl.value = reminder.note || '';

        updateTimeDisplay();
        updateDateSelect();
        updateSoundList(reminder.sound || 'bell');

        var headerEl = document.querySelector('.reminder-modal-header h3');
        if (headerEl) headerEl.textContent = 'Hatırlatıcıyı Düzenle';

        var overlay = document.getElementById('reminder-modal-overlay');
        if (overlay) overlay.style.display = 'flex';
    }

    function closeModal() {
        var overlay = document.getElementById('reminder-modal-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    /* ---- DETAY GÖRÜNÜMÜ ---- */

    function openDetail(id) {
        var reminders = getReminders();
        var r = null;
        for (var i = 0; i < reminders.length; i++) {
            if (reminders[i].id === id) { r = reminders[i]; break; }
        }
        if (!r) return;

        var timeStr = String(r.hour || 0).padStart(2, '0') + ':' + String(r.minute || 0).padStart(2, '0');
        var dateText = formatDateDisplay(r.customDate);

        var soundText = SOUND_NAMES[r.sound] || 'Çan';

        var html = '<div class="reminder-detail-overlay" id="reminder-detail-overlay" onclick="Reminders.closeDetail()">';
        html += '<div class="reminder-detail-panel" onclick="event.stopPropagation()">';

        /* Başlık */
        html += '<div class="reminder-detail-header">';
        html += '<h3>' + escapeHtml(r.title || 'Hatırlatıcı') + '</h3>';
        html += '<button class="reminder-modal-close" onclick="Reminders.closeDetail()">';
        html += '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        html += '</button>';
        html += '</div>';

        /* Detay bilgileri */
        html += '<div class="reminder-detail-body">';

        /* Saat */
        html += '<div class="reminder-detail-row">';
        html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
        html += '<span>' + timeStr + '</span>';
        html += '</div>';

        /* Tarih */
        if (dateText) {
            html += '<div class="reminder-detail-row">';
            html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
            html += '<span>' + dateText + '</span>';
            html += '</div>';
        }

        /* Tekrar modu */
        if (r.repeat === 'everyday' || r.repeat === 'everyweek') {
            var repeatText = r.repeat === 'everyday' ? 'Her gün' : 'Her hafta';
            html += '<div class="reminder-detail-row">';
            html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>';
            html += '<span>' + repeatText + '</span>';
            html += '</div>';
        }

        /* Ses */
        html += '<div class="reminder-detail-row">';
        html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
        html += '<span>' + soundText + '</span>';
        html += '</div>';

        /* Not */
        if (r.note) {
            html += '<div class="reminder-detail-note">';
            html += '<div class="reminder-detail-note-label">Not</div>';
            html += '<div class="reminder-detail-note-text">' + escapeHtml(r.note) + '</div>';
            html += '</div>';
        }

        /* Durum */
        html += '<div class="reminder-detail-row">';
        html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>';
        var statusText = r.enabled === false ? 'Pasif' : (r.triggered ? 'Tamamlandı' : 'Aktif');
        html += '<span>' + statusText + '</span>';
        html += '</div>';

        html += '</div>';

        /* Alt butonlar */
        html += '<div class="reminder-detail-footer">';
        html += '<button class="reminder-detail-edit-btn" onclick="Reminders.closeDetail(); Reminders.openEditModal(' + r.id + ')">';
        html += '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
        html += 'Düzenle';
        html += '</button>';
        html += '<button class="reminder-detail-delete-btn" onclick="Reminders.closeDetail(); Reminders.deleteReminder(' + r.id + ')">';
        html += '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
        html += 'Sil';
        html += '</button>';
        html += '</div>';

        html += '</div></div>';

        /* Detay panelini DOM'a ekle */
        var existing = document.getElementById('reminder-detail-overlay');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', html);
    }

    function closeDetail() {
        var el = document.getElementById('reminder-detail-overlay');
        if (el) el.remove();
    }

    /* ---- KAYDETME ---- */

    function save() {
        var titleEl = document.getElementById('reminder-title');
        var soundEl = document.getElementById('reminder-sound');
        var noteEl = document.getElementById('reminder-note');
        var title = titleEl ? titleEl.value.trim() : '';
        var sound = soundEl ? soundEl.value : 'bell';
        var note = noteEl ? noteEl.value.trim() : '';

        if (!title) {
            Toast.warning('Lütfen bir başlık girin.');
            return;
        }

        /* Tarih yoksa bugünü kullan */
        if (!selectedCustomDate) {
            selectedCustomDate = todayStr();
        }

        var reminders = getReminders();

        if (editingId !== null) {
            for (var i = 0; i < reminders.length; i++) {
                if (reminders[i].id === editingId) {
                    reminders[i].title = title;
                    reminders[i].hour = currentHour;
                    reminders[i].minute = currentMinute;
                    reminders[i].customDate = selectedCustomDate;
                    reminders[i].repeat = selectedRepeat;
                    reminders[i].sound = sound;
                    reminders[i].note = note;
                    reminders[i].triggered = false;
                    break;
                }
            }
            Toast.success('Hatırlatıcı güncellendi!');
        } else {
            var reminder = {
                id: Date.now(),
                title: title,
                hour: currentHour,
                minute: currentMinute,
                customDate: selectedCustomDate,
                repeat: selectedRepeat,
                sound: sound,
                note: note,
                enabled: true,
                triggered: false,
                createdAt: new Date().toISOString()
            };
            reminders.unshift(reminder);
            Toast.success('Hatırlatıcı oluşturuldu!');
        }

        saveReminders(reminders);
        editingId = null;
        closeModal();
        render();
    }

    /* ---- SİLME & TOGGLE ---- */

    function deleteReminder(id) {
        confirmDeleteReminder(id);
    }

    /* Silme onay modalını gösterme */
    function confirmDeleteReminder(id) {
        var reminders = getReminders();
        var r = null;
        for (var i = 0; i < reminders.length; i++) {
            if (reminders[i].id === id) { r = reminders[i]; break; }
        }
        if (!r) return;

        var timeStr = String(r.hour).padStart(2, '0') + ':' + String(r.minute).padStart(2, '0');
        var dateStr = r.customDate ? formatDateDisplay(r.customDate) : '-';

        var html = '<div class="modal-overlay" onclick="Reminders.closeDeleteModal()">' +
            '<div class="modal-content confirm-modal" onclick="event.stopPropagation()">' +
            '<div class="confirm-modal-icon">⚠️</div>' +
            '<h3 class="confirm-modal-title">Hatırlatıcıyı Silmek İstediğinizden Emin Misiniz?</h3>' +
            '<div class="confirm-modal-detail">' +
            '<div class="confirm-detail-row">' +
            '<span class="confirm-detail-label">Başlık:</span>' +
            '<span class="confirm-detail-value">' + escapeHtml(r.title) + '</span>' +
            '</div>' +
            '<div class="confirm-detail-row">' +
            '<span class="confirm-detail-label">Saat:</span>' +
            '<span class="confirm-detail-value">' + timeStr + '</span>' +
            '</div>' +
            '<div class="confirm-detail-row">' +
            '<span class="confirm-detail-label">Tarih:</span>' +
            '<span class="confirm-detail-value">' + dateStr + '</span>' +
            '</div>' +
            '</div>' +
            '<p class="confirm-modal-warning">Bu işlem geri alınamaz.</p>' +
            '<div class="confirm-modal-actions">' +
            '<button class="btn btn-secondary" onclick="Reminders.closeDeleteModal()">İptal</button>' +
            '<button class="btn btn-danger" onclick="Reminders.doDeleteReminder(' + id + ')">Sil</button>' +
            '</div></div></div>';

        var container = document.getElementById('reminder-delete-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'reminder-delete-modal-container';
            document.body.appendChild(container);
        }
        container.innerHTML = html;
    }

    /* Silme onay modalını kapatma */
    function closeDeleteModal() {
        var container = document.getElementById('reminder-delete-modal-container');
        if (container) container.innerHTML = '';
    }

    /* Gerçek silme işlemi */
    function doDeleteReminder(id) {
        var original = getReminders().find(function (r) { return r.id === id; });
        if (original && typeof Trash !== 'undefined') {
            Trash.addToTrash('reminder', id, original.title || 'Adsız Hatırlatıcı', original.customDate || '', original);
        }
        var reminders = getReminders().filter(function (r) { return r.id !== id; });
        saveReminders(reminders);
        closeDeleteModal();
        render();
        Toast.info('Hatırlatıcı silindi.');
    }

    function toggleReminder(id, event) {
        if (event) event.stopPropagation();
        var reminders = getReminders();
        for (var i = 0; i < reminders.length; i++) {
            if (reminders[i].id === id) {
                reminders[i].enabled = !reminders[i].enabled;
                if (reminders[i].enabled) reminders[i].triggered = false;
                break;
            }
        }
        saveReminders(reminders);
        render();
    }

    /* ---- FİLTRELEME ---- */

    function setFilter(filter) {
        currentFilter = filter;

        /* Aktif buton stilini güncelle */
        var btns = document.querySelectorAll('#reminder-filters .filter-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.remove('active');
            if (btns[i].getAttribute('data-filter') === filter) {
                btns[i].classList.add('active');
            }
        }

        render();
    }

    /* Hafta başlangıç/bitiş (Pzt-Paz) */
    function getWeekRange() {
        var now = new Date();
        var dayOfWeek = now.getDay(); /* 0=Paz, 1=Pzt, ... 6=Cmt */
        var diffToMon = (dayOfWeek === 0) ? -6 : (1 - dayOfWeek);
        var monday = new Date(now);
        monday.setDate(now.getDate() + diffToMon);
        monday.setHours(0, 0, 0, 0);

        var sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return {
            startStr: monday.getFullYear() + '-' + String(monday.getMonth() + 1).padStart(2, '0') + '-' + String(monday.getDate()).padStart(2, '0'),
            endStr: sunday.getFullYear() + '-' + String(sunday.getMonth() + 1).padStart(2, '0') + '-' + String(sunday.getDate()).padStart(2, '0')
        };
    }

    function filterReminders(reminders, today, tomorrow) {
        if (currentFilter === 'all') return reminders;

        var week = null;
        if (currentFilter === 'this-week') week = getWeekRange();

        return reminders.filter(function (r) {
            var date = r.customDate || '';

            switch (currentFilter) {
                case 'today':
                    if (r.repeat === 'everyday') return true;
                    if (r.repeat === 'everyweek') {
                        var now = new Date();
                        var parts = date.split('-');
                        var created = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                        return now.getDay() === created.getDay();
                    }
                    return date === today;

                case 'tomorrow':
                    if (r.repeat === 'everyday') return true;
                    if (r.repeat === 'everyweek') {
                        var tom = new Date();
                        tom.setDate(tom.getDate() + 1);
                        var p = date.split('-');
                        var c = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
                        return tom.getDay() === c.getDay();
                    }
                    return date === tomorrow;

                case 'this-week':
                    if (r.repeat === 'everyday' || r.repeat === 'everyweek') return true;
                    return date >= week.startStr && date <= week.endStr;

                case 'important':
                    return r.important === true;

                case 'past':
                    if (r.repeat) return false; /* Tekrarlayanlar geçmişe düşmez */
                    if (r.triggered === true) return true;
                    if (date < today) return true;
                    /* Bugünün saati geçmiş alarmları da geçmişte göster */
                    if (date === today) {
                        var now = new Date();
                        var reminderMinutes = (r.hour || 0) * 60 + (r.minute || 0);
                        var currentMinutes = now.getHours() * 60 + now.getMinutes();
                        return reminderMinutes < currentMinutes;
                    }
                    return false;

                case 'completed':
                    return (r.enabled === false && r.triggered === true);

                default:
                    return true;
            }
        });
    }

    /* ---- RENDER ---- */

    function render() {
        var container = document.getElementById('reminder-content');
        if (!container) return;

        var reminders = getReminders();

        /* Filtreleme */
        var today = todayStr();
        var tomorrow = tomorrowStr();
        var filtered = filterReminders(reminders, today, tomorrow);

        /* Boş durum */
        if (filtered.length === 0) {
            var emptyMsg = reminders.length === 0
                ? 'Hatırlatıcınız yok.'
                : 'Bu filtrede hatırlatıcı bulunamadı.';
            var emptyHint = reminders.length === 0
                ? 'Yeni hatırlatıcı eklemek için + butonuna tıklayın.'
                : 'Farklı bir filtre seçmeyi deneyin.';
            container.innerHTML =
                '<div class="reminder-empty">' +
                '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>' +
                '<path d="M13.73 21a2 2 0 0 1-3.46 0"/>' +
                '</svg>' +
                '<h3>' + emptyMsg + '</h3>' +
                '<p>' + emptyHint + '</p>' +
                '</div>';
            return;
        }

        /* Akıllı sıralama: Aktif hatırlatıcılar tarihe göre üstte, tamamlanan/geçmiş altta */
        filtered.sort(function (a, b) {
            var aCompleted = (a.enabled === false && a.triggered === true);
            var bCompleted = (b.enabled === false && b.triggered === true);
            var now = new Date();
            var nowStr = todayStr();
            var aExpired = !a.repeat && !aCompleted && (a.customDate < nowStr || (a.customDate === nowStr && ((a.hour || 0) * 60 + (a.minute || 0)) < (now.getHours() * 60 + now.getMinutes())));
            var bExpired = !b.repeat && !bCompleted && (b.customDate < nowStr || (b.customDate === nowStr && ((b.hour || 0) * 60 + (b.minute || 0)) < (now.getHours() * 60 + now.getMinutes())));
            var aIsBottom = aCompleted || aExpired;
            var bIsBottom = bCompleted || bExpired;
            /* Aktif olanlar üstte, tamamlanan/geçmiş altta */
            if (aIsBottom !== bIsBottom) return aIsBottom ? 1 : -1;
            /* Aynı gruptaysa tarihe göre sırala (yakın tarih üstte) */
            var aTime = (a.customDate || '9999-12-31') + String((a.hour || 0) * 60 + (a.minute || 0)).padStart(5, '0');
            var bTime = (b.customDate || '9999-12-31') + String((b.hour || 0) * 60 + (b.minute || 0)).padStart(5, '0');
            return aTime < bTime ? -1 : (aTime > bTime ? 1 : 0);
        });

        /* Hatırlatıcı listesi */
        var html = '<div class="reminder-list-new" id="reminder-list-body">';

        filtered.forEach(function (r) {
            var timeStr = String(r.hour || 0).padStart(2, '0') + ':' + String(r.minute || 0).padStart(2, '0');
            var isEnabled = r.enabled !== false;
            var isTriggered = r.triggered === true;
            var dateShort = formatDateShort(r.customDate);
            /* Tekrar modu etiketi */
            var repeatLabel = '';
            if (r.repeat === 'everyday') repeatLabel = 'Her gün';
            else if (r.repeat === 'everyweek') repeatLabel = 'Her hafta';
            var isImportant = r.important === true;

            var cardClasses = 'reminder-card';
            if (!isEnabled) cardClasses += ' disabled';
            if (isTriggered) cardClasses += ' triggered';
            if (isImportant) cardClasses += ' important';

            html += '<div class="' + cardClasses + '" data-drag-id="' + r.id + '" onclick="Reminders.openDetail(' + r.id + ')">';

            /* Sol: Microsoft To Do tarzı daire checkbox */
            var isCompleted = (!isEnabled && isTriggered);
            html += '<div class="reminder-card-check" onclick="event.stopPropagation(); Reminders.markCompleted(' + r.id + ')">';
            if (isCompleted) {
                html += '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#6366f1" stroke="#6366f1" stroke-width="1.5"/><polyline points="7 12 10.5 15.5 17 9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            } else {
                html += '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="none" stroke="' + (isImportant ? '#f59e0b' : '#cbd5e1') + '" stroke-width="1.5"/></svg>';
            }
            html += '</div>';

            /* Orta: Başlık üstte, tarih + saat altta */
            html += '<div class="reminder-card-info">';
            html += '<div class="reminder-card-title' + (isCompleted ? ' completed' : '') + '">' + escapeHtml(r.title || 'Hatırlatıcı') + '</div>';
            html += '<div class="reminder-card-meta">';
            /* Takvim ikonu + tarih */
            html += '<span class="reminder-card-meta-item">';
            html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
            html += '<span>' + dateShort + '</span>';
            if (repeatLabel) {
                html += '<span class="reminder-repeat-badge">' + repeatLabel + '</span>';
            }
            html += '</span>';
            /* Saat ikonu + saat */
            html += '<span class="reminder-card-meta-item">';
            html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
            html += '<span>' + timeStr + '</span>';
            html += '</span>';
            if (isImportant) {
                html += '<span class="reminder-repeat-badge" style="background:#fef3c7;color:#d97706;">⭐ Önemli</span>';
            }
            html += '</div>';
            html += '</div>';

            /* Sağ: 3 dikey nokta (kebab) menü */
            html += '<button class="reminder-card-kebab" onclick="event.stopPropagation(); Reminders.showContextMenu(event, ' + r.id + ')" title="Seçenekler">';
            html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
            html += '</button>';

            html += '</div>';
        });

        html += '</div>';
        container.innerHTML = html;

        /* Sıralama otomatik yapılıyor, DragDrop kullanılmıyor */
    }

    /* ---- ALARM SİSTEMİ ---- */

    function startAlarmChecker() {
        if (checkInterval) clearInterval(checkInterval);
        checkInterval = setInterval(checkAlarms, 30000);
        setTimeout(checkAlarms, 1000);
    }

    function checkAlarms() {
        if (!Auth.isLoggedIn()) return;

        var reminders = getReminders();
        var now = new Date();
        var currentH = now.getHours();
        var currentM = now.getMinutes();
        var today = todayStr();
        var currentDayOfWeek = now.getDay();
        var changed = false;

        reminders.forEach(function (r) {
            if (r.enabled === false) return;

            /* Tekrarlayanlar için: her gün veya her hafta */
            if (r.repeat === 'everyday') {
                /* Her gün: triggered'i gün değiştiğinde sıfırla */
                if (r.lastTriggeredDate && r.lastTriggeredDate !== today) {
                    r.triggered = false;
                    changed = true;
                }
                if (!r.triggered) {
                    var rMinTotal = (r.hour || 0) * 60 + (r.minute || 0);
                    var cMinTotal = currentH * 60 + currentM;
                    if (cMinTotal >= rMinTotal && cMinTotal <= rMinTotal + 2) {
                        r.triggered = true;
                        r.lastTriggeredDate = today;
                        changed = true;
                        triggerAlarm(r);
                    }
                }
                return;
            }

            if (r.repeat === 'everyweek') {
                /* Her hafta: oluşturma gününe göre haftalık tekrar */
                var createdDate = r.customDate ? r.customDate.split('-') : null;
                if (!createdDate) return;
                var createdDay = new Date(parseInt(createdDate[0]), parseInt(createdDate[1]) - 1, parseInt(createdDate[2])).getDay();
                /* Haftanın aynı günü mü kontrol et */
                if (currentDayOfWeek !== createdDay) {
                    /* Farklı günde triggered'i sıfırla */
                    if (r.triggered && r.lastTriggeredDate && r.lastTriggeredDate !== today) {
                        r.triggered = false;
                        changed = true;
                    }
                    return;
                }
                if (r.lastTriggeredDate && r.lastTriggeredDate !== today) {
                    r.triggered = false;
                    changed = true;
                }
                if (!r.triggered) {
                    var rMinTotalW = (r.hour || 0) * 60 + (r.minute || 0);
                    var cMinTotalW = currentH * 60 + currentM;
                    if (cMinTotalW >= rMinTotalW && cMinTotalW <= rMinTotalW + 2) {
                        r.triggered = true;
                        r.lastTriggeredDate = today;
                        changed = true;
                        triggerAlarm(r);
                    }
                }
                return;
            }

            /* Normal (tek seferlik) hatırlatıcı */
            if (r.triggered) return;

            if (r.customDate) {
                /* Geçmiş tarihli hatırlatıcılar: sessizce triggered olarak işaretle, alarm ÇALMA */
                if (r.customDate < today) {
                    r.triggered = true;
                    changed = true;
                    /* Geçmiş alarm olduğu için ses ve bildirim göstermiyoruz */
                    return;
                }

                /* Bugünün hatırlatıcısı: tam zaman karşılaştırması yap */
                if (r.customDate === today) {
                    var reminderTotalMinutes = (r.hour || 0) * 60 + (r.minute || 0);
                    var currentTotalMinutes = currentH * 60 + currentM;
                    /* Alarm zamanı gelmiş veya en fazla 2 dakika geçmişse çal */
                    if (currentTotalMinutes >= reminderTotalMinutes && currentTotalMinutes <= reminderTotalMinutes + 2) {
                        r.triggered = true;
                        changed = true;
                        triggerAlarm(r);
                    }
                    /* Alarm zamanı 2 dakikadan fazla geçmişse sessizce triggered yap */
                    else if (currentTotalMinutes > reminderTotalMinutes + 2) {
                        r.triggered = true;
                        changed = true;
                    }
                }
            }
        });

        if (changed) {
            saveReminders(reminders);
            render();
        }
    }

    function triggerAlarm(reminder) {
        playAlarmSound(reminder.sound || 'bell', 3);

        var notification = document.getElementById('alarm-notification');
        var notificationNote = document.getElementById('alarm-notification-note');
        var notificationTime = document.getElementById('alarm-notification-time');

        if (notification) {
            if (notificationNote) notificationNote.textContent = reminder.title || 'Hatırlatıcı zamanı geldi!';
            var timeStr = String(reminder.hour || 0).padStart(2, '0') + ':' + String(reminder.minute || 0).padStart(2, '0');
            if (notificationTime) notificationTime.textContent = timeStr;
            notification.classList.add('show');
        }
    }

    /* ---- SES SİSTEMİ ---- */

    function playAlarmSound(soundType, repeatCount) {
        if (soundType === 'none') return;
        if (!repeatCount) repeatCount = 1;

        /* Önceki sesleri durdur (üst üste çalmayı önle) */
        stopAllSounds();

        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }

            var melodies = {
                bell: { freqs: [523.25, 659.25, 783.99, 1046.5], type: 'sine', len: 0.5 },
                xylophone: { freqs: [587.33, 784, 987.77, 1174.66, 987.77, 784], type: 'sine', len: 0.18 },
                chord: { freqs: [261.63, 329.63, 392], type: 'sine', len: 0.8 },
                beep: { freqs: [800, 800, 800], type: 'square', len: 0.15 },
                chime: { freqs: [1046.5, 1318.5, 1568, 1318.5, 1046.5], type: 'sine', len: 0.35 },
                melody: { freqs: [392, 440, 494, 523.25, 587.33, 659.25], type: 'sine', len: 0.4 },
                transition: { freqs: [440, 554.37, 659.25, 880], type: 'triangle', len: 0.3 },
                descend: { freqs: [880, 783.99, 659.25, 523.25, 440], type: 'sine', len: 0.35 },
                wave: { freqs: [349.23, 440, 523.25, 440, 349.23, 440], type: 'sine', len: 0.45 },
                digital: { freqs: [1000, 500, 1000, 500], type: 'triangle', len: 0.2 },
                echo: { freqs: [659.25, 523.25, 659.25], type: 'sine', len: 0.6 }
            };
            var cfg = melodies[soundType] || melodies.bell;

            function playSeq(delay) {
                cfg.freqs.forEach(function (freq, i) {
                    var tid = setTimeout(function () {
                        try {
                            var osc = audioCtx.createOscillator();
                            var gain = audioCtx.createGain();
                            osc.connect(gain);
                            gain.connect(audioCtx.destination);
                            osc.frequency.value = freq;
                            osc.type = cfg.type;
                            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + cfg.len);
                            osc.start(audioCtx.currentTime);
                            osc.stop(audioCtx.currentTime + cfg.len);
                            activeOscillators.push(osc);
                        } catch (e) { /* osc zaten durdurulmuş olabilir */ }
                    }, delay + i * 300);
                    activeTimeouts.push(tid);
                });
            }

            /* repeatCount kez tekrarlı çal */
            var totalDuration = cfg.freqs.length * 300;
            for (var r = 0; r < repeatCount; r++) {
                playSeq(r * (totalDuration + 800));
            }
        } catch (e) {
            console.warn('Audio not available:', e);
        }
    }

    /* Çalan tüm sesleri durdur */
    function stopAllSounds() {
        /* Bekleyen timeout'ları iptal et */
        for (var i = 0; i < activeTimeouts.length; i++) {
            clearTimeout(activeTimeouts[i]);
        }
        activeTimeouts = [];

        /* Çalan oscillator'ları durdur */
        for (var j = 0; j < activeOscillators.length; j++) {
            try {
                activeOscillators[j].stop();
            } catch (e) { /* zaten durmuş olabilir */ }
        }
        activeOscillators = [];
    }

    /* Ses önizleme */
    function previewSound() {
        var soundEl = document.getElementById('reminder-sound');
        if (soundEl) {
            playAlarmSound(soundEl.value);
        }
    }

    function dismissAlarm() {
        stopAllSounds();
        var notification = document.getElementById('alarm-notification');
        if (notification) notification.classList.remove('show');
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /* ---- SAĞ TIK BAĞLAM MENÜSÜ ---- */

    function showContextMenu(event, id) {
        event.preventDefault();
        event.stopPropagation();

        /* Mevcut menüyü kapat */
        closeContextMenu();

        /* Hatırlatıcının tamamlanma durumunu kontrol et */
        var reminders = getReminders();
        var targetReminder = null;
        for (var ri = 0; ri < reminders.length; ri++) {
            if (reminders[ri].id === id) { targetReminder = reminders[ri]; break; }
        }
        var isCompleted = targetReminder && (targetReminder.enabled === false && targetReminder.triggered === true);
        var completeLabel = isCompleted ? 'Tamamlanmadı olarak işaretle' : 'Tamamlandı olarak işaretle';

        var menu = document.createElement('div');
        menu.className = 'reminder-context-menu';
        menu.id = 'reminder-context-menu';

        /* Düzenle */
        menu.innerHTML =
            '<button class="reminder-context-item" data-action="edit">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
            '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>' +
            '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>' +
            '</svg>' +
            'Düzenle' +
            '</button>' +
            '<button class="reminder-context-item" data-action="important">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
            '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' +
            '</svg>' +
            'Önemli olarak işaretle' +
            '</button>' +
            '<button class="reminder-context-item" data-action="complete">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
            '<polyline points="20 6 9 17 4 12"/>' +
            '</svg>' +
            completeLabel +
            '</button>' +
            '<button class="reminder-context-item" data-action="toggle">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
            '<path d="M18.36 6.64A9 9 0 0 1 20.77 15"/>' +
            '<path d="M6.16 6.16a9 9 0 1 0 12.68 12.68"/>' +
            '<line x1="2" y1="2" x2="22" y2="22"/>' +
            '</svg>' +
            'Hatırlatıcıyı Kapat' +
            '</button>' +
            '<button class="reminder-context-item" data-action="shareTeam">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
            '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>' +
            '<circle cx="9" cy="7" r="4"/>' +
            '<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>' +
            '<path d="M16 3.13a4 4 0 0 1 0 7.75"/>' +
            '</svg>' +
            'Ekiple Paylaş' +
            '</button>' +
            '<div class="reminder-context-sep"></div>' +
            '<button class="reminder-context-item danger" data-action="delete">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
            '<polyline points="3 6 5 6 21 6"/>' +
            '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' +
            '</svg>' +
            'Sil' +
            '</button>';

        document.body.appendChild(menu);

        /* Konum ayarla (ekrandan taşmaması için) */
        var menuW = menu.offsetWidth;
        var menuH = menu.offsetHeight;
        var x = event.clientX;
        var y = event.clientY;

        var btnRect = event.currentTarget.getBoundingClientRect();
        if (btnRect && btnRect.top > 0 && btnRect.width < 100) { // Probably a kebab button
            x = btnRect.left;
            y = btnRect.bottom + 4;
            if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 8;
            if (y + menuH > window.innerHeight) {
                y = btnRect.top - menuH - 4;
            }
        } else {
            if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 8;
            if (y + menuH > window.innerHeight) y = window.innerHeight - menuH - 8;
        }

        if (x < 0) x = 8;
        if (y < 0) y = 8;

        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        /* Menü tıklamalarını dinle */
        menu.addEventListener('click', function (e) {
            var btn = e.target.closest('.reminder-context-item');
            if (!btn) return;
            var action = btn.getAttribute('data-action');
            closeContextMenu();

            switch (action) {
                case 'edit':
                    openEditModal(id);
                    break;
                case 'important':
                    markImportant(id);
                    break;
                case 'complete':
                    markCompleted(id);
                    break;
                case 'toggle':
                    toggleReminder(id);
                    break;
                case 'shareTeam':
                    openShareWithTeamModal(id);
                    break;
                case 'delete':
                    deleteReminder(id);
                    break;
            }
        });
    }

    function closeContextMenu() {
        var existing = document.getElementById('reminder-context-menu');
        if (existing) existing.remove();
    }

    /* Önemli olarak işaretle / işareti kaldır */
    function markImportant(id) {
        var reminders = getReminders();
        for (var i = 0; i < reminders.length; i++) {
            if (reminders[i].id === id) {
                reminders[i].important = !reminders[i].important;
                break;
            }
        }
        saveReminders(reminders);
        render();
    }

    /* Tamamlandı olarak işaretle / geri al (toggle) */
    function markCompleted(id) {
        var reminders = getReminders();
        for (var i = 0; i < reminders.length; i++) {
            if (reminders[i].id === id) {
                var isCompleted = !reminders[i].enabled && reminders[i].triggered;
                if (isCompleted) {
                    /* Geri aktifle */
                    reminders[i].enabled = true;
                    reminders[i].triggered = false;
                    saveReminders(reminders);
                    render();
                    Toast.info('Hatırlatıcı tekrar aktif edildi.');
                } else {
                    /* Tamamlandı olarak işaretle */
                    reminders[i].enabled = false;
                    reminders[i].triggered = true;
                    saveReminders(reminders);
                    render();
                    Toast.info('Hatırlatıcı tamamlandı olarak işaretlendi.');
                }
                return;
            }
        }
    }

    /* ---- EKİPLE PAYLAŞ MODALI ---- */
    function openShareWithTeamModal(reminderId) {
        closeContextMenu();
        var reminders = getReminders();
        var reminder = null;
        for (var i = 0; i < reminders.length; i++) {
            if (reminders[i].id === reminderId) { reminder = reminders[i]; break; }
        }
        if (!reminder) return;

        /* Kullanıcının ekiplerini al */
        var teams = [];
        if (typeof DB !== 'undefined' && DB.getForUser) {
            teams = DB.getForUser('teams') || [];
        }
        if (teams.length === 0) {
            Toast.show('Henüz bir ekibiniz yok.', 'warning');
            return;
        }

        var teamOptions = '';
        teams.forEach(function (t) {
            teamOptions += '<label class="team-rem-assign-item" style="cursor:pointer;">' +
                '<input type="checkbox" class="share-team-cb" value="' + t.id + '" style="margin-left:auto;width:18px;height:18px;accent-color:#6366f1;cursor:pointer;">' +
                '<span style="flex:1;font-weight:500;">' + (t.name || 'Ekip') + '</span>' +
                '</label>';
        });

        var html =
            '<div class="modal-overlay" onclick="Reminders.closeShareModal()">' +
            '<div class="modal-content" style="max-width:420px;" onclick="event.stopPropagation()">' +
            '<button class="modal-close" onclick="Reminders.closeShareModal()">&times;</button>' +
            '<h3 class="finance-edit-modal-title">Ekiple Paylaş</h3>' +
            '<p style="color:var(--color-text-secondary);margin-bottom:12px;">"' + escapeHtml(reminder.title || 'Hatırlatıcı') + '" hatırlatıcısını göndermek istediğiniz ekipleri seçin:</p>' +
            '<div class="team-rem-assign-list" style="margin-bottom:16px;">' + teamOptions + '</div>' +
            '<input type="hidden" id="share-reminder-id" value="' + reminderId + '">' +
            '<div class="finance-edit-actions">' +
            '<button type="button" class="btn" onclick="Reminders.closeShareModal()">İptal</button>' +
            '<button type="button" class="btn btn-primary" onclick="Reminders.doShareWithTeam()">Gönder</button>' +
            '</div>' +
            '</div></div>';

        var container = document.getElementById('reminder-share-modal');
        if (!container) {
            container = document.createElement('div');
            container.id = 'reminder-share-modal';
            document.body.appendChild(container);
        }
        container.innerHTML = html;
    }

    function closeShareModal() {
        var container = document.getElementById('reminder-share-modal');
        if (container) container.innerHTML = '';
    }

    function doShareWithTeam() {
        var reminderId = parseInt(document.getElementById('share-reminder-id').value);
        var reminders = getReminders();
        var reminder = null;
        for (var i = 0; i < reminders.length; i++) {
            if (reminders[i].id === reminderId) { reminder = reminders[i]; break; }
        }
        if (!reminder) { closeShareModal(); return; }

        var selectedTeams = [];
        var cbs = document.querySelectorAll('.share-team-cb:checked');
        cbs.forEach(function (cb) { selectedTeams.push(cb.value); });

        if (selectedTeams.length === 0) {
            Toast.show('Lütfen en az bir ekip seçin.', 'warning');
            return;
        }

        /* Ekip hatırlatıcılarına ekle */
        var teamReminders = [];
        if (typeof DB !== 'undefined' && DB.getForUser) {
            teamReminders = DB.getForUser('user_team_reminders') || [];
        }

        var user = (typeof DB !== 'undefined' && DB.currentUser) ? DB.currentUser() : null;
        var genId = function () { return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36); };

        selectedTeams.forEach(function (teamId) {
            teamReminders.push({
                id: genId(),
                teamId: teamId,
                title: reminder.title || 'Hatırlatıcı',
                date: reminder.customDate || '',
                hour: reminder.hour,
                minute: reminder.minute,
                sound: reminder.sound || 'bell',
                note: reminder.note || '',
                assignedTo: [],
                completed: false,
                createdBy: user ? (user.firstName + ' ' + user.lastName) : 'Anonim',
                createdByEmail: user ? user.email : '',
                createdAt: new Date().toISOString()
            });
        });

        if (typeof DB !== 'undefined' && DB.setForUser) {
            DB.setForUser('user_team_reminders', teamReminders);
        }

        closeShareModal();
        Toast.show(selectedTeams.length + ' ekibe paylaşıldı!', 'success');
    }

    /* Dışarı tıklandığında bağlam menüsünü kapat */
    document.addEventListener('click', function () {
        closeContextMenu();
    });

    /* Dışarıya açılan fonksiyonlar */
    return {
        init: init,
        render: render,
        getReminders: getReminders,
        saveReminders: saveReminders,
        openModal: openModal,
        openEditModal: openEditModal,
        closeModal: closeModal,
        openDetail: openDetail,
        closeDetail: closeDetail,
        save: save,
        deleteReminder: deleteReminder,
        closeDeleteModal: closeDeleteModal,
        doDeleteReminder: doDeleteReminder,
        toggleReminder: toggleReminder,
        incrementHour: incrementHour,
        decrementHour: decrementHour,
        incrementMinute: incrementMinute,
        decrementMinute: decrementMinute,
        toggleDateDropdown: toggleDateDropdown,
        selectDateOption: selectDateOption,
        openCalendar: openCalendar,
        closeCalendar: closeCalendar,
        confirmCalendarDate: confirmCalendarDate,
        toggleSoundDropdown: toggleSoundDropdown,
        selectSound: selectSound,
        previewSound: previewSound,
        dismissAlarm: dismissAlarm,
        startAlarmChecker: startAlarmChecker,
        showContextMenu: showContextMenu,
        markImportant: markImportant,
        markCompleted: markCompleted,
        setFilter: setFilter,
        closeShareModal: closeShareModal,
        doShareWithTeam: doShareWithTeam
    };
})();
