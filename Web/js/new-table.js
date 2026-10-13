var NewTable = (function () {
    function getInstanceKey(key) {
        var currentSection = localStorage.getItem('app_current_section') || '';
        if (currentSection.indexOf('new-table_instance_') !== -1) {
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


    var DEFAULT_TABLE_HTML = 
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

    var isInitialized = false;

    function init() {
        if (isInitialized) return;
        isInitialized = true;

        // Auto-save title changes and any keyup/input in cells
        document.addEventListener('input', function (e) {
            if (e.target.closest('#new-table-section')) {
                save();
            }
        });

        // Also save when focus is lost from table or title
        document.addEventListener('focusout', function (e) {
            if (e.target.closest('#new-table-section')) {
                save();
            }
        });
    }

    function render() {
        init();

        var titleInput = document.getElementById('new-table-title-input');
        var wrapperContainer = document.getElementById('new-table-wrapper-container');

        if (!titleInput || !wrapperContainer) return;

        // Load title
        var storedTitle = DB.getForUser('new_table_title');
        if (storedTitle !== null) {
            titleInput.value = storedTitle;
        } else {
            titleInput.value = '';
        }

        // Load table HTML
        var storedHtml = DB.getForUser('new_table_html');
        if (storedHtml) {
            wrapperContainer.innerHTML = storedHtml;
        } else {
            wrapperContainer.innerHTML = DEFAULT_TABLE_HTML;
        }
    }

    function save() {
        var titleInput = document.getElementById('new-table-title-input');
        var wrapperContainer = document.getElementById('new-table-wrapper-container');

        if (!titleInput || !wrapperContainer) return;

        try {
            DB.setForUser('new_table_title', titleInput.value);
            // Close any active popovers before serializing innerHTML
            if (typeof Tablo !== 'undefined' && Tablo.closeActivePopover) {
                Tablo.closeActivePopover();
            }
            if (typeof Tablo !== 'undefined' && Tablo.closeActiveTagPicker) {
                Tablo.closeActiveTagPicker();
            }
            DB.setForUser('new_table_html', wrapperContainer.innerHTML);
        } catch (e) {
            console.error('NewTable save error:', e);
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
        save: save
    };
})();
