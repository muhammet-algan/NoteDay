var Aliskanlik = (function () {
    function getInstanceKey(key) {
        var currentSection = localStorage.getItem('app_current_section') || '';
        if (currentSection.indexOf('aliskanlik_instance_') !== -1) {
            return key + '_' + currentSection;
        }
        return key;
    }

    var localDB = {
        getForUser: function(key) {
            return window.DB.getForUser(getInstanceKey(key));
        },
        setForUser: function(key, value) {
            window.DB.setForUser(getInstanceKey(key), value);
        }
    };
    var DB = localDB;


    var MONTH_NAMES_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    var DAY_NAMES_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    var COLOR_MAP = {
        'Siyah': { hex: '#1e293b', rgb: '30, 41, 59' },
        'Kırmızı': { hex: '#ef4444', rgb: '239, 68, 68' },
        'Turuncu': { hex: '#f97316', rgb: '249, 115, 22' },
        'Sarı': { hex: '#eab308', rgb: '234, 179, 8' },
        'Yeşil': {
            get hex() { return (document.documentElement.getAttribute('data-theme') === 'dark') ? '#26a641' : '#2ea44f'; },
            get rgb() { return (document.documentElement.getAttribute('data-theme') === 'dark') ? '38, 166, 65' : '46, 164, 79'; }
        },
        'Mavi': { hex: '#3b82f6', rgb: '59, 130, 246' },
        'Mor': { hex: '#a855f7', rgb: '168, 85, 247' },
        'Pembe': { hex: '#ec4899', rgb: '236, 72, 153' },
        'Kahverengi': { hex: '#8b5a2b', rgb: '139, 90, 43' }
    };

    var DEFAULT_PROPERTIES = [
        { id: 'date', type: 'date', label: 'Başlangıç Tarihi', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>', valueId: 'aliskanlik-property-date', removable: false },
        { id: 'color', type: 'color', label: 'Renk Seçimi', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"></path><circle cx="7.5" cy="10.5" r="1"></circle><circle cx="11.5" cy="7.5" r="1"></circle><circle cx="16.5" cy="9.5" r="1"></circle></svg>', valueId: 'aliskanlik-property-color', valueText: 'Mavi', removable: true }
    ];

    var isInitialized = false;
    var currentComments = [];
    var showAliskanlikCommentInput = false;
    var visibleReplies = {};
    var activeReplyInput = null;

    function init() {
        if (isInitialized) return;
        isInitialized = true;

        // Auto-save title changes
        document.addEventListener('input', function (e) {
            if (e.target.closest('#aliskanlik-section')) {
                save();
            }
        });

        // Also save when focus is lost
        document.addEventListener('focusout', function (e) {
            if (e.target.closest('#aliskanlik-section')) {
                save();
            }
        });
    }

    function formatDateStr(date) {
        var d = date.getDate();
        var m = MONTH_NAMES_TR[date.getMonth()];
        var y = date.getFullYear();
        return d + ' ' + m + ' ' + y;
    }

    function formatDateTime(dateStr) {
        var d = new Date(dateStr);
        var pad = function(n) { return n < 10 ? '0' + n : n; };
        var datePart = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        var timePart = pad(d.getHours()) + ':' + pad(d.getMinutes());
        return datePart + ', ' + timePart;
    }

    function markUpdated() {
        var now = new Date().toISOString();
        DB.setForUser('aliskanlik_updated_date', now);
        
        // Ensure "updated-date" property is added to the properties list
        var properties = DB.getForUser('aliskanlik_properties') || DEFAULT_PROPERTIES.slice();
        var hasUpdatedDate = properties.some(function(p) { return p.id === 'updated-date'; });
        if (!hasUpdatedDate) {
            var dateIdx = properties.findIndex(function(p) { return p.id === 'date'; });
            var newProp = {
                id: 'updated-date',
                type: 'updated-date',
                label: 'Düzenlenme Tarihi',
                icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>',
                valueId: 'aliskanlik-property-updated-date',
                removable: true
            };
            if (dateIdx !== -1) {
                properties.splice(dateIdx + 1, 0, newProp);
            } else {
                properties.push(newProp);
            }
            DB.setForUser('aliskanlik_properties', properties);
        }
    }

    function togglePropertyDropdown(event) {
        event.stopPropagation();
        var dropdown = document.getElementById('aliskanlik-property-dropdown');
        if (!dropdown) return;
        var isActive = dropdown.classList.contains('active');
        document.querySelectorAll('.notum-property-add-dropdown.active').forEach(function(d) {
            d.classList.remove('active');
        });
        if (!isActive) {
            dropdown.classList.add('active');
            setTimeout(function() {
                document.addEventListener('click', closePropertyDropdownOutside);
            }, 0);
        }
    }

    function closePropertyDropdownOutside(e) {
        var dropdown = document.getElementById('aliskanlik-property-dropdown');
        if (dropdown && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
            document.removeEventListener('click', closePropertyDropdownOutside);
        }
    }

    function toggleColorDropdown(event, element) {
        event.stopPropagation();
        var dropdown = document.getElementById('aliskanlik-color-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.id = 'aliskanlik-color-dropdown';
            dropdown.className = 'notum-property-add-dropdown';
            dropdown.style.position = 'absolute';
            dropdown.style.zIndex = '10001';
            document.body.appendChild(dropdown);
        }

        dropdown.innerHTML = '';
        Object.keys(COLOR_MAP).forEach(function (colorName) {
            var colorData = COLOR_MAP[colorName];
            var item = document.createElement('div');
            item.className = 'notum-property-add-dropdown-item';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '8px';
            item.style.padding = '6px 12px';
            item.style.cursor = 'pointer';

            // Oval kare (rounded rect) icon
            var icon = document.createElement('span');
            icon.style.display = 'inline-block';
            icon.style.width = '16px';
            icon.style.height = '12px';
            icon.style.borderRadius = '4px';
            icon.style.backgroundColor = colorData.hex;
            icon.style.flexShrink = '0';

            var label = document.createElement('span');
            label.className = 'dropdown-item-label';
            label.textContent = colorName;

            item.appendChild(icon);
            item.appendChild(label);

            item.addEventListener('click', function () {
                selectColor(colorName);
                dropdown.classList.remove('active');
                dropdown.style.display = 'none';
            });

            dropdown.appendChild(item);
        });

        var isActive = dropdown.classList.contains('active');
        document.querySelectorAll('.notum-property-add-dropdown.active').forEach(function(d) {
            d.classList.remove('active');
            d.style.display = 'none';
        });

        if (!isActive) {
            dropdown.classList.add('active');
            dropdown.style.display = 'block';
            
            var rect = element.getBoundingClientRect();
            var left = rect.left + window.scrollX;
            var top = rect.bottom + window.scrollY + 4;
            dropdown.style.left = left + 'px';
            dropdown.style.top = top + 'px';

            setTimeout(function() {
                document.addEventListener('click', closeColorDropdownOutside);
            }, 0);
        } else {
            dropdown.classList.remove('active');
            dropdown.style.display = 'none';
        }
    }

    function closeColorDropdownOutside(e) {
        var dropdown = document.getElementById('aliskanlik-color-dropdown');
        if (dropdown && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
            dropdown.style.display = 'none';
            document.removeEventListener('click', closeColorDropdownOutside);
        }
    }

    function selectColor(colorName) {
        DB.setForUser('aliskanlik_selected_color', colorName);
        markUpdated();
        render();
    }

    function saveProperties() {
        var container = document.getElementById('aliskanlik-properties');
        if (!container) return;
        var rows = container.querySelectorAll('.notum-property-row');
        var props = [];
        rows.forEach(function (row) {
            var type = row.getAttribute('data-property-type');
            var id = row.getAttribute('data-id') || ('prop_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
            var labelSpan = row.querySelector('.notum-property-label span:not(.dropdown-item-label)');
            var label = labelSpan ? labelSpan.textContent.trim() : '';
            var svgEl = row.querySelector('.notum-property-label svg');
            var icon = svgEl ? svgEl.outerHTML : '';
            var valueEl = row.querySelector('.notum-property-value');
            var valueId = valueEl ? valueEl.id : '';
            var valueText = '';
            var checked = false;

            // Read values depending on type
            if (type === 'checkbox') {
                var cb = row.querySelector('.notum-property-checkbox');
                checked = cb ? cb.classList.contains('checked') : false;
                var input = row.querySelector('.notum-property-checkbox-label');
                valueText = input ? input.value : '';
            } else if (type === 'tag') {
                var badge = row.querySelector('.notum-property-tag-badge');
                var input = row.querySelector('.notum-property-tag-input');
                valueText = (badge && badge.style.display !== 'none') ? badge.textContent.trim() : (input ? input.value : '');
            } else if (type === 'status') {
                var badge = row.querySelector('.notum-property-status-badge');
                valueText = badge ? badge.textContent.trim() : '';
            } else {
                var inputVal = row.querySelector('.notum-property-value-input');
                if (inputVal) {
                    valueText = inputVal.value;
                } else if (valueEl) {
                    valueText = valueEl.textContent.trim();
                }
            }

            var removable = row.classList.contains('removable');

            props.push({
                id: id,
                type: type,
                label: label,
                icon: icon,
                valueId: valueId,
                valueText: valueText,
                checked: checked,
                removable: removable
            });
        });
        DB.setForUser('aliskanlik_properties', props);
        markUpdated();
    }

    function addProperty(type, labelElement) {
        var dropdown = document.getElementById('aliskanlik-property-dropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
        document.removeEventListener('click', closePropertyDropdownOutside);

        if (type === 'comments') {
            showAliskanlikCommentInput = !showAliskanlikCommentInput;
            renderAddComments();
            if (showAliskanlikCommentInput) {
                setTimeout(function() {
                    var input = document.getElementById('aliskanlik-comment-input');
                    if (input) input.focus();
                }, 50);
            }
            return;
        }

        var properties = DB.getForUser('aliskanlik_properties') || DEFAULT_PROPERTIES.slice();

        // Clean old keys if present
        properties = properties.filter(function(p) { return p.id !== 'days' && p.id !== 'success'; });

        var sourceRow = labelElement ? labelElement.closest('.notum-property-row') : null;
        var sourceId = sourceRow ? sourceRow.getAttribute('data-id') : null;

        var newProp = null;
        if (sourceId) {
            var src = properties.find(function(p) { return p.id === sourceId; });
            if (src) {
                var uniqueId = 'prop_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                newProp = {
                    id: uniqueId,
                    type: src.type,
                    label: src.label + ' (Klon)',
                    icon: src.icon,
                    valueId: 'val_' + uniqueId,
                    valueText: src.valueText || '',
                    checked: src.checked || false,
                    removable: true
                };
            }
        }

        if (!newProp) {
            var uniqueId = 'prop_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            var label = 'Yeni Özellik';
            var icon = '';
            var valText = 'Değer';

            if (type === 'color') {
                label = 'Renk Seçimi';
                icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"></path><circle cx="7.5" cy="10.5" r="1"></circle><circle cx="11.5" cy="7.5" r="1"></circle><circle cx="16.5" cy="9.5" r="1"></circle></svg>';
                valText = 'Mavi';
            } else if (type === 'tag') {
                label = 'Etiket';
                icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>';
                valText = '';
            } else if (type === 'status') {
                label = 'Durum';
                icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>';
                valText = 'Başlamadı';
            } else if (type === 'checkbox') {
                label = 'Onay Kutusu';
                icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 12l2 2 4-4"></path></svg>';
                valText = '';
            } else if (type === 'location') {
                label = 'Konum';
                icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
                valText = '';
            } else if (type === 'comments') {
                label = 'Yorum';
                icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
                valText = '';
            }

            newProp = {
                id: 'prop_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                type: type || 'status',
                label: label,
                icon: icon,
                valueId: 'val_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                valueText: valText,
                checked: false,
                removable: true
            };
        }

        var insertIndex = properties.length;
        if (sourceId) {
            var idx = properties.findIndex(function(p) { return p.id === sourceId; });
            if (idx !== -1) insertIndex = idx + 1;
        }

        properties.splice(insertIndex, 0, newProp);
        DB.setForUser('aliskanlik_properties', properties);

        markUpdated();
        render();
    }

    function removeProperty(btnElement) {
        var row = btnElement.closest('.notum-property-row');
        if (row) {
            row.remove();
            saveProperties();
            render();
        }
    }

    function toggleCheckbox(el) {
        el.classList.toggle('checked');
        saveProperties();
    }

    function saveTag(input) {
        saveProperties();
        render();
    }

    function editTag(badge) {
        var container = badge.closest('.notum-property-tag-container');
        if (container) {
            var input = container.querySelector('.notum-property-tag-input');
            if (input) {
                input.style.setProperty('display', '', 'important');
                badge.style.setProperty('display', 'none', 'important');
                input.focus();
                input.select();
            }
        }
    }

    function toggleStatusDropdown(event, badge) {
        event.stopPropagation();
        var wrapper = badge.closest('.notum-property-status-wrapper');
        if (!wrapper) return;
        var dropdown = wrapper.querySelector('.notum-property-status-dropdown');
        if (!dropdown) return;
        
        var active = dropdown.classList.contains('active');
        document.querySelectorAll('.notum-property-status-dropdown.active').forEach(function(d) {
            d.classList.remove('active');
        });
        if (!active) {
            dropdown.classList.add('active');
            var closeDropdown = function(e) {
                dropdown.classList.remove('active');
                document.removeEventListener('click', closeDropdown);
            };
            setTimeout(function() {
                document.addEventListener('click', closeDropdown);
            }, 0);
        }
    }

    function selectStatus(option, value) {
        var row = option.closest('.notum-property-row');
        if (row) {
            var badge = row.querySelector('.notum-property-status-badge');
            if (badge) {
                badge.textContent = value;
                badge.className = 'notum-property-status-badge';
                var cls = 'status-not-started';
                if (value === 'Devam ediyor') cls = 'status-in-progress';
                else if (value === 'Tamamlandı') cls = 'status-completed';
                badge.classList.add(cls);
            }
        }
        saveProperties();
        render();
    }

    function render() {
        init();

        var titleInput = document.getElementById('aliskanlik-title-input');
        if (!titleInput) return;

        // 1. Load Habit Title
        var storedTitle = DB.getForUser('aliskanlik_title');
        titleInput.value = (storedTitle !== null) ? storedTitle : '';

        // Load Comments
        currentComments = DB.getForUser('aliskanlik_comments') || [];

        // 2. Load or Initialize Creation Date
        var creationDateStr = DB.getForUser('aliskanlik_creation_date');
        if (!creationDateStr) {
            creationDateStr = new Date().toISOString();
            DB.setForUser('aliskanlik_creation_date', creationDateStr);
        }
        var creationDate = new Date(creationDateStr);
        creationDate.setHours(0, 0, 0, 0);

        // Calculate total days elapsed (including today)
        var today = new Date();
        today.setHours(0, 0, 0, 0);

        var diffTime = today.getTime() - creationDate.getTime();
        var diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays < 1) diffDays = 1;

        // 3. Load Checked Days
        var checkedDays = DB.getForUser('aliskanlik_checked_days') || [];

        // 4. Render Properties
        var properties = DB.getForUser('aliskanlik_properties');
        if (properties) {
            var filtered = properties.filter(function(p) { return p.type !== 'comments'; });
            if (filtered.length !== properties.length) {
                properties = filtered;
                DB.setForUser('aliskanlik_properties', properties);
            }
        }
        if (!properties || properties.some(function(p) { return p.id === 'days' || p.id === 'success'; })) {
            properties = DEFAULT_PROPERTIES.slice();
            DB.setForUser('aliskanlik_properties', properties);
        }

        var propertiesContainer = document.getElementById('aliskanlik-properties');
        if (propertiesContainer) {
            propertiesContainer.innerHTML = '';
            
            var selectedColor = DB.getForUser('aliskanlik_selected_color') || 'Mavi';

            properties.forEach(function (prop) {
                var row = document.createElement('div');
                row.className = 'notum-property-row' + (prop.removable ? ' removable' : '');
                row.setAttribute('data-property-type', prop.type);
                row.setAttribute('data-id', prop.id);

                // Determine display value
                var displayVal = '';
                if (prop.id === 'date') {
                    displayVal = formatDateStr(creationDate);
                } else if (prop.id === 'updated-date') {
                    var savedUpdateDate = DB.getForUser('aliskanlik_updated_date');
                    displayVal = savedUpdateDate ? formatDateTime(savedUpdateDate) : '';
                } else if (prop.type === 'color') {
                    displayVal = selectedColor;
                } else {
                    displayVal = prop.valueText || '';
                }

                var labelHtml = '';
                if (prop.type !== 'date') {
                    labelHtml = '<span class="notum-property-label clickable-menu" onclick="PropertyMenu.show(event, this, \'' + prop.type + '\', \'aliskanlik\')" style="display: flex; align-items: center; gap: 6px; width: 220px; color: var(--color-text-secondary); font-size: 13px; cursor: pointer;">' +
                                prop.icon +
                                '<span>' + prop.label + '</span>' +
                                '</span>';
                } else {
                    labelHtml = '<span class="notum-property-label" style="display: flex; align-items: center; gap: 6px; width: 220px; color: var(--color-text-secondary); font-size: 13px;">' +
                                prop.icon +
                                '<span>' + prop.label + '</span>' +
                                '</span>';
                }

                var valueHtml = '';
                if (prop.id === 'date' || prop.id === 'updated-date') {
                    valueHtml = '<span class="notum-property-value" id="' + prop.valueId + '" style="color: var(--color-text); font-size: 13px; font-weight: 500;">' + displayVal + '</span>';
                } else if (prop.type === 'color') {
                    valueHtml = '<span class="notum-property-value clickable" onclick="Aliskanlik.toggleColorDropdown(event, this)" style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 500;">' + 
                                '<span style="display: inline-block; width: 14px; height: 10px; border-radius: 3px; background-color: ' + (COLOR_MAP[displayVal] ? COLOR_MAP[displayVal].hex : '#3b82f6') + ';"></span>' +
                                '<span>' + displayVal + '</span>' +
                                '</span>';
                } else if (prop.type === 'checkbox') {
                    valueHtml = '<div style="display: flex; align-items: center; gap: 8px; flex: 1;">' +
                                '<div class="notum-property-checkbox' + (prop.checked ? ' checked' : '') + '" onclick="Aliskanlik.toggleCheckbox(this)">' +
                                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
                                '</div>' +
                                '<input type="text" class="notum-property-checkbox-label" placeholder="" value="' + displayVal + '" oninput="Aliskanlik.saveProperties()">' +
                                '</div>';
                } else if (prop.type === 'tag') {
                    var hasVal = !!(displayVal || '').trim();
                    valueHtml = '<div class="notum-property-tag-container" style="flex: 1; display: flex; align-items: center;">' +
                                '<input type="text" class="notum-property-tag-input" placeholder="Etiket yazın..." value="' + displayVal + '" oninput="Aliskanlik.saveProperties()" onkeydown="if(event.key === \'Enter\') { Aliskanlik.saveTag(this); }" style="' + (hasVal ? 'display: none !important;' : '') + '">' +
                                '<div class="notum-property-tag-badge" onclick="Aliskanlik.editTag(this)" style="' + (hasVal ? 'display: inline-flex !important;' : 'display: none !important;') + '">' + displayVal + '</div>' +
                                '</div>';
                } else if (prop.type === 'status') {
                    var cls = 'status-not-started';
                    if (displayVal === 'Devam ediyor') cls = 'status-in-progress';
                    else if (displayVal === 'Tamamlandı') cls = 'status-completed';
                    
                    valueHtml = '<div class="notum-property-status-wrapper" style="flex: 1; display: flex; align-items: center; position: relative;">' +
                                '<span class="notum-property-status-badge ' + cls + '" onclick="Aliskanlik.toggleStatusDropdown(event, this)">' + displayVal + '</span>' +
                                '<div class="notum-property-status-dropdown">' +
                                '<div class="notum-property-status-option status-not-started" onclick="Aliskanlik.selectStatus(this, \'Başlamadı\')">Başlamadı</div>' +
                                '<div class="notum-property-status-option status-in-progress" onclick="Aliskanlik.selectStatus(this, \'Devam ediyor\')">Devam ediyor</div>' +
                                '<div class="notum-property-status-option status-completed" onclick="Aliskanlik.selectStatus(this, \'Tamamlandı\')">Tamamlandı</div>' +
                                '</div>' +
                                '</div>';
                } else {
                    valueHtml = '<input type="text" class="notum-property-value-input" value="' + displayVal + '" oninput="Aliskanlik.saveProperties()" style="border: none; background: transparent; color: var(--color-text); font-size: 13px; font-weight: 500; outline: none; width: 100%; padding: 0;">';
                }

                var removeBtnHtml = prop.removable ? '<button type="button" class="notum-property-remove-btn" onclick="Aliskanlik.removeProperty(this)" title="Kaldır">&times;</button>' : '';

                row.innerHTML = labelHtml + valueHtml + removeBtnHtml;
                propertiesContainer.appendChild(row);
            });

            // Initialize Property Drag and Drop
            PropertyMenu.initDragAndDrop(propertiesContainer, 'aliskanlik');
        }

        // 5. Render Grid
        renderGrid(creationDate, today, checkedDays, diffDays);

        // 6. Render Comments
        renderAddComments();
    }

    function renderGrid(creationDate, today, checkedDays, diffDays) {
        var gridContainer = document.getElementById('aliskanlik-grid-container');
        if (!gridContainer) return;

        gridContainer.innerHTML = '';

        var MONTH_NAMES_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

        var isDark = (document.documentElement.getAttribute('data-theme') === 'dark');
        var emptyColor = isDark ? '#161b22' : '#ebedf0';
        var cellBorder = isDark ? '1px solid rgba(240, 246, 252, 0.06)' : '1px solid rgba(27, 31, 35, 0.06)';
        var labelColor = isDark ? '#8b949e' : '#24292f';

        // 1. Weekday labels: Row 0 -> Pzt (grid-row: 2), Row 2 -> Çar (grid-row: 4), Row 4 -> Cum (grid-row: 6), Row 6 -> Paz (grid-row: 8)
        var weekdaysToRender = [
            { row: 0, label: 'Pzt' },
            { row: 2, label: 'Çar' },
            { row: 4, label: 'Cum' },
            { row: 6, label: 'Paz' }
        ];
        weekdaysToRender.forEach(function (wd) {
            var labelDiv = document.createElement('div');
            labelDiv.style.gridColumn = '1';
            labelDiv.style.gridRow = (wd.row + 2).toString();
            labelDiv.style.fontSize = '11px';
            labelDiv.style.color = labelColor;
            labelDiv.style.fontWeight = '400';
            labelDiv.style.paddingRight = '6px';
            labelDiv.style.textAlign = 'right';
            labelDiv.style.alignSelf = 'center';
            labelDiv.style.whiteSpace = 'nowrap';
            labelDiv.style.boxSizing = 'border-box';
            labelDiv.textContent = wd.label;
            gridContainer.appendChild(labelDiv);
        });

        // 2. Calculate the Monday of the creation week
        // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
        // We need Monday-based index: Mon=0, Tue=1, ..., Sun=6
        var creationDayOfWeek = creationDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        var mondayOffset = (creationDayOfWeek === 0) ? 6 : (creationDayOfWeek - 1); // Mon=0, Tue=1, ..., Sun=6

        var gridStartDate = new Date(creationDate);
        gridStartDate.setDate(creationDate.getDate() - mondayOffset);
        gridStartDate.setHours(0, 0, 0, 0);

        var lastDisplayedMonth = -1;

        var selectedColor = DB.getForUser('aliskanlik_selected_color') || 'Mavi';
        var colorData = COLOR_MAP[selectedColor] || COLOR_MAP['Mavi'];

        for (var col = 0; col < 52; col++) {
            // Monday of this week column
            var weekMonday = new Date(gridStartDate);
            weekMonday.setDate(gridStartDate.getDate() + col * 7);
            weekMonday.setHours(0, 0, 0, 0);

            var currentMonth = weekMonday.getMonth();
            
            // If it's the start of the grid, or a new month starts, place month label
            if (col === 0 || currentMonth !== lastDisplayedMonth) {
                var monthDiv = document.createElement('div');
                monthDiv.style.gridColumn = (col + 2).toString();
                monthDiv.style.gridRow = '1';
                monthDiv.style.fontSize = '11px';
                monthDiv.style.color = labelColor;
                monthDiv.style.fontWeight = '400';
                monthDiv.style.textAlign = 'left';
                monthDiv.style.alignSelf = 'center';
                monthDiv.style.lineHeight = '1';
                monthDiv.style.paddingBottom = '4px';
                monthDiv.style.whiteSpace = 'nowrap';
                monthDiv.style.width = '0px';
                monthDiv.style.overflow = 'visible';
                monthDiv.textContent = MONTH_NAMES_SHORT[currentMonth];
                gridContainer.appendChild(monthDiv);
                
                lastDisplayedMonth = currentMonth;
            }

            for (var row = 0; row < 7; row++) {
                // row 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
                var cellDate = new Date(weekMonday);
                cellDate.setDate(weekMonday.getDate() + row);
                cellDate.setHours(0, 0, 0, 0);

                // Calculate dayOffset relative to creationDate (for checkedDays compatibility)
                var diffFromCreation = Math.round((cellDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));


                var isFuture = cellDate.getTime() > today.getTime();
                var isChecked = checkedDays.indexOf(diffFromCreation) > -1;

                var cell = document.createElement('div');
                cell.className = 'aliskanlik-grid-cell';
                cell.setAttribute('data-offset', diffFromCreation);

                // Grid position
                cell.style.gridColumn = (col + 2).toString();
                cell.style.gridRow = (row + 2).toString();

                // Style
                cell.style.width = '100%';
                cell.style.aspectRatio = '1 / 1';
                cell.style.borderRadius = '3px';
                cell.style.boxSizing = 'border-box';
                cell.style.transition = 'background-color 0.15s, transform 0.1s';
                cell.style.border = cellBorder;

                if (isFuture) {
                    // Future day: disabled, light gray
                    cell.style.backgroundColor = emptyColor;
                    cell.style.opacity = '0.35';
                    cell.style.cursor = 'not-allowed';
                    cell.title = 'Gelecek Tarih: ' + formatDateStr(cellDate);
                } else {
                    // Active day: clickable (past or today)
                    cell.style.cursor = 'pointer';
                    
                    if (isChecked) {
                        cell.style.backgroundColor = colorData.hex;
                        cell.style.boxShadow = '0 0 3px rgba(' + colorData.rgb + ', 0.4)';
                    } else {
                        cell.style.backgroundColor = 'rgba(' + colorData.rgb + ', 0.15)';
                    }

                    cell.title = formatDateStr(cellDate) + (isChecked ? ' (Tamamlandı)' : ' (Tamamlanmadı)');

                    // Wrap variables for closure inside event listeners
                    (function (offset, isCellChecked, element, cDate) {
                        // Hover effects
                        element.addEventListener('mouseover', function () {
                            var currentList = DB.getForUser('aliskanlik_checked_days') || [];
                            if (!currentList.includes(offset)) {
                                element.style.backgroundColor = 'rgba(' + colorData.rgb + ', 0.35)';
                                element.style.transform = 'scale(1.15)';
                            }
                        });
                        element.addEventListener('mouseout', function () {
                            var currentList = DB.getForUser('aliskanlik_checked_days') || [];
                            if (!currentList.includes(offset)) {
                                element.style.backgroundColor = 'rgba(' + colorData.rgb + ', 0.15)';
                            }
                            element.style.transform = 'scale(1)';
                        });

                        // Click selection handler
                        element.addEventListener('click', function (e) {
                            if (cDate.getTime() > today.getTime()) {
                                return;
                            }

                            var checkedList = DB.getForUser('aliskanlik_checked_days') || [];
                            var listIndex = checkedList.indexOf(offset);

                            if (listIndex > -1) {
                                checkedList.splice(listIndex, 1);
                            } else {
                                checkedList.push(offset);
                            }

                            DB.setForUser('aliskanlik_checked_days', checkedList);
                            
                            // Mark updated (shows/updates Düzenlenme Tarihi)
                            markUpdated();
                            
                            // Re-render properties and grid
                            render();
                        });
                    })(diffFromCreation, isChecked, cell, new Date(cellDate));
                }

                gridContainer.appendChild(cell);
            }
        }
    }

    /* =================== YORUMLAR (COMMENTS) MODÜLÜ =================== */

    function generateId() {
        return 'id_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
    }

    function escapeHtml(text) {
        if (!text) return '';
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    function getRelativeTimeString(dateStr) {
        var date = new Date(dateStr);
        var now = new Date();
        var diffMs = now - date;
        var diffMins = Math.floor(diffMs / 60000);
        var diffHours = Math.floor(diffMs / 3600000);
        var diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'şimdi';
        if (diffMins < 60) return diffMins + ' dk önce';
        if (diffHours < 24) return diffHours + ' sa önce';
        if (diffDays < 7) return diffDays + ' gün önce';
        
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) + ', ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }

    function getCommentAvatarHtml(comment) {
        var user = (typeof Auth !== 'undefined') ? Auth.getUser() : null;
        var email = comment ? (comment.email || 'default') : (user ? (user.email || 'default') : 'default');
        var firstName = comment ? (comment.firstName || 'U') : (user ? (user.firstName || 'U') : 'U');
        var lastName = comment ? (comment.lastName || '') : (user ? (user.lastName || '') : '');
        var initials = (firstName.charAt(0) + (lastName.charAt(0) || '')).toUpperCase();
        
        var avatarUrl = null;
        try {
            avatarUrl = localStorage.getItem('avatar_' + email);
        } catch(e) {}
        
        var avatarStyle = '';
        var avatarContent = '';
        
        if (avatarUrl) {
            avatarStyle = 'background-image: url(' + avatarUrl + '); background-size: cover; background-position: center;';
        } else {
            avatarStyle = 'background-color: #64748b; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 500; font-size: 12px;';
            avatarContent = escapeHtml(initials);
        }
        
        return '<div class="comment-avatar-wrapper" style="width: 30px; height: 30px; flex-shrink: 0; user-select: none;">' +
               '  <div class="comment-avatar" style="width: 30px; height: 30px; border-radius: 50%; ' + avatarStyle + '">' + avatarContent + '</div>' +
               '</div>';
    }

    function buildCommentsHTML(commentsList) {
        var list = commentsList || [];
        var count = list.length;
        var showInput = showAliskanlikCommentInput;
        
        var container = document.getElementById('aliskanlik-comments-section');
        
        if (count === 0 && !showInput) {
            if (container) container.style.display = 'none';
            return '';
        } else {
            if (container) container.style.display = 'block';
        }
        
        var html = 
            '<div class="comments-container" style="margin-top: 0px;">' +
            '  <div style="font-size: 12px; font-weight: 500; color: var(--color-text-secondary, #64748b); margin-bottom: 8px; display: flex; align-items: center;">' +
            '    <span>Yorumlar</span>' +
            '  </div>';
            
        html += '  <div class="comments-list" style="padding-right: 4px;">';
        
        var user = (typeof Auth !== 'undefined') ? Auth.getUser() : null;
        var currentUserEmail = user ? (user.email || 'default') : 'default';
        var curFirstName = (user && user.firstName) ? user.firstName : 'Burak';
        var curLastName = (user && user.lastName) ? user.lastName : 'Aktürk';
        var curEmail = (user && user.email) ? user.email : 'burak@noteday.com';
        var curUserAvatar = getCommentAvatarHtml({ firstName: curFirstName, lastName: curLastName, email: curEmail });

        if (count > 0) {
            list.forEach(function (comment) {
                var name = ((comment.firstName || '') + ' ' + (comment.lastName || '')).trim() || 'Kullanıcı';
                var relativeTime = getRelativeTimeString(comment.date);
                var commentText = escapeHtml(comment.text);
                var likes = comment.likes || [];
                var dislikes = comment.dislikes || [];
                var replies = comment.replies || [];
                
                var hasLiked = likes.includes(currentUserEmail);
                var hasDisliked = dislikes.includes(currentUserEmail);
                
                var likeIcon = hasLiked ? 
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-accent, #3b82f6);"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>' :
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>';
                var dislikeIcon = hasDisliked ?
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-accent, #3b82f6);"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>' :
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>';

                var timeBadge = relativeTime + (comment.edited ? ' (düzenlendi)' : '');

                html +=
                    '    <div class="comment-item" style="display: flex; gap: 10px; margin-bottom: 12px; align-items: flex-start; position: relative;">' +
                    '      <div style="margin-top: 8px;">' + getCommentAvatarHtml(comment) + '</div>' +
                    '      <div class="comment-body" style="flex: 1; min-width: 0; margin-top: 2px; padding-right: 24px;">' +
                    '        <div class="comment-header" style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 2px;">' +
                    '          <span class="comment-author" style="font-weight: 600; font-size: 13px; color: var(--color-text, #1e293b);">' + escapeHtml(name) + '</span>' +
                    '          <span class="comment-time" style="font-size: 11px; color: var(--color-text-secondary, #94a3b8);">' + timeBadge + '</span>' +
                    '        </div>' +
                    '        <div id="comment-text-' + comment.id + '" data-raw-text="' + escapeHtml(comment.text) + '" class="comment-text" style="font-size: 13px; color: var(--color-text); line-height: 1.4; word-break: break-word;">' + commentText + '</div>' +
                    
                    // Likes, Dislikes, Reply Action Buttons
                    '        <div class="comment-action-buttons" style="display: flex; align-items: center; gap: 14px; margin-top: 6px; font-size: 11px; color: var(--color-text-secondary, #64748b);">' +
                    '          <button type="button" onclick="Aliskanlik.likeComment(\'' + comment.id + '\')" style="display: inline-flex !important; align-items: center !important; border: none !important; background: transparent !important; cursor: pointer !important; color: inherit !important; padding: 0 !important; margin: 0 !important; outline: none !important; height: 14px !important; line-height: 1 !important; transform: none !important; transition: none !important;">' +
                    '            ' + likeIcon +
                    '            ' + (likes.length > 0 ? '<span style="font-size: 11px; margin-left: 4px; line-height: 1; display: inline-block;">' + likes.length + '</span>' : '') +
                    '          </button>' +
                    '          <button type="button" onclick="Aliskanlik.dislikeComment(\'' + comment.id + '\')" style="display: inline-flex !important; align-items: center !important; border: none !important; background: transparent !important; cursor: pointer !important; color: inherit !important; padding: 0 !important; margin: 0 !important; outline: none !important; height: 14px !important; line-height: 1 !important; transform: none !important; transition: none !important;">' +
                    '            ' + dislikeIcon +
                    '          </button>' +
                    '          <button type="button" onclick="Aliskanlik.showReplyInput(\'' + comment.id + '\')" style="border: none; background: transparent; cursor: pointer; color: var(--color-text-secondary, #64748b); font-weight: 600; padding: 0; font-size: 11px; outline: none;">' +
                    '            Yanıtla' +
                    '          </button>' +
                    '        </div>' +
                    
                    // Reply Input Box
                    '        <div id="reply-input-row-' + comment.id + '" style="display: ' + (activeReplyInput === comment.id ? 'flex' : 'none') + '; gap: 8px; margin-top: 16px; align-items: center;">' +
                    '          <div style="flex-shrink: 0;">' + curUserAvatar + '</div>' +
                    '          <input type="text" id="reply-field-' + comment.id + '" class="comment-input-field" placeholder="Yanıt ekleyin..." style="flex: 1; border: none; outline: none; background: transparent; font-size: 12px; color: var(--color-text); padding: 4px 0;" onkeydown="if(event.key === \'Enter\') { Aliskanlik.addReply(\'' + comment.id + '\'); }" oninput="var btn = document.getElementById(\'reply-submit-btn-\' + \'' + comment.id + '\'); if (this.value.trim()) { btn.style.background = \'#0f172a\'; btn.style.color = \'#ffffff\'; } else { btn.style.background = \'#f1f5f9\'; btn.style.color = \'#cbd5e1\'; }">' +
                    '          <button type="button" id="reply-submit-btn-' + comment.id + '" class="comment-submit-btn" onclick="Aliskanlik.addReply(\'' + comment.id + '\')" style="background: #f1f5f9; color: #cbd5e1; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease; outline: none; padding: 0; flex-shrink: 0;">' +
                    '            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>' +
                    '          </button>' +
                    '        </div>';

                // Replies Toggle Button
                if (replies.length > 0) {
                    var isRepliesVisible = !!visibleReplies[comment.id];
                    var toggleText = isRepliesVisible ? 'Yanıtları gizle' : (replies.length + ' yanıt');
                    var toggleIcon = isRepliesVisible ? 
                        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>' :
                        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';

                    html +=
                        '        <div style="margin-top: 8px;">' +
                        '          <button type="button" onclick="Aliskanlik.toggleReplies(\'' + comment.id + '\')" style="border: none; background: transparent; cursor: pointer; color: #3b82f6; font-weight: 600; font-size: 11px; display: flex; align-items: center; gap: 4px; padding: 0; outline: none;">' +
                        '            <span>' + toggleText + '</span>' +
                        '            ' + toggleIcon +
                        '          </button>' +
                        '        </div>';

                    // Nested Replies List
                    if (isRepliesVisible) {
                        html += '        <div class="replies-list-container">';
                        replies.forEach(function (reply) {
                            var rName = ((reply.firstName || '') + ' ' + (reply.lastName || '')).trim() || 'Kullanıcı';
                            var rRelativeTime = getRelativeTimeString(reply.date);
                            var rLikes = reply.likes || [];
                            var rDislikes = reply.dislikes || [];
                            var rHasLiked = rLikes.includes(currentUserEmail);
                            var rHasDisliked = rDislikes.includes(currentUserEmail);
                            
                            var rLikeIcon = rHasLiked ? 
                                '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-accent, #3b82f6);"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>' :
                                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>';
                            var rDislikeIcon = rHasDisliked ?
                                '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-accent, #3b82f6);"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>' :
                                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>';

                            var rTimeBadge = rRelativeTime + (reply.edited ? ' (düzenlendi)' : '');

                            html +=
                                '          <div class="reply-item-wrapper">' +
                                '            <div style="margin-top: 4px; transform: scale(0.85);">' + getCommentAvatarHtml(reply) + '</div>' +
                                '            <div class="reply-body" style="flex: 1; min-width: 0; margin-top: 2px;">' +
                                '              <div class="reply-header" style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 2px;">' +
                                '                <span class="reply-author" style="font-weight: 600; font-size: 12px; color: var(--color-text, #1e293b);">' + escapeHtml(rName) + '</span>' +
                                '                <span class="reply-time" style="font-size: 10px; color: var(--color-text-secondary, #94a3b8);">' + rTimeBadge + '</span>' +
                                '              </div>' +
                                '              <div id="comment-text-' + reply.id + '" data-raw-text="' + escapeHtml(reply.text) + '" class="reply-text" style="font-size: 12px; color: var(--color-text); line-height: 1.4; word-break: break-word;">' + escapeHtml(reply.text) + '</div>' +
                                '              <div class="reply-action-buttons" style="display: flex; align-items: center; gap: 12px; margin-top: 4px; font-size: 10px; color: var(--color-text-secondary, #64748b);">' +
                                '                <button type="button" onclick="Aliskanlik.likeComment(\'' + comment.id + '\', \'' + reply.id + '\')" style="display: inline-flex !important; align-items: center !important; border: none !important; background: transparent !important; cursor: pointer !important; color: inherit !important; padding: 0 !important; margin: 0 !important; outline: none !important; height: 12px !important; line-height: 1 !important; transform: none !important; transition: none !important;">' +
                                '                  ' + rLikeIcon +
                                '                  ' + (rLikes.length > 0 ? '<span style="font-size: 10px; margin-left: 3px; line-height: 1; display: inline-block;">' + rLikes.length + '</span>' : '') +
                                '                </button>' +
                                '                <button type="button" onclick="Aliskanlik.dislikeComment(\'' + comment.id + '\', \'' + reply.id + '\')" style="display: inline-flex !important; align-items: center !important; border: none !important; background: transparent !important; cursor: pointer !important; color: inherit !important; padding: 0 !important; margin: 0 !important; outline: none !important; height: 12px !important; line-height: 1 !important; transform: none !important; transition: none !important;">' +
                                '                  ' + rDislikeIcon +
                                '                </button>' +
                                '                <button type="button" onclick="Aliskanlik.showReplyInput(\'' + comment.id + '\')" style="border: none; background: transparent; cursor: pointer; color: var(--color-text-secondary, #64748b); font-weight: 600; padding: 0; font-size: 10px; outline: none;">' +
                                '                  Yanıtla' +
                                '                </button>' +
                                '              </div>' +
                                '            </div>' +
                                
                                // 3 dots action menu for reply
                                '            <div class="comment-actions-trigger" style="margin-left: auto; flex-shrink: 0; align-self: flex-start; margin-top: 4px;">' +
                                '              <button type="button" class="comment-more-btn" onclick="Aliskanlik.toggleCommentDropdown(event, \'' + reply.id + '\')" title="İşlemler">' +
                                '                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>' +
                                '              </button>' +
                                '              <div id="comment-dropdown-' + reply.id + '" class="comment-dropdown" style="right: 0; left: auto;">' +
                                '                <div class="comment-dropdown-item" onclick="Aliskanlik.editComment(\'' + comment.id + '\', \'' + reply.id + '\')">' +
                                '                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
                                '                  <span>Düzenle</span>' +
                                '                </div>' +
                                '                <div class="comment-dropdown-item delete" onclick="Aliskanlik.deleteComment(\'' + comment.id + '\', \'' + reply.id + '\')">' +
                                '                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>' +
                                '                  <span>Çöp Kutusuna Taşı</span>' +
                                '                </div>' +
                                '              </div>' +
                                '            </div>' +
                                '          </div>';
                        });
                        html += '        </div>';
                    }
                }

                html +=
                    '      </div>' + // comment-body
                    '      <div class="comment-actions-trigger">' +
                    '        <button type="button" class="comment-more-btn" onclick="Aliskanlik.toggleCommentDropdown(event, \'' + comment.id + '\')" title="İşlemler">' +
                    '          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>' +
                    '        </button>' +
                    '        <div id="comment-dropdown-' + comment.id + '" class="comment-dropdown">' +
                    '          <div class="comment-dropdown-item" onclick="Aliskanlik.editComment(\'' + comment.id + '\')">' +
                    '            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
                    '            <span>Düzenle</span>' +
                    '          </div>' +
                    '          <div class="comment-dropdown-item" onclick="event.stopPropagation();">' +
                    '            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' +
                    '            <span>Paylaş</span>' +
                    '          </div>' +
                    '          <div class="comment-dropdown-item delete" onclick="Aliskanlik.deleteComment(\'' + comment.id + '\')">' +
                    '            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>' +
                    '            <span>Çöp Kutusuna Taşı</span>' +
                    '          </div>' +
                    '        </div>' +
                    '      </div>' +
                    '    </div>';
            });
        }
        
        html += '  </div>';
        
        var inputRowStyle = showInput ? 'display: flex;' : 'display: none;';
        var submitFn = 'Aliskanlik.addComment()';

        html +=
            '  <div class="comment-input-row" style="' + inputRowStyle + ' gap: 10px; margin-top: 14px; align-items: center;">' +
            '    ' + curUserAvatar +
            '    <input type="text" id="aliskanlik-comment-input" class="comment-input-field" placeholder="Yorum yazın..." style="flex: 1; border: none; outline: none; background: transparent; font-size: 13px; color: var(--color-text); padding: 4px 0;" onkeydown="if(event.key === \'Enter\') { ' + submitFn + '; }" oninput="var btn = document.getElementById(this.id + \'-submit-btn\'); if (this.value.trim()) { btn.style.background = \'#0f172a\'; btn.style.color = \'#ffffff\'; } else { btn.style.background = \'#f1f5f9\'; btn.style.color = \'#cbd5e1\'; }">' +
            '    <button type="button" id="aliskanlik-comment-input-submit-btn" class="comment-submit-btn" onclick="' + submitFn + '" style="background: #f1f5f9; color: #cbd5e1; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease; outline: none; padding: 0; flex-shrink: 0;">' +
            '      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>' +
            '    </button>' +
            '  </div>';
        
        html += '</div>';
        return html;
    }

    function renderAddComments() {
        var container = document.getElementById('aliskanlik-comments-section');
        if (!container) return;
        container.innerHTML = buildCommentsHTML(currentComments);
    }

    function addComment() {
        var input = document.getElementById('aliskanlik-comment-input');
        if (!input) return;
        var text = input.value.trim();
        if (!text) return;
        
        var user = (typeof Auth !== 'undefined') ? Auth.getUser() : null;
        var firstName = (user && user.firstName) ? user.firstName : 'Burak';
        var lastName = (user && user.lastName) ? user.lastName : 'Aktürk';
        var email = (user && user.email) ? user.email : 'burak@noteday.com';
        
        var comment = {
            id: generateId(),
            firstName: firstName,
            lastName: lastName,
            email: email,
            text: text,
            date: new Date().toISOString()
        };
        
        currentComments.push(comment);
        input.value = '';
        showAliskanlikCommentInput = false;
        
        DB.setForUser('aliskanlik_comments', currentComments);
        markUpdated();
        render();
    }

    function toggleCommentDropdown(event, commentId) {
        event.stopPropagation();
        var dropdowns = document.querySelectorAll('.comment-dropdown');
        dropdowns.forEach(function (d) {
            if (d.id !== 'comment-dropdown-' + commentId) {
                d.style.display = 'none';
                var trg = d.closest('.comment-actions-trigger');
                if (trg) trg.classList.remove('active');
            }
        });
        
        var d = document.getElementById('comment-dropdown-' + commentId);
        if (d) {
            var isShowing = d.style.display === 'none' || d.style.display === '';
            d.style.display = isShowing ? 'block' : 'none';
            var trg = d.closest('.comment-actions-trigger');
            if (trg) {
                if (isShowing) {
                    trg.classList.add('active');
                } else {
                    trg.classList.remove('active');
                }
            }
        }
    }

    function editComment(commentId, replyId) {
        var targetId = replyId || commentId;
        var textContainer = document.getElementById('comment-text-' + targetId);
        if (!textContainer) return;
        var currentText = textContainer.getAttribute('data-raw-text') || textContainer.textContent;
        
        var d = document.getElementById('comment-dropdown-' + targetId);
        if (d) {
            d.style.display = 'none';
            var trg = d.closest('.comment-actions-trigger');
            if (trg) trg.classList.remove('active');
        }
        
        var saveFn = 'Aliskanlik.saveCommentEdit(\'' + commentId + '\', ' + (replyId ? '\'' + replyId + '\'' : 'null') + ')';
        var cancelFn = 'Aliskanlik.cancelCommentEdit(\'' + commentId + '\')';
        
        var editHtml = 
            '<div class="comment-edit-row" style="display: flex; gap: 8px; align-items: center; width: 100%; margin-top: 4px;">' +
            '  <input type="text" id="comment-edit-input-' + targetId + '" class="comment-edit-field" style="flex: 1; border: none; outline: none; background: transparent; font-size: 13px; color: var(--color-text); padding: 4px 0;" value="' + escapeHtml(currentText) + '" onkeydown="if(event.key === \'Enter\') { ' + saveFn + '; } else if(event.key === \'Escape\') { ' + cancelFn + '; }" oninput="var btn = document.getElementById(\'comment-edit-save-btn-' + targetId + '\'); if (this.value.trim()) { btn.style.background = \'#0f172a\'; btn.style.color = \'#ffffff\'; btn.disabled = false; } else { btn.style.background = \'#f1f5f9\'; btn.style.color = \'#cbd5e1\'; btn.disabled = true; }">' +
            '  <button type="button" onclick="' + cancelFn + '" style="background: transparent; color: var(--color-text-secondary, #64748b); border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease; outline: none; padding: 0; flex-shrink: 0;" onmouseover="this.style.background=\'var(--color-hover, #f1f5f9)\'" onmouseout="this.style.background=\'transparent\'" title="İptal">' +
            '    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
            '  </button>' +
            '  <button type="button" id="comment-edit-save-btn-' + targetId + '" onclick="' + saveFn + '" style="background: #0f172a; color: #ffffff; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s ease; outline: none; padding: 0; flex-shrink: 0;" title="Kaydet">' +
            '    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>' +
            '  </button>' +
            '</div>';
            
        textContainer.innerHTML = editHtml;
        var input = document.getElementById('comment-edit-input-' + targetId);
        if (input) {
            input.focus();
            var val = input.value;
            input.value = '';
            input.value = val;
        }
    }

    function saveCommentEdit(commentId, replyId) {
        var targetId = replyId || commentId;
        var input = document.getElementById('comment-edit-input-' + targetId);
        if (!input) return;
        var text = input.value.trim();
        if (!text) return;
        
        var comment = currentComments.find(function (c) { return String(c.id) === String(commentId); });
        if (comment) {
            if (replyId) {
                var replies = comment.replies || [];
                var reply = replies.find(function (r) { return String(r.id) === String(replyId); });
                if (reply) {
                    reply.text = text;
                    reply.date = new Date().toISOString();
                    reply.edited = true;
                }
            } else {
                comment.text = text;
                comment.date = new Date().toISOString();
                comment.edited = true;
            }
        }
        
        DB.setForUser('aliskanlik_comments', currentComments);
        markUpdated();
        renderAddComments();
    }

    function cancelCommentEdit(commentId) {
        renderAddComments();
    }

    function deleteComment(commentId, replyId) {
        var targetId = replyId || commentId;
        var d = document.getElementById('comment-dropdown-' + targetId);
        if (d) {
            d.style.display = 'none';
            var trg = d.closest('.comment-actions-trigger');
            if (trg) trg.classList.remove('active');
        }

        var confirmMsg = replyId ? 'Bu yanıtı silmek istediğinizden emin misiniz?' : 'Bu yorumu çöp kutusuna taşımak istediğinizden emin misiniz?';
        if (confirm(confirmMsg)) {
            if (replyId) {
                var comment = currentComments.find(function (c) { return String(c.id) === String(commentId); });
                if (comment) {
                    comment.replies = (comment.replies || []).filter(function (r) { return String(r.id) !== String(replyId); });
                }
            } else {
                currentComments = currentComments.filter(function (c) { return String(c.id) !== String(commentId); });
            }
            DB.setForUser('aliskanlik_comments', currentComments);
            markUpdated();
            renderAddComments();
        }
    }

    function likeComment(commentId, replyId) {
        var user = (typeof Auth !== 'undefined') ? Auth.getUser() : null;
        var email = user ? (user.email || 'default') : 'default';
        
        var comment = currentComments.find(function (c) { return String(c.id) === String(commentId); });
        if (!comment) return;
        
        var target = comment;
        if (replyId) {
            var replies = comment.replies || [];
            target = replies.find(function (r) { return String(r.id) === String(replyId); });
        }
        if (!target) return;
        
        if (!target.likes) target.likes = [];
        if (!target.dislikes) target.dislikes = [];
        
        var idx = target.likes.indexOf(email);
        if (idx > -1) {
            target.likes.splice(idx, 1);
        } else {
            target.likes.push(email);
            var dIdx = target.dislikes.indexOf(email);
            if (dIdx > -1) target.dislikes.splice(dIdx, 1);
        }
        
        DB.setForUser('aliskanlik_comments', currentComments);
        renderAddComments();
    }

    function dislikeComment(commentId, replyId) {
        var user = (typeof Auth !== 'undefined') ? Auth.getUser() : null;
        var email = user ? (user.email || 'default') : 'default';
        
        var comment = currentComments.find(function (c) { return String(c.id) === String(commentId); });
        if (!comment) return;
        
        var target = comment;
        if (replyId) {
            var replies = comment.replies || [];
            target = replies.find(function (r) { return String(r.id) === String(replyId); });
        }
        if (!target) return;
        
        if (!target.likes) target.likes = [];
        if (!target.dislikes) target.dislikes = [];
        
        var idx = target.dislikes.indexOf(email);
        if (idx > -1) {
            target.dislikes.splice(idx, 1);
        } else {
            target.dislikes.push(email);
            var lIdx = target.likes.indexOf(email);
            if (lIdx > -1) target.likes.splice(lIdx, 1);
        }
        
        DB.setForUser('aliskanlik_comments', currentComments);
        renderAddComments();
    }

    function showReplyInput(commentId) {
        activeReplyInput = commentId;
        renderAddComments();
        setTimeout(function() {
            var f = document.getElementById('reply-field-' + commentId);
            if (f) f.focus();
        }, 50);
    }

    function hideReplyInput() {
        activeReplyInput = null;
        renderAddComments();
    }

    function addReply(commentId) {
        var input = document.getElementById('reply-field-' + commentId);
        if (!input) return;
        var text = input.value.trim();
        if (!text) return;
        
        var comment = currentComments.find(function (c) { return String(c.id) === String(commentId); });
        if (!comment) return;
        
        var user = (typeof Auth !== 'undefined') ? Auth.getUser() : null;
        var firstName = (user && user.firstName) ? user.firstName : 'Burak';
        var lastName = (user && user.lastName) ? user.lastName : 'Aktürk';
        var email = (user && user.email) ? user.email : 'burak@noteday.com';
        
        var reply = {
            id: generateId(),
            firstName: firstName,
            lastName: lastName,
            email: email,
            text: text,
            date: new Date().toISOString(),
            likes: [],
            dislikes: [],
            edited: false
        };
        
        if (!comment.replies) comment.replies = [];
        comment.replies.push(reply);
        visibleReplies[commentId] = true;
        activeReplyInput = null;
        
        DB.setForUser('aliskanlik_comments', currentComments);
        renderAddComments();
    }

    function toggleReplies(commentId) {
        visibleReplies[commentId] = !visibleReplies[commentId];
        renderAddComments();
    }

    function save() {
        var titleInput = document.getElementById('aliskanlik-title-input');
        if (!titleInput) return;

        try {
            var storedTitle = DB.getForUser('aliskanlik_title');
            if (storedTitle !== titleInput.value) {
                DB.setForUser('aliskanlik_title', titleInput.value);
                
                var now = new Date().toISOString();
                DB.setForUser('aliskanlik_updated_date', now);
                
                var updatedDateVal = document.getElementById('aliskanlik-property-updated-date');
                if (updatedDateVal) {
                    updatedDateVal.textContent = formatDateTime(now);
                } else {
                    markUpdated();
                    render();
                }
            }
        } catch (e) {
            console.error('Aliskanlik save error:', e);
        }
    }

    // Auto initialize DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        init: init,
        render: render,
        save: save,
        saveProperties: saveProperties,
        addProperty: addProperty,
        togglePropertyDropdown: togglePropertyDropdown,
        toggleColorDropdown: toggleColorDropdown,
        toggleCheckbox: toggleCheckbox,
        saveTag: saveTag,
        editTag: editTag,
        toggleStatusDropdown: toggleStatusDropdown,
        selectStatus: selectStatus,
        removeProperty: removeProperty,
        addComment: addComment,
        toggleCommentDropdown: toggleCommentDropdown,
        editComment: editComment,
        saveCommentEdit: saveCommentEdit,
        cancelCommentEdit: cancelCommentEdit,
        deleteComment: deleteComment,
        likeComment: likeComment,
        dislikeComment: dislikeComment,
        showReplyInput: showReplyInput,
        hideReplyInput: hideReplyInput,
        addReply: addReply,
        toggleReplies: toggleReplies
    };
})();
