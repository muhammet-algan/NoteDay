/* ========================================
   HATIRLATICI TAKVİM MODÜLÜ
   Hatırlatıcı "Seç" butonuna tıklandığında
   açılan modal takvim. Kullanıcı özel tarih seçer.
   ======================================== */
var ReminderCalendar = (function () {
    'use strict';

    /* Takvimde gösterilen mevcut ay/yıl */
    var currentDate = new Date();
    /* Kullanıcının seçtiği tarih */
    var selectedDate = null;

    /* Takvimi başlatma */
    function init() {
        selectedDate = new Date();
        render();
    }

    /* Takvimi oluşturma */
    function render() {
        var monthYearEl = document.getElementById('reminder-calendar-month-year');
        var daysEl = document.getElementById('reminder-calendar-days');
        if (!monthYearEl || !daysEl) return;

        daysEl.innerHTML = '';

        var year = currentDate.getFullYear();
        var month = currentDate.getMonth();

        /* Türkçe ay isimleri */
        var monthNames = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];
        monthYearEl.textContent = monthNames[month] + ' ' + year;

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

    /* Seçili tarihi döndürme */
    function getSelectedDate() {
        return selectedDate;
    }

    /* Önceki aya geçme */
    function prevMonth() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        render();
    }

    /* Sonraki aya geçme */
    function nextMonth() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        render();
    }

    /* Dışarıya açılan fonksiyonlar */
    return {
        init: init,
        render: render,
        prevMonth: prevMonth,
        nextMonth: nextMonth,
        selectDate: selectDate,
        getSelectedDate: getSelectedDate
    };
})();
