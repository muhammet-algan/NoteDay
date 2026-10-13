var SlashCommand = (function () {
    'use strict';

    var triggerRange = null;
    var currentQuery = '';
    var activeIndex = 0;
    var menuOpen = false;

    // Define commands
    var COMMANDS = [
        {
            id: 'table',
            title: 'Tablo',
            desc: 'notum tarzı dinamik tablo ekleyin',
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>',
            action: function () {
                var tableHTML = 
                    '<div class="tablo-table-wrapper notum-db-wrapper" contenteditable="false" style="width:100%; height:auto; margin-left:0; margin-right:auto;">' +
                    '  <div class="notum-db-scroll-container">' +
                    '    <table class="notum-db-table" style="width: 100%; border-collapse: collapse;">' +
                    '      <thead>' +
                    '        <tr>' +
                    '          <th class="notum-db-th" data-col-type="text" style="width: 250px;">' +
                    '            <div class="notum-db-th-content" onclick="Tablo.showColumnPopover(this, event)">' +
                    '              <span class="notum-th-icon">' +
                    '                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>' +
                    '              </span>' +
                    '              <span class="notum-th-name">Metin</span>' +
                    '              <span class="notum-th-settings-btn">▼</span>' +
                    '            </div>' +
                    '            <div class="notum-col-resize-handle"></div>' +
                    '          </th>' +
                    '          <th class="notum-db-th" data-col-type="checkbox" style="width: 120px;">' +
                    '            <div class="notum-db-th-content" onclick="Tablo.showColumnPopover(this, event)">' +
                    '              <span class="notum-th-icon">' +
                    '                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 11 3 3 5-5"/></svg>' +
                    '              </span>' +
                    '              <span class="notum-th-name">Onay Kutusu</span>' +
                    '              <span class="notum-th-settings-btn">▼</span>' +
                    '            </div>' +
                    '            <div class="notum-col-resize-handle"></div>' +
                    '          </th>' +
                    '          <th class="notum-db-th" data-col-type="select" style="width: 180px;">' +
                    '            <div class="notum-db-th-content" onclick="Tablo.showColumnPopover(this, event)">' +
                    '              <span class="notum-th-icon">' +
                    '                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m15 11-3 3-3-3"/></svg>' +
                    '              </span>' +
                    '              <span class="notum-th-name">Etiket</span>' +
                    '              <span class="notum-th-settings-btn">▼</span>' +
                    '            </div>' +
                    '            <div class="notum-col-resize-handle"></div>' +
                    '          </th>' +
                    '          <th class="notum-db-add-col-th" style="width: 50px;" contenteditable="false">' +
                    '            <button type="button" class="notum-add-col-btn" onclick="Tablo.addNotionColumn(this, event)">+</button>' +
                    '          </th>' +
                    '        </tr>' +
                    '      </thead>' +
                    '      <tbody>' +
                    '        <tr>' +
                    '          <td class="notum-db-td notum-cell-text" contenteditable="true"></td>' +
                    '          <td class="notum-db-td notum-cell-checkbox" contenteditable="false">' +
                    '            <input type="checkbox" class="notum-checkbox-input" onchange="Tablo.handleCheckboxChange(this)">' +
                    '          </td>' +
                    '          <td class="notum-db-td notum-cell-select" contenteditable="false" onclick="Tablo.handleSelectCellClick(this, event)">' +
                    '            <div class="notum-pill-container"></div>' +
                    '          </td>' +
                    '          <td class="notum-db-add-col-placeholder" contenteditable="false"></td>' +
                    '        </tr>' +
                    '        <tr>' +
                    '          <td class="notum-db-td notum-cell-text" contenteditable="true"></td>' +
                    '          <td class="notum-db-td notum-cell-checkbox" contenteditable="false">' +
                    '            <input type="checkbox" class="notum-checkbox-input" onchange="Tablo.handleCheckboxChange(this)">' +
                    '          </td>' +
                    '          <td class="notum-db-td notum-cell-select" contenteditable="false" onclick="Tablo.handleSelectCellClick(this, event)">' +
                    '            <div class="notum-pill-container"></div>' +
                    '          </td>' +
                    '          <td class="notum-db-add-col-placeholder" contenteditable="false"></td>' +
                    '        </tr>' +
                    '      </tbody>' +
                    '    </table>' +
                    '  </div>' +
                    '</div>';
                insertHTMLContent('<p><br></p>' + tableHTML + '<p><br></p>');
            }
        },
        {
            id: 'bullet',
            title: 'Maddeli Liste (Bulleted list)',
            desc: 'Basit madde işaretli liste',
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
            action: function () {
                applyCommand('insertUnorderedList');
            }
        },
        {
            id: 'number',
            title: 'Numaralı Liste (Numbered list)',
            desc: 'Sıralı liste oluşturun',
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4M4 10h2M4 16h2v2H4v-2zM6 14v2"/></svg>',
            action: function () {
                applyCommand('insertOrderedList');
            }
        },
        {
            id: 'todo',
            title: 'Yapılacaklar Listesi (To-do list)',
            desc: 'Onay kutulu liste',
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><polyline points="9 11 12 14 22 4"/></svg>',
            action: function () {
                insertHTMLContent('<div class="editor-todo-item" style="display: flex; align-items: center; gap: 8px; margin: 4px 0;"><input type="checkbox" class="editor-todo-chk" style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--color-accent, #6366f1);"><span style="flex: 1; outline: none;">Yapılacak iş...</span></div>');
            }
        },
        {
            id: 'toggle',
            title: 'Daraltılabilir Liste (Toggle list)',
            desc: 'İçeriği gizle/göster listesi',
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
            action: function () {
                insertHTMLContent('<details class="editor-toggle" style="margin: 8px 0; outline: none;"><summary style="font-weight: 600; cursor: pointer; outline: none; padding: 4px 0; display: list-item;">Daraltılabilir başlık</summary><div style="padding: 8px 12px; color: var(--color-text-secondary); outline: none;">Buraya detayları yazın...</div></details>');
            }
        },
        {
            id: 'page',
            title: 'Sayfa (Page)',
            desc: 'Alt sayfa bağlantısı ekleyin',
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
            action: function () {
                insertHTMLContent('<div class="editor-page-link" style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: 8px; margin: 8px 0; background: var(--color-bg-elevated); cursor: pointer; user-select: none;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-text-secondary);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span style="font-weight: 500; color: var(--color-text); outline: none;">Yeni Alt Sayfa</span></div>');
            }
        },
        {
            id: 'callout',
            title: 'Açıklama Kutusu (Callout)',
            desc: 'Önemli bilgi kutusu',
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/><path d="M7 9H5v8h2"/></svg>',
            action: function () {
                insertHTMLContent('<div class="editor-callout" style="display: flex; gap: 12px; background: var(--color-bg-inset, rgba(99, 102, 241, 0.04)); border-left: 4px solid var(--color-accent, #6366f1); padding: 12px 16px; border-radius: 4px; margin: 12px 0; align-items: flex-start;">💡 <span style="flex: 1; outline: none;">Vurgulanmış açıklama yazısı...</span></div>');
            }
        },
        {
            id: 'quote',
            title: 'Alıntı (Quote)',
            desc: 'Alıntı metni ekleyin',
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-9 7-14a5 5 0 0 0-10 0c0 5.5 3 14 3 14zm11 0c3 0 7-9 7-14a5 5 0 0 0-10 0c0 5.5 3 14 3 14z"/></svg>',
            action: function () {
                insertHTMLContent('<blockquote style="border-left: 3px solid var(--color-text-muted, #94a3b8); padding-left: 14px; color: var(--color-text-secondary); font-style: italic; margin: 12px 0; outline: none;">"Alıntı yazın..."</blockquote>');
            }
        },
        {
            id: 'divider',
            title: 'Ayırıcı (Divider)',
            desc: 'Yatay ayırıcı çizgi',
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
            action: function () {
                insertHTMLContent('<hr class="editor-divider" style="border: none; border-top: 1px solid var(--color-border); margin: 16px 0;" />');
            }
        },
        {
            id: 'h1',
            title: 'Başlık 1 (Heading 1)',
            desc: 'Büyük boy başlık',
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8M4 4v16M12 4v16M17 12h2a2 2 0 0 1 2 2v6M21 12v8"/></svg>',
            action: function () {
                applyBlockFormat('<h1>');
            }
        },
        {
            id: 'h2',
            title: 'Başlık 2 (Heading 2)',
            desc: 'Orta boy başlık',
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8M4 4v16M12 4v16M21 18h-4c0-4 4-3 4-6a3 3 0 0 0-6 0"/></svg>',
            action: function () {
                applyBlockFormat('<h2>');
            }
        },
        {
            id: 'h3',
            title: 'Başlık 3 (Heading 3)',
            desc: 'Küçük boy başlık',
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8M4 4v16M12 4v16M17 10h4v2a2 2 0 0 1-2 2h-2M17 14h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/></svg>',
            action: function () {
                applyBlockFormat('<h3>');
            }
        },
        {
            id: 'code',
            title: 'Kod Bloku',
            desc: 'Kod yazmak için alan',
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
            action: function () {
                insertHTMLContent('<pre style="background: var(--color-bg-inset, #f8fafc); border: 1px solid var(--color-border); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; overflow-x: auto; margin: 12px 0; outline: none;"><code style="outline: none;">// Kodunuzu buraya yazın...</code></pre>');
            }
        },
        {
            id: 'date',
            title: 'Tarih ve Saat',
            desc: 'Bugünün tarihini ekleyin',
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
            action: function () {
                var dateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                applyCommand('insertText', dateStr);
            }
        }
    ];

    // Inject styles dynamically to make the module self-contained
    function injectStyles() {
        var styleId = 'slash-command-styles';
        if (document.getElementById(styleId)) return;

        var css = 
            '.slash-menu-container {\n' +
            '    background: #ffffff;\n' +
            '    border: 1px solid rgba(15, 23, 42, 0.12);\n' +
            '    border-radius: 12px;\n' +
            '    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12), 0 4px 8px rgba(15, 23, 42, 0.04);\n' +
            '    width: 290px;\n' +
            '    max-height: 350px;\n' +
            '    display: flex;\n' +
            '    flex-direction: column;\n' +
            '    overflow: hidden;\n' +
            '    font-family: var(--font-family, inherit);\n' +
            '    box-sizing: border-box;\n' +
            '    animation: slashMenuScaleIn 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);\n' +
            '}\n' +
            '[data-theme="dark"] .slash-menu-container {\n' +
            '    background: #1e293b;\n' +
            '    border-color: rgba(255, 255, 255, 0.1);\n' +
            '    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);\n' +
            '}\n' +
            '@keyframes slashMenuScaleIn {\n' +
            '    from { opacity: 0; transform: scale(0.96) translateY(-5px); }\n' +
            '    to { opacity: 1; transform: scale(1) translateY(0); }\n' +
            '}\n' +
            '.slash-menu-header {\n' +
            '    display: flex;\n' +
            '    align-items: center;\n' +
            '    padding: 10px 14px;\n' +
            '    border-bottom: 1px solid rgba(15, 23, 42, 0.06);\n' +
            '    gap: 8px;\n' +
            '}\n' +
            '[data-theme="dark"] .slash-menu-header {\n' +
            '    border-bottom-color: rgba(255, 255, 255, 0.06);\n' +
            '}\n' +
            '.slash-menu-search-icon {\n' +
            '    color: var(--color-text-secondary, #64748b);\n' +
            '    flex-shrink: 0;\n' +
            '}\n' +
            '#slash-menu-search {\n' +
            '    border: none;\n' +
            '    background: transparent;\n' +
            '    outline: none;\n' +
            '    font-size: 13px;\n' +
            '    color: var(--color-text, #0f172a);\n' +
            '    flex: 1;\n' +
            '    padding: 2px 0;\n' +
            '}\n' +
            '#slash-menu-close-btn {\n' +
            '    background: transparent;\n' +
            '    border: none;\n' +
            '    font-size: 20px;\n' +
            '    line-height: 1;\n' +
            '    color: var(--color-text-secondary, #94a3b8);\n' +
            '    cursor: pointer;\n' +
            '    padding: 0 4px;\n' +
            '    border-radius: 4px;\n' +
            '    transition: all 0.15s;\n' +
            '    display: flex;\n' +
            '    align-items: center;\n' +
            '    justify-content: center;\n' +
            '}\n' +
            '#slash-menu-close-btn:hover {\n' +
            '    background: var(--color-bg-hover, rgba(0,0,0,0.05));\n' +
            '    color: var(--color-text, #0f172a);\n' +
            '}\n' +
            '[data-theme="dark"] #slash-menu-close-btn:hover {\n' +
            '    background: rgba(255,255,255,0.08);\n' +
            '    color: #ffffff;\n' +
            '}\n' +
            '.slash-menu-list {\n' +
            '    overflow-y: auto;\n' +
            '    flex: 1;\n' +
            '    padding: 6px;\n' +
            '    display: flex;\n' +
            '    flex-direction: column;\n' +
            '    gap: 2px;\n' +
            '}\n' +
            '.slash-menu-item {\n' +
            '    display: flex;\n' +
            '    align-items: center;\n' +
            '    gap: 10px;\n' +
            '    padding: 8px 10px;\n' +
            '    border-radius: 8px;\n' +
            '    cursor: pointer;\n' +
            '    transition: background-color 0.15s;\n' +
            '    user-select: none;\n' +
            '    text-align: left;\n' +
            '    background: transparent;\n' +
            '    border: none;\n' +
            '    width: 100%;\n' +
            '    box-sizing: border-box;\n' +
            '}\n' +
            '.slash-menu-item:hover, .slash-menu-item.active {\n' +
            '    background-color: var(--color-bg-hover, rgba(99, 102, 241, 0.05));\n' +
            '}\n' +
            '.slash-menu-item.active {\n' +
            '    outline: 1.5px solid var(--color-accent, #6366f1);\n' +
            '}\n' +
            '.slash-menu-item-icon {\n' +
            '    width: 32px;\n' +
            '    height: 32px;\n' +
            '    border-radius: 8px;\n' +
            '    background: var(--color-bg-inset, #f1f5f9);\n' +
            '    display: flex;\n' +
            '    align-items: center;\n' +
            '    justify-content: center;\n' +
            '    color: var(--color-text-secondary, #475569);\n' +
            '    flex-shrink: 0;\n' +
            '}\n' +
            '[data-theme="dark"] .slash-menu-item-icon {\n' +
            '    background: rgba(255,255,255,0.06);\n' +
            '    color: #cbd5e1;\n' +
            '}\n' +
            '.slash-menu-item-info {\n' +
            '    display: flex;\n' +
            '    flex-direction: column;\n' +
            '    gap: 1px;\n' +
            '    flex: 1;\n' +
            '    overflow: hidden;\n' +
            '    pointer-events: none;\n' +
            '}\n' +
            '.slash-menu-item-title {\n' +
            '    font-size: 13px;\n' +
            '    font-weight: 500;\n' +
            '    color: var(--color-text, #0f172a);\n' +
            '    white-space: nowrap;\n' +
            '    overflow: hidden;\n' +
            '    text-overflow: ellipsis;\n' +
            '}\n' +
            '.slash-menu-item-desc {\n' +
            '    font-size: 11px;\n' +
            '    color: var(--color-text-secondary, #64748b);\n' +
            '    white-space: nowrap;\n' +
            '    overflow: hidden;\n' +
            '    text-overflow: ellipsis;\n' +
            '}\n' +
            '/* Table wrapper and custom table styling */\n' +
            '.editor-table-wrapper {\n' +
            '    position: relative;\n' +
            '    display: block !important;\n' +
            '    clear: both !important;\n' +
            '    margin: 20px 0;\n' +
            '    max-width: 100%;\n' +
            '    box-sizing: border-box;\n' +
            '}\n' +
            '.editor-table-toolbar {\n' +
            '    display: flex;\n' +
            '    gap: 6px;\n' +
            '    margin-bottom: 6px;\n' +
            '    opacity: 0;\n' +
            '    transition: opacity 0.2s ease;\n' +
            '    flex-wrap: wrap;\n' +
            '}\n' +
            '.editor-table-wrapper:hover .editor-table-toolbar,\n' +
            '.editor-table-wrapper:focus-within .editor-table-toolbar {\n' +
            '    opacity: 1;\n' +
            '}\n' +
            '.editor-table-toolbar button {\n' +
            '    display: inline-flex;\n' +
            '    align-items: center;\n' +
            '    background: var(--color-bg-inset, #f1f5f9);\n' +
            '    border: 1px solid var(--color-border, #e2e8f0);\n' +
            '    padding: 4px 8px;\n' +
            '    border-radius: 6px;\n' +
            '    font-size: 11px;\n' +
            '    font-weight: 600;\n' +
            '    color: var(--color-text-secondary, #475569);\n' +
            '    cursor: pointer;\n' +
            '    transition: all 0.15s ease;\n' +
            '    user-select: none;\n' +
            '}\n' +
            '.editor-table-toolbar button:hover {\n' +
            '    background: var(--color-bg-hover, #cbd5e1);\n' +
            '    color: var(--color-text, #0f172a);\n' +
            '}\n' +
            '.editor-table-toolbar button.btn-danger:hover {\n' +
            '    background: #fee2e2;\n' +
            '    color: #ef4444;\n' +
            '    border-color: #fca5a5;\n' +
            '}\n' +
            '/* Custom table styling */\n' +
            '.editor-custom-table {\n' +
            '    width: fit-content;\n' +
            '    max-width: 100%;\n' +
            '    border-collapse: collapse;\n' +
            '    table-layout: fixed;\n' +
            '    background: #ffffff;\n' +
            '    box-sizing: border-box;\n' +
            '    border-radius: 4px;\n' +
            '    overflow: hidden;\n' +
            '    margin: 20px 0;\n' +
            '}\n' +
            '[data-theme="dark"] .editor-custom-table {\n' +
            '    background: #1e293b;\n' +
            '}\n' +
            '.editor-custom-table th {\n' +
            '    background: transparent;\n' +
            '    color: var(--color-text-secondary, #475569);\n' +
            '    font-weight: 500;\n' +
            '    border: none;\n' +
            '    border-bottom: 1px solid var(--color-border, #e2e8f0);\n' +
            '    padding: 16px 12px;\n' +
            '    font-size: 14px;\n' +
            '    text-align: left;\n' +
            '    outline: none;\n' +
            '}\n' +
            '[data-theme="dark"] .editor-custom-table th {\n' +
            '    color: #cbd5e1;\n' +
            '    border-bottom: 1px solid rgba(255,255,255,0.1);\n' +
            '}\n' +
            '.editor-custom-table td {\n' +
            '    border: none;\n' +
            '    border-bottom: 1px solid var(--color-border, #e2e8f0);\n' +
            '    padding: 16px 12px;\n' +
            '    font-size: 14px;\n' +
            '    word-wrap: break-word;\n' +
            '    overflow-wrap: break-word;\n' +
            '    outline: none;\n' +
            '    vertical-align: middle;\n' +
            '    min-height: 38px;\n' +
            '    background: transparent;\n' +
            '}\n' +
            '.editor-custom-table td:hover {\n' +
            '    background-color: var(--color-bg-hover, rgba(0,0,0,0.015));\n' +
            '}\n' +
            '[data-theme="dark"] .editor-custom-table td {\n' +
            '    border-bottom: 1px solid rgba(255,255,255,0.06);\n' +
            '}\n' +
            '.editor-custom-table td:focus {\n' +
            '    background: var(--color-bg-hover, rgba(99,102,241,0.03)) !important;\n' +
            '    box-shadow: inset 0 0 0 1px var(--color-accent, #6366f1);\n' +
            '    outline: none;\n' +
            '}\n' +
            '[data-theme="dark"] .editor-custom-table td:focus {\n' +
            '    background: rgba(99,102,241,0.06) !important;\n' +
            '    box-shadow: inset 0 0 0 1px var(--color-accent, #818cf8);\n' +
            '}\n';

        var style = document.createElement('style');
        style.id = styleId;
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }

    // Create and append menu HTML
    function createMenuElement() {
        var menuId = 'slash-command-menu';
        if (document.getElementById(menuId)) return;

        var div = document.createElement('div');
        div.id = menuId;
        div.className = 'slash-menu-container';
        div.style.display = 'none';
        div.style.position = 'absolute';
        div.style.zIndex = '1000000';

        div.innerHTML = 
            '<div class="slash-menu-header">' +
            '  <svg class="slash-menu-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
            '  <input type="text" id="slash-menu-search" placeholder="Bir özellik arayın..." autocomplete="off">' +
            '  <button type="button" id="slash-menu-close-btn" title="Kapat">&times;</button>' +
            '</div>' +
            '<div class="slash-menu-list" id="slash-menu-list"></div>';

        document.body.appendChild(div);

        // Bind events for elements in menu
        var closeBtn = document.getElementById('slash-menu-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                hideMenu();
            });
        }

        var searchInput = document.getElementById('slash-menu-search');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                currentQuery = e.target.value;
                activeIndex = 0;
                renderList();
            });
            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    triggerActiveItem();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    hideMenu();
                }
            });
        }
    }

    // Render list based on search query
    function renderList() {
        var listContainer = document.getElementById('slash-menu-list');
        if (!listContainer) return;

        var filtered = COMMANDS.filter(function (cmd) {
            var q = currentQuery.toLowerCase();
            return !q || cmd.title.toLowerCase().includes(q) || cmd.desc.toLowerCase().includes(q);
        });

        var html = '';
        if (filtered.length === 0) {
            html = '<div style="padding: 12px; text-align: center; font-size: 13px; color: var(--color-text-secondary);">Sonuç bulunamadı</div>';
        } else {
            filtered.forEach(function (cmd, idx) {
                var activeClass = idx === activeIndex ? ' active' : '';
                html += '<button type="button" class="slash-menu-item' + activeClass + '" data-id="' + cmd.id + '" onclick="event.stopPropagation(); SlashCommand.execute(\'' + cmd.id + '\')">' +
                    '<div class="slash-menu-item-icon">' + cmd.icon + '</div>' +
                    '<div class="slash-menu-item-info">' +
                    '<div class="slash-menu-item-title">' + cmd.title + '</div>' +
                    '<div class="slash-menu-item-desc">' + cmd.desc + '</div>' +
                    '</div>' +
                    '</button>';
            });
        }

        listContainer.innerHTML = html;

        // Scroll active item into view
        var activeBtn = listContainer.querySelector('.slash-menu-item.active');
        if (activeBtn) {
            activeBtn.scrollIntoView({ block: 'nearest' });
        }
    }

    // Position and show menu
    function showMenu(range) {
        var menu = document.getElementById('slash-command-menu');
        if (!menu) return;

        // Position below cursor
        var rect = range.getBoundingClientRect();
        menu.style.display = 'flex';

        var menuWidth = menu.offsetWidth || 290;
        var menuHeight = menu.offsetHeight || 320;

        var top = rect.bottom + window.pageYOffset + 6;
        var left = rect.left + window.pageXOffset;

        // Viewport boundaries check
        if (left + menuWidth > window.innerWidth + window.pageXOffset - 20) {
            left = window.innerWidth + window.pageXOffset - menuWidth - 20;
        }
        if (left < window.pageXOffset + 20) {
            left = window.pageXOffset + 20;
        }
        if (top + menuHeight > window.innerHeight + window.pageYOffset - 20) {
            top = rect.top + window.pageYOffset - menuHeight - 6;
        }

        menu.style.top = top + 'px';
        menu.style.left = left + 'px';

        // Clear query
        currentQuery = '';
        activeIndex = 0;
        menuOpen = true;

        var searchInput = document.getElementById('slash-menu-search');
        if (searchInput) {
            searchInput.value = '';
        }

        renderList();
    }

    // Hide menu
    function hideMenu() {
        var menu = document.getElementById('slash-command-menu');
        if (menu) {
            menu.style.display = 'none';
        }
        menuOpen = false;
        triggerRange = null;
    }

    // Get text before cursor in current line
    function getLineTextBeforeCursor(sel, range, editor) {
        var node = range.startContainer;
        var offset = range.startOffset;
        if (node.nodeType !== 3) {
            return "";
        }
        var text = node.nodeValue || "";
        var textBeforeCursor = text.substring(0, offset);
        return textBeforeCursor;
    }

    // Extract query text typed after trigger '/'
    function getQueryText(sel, range) {
        if (!triggerRange) return null;
        var node = range.startContainer;
        var offset = range.startOffset;

        if (node !== triggerRange.node) {
            return null;
        }

        if (offset < triggerRange.offset + 1) {
            return null;
        }

        var text = node.nodeValue || "";
        var query = text.substring(triggerRange.offset + 1, offset);

        if (query.includes('\n') || query.includes('\r')) {
            return null;
        }

        return query;
    }

    // Key handlers for keyboard navigation
    function handleKeyDown(e) {
        if (!menuOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            moveActiveItem(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            moveActiveItem(-1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            triggerActiveItem();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            hideMenu();
        }
    }

    function moveActiveItem(dir) {
        var listContainer = document.getElementById('slash-menu-list');
        if (!listContainer) return;

        var items = listContainer.querySelectorAll('.slash-menu-item');
        if (items.length === 0) return;

        activeIndex = (activeIndex + dir + items.length) % items.length;
        renderList();
    }

    function triggerActiveItem() {
        var listContainer = document.getElementById('slash-menu-list');
        if (!listContainer) return;

        var activeBtn = listContainer.querySelector('.slash-menu-item.active');
        if (activeBtn) {
            var cmdId = activeBtn.getAttribute('data-id');
            execute(cmdId);
        }
    }

    // Delete trigger '/query' text before inserting
    function deleteTriggerText() {
        if (!triggerRange) return;

        triggerRange.editor.focus();

        var sel = window.getSelection();
        var range = document.createRange();

        var textNode = triggerRange.node;
        var textVal = textNode.nodeValue || "";
        var endOffset = Math.min(textVal.length, triggerRange.offset + 1 + currentQuery.length);

        range.setStart(textNode, triggerRange.offset);
        range.setEnd(textNode, endOffset);

        sel.removeAllRanges();
        sel.addRange(range);

        document.execCommand('delete');
        triggerAutoSave();
    }

    function triggerAutoSave() {
        if (triggerRange && triggerRange.editor) {
            triggerRange.editor.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    // Execute command by id
    function execute(cmdId) {
        var cmd = COMMANDS.find(function (c) { return c.id === cmdId; });
        if (cmd) {
            cmd.action();
        }
    }

    function insertHTMLContent(html) {
        deleteTriggerText();
        document.execCommand('insertHTML', false, html);
        hideMenu();
    }

    function applyBlockFormat(tag) {
        deleteTriggerText();
        document.execCommand('formatBlock', false, tag);
        hideMenu();
    }

    // Event listener for editor keyup/input
    function handleKeyUp(e) {
        var target = e.target;
        if (!target || !target.isContentEditable) return;
        if (target.id !== 'note-desc-input') return;
        
        var sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        var range = sel.getRangeAt(0);

        // Exclude table context by checking path from anchorNode
        var isInsideTable = false;
        var tempNode = sel.anchorNode;
        while (tempNode && tempNode !== target) {
            if (tempNode.nodeName === 'TABLE' || tempNode.nodeName === 'TD' || tempNode.nodeName === 'TH') {
                isInsideTable = true;
                break;
            }
            tempNode = tempNode.parentNode;
        }
        if (isInsideTable) {
            if (menuOpen) hideMenu();
            return;
        }

        var textBeforeCursor = getLineTextBeforeCursor(sel, range, target);
        // Match '/' preceded by start of node or newline, optional spaces
        var match = textBeforeCursor.match(/(?:^|[\r\n])\s*\/$/);

        if (match) {
            var node = range.startContainer;
            var offset = range.startOffset;

            triggerRange = {
                node: node,
                offset: offset - 1, // position of '/'
                editor: target
            };

            // Create temporary range to get accurate position of '/'
            var posRange = document.createRange();
            posRange.setStart(node, offset - 1);
            posRange.setEnd(node, offset);
            showMenu(posRange);
        } else if (menuOpen && triggerRange && triggerRange.editor === target) {
            var query = getQueryText(sel, range);
            if (query === null) {
                hideMenu();
            } else {
                currentQuery = query;
                activeIndex = 0;
                // Sync query to search input visual representation
                var searchInput = document.getElementById('slash-menu-search');
                if (searchInput) {
                    searchInput.value = query;
                }
                renderList();
            }
        }
    }

    // Event listener to hide menu on outside click
    function handleDocumentClick(e) {
        if (!menuOpen) return;
        var menu = document.getElementById('slash-command-menu');
        if (menu && !menu.contains(e.target) && !e.target.closest('#note-desc-input')) {
            hideMenu();
        }
    }

    // Event listener for checkbox state update in editor todo items
    function handleCheckboxToggle() {
        document.addEventListener('change', function (e) {
            if (e.target && e.target.classList.contains('editor-todo-chk')) {
                var span = e.target.nextElementSibling;
                if (span) {
                    span.style.textDecoration = e.target.checked ? 'line-through' : 'none';
                    span.style.opacity = e.target.checked ? '0.5' : '1';
                }
                // Trigger auto save
                var editor = e.target.closest('[contenteditable="true"]');
                if (editor) {
                    editor.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        });
    }

    // Init module
    function init() {
        injectStyles();
        createMenuElement();
        
        document.addEventListener('keyup', handleKeyUp);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('click', handleDocumentClick);
        handleCheckboxToggle();
    }

    // Table Helper Functions
    function tableAddRowDirect(cell) {
        var trAdd = cell.closest('tr');
        if (!trAdd) return;
        var tbody = trAdd.parentNode;
        if (!tbody) return;
        var table = tbody.closest('.editor-custom-table');
        if (!table) return;
        
        var firstRow = tbody.querySelector('tr:not(.table-add-row-tr)');
        if (!firstRow) return;
        var colsCount = firstRow.querySelectorAll('td, th').length;
        
        var tr = document.createElement('tr');
        for (var i = 0; i < colsCount; i++) {
            var td = document.createElement('td');
            td.style.outline = 'none';
            td.innerHTML = '';
            tr.appendChild(td);
        }
        
        tbody.insertBefore(tr, trAdd);
        
        // Focus the first cell of the newly added row
        var newCell = tr.querySelector('td');
        if (newCell) {
            newCell.focus();
        }
        
        triggerAutoSaveFromElement(table);
    }

    function tableAddColDirect(th) {
        var table = th.closest('.editor-custom-table');
        if (!table) return;
        
        var headers = Array.from(th.parentNode.children);
        var index = headers.indexOf(th);
        
        var rows = table.querySelectorAll('tr');
        rows.forEach(function(row) {
            if (row.classList.contains('table-add-row-tr')) return;
            
            var cells = Array.from(row.children);
            var cellType = row.parentNode.tagName === 'THEAD' ? 'th' : 'td';
            var newCell = document.createElement(cellType);
            newCell.style.outline = 'none';
            newCell.innerHTML = '';
            if (cellType === 'th') {
                newCell.style.fontWeight = '500';
                newCell.style.textAlign = 'left';
                newCell.style.fontSize = '14px';
                newCell.style.color = 'var(--color-text-secondary)';
                newCell.style.borderBottom = '1px solid var(--color-border)';
                newCell.contentEditable = 'true';
                newCell.innerHTML = 'Kolon';
            } else {
                newCell.style.borderBottom = '1px solid var(--color-border)';
                newCell.contentEditable = 'true';
            }
            
            if (cells.length > index) {
                row.insertBefore(newCell, cells[index]);
            } else {
                row.appendChild(newCell);
            }
        });
        
        adjustColWidths(table);
        triggerAutoSaveFromElement(table);
    }

    function adjustColWidths(table) {
        var headerRow = table.querySelector('thead tr');
        if (!headerRow) return;
        var headers = headerRow.querySelectorAll('th');
        var colsCount = headers.length;
        if (colsCount === 0) return;
        
        for (var i = 0; i < colsCount; i++) {
            if (i === colsCount - 1) {
                headers[i].style.width = '45px';
            } else {
                headers[i].style.width = '220px';
            }
        }
    }

    function triggerAutoSaveFromElement(el) {
        var editor = el.closest('#note-desc-input') || el.closest('[contenteditable="true"]');
        if (editor) {
            editor.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    return {
        init: init,
        execute: execute,
        tableAddRowDirect: tableAddRowDirect,
        tableAddColDirect: tableAddColDirect
    };
})();

// Initialize module when page is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', SlashCommand.init);
} else {
    SlashCommand.init();
}
