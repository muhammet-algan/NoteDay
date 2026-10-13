/* ========================================
   FİNANS TAKVİM MODÜLÜ
   Gelir/gider bölümünde kullanılan takvim.
   Gelir ve gider olan günleri renkli noktalarla
   işaretler, tıklandığında o günün özetini gösterir.
   ======================================== */
var FinanceCalendar = (function () {
    'use strict';

    /* Takvimde gösterilen mevcut ay/yıl */
    var currentDate = new Date();
    /* Seçili tarih */
    var selectedDate = new Date();

    /* Takvimi başlatma */
    function init() {
        render();
    }

    /* Takvimi oluşturma - Gelir/gider noktaları ile günleri çizer */
    function render() {
        var monthYearEl = document.getElementById('calendar-month-year');
        var daysEl = document.getElementById('calendar-days');
        if (!monthYearEl || !daysEl) return;

        daysEl.innerHTML = '';

        var year = currentDate.getFullYear();
        var month = currentDate.getMonth();

        /* Türkçe ay isimleri */
        var monthNames = [
            "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
            "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
        ];
        monthYearEl.textContent = monthNames[month] + " " + year;

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

        /* Finans girişlerini al (takvimde işaretlemek için) */
        var today = new Date();
        var entries = Finance.getEntries();

        /* Her gün için takvim kutucuğu oluştur */
        for (var day = 1; day <= daysInMonth; day++) {
            var dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = day;

            var date = new Date(year, month, day);

            /* Bugünü vurgula */
            if (date.toDateString() === today.toDateString()) {
                dayDiv.classList.add('today');
            }

            /* Bu günde gelir/gider kaydı var mı kontrol et */
            var dayEntries = entries.filter(function (e) {
                var eDate = new Date(e.date);
                return eDate.getDate() === day && eDate.getMonth() === month && eDate.getFullYear() === year;
            });

            /* Kayıt varsa tek mavi nokta ekle */
            if (dayEntries.length > 0) {
                var dotContainer = document.createElement('div');
                dotContainer.className = 'day-dots';

                var dot = document.createElement('span');
                dot.className = 'dot entry-dot';
                dotContainer.appendChild(dot);

                dayDiv.appendChild(dotContainer);
                dayDiv.classList.add('has-entries');
            }

            /* Tüm günler tıklanabilir */
            dayDiv.style.cursor = 'pointer';

            /* Tıklandığında seçimi güncelle ve o günün özet bilgisini göster */
            dayDiv.onclick = (function (d, m, y, ents, el) {
                return function () {
                    /* Önceki seçimi kaldır */
                    var prev = document.querySelector('#calendar-days .calendar-day.selected');
                    if (prev) prev.classList.remove('selected');
                    /* Yeni seçimi işaretle */
                    el.classList.add('selected');
                    showDayDetail(d, m, y, ents);
                };
            })(day, month, year, dayEntries, dayDiv);

            /* Bugünü varsayılan seçili yap */
            if (date.toDateString() === today.toDateString()) {
                dayDiv.classList.add('selected');
            }

            daysEl.appendChild(dayDiv);
        }

        /* Bugün bu ayda ise otomatik olarak bugünün özetini göster */
        if (today.getMonth() === month && today.getFullYear() === year) {
            var todayDay = today.getDate();
            var todayEntries = entries.filter(function (e) {
                var eDate = new Date(e.date);
                return eDate.getDate() === todayDay && eDate.getMonth() === month && eDate.getFullYear() === year;
            });
            showDayDetail(todayDay, month, year, todayEntries);
        }
    }

    /* Seçilen günün gelir/gider özetini gösterme */
    function showDayDetail(day, month, year, dayEntries) {
        var summaryEl = document.getElementById('calendar-day-summary');
        if (!summaryEl) return;

        var monthNames = [
            "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
            "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
        ];
        var dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
        var dateObj = new Date(year, month, day);
        var dayOfWeek = dayNames[dateObj.getDay()];
        var dateStr = day + ' ' + monthNames[month] + ' ' + dayOfWeek;
        var totalInc = 0;
        var totalExp = 0;

        /* Özet kutusu HTML'ini oluştur */
        var html = '<div class="day-detail-box">' +
            '<h4 class="day-detail-title">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
            '<span>' + dateStr + ' Özet</span>' +
            '</h4>';

        /* Her kayıt için satır oluştur ve toplamları hesapla */
        dayEntries.forEach(function (e) {
            if (e.type === 'income') totalInc += e.amount;
            else totalExp += e.amount;

            var sign = e.type === 'income' ? '+' : '-';
            var amountClass = e.type === 'income' ? 'day-detail-amount-income' : 'day-detail-amount-expense';
            html += '<div class="day-detail-item">' +
                '<span>' + (e.description || e.category) + '</span>' +
                '<span class="' + amountClass + '">' + sign + e.amount.toLocaleString('tr-TR') + ' TL</span>' +
                '</div>';
        });

        /* Net bakiye */
        html += '<div class="day-detail-total">' +
            '<span>Net:</span>' +
            '<span class="' + (totalInc - totalExp >= 0 ? 'income' : 'expense') + '">' +
            (totalInc - totalExp).toLocaleString('tr-TR') + ' TL</span>' +
            '</div></div>';

        summaryEl.innerHTML = html;
        summaryEl.style.display = 'block';
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
        nextMonth: nextMonth
    };
})();
