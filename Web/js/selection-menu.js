(function () {
    var activeTextarea = null;
    var activeStart = 0;
    var activeEnd = 0;
    
    var menuElement = null; // for text selection menu
    var titleMenuElement = null; // for title selection menu

    function getFontFamilyStyle(font) {
        var suffix = ", 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'";
        switch (font) {
            case 'Outfit': return "'Outfit', sans-serif" + suffix;
            case 'Lobster': return "'Lobster', sans-serif" + suffix;
            case 'Bungee': return "'Bungee', sans-serif" + suffix;
            default: return "'Outfit', sans-serif" + suffix;
        }
    }

    function preventMenuDefault(e) {
        e.preventDefault();
    }

    // --- TEXT SELECTION MENU (H1, H2, H3, Formatting) ---
    function createSelectionMenu() {
        var menu = document.createElement('div');
        menu.id = 'editor-selection-menu';
        menu.className = 'notum-selection-menu';
        menu.style.position = 'absolute';
        menu.style.zIndex = '10000';
        menu.style.display = 'none';

        var html =
            '<div class="selection-menu-title" style="font-size: 9px; font-weight: 600; color: var(--color-text-tertiary, #94a3b8); padding: 8px 12px 3px; text-transform: uppercase; letter-spacing: 0.5px; user-select: none;">Başlıklar</div>' +
            '<div class="selection-menu-item" data-action="h1">' +
            '  <img src="assets/heading-1.png" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle; display: inline-block;">' +
            '  <span class="format-header-text" style="font-size: 13px;">Başlık 1</span>' +
            '</div>' +
            '<div class="selection-menu-item" data-action="h2">' +
            '  <img src="assets/heading-2.png" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle; display: inline-block;">' +
            '  <span class="format-header-text" style="font-size: 13px;">Başlık 2</span>' +
            '</div>' +
            '<div class="selection-menu-item" data-action="h3">' +
            '  <img src="assets/heading-3.png" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle; display: inline-block;">' +
            '  <span class="format-header-text" style="font-size: 13px;">Başlık 3</span>' +
            '</div>' +
            '<div class="selection-menu-divider"></div>' +
            
            /* Biçimlendirme Butonları Satırı */
            '<div class="selection-menu-row" style="display: flex; align-items: center; justify-content: space-between; padding: 4px 12px; box-sizing: border-box; width: 100%;">' +
            '  <button class="selection-menu-btn text-color-btn" data-action="color" title="Renk"><span style="font-family: inherit; font-size: 13px; font-weight: 700;">A</span></button>' +
            '  <button class="selection-menu-btn" data-action="bold" title="Kalın"><span style="font-family: inherit; font-weight: 900 !important; font-size: 13px;">B</span></button>' +
            '  <button class="selection-menu-btn" data-action="italic" title="İtalik"><span style="font-family: \'Playfair Display\', serif; font-style: italic; font-weight: 700; font-size: 13.5px; position: relative; left: -0.5px;">I</span></button>' +
            '  <button class="selection-menu-btn" data-action="underline" title="Altı Çizili"><span style="font-family: \'Playfair Display\', serif; text-decoration: underline; font-weight: 700; font-size: 13.5px; position: relative; top: -0.5px;">U</span></button>' +
            '</div>';

        menu.innerHTML = html;
        document.body.appendChild(menu);

        // Prevent selection loss when clicking selection menu
        menu.addEventListener('mousedown', preventMenuDefault);

        // Event Listeners for Heading Items
        menu.querySelectorAll('.selection-menu-item').forEach(function (item) {
            item.addEventListener('click', function (e) {
                e.stopPropagation();
                var action = item.getAttribute('data-action');
                applyHeadingFormat(action);
            });
        });

        // Event Listeners for Formatting Buttons
        menu.querySelectorAll('.selection-menu-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var action = btn.getAttribute('data-action');
                applyFormatting(action);
            });
        });

        return menu;
    }

    function showSelectionMenu(x, y, textarea) {
        activeTextarea = textarea;
        activeStart = textarea.selectionStart;
        activeEnd = textarea.selectionEnd;

        // Hide title menu if open
        hideTitleSelectionMenu();

        if (!menuElement) {
            menuElement = createSelectionMenu();
        }

        menuElement.style.display = 'flex';

        var menuWidth = 160;
        var menuHeight = 180;
        var posX = x - menuWidth / 2;
        var posY = y + 15; // Opens downward

        if (posX < 10) posX = 10;
        if (posX + menuWidth > window.innerWidth) posX = window.innerWidth - menuWidth - 10;
        if (posY + menuHeight > window.innerHeight + window.pageYOffset) {
            posY = y - menuHeight - 15; // Fallback above
        }

        menuElement.style.left = posX + 'px';
        menuElement.style.top = posY + 'px';
    }

    function hideSelectionMenu() {
        if (menuElement) {
            menuElement.style.display = 'none';
        }
    }

    // --- TITLE SELECTION MENU (Fonts, Formatting) ---
    function createTitleSelectionMenu() {
        var menu = document.createElement('div');
        menu.id = 'editor-title-selection-menu';
        menu.className = 'notum-selection-menu';
        menu.style.position = 'absolute';
        menu.style.zIndex = '10000';
        menu.style.display = 'none';

        var html =
            '<div class="selection-menu-section-title" style="user-select: none; font-size: 9px; font-weight: 600; color: var(--color-text-tertiary, #94a3b8); padding: 8px 12px 3px; text-transform: uppercase; letter-spacing: 0.5px;">YAZI STİLLERİ</div>' +
            '<div class="selection-menu-item" id="editor-title-float-btn-outfit">' +
            '  <span class="format-header-text" style="font-family: \'Outfit\', sans-serif; font-size: 17px !important;">Varsayılan</span>' +
            '</div>' +
            '<div class="selection-menu-item" id="editor-title-float-btn-lobster">' +
            '  <span class="format-header-text" style="font-family: \'Lobster\', sans-serif; font-size: 17px !important;">Kalın süslü</span>' +
            '</div>' +
            '<div class="selection-menu-item" id="editor-title-float-btn-bungee">' +
            '  <span class="format-header-text" style="font-family: \'Bungee\', sans-serif; font-size: 14.5px !important;">kalın blok</span>' +
            '</div>' +
            '<div class="selection-menu-divider"></div>' +
            
            /* Biçimlendirme Butonları Satırı */
            '<div class="selection-menu-row" style="display: flex; align-items: center; justify-content: space-between; padding: 4px 12px; box-sizing: border-box; width: 100%; position: relative;">' +
            '  <div class="toolbar-dropdown-wrapper" style="position: relative; display: inline-block;">' +
            '    <button class="selection-menu-btn text-color-btn" id="editor-title-float-btn-color-trigger" title="Renk"><span style="font-family: inherit; font-size: 13px; font-weight: 700;">A</span></button>' +
            '    <div id="editor-title-color-picker-dropdown" class="word-color-picker-dropdown" style="display: none;" onclick="event.stopPropagation()"></div>' +
            '  </div>' +
            '  <button class="selection-menu-btn" id="editor-title-float-btn-bold" title="Kalın"><span style="font-family: inherit; font-weight: 900 !important; font-size: 13px;">B</span></button>' +
            '  <button class="selection-menu-btn" id="editor-title-float-btn-italic" title="İtalik"><span style="font-family: \'Playfair Display\', serif; font-style: italic; font-weight: 700; font-size: 13.5px; position: relative; left: -0.5px;">I</span></button>' +
            '  <button class="selection-menu-btn" id="editor-title-float-btn-underline" title="Altı Çizili"><span style="font-family: \'Playfair Display\', serif; text-decoration: underline; font-weight: 700; font-size: 13.5px; position: relative; top: -0.5px;">U</span></button>' +
            '</div>';

        menu.innerHTML = html;
        document.body.appendChild(menu);

        // Prevent selection loss when clicking menu
        menu.addEventListener('mousedown', preventMenuDefault);

        // Wire Font Clicks
        var btnOutfit = menu.querySelector('#editor-title-float-btn-outfit');
        if (btnOutfit) {
            btnOutfit.onclick = function(e) {
                e.stopPropagation();
                changeTitleFont('Outfit');
            };
        }
        var btnLobster = menu.querySelector('#editor-title-float-btn-lobster');
        if (btnLobster) {
            btnLobster.onclick = function(e) {
                e.stopPropagation();
                changeTitleFont('Lobster');
            };
        }
        var btnBungee = menu.querySelector('#editor-title-float-btn-bungee');
        if (btnBungee) {
            btnBungee.onclick = function(e) {
                e.stopPropagation();
                changeTitleFont('Bungee');
            };
        }

        // Wire formatting buttons
        var btnColorTrigger = menu.querySelector('#editor-title-float-btn-color-trigger');
        if (btnColorTrigger) {
            btnColorTrigger.onclick = function(e) {
                e.stopPropagation();
                var dropdown = menu.querySelector('#editor-title-color-picker-dropdown');
                if (dropdown) {
                    var isShowing = dropdown.style.display === 'flex';
                    dropdown.style.display = isShowing ? 'none' : 'flex';
                }
            };
        }
        var btnBold = menu.querySelector('#editor-title-float-btn-bold');
        if (btnBold) {
            btnBold.onclick = function(e) {
                e.stopPropagation();
                toggleTitleBold();
            };
        }
        var btnItalic = menu.querySelector('#editor-title-float-btn-italic');
        if (btnItalic) {
            btnItalic.onclick = function(e) {
                e.stopPropagation();
                toggleTitleItalic();
            };
        }
        var btnUnderline = menu.querySelector('#editor-title-float-btn-underline');
        if (btnUnderline) {
            btnUnderline.onclick = function(e) {
                e.stopPropagation();
                toggleTitleUnderline();
            };
        }

        renderTitleColorPicker(menu);

        return menu;
    }

    function showTitleSelectionMenu(x, y, titleInput) {
        // Title selection menu is disabled — titles use a fixed style
        // (uppercase, bold, black) with no user customization allowed.
        return;
    }

    function hideTitleSelectionMenu() {
        if (titleMenuElement) {
            titleMenuElement.style.display = 'none';
            var dropdown = titleMenuElement.querySelector('#editor-title-color-picker-dropdown');
            if (dropdown) dropdown.style.display = 'none';
        }
    }

    function updateTitleSelectionMenuStates() {
        if (!activeTextarea || !titleMenuElement) return;

        var fontFamily = activeTextarea.getAttribute('data-font-family') || 'Outfit';
        var textColor = activeTextarea.getAttribute('data-text-color') || '#334155';
        var isBold = (activeTextarea.getAttribute('data-is-bold') !== 'false');
        var isItalic = (activeTextarea.getAttribute('data-is-italic') === 'true');
        var isUnderline = (activeTextarea.getAttribute('data-is-underline') === 'true');

        // Font items highlight
        var fonts = {
            'Outfit': 'editor-title-float-btn-outfit',
            'Lobster': 'editor-title-float-btn-lobster',
            'Bungee': 'editor-title-float-btn-bungee'
        };
        for (var f in fonts) {
            var el = titleMenuElement.querySelector('#' + fonts[f]);
            if (el) {
                if (fontFamily === f) {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            }
        }

        // Bold button highlight
        var btnBold = titleMenuElement.querySelector('#editor-title-float-btn-bold');
        if (btnBold) {
            if (isBold) btnBold.classList.add('active');
            else btnBold.classList.remove('active');
        }

        // Italic button highlight
        var btnItalic = titleMenuElement.querySelector('#editor-title-float-btn-italic');
        if (btnItalic) {
            if (isItalic) btnItalic.classList.add('active');
            else btnItalic.classList.remove('active');
        }

        // Underline button highlight
        var btnUnderline = titleMenuElement.querySelector('#editor-title-float-btn-underline');
        if (btnUnderline) {
            if (isUnderline) btnUnderline.classList.add('active');
            else btnUnderline.classList.remove('active');
        }

        // Color underline indicator
        var underline = titleMenuElement.querySelector('#editor-title-float-btn-color-trigger span');
        if (underline) {
            underline.style.borderBottom = '3px solid ' + textColor;
        }
    }

    function changeTitleFont(font) {
        if (!activeTextarea) return;
        activeTextarea.setAttribute('data-font-family', font);
        activeTextarea.style.fontFamily = getFontFamilyStyle(font);

        activeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        updateTitleSelectionMenuStates();
        hideTitleSelectionMenu();
    }

    // Standardized Change Color
    function changeTitleColor(color) {
        if (!activeTextarea) return;
        activeTextarea.setAttribute('data-text-color', color);
        activeTextarea.style.setProperty('color', color, 'important');

        activeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        updateTitleSelectionMenuStates();
        
        var dropdown = titleMenuElement ? titleMenuElement.querySelector('#editor-title-color-picker-dropdown') : null;
        if (dropdown) dropdown.style.display = 'none';

        hideTitleSelectionMenu();
    }

    function toggleTitleBold() {
        if (!activeTextarea) return;
        var isBold = (activeTextarea.getAttribute('data-is-bold') !== 'false');
        var newBold = !isBold;
        activeTextarea.setAttribute('data-is-bold', newBold);
        activeTextarea.style.fontWeight = newBold ? '700' : '400';

        activeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        updateTitleSelectionMenuStates();
    }

    function toggleTitleItalic() {
        if (!activeTextarea) return;
        var isItalic = (activeTextarea.getAttribute('data-is-italic') === 'true');
        var newItalic = !isItalic;
        activeTextarea.setAttribute('data-is-italic', newItalic);
        activeTextarea.style.fontStyle = newItalic ? 'italic' : 'normal';

        activeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        updateTitleSelectionMenuStates();
    }

    function toggleTitleUnderline() {
        if (!activeTextarea) return;
        var isUnderline = (activeTextarea.getAttribute('data-is-underline') === 'true');
        var newUnderline = !isUnderline;
        activeTextarea.setAttribute('data-is-underline', newUnderline);
        activeTextarea.style.textDecoration = newUnderline ? 'underline' : 'none';

        activeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        updateTitleSelectionMenuStates();
    }

    function renderTitleColorPicker(menu) {
        var dropdown = menu.querySelector('#editor-title-color-picker-dropdown');
        if (!dropdown) return;

        var html = '';
        
        // Tema Renkleri Section
        html += '<div class="word-color-section-title" style="margin-top: 0 !important; font-size: 10px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 4px; text-transform: uppercase;">Tema Renkleri</div>';
        html += '<div class="word-color-grid-theme" style="display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px; margin-bottom: 8px;">';
        
        var themePalette = [
            ['#FFFFFF', '#000000', '#EEF2F6', '#1E293B', '#3B82F6', '#F97316', '#22C55E', '#06B6D4', '#A855F7', '#FACC15'],
            ['#F8FAFC', '#7F8D9F', '#F8FAFC', '#E2E8F0', '#EFF6FF', '#FFF7ED', '#F0FDF4', '#ECFEFF', '#FAF5FF', '#FEFCE8'],
            ['#F1F5F9', '#64748B', '#F1F5F9', '#CBD5E1', '#DBEAFE', '#FFEDD5', '#DCFCE7', '#CFFAFE', '#F3E8FF', '#FEF9C3'],
            ['#E2E8F0', '#475569', '#E2E8F0', '#94A3B8', '#BFDBFE', '#FED7AA', '#BBF7D0', '#A5F3FC', '#E9D5FF', '#FEF08A'],
            ['#CBD5E1', '#334155', '#CBD5E1', '#475569', '#2563EB', '#EA580C', '#16A34A', '#0891B2', '#9333EA', '#CA8A04'],
            ['#94A3B8', '#0F172A', '#94A3B8', '#0F172A', '#1D4ED8', '#C2410C', '#15803D', '#0E7490', '#7E22CE', '#A16207']
        ];

        for (var row = 0; row < themePalette.length; row++) {
            for (var col = 0; col < 10; col++) {
                var hex = themePalette[row][col];
                html += '<div class="word-color-cell" style="background-color: ' + hex + '; width: 16px; height: 16px; border-radius: 3px; cursor: pointer; border: 1px solid rgba(0,0,0,0.05);" data-color="' + hex + '" title="' + hex + '"></div>';
            }
        }
        html += '</div>';

        // Standart Renkler Section
        html += '<div class="word-color-section-title" style="font-size: 10px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 4px; text-transform: uppercase;">Standart Renkler</div>';
        html += '<div class="word-color-grid-standard" style="display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px;">';
        var standardColors = ['#8B0000', '#EF4444', '#F97316', '#FACC15', '#A3E635', '#22C55E', '#06B6D4', '#3B82F6', '#1E3A8A', '#A855F7'];
        for (var i = 0; i < standardColors.length; i++) {
            var hex = standardColors[i];
            html += '<div class="word-color-cell" style="background-color: ' + hex + '; width: 16px; height: 16px; border-radius: 3px; cursor: pointer; border: 1px solid rgba(0,0,0,0.05);" data-color="' + hex + '" title="' + hex + '"></div>';
        }
        html += '</div>';

        dropdown.innerHTML = html;

        // Wire Color Cell clicks
        dropdown.querySelectorAll('.word-color-cell').forEach(function(cell) {
            cell.onclick = function(e) {
                e.stopPropagation();
                var color = cell.getAttribute('data-color');
                changeTitleColor(color);
            };
        });
    }

    // --- SHARED TEXTAREA ACTIONS ---
    function applyTextareaHeading(prefix) {
        if (!activeTextarea) return;
        var start = activeStart;
        var end = activeEnd;
        var text = activeTextarea.value;
        
        // Find the start of the line
        var lineStart = text.lastIndexOf('\n', start - 1) + 1;
        
        // Check if it already has a markdown heading prefix and remove it if it does
        var lineText = text.substring(lineStart, start);
        var cleanLineText = lineText.replace(/^#{1,3}\s+/, '');
        
        var newPrefix = prefix + ' ';
        var replacement = newPrefix + cleanLineText + text.substring(start, end);
        
        activeTextarea.value = text.substring(0, lineStart) + replacement + text.substring(end);
        activeTextarea.focus();
        
        var offset = replacement.length - (lineText.length + (end - start));
        activeTextarea.selectionStart = start + offset;
        activeTextarea.selectionEnd = end + offset;
        
        activeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        hideSelectionMenu();
    }

    function applyHeadingFormat(action) {
        switch (action) {
            case 'h1':
                applyTextareaHeading('#');
                break;
            case 'h2':
                applyTextareaHeading('##');
                break;
            case 'h3':
                applyTextareaHeading('###');
                break;
        }
    }

    function applyFormatting(action) {
        if (!activeTextarea) return;
        var start = activeStart;
        var end = activeEnd;
        var text = activeTextarea.value;
        var selectedText = text.substring(start, end);
        var replacement = '';

        switch (action) {
            case 'bold':
                replacement = '**' + selectedText + '**';
                break;
            case 'italic':
                replacement = '*' + selectedText + '*';
                break;
            case 'underline':
                replacement = '<u>' + selectedText + '</u>';
                break;
            case 'color':
                var hexColor = prompt("Renk kodu girin (örn: red, #ff0000, blue):");
                if (hexColor === null) return;
                hexColor = hexColor.trim() || '#ef4444';
                replacement = '<span style="color:' + hexColor + '">' + selectedText + '</span>';
                break;
        }

        activeTextarea.value = text.substring(0, start) + replacement + text.substring(end);
        activeTextarea.selectionStart = start;
        activeTextarea.selectionEnd = start + replacement.length;
        activeTextarea.focus();

        activeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        hideSelectionMenu();
    }

    // --- SELECTION DETECTOR ---
    function handleGlobalSelection(e) {
        var el = e.target;
        if (!el) return;

        // Bypassing global selection menu for Diary and Notes editors
        // since they have their own custom inline/floating selection menus.
        var targetElement = el.nodeType === 3 ? el.parentElement : el;
        if (targetElement && targetElement.closest && (
            targetElement.closest('#note-desc-input') || 
            targetElement.closest('#note-title-input')
        )) {
            hideSelectionMenu();
            hideTitleSelectionMenu();
            return;
        }

        var isText = el.classList.contains('reminder-note-input');
        var isTitle = el.classList.contains('notum-editor-title-input');

        if (isText || isTitle) {
            setTimeout(function () {
                var start = el.selectionStart;
                var end = el.selectionEnd;
                if (start !== end) {
                    var selectedText = el.value ? el.value.substring(start, end).trim() : '';
                    if (selectedText.length > 0) {
                        if (isTitle) {
                            showTitleSelectionMenu(e.pageX, e.pageY, el);
                        } else {
                            showSelectionMenu(e.pageX, e.pageY, el);
                        }
                    }
                } else {
                    hideSelectionMenu();
                    hideTitleSelectionMenu();
                }
            }, 50);
        } else {
            // Clicked outside elements - close menus if not clicking inside the menus themselves
            var isInsideTextMenu = menuElement && menuElement.contains(el);
            var isInsideTitleMenu = titleMenuElement && titleMenuElement.contains(el);
            if (!isInsideTextMenu && !isInsideTitleMenu) {
                hideSelectionMenu();
                hideTitleSelectionMenu();
            }
        }
    }

    // Bind event listeners globally on document (delegated)
    document.addEventListener('mouseup', handleGlobalSelection);
    document.addEventListener('keyup', handleGlobalSelection);
    document.addEventListener('dblclick', handleGlobalSelection);
})();
