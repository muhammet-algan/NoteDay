var PageCustomizer = (function () {
    'use strict';

    var _layout = 'simple'; // 'simple' or 'split'
    var _options = {
        comments: 'default', // 'default' or others
        discussions: true,
        propertyIcons: true,
        fullWidth: true,
        templates: true,
        columns: 2,
        calendar: true,
        specialDays: true,
        showDate: true,
        color: 'siyah'
    };

    var COLORS = [
        { id: 'siyah', text: 'Siyah', colorClass: 'siyah-box' },
        { id: 'gri', text: 'Gri', colorClass: 'gri-box' },
        { id: 'kirmizi', text: 'Kırmızı', colorClass: 'kirmizi-box' },
        { id: 'turuncu', text: 'Turuncu', colorClass: 'turuncu-box' },
        { id: 'sari', text: 'Sarı', colorClass: 'sari-box' },
        { id: 'yesil', text: 'Yeşil', colorClass: 'yesil-box' },
        { id: 'mavi', text: 'Mavi', colorClass: 'mavi-box' },
        { id: 'lacivert', text: 'Lacivert', colorClass: 'lacivert-box' },
        { id: 'mor', text: 'Mor', colorClass: 'mor-box' }
    ];

    function loadState() {
        try {
            var currentView = localStorage.getItem('app_current_section') || '';
            var activeSection = document.querySelector('.section-panel.active');
            var isNotes = activeSection && activeSection.id === 'notes-section' && currentView.indexOf('team_instance_') !== 0;
            var isFinance = activeSection && activeSection.id === 'finance-section';
            var isReminders = activeSection && activeSection.id === 'reminders-section';
            var isBoard = activeSection && activeSection.id === 'board-section';
            var isTable = activeSection && activeSection.id === 'new-table-section';
            var isTeam = currentView.indexOf('team_instance_') === 0;
            var isHabits = activeSection && activeSection.id === 'aliskanlik-section';

            var prefix = 'notion_';
            if (isFinance) prefix = 'finance_';
            else if (isNotes) prefix = 'notes_';
            else if (isReminders) prefix = 'reminders_';
            else if (isBoard) prefix = 'board_';
            else if (isTable) prefix = 'table_';
            else if (isTeam) prefix = 'team_';
            else if (isHabits) prefix = 'habits_';

            var savedLayout = localStorage.getItem(prefix + 'cust_layout');
            if (savedLayout) {
                _layout = savedLayout;
            } else {
                _layout = (isNotes || isFinance || isReminders || isBoard || isTable || isTeam || isHabits) ? 'simple' : (activeSection && activeSection.id === 'diary-section' ? 'split' : 'simple');
            }

            var savedOptions = localStorage.getItem(prefix + 'cust_options');
            if (savedOptions) {
                var parsed = JSON.parse(savedOptions);
                 _options = {
                    comments: 'default',
                    discussions: true,
                    propertyIcons: true,
                    fullWidth: true,
                    templates: true,
                    columns: (isNotes || isTeam) ? 3 : 2,
                    calendar: true,
                    specialDays: true,
                    showDate: true,
                    color: 'siyah'
                };
                for (var key in parsed) {
                    _options[key] = parsed[key];
                }
            } else {
                _options = {
                    comments: 'default',
                    discussions: true,
                    propertyIcons: true,
                    fullWidth: true,
                    templates: true,
                    columns: (isNotes || isTeam) ? 3 : 2,
                    calendar: true,
                    specialDays: true,
                    showDate: true,
                    color: 'siyah'
                };
            }
            if (_options.calendar === undefined) _options.calendar = true;
            if (_options.specialDays === undefined) _options.specialDays = true;
            if (_options.showDate === undefined) _options.showDate = true;
            if (_options.color === undefined || _options.color === 'default' || _options.color === 'brown' || _options.color === 'pink' || _options.color === 'gray' || _options.color === 'yellow' || _options.color === 'green' || _options.color === 'blue' || _options.color === 'purple' || _options.color === 'red') {
                _options.color = 'siyah';
            }

            // Sync fullWidth with main page preference
            var mainFullWidth = localStorage.getItem('notion_full_width_preference') === 'true';
            _options.fullWidth = mainFullWidth;
        } catch (e) {
            console.error('Failed to load PageCustomizer state:', e);
        }
    }

    function saveState() {
        try {
            var currentView = localStorage.getItem('app_current_section') || '';
            var activeSection = document.querySelector('.section-panel.active');
            var isNotes = activeSection && activeSection.id === 'notes-section' && currentView.indexOf('team_instance_') !== 0;
            var isFinance = activeSection && activeSection.id === 'finance-section';
            var isReminders = activeSection && activeSection.id === 'reminders-section';
            var isBoard = activeSection && activeSection.id === 'board-section';
            var isTable = activeSection && activeSection.id === 'new-table-section';
            var isTeam = currentView.indexOf('team_instance_') === 0;
            var isHabits = activeSection && activeSection.id === 'aliskanlik-section';

            var prefix = 'notion_';
            if (isFinance) prefix = 'finance_';
            else if (isNotes) prefix = 'notes_';
            else if (isReminders) prefix = 'reminders_';
            else if (isBoard) prefix = 'board_';
            else if (isTable) prefix = 'table_';
            else if (isTeam) prefix = 'team_';
            else if (isHabits) prefix = 'habits_';

            localStorage.setItem(prefix + 'cust_layout', _layout);
            localStorage.setItem(prefix + 'cust_options', JSON.stringify(_options));
        } catch (e) {
            console.error('Failed to save PageCustomizer state:', e);
        }
    }

    function renderDropdownOptions() {
        var activeSection = document.querySelector('.section-panel.active');
        var isDiary = activeSection && activeSection.id === 'diary-section';
        var isNotes = activeSection && activeSection.id === 'notes-section';
        var dropdown = document.getElementById('notum-cust-comments-dropdown');
        if (!dropdown) return;

        if (isDiary || isNotes) {
            var selectedCol = _options.columns || (isNotes ? 3 : 2);
            var html = '';
            [1, 2, 3].forEach(function (val) {
                var isActive = (val === selectedCol);
                html += '<div class="select-option' + (isActive ? ' active' : '') + '" onclick="PageCustomizer.changeColumnsOption(' + val + ')">' +
                        '  <span class="option-radio-circle"></span>' +
                        '  <span class="option-text">' + val + '</span>' +
                        '</div>';
            });
            dropdown.innerHTML = html;
        } else {
            var selectedComments = _options.comments || 'default';
            var optionsList = [
                { val: 'default', text: 'Varsayılan' },
                { val: 'expanded', text: 'Genişletilmiş' },
                { val: 'hidden', text: 'Gizli' }
            ];
            var html = '';
            optionsList.forEach(function (opt) {
                var isActive = (opt.val === selectedComments);
                html += '<div class="select-option' + (isActive ? ' active' : '') + '" onclick="PageCustomizer.changeCommentsOption(\'' + opt.val + '\')">' +
                        '  <span class="option-radio-circle"></span>' +
                        '  <span class="option-text">' + opt.text + '</span>' +
                        '</div>';
            });
            dropdown.innerHTML = html;
        }
    }

    function updateCustomizerVisibility() {
        var currentView = localStorage.getItem('app_current_section') || '';
        var activeSection = document.querySelector('.section-panel.active');
        var isDiary = activeSection && activeSection.id === 'diary-section';
        var isNotes = activeSection && activeSection.id === 'notes-section' && currentView.indexOf('team_instance_') !== 0;
        var isFinance = activeSection && activeSection.id === 'finance-section';
        var isReminders = activeSection && activeSection.id === 'reminders-section';
        var isBoard = activeSection && activeSection.id === 'board-section';
        var isTable = activeSection && activeSection.id === 'new-table-section';
        var isTeam = currentView.indexOf('team_instance_') === 0;
        var isHabits = activeSection && activeSection.id === 'aliskanlik-section';

        var labelOption = document.getElementById('notum-cust-comments-option-label');
        var rowComments = labelOption ? labelOption.closest('.notum-cust-option-row') : null;
        if (rowComments) {
            if ((isDiary || isNotes) && _layout === 'list') {
                rowComments.style.display = 'none';
            } else {
                var hideComments = isFinance || isReminders || isBoard || isTable || isTeam || isHabits;
                rowComments.style.display = hideComments ? 'none' : 'flex';
            }
        }
    }

    function open() {
        if (localStorage.getItem('notion_lock_page_preference') === 'true') {
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show("Bu sayfa kilitli. Düzenlemek için kilidi açın.", "warning");
            }
            return;
        }
        var modal = document.getElementById('notum-customize-modal');
        if (modal) {
            modal.style.display = 'flex';
            try {
                localStorage.setItem('notion_customizer_open', 'true');
            } catch (e) {}
            
            var currentView = localStorage.getItem('app_current_section') || '';
            var activeSection = document.querySelector('.section-panel.active');
            var isDiary = activeSection && activeSection.id === 'diary-section';
            var isNotes = activeSection && activeSection.id === 'notes-section' && currentView.indexOf('team_instance_') !== 0;
            var isFinance = activeSection && activeSection.id === 'finance-section';
            var isReminders = activeSection && activeSection.id === 'reminders-section';
            var isBoard = activeSection && activeSection.id === 'board-section';
            var isTable = activeSection && activeSection.id === 'new-table-section';
            var isTeam = currentView.indexOf('team_instance_') === 0;
            var isHabits = activeSection && activeSection.id === 'aliskanlik-section';

            var titleEl = document.getElementById('notum-cust-header-subtitle');
            var subtitleWrapper = document.getElementById('notum-cust-header-subtitle-wrapper');
            var paneNormal = document.getElementById('notum-cust-preview-pane');
            var paneDiary = document.getElementById('notum-cust-diary-preview');

            var labelOption = document.getElementById('notum-cust-comments-option-label');
            var dropdown = document.getElementById('notum-cust-comments-dropdown');
            var labelVal = document.getElementById('notum-cust-comments-label');

            var sectionTitle = document.getElementById('notum-cust-section-title-structure');
            var nameSimple = document.getElementById('notum-cust-layout-simple-name');
            var nameSplit = document.getElementById('notum-cust-layout-split-name');

            // Load saved state
            loadState();

            if (isDiary || isNotes || isFinance || isReminders || isBoard || isTable || isTeam || isHabits) {
                var prefix = 'notion_';
                if (isFinance) prefix = 'finance_';
                else if (isNotes) prefix = 'notes_';
                else if (isReminders) prefix = 'reminders_';
                else if (isBoard) prefix = 'board_';
                else if (isTable) prefix = 'table_';
                else if (isTeam) prefix = 'team_';
                else if (isHabits) prefix = 'habits_';

                if (!localStorage.getItem(prefix + 'cust_layout')) {
                    _layout = (isNotes || isFinance || isReminders || isBoard || isTable || isTeam || isHabits) ? 'simple' : 'split';
                }
                
                if (titleEl) {
                    if (isFinance) titleEl.textContent = 'Önizleme: Finanslarım';
                    else if (isNotes) titleEl.textContent = 'Önizleme: Notlarım';
                    else if (isReminders) titleEl.textContent = 'Önizleme: Hatırlatıcılarım';
                    else if (isBoard) titleEl.textContent = 'Önizleme: Panom';
                    else if (isTable) titleEl.textContent = 'Önizleme: Tablo';
                    else if (isTeam) titleEl.textContent = 'Önizleme: Ekipler';
                    else if (isHabits) titleEl.textContent = 'Önizleme: Alışkanlıklar';
                    else titleEl.textContent = 'Önizleme: Günlüklerim';
                }
                if (subtitleWrapper) subtitleWrapper.style.display = 'none';
                if (paneNormal) paneNormal.style.display = 'none';
                if (paneDiary) paneDiary.style.display = 'block';

                var hideComments = isFinance || isReminders || isBoard || isTable || isTeam || isHabits;
                var rowComments = document.getElementById('notum-cust-comments-option-label') ? document.getElementById('notum-cust-comments-option-label').closest('.notum-cust-option-row') : null;
                if (rowComments) {
                    rowComments.style.display = hideComments ? 'none' : 'flex';
                }

                if (labelOption) labelOption.textContent = 'Görünüm';
                
                if (_options.columns === undefined) {
                    _options.columns = (isNotes || isTeam) ? 3 : 2;
                }
                if (labelVal) labelVal.textContent = _options.columns;

                renderDropdownOptions();

                if (sectionTitle) sectionTitle.textContent = 'Tasarım';
                if (nameSimple) nameSimple.textContent = 'Varsayılan';
                if (nameSplit) nameSplit.textContent = 'Tablo';
                var nameList = document.getElementById('notum-cust-layout-list-name');
                if (nameList) nameList.textContent = 'Liste';

                var hideCalendarOpts = isFinance || isReminders || isBoard || isTable || isTeam || isHabits;
                var rowCalendar = document.getElementById('notum-cust-option-row-calendar');
                var rowSpecialDays = document.getElementById('notum-cust-option-row-specialDays');
                var rowShowDate = document.getElementById('notum-cust-option-row-showDate');
                if (rowCalendar) rowCalendar.style.display = hideCalendarOpts ? 'none' : 'flex';
                if (rowSpecialDays) rowSpecialDays.style.display = hideCalendarOpts ? 'none' : 'flex';
                if (rowShowDate) rowShowDate.style.display = (isNotes || isDiary) ? 'flex' : 'none';

                var cardSplit = document.querySelector('.notum-cust-layout-card[data-layout="split"]');
                if (cardSplit) {
                    if (hideCalendarOpts) {
                        cardSplit.style.visibility = 'hidden';
                        cardSplit.style.pointerEvents = 'none';
                    } else {
                        cardSplit.style.visibility = 'visible';
                        cardSplit.style.pointerEvents = 'auto';
                        cardSplit.style.display = 'flex';
                    }
                }

                var cardList = document.querySelector('.notum-cust-layout-card[data-layout="list"]');
                if (cardList) {
                    if (hideCalendarOpts) {
                        cardList.style.visibility = 'hidden';
                        cardList.style.pointerEvents = 'none';
                    } else {
                        cardList.style.visibility = 'visible';
                        cardList.style.pointerEvents = 'auto';
                        cardList.style.display = 'flex';
                    }
                }

                var rowColor = document.getElementById('notum-cust-option-row-color');
                if (rowColor) {
                    var showColor = isDiary || isNotes || isFinance;
                    rowColor.style.display = showColor ? 'flex' : 'none';
                }
                var labelColor = document.getElementById('notum-cust-color-label');
                if (labelColor) {
                    var selectedColor = _options.color || 'siyah';
                    var opt = COLORS.find(function(c) { return c.id === selectedColor; }) || COLORS[0];
                    labelColor.innerHTML = '<span class="color-box ' + opt.colorClass + '"></span>' + opt.text;
                }
                renderColorDropdownOptions();

            } else {
                if (!localStorage.getItem('notion_cust_layout')) {
                    _layout = 'simple';
                }
                if (titleEl) titleEl.textContent = 'Önizleme: asdad';
                if (subtitleWrapper) subtitleWrapper.style.display = 'flex';
                if (paneNormal) paneNormal.style.display = 'block';
                if (paneDiary) paneDiary.style.display = 'none';

                var rowComments = document.getElementById('notum-cust-comments-option-label') ? document.getElementById('notum-cust-comments-option-label').closest('.notum-cust-option-row') : null;
                if (rowComments) {
                    rowComments.style.display = 'flex';
                }

                var cardSplit = document.querySelector('.notum-cust-layout-card[data-layout="split"]');
                if (cardSplit) {
                    cardSplit.style.visibility = 'visible';
                    cardSplit.style.pointerEvents = 'auto';
                    cardSplit.style.display = 'flex';
                }

                var cardList = document.querySelector('.notum-cust-layout-card[data-layout="list"]');
                if (cardList) {
                    cardList.style.visibility = 'visible';
                    cardList.style.pointerEvents = 'auto';
                    cardList.style.display = 'flex';
                }

                if (labelOption) labelOption.textContent = 'Satır içi yorumlar';
                if (labelVal) {
                    labelVal.textContent = _options.comments === 'default' ? 'Varsayılan' : (_options.comments === 'hidden' ? 'Gizli' : 'Genişletilmiş');
                }

                renderDropdownOptions();

                if (sectionTitle) sectionTitle.textContent = 'Yapı';
                if (nameSimple) nameSimple.textContent = 'Basit';
                if (nameSplit) nameSplit.textContent = 'Tablolu';
                var nameList = document.getElementById('notum-cust-layout-list-name');
                if (nameList) nameList.textContent = 'Liste';

                var rowCalendar = document.getElementById('notum-cust-option-row-calendar');
                var rowSpecialDays = document.getElementById('notum-cust-option-row-specialDays');
                var rowShowDate = document.getElementById('notum-cust-option-row-showDate');
                if (rowCalendar) rowCalendar.style.display = 'none';
                if (rowSpecialDays) rowSpecialDays.style.display = 'none';
                if (rowShowDate) rowShowDate.style.display = 'none';

                var rowColor = document.getElementById('notum-cust-option-row-color');
                if (rowColor) rowColor.style.display = 'none';
                closeColorDropdown();
            }

            updateCustomizerVisibility();
            try {
                updatePreview();
            } catch (e) {}
            updateSidebarUI();
        }
    }

    function close() {
        var modal = document.getElementById('notum-customize-modal');
        if (modal) {
            modal.style.display = 'none';
            try {
                localStorage.setItem('notion_customizer_open', 'false');
            } catch (e) {}
        }
    }

    function selectLayout(type) {
        var currentView = localStorage.getItem('app_current_section') || '';
        var activeSection = document.querySelector('.section-panel.active');
        var isFinance = activeSection && activeSection.id === 'finance-section';
        var isReminders = activeSection && activeSection.id === 'reminders-section';
        var isBoard = activeSection && activeSection.id === 'board-section';
        var isTable = activeSection && activeSection.id === 'new-table-section';
        var isTeam = currentView.indexOf('team_instance_') === 0;
        var isHabits = activeSection && activeSection.id === 'aliskanlik-section';

        if (isFinance || isReminders || isBoard || isTable || isTeam || isHabits) {
            type = 'simple';
        }

        _layout = type;
        
        // Update visual card selection
        var cards = document.querySelectorAll('.notum-cust-layout-card');
        cards.forEach(function (card) {
            var cardType = card.getAttribute('data-layout');
            if (cardType === type) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });

        updateCustomizerVisibility();
        updatePreview();
    }

    function toggleOption(optionName) {
        _options[optionName] = !_options[optionName];
        
        // Update checkbox switch UI
        var checkbox = document.getElementById('notum-cust-toggle-' + optionName);
        if (checkbox) {
            checkbox.checked = _options[optionName];
        }

        if (optionName === 'fullWidth') {
            if (typeof SayfaMenusu !== 'undefined' && SayfaMenusu.toggleFullWidth) {
                SayfaMenusu.toggleFullWidth(_options.fullWidth);
                
                // Sync the checkbox in the 3-dots menu
                var mainCheckbox = document.getElementById('notum-toggle-full-width');
                if (mainCheckbox) {
                    mainCheckbox.checked = _options.fullWidth;
                }
            }
        }

        updatePreview();
    }

    function closeCommentsDropdown() {
        var dropdown = document.getElementById('notum-cust-comments-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
        var trigger = document.querySelector('.notum-cust-select-trigger');
        if (trigger) {
            trigger.classList.remove('open');
        }
    }

    function changeCommentsOption(val) {
        _options.comments = val;
        var label = document.getElementById('notum-cust-comments-label');
        if (label) {
            label.textContent = val === 'default' ? 'Varsayılan' : (val === 'hidden' ? 'Gizli' : 'Genişletilmiş');
        }
        
        closeCommentsDropdown();
        renderDropdownOptions();
        updatePreview();
    }

    function changeColumnsOption(val) {
        _options.columns = val;
        var label = document.getElementById('notum-cust-comments-label');
        if (label) {
            label.textContent = val;
        }
        
        closeCommentsDropdown();
        renderDropdownOptions();
        updatePreview();
    }

    function toggleCommentsDropdown(e) {
        if (e) e.stopPropagation();
        var dropdown = document.getElementById('notum-cust-comments-dropdown');
        var trigger = document.querySelector('.notum-cust-select-trigger');
        if (dropdown) {
            var isHidden = dropdown.style.display === 'none' || dropdown.style.display === '';
            if (isHidden) {
                renderDropdownOptions();
                dropdown.style.display = 'block';
                if (trigger) trigger.classList.add('open');
            } else {
                closeCommentsDropdown();
            }
        }
    }

    function renderColorDropdownOptions() {
        var dropdown = document.getElementById('notum-cust-color-dropdown');
        if (!dropdown) return;

        var selectedColor = _options.color || 'siyah';
        var html = '';
        COLORS.forEach(function (opt) {
            var isActive = (opt.id === selectedColor);
            html += '<div class="select-option' + (isActive ? ' active' : '') + '" onclick="PageCustomizer.changeColorOption(\'' + opt.id + '\')">' +
                    '  <span class="color-box ' + opt.colorClass + '"></span>' +
                    '  <span class="option-text">' + opt.text + '</span>' +
                    '  <span class="check-icon">' +
                    '    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
                    '  </span>' +
                    '</div>';
        });
        dropdown.innerHTML = html;
    }

    function changeColorOption(val) {
        _options.color = val;
        var labelEl = document.getElementById('notum-cust-color-label');
        if (labelEl) {
            var opt = COLORS.find(function(c) { return c.id === val; }) || COLORS[0];
            labelEl.innerHTML = '<span class="color-box ' + opt.colorClass + '"></span>' + opt.text;
        }
        
        closeColorDropdown();
        renderColorDropdownOptions();
        updatePreview();
    }

    function toggleColorDropdown(e) {
        if (e) e.stopPropagation();
        var dropdown = document.getElementById('notum-cust-color-dropdown');
        var trigger = document.getElementById('notum-cust-color-trigger');
        if (dropdown) {
            var isHidden = dropdown.style.display === 'none' || dropdown.style.display === '';
            if (isHidden) {
                closeCommentsDropdown();
                renderColorDropdownOptions();
                dropdown.style.display = 'block';
                if (trigger) trigger.classList.add('open');
            } else {
                closeColorDropdown();
            }
        }
    }

    function closeColorDropdown() {
        var dropdown = document.getElementById('notum-cust-color-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
        var trigger = document.getElementById('notum-cust-color-trigger');
        if (trigger) {
            trigger.classList.remove('open');
        }
    }

    function applyAllSavedColors() {
        try {
            var contentArea = document.querySelector('.content-area');
            if (contentArea) {
                contentArea.className = contentArea.className.replace(/\bcust-bg-\S+/g, '');
            }

            var diarySection = document.getElementById('diary-section');
            if (diarySection) {
                diarySection.className = diarySection.className.replace(/\bcust-bg-\S+/g, '');
                var savedOptions = localStorage.getItem('notion_cust_options');
                var color = 'siyah';
                if (savedOptions) {
                    try {
                        var parsed = JSON.parse(savedOptions);
                        if (parsed && parsed.color) color = parsed.color;
                    } catch(e) {}
                }
                if (color === 'default' || color === 'brown' || color === 'pink' || color === 'gray' || color === 'yellow' || color === 'green' || color === 'blue' || color === 'purple' || color === 'red') color = 'siyah';
                diarySection.classList.add('cust-bg-' + color);
            }

            var notesSection = document.getElementById('notes-section');
            if (notesSection) {
                notesSection.className = notesSection.className.replace(/\bcust-bg-\S+/g, '');
                var savedOptions = localStorage.getItem('notes_cust_options');
                var color = 'siyah';
                if (savedOptions) {
                    try {
                        var parsed = JSON.parse(savedOptions);
                        if (parsed && parsed.color) color = parsed.color;
                    } catch(e) {}
                }
                if (color === 'default' || color === 'brown' || color === 'pink' || color === 'gray' || color === 'yellow' || color === 'green' || color === 'blue' || color === 'purple' || color === 'red') color = 'siyah';
                notesSection.classList.add('cust-bg-' + color);
            }

            var financeSection = document.getElementById('finance-section');
            if (financeSection) {
                financeSection.className = financeSection.className.replace(/\bcust-bg-\S+/g, '');
                var savedOptions = localStorage.getItem('finance_cust_options');
                var color = 'siyah';
                if (savedOptions) {
                    try {
                        var parsed = JSON.parse(savedOptions);
                        if (parsed && parsed.color) color = parsed.color;
                    } catch(e) {}
                }
                if (color === 'default' || color === 'brown' || color === 'pink' || color === 'gray' || color === 'yellow' || color === 'green' || color === 'blue' || color === 'purple' || color === 'red') color = 'siyah';
                financeSection.classList.add('cust-bg-' + color);
            }
        } catch(e) {
            console.error('Error applying saved colors:', e);
        }
    }

    function updatePreview() {
        var currentView = localStorage.getItem('app_current_section') || '';
        var activeSection = document.querySelector('.section-panel.active');
        var isDiary = activeSection && activeSection.id === 'diary-section';
        var isNotes = activeSection && activeSection.id === 'notes-section' && currentView.indexOf('team_instance_') !== 0;
        var isFinance = activeSection && activeSection.id === 'finance-section';
        var isReminders = activeSection && activeSection.id === 'reminders-section';
        var isBoard = activeSection && activeSection.id === 'board-section';
        var isTable = activeSection && activeSection.id === 'new-table-section';
        var isTeam = currentView.indexOf('team_instance_') === 0;
        var isHabits = activeSection && activeSection.id === 'aliskanlik-section';

        if (isDiary || isNotes || isFinance || isReminders || isBoard || isTable || isTeam || isHabits) {
            var paneDiary = document.getElementById('notum-cust-diary-preview');
            if (paneDiary) {
                paneDiary.classList.remove('layout-split', 'layout-simple', 'layout-list');
                if (_layout === 'split') {
                    paneDiary.classList.add('layout-split');
                } else if (_layout === 'list') {
                    paneDiary.classList.add('layout-list');
                } else {
                    paneDiary.classList.add('layout-simple');
                }
                
                if (_options.fullWidth) {
                    paneDiary.classList.add('full-width');
                } else {
                    paneDiary.classList.remove('full-width');
                }

                // Update preview background
                paneDiary.className = paneDiary.className.replace(/\bcust-bg-\S+/g, '');
                var clr = _options.color || 'siyah';
                if (clr === 'default' || clr === 'brown' || clr === 'pink' || clr === 'gray' || clr === 'yellow' || clr === 'green' || clr === 'blue' || clr === 'purple' || clr === 'red') clr = 'siyah';
                paneDiary.classList.add('cust-bg-' + clr);
            }
            if (isFinance) {
                renderFinancePreview();
            } else if (isReminders) {
                renderRemindersPreview();
            } else if (isBoard) {
                renderBoardPreview();
            } else if (isTable) {
                renderTablePreview();
            } else if (isTeam) {
                renderTeamPreview();
            } else if (isHabits) {
                renderHabitsPreview();
            } else {
                renderDiaryPreview();
            }
        } else {
            var previewPane = document.getElementById('notum-cust-preview-pane');
            if (!previewPane) return;

            // 1. Layout class
            previewPane.classList.remove('layout-split', 'layout-simple', 'layout-list');
            if (_layout === 'split') {
                previewPane.classList.add('layout-split');
            } else if (_layout === 'list') {
                previewPane.classList.add('layout-list');
            } else {
                previewPane.classList.add('layout-simple');
            }

            // 2. Full Width
            if (_options.fullWidth) {
                previewPane.classList.add('full-width');
            } else {
                previewPane.classList.remove('full-width');
            }

            // 3. Property Icons
            var propIcons = document.querySelectorAll('.notum-cust-prop-icon');
            propIcons.forEach(function (icon) {
                icon.style.display = _options.propertyIcons ? 'inline-block' : 'none';
            });

            // 4. Page Discussions (Comments section)
            var commentsSection = document.getElementById('notum-cust-preview-comments');
            if (commentsSection) {
                var showComments = _options.discussions && _options.comments !== 'hidden';
                commentsSection.style.display = showComments ? 'block' : 'none';
            }

            // 5. Database Templates badge
            var templatesBadge = document.getElementById('notum-cust-preview-templates');
            if (templatesBadge) {
                templatesBadge.style.display = _options.templates ? 'flex' : 'none';
            }
        }
    }

    function renderFinancePreview() {
        var container = document.getElementById('notum-cust-diary-preview');
        if (!container) return;

        var entries = [
            {
                description: "Market Alışverişi",
                category: "Gıda",
                amount: 450.00,
                type: "expense",
                date: new Date().toISOString()
            },
            {
                description: "Maaş Ödemesi",
                category: "Gelir",
                amount: 25000.00,
                type: "income",
                date: new Date().toISOString()
            },
            {
                description: "Aylık İnternet Faturası",
                category: "Fatura",
                amount: 299.90,
                type: "expense",
                date: new Date().toISOString()
            }
        ];

        var showCalendar = _options.calendar !== false;
        var hasSidebar = showCalendar;

        var html = '';
        if (hasSidebar) {
            html += '<div class="notum-cust-diary-layout" style="display: grid; grid-template-columns: 1fr 280px; gap: 24px; width: 100%; align-items: start;">';
        } else {
            html += '<div class="notum-cust-diary-layout" style="width: 100%;">';
        }

        // Main column
        html += '<div class="notum-cust-diary-main" style="flex: 1; min-width: 0; display: flex; flex-direction: column; width: 100%;">';
        
        // List header
        html += '<div class="finance-list-header" style="margin-bottom: 8px;">' +
                '  <span>Açıklama</span>' +
                '  <span>Kategori</span>' +
                '  <span>Tutar</span>' +
                '  <span>Tarih</span>' +
                '</div>';

        html += '<div class="finance-list-body" style="display: flex; flex-direction: column; gap: 0; max-height: none; overflow: visible;">';
        entries.forEach(function (entry) {
            var sign = entry.type === 'income' ? '+' : '-';
            var formattedAmount = entry.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
            
            html += '<div class="finance-item" style="cursor: default;">' +
                    '  <span>' + escapeHtml(entry.description) + '</span>' +
                    '  <span>' + escapeHtml(entry.category) + '</span>' +
                    '  <span class="finance-amount ' + entry.type + '">' + sign + formattedAmount + '</span>' +
                    '  <span class="text-secondary text-sm" style="text-align: right;">' + formatDate(entry.date) + '</span>' +
                    '  <button class="finance-item-kebab" style="opacity: 0.5; cursor: default;" onclick="event.stopPropagation()">' +
                    '    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>' +
                    '  </button>' +
                    '</div>';
        });
        html += '</div>'; // close finance-list-body
        html += '</div>'; // close notum-cust-diary-main

        // Sidebar column
        if (hasSidebar) {
            html += '<div class="notum-cust-diary-sidebar" style="width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px;">';
            html += renderPreviewCalendarHtml();
            html += '</div>'; // close notum-cust-diary-sidebar
        }

        html += '</div>'; // close notum-cust-diary-layout

        container.innerHTML = html;
    }

    function renderDiaryPreview() {
        var container = document.getElementById('notum-cust-diary-preview');
        if (!container) return;

        var activeSection = document.querySelector('.section-panel.active');
        var isNotes = activeSection && activeSection.id === 'notes-section';

        var entries = [];
        if (isNotes) {
            if (typeof Notes !== 'undefined' && Notes.getNotes) {
                entries = Notes.getNotes();
            }
            // Fallback to mock notes if empty
            if (entries.length === 0) {
                entries = [
                    {
                        id: 1,
                        title: "Haftalık Alışveriş Listesi",
                        description: "Marketten alınacaklar: Süt, yumurta, tam buğday ekmeği, taze sebzeler ve meyveler. Ayrıca temizlik malzemelerini de unutma...",
                        createdAt: new Date().toISOString(),
                        comments: [1, 2]
                    },
                    {
                        id: 2,
                        title: "Yazılım Geliştirme Notları",
                        description: "Yeni JavaScript API entegrasyonu için dokümantasyonu oku. CORS hatalarını çözmek için server tarafında headers ayarlarını yapılandır...",
                        createdAt: new Date(Date.now() - 86400000).toISOString(),
                        comments: [1]
                    },
                    {
                        id: 3,
                        title: "Seyahat Rotası Fikirleri",
                        description: "Ege kıyıları turu için gezilecek yerler listesi: Cunda adası, Foça eski liman, Urla bağ yolu ve Şirince köyü...",
                        createdAt: new Date(Date.now() - 172800000).toISOString(),
                        comments: []
                    }
                ];
            }
        } else {
            if (typeof Diary !== 'undefined' && Diary.getEntries) {
                entries = Diary.getEntries();
            }
            // Fallback to mock entries if empty
            if (entries.length === 0) {
                entries = [
                    {
                        id: 1,
                        title: "Harika Bir Doğa Yürüyüşü",
                        text: "Bugün sabah erkenden Belgrad Ormanı'na gittik. Temiz hava ve kuş sesleri eşliğinde 8 kilometrelik harika bir yürüyüş yaptık. Son zamanlarda geçirdiğim en huzurlu pazar günüydü diyebilirim...",
                        date: new Date().toISOString().split('T')[0],
                        location: "Belgrad Ormanı, İstanbul",
                        image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400&auto=format&fit=crop",
                        comments: [1, 2, 3]
                    },
                    {
                        id: 2,
                        title: "Yeni Proje Başlangıcı",
                        text: "Uzun süredir planladığım web uygulaması projesi için bugün nihayet ilk satır kodları yazmaya başladım. Figma'daki arayüz tasarımlarını inceleyip React bileşenlerini ve veri modelini oluşturdum...",
                        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                        location: "Kolektif House, Levent",
                        comments: [1]
                    },
                    {
                        id: 3,
                        title: "Kitap Önerileri ve Kahve Keyfi",
                        text: "Öğleden sonra mahalledeki yeni açılan sessiz kahveciye gidip biraz vakit geçirdim. Sıcak bir filtre kahve eşliğinde yeni aldığım kitabı okumaya başladım. Kitabın dili oldukça akıcı...",
                        date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
                        location: "Brew & Read Cafe",
                        comments: [1, 2]
                    }
                ];
            }
        }

        // Check if calendar or specialDays is enabled (diary only)
        var showCalendar = (_options.calendar !== false); // default to true
        var showSpecialDays = (_options.specialDays !== false); // default to true
        var hasSidebar = showCalendar || showSpecialDays;

        var html = '';
        if (hasSidebar) {
            html += '<div class="notum-cust-diary-layout" style="display: grid; grid-template-columns: 1fr 280px; gap: 24px; width: 100%; align-items: start;">';
        } else {
            html += '<div class="notum-cust-diary-layout" style="width: 100%;">';
        }

        // Main column (Grid + Comments)
        html += '<div class="notum-cust-diary-main" style="flex: 1; min-width: 0; display: flex; flex-direction: column; width: 100%;">';

        // Grid width styling based on fullWidth option
        var widthClass = _options.fullWidth ? 'full-width' : '';
        var layoutClass;
        var cols = _options.columns || (isNotes ? 3 : 2);

        if (_layout === 'list') {
            // List layout - flat list view
            html += '<div class="list-view-container">';
            entries.forEach(function (entry) {
                var iconSvg = isNotes
                    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
                    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>';
                var dateStr = isNotes ? formatDate(entry.createdAt) : formatDate(entry.date);
                
                var commentCount = (entry.comments && entry.comments.length) || 0;
                var commentHtml = '';
                if (commentCount > 0) {
                    commentHtml = '  <span class="list-view-item-comment-badge" style="display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--color-text-secondary, #64748b); flex-shrink: 0; margin-left: 4px; line-height: 1;">' +
                                  '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-tertiary, #94a3b8); display: inline-block; vertical-align: middle;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="8" y1="9" x2="16" y2="9"></line><line x1="8" y1="13" x2="14" y2="13"></line></svg>' +
                                  '    <span style="font-weight: 500;">' + commentCount + '</span>' +
                                  '  </span>';
                }

                html +=
                    '<div class="list-view-item" style="cursor: default;">' +
                    '  <div class="list-view-item-icon">' + iconSvg + '</div>' +
                    '  <div class="list-view-item-title-wrapper" style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0;">' +
                    '    <span class="list-view-item-title" style="flex: 0 1 auto !important; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + escapeHtml(entry.title || 'Başlıksız') + '</span>' +
                    commentHtml +
                    '  </div>' +
                    (_options.showDate !== false ? '  <span class="list-view-item-date">' + dateStr + '</span>' : '') +
                    '</div>';
            });
            html += '</div>';
        } else {
            if (cols === 1) {
                layoutClass = 'grid-1-col';
            } else if (cols === 2) {
                layoutClass = 'grid-2-cols';
            } else if (cols === 3) {
                layoutClass = 'grid-3-cols';
            } else {
                layoutClass = isNotes ? 'grid-3-cols' : 'grid-2-cols';
            }

            html += '<div class="notum-cust-diary-grid ' + widthClass + ' ' + layoutClass + '">';
            entries.forEach(function (entry) {
                var commentCount = (entry.comments && entry.comments.length) || 0;
                if (isNotes) {
                    if (_layout === 'split') {
                        // Tablo layout card for Notes
                        var editDeleteHtml = 
                            '<div class="tablo-card-actions" style="display: flex; gap: 8px; margin-left: auto;">' +
                            '  <button class="tablo-action-btn edit-btn" style="background:#ffffff; border:1px solid var(--color-border, #cbd5e1); border-radius:6px; padding:6px; display:flex; align-items:center; justify-content:center; color:var(--color-text-secondary); cursor:pointer;">' +
                            '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
                            '  </button>' +
                            '  <button class="tablo-action-btn delete-btn" style="background:#ffffff; border:1px solid var(--color-border, #cbd5e1); border-radius:6px; padding:6px; display:flex; align-items:center; justify-content:center; color:var(--color-text-secondary); cursor:pointer;">' +
                            '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>' +
                            '  </button>' +
                            '</div>';

                        var imageHtml = '';
                        if (entry.photos && entry.photos.length > 0) {
                            imageHtml = '<div class="tablo-card-image" style="margin-top: 12px; border-radius: 8px; overflow: hidden; height: 120px;">' +
                                        '  <img src="' + entry.photos[0] + '" style="width: 100%; height: 100%; object-fit: cover;" alt="Note Image">' +
                                        '</div>';
                        }

                        var commentHtml = '';
                        if (commentCount > 0) {
                            commentHtml = '    <span class="tablo-comment-badge" style="background: var(--color-bg-subtle, #f1f5f9); color: var(--color-text-secondary, #475569); border: 1px solid var(--color-border-subtle, #e2e8f0); padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;">' +
                                          '      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-tertiary, #94a3b8);"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="8" y1="9" x2="16" y2="9"></line><line x1="8" y1="13" x2="14" y2="13"></line></svg>' +
                                          '      <span>' + commentCount + '</span>' +
                                          '    </span>';
                        }

                        html +=
                            '<div class="note-card tablo-style-card">' +
                            '  <div class="tablo-card-top-row" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; width: 100%;">' +
                            (_options.showDate !== false ? '    <span class="tablo-date-badge" style="background: #2b3139; color: #ffffff; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; white-space: nowrap;">' + formatDate(entry.createdAt) + '</span>' : '') +
                            commentHtml +
                            editDeleteHtml +
                            '  </div>' +
                            '  <div style="border-top: 1px solid var(--color-border-subtle, #e2e8f0); margin: 0 -18px 12px -18px;"></div>' +
                            '  <div class="note-card-body" style="flex:1;">' +
                            '    <h3 class="diary-card-title" style="font-size: 18px; font-weight: 700; color: var(--color-text, #0f172a); margin-bottom: 8px;">' + escapeHtml(entry.title || 'Başlıksız') + '</h3>' +
                            (entry.description ? '    <p class="diary-card-desc" style="font-size: 13px; color: var(--color-text-secondary, #475569); line-height: 1.5;">' + (typeof Notes !== 'undefined' && Notes.parseDescription ? Notes.parseDescription(entry, true) : escapeHtml(entry.description)) + '</p>' : '') +
                            imageHtml +
                            '  </div>' +
                            '</div>';
                    } else {
                        // Simple layout card for Notes
                        var photoCount = (entry.photos && entry.photos.length) || 0;
                        var photoHtml = '';
                        if (photoCount > 0) {
                            photoHtml = '<span class="note-card-photo-badge" style="margin-right: 12px;">' +
                                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
                                '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>' +
                                '<circle cx="8.5" cy="8.5" r="1.5"/>' +
                                '<polyline points="21 15 16 10 5 21"/>' +
                                '</svg> ' + photoCount +
                                '</span>';
                        }

                        var commentHtml = '';
                        if (commentCount > 0) {
                            commentHtml = '<span class="note-card-comment-badge" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--color-text-secondary, #64748b); font-weight: 500; margin-right: 4px;">' +
                                          '  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-tertiary, #94a3b8); vertical-align: middle;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="8" y1="9" x2="16" y2="9"></line><line x1="8" y1="13" x2="14" y2="13"></line></svg>' +
                                          '  <span>' + commentCount + '</span>' +
                                          '</span>';
                        }

                        html +=
                            '<div class="note-card">' +
                            '  <div class="note-card-body">' +
                            '    <h3 class="note-card-title">' + escapeHtml(entry.title || 'Başlıksız') + '</h3>' +
                            (entry.description ? '    <p class="note-card-desc">' + (typeof Notes !== 'undefined' && Notes.parseDescription ? Notes.parseDescription(entry, true) : escapeHtml(entry.description)) + '</p>' : '') +
                            '  </div>' +
                            '  <div class="note-card-footer" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; padding-top: 8px;">' +
                            '    <div class="note-card-footer-left" style="display: flex; align-items: center; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; flex: 1;">' +
                            '    </div>' +
                            '    <div class="note-card-footer-right" style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">' +
                            photoHtml +
                            commentHtml +
                            (_options.showDate !== false ? '      <span class="note-card-date">' + formatDate(entry.createdAt) + '</span>' : '') +
                            '    </div>' +
                            '  </div>' +
                            '</div>';
                    }
                } else {
                    if (_layout === 'split') {
                        // Tablo (Table) layout card
                        var editDeleteHtml = 
                            '<div class="tablo-card-actions" style="display: flex; gap: 8px; margin-left: auto;">' +
                            '  <button class="tablo-action-btn edit-btn" style="background:#ffffff; border:1px solid var(--color-border, #cbd5e1); border-radius:6px; padding:6px; display:flex; align-items:center; justify-content:center; color:var(--color-text-secondary); cursor:pointer;">' +
                            '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
                            '  </button>' +
                            '  <button class="tablo-action-btn delete-btn" style="background:#ffffff; border:1px solid var(--color-border, #cbd5e1); border-radius:6px; padding:6px; display:flex; align-items:center; justify-content:center; color:var(--color-text-secondary); cursor:pointer;">' +
                            '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>' +
                            '  </button>' +
                            '</div>';

                        var imageHtml = '';
                        if (entry.image) {
                            imageHtml = '<div class="tablo-card-image" style="margin-top: 12px; border-radius: 8px; overflow: hidden; height: 120px;">' +
                                        '  <img src="' + entry.image + '" style="width: 100%; height: 100%; object-fit: cover;" alt="Entry Image">' +
                                        '</div>';
                        }

                        var commentHtml = '';
                        if (commentCount > 0) {
                            commentHtml = '    <span class="tablo-comment-badge" style="background: var(--color-bg-subtle, #f1f5f9); color: var(--color-text-secondary, #475569); border: 1px solid var(--color-border-subtle, #e2e8f0); padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;">' +
                                          '      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-tertiary, #94a3b8);"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="8" y1="9" x2="16" y2="9"></line><line x1="8" y1="13" x2="14" y2="13"></line></svg>' +
                                          '      <span>' + commentCount + '</span>' +
                                          '    </span>';
                        }

                        html +=
                            '<div class="diary-card tablo-style-card">' +
                            '  <div class="tablo-card-top-row" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; width: 100%;">' +
                            (_options.showDate !== false ? '    <span class="tablo-date-badge" style="background: #2b3139; color: #ffffff; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; white-space: nowrap;">' + formatDate(entry.date) + '</span>' : '') +
                            commentHtml +
                            (entry.location && _options.propertyIcons ? '    <span class="tablo-location-badge" style="background: #eff6ff; color: #2563eb; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">' +
                            '      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
                            '      <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + escapeHtml(entry.location) + '</span>' +
                            '    </span>' : '') +
                            editDeleteHtml +
                            '  </div>' +
                            '  <div style="border-top: 1px solid var(--color-border-subtle, #e2e8f0); margin: 0 -18px 12px -18px;"></div>' +
                            '  <div class="diary-card-body" style="flex:1;">' +
                            '    <h3 class="diary-card-title" style="font-size: 18px; font-weight: 700; color: var(--color-text, #0f172a); margin-bottom: 8px;">' + escapeHtml(entry.title || 'Başlıksız') + '</h3>' +
                            (entry.text ? '    <p class="diary-card-desc" style="font-size: 13px; color: var(--color-text-secondary, #475569); line-height: 1.5;">' + escapeHtml(entry.text) + '</p>' : '') +
                            imageHtml +
                            '  </div>' +
                            '</div>';
                    } else {
                        // Default diary card design
                        var locationHtml = '';
                        if (entry.location && _options.propertyIcons) {
                            locationHtml = '<span class="diary-card-location" style="display:flex; align-items:center; gap:4px; font-size:11px; color:var(--color-text-tertiary);">' +
                                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                                '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>' +
                                '<circle cx="12" cy="10" r="3"/>' +
                                '</svg>' +
                                '<span>' + escapeHtml(entry.location) + '</span>' +
                                '</span>';
                        }

                        var commentHtml = '';
                        if (commentCount > 0) {
                            commentHtml = '<span class="diary-card-comment-badge" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--color-text-secondary, #64748b); font-weight: 500; margin-right: 4px;">' +
                                          '  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-tertiary, #94a3b8); vertical-align: middle;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="8" y1="9" x2="16" y2="9"></line><line x1="8" y1="13" x2="14" y2="13"></line></svg>' +
                                          '  <span>' + commentCount + '</span>' +
                                          '</span>';
                        }

                        var dateHtml = '';
                        if (_options.propertyIcons && _options.showDate !== false) {
                            dateHtml = commentHtml + '<span class="diary-card-date" style="font-size:11px; color:var(--color-text-tertiary);">' + formatDate(entry.date) + '</span>';
                        } else if (commentCount > 0) {
                            dateHtml = commentHtml;
                        }

                        html +=
                            '<div class="diary-card">' +
                            '  <div class="diary-card-body">' +
                            '    <div class="diary-card-header">' +
                            '      <h3 class="diary-card-title">' + escapeHtml(entry.title || 'Başlıksız') + '</h3>' +
                            '    </div>' +
                            (entry.text ? '    <p class="diary-card-desc">' + escapeHtml(entry.text) + '</p>' : '') +
                            '  </div>' +
                            '  <div class="diary-card-footer" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; border-top: 1px solid var(--color-border-subtle); padding-top: 8px;">' +
                            '    <div class="diary-card-footer-left" style="display: flex; align-items: center; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; flex: 1;">' +
                            locationHtml +
                            '    </div>' +
                            dateHtml +
                            '  </div>' +
                            '</div>';
                    }
                }
            });
            html += '</div>';
        } // end else (non-list layout)

        html += '</div>'; // close notum-cust-diary-main
        // Sidebar column
        if (hasSidebar) {
            html += '<div class="notum-cust-diary-sidebar" style="width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px;">';
            if (showCalendar) {
                html += renderPreviewCalendarHtml();
            }
            if (showSpecialDays) {
                html += renderPreviewSpecialDaysHtml();
            }
            html += '</div>'; // close notum-cust-diary-sidebar
        }

        html += '</div>'; // close notum-cust-diary-layout

        container.innerHTML = html;
    }

    function updateSidebarUI() {
        // Layout cards
        var cards = document.querySelectorAll('.notum-cust-layout-card');
        cards.forEach(function (card) {
            var cardType = card.getAttribute('data-layout');
            card.classList.toggle('active', cardType === _layout);
        });

        // Switches
        var checkboxDiscussions = document.getElementById('notum-cust-toggle-discussions');
        if (checkboxDiscussions) checkboxDiscussions.checked = _options.discussions;

        var checkboxPropertyIcons = document.getElementById('notum-cust-toggle-propertyIcons');
        if (checkboxPropertyIcons) checkboxPropertyIcons.checked = _options.propertyIcons;

        var checkboxFullWidth = document.getElementById('notum-cust-toggle-fullWidth');
        if (checkboxFullWidth) checkboxFullWidth.checked = _options.fullWidth;

        var checkboxTemplates = document.getElementById('notum-cust-toggle-templates');
        if (checkboxTemplates) checkboxTemplates.checked = _options.templates;

        var checkboxCalendar = document.getElementById('notum-cust-toggle-calendar');
        if (checkboxCalendar) checkboxCalendar.checked = _options.calendar !== false;

        var checkboxSpecialDays = document.getElementById('notum-cust-toggle-specialDays');
        if (checkboxSpecialDays) checkboxSpecialDays.checked = _options.specialDays !== false;

        var checkboxShowDate = document.getElementById('notum-cust-toggle-showDate');
        if (checkboxShowDate) checkboxShowDate.checked = _options.showDate !== false;

        // Comments / Columns label
        var label = document.getElementById('notum-cust-comments-label');
        if (label) {
            var activeSection = document.querySelector('.section-panel.active');
            var isNotes = activeSection && activeSection.id === 'notes-section';
            if (isNotes) {
                if (_options.columns === undefined) _options.columns = 3;
                label.textContent = _options.columns;
            } else {
                label.textContent = _options.comments === 'default' ? 'Varsayılan' : (_options.comments === 'hidden' ? 'Gizli' : 'Genişletilmiş');
            }
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            // Clean up ISO time component (e.g. T19:41:49.321Z) if present
            if (dateStr.indexOf('T') !== -1) {
                dateStr = dateStr.split('T')[0];
            }
            var parts = dateStr.split('-');
            if (parts.length === 3) {
                return parts[2] + '.' + parts[1] + '.' + parts[0];
            }
            return dateStr;
        } catch (e) {
            return dateStr;
        }
    }

    var _previewCalendarDate = new Date();

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

    var DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    var MONTH_NAMES = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    function renderPreviewCalendarHtml() {
        var year = _previewCalendarDate.getFullYear();
        var month = _previewCalendarDate.getMonth();
        var titleText = MONTH_NAMES[month] + ' ' + year;
        
        var firstDay = new Date(year, month, 1).getDay();
        var startingDay = firstDay === 0 ? 6 : firstDay - 1;
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var prevMonthLastDay = new Date(year, month, 0).getDate();
        
        var today = new Date();
        var entries = [];
        if (typeof Diary !== 'undefined' && Diary.getEntries) {
            entries = Diary.getEntries();
        }
        
        var entryDays = {};
        entries.forEach(function (entry) {
            if (!entry || !entry.date) return;
            try {
                var d = new Date(entry.date);
                if (d.getFullYear() === year && d.getMonth() === month) {
                    entryDays[d.getDate()] = true;
                }
            } catch (err) { }
        });
        
        var daysHtml = '';
        
        // Prev month padding
        for (var i = startingDay; i > 0; i--) {
            var dayNum = prevMonthLastDay - i + 1;
            daysHtml += '<div class="calendar-day padding">' + dayNum + '</div>';
        }
        
        // This month days
        for (var day = 1; day <= daysInMonth; day++) {
            var dateObj = new Date(year, month, day);
            var isToday = dateObj.toDateString() === today.toDateString();
            var hasEntry = entryDays[day];
            
            var dayClass = 'calendar-day';
            if (isToday) dayClass += ' today';
            if (hasEntry) dayClass += ' has-entries';
            
            daysHtml += '<div class="' + dayClass + '" style="cursor: default;">' + day;
            if (hasEntry) {
                daysHtml += '<div class="day-dots"><span class="dot diary-dot"></span></div>';
            }
            daysHtml += '</div>';
        }
        
        var html = 
            '<div class="calendar-widget diary-calendar" style="width: 100%; box-sizing: border-box;">' +
            '    <div class="calendar-header">' +
            '        <button class="calendar-nav-btn" onclick="PageCustomizer.prevPreviewMonth(event)">' +
            '            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">' +
            '                <path d="M15 18l-6-6 6-6" />' +
            '            </svg>' +
            '        </button>' +
            '        <h3 class="calendar-title">' + titleText + '</h3>' +
            '        <button class="calendar-nav-btn" onclick="PageCustomizer.nextPreviewMonth(event)">' +
            '            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">' +
            '                <path d="M9 18l6-6-6-6" />' +
            '            </svg>' +
            '        </button>' +
            '    </div>' +
            '    <div class="calendar-weekdays">' +
            '        <span>Pzt</span><span>Sal</span><span>Çar</span><span>Per</span><span>Cum</span><span>Cmt</span><span>Paz</span>' +
            '    </div>' +
            '    <div class="calendar-days">' + daysHtml + '</div>' +
            '</div>';
            
        return html;
    }

    function renderPreviewSpecialDaysHtml() {
        var year = _previewCalendarDate.getFullYear();
        var month = _previewCalendarDate.getMonth();
        
        var rawDays = [];
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        for (var day = 1; day <= daysInMonth; day++) {
            var mmdd = String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
            if (SPECIAL_DAYS[mmdd]) {
                rawDays.push({ day: day, info: SPECIAL_DAYS[mmdd] });
            }
        }
        var yearHolidays = RELIGIOUS_HOLIDAYS[year];
        if (yearHolidays) {
            yearHolidays.forEach(function (h) {
                if (h.month === month + 1) {
                    rawDays.push({ day: h.day, info: { name: h.name, type: h.type } });
                }
            });
        }
        rawDays.sort(function (a, b) { return a.day - b.day; });

        var today = new Date();
        today = new Date(today.getFullYear(), today.getMonth(), today.getDate());

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
            return '<div class="special-days-card" style="width: 100%; box-sizing: border-box;">' +
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
        }

        var html =
            '<div class="special-days-card" style="width: 100%; box-sizing: border-box;">' +
            '<div class="special-days-header">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>' +
            '<line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>' +
            '<line x1="3" y1="10" x2="21" y2="10"/>' +
            '</svg>' +
            '<span>Önemli Günler</span>' +
            '<span class="special-days-badge">' + days.length + '</span>' +
            '</div>' +
            '<div class="special-days-list" style="max-height: 250px; overflow-y: auto;">';

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
        return html;
    }

    function renderRemindersPreview() {
        var container = document.getElementById('notum-cust-diary-preview');
        if (!container) return;

        var entries = [
            { title: "Diş Hekimi Randevusu", time: "Yarın, 14:00", checked: false },
            { title: "Elektrik Faturasını Öde", time: "05 Temmuz 2026", checked: true },
            { title: "Kitap Kulübü Buluşması", time: "Cuma, 19:30", checked: false }
        ];

        var html = '<div class="notum-cust-diary-layout" style="width: 100%;">';
        html += '<div class="notum-cust-diary-main" style="flex: 1; display: flex; flex-direction: column; gap: 12px; width: 100%;">';
        
        entries.forEach(function (entry) {
            var checkIcon = entry.checked ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color:#ffffff;"><polyline points="20 6 9 17 4 12"/></svg>' : '';
            var bgStyle = entry.checked ? 'background-color:#006adc; border-color:#006adc;' : 'background-color:transparent; border-color:var(--color-border, #cbd5e1);';
            var titleStyle = entry.checked ? 'text-decoration: line-through; color: var(--color-text-secondary);' : 'color: var(--color-text);';

            html += '<div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--color-bg-elevated, #ffffff); border: 1px solid var(--color-border, #e2e8f0); border-radius: 8px;">' +
                    '  <div style="width: 18px; height: 18px; border-radius: 4px; border: 2px solid; display: flex; align-items: center; justify-content: center; cursor: default; flex-shrink: 0; ' + bgStyle + '">' + checkIcon + '</div>' +
                    '  <div style="display: flex; flex-direction: column; gap: 2px; flex: 1;">' +
                    '    <span style="font-size: 14px; font-weight: 500; ' + titleStyle + '">' + escapeHtml(entry.title) + '</span>' +
                    '    <span style="font-size: 11px; color: var(--color-text-secondary, #64748b);">' + escapeHtml(entry.time) + '</span>' +
                    '  </div>' +
                    '</div>';
        });

        html += '</div></div>';
        container.innerHTML = html;
    }

    function renderBoardPreview() {
        var container = document.getElementById('notum-cust-diary-preview');
        if (!container) return;

        var columns = [
            { title: "Yapılacaklar", count: 2, cards: ["Mobil Tasarım", "API Dokümantasyonu"] },
            { title: "Devam Edenler", count: 1, cards: ["Veritabanı Göçü"] },
            { title: "Tamamlananlar", count: 1, cards: ["Giriş Ekranı"] }
        ];

        var html = '<div class="notum-cust-diary-layout" style="width: 100%;">';
        html += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; width: 100%;">';

        columns.forEach(function (col) {
            html += '<div style="display: flex; flex-direction: column; gap: 12px;">' +
                    '  <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--color-text-secondary);">' +
                    '    <span>' + escapeHtml(col.title) + '</span>' +
                    '    <span style="background: var(--color-bg-subtle, #f1f5f9); padding: 2px 6px; border-radius: 4px; font-size: 11px;">' + col.count + '</span>' +
                    '  </div>' +
                    '  <div style="display: flex; flex-direction: column; gap: 8px;">';

            col.cards.forEach(function (card) {
                html += '    <div style="padding: 12px; background: var(--color-bg-elevated, #ffffff); border: 1px solid var(--color-border, #e2e8f0); border-radius: 8px; font-size: 13px; font-weight: 500; color: var(--color-text); box-shadow: 0 1px 3px rgba(0,0,0,0.02);">' + escapeHtml(card) + '</div>';
            });

            html += '  </div>' +
                    '</div>';
        });

        html += '</div></div>';
        container.innerHTML = html;
    }

    function renderTablePreview() {
        var container = document.getElementById('notum-cust-diary-preview');
        if (!container) return;

        var html = '<div class="notum-cust-diary-layout" style="width: 100%; overflow-x: auto;">';
        html += '<table style="width: 100%; border-collapse: collapse; background: var(--color-bg-elevated, #ffffff); border: 1px solid var(--color-border, #e2e8f0); border-radius: 8px; overflow: hidden; font-size: 13px;">' +
                '  <thead>' +
                '    <tr style="background: var(--color-bg-subtle, #f8fafc); border-bottom: 1px solid var(--color-border, #e2e8f0); text-align: left; font-weight: 600; color: var(--color-text-secondary);">' +
                '      <th style="padding: 10px 14px;">Ad</th>' +
                '      <th style="padding: 10px 14px;">Durum</th>' +
                '      <th style="padding: 10px 14px;">Tarih</th>' +
                '    </tr>' +
                '  </thead>' +
                '  <tbody>' +
                '    <tr style="border-bottom: 1px solid var(--color-border-subtle, #f1f5f9); color: var(--color-text);">' +
                '      <td style="padding: 10px 14px; font-weight: 500;">Proje Planı</td>' +
                '      <td style="padding: 10px 14px;"><span style="background:#eff6ff; color:#2563eb; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:600;">Planlandı</span></td>' +
                '      <td style="padding: 10px 14px; color: var(--color-text-secondary);">01 Temmuz 2026</td>' +
                '    </tr>' +
                '    <tr style="border-bottom: 1px solid var(--color-border-subtle, #f1f5f9); color: var(--color-text);">' +
                '      <td style="padding: 10px 14px; font-weight: 500;">Arayüz Tasarımı</td>' +
                '      <td style="padding: 10px 14px;"><span style="background:#fef3c7; color:#d97706; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:600;">Devam Ediyor</span></td>' +
                '      <td style="padding: 10px 14px; color: var(--color-text-secondary);">03 Temmuz 2026</td>' +
                '    </tr>' +
                '  </tbody>' +
                '</table>';

        html += '</div>';
        container.innerHTML = html;
    }

    function renderTeamPreview() {
        var container = document.getElementById('notum-cust-diary-preview');
        if (!container) return;

        var members = [
            { name: "Muhammet Algan", role: "Ürün Yöneticisi", avatar: "MA" },
            { name: "Burak Aktürk", role: "Kıdemli Geliştirici", avatar: "BA" },
            { name: "Zeynep Yılmaz", role: "Tasarımcı", avatar: "ZY" }
        ];

        var html = '<div class="notum-cust-diary-layout" style="width: 100%;">';
        html += '<div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">';

        members.forEach(function (m) {
            html += '<div style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--color-bg-elevated, #ffffff); border: 1px solid var(--color-border, #e2e8f0); border-radius: 8px;">' +
                    '  <div style="width: 32px; height: 32px; border-radius: 50%; background: #64748b; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0;">' + m.avatar + '</div>' +
                    '  <div style="display: flex; flex-direction: column; gap: 2px;">' +
                    '    <span style="font-size: 13px; font-weight: 600; color: var(--color-text);">' + escapeHtml(m.name) + '</span>' +
                    '    <span style="font-size: 11px; color: var(--color-text-secondary);">' + escapeHtml(m.role) + '</span>' +
                    '  </div>' +
                    '</div>';
        });

        html += '</div></div>';
        container.innerHTML = html;
    }

    function renderHabitsPreview() {
        var container = document.getElementById('notum-cust-diary-preview');
        if (!container) return;

        var habits = [
            { title: "Kitap Okuma", streak: "5 Gün", progress: [true, true, true, false, true, true, true] },
            { title: "Spor Yapma", streak: "3 Gün", progress: [false, true, true, true, false, false, true] },
            { title: "Yabancı Dil Çalışma", streak: "12 Gün", progress: [true, true, true, true, true, true, true] }
        ];

        var html = '<div class="notum-cust-diary-layout" style="width: 100%;">';
        html += '<div style="display: flex; flex-direction: column; gap: 16px; width: 100%;">';

        habits.forEach(function (h) {
            html += '<div style="padding: 14px; background: var(--color-bg-elevated, #ffffff); border: 1px solid var(--color-border, #e2e8f0); border-radius: 10px; display: flex; flex-direction: column; gap: 10px;">' +
                    '  <div style="display: flex; justify-content: space-between; align-items: center;">' +
                    '    <span style="font-size: 13px; font-weight: 600; color: var(--color-text);">' + escapeHtml(h.title) + '</span>' +
                    '    <span style="font-size: 11px; font-weight: 500; color:#10b981; background:#ecfdf5; padding:2px 8px; border-radius:12px;">Seri: ' + h.streak + '</span>' +
                    '  </div>' +
                    '  <div style="display: flex; gap: 6px;">';

            h.progress.forEach(function (active) {
                var bg = active ? '#3b82f6' : 'rgba(59, 130, 246, 0.15)';
                html += '    <div style="flex: 1; height: 16px; border-radius: 4px; background-color: ' + bg + ';"></div>';
            });

            html += '  </div>' +
                    '</div>';
        });

        html += '</div></div>';
        container.innerHTML = html;
    }

    function prevPreviewMonth(e) {
        if (e) e.stopPropagation();
        _previewCalendarDate.setMonth(_previewCalendarDate.getMonth() - 1);
        var currentView = localStorage.getItem('app_current_section') || '';
        var activeSection = document.querySelector('.section-panel.active');
        var isFinance = activeSection && activeSection.id === 'finance-section';
        var isReminders = activeSection && activeSection.id === 'reminders-section';
        var isBoard = activeSection && activeSection.id === 'board-section';
        var isTable = activeSection && activeSection.id === 'new-table-section';
        var isTeam = currentView.indexOf('team_instance_') === 0;
        var isHabits = activeSection && activeSection.id === 'aliskanlik-section';

        if (isFinance) {
            renderFinancePreview();
        } else if (isReminders) {
            renderRemindersPreview();
        } else if (isBoard) {
            renderBoardPreview();
        } else if (isTable) {
            renderTablePreview();
        } else if (isTeam) {
            renderTeamPreview();
        } else if (isHabits) {
            renderHabitsPreview();
        } else {
            renderDiaryPreview();
        }
    }

    function nextPreviewMonth(e) {
        if (e) e.stopPropagation();
        _previewCalendarDate.setMonth(_previewCalendarDate.getMonth() + 1);
        var currentView = localStorage.getItem('app_current_section') || '';
        var activeSection = document.querySelector('.section-panel.active');
        var isFinance = activeSection && activeSection.id === 'finance-section';
        var isReminders = activeSection && activeSection.id === 'reminders-section';
        var isBoard = activeSection && activeSection.id === 'board-section';
        var isTable = activeSection && activeSection.id === 'new-table-section';
        var isTeam = currentView.indexOf('team_instance_') === 0;
        var isHabits = activeSection && activeSection.id === 'aliskanlik-section';

        if (isFinance) {
            renderFinancePreview();
        } else if (isReminders) {
            renderRemindersPreview();
        } else if (isBoard) {
            renderBoardPreview();
        } else if (isTable) {
            renderTablePreview();
        } else if (isTeam) {
            renderTeamPreview();
        } else if (isHabits) {
            renderHabitsPreview();
        } else {
            renderDiaryPreview();
        }
    }

    function applyChanges() {
        saveState();
        
        if (typeof Diary !== 'undefined' && Diary.render) {
            Diary.render();
        }
        if (typeof Notes !== 'undefined' && Notes.render) {
            Notes.render();
        }
        if (typeof Finance !== 'undefined' && Finance.render) {
            Finance.render();
        }
        if (typeof Reminders !== 'undefined' && Reminders.render) {
            Reminders.render();
        }
        if (typeof Board !== 'undefined' && Board.render) {
            Board.render();
        }
        if (typeof NewTable !== 'undefined' && NewTable.render) {
            NewTable.render();
        }
        if (typeof Aliskanlik !== 'undefined' && Aliskanlik.render) {
            Aliskanlik.render();
        }
        
        applyAllSavedColors();

        close();
    }

    function cancel() {
        loadState();
        
        if (typeof SayfaMenusu !== 'undefined' && SayfaMenusu.toggleFullWidth) {
            SayfaMenusu.toggleFullWidth(_options.fullWidth);
            var mainCheckbox = document.getElementById('notum-toggle-full-width');
            if (mainCheckbox) {
                mainCheckbox.checked = _options.fullWidth;
            }
        }
        
        if (typeof Diary !== 'undefined' && Diary.render) {
            Diary.render();
        }
        if (typeof Notes !== 'undefined' && Notes.render) {
            Notes.render();
        }
        if (typeof Finance !== 'undefined' && Finance.render) {
            Finance.render();
        }
        if (typeof Reminders !== 'undefined' && Reminders.render) {
            Reminders.render();
        }
        if (typeof Board !== 'undefined' && Board.render) {
            Board.render();
        }
        if (typeof NewTable !== 'undefined' && NewTable.render) {
            NewTable.render();
        }
        if (typeof Aliskanlik !== 'undefined' && Aliskanlik.render) {
            Aliskanlik.render();
        }
        
        applyAllSavedColors();

        close();
    }

    // Close comments and color dropdown on click away
    document.addEventListener('click', function () {
        closeCommentsDropdown();
        closeColorDropdown();
    });

    // Call loadState on script execution
    loadState();
    setTimeout(function() {
        applyAllSavedColors();
    }, 100);

    return {
        open: open,
        close: close,
        selectLayout: selectLayout,
        toggleOption: toggleOption,
        toggleCommentsDropdown: toggleCommentsDropdown,
        changeCommentsOption: changeCommentsOption,
        changeColumnsOption: changeColumnsOption,
        prevPreviewMonth: prevPreviewMonth,
        nextPreviewMonth: nextPreviewMonth,
        applyChanges: applyChanges,
        cancel: cancel,
        
        // Color dropdown triggers & options
        toggleColorDropdown: toggleColorDropdown,
        changeColorOption: changeColorOption,
        applyAllSavedColors: applyAllSavedColors
    };
})();

// Auto-open on page refresh if saved in localStorage
document.addEventListener('DOMContentLoaded', function () {
    try {
        if (localStorage.getItem('notion_customizer_open') === 'true') {
            setTimeout(function () {
                PageCustomizer.open();
            }, 200);
        }
        // Apply colors on load
        setTimeout(function() {
            PageCustomizer.applyAllSavedColors();
        }, 300);
    } catch (e) {
        console.error('Failed to auto-open page customizer:', e);
    }
});
