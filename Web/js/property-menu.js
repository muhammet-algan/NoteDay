/* ========================================
   ÖZELLİK EYLEMLERİ MENÜSÜ (DROPDOWN)
   Özellik etiketlerine sol tıklandığında
   açılan ve Yeniden Adlandır, Çoğalt, Gizle,
   Özelliği Sil işlemlerini gerçekleştiren modül.
   ======================================== */
var PropertyMenu = (function () {
    'use strict';

    var activeElement = null; // Tıklanan label span elementi
    var activePropertyType = null; // 'location', 'tag', 'status', 'checkbox'
    var activeSectionType = null; // 'notes'

    function init() {
        var menu = document.getElementById('notum-property-action-menu');
        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'notum-property-action-menu';
            menu.className = 'notum-property-add-dropdown';
            menu.style.display = 'none';
            menu.style.position = 'absolute';
            menu.style.zIndex = '10000';
            menu.innerHTML =
                '<div class="notum-property-add-dropdown-item" id="prop-action-rename">' +
                '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path></svg>' +
                '    <span class="dropdown-item-label">Yeniden Adlandır</span>' +
                '</div>' +
                '<div class="notum-property-add-dropdown-item" id="prop-action-duplicate">' +
                '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>' +
                '    <span class="dropdown-item-label">Çoğalt</span>' +
                '</div>' +

                '<div class="notum-property-add-dropdown-item" id="prop-action-hide">' +
                '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle><line x1="1" y1="1" x2="23" y2="23"></line></svg>' +
                '    <span class="dropdown-item-label">Gizle</span>' +
                '</div>' +
                '<div class="notum-property-add-dropdown-item" id="prop-action-delete">' +
                '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>' +
                '    <span class="dropdown-item-label">Özelliği sil</span>' +
                '</div>';
            document.body.appendChild(menu);
        }

        // Tıklama olaylarını bağla
        var renameBtn = document.getElementById('prop-action-rename');
        if (renameBtn) renameBtn.onclick = handleRename;
        var duplicateBtn = document.getElementById('prop-action-duplicate');
        if (duplicateBtn) duplicateBtn.onclick = handleDuplicate;
        var hideBtn = document.getElementById('prop-action-hide');
        if (hideBtn) hideBtn.onclick = handleHide;
        var deleteBtn = document.getElementById('prop-action-delete');
        if (deleteBtn) deleteBtn.onclick = handleDelete;


        // Dışarı tıklayınca kapatma
        document.addEventListener('click', function (e) {
            var m = document.getElementById('notum-property-action-menu');
            if (m && m.style.display !== 'none') {
                if (activeElement && activeElement.contains(e.target)) {
                    return;
                }
                closeMenu();
            }
        });
    }

    function show(event, labelElement, propertyType, sectionType) {
        event.stopPropagation();
        event.preventDefault();

        var menu = document.getElementById('notum-property-action-menu');
        if (!menu) {
            init();
            menu = document.getElementById('notum-property-action-menu');
        }

        if (activeElement === labelElement && menu.style.display !== 'none') {
            closeMenu();
            return;
        }

        activeElement = labelElement;
        activePropertyType = propertyType;
        activeSectionType = sectionType;

        // Konum özelliği de dahil tüm özelliklerde çoğaltma seçeneği gösterilir
        var dupItem = document.getElementById('prop-action-duplicate');
        if (dupItem) {
            dupItem.style.display = 'flex';
        }

        menu.style.display = 'block';
        menu.style.opacity = '0';
        menu.style.transform = 'translateY(-4px)';

        var rect = labelElement.getBoundingClientRect();
        var left = rect.left + window.scrollX;
        var top = rect.bottom + window.scrollY + 4;

        menu.style.left = left + 'px';
        menu.style.top = top + 'px';

        setTimeout(function () {
            menu.classList.add('active');
            menu.style.opacity = '1';
            menu.style.transform = 'translateY(0)';
        }, 10);
    }

    function handleRename(e) {
        e.stopPropagation();
        if (!activeElement) return;
        var labelElement = activeElement;
        var sectionType = activeSectionType;
        closeMenu();
        startInlineRename(labelElement, sectionType);
    }

    function startInlineRename(labelElement, sectionType) {
        var spanText = labelElement.querySelector('span:not(.dropdown-item-label)');
        if (!spanText) return;

        // Zaten input varsa işlem yapma
        if (labelElement.querySelector('input.notum-property-rename-input')) return;

        var currentName = spanText.textContent.trim();

        // Input elementini oluştur
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'notum-property-rename-input';
        input.value = currentName;
        input.style.width = '80px';
        input.style.fontSize = 'inherit';
        input.style.fontFamily = 'inherit';
        input.style.fontWeight = 'inherit';
        input.style.color = 'inherit';
        input.style.border = '1px solid var(--color-primary, #3b82f6)';
        input.style.borderRadius = '4px';
        input.style.padding = '1px 4px';
        input.style.outline = 'none';
        input.style.background = 'var(--color-bg-elevated, #ffffff)';

        // Spanning yerine input ekle
        spanText.style.display = 'none';
        spanText.parentNode.insertBefore(input, spanText.nextSibling);

        input.focus();
        input.select();

        // Olayların yayılmasını engelle
        input.onclick = function (event) {
            event.stopPropagation();
        };

        function finishEdit(save) {
            if (input.parentNode) {
                var newName = input.value.trim();
                if (save && newName) {
                    spanText.textContent = newName;
                    triggerAutosave(sectionType);
                }
                spanText.style.display = '';
                input.remove();
            }
        }

        input.onkeydown = function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                finishEdit(true);
            } else if (event.key === 'Escape') {
                event.preventDefault();
                finishEdit(false);
            }
        };

        input.onblur = function () {
            finishEdit(true);
        };
    }

    function handleDuplicate(e) {
        e.stopPropagation();
        if (!activeElement || !activePropertyType) return;

        if (activeSectionType === 'notes') {
            if (typeof Notes !== 'undefined' && Notes.addProperty) {
                Notes.addProperty(activePropertyType);
            }
        }
        closeMenu();
    }

    function handleMoveUp(e) {
        e.stopPropagation();
        if (!activeElement) return;
        var row = activeElement.closest('.notum-property-row');
        if (row) {
            var prev = row.previousElementSibling;
            // Tarih satırının üstüne çıkmasını önlemek için prev removable olmalı
            if (prev && prev.classList.contains('notum-property-row') && prev.classList.contains('removable')) {
                row.parentNode.insertBefore(row, prev);
                triggerAutosave(activeSectionType);
            }
        }
        closeMenu();
    }

    function handleMoveDown(e) {
        e.stopPropagation();
        if (!activeElement) return;
        var row = activeElement.closest('.notum-property-row');
        if (row) {
            var next = row.nextElementSibling;
            // Ekleme butonunun altına inmesini önlemek için next removable olmalı
            if (next && next.classList.contains('notum-property-row') && next.classList.contains('removable')) {
                row.parentNode.insertBefore(next, row);
                triggerAutosave(activeSectionType);
            }
        }
        closeMenu();
    }

    function handleHide(e) {
        e.stopPropagation();
        if (!activeElement || !activePropertyType) return;

        if (activePropertyType === 'location') {
            if (activeSectionType === 'notes') {
                if (typeof Notes !== 'undefined' && Notes.removeDefaultProperty) Notes.removeDefaultProperty('location');
            }
        } else {
            var row = activeElement.closest('.notum-property-row');
            if (row) {
                row.remove();
                triggerAutosave(activeSectionType);
            }
        }
        closeMenu();
    }

    function handleDelete(e) {
        e.stopPropagation();
        handleHide(e);
    }

    function closeMenu() {
        var menu = document.getElementById('notum-property-action-menu');
        if (menu) {
            menu.style.display = 'none';
            menu.classList.remove('active');
        }
        activeElement = null;
    }

    function triggerAutosave(sectionType) {
        var secType = sectionType || activeSectionType;
        if (secType === 'notes') {
            if (typeof Notes !== 'undefined' && Notes.autoSaveNote) Notes.autoSaveNote();
        }
    }

    // Sıralama (ordering) için yardımcı fonksiyonlar
    function getPropertyOrder(containerId) {
        var container = document.getElementById(containerId);
        if (!container) return [];
        var parent = container.closest('.notum-editor-properties') || container;
        var order = [];
        var customIndex = 0;
        var rows = parent.querySelectorAll('.notum-property-row');
        for (var i = 0; i < rows.length; i++) {
            var type = rows[i].getAttribute('data-property-type');
            if (type === 'date') {
                order.push('date');
            } else if (type === 'updated-date') {
                order.push('updated-date');
            } else if (type === 'location') {
                order.push('location');
            } else if (type === 'tag' || type === 'status' || type === 'checkbox') {
                order.push('custom_' + customIndex);
                customIndex++;
            }
        }
        return order;
    }

    function applyPropertyOrder(parentContainer, orderArray) {
        if (!orderArray || !orderArray.length) return;
        var rows = parentContainer.querySelectorAll('.notum-property-row');
        var rowMap = {};
        var customRows = [];
        for (var i = 0; i < rows.length; i++) {
            var type = rows[i].getAttribute('data-property-type');
            if (type === 'date') {
                rowMap['date'] = rows[i];
            } else if (type === 'updated-date') {
                rowMap['updated-date'] = rows[i];
            } else if (type === 'location') {
                rowMap['location'] = rows[i];
            } else if (type === 'tag' || type === 'status' || type === 'checkbox') {
                customRows.push(rows[i]);
            }
        }
        for (var j = 0; j < customRows.length; j++) {
            rowMap['custom_' + j] = customRows[j];
        }
        var addRow = parentContainer.querySelector('.notum-property-add-row') || parentContainer.lastElementChild;
        orderArray.forEach(function (key) {
            var row = rowMap[key];
            if (row) {
                // If there's an addRow (like "+ Özellik ekle"), insert before it, otherwise append at the end
                if (addRow && addRow.parentNode === parentContainer) {
                    parentContainer.insertBefore(row, addRow);
                } else {
                    parentContainer.appendChild(row);
                }
            }
        });
    }

    var dragItem = null;
    var dragAllowed = false;

    function initDragAndDrop(container, sectionType) {
        if (!container) return;
        var rows = container.querySelectorAll('.notum-property-row');
        rows.forEach(function (row) {
            row.setAttribute('draggable', 'true');
            
            if (row.dataset.dragBound) return;
            row.dataset.dragBound = 'true';

            row.addEventListener('mousedown', function (e) {
                var label = e.target.closest('.notum-property-label');
                dragAllowed = !!label;
            });
            row.addEventListener('touchstart', function (e) {
                var label = e.target.closest('.notum-property-label');
                dragAllowed = !!label;
            }, { passive: true });

            row.addEventListener('dragstart', function (e) {
                if (!dragAllowed) {
                    e.preventDefault();
                    return;
                }
                dragItem = row;
                row.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                try {
                    e.dataTransfer.setData('text/plain', '');
                } catch (err) {}
            });

            row.addEventListener('dragend', function () {
                row.classList.remove('dragging');
                clearDragIndicators(container);
                dragItem = null;
                dragAllowed = false;
                triggerAutosave(sectionType);
            });

            row.addEventListener('dragover', function (e) {
                e.preventDefault();
                if (!dragItem || dragItem === row) return;
                e.dataTransfer.dropEffect = 'move';

                clearDragIndicators(container);
                var rect = row.getBoundingClientRect();
                var midY = rect.top + rect.height / 2;
                if (e.clientY < midY) {
                    row.classList.add('drag-over-top');
                } else {
                    row.classList.add('drag-over-bottom');
                }
            });

            row.addEventListener('dragleave', function () {
                row.classList.remove('drag-over-top', 'drag-over-bottom');
            });

            row.addEventListener('drop', function (e) {
                e.preventDefault();
                if (!dragItem || dragItem === row) return;

                var rect = row.getBoundingClientRect();
                var midY = rect.top + rect.height / 2;
                if (e.clientY < midY) {
                    row.parentNode.insertBefore(dragItem, row);
                } else {
                    row.parentNode.insertBefore(dragItem, row.nextElementSibling);
                }
                clearDragIndicators(container);
                triggerAutosave(sectionType);
            });
        });
    }

    function clearDragIndicators(container) {
        container.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(function (el) {
            el.classList.remove('drag-over-top', 'drag-over-bottom');
        });
    }

    return {
        init: init,
        show: show,
        getPropertyOrder: getPropertyOrder,
        applyPropertyOrder: applyPropertyOrder,
        initDragAndDrop: initDragAndDrop,

    };
})();