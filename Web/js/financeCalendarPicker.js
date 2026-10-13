/* ========================================
   FİNANS TAKVİM SEÇİCİ MODÜLÜ
   Gelir/Gider bölümündeki tarih seçimleri
   için kullanılan özel takvim popup'ı.
   Hatırlatıcılar takvimindeki stili kullanır.
   ======================================== */
var FinanceCalendarPicker = (function () {
    'use strict';

    /* Takvimde gösterilen mevcut ay/yıl */
    var currentDate = new Date();
    /* Kullanıcının seçtiği tarih */
    var selectedDate = null;
    /* Hangi input için açıldığı (hidden input id) */
    var targetInputId = null;
    /* Hangi label güncelleneceği */
    var targetLabelId = null;
    /* Geri çağırma fonksiyonu */
    var onConfirmCallback = null;

    /* Türkçe ay isimleri */
    var MONTH_NAMES = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    /* Modal elemanını dinamik olarak oluştur */
    function ensureModal() {
        var modal = document.getElementById('finance-calendar-picker-modal');
        if (modal) return modal;

        modal = document.createElement('div');
        modal.id = 'finance-calendar-picker-modal';
        modal.className = 'finance-cal-picker-overlay';
        modal.onclick = function (e) {
            if (e.target === modal) close();
        };

        modal.innerHTML =
            '<div class="finance-cal-picker-popup">' +
            '<div class="calendar-widget reminder-calendar">' +
            '<div class="calendar-header">' +
            '<button type="button" class="calendar-nav-btn" onclick="FinanceCalendarPicker.prevMonth()">' +
            '<svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">' +
            '<path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>' +
            '</svg>' +
            '</button>' +
            '<div id="finance-cal-picker-month-year" class="calendar-month-year"></div>' +
            '<button type="button" class="calendar-nav-btn" onclick="FinanceCalendarPicker.nextMonth()">' +
            '<svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">' +
            '<path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>' +
            '</svg>' +
            '</button>' +
            '</div>' +
            '<div class="calendar-weekdays">' +
            '<div>Pzt</div><div>Sal</div><div>Çar</div><div>Per</div><div>Cum</div><div>Cmt</div><div>Paz</div>' +
            '</div>' +
            '<div id="finance-cal-picker-days" class="calendar-days"></div>' +
            '</div>' +
            '<div class="finance-cal-picker-actions">' +
            '<button class="btn btn-primary btn-sm" onclick="FinanceCalendarPicker.confirm()">Tamam</button>' +
            '<button class="btn btn-sm" onclick="FinanceCalendarPicker.close()" style="background:var(--color-bg-subtle,#f1f5f9); color:var(--color-text-secondary,#475569);">Kapat</button>' +
            '</div>' +
            '</div>';

        document.body.appendChild(modal);
        return modal;
    }

    /**
     * Takvimi aç
     * @param {string} inputId - Değerin yazılacağı hidden input id
     * @param {string} labelId - Gösterim metninin yazılacağı label id
     * @param {Function} [callback] - Onaylandığında çağırılacak fonksiyon
     */
    function open(inputId, labelId, callback) {
        targetInputId = inputId;
        targetLabelId = labelId;
        onConfirmCallback = callback || null;

        /* Mevcut değeri al ve seçili tarihi belirle */
        var input = document.getElementById(inputId);
        if (input && input.value) {
            selectedDate = new Date(input.value);
        } else {
            selectedDate = new Date();
        }
        currentDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);

        var modal = ensureModal();
        modal.style.display = 'flex';
        render();
    }

    /* Takvimi kapat */
    function close() {
        var modal = document.getElementById('finance-calendar-picker-modal');
        if (modal) modal.style.display = 'none';
        targetInputId = null;
        targetLabelId = null;
        onConfirmCallback = null;
    }

    /* Seçilen tarihi onayla */
    function confirm() {
        if (!selectedDate) { close(); return; }

        /* yyyy-MM-dd formatında hidden inputa yaz */
        var val = selectedDate.getFullYear() + '-' +
            String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' +
            String(selectedDate.getDate()).padStart(2, '0');

        if (targetInputId) {
            var input = document.getElementById(targetInputId);
            if (input) input.value = val;
        }

        /* Label metnini güncelle */
        if (targetLabelId) {
            var label = document.getElementById(targetLabelId);
            if (label) {
                var displayText = selectedDate.getDate() + ' ' +
                    MONTH_NAMES[selectedDate.getMonth()] + ' ' +
                    selectedDate.getFullYear();
                /* Button ile kullanıldığında inner span'ı güncelle */
                var innerSpan = label.querySelector('span');
                if (innerSpan) innerSpan.textContent = displayText;
                else label.textContent = displayText;
            }
        }

        if (onConfirmCallback) onConfirmCallback(val);

        close();
    }

    /* Takvimi oluştur */
    function render() {
        var monthYearEl = document.getElementById('finance-cal-picker-month-year');
        var daysEl = document.getElementById('finance-cal-picker-days');
        if (!monthYearEl || !daysEl) return;

        daysEl.innerHTML = '';

        var year = currentDate.getFullYear();
        var month = currentDate.getMonth();

        monthYearEl.textContent = MONTH_NAMES[month] + ' ' + year;

        /* Ayın ilk gününü hesapla (Pazartesi başlangıçlı) */
        var firstDay = new Date(year, month, 1).getDay();
        var startingDay = firstDay === 0 ? 6 : firstDay - 1;

        /* Aydaki toplam gün sayısı */
        var daysInMonth = new Date(year, month + 1, 0).getDate();

        /* Önceki ayın son günlerini boşluk olarak ekle */
        var prevMonthLastDay = new Date(year, month, 0).getDate();
        for (var i = startingDay; i > 0; i--) {
            var dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day padding';
            dayDiv.textContent = prevMonthLastDay - i + 1;
            daysEl.appendChild(dayDiv);
        }

        /* Her gün için takvim kutucuğu oluştur */
        var today = new Date();

        for (var day = 1; day <= daysInMonth; day++) {
            var dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day selectable';
            dayDiv.textContent = day;

            var date = new Date(year, month, day);

            /* Bugünü vurgula */
            if (date.toDateString() === today.toDateString()) {
                dayDiv.classList.add('today');
            }

            /* Seçili tarihi vurgula */
            if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
                dayDiv.classList.add('selected');
            }

            /* Tıklandığında bu tarihi seç */
            dayDiv.onclick = (function (y, m, d) {
                return function () {
                    selectDate(new Date(y, m, d));
                };
            })(year, month, day);

            daysEl.appendChild(dayDiv);
        }
    }

    /* Tarih seçme */
    function selectDate(date) {
        selectedDate = date;
        render();
    }

    /* Önceki aya geç */
    function prevMonth() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        render();
    }

    /* Sonraki aya geç */
    function nextMonth() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        render();
    }

    return {
        open: open,
        close: close,
        confirm: confirm,
        render: render,
        prevMonth: prevMonth,
        nextMonth: nextMonth
    };
})();
