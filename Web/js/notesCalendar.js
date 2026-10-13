/* ========================================
   NOTLARIM TAKVİM MODÜLÜ
   DiaryCalendar modülünün aynısı,
   notlarım bölümü için ayrı hedefler kullanır.
   ======================================== */
var NotesCalendar = (function () {
    'use strict';

    var currentDate = new Date();

    /* =================== TÜRK RESMİ TATİL & ÖZEL GÜNLERİ =================== */
    var SPECIAL_DAYS = {
        '01-01': { name: 'Yılbaşı', type: 'holiday' },
        '02-14': { name: 'Sevgililer Günü', type: 'special' },
        '03-08': { name: 'Dünya Kadınlar Günü', type: 'special' },
        '03-14': { name: 'Tıp Bayramı', type: 'special' },
        '03-18': { name: 'Çanakkale Deniz Zaferi', type: 'special' },
        '03-21': { name: 'Nevruz Bayramı', type: 'special' },
        '04-23': { name: 'Ulusal Egemenlik ve Çocuk Bayramı', type: 'holiday' },
        '05-01': { name: 'Emek ve Dayanışma Günü', type: 'holiday' },
        '05-19': { name: 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı', type: 'holiday' },
        '06-05': { name: 'Dünya Çevre Günü', type: 'special' },
        '07-01': { name: 'Denizcilik ve Kabotaj Bayramı', type: 'special' },
        '07-15': { name: 'Demokrasi ve Millî Birlik Günü', type: 'holiday' },
        '08-30': { name: 'Zafer Bayramı', type: 'holiday' },
        '09-01': { name: 'Gaziler Günü', type: 'special' },
        '09-09': { name: 'İzmir\'in Kurtuluşu', type: 'special' },
        '10-06': { name: 'İstanbul\'un Kurtuluşu', type: 'special' },
        '10-13': { name: 'Ankara\'nın Başkent Oluşu', type: 'special' },
        '10-29': { name: 'Cumhuriyet Bayramı', type: 'holiday' },
        '11-10': { name: 'Atatürk\'ü Anma Günü', type: 'memorial' },
        '11-24': { name: 'Öğretmenler Günü', type: 'special' },
        '12-31': { name: 'Yılbaşı Gecesi', type: 'special' }
    };

    /* Dini bayramlar — her yıl tarihleri değişir (Hicri takvime göre) */
    var RELIGIOUS_HOLIDAYS = {
        2025: [
            { month: 3, day: 30, name: 'Ramazan Bayramı (1. gün)', type: 'holiday' },
            { month: 3, day: 31, name: 'Ramazan Bayramı (2. gün)', type: 'holiday' },
            { month: 4, day: 1, name: 'Ramazan Bayramı (3. gün)', type: 'holiday' },
            { month: 6, day: 6, name: 'Kurban Bayramı (1. gün)', type: 'holiday' },
            { month: 6, day: 7, name: 'Kurban Bayramı (2. gün)', type: 'holiday' },
            { month: 6, day: 8, name: 'Kurban Bayramı (3. gün)', type: 'holiday' },
            { month: 6, day: 9, name: 'Kurban Bayramı (4. gün)', type: 'holiday' },
            { month: 5, day: 11, name: 'Anneler Günü', type: 'special' },
            { month: 6, day: 15, name: 'Babalar Günü', type: 'special' }
        ],
        2026: [
            { month: 3, day: 20, name: 'Ramazan Bayramı (1. gün)', type: 'holiday' },
            { month: 3, day: 21, name: 'Ramazan Bayramı (2. gün)', type: 'holiday' },
            { month: 3, day: 22, name: 'Ramazan Bayramı (3. gün)', type: 'holiday' },
            { month: 5, day: 27, name: 'Kurban Bayramı (1. gün)', type: 'holiday' },
            { month: 5, day: 28, name: 'Kurban Bayramı (2. gün)', type: 'holiday' },
            { month: 5, day: 29, name: 'Kurban Bayramı (3. gün)', type: 'holiday' },
            { month: 5, day: 30, name: 'Kurban Bayramı (4. gün)', type: 'holiday' },
            { month: 5, day: 10, name: 'Anneler Günü', type: 'special' },
            { month: 6, day: 21, name: 'Babalar Günü', type: 'special' }
        ],
        2027: [
            { month: 3, day: 10, name: 'Ramazan Bayramı (1. gün)', type: 'holiday' },
            { month: 3, day: 11, name: 'Ramazan Bayramı (2. gün)', type: 'holiday' },
            { month: 3, day: 12, name: 'Ramazan Bayramı (3. gün)', type: 'holiday' },
            { month: 5, day: 16, name: 'Kurban Bayramı (1. gün)', type: 'holiday' },
            { month: 5, day: 17, name: 'Kurban Bayramı (2. gün)', type: 'holiday' },
            { month: 5, day: 18, name: 'Kurban Bayramı (3. gün)', type: 'holiday' },
            { month: 5, day: 19, name: 'Kurban Bayramı (4. gün)', type: 'holiday' },
            { month: 5, day: 9, name: 'Anneler Günü', type: 'special' },
            { month: 6, day: 20, name: 'Babalar Günü', type: 'special' }
        ],
        2028: [
            { month: 2, day: 27, name: 'Ramazan Bayramı (1. gün)', type: 'holiday' },
            { month: 2, day: 28, name: 'Ramazan Bayramı (2. gün)', type: 'holiday' },
            { month: 2, day: 29, name: 'Ramazan Bayramı (3. gün)', type: 'holiday' },
            { month: 5, day: 4, name: 'Kurban Bayramı (1. gün)', type: 'holiday' },
            { month: 5, day: 5, name: 'Kurban Bayramı (2. gün)', type: 'holiday' },
            { month: 5, day: 6, name: 'Kurban Bayramı (3. gün)', type: 'holiday' },
            { month: 5, day: 7, name: 'Kurban Bayramı (4. gün)', type: 'holiday' },
            { month: 5, day: 14, name: 'Anneler Günü', type: 'special' },
            { month: 6, day: 18, name: 'Babalar Günü', type: 'special' }
        ]
    };

    /* Gün adları */
    var DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    var MONTH_NAMES = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    /* Belirli bir gün özel gün mü? */
    function isSpecialDay(year, month, day) {
        var mmdd = String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        if (SPECIAL_DAYS[mmdd]) return SPECIAL_DAYS[mmdd];
        var yearHolidays = RELIGIOUS_HOLIDAYS[year];
        if (yearHolidays) {
            for (var i = 0; i < yearHolidays.length; i++) {
                if (yearHolidays[i].month === month + 1 && yearHolidays[i].day === day) {
                    return { name: yearHolidays[i].name, type: yearHolidays[i].type };
                }
            }
        }
        return null;
    }

    /* Belirli ay/yıl için tüm özel günleri birleştir */
    function getSpecialDaysForMonth(year, month) {
        var days = [];
        var daysInMonth = new Date(year, month + 1, 0).getDate();

        /* Sabit özel günler */
        for (var day = 1; day <= daysInMonth; day++) {
            var mmdd = String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
            if (SPECIAL_DAYS[mmdd]) {
                days.push({ day: day, info: SPECIAL_DAYS[mmdd] });
            }
        }

        /* Dini bayramlar (yıl bazlı) */
        var yearHolidays = RELIGIOUS_HOLIDAYS[year];
        if (yearHolidays) {
            yearHolidays.forEach(function (h) {
                if (h.month === month + 1) {
                    days.push({ day: h.day, info: { name: h.name, type: h.type } });
                }
            });
        }

        /* Tarihe göre sırala */
        days.sort(function (a, b) { return a.day - b.day; });

        return days;
    }

    function init() {
        render();
    }

    function render() {
        renderToTarget('notes-calendar-month-year', 'notes-calendar-days', 'notes-special-days');
    }

    function renderToTarget(monthYearId, daysId, specialDaysId) {
        var monthYearEl = document.getElementById(monthYearId);
        var daysEl = document.getElementById(daysId);
        if (!monthYearEl || !daysEl) return;

        daysEl.innerHTML = '';

        var year = currentDate.getFullYear();
        var month = currentDate.getMonth();

        monthYearEl.textContent = MONTH_NAMES[month] + ' ' + year;

        /* Pazartesi başlangıçlı ilk gün */
        var firstDay = new Date(year, month, 1).getDay();
        var startingDay = firstDay === 0 ? 6 : firstDay - 1;
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var prevMonthLastDay = new Date(year, month, 0).getDate();

        /* Notları al - hangi günlerde not var? */
        var today = new Date();
        var notes = [];
        try {
            if (window.Notes && Notes.getNotes) {
                notes = Notes.getNotes();
            }
            if (!Array.isArray(notes)) notes = [];
        } catch (e) { console.error('NotesCalendar: getNotes error', e); }

        /* Hangi günlerde not var? */
        var noteDays = {};
        notes.forEach(function (note) {
            if (!note || !note.createdAt) return;
            try {
                var d = new Date(note.createdAt);
                if (d.getFullYear() === year && d.getMonth() === month) {
                    noteDays[d.getDate()] = true;
                }
            } catch (err) { }
        });

        /* Önceki ayın boş günleri */
        for (var i = startingDay; i > 0; i--) {
            var padDiv = document.createElement('div');
            padDiv.className = 'calendar-day padding';
            padDiv.textContent = prevMonthLastDay - i + 1;
            daysEl.appendChild(padDiv);
        }

        /* Bu ayın günleri */
        for (var day = 1; day <= daysInMonth; day++) {
            var dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = day;

            var dateObj = new Date(year, month, day);

            /* Bugünü vurgula */
            if (dateObj.toDateString() === today.toDateString()) {
                dayDiv.classList.add('today');
            }

            /* Not varsa nokta ekle */
            if (noteDays[day]) {
                dayDiv.classList.add('has-entries');
                var dotContainer = document.createElement('div');
                dotContainer.className = 'day-dots';
                var dot = document.createElement('span');
                dot.className = 'dot diary-dot';
                dotContainer.appendChild(dot);
                dayDiv.appendChild(dotContainer);
            }

            dayDiv.style.cursor = 'pointer';

            /* Tıklanma: tarihe göre notları filtrele */
            dayDiv.onclick = (function (d, m, y, el) {
                return function () {
                    var prev = daysEl.querySelector('.calendar-day.selected');
                    if (prev) prev.classList.remove('selected');

                    // Toggle seçim
                    if (el.classList.contains('selected')) {
                        el.classList.remove('selected');
                    } else {
                        el.classList.add('selected');
                    }
                };
            })(day, month, year, dayDiv);

            daysEl.appendChild(dayDiv);
        }

        renderSpecialDaysToTarget(year, month, specialDaysId);
    }

    /* =================== ÖZEL GÜNLER RENDER =================== */
    function renderSpecialDaysToTarget(year, month, specialDaysId) {
        var container = document.getElementById(specialDaysId);
        if (!container) return;

        /* Bu aya ait tüm özel günleri topla (sabit + dini) */
        var rawDays = getSpecialDaysForMonth(year, month);

        /* Tarihi geçen önemli günleri tespit et */
        var today = new Date();
        today = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        /* Render için gün adlarını ekle */
        var days = rawDays.map(function (item) {
            var dateObj = new Date(year, month, item.day);
            var isPassed = dateObj < today;
            return {
                day: item.day,
                dayName: DAY_NAMES[dateObj.getDay()],
                monthName: MONTH_NAMES[month],
                info: item.info,
                isPassed: isPassed
            };
        });

        if (days.length === 0) {
            container.innerHTML =
                '<div class="special-days-card">' +
                '<div class="special-days-header">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>' +
                '<line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>' +
                '<line x1="3" y1="10" x2="21" y2="10"/>' +
                '</svg>' +
                '<span>Önemli Günler</span>' +
                '</div>' +
                '<div class="special-days-empty">' +
                '<p>Bu ayda özel gün bulunmuyor</p>' +
                '</div>' +
                '</div>';
            return;
        }

        var html =
            '<div class="special-days-card">' +
            '<div class="special-days-header">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>' +
            '<line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>' +
            '<line x1="3" y1="10" x2="21" y2="10"/>' +
            '</svg>' +
            '<span>Önemli Günler</span>' +
            '<span class="special-days-badge">' + days.length + '</span>' +
            '</div>' +
            '<div class="special-days-list">';

        days.forEach(function (item) {
            var typeClass = item.info.type === 'holiday' ? 'holiday' :
                item.info.type === 'memorial' ? 'memorial' : 'special';
            var typeIcon = '';
            if (item.info.type === 'holiday') {
                typeIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>';
            } else if (item.info.type === 'memorial') {
                typeIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
            } else {
                typeIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
            }

            html +=
                '<div class="special-day-item ' + typeClass + (item.isPassed ? ' passed' : '') + '">' +
                '<div class="special-day-icon">' + typeIcon + '</div>' +
                '<div class="special-day-content">' +
                '<div class="special-day-date">' +
                '<strong>' + item.day + ' ' + item.monthName + '</strong>' +
                '<span class="special-day-dayname">' + item.dayName + '</span>' +
                '</div>' +
                '<div class="special-day-name">' + item.info.name + '</div>' +
                '</div>' +
                '</div>';
        });

        html += '</div></div>';
        container.innerHTML = html;
    }


    function prevMonth() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        render();
    }

    function nextMonth() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        render();
    }

    return {
        init: init,
        render: render,
        prevMonth: prevMonth,
        nextMonth: nextMonth
    };
})();
