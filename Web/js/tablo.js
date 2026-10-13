var Tablo = (function () {
    'use strict';

    var TYPE_ICONS = {
        'text': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>',
        'number': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
        'select': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m15 11-3 3-3-3"/></svg>',
        'multiselect': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L15 21"/><path d="m10 5 5.5 5.5-5.5 5.5-5.5-5.5Z"/><circle cx="10" cy="10" r="1"/></svg>',
        'status': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
        'date': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        'person': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        'files': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
        'checkbox': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 11 3 3 5-5"/></svg>',
        'url': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
        'phone': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
        'email': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
        'location': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
        'calendar-date': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        'formula': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 4H6v1l6 6-6 6v1h12"/></svg>'
    };

    var activePopover = null;
    var activeTagPicker = null;

    var resizeTh = null;
    var resizeStartX = 0;
    var resizeStartWidth = 0;

    function saveDocumentContent() {
        recalculateAllFormulas();
        var newTableSec = document.getElementById('new-table-section');
        if (newTableSec && (newTableSec.classList.contains('active') || newTableSec.style.display === 'block')) {
            if (typeof NewTable !== 'undefined') {
                NewTable.save();
            }
            return;
        }

        var activeEditor = document.activeElement;
        if (!activeEditor || activeEditor.id !== 'note-desc-input') {
            var noteEditor = document.getElementById('note-desc-input');
            if (noteEditor && noteEditor.contains(activeEditor)) {
                activeEditor = noteEditor;
            } else {
                activeEditor = null;
            }
        }
        if (activeEditor) {
            activeEditor.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            var ne = document.getElementById('note-desc-input');
            if (ne) ne.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    function init() {
        recalculateAllFormulas();
        // Global document event delegations for tables
        document.addEventListener('click', function(e) {
            // 1. Column header click -> popover settings
            var thContent = e.target.closest('.notum-db-th-content');
            if (!thContent) {
                var thEl = e.target.closest('th.notum-db-th');
                if (thEl && !e.target.closest('.notum-col-resize-handle')) {
                    thContent = thEl.querySelector('.notum-db-th-content') || thEl;
                }
            }
            if (thContent) {
                showColumnPopover(thContent, e);
                return;
            }

            // 2. Select / Multi-select / Status cell click -> tag options
            var selectCell = e.target.closest('.notum-cell-select, .notum-cell-multiselect, .notum-cell-status');
            if (selectCell && !e.target.closest('.notum-pill')) {
                handleSelectCellClick(selectCell, e);
                return;
            }

            // 3. Click tag pill inside select cell -> delete tag
            var pill = e.target.closest('.notum-pill');
            if (pill && (pill.parentNode.closest('.notum-cell-select') || pill.parentNode.closest('.notum-cell-multiselect') || pill.parentNode.closest('.notum-cell-status'))) {
                e.stopPropagation();
                pill.remove();
                saveDocumentContent();
                return;
            }

            // 4. Add row button
            var addRowBtn = e.target.closest('.notum-add-row-btn');
            if (addRowBtn) {
                addNotionRow(addRowBtn);
                return;
            }

            // 6. Add column button
            var addColBtn = e.target.closest('.notum-add-col-btn');
            if (!addColBtn) {
                var addColTh = e.target.closest('.notum-db-add-col-th');
                if (addColTh) {
                    addColBtn = addColTh.querySelector('.notum-add-col-btn') || addColTh;
                }
            }
            if (addColBtn) {
                addNotionColumn(addColBtn, e);
                return;
            }
        });

        // Checkbox state change listener
        document.addEventListener('change', function(e) {
            var checkbox = e.target.closest('.notum-checkbox-input');
            if (checkbox) {
                handleCheckboxChange(checkbox);
            }
        });

        // Restrict input in number cells
        document.addEventListener('keydown', function(e) {
            var cell = e.target.closest('.notum-cell-number');
            if (!cell) return;

            // Allow navigation, deletion, clipboard, undo/redo
            if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' || e.key === 'Enter' || e.key === 'Escape' ||
                e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
                e.key === 'Home' || e.key === 'End' ||
                e.ctrlKey || e.metaKey) {
                return;
            }

            // Allow digits
            if (/^[0-9]$/.test(e.key)) {
                return;
            }

            // Allow decimal separators (only one allowed)
            if (e.key === '.' || e.key === ',') {
                var text = cell.textContent;
                if (text.indexOf('.') === -1 && text.indexOf(',') === -1) {
                    return;
                }
            }

            // Allow minus sign (only at the beginning)
            if (e.key === '-') {
                var text = cell.textContent;
                if (text.indexOf('-') === -1) {
                    return;
                }
            }

            // Block everything else
            e.preventDefault();
        });

        document.addEventListener('paste', function(e) {
            var cell = e.target.closest('.notum-cell-number');
            if (!cell) return;

            e.preventDefault();
            var text = (e.originalEvent || e).clipboardData.getData('text/plain');
            var cleaned = text.replace(/[^0-9.,-]/g, '');
            if (!isNaN(parseFloat(cleaned.replace(',', '.'))) || cleaned === '-' || cleaned === '.' || cleaned === ',') {
                document.execCommand('insertText', false, cleaned);
            }
        });

        document.addEventListener('input', function(e) {
            var cell = e.target.closest('.notum-cell-number');
            if (!cell) return;
            var text = cell.textContent;
            var cleaned = text.replace(/[^0-9.,-]/g, '');
            if (text !== cleaned) {
                cell.textContent = cleaned;
                var range = document.createRange();
                var sel = window.getSelection();
                range.selectNodeContents(cell);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });

        // Close popovers on click outside (using capture phase)
        document.addEventListener('click', function(e) {
            if (activePopover && !activePopover.contains(e.target) && !e.target.closest('.notum-db-th-content') && !e.target.closest('.notum-add-col-btn') && !e.target.closest('th.notum-db-th') && !e.target.closest('.notum-db-add-col-th')) {
                closeActivePopover();
            }
            if (activeTagPicker && !activeTagPicker.contains(e.target) && !e.target.closest('.notum-cell-select, .notum-cell-multiselect, .notum-cell-status')) {
                closeActiveTagPicker();
            }
        }, true);

        // Close popovers on scroll outside popover
        window.addEventListener('scroll', function(e) {
            if (activePopover && e.target && !activePopover.contains(e.target)) {
                closeActivePopover();
            }
            if (activeTagPicker && e.target && !activeTagPicker.contains(e.target)) {
                closeActiveTagPicker();
            }
        }, true);

        // Tab key navigation within table cells
        document.addEventListener('keydown', handleTabKeyNavigation, true);

        // Column resizing event delegation
        document.addEventListener('mousedown', function(e) {
            var handle = e.target.closest('.notum-col-resize-handle');
            if (!handle) return;

            e.preventDefault();
            e.stopPropagation();

            resizeTh = handle.closest('th');
            if (!resizeTh) return;

            resizeStartX = e.clientX;
            resizeStartWidth = resizeTh.offsetWidth;
            handle.classList.add('active');

            // Lock all column widths to their current rendered widths
            var table = resizeTh.closest('table');
            if (table) {
                var allThs = table.querySelectorAll('thead th');
                allThs.forEach(function(th) {
                    th.style.width = th.offsetWidth + 'px';
                });
                // Set explicit table width and remove CSS min-width to allow shrinking
                table.style.width = table.offsetWidth + 'px';
                table.style.minWidth = '0';
            }

            document.addEventListener('mousemove', handleColResizeMouseMove);
            document.addEventListener('mouseup', handleColResizeMouseUp);
        });

        // Table Wrapper Drag & Drop sorting listeners
        document.addEventListener('mousedown', function(e) {
            var handle = e.target.closest('.tablo-table-drag-handle');
            if (!handle) return;
            var wrapper = handle.closest('.tablo-table-wrapper');
            if (wrapper) wrapper.setAttribute('draggable', 'true');
        });

        document.addEventListener('mouseup', function(e) {
            var handle = e.target.closest('.tablo-table-drag-handle');
            if (!handle) return;
            var wrapper = handle.closest('.tablo-table-wrapper');
            if (wrapper) wrapper.setAttribute('draggable', 'false');
        });

        document.addEventListener('dragstart', function(e) {
            var wrapper = e.target.closest('.tablo-table-wrapper');
            if (wrapper) {
                e.preventDefault();
                return;
            }
        });

        document.addEventListener('dragover', function(e) {
            var draggingWrapper = document.querySelector('.tablo-table-wrapper.dragging');
            if (!draggingWrapper) return;

            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            var activeEditor = draggingWrapper.closest('#note-desc-input');
            if (!activeEditor) return;

            var rectDesc = activeEditor.getBoundingClientRect();
            if (e.clientY < rectDesc.top - 50 || e.clientY > rectDesc.bottom + 50) return;

            var children = Array.prototype.slice.call(activeEditor.children);
            if (children.length === 0) return;

            var closestChild = null;
            var closestOffset = Infinity;
            var position = 'after';

            children.forEach(function(child) {
                if (child === draggingWrapper) return;
                if (child.classList.contains('tablo-table-drop-indicator')) return;

                var rect = child.getBoundingClientRect();
                var childMiddleY = rect.top + rect.height / 2;
                var offset = e.clientY - childMiddleY;

                if (Math.abs(offset) < Math.abs(closestOffset)) {
                    closestOffset = offset;
                    closestChild = child;
                    position = offset < 0 ? 'before' : 'after';
                }
            });

            if (closestChild) {
                var indicator = document.querySelector('.tablo-table-drop-indicator');
                if (!indicator) {
                    indicator = document.createElement('div');
                    indicator.className = 'tablo-table-drop-indicator';
                }
                if (position === 'before') {
                    activeEditor.insertBefore(indicator, closestChild);
                } else {
                    activeEditor.insertBefore(indicator, closestChild.nextSibling);
                }
            }
        });

        document.addEventListener('drop', function(e) {
            var draggingWrapper = document.querySelector('.tablo-table-wrapper.dragging');
            if (!draggingWrapper) return;

            e.preventDefault();
            e.stopPropagation();

            var indicator = document.querySelector('.tablo-table-drop-indicator');
            var activeEditor = draggingWrapper.closest('#note-desc-input');

            if (indicator && activeEditor) {
                activeEditor.insertBefore(draggingWrapper, indicator);
                indicator.remove();
            } else {
                var ind = document.querySelector('.tablo-table-drop-indicator');
                if (ind) ind.remove();
            }

            draggingWrapper.classList.remove('dragging');
            draggingWrapper.setAttribute('draggable', 'false');
            saveDocumentContent();
        });

        document.addEventListener('dragend', function(e) {
            var wrapper = e.target.closest('.tablo-table-wrapper');
            if (wrapper) {
                wrapper.classList.remove('dragging');
                wrapper.setAttribute('draggable', 'false');
            }
            var indicator = document.querySelector('.tablo-table-drop-indicator');
            if (indicator) indicator.remove();
            setTimeout(saveDocumentContent, 100);
        });

        // Table Wrapper selection highlights on cell focus
        document.addEventListener('focusin', function(e) {
            var cell = e.target.closest('.notum-db-table td');
            if (cell) {
                var wrapper = cell.closest('.tablo-table-wrapper');
                if (wrapper) wrapper.classList.add('selected');
            }
        });

        document.addEventListener('focusout', function(e) {
            var cell = e.target.closest('.notum-db-table td');
            if (cell) {
                var wrapper = cell.closest('.tablo-table-wrapper');
                if (wrapper) {
                    setTimeout(function() {
                        if (!wrapper.contains(document.activeElement)) {
                            wrapper.classList.remove('selected');
                        }
                    }, 150);
                }
            }
        });

        // Listen to paste event to insert custom tables nicely
        document.addEventListener('paste', function(e) {
            var activeEditor = document.activeElement;
            if (activeEditor && activeEditor.id === 'note-desc-input') {
                var html = e.clipboardData.getData('text/html');
                if (html && html.indexOf('class="tablo-table-wrapper"') !== -1) {
                    e.preventDefault();
                    
                    var tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    var wrapper = tempDiv.querySelector('.tablo-table-wrapper');
                    if (wrapper) {
                        wrapper.classList.remove('selected');
                        wrapper.classList.remove('dragging');
                        wrapper.setAttribute('draggable', 'false');
                        
                        var selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            var range = selection.getRangeAt(0);
                            range.deleteContents();
                            
                            var container = range.commonAncestorContainer;
                            var block = container;
                            while (block && block !== activeEditor && block.parentNode !== activeEditor) {
                                block = block.parentNode;
                            }
                            
                            if (block && block !== activeEditor) {
                                activeEditor.insertBefore(wrapper, block.nextSibling);
                            } else {
                                range.insertNode(wrapper);
                            }
                        } else {
                            activeEditor.appendChild(wrapper);
                        }
                        
                        saveDocumentContent();
                        if (typeof Toast !== 'undefined' && Toast.show) {
                            Toast.show('Tablo başarıyla yapıştırıldı!', 'success');
                        }
                    }
                }
            }
        });
    }

    function handleColResizeMouseMove(e) {
        if (!resizeTh) return;
        var deltaX = e.clientX - resizeStartX;
        var colType = resizeTh.getAttribute('data-col-type');
        var minWidth = colType === 'checkbox' ? 45 : 65;
        var newWidth = Math.max(minWidth, resizeStartWidth + deltaX);
        resizeTh.style.width = newWidth + 'px';

        // Recalculate and update table width
        var table = resizeTh.closest('table');
        if (table) {
            var allThs = table.querySelectorAll('thead th');
            var totalWidth = 0;
            allThs.forEach(function(th) { totalWidth += th.offsetWidth; });
            var scrollContainer = table.closest('.notum-db-scroll-container');
            var containerWidth = scrollContainer ? scrollContainer.clientWidth : 0;
            table.style.width = Math.max(totalWidth, containerWidth) + 'px';
        }
    }

    function handleColResizeMouseUp(e) {
        if (resizeTh) {
            var handle = resizeTh.querySelector('.notum-col-resize-handle');
            if (handle) handle.classList.remove('active');

            // Finalize table width
            var table = resizeTh.closest('table');
            if (table) {
                var allThs = table.querySelectorAll('thead th');
                var totalWidth = 0;
                allThs.forEach(function(th) { totalWidth += th.offsetWidth; });
                var scrollContainer = table.closest('.notum-db-scroll-container');
                var containerWidth = scrollContainer ? scrollContainer.clientWidth : 0;
                if (totalWidth > containerWidth) {
                    table.style.width = totalWidth + 'px';
                    table.style.minWidth = totalWidth + 'px';
                } else {
                    table.style.width = '';
                    table.style.minWidth = '';
                }
            }
        }
        resizeTh = null;
        document.removeEventListener('mousemove', handleColResizeMouseMove);
        document.removeEventListener('mouseup', handleColResizeMouseUp);
        saveDocumentContent();
    }

    function positionFloatingElement(el, targetRect, width, height) {
        var w = width || 260;
        var h = height || 390;
        var left = targetRect.left;
        if (left + w > window.innerWidth - 10) {
            left = Math.max(10, window.innerWidth - w - 10);
        }
        var top = targetRect.bottom + 4;
        if (top + h > window.innerHeight && targetRect.top > h) {
            top = Math.max(10, targetRect.top - h - 4);
        }
        el.style.position = 'fixed';
        el.style.top = top + 'px';
        el.style.left = left + 'px';
        el.style.zIndex = '99999';
    }

    function positionAddColElement(el, targetRect, width, height) {
        var w = width || 260;
        var h = height || 390;
        var left = Math.max(10, targetRect.right - w);
        if (left + w > window.innerWidth - 10) {
            left = Math.max(10, window.innerWidth - w - 10);
        }
        var top = targetRect.bottom + 4;
        if (top + h > window.innerHeight && targetRect.top > h) {
            top = Math.max(10, targetRect.top - h - 4);
        }
        el.style.position = 'fixed';
        el.style.top = top + 'px';
        el.style.left = left + 'px';
        el.style.zIndex = '99999';
    }

    function showColumnPopover(contentDiv, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        closeActivePopover();

        var th = contentDiv.closest('th');
        if (!th) return;
        var table = th.closest('table');
        if (!table) return;

        var colIndex = Array.prototype.indexOf.call(th.parentNode.children, th);
        var nameSpan = th.querySelector('.notum-th-name');
        var colName = nameSpan ? nameSpan.textContent.trim() : 'Kolon';
        var currentType = th.getAttribute('data-col-type') || 'text';

        var popover = document.createElement('div');
        popover.className = 'notum-db-popover';

        var rect = th.getBoundingClientRect();
        positionFloatingElement(popover, rect, 260, 420);

        var html = 
            '<div class="notum-popover-search-container" onclick="event.stopPropagation()">' +
            '  <input type="text" class="notum-popover-search" placeholder="Özellik adı..." value="' + colName.replace(/"/g, '&quot;') + '">' +
            '</div>';

        if (currentType === 'formula') {
            var currentFormula = th.getAttribute('data-formula') || '';
            html += 
                '<div class="notum-popover-search-container" onclick="event.stopPropagation()" style="border-top:1px solid var(--color-border-subtle); padding-top:8px;">' +
                '  <div style="font-size:12px; font-weight:600; color:var(--color-text-secondary); margin-bottom:4px;">Formül Girin:</div>' +
                '  <input type="text" class="notum-popover-formula-input" placeholder="Örn: {Fiyat} * {Adet}" value="' + currentFormula.replace(/"/g, '&quot;') + '" style="width:100%; border:1px solid var(--color-border); border-radius:6px; padding:6px 8px; font-size:13px; font-family:inherit; outline:none; background:var(--color-bg); color:var(--color-text);">' +
                '  <div style="font-size:10px; color:var(--color-text-tertiary); margin-top:4px;">Sütunları {Sütun Adı} şeklinde yazın.</div>' +
                '</div>';
        }

        html += '<div class="notum-popover-list">';

        // Tür seçin
        html += '<div class="notum-popover-group-title">Tür Seçin</div>';
        var types = [
            { id: 'text', label: 'Metin', icon: TYPE_ICONS['text'] },
            { id: 'number', label: 'Sayı', icon: TYPE_ICONS['number'] },
            { id: 'select', label: 'Etiket', icon: TYPE_ICONS['select'] },
            { id: 'multiselect', label: 'Çoklu Seçim', icon: TYPE_ICONS['multiselect'] },
            { id: 'status', label: 'Durum', icon: TYPE_ICONS['status'] },
            { id: 'checkbox', label: 'Onay Kutusu', icon: TYPE_ICONS['checkbox'] },
            { id: 'calendar-date', label: 'Tarih', icon: TYPE_ICONS['calendar-date'] },
            { id: 'location', label: 'Konum', icon: TYPE_ICONS['location'] },
            { id: 'formula', label: 'Formül', icon: TYPE_ICONS['formula'] },
            { id: 'person', label: 'Kişi', icon: TYPE_ICONS['person'] },
            { id: 'files', label: 'Dosya ve Medya', icon: TYPE_ICONS['files'] },
            { id: 'url', label: 'URL', icon: TYPE_ICONS['url'] },
            { id: 'email', label: 'E-posta', icon: TYPE_ICONS['email'] },
            { id: 'phone', label: 'Telefon', icon: TYPE_ICONS['phone'] }
        ];

        types.forEach(function(t) {
            var activeStyle = (t.id === currentType) ? ' style="background-color: var(--color-bg-subtle); font-weight:600;"' : '';
            html += 
                '  <button type="button" class="notum-popover-item" data-type="' + t.id + '"' + activeStyle + '>' +
                '    <span class="notum-popover-item-icon">' + t.icon + '</span>' +
                '    <span class="notum-popover-item-label">' + t.label + '</span>' +
                '  </button>';
        });

        // İşlemler
        html += '<div class="notum-popover-group-title">İşlemler</div>' +
            '  <button type="button" class="notum-popover-item" data-action="change-icon">' +
            '    <span class="notum-popover-item-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></span>' +
            '    <span class="notum-popover-item-label">İkon Değiştir</span>' +
            '  </button>' +
            '  <button type="button" class="notum-popover-item" data-action="duplicate">' +
            '    <span class="notum-popover-item-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></span>' +
            '    <span class="notum-popover-item-label">Sütunu Çoğalt</span>' +
            '  </button>' +
            '  <button type="button" class="notum-popover-item notum-popover-item-trash" data-action="delete">' +
            '    <span class="notum-popover-item-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></span>' +
            '    <span class="notum-popover-item-label">Sütunu Sil</span>' +
            '  </button>';

        html += '</div>';
        popover.innerHTML = html;
        document.body.appendChild(popover);
        activePopover = popover;

        var searchInput = popover.querySelector('.notum-popover-search');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
            searchInput.addEventListener('input', function() {
                var newName = searchInput.value.trim() || 'Kolon';
                var ns = th.querySelector('.notum-th-name');
                if (ns) ns.textContent = newName;
                saveDocumentContent();
            });
            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    closeActivePopover();
                }
            });
        }

        var formulaInput = popover.querySelector('.notum-popover-formula-input');
        if (formulaInput) {
            formulaInput.addEventListener('input', function() {
                var formulaVal = formulaInput.value;
                th.setAttribute('data-formula', formulaVal);
                recalculateTableFormulas(table);
                saveDocumentContent();
            });
        }

        popover.querySelectorAll('.notum-popover-item').forEach(function(item) {
            item.onclick = function(e) {
                e.stopPropagation();
                var action = item.getAttribute('data-action');
                var type = item.getAttribute('data-type');

                if (action === 'delete') {
                    deleteColumn(table, colIndex);
                    closeActivePopover();
                } else if (action === 'duplicate') {
                    duplicateColumn(table, colIndex);
                    closeActivePopover();
                } else if (action === 'change-icon') {
                    closeActivePopover();
                    var currentIcon = th.getAttribute('data-custom-icon') || '';
                    if (typeof App !== 'undefined' && App.openEmojiPicker) {
                        App.openEmojiPicker(null, currentIcon, function(newIcon) {
                            if (newIcon && newIcon !== 'reset') {
                                th.setAttribute('data-custom-icon', newIcon);
                                var svg = App.CUSTOM_ICONS ? App.CUSTOM_ICONS[newIcon] : null;
                                if (svg) {
                                    var iconSpan = th.querySelector('.notum-th-icon');
                                    if (iconSpan) iconSpan.innerHTML = svg;
                                }
                            } else {
                                th.removeAttribute('data-custom-icon');
                                var colType = th.getAttribute('data-col-type') || 'text';
                                var iconSpan = th.querySelector('.notum-th-icon');
                                if (iconSpan) iconSpan.innerHTML = TYPE_ICONS[colType] || '';
                            }
                            saveDocumentContent();
                        });
                    }
                } else if (type) {
                    changeColumnType(table, colIndex, type);
                    closeActivePopover();
                }
            };
        });
    }

    function closeActivePopover() {
        if (activePopover) {
            activePopover.remove();
            activePopover = null;
        }
    }

    function duplicateColumn(table, colIndex) {
        var headers = table.querySelectorAll('thead tr th');
        var th = headers[colIndex];
        if (!th) return;

        var colType = th.getAttribute('data-col-type') || 'text';
        var nameSpan = th.querySelector('.notum-th-name');
        var colName = (nameSpan ? nameSpan.textContent.trim() : 'Kolon') + ' (Kopya)';
        var customIcon = th.getAttribute('data-custom-icon');
        var formula = th.getAttribute('data-formula');

        var newTh = th.cloneNode(true);
        var newNameSpan = newTh.querySelector('.notum-th-name');
        if (newNameSpan) newNameSpan.textContent = colName;
        if (formula) newTh.setAttribute('data-formula', formula);
        if (customIcon) newTh.setAttribute('data-custom-icon', customIcon);

        var nextTh = th.nextSibling;
        th.parentNode.insertBefore(newTh, nextTh);

        var rows = table.querySelectorAll('tbody tr');
        rows.forEach(function(row) {
            var cell = row.children[colIndex];
            if (cell) {
                var newCell = cell.cloneNode(true);
                row.insertBefore(newCell, cell.nextSibling);
            }
        });

        saveDocumentContent();
        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show('Sütun çoğaltıldı', 'success');
        }
    }

    function deleteColumn(table, colIndex) {
        var headers = table.querySelectorAll('thead tr th.notum-db-th');
        if (headers.length <= 1) {
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show('En az bir sütun bulunmalıdır!', 'warning');
            } else {
                alert('En az bir sütun bulunmalıdır!');
            }
            return;
        }
        var allThs = table.querySelectorAll('thead tr th');
        if (allThs[colIndex]) allThs[colIndex].remove();
        var rows = table.querySelectorAll('tbody tr');
        rows.forEach(function(row) {
            if (row.children[colIndex]) row.children[colIndex].remove();
        });
        saveDocumentContent();
        if (typeof Toast !== 'undefined' && Toast.show) {
            Toast.show('Sütun silindi', 'info');
        }
    }

    function changeColumnType(table, colIndex, newType) {
        var headers = table.querySelectorAll('thead tr th');
        var th = headers[colIndex];
        if (!th) return;

        th.setAttribute('data-col-type', newType);
        if (!th.getAttribute('data-custom-icon')) {
            var iconSpan = th.querySelector('.notum-th-icon');
            if (iconSpan) iconSpan.innerHTML = TYPE_ICONS[newType] || '';
        }

        var rows = table.querySelectorAll('tbody tr');
        rows.forEach(function(row) {
            var cell = row.children[colIndex];
            if (!cell) return;

            cell.className = 'notum-db-td notum-cell-' + newType;

            if (newType === 'checkbox') {
                cell.setAttribute('contenteditable', 'false');
                cell.removeAttribute('onclick');
                cell.innerHTML = '<input type="checkbox" class="notum-checkbox-input" onchange="Tablo.handleCheckboxChange(this)">';
            } else if (newType === 'select' || newType === 'multiselect' || newType === 'status') {
                cell.setAttribute('contenteditable', 'false');
                cell.setAttribute('onclick', 'Tablo.handleSelectCellClick(this, event)');
                cell.innerHTML = '<div class="notum-pill-container"></div>';
            } else if (newType === 'date') {
                cell.setAttribute('contenteditable', 'false');
                cell.removeAttribute('onclick');
                cell.innerHTML = '<input type="date" class="notum-date-input" style="border:none; background:transparent; font-family:inherit; color:inherit; outline:none;" onchange="Tablo.saveDocumentContent()">';
            } else if (newType === 'location') {
                cell.setAttribute('contenteditable', 'false');
                cell.setAttribute('onclick', 'Tablo.handleLocationCellClick(this, event)');
                cell.innerHTML = '<span class="notum-location-value" style="color:var(--color-text-tertiary); font-size:13px; cursor:pointer;">Konum Ekle</span>';
            } else if (newType === 'calendar-date') {
                cell.setAttribute('contenteditable', 'false');
                cell.setAttribute('onclick', 'Tablo.handleCalendarDateCellClick(this, event)');
                cell.innerHTML = '<span class="notum-calendar-date-value" style="color:var(--color-text-tertiary); font-size:13px; cursor:pointer;">Tarih Seç</span>';
            } else if (newType === 'files') {
                cell.setAttribute('contenteditable', 'false');
                cell.setAttribute('onclick', 'Tablo.handleFileCellClick(this, event)');
                cell.innerHTML = '<span class="notum-file-placeholder" style="color:var(--color-text-tertiary); font-size:13px; cursor:pointer;">Dosya Ekle</span>';
            } else if (newType === 'formula') {
                cell.setAttribute('contenteditable', 'false');
                cell.removeAttribute('onclick');
                cell.innerHTML = '';
            } else {
                cell.setAttribute('contenteditable', 'true');
                cell.removeAttribute('onclick');
                var txt = cell.textContent.trim();
                if (txt === '✨ Doldur' || txt === 'Tarih Seç' || txt === 'Konum Ekle' || txt === 'Dosya Ekle') txt = '';
                cell.innerHTML = txt;
            }
        });
        saveDocumentContent();
    }

    function addNotionColumn(btn, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        closeActivePopover();

        var thAdd = btn.closest('th');
        if (!thAdd) return;
        var table = thAdd.closest('table');
        if (!table) return;

        var popover = document.createElement('div');
        popover.className = 'notum-db-popover';

        var rect = btn.getBoundingClientRect();
        positionAddColElement(popover, rect, 260, 420);

        var html = 
            '<div class="notum-popover-search-container" onclick="event.stopPropagation()">' +
            '  <input type="text" class="notum-popover-search" placeholder="Özellik adı..." value="">' +
            '</div>' +
            '<div class="notum-popover-list">';

        html += '<div class="notum-popover-group-title">Tür Seçin</div>';

        var types = [
            { id: 'text', label: 'Metin', icon: TYPE_ICONS['text'] },
            { id: 'number', label: 'Sayı', icon: TYPE_ICONS['number'] },
            { id: 'select', label: 'Etiket', icon: TYPE_ICONS['select'] },
            { id: 'multiselect', label: 'Çoklu Seçim', icon: TYPE_ICONS['multiselect'] },
            { id: 'status', label: 'Durum', icon: TYPE_ICONS['status'] },
            { id: 'checkbox', label: 'Onay Kutusu', icon: TYPE_ICONS['checkbox'] },
            { id: 'calendar-date', label: 'Tarih', icon: TYPE_ICONS['calendar-date'] },
            { id: 'location', label: 'Konum', icon: TYPE_ICONS['location'] },
            { id: 'formula', label: 'Formül', icon: TYPE_ICONS['formula'] },
            { id: 'person', label: 'Kişi', icon: TYPE_ICONS['person'] },
            { id: 'files', label: 'Dosya ve Medya', icon: TYPE_ICONS['files'] },
            { id: 'url', label: 'URL', icon: TYPE_ICONS['url'] },
            { id: 'email', label: 'E-posta', icon: TYPE_ICONS['email'] },
            { id: 'phone', label: 'Telefon', icon: TYPE_ICONS['phone'] }
        ];

        types.forEach(function(t) {
            html += 
                '  <button type="button" class="notum-popover-item" data-type="' + t.id + '">' +
                '    <span class="notum-popover-item-icon">' + t.icon + '</span>' +
                '    <span class="notum-popover-item-label">' + t.label + '</span>' +
                '  </button>';
        });

        html += '</div>';
        popover.innerHTML = html;
        document.body.appendChild(popover);
        activePopover = popover;

        var searchInput = popover.querySelector('.notum-popover-search');
        if (searchInput) {
            searchInput.focus();

            searchInput.addEventListener('input', function() {
                var query = searchInput.value.toLowerCase().trim();
                popover.querySelectorAll('.notum-popover-item[data-type]').forEach(function(item) {
                    var label = item.querySelector('.notum-popover-item-label').textContent.toLowerCase();
                    item.style.display = (!query || label.indexOf(query) !== -1) ? 'flex' : 'none';
                });
            });

            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    var finalColName = searchInput.value.trim() || 'Yeni Sütun';
                    closeActivePopover();
                    insertColumnOfType(table, 'text', finalColName, thAdd);
                }
            });
        }

        popover.querySelectorAll('.notum-popover-item').forEach(function(item) {
            item.onclick = function(e) {
                e.stopPropagation();
                var type = item.getAttribute('data-type');
                var labelSpan = item.querySelector('.notum-popover-item-label');
                var typeLabel = labelSpan ? labelSpan.textContent.trim() : 'Özellik';
                var finalColName = (searchInput ? searchInput.value.trim() : '') || typeLabel;

                closeActivePopover();
                if (type) {
                    insertColumnOfType(table, type, finalColName, thAdd);
                }
            };
        });
    }

    function insertColumnOfType(table, type, colName, thAdd) {
        var headersRow = table.querySelector('thead tr');
        var icon = TYPE_ICONS[type] || '';
        var width = '150px';
        if (type === 'checkbox') width = '120px';
        else if (type === 'select' || type === 'multiselect' || type === 'status') width = '180px';
        else if (type === 'calendar-date' || type === 'date') width = '160px';
        else if (type === 'location') width = '160px';
        else if (type === 'files') width = '160px';

        var th = document.createElement('th');
        th.className = 'notum-db-th';
        th.setAttribute('data-col-type', type);
        th.style.width = width;

        th.innerHTML = 
            '  <div class="notum-db-th-content" onclick="Tablo.showColumnPopover(this, event)">' +
            '    <span class="notum-th-icon">' + icon + '</span>' +
            '    <span class="notum-th-name">' + colName + '</span>' +
            '    <span class="notum-th-settings-btn">▼</span>' +
            '  </div>' +
            '  <div class="notum-col-resize-handle"></div>';

        headersRow.insertBefore(th, thAdd);

        var rows = table.querySelectorAll('tbody tr');
        rows.forEach(function(row) {
            var placeholderCell = row.querySelector('.notum-db-add-col-placeholder');
            var td = document.createElement('td');
            td.className = 'notum-db-td notum-cell-' + type;

            if (type === 'checkbox') {
                td.setAttribute('contenteditable', 'false');
                td.innerHTML = '<input type="checkbox" class="notum-checkbox-input" onchange="Tablo.handleCheckboxChange(this)">';
            } else if (type === 'select' || type === 'multiselect' || type === 'status') {
                td.setAttribute('contenteditable', 'false');
                td.setAttribute('onclick', 'Tablo.handleSelectCellClick(this, event)');
                td.innerHTML = '<div class="notum-pill-container"></div>';
            } else if (type === 'date') {
                td.setAttribute('contenteditable', 'false');
                td.innerHTML = '<input type="date" class="notum-date-input" style="border:none; background:transparent; font-family:inherit; color:inherit; outline:none;" onchange="Tablo.saveDocumentContent()">';
            } else if (type === 'location') {
                td.setAttribute('contenteditable', 'false');
                td.setAttribute('onclick', 'Tablo.handleLocationCellClick(this, event)');
                td.innerHTML = '<span class="notum-location-value" style="color:var(--color-text-tertiary); font-size:13px; cursor:pointer;">Konum Ekle</span>';
            } else if (type === 'calendar-date') {
                td.setAttribute('contenteditable', 'false');
                td.setAttribute('onclick', 'Tablo.handleCalendarDateCellClick(this, event)');
                td.innerHTML = '<span class="notum-calendar-date-value" style="color:var(--color-text-tertiary); font-size:13px; cursor:pointer;">Tarih Seç</span>';
            } else if (type === 'files') {
                td.setAttribute('contenteditable', 'false');
                td.setAttribute('onclick', 'Tablo.handleFileCellClick(this, event)');
                td.innerHTML = '<span class="notum-file-placeholder" style="color:var(--color-text-tertiary); font-size:13px; cursor:pointer;">Dosya Ekle</span>';
            } else if (type === 'formula') {
                td.setAttribute('contenteditable', 'false');
                td.innerHTML = '';
            } else {
                td.setAttribute('contenteditable', 'true');
                td.innerHTML = '';
            }
            row.insertBefore(td, placeholderCell);
        });
        saveDocumentContent();
    }

    function addNotionRow(button) {
        var wrapper = button.closest('.notum-db-wrapper');
        if (!wrapper) return;
        var table = wrapper.querySelector('.notum-db-table');
        if (!table) return;
        var tbody = table.querySelector('tbody') || table;
        var ths = table.querySelectorAll('thead th.notum-db-th');

        var tr = document.createElement('tr');
        ths.forEach(function(th) {
            var colType = th.getAttribute('data-col-type') || 'text';
            var td = document.createElement('td');
            td.className = 'notum-db-td notum-cell-' + colType;

            if (colType === 'checkbox') {
                td.setAttribute('contenteditable', 'false');
                td.innerHTML = '<input type="checkbox" class="notum-checkbox-input" onchange="Tablo.handleCheckboxChange(this)">';
            } else if (colType === 'select' || colType === 'multiselect' || colType === 'status') {
                td.setAttribute('contenteditable', 'false');
                td.setAttribute('onclick', 'Tablo.handleSelectCellClick(this, event)');
                td.innerHTML = '<div class="notum-pill-container"></div>';
            } else if (colType === 'date') {
                td.setAttribute('contenteditable', 'false');
                td.innerHTML = '<input type="date" class="notum-date-input" style="border:none; background:transparent; font-family:inherit; color:inherit; outline:none;" onchange="Tablo.saveDocumentContent()">';
            } else if (colType === 'location') {
                td.setAttribute('contenteditable', 'false');
                td.setAttribute('onclick', 'Tablo.handleLocationCellClick(this, event)');
                td.innerHTML = '<span class="notum-location-value" style="color:var(--color-text-tertiary); font-size:13px; cursor:pointer;">Konum Ekle</span>';
            } else if (colType === 'calendar-date') {
                td.setAttribute('contenteditable', 'false');
                td.setAttribute('onclick', 'Tablo.handleCalendarDateCellClick(this, event)');
                td.innerHTML = '<span class="notum-calendar-date-value" style="color:var(--color-text-tertiary); font-size:13px; cursor:pointer;">Tarih Seç</span>';
            } else if (colType === 'files') {
                td.setAttribute('contenteditable', 'false');
                td.setAttribute('onclick', 'Tablo.handleFileCellClick(this, event)');
                td.innerHTML = '<span class="notum-file-placeholder" style="color:var(--color-text-tertiary); font-size:13px; cursor:pointer;">Dosya Ekle</span>';
            } else if (colType === 'formula') {
                td.setAttribute('contenteditable', 'false');
                td.innerHTML = '';
            } else {
                td.setAttribute('contenteditable', 'true');
                td.innerHTML = '';
            }
            tr.appendChild(td);
        });

        var placeholderTd = document.createElement('td');
        placeholderTd.className = 'notum-db-add-col-placeholder';
        placeholderTd.setAttribute('contenteditable', 'false');
        tr.appendChild(placeholderTd);

        tbody.appendChild(tr);
        saveDocumentContent();
    }

    function handleCheckboxChange(checkbox) {
        if (checkbox.checked) {
            checkbox.setAttribute('checked', 'checked');
        } else {
            checkbox.removeAttribute('checked');
        }
        saveDocumentContent();
    }

    function handleSelectCellClick(cell, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        if (activeTagPicker && activeTagPicker.targetCell === cell) {
            closeActiveTagPicker();
            return;
        }

        closeActiveTagPicker();

        var table = cell.closest('table');
        var colIndex = Array.prototype.indexOf.call(cell.parentNode.children, cell);
        var headers = table.querySelectorAll('thead th');
        if (!headers[colIndex]) return;
        var colType = headers[colIndex].getAttribute('data-col-type') || 'select';

        var existingTags = [];
        var cells = table.querySelectorAll('tbody tr');
        cells.forEach(function(r) {
            var c = r.children[colIndex];
            if (c) {
                var pills = c.querySelectorAll('.notum-pill');
                pills.forEach(function(pill) {
                    var name = pill.textContent.trim();
                    var colorClass = Array.prototype.find.call(pill.classList, function(cls) {
                        return cls.startsWith('color-');
                    }) || 'color-gray';

                    if (!existingTags.some(function(t) { return t.name.toLowerCase() === name.toLowerCase(); })) {
                        existingTags.push({ name: name, colorClass: colorClass });
                    }
                });
            }
        });

        if (colType === 'status') {
            existingTags = [
                { name: 'Başlanmadı', colorClass: 'color-gray' },
                { name: 'Yapılıyor', colorClass: 'color-blue' },
                { name: 'Tamamlandı', colorClass: 'color-green' }
            ];
        }

        var picker = document.createElement('div');
        picker.className = 'notum-tag-picker';

        var rect = cell.getBoundingClientRect();
        positionFloatingElement(picker, rect, 200, 320);

        var html = 
            '<input type="text" class="notum-tag-picker-input" placeholder="Etiket ara veya oluştur..."' + (colType === 'status' ? ' style="display:none;"' : '') + '>' +
            '<div class="notum-tag-picker-options">';

        existingTags.forEach(function(tag) {
            html += 
                '  <div class="notum-tag-option" data-name="' + tag.name + '" data-color="' + tag.colorClass + '">' +
                '    <span class="notum-pill ' + tag.colorClass + '">' + tag.name + '</span>' +
                '  </div>';
        });

        html += '</div>';
        html += '<div class="notum-create-tag-btn" style="display:none; font-weight:500;">Etiket oluştur...</div>';

        picker.innerHTML = html;
        document.body.appendChild(picker);
        activeTagPicker = picker;
        picker.targetCell = cell;

        var input = picker.querySelector('.notum-tag-picker-input');
        if (colType !== 'status') {
            input.focus();
        }

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                
                var val = input.value.trim();
                if (!val) return;

                var options = picker.querySelectorAll('.notum-tag-option');
                var visibleOptions = [];
                options.forEach(function(opt) {
                    if (opt.style.display !== 'none') {
                        visibleOptions.push(opt);
                    }
                });

                var exactMatch = null;
                for (var i = 0; i < visibleOptions.length; i++) {
                    if (visibleOptions[i].getAttribute('data-name').toLowerCase() === val.toLowerCase()) {
                        exactMatch = visibleOptions[i];
                        break;
                    }
                }

                if (exactMatch) {
                    exactMatch.click();
                } else if (visibleOptions.length > 0) {
                    visibleOptions[0].click();
                } else {
                    var colors = ['color-gray', 'color-brown', 'color-orange', 'color-yellow', 'color-green', 'color-blue', 'color-purple', 'color-pink', 'color-red'];
                    var randomColor = colors[Math.floor(Math.random() * colors.length)];
                    addTagToCell(cell, val, randomColor, colType);
                    closeActiveTagPicker();
                }
            }
        });

        var createBtn = picker.querySelector('.notum-create-tag-btn');

        input.addEventListener('input', function() {
            var val = input.value.trim();
            var options = picker.querySelectorAll('.notum-tag-option');
            var matchesAny = false;

            options.forEach(function(opt) {
                var name = opt.getAttribute('data-name');
                if (name.toLowerCase().indexOf(val.toLowerCase()) !== -1) {
                    opt.style.display = 'flex';
                    matchesAny = true;
                } else {
                    opt.style.display = 'none';
                }
            });

            if (val && !matchesAny) {
                createBtn.style.display = 'block';
                createBtn.textContent = '"' + val + '" etiketini oluştur';
            } else {
                createBtn.style.display = 'none';
            }
        });

        picker.querySelectorAll('.notum-tag-option').forEach(function(opt) {
            opt.onclick = function() {
                var tagName = opt.getAttribute('data-name');
                var colorClass = opt.getAttribute('data-color');
                addTagToCell(cell, tagName, colorClass, colType);
                closeActiveTagPicker();
            };
        });

        createBtn.onclick = function() {
            var val = input.value.trim();
            if (!val) return;

            var colors = ['color-gray', 'color-brown', 'color-orange', 'color-yellow', 'color-green', 'color-blue', 'color-purple', 'color-pink', 'color-red'];
            var randomColor = colors[Math.floor(Math.random() * colors.length)];

            addTagToCell(cell, val, randomColor, colType);
            closeActiveTagPicker();
        };
    }

    function addTagToCell(cell, name, colorClass, colType) {
        var container = cell.querySelector('.notum-pill-container');
        if (!container) {
            cell.innerHTML = '<div class="notum-pill-container"></div>';
            container = cell.querySelector('.notum-pill-container');
        }

        var pill = document.createElement('span');
        pill.className = 'notum-pill ' + colorClass;
        pill.textContent = name;
        pill.title = 'Silmek için tıklayın';

        pill.onclick = function(e) {
            e.stopPropagation();
            pill.remove();
            saveDocumentContent();
        };

        if (colType === 'status') {
            container.innerHTML = '';
            container.appendChild(pill);
        } else {
            var exists = false;
            container.querySelectorAll('.notum-pill').forEach(function(p) {
                if (p.textContent.trim().toLowerCase() === name.toLowerCase()) {
                    exists = true;
                }
            });
            if (!exists) {
                container.appendChild(pill);
            }
        }
        saveDocumentContent();
    }

    function closeActiveTagPicker() {
        if (activeTagPicker) {
            activeTagPicker.remove();
            activeTagPicker = null;
        }
    }



    function getActiveCell() {
        var selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return null;

        var node = selection.getRangeAt(0).commonAncestorContainer;
        while (node) {
            if (node.nodeType === 1 && node.tagName === 'TD' && node.closest('.notum-db-table')) {
                return node;
            }
            node = node.parentNode;
        }
        return null;
    }

    function handleTabKeyNavigation(e) {
        if (e.key === 'Tab') {
            var cell = getActiveCell();
            if (cell) {
                e.preventDefault();
                e.stopPropagation();

                var table = cell.closest('.notum-db-table');
                var cells = Array.prototype.slice.call(table.querySelectorAll('td:not(.notum-db-add-col-placeholder)'));
                var index = cells.indexOf(cell);
                if (index !== -1) {
                    var nextCell;
                    if (e.shiftKey) {
                        nextCell = cells[index - 1] || cells[cells.length - 1];
                    } else {
                        nextCell = cells[index + 1] || cells[0];
                    }
                    nextCell.focus({ preventScroll: true });

                    var range = document.createRange();
                    range.selectNodeContents(nextCell);
                    var sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        }
    }

    // Helper operations (align, delete, duplicate, copy)
    function alignTable(alignment, button) {
        var wrapper = button.closest('.tablo-table-wrapper');
        if (!wrapper) return;

        if (alignment === 'left') {
            wrapper.style.marginLeft = '0';
            wrapper.style.marginRight = 'auto';
        } else if (alignment === 'center') {
            wrapper.style.marginLeft = 'auto';
            wrapper.style.marginRight = 'auto';
        } else if (alignment === 'right') {
            wrapper.style.marginLeft = 'auto';
            wrapper.style.marginRight = '0';
        }
        saveDocumentContent();
    }

    function deleteTable(button) {
        var wrapper = button.closest('.tablo-table-wrapper');
        if (!wrapper) return;

        var backdrop = document.createElement('div');
        backdrop.className = 'tablo-modal-backdrop';
        backdrop.style.position = 'fixed';
        backdrop.style.top = '0';
        backdrop.style.left = '0';
        backdrop.style.width = '100vw';
        backdrop.style.height = '100vh';
        backdrop.style.backgroundColor = 'rgba(15, 23, 42, 0.4)';
        backdrop.style.backdropFilter = 'blur(6px)';
        backdrop.style.display = 'flex';
        backdrop.style.alignItems = 'center';
        backdrop.style.justifyContent = 'center';
        backdrop.style.zIndex = '9999';

        var card = document.createElement('div');
        card.style.background = 'var(--color-bg-elevated, #ffffff)';
        card.style.border = '1px solid var(--color-border-subtle, rgba(0,0,0,0.06))';
        card.style.borderRadius = '20px';
        card.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
        card.style.width = '350px';
        card.style.padding = '32px 24px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.textAlign = 'center';
        card.style.boxSizing = 'border-box';
        card.style.fontFamily = "'Outfit', 'Inter', sans-serif";

        var iconWrap = document.createElement('div');
        iconWrap.style.width = '72px';
        iconWrap.style.height = '72px';
        iconWrap.style.backgroundColor = 'var(--color-bg-danger-subtle, #fef2f2)';
        iconWrap.style.borderRadius = '50%';
        iconWrap.style.display = 'flex';
        iconWrap.style.alignItems = 'center';
        iconWrap.style.justifyContent = 'center';
        iconWrap.style.marginBottom = '20px';
        iconWrap.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<polyline points="3 6 5 6 21 6"></polyline>' +
            '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
            '<line x1="10" y1="11" x2="10" y2="17"></line>' +
            '<line x1="14" y1="11" x2="14" y2="17"></line>' +
            '</svg>';

        var title = document.createElement('h3');
        title.textContent = 'Tabloyu Sil';
        title.style.fontSize = '20px';
        title.style.fontWeight = '700';
        title.style.color = 'var(--color-text, #1e293b)';
        title.style.margin = '0 0 10px 0';

        var desc = document.createElement('p');
        desc.textContent = 'Bu tabloyu silmek istediğinize emin misiniz?';
        desc.style.fontSize = '14px';
        desc.style.color = 'var(--color-text-secondary, #64748b)';
        desc.style.lineHeight = '1.5';
        desc.style.margin = '0 0 24px 0';

        var buttonsRow = document.createElement('div');
        buttonsRow.style.display = 'flex';
        buttonsRow.style.gap = '12px';
        buttonsRow.style.width = '100%';

        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Vazgeç';
        cancelBtn.style.flex = '1';
        cancelBtn.style.background = 'var(--color-bg-inset, #f8fafc)';
        cancelBtn.style.border = '1px solid var(--color-border, #e2e8f0)';
        cancelBtn.style.borderRadius = '12px';
        cancelBtn.style.padding = '12px 16px';
        cancelBtn.style.fontSize = '14px';
        cancelBtn.style.fontWeight = '600';
        cancelBtn.style.color = 'var(--color-text, #475569)';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.onclick = function() { backdrop.remove(); };

        var confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.textContent = 'Sil';
        confirmBtn.style.flex = '1';
        confirmBtn.style.background = '#ef4444';
        confirmBtn.style.border = 'none';
        confirmBtn.style.borderRadius = '12px';
        confirmBtn.style.padding = '12px 16px';
        confirmBtn.style.fontSize = '14px';
        confirmBtn.style.fontWeight = '600';
        confirmBtn.style.color = '#ffffff';
        confirmBtn.style.cursor = 'pointer';
        confirmBtn.onclick = function() {
            wrapper.remove();
            backdrop.remove();
            saveDocumentContent();
        };

        buttonsRow.appendChild(cancelBtn);
        buttonsRow.appendChild(confirmBtn);
        card.appendChild(iconWrap);
        card.appendChild(title);
        card.appendChild(desc);
        card.appendChild(buttonsRow);
        backdrop.appendChild(card);
        document.body.appendChild(backdrop);
    }

    function duplicateTable(button) {
        var wrapper = button.closest('.tablo-table-wrapper');
        if (!wrapper) return;

        var clone = wrapper.cloneNode(true);
        clone.classList.remove('selected');
        clone.classList.remove('dragging');
        clone.setAttribute('draggable', 'false');

        wrapper.parentNode.insertBefore(clone, wrapper.nextSibling);
        saveDocumentContent();
    }

    function copyTableToClipboard(wrapper) {
        var clone = wrapper.cloneNode(true);
        clone.classList.remove('selected');
        clone.classList.remove('dragging');
        clone.setAttribute('draggable', 'false');

        var html = clone.outerHTML;
        var blobHTML = new Blob([html], { type: 'text/html' });
        var blobText = new Blob([clone.innerText || ''], { type: 'text/plain' });

        if (navigator.clipboard && navigator.clipboard.write) {
            navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': blobHTML,
                    'text/plain': blobText
                })
            ]).then(function() {
                if (typeof Toast !== 'undefined' && Toast.show) {
                    Toast.show('Tablo panoya kopyalandı! Ctrl+V ile yapıştırabilirsiniz.', 'success');
                } else {
                    alert('Tablo panoya kopyalandı! Ctrl+V ile yapıştırabilirsiniz.');
                }
            }).catch(function(err) {
                console.error('Kopyalama hatası:', err);
                fallbackCopy(html);
            });
        } else {
            fallbackCopy(html);
        }
    }

    function fallbackCopy(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            if (typeof Toast !== 'undefined' && Toast.show) {
                Toast.show('Tablo panoya kopyalandı! Ctrl+V ile yapıştırabilirsiniz.', 'success');
            } else {
                alert('Tablo panoya kopyalandı! Ctrl+V ile yapıştırabilirsiniz.');
            }
        } catch (e) {
            console.error('Kopyalama hatası:', e);
        }
        textarea.remove();
    }

    function copyTable(button) {
        var wrapper = button.closest('.tablo-table-wrapper');
        if (!wrapper) return;
        copyTableToClipboard(wrapper);
    }

    /* ---- KONUM HÜCRE İŞLEVİ ---- */
    var activeLocationCell = null;
    var locationSearchTimeout = null;

    function getLocationIconSVG(type) {
        if (type === 'park') {
            return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L3 9h3v10h12V9h3L12 2z"/><path d="M12 22V9"/></svg>';
        } else if (type === 'shopping') {
            return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
        }
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
    }

    function handleLocationCellClick(cell, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        closeActivePopover();
        activeLocationCell = cell;

        var popover = document.createElement('div');
        popover.className = 'notum-db-popover notum-location-popover';
        popover.style.width = '300px';
        popover.style.maxHeight = '360px';

        var rect = cell.getBoundingClientRect();
        positionFloatingElement(popover, rect, 300, 360);

        popover.innerHTML =
            '<div class="notum-popover-search-container" onclick="event.stopPropagation()">' +
            '  <div style="display:flex; align-items:center; gap:8px; padding:0 4px;">' +
            '    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
            '    <input type="text" class="notum-popover-search" placeholder="Konum ara..." style="flex:1;">' +
            '  </div>' +
            '</div>' +
            '<div class="notum-location-results" style="max-height:280px; overflow-y:auto; padding:4px 0;"></div>';

        document.body.appendChild(popover);
        activePopover = popover;

        var searchInput = popover.querySelector('.notum-popover-search');
        var resultsContainer = popover.querySelector('.notum-location-results');

        // Show recommended locations
        renderLocationRecommendations(resultsContainer);

        if (searchInput) {
            searchInput.focus();
            searchInput.addEventListener('input', function() {
                var val = searchInput.value.trim();
                if (!val) {
                    renderLocationRecommendations(resultsContainer);
                } else {
                    searchLocationForTable(val, resultsContainer);
                }
            });
        }

        // Clear button 
        var currentVal = cell.querySelector('.notum-location-value');
        if (currentVal && currentVal.textContent !== 'Konum Ekle') {
            var clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.style.cssText = 'width:100%; padding:8px 12px; border:none; background:transparent; cursor:pointer; font-size:13px; color:var(--color-danger, #ef4444); text-align:left; display:flex; align-items:center; gap:6px;';
            clearBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Konumu Kaldır';
            clearBtn.onclick = function(e) {
                e.stopPropagation();
                cell.innerHTML = '<span class="notum-location-value" style="color:var(--color-text-tertiary); font-size:13px; cursor:pointer;">Konum Ekle</span>';
                closeActivePopover();
                saveDocumentContent();
            };
            resultsContainer.parentNode.appendChild(clearBtn);
        }
    }

    function renderLocationRecommendations(container) {
        if (!container) return;
        var html = '<div style="padding:4px 12px; font-size:11px; font-weight:600; color:var(--color-text-tertiary); text-transform:uppercase; letter-spacing:0.5px;">Önerilen Konumlar</div>';
        
        var recommended = [];
        if (typeof LOCATION_DB_FULL !== 'undefined') {
            var cities = LOCATION_DB_FULL.turkeyProvinces || [];
            recommended = cities.slice(0, 8);
        }
        if (recommended.length === 0) {
            recommended = [
                { name: 'İstanbul', sub: 'Türkiye', type: 'pin' },
                { name: 'Ankara', sub: 'Türkiye', type: 'pin' },
                { name: 'İzmir', sub: 'Türkiye', type: 'pin' },
                { name: 'Antalya', sub: 'Türkiye', type: 'pin' },
                { name: 'Bursa', sub: 'Türkiye', type: 'pin' },
                { name: 'Trabzon', sub: 'Türkiye', type: 'pin' },
                { name: 'Konya', sub: 'Türkiye', type: 'pin' },
                { name: 'Adana', sub: 'Türkiye', type: 'pin' }
            ];
        }

        recommended.forEach(function(loc) {
            html += '<div class="notum-location-result-item" onclick="Tablo.selectLocationForCell(\'' + loc.name.replace(/'/g, "\\'") + '\')" style="display:flex; align-items:center; gap:10px; padding:7px 12px; cursor:pointer; border-radius:4px; transition: background 0.15s;">' +
                '<span style="color:var(--color-text-secondary); flex-shrink:0;">' + getLocationIconSVG(loc.type || 'pin') + '</span>' +
                '<div style="display:flex; flex-direction:column; gap:1px; overflow:hidden;">' +
                '<span style="font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + loc.name + '</span>' +
                '<span style="font-size:11px; color:var(--color-text-secondary);">' + (loc.sub || '') + '</span>' +
                '</div>' +
                '</div>';
        });
        container.innerHTML = html;
    }

    function searchLocationForTable(val, container) {
        if (locationSearchTimeout) clearTimeout(locationSearchTimeout);
        if (!container) return;

        container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--color-text-secondary);font-size:13px;"><div class="spinner" style="display:inline-block;width:18px;height:18px;border:2px solid var(--color-border-subtle);border-top-color:var(--color-accent);border-radius:50%;animation:spin 0.8s linear infinite;margin-bottom:6px;"></div><div>Aranıyor...</div></div>';

        locationSearchTimeout = setTimeout(function() {
            // First search local data
            var localResults = [];
            if (typeof LOCATION_DB_FULL !== 'undefined') {
                var lowerVal = val.toLowerCase();
                var allLocations = [].concat(
                    LOCATION_DB_FULL.countries || [],
                    LOCATION_DB_FULL.turkeyProvinces || [],
                    LOCATION_DB_FULL.worldCities || []
                );
                allLocations.forEach(function(loc) {
                    if (loc.name.toLowerCase().indexOf(lowerVal) !== -1 && localResults.length < 10) {
                        localResults.push(loc);
                    }
                });
            }

            if (localResults.length > 0) {
                var html = '';
                localResults.forEach(function(loc) {
                    html += '<div class="notum-location-result-item" onclick="Tablo.selectLocationForCell(\'' + loc.name.replace(/'/g, "\\'") + '\')" style="display:flex; align-items:center; gap:10px; padding:7px 12px; cursor:pointer; border-radius:4px; transition: background 0.15s;">' +
                        '<span style="color:var(--color-text-secondary); flex-shrink:0;">' + getLocationIconSVG(loc.type || 'pin') + '</span>' +
                        '<div style="display:flex; flex-direction:column; gap:1px; overflow:hidden;">' +
                        '<span style="font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + loc.name + '</span>' +
                        '<span style="font-size:11px; color:var(--color-text-secondary);">' + (loc.sub || '') + '</span>' +
                        '</div>' +
                        '</div>';
                });
                container.innerHTML = html;
            } else {
                // Also try API
                fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(val) + '&addressdetails=1&limit=6', {
                    headers: { 'Accept-Language': 'tr,en' }
                })
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    if (!data || data.length === 0) {
                        container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--color-text-secondary);font-size:13px;">Sonuç bulunamadı</div>';
                        return;
                    }
                    var html = '';
                    data.forEach(function(item) {
                        var parts = item.display_name.split(',');
                        var mainName = parts[0].trim();
                        var subName = parts.slice(1, 3).map(function(p){ return p.trim(); }).join(', ');
                        html += '<div class="notum-location-result-item" onclick="Tablo.selectLocationForCell(\'' + mainName.replace(/'/g, "\\'") + '\')" style="display:flex; align-items:center; gap:10px; padding:7px 12px; cursor:pointer; border-radius:4px; transition: background 0.15s;">' +
                            '<span style="color:var(--color-text-secondary); flex-shrink:0;">' + getLocationIconSVG('pin') + '</span>' +
                            '<div style="display:flex; flex-direction:column; gap:1px; overflow:hidden;">' +
                            '<span style="font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + mainName + '</span>' +
                            '<span style="font-size:11px; color:var(--color-text-secondary);">' + subName + '</span>' +
                            '</div>' +
                            '</div>';
                    });
                    container.innerHTML = html;
                })
                .catch(function() {
                    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--color-text-secondary);font-size:13px;">Sonuç bulunamadı</div>';
                });
            }
        }, 300);
    }

    function selectLocationForCell(locationName) {
        if (activeLocationCell) {
            activeLocationCell.innerHTML = '<span class="notum-location-value" style="color:var(--color-accent, #2563eb); font-size:13px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">' +
                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
                locationName + '</span>';
        }
        closeActivePopover();
        saveDocumentContent();
    }

    /* ---- TAKVİM TARİH HÜCRE İŞLEVİ ---- */
    var activeCalendarDateCell = null;
    var calendarPopoverDate = new Date();
    var calendarSelectedDate = null;

    var MONTH_NAMES_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    var DAY_NAMES_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    function handleCalendarDateCellClick(cell, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        closeActivePopover();
        activeCalendarDateCell = cell;
        calendarPopoverDate = new Date();
        calendarSelectedDate = null;

        var popover = document.createElement('div');
        popover.className = 'notum-db-popover notum-calendar-popover';
        popover.style.width = '280px';
        popover.style.padding = '12px';

        var rect = cell.getBoundingClientRect();
        positionFloatingElement(popover, rect, 280, 380);

        document.body.appendChild(popover);
        activePopover = popover;
        renderCalendarPopover(popover);
    }

    function renderCalendarPopover(popover) {
        var year = calendarPopoverDate.getFullYear();
        var month = calendarPopoverDate.getMonth();
        var today = new Date();
        today.setHours(0,0,0,0);

        var firstDay = new Date(year, month, 1);
        var lastDay = new Date(year, month + 1, 0);
        var startDayOfWeek = (firstDay.getDay() + 6) % 7; // Mon = 0

        var html = '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">' +
            '<button type="button" onclick="Tablo.calendarPrev(event)" style="border:none; background:transparent; cursor:pointer; padding:4px; border-radius:4px; color:var(--color-text); display:flex; align-items:center;">' +
            '<svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>' +
            '</button>' +
            '<span style="font-weight:600; font-size:14px; color:var(--color-text);">' + MONTH_NAMES_TR[month] + ' ' + year + '</span>' +
            '<button type="button" onclick="Tablo.calendarNext(event)" style="border:none; background:transparent; cursor:pointer; padding:4px; border-radius:4px; color:var(--color-text); display:flex; align-items:center;">' +
            '<svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>' +
            '</button>' +
            '</div>';

        // Weekday headers
        html += '<div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:0; text-align:center; margin-bottom:4px;">';
        DAY_NAMES_TR.forEach(function(d) {
            html += '<div style="font-size:11px; color:var(--color-text-tertiary); font-weight:500; padding:4px 0;">' + d + '</div>';
        });
        html += '</div>';

        // Day cells
        html += '<div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:2px; text-align:center;">';
        // Empty cells for days before first day of month
        for (var i = 0; i < startDayOfWeek; i++) {
            html += '<div style="padding:6px 0;"></div>';
        }
        for (var d = 1; d <= lastDay.getDate(); d++) {
            var date = new Date(year, month, d);
            var isToday = date.getTime() === today.getTime();
            var isSelected = calendarSelectedDate && date.getTime() === calendarSelectedDate.getTime();
            var dayStyle = 'padding:6px 0; font-size:13px; border-radius:6px; cursor:pointer; transition: all 0.15s;';
            if (isSelected) {
                dayStyle += 'background:var(--color-accent, #2563eb); color:#fff; font-weight:600;';
            } else if (isToday) {
                dayStyle += 'background:var(--color-bg-subtle); font-weight:600; color:var(--color-accent, #2563eb);';
            } else {
                dayStyle += 'color:var(--color-text);';
            }
            html += '<div style="' + dayStyle + '" onclick="Tablo.selectCalendarDate(' + year + ',' + month + ',' + d + ', event)" onmouseover="if(!this.classList.contains(\'selected\'))this.style.background=\'var(--color-bg-subtle)\'" onmouseout="if(!this.classList.contains(\'selected\'))this.style.background=' + (isToday ? '\'var(--color-bg-subtle)\'' : '\'transparent\'') + '">' + d + '</div>';
        }
        html += '</div>';

        popover.innerHTML = html;
    }

    function calendarPrev(event) {
        if (event) event.stopPropagation();
        calendarPopoverDate.setMonth(calendarPopoverDate.getMonth() - 1);
        var popover = document.querySelector('.notum-calendar-popover');
        if (popover) renderCalendarPopover(popover);
    }

    function calendarNext(event) {
        if (event) event.stopPropagation();
        calendarPopoverDate.setMonth(calendarPopoverDate.getMonth() + 1);
        var popover = document.querySelector('.notum-calendar-popover');
        if (popover) renderCalendarPopover(popover);
    }

    function selectCalendarDate(year, month, day, event) {
        if (event) event.stopPropagation();
        calendarSelectedDate = new Date(year, month, day);
        
        var dd = day < 10 ? '0' + day : '' + day;
        var mm = (month + 1) < 10 ? '0' + (month + 1) : '' + (month + 1);
        var formattedDate = dd + '/' + mm + '/' + year;
        if (activeCalendarDateCell) {
            activeCalendarDateCell.innerHTML = '<span class="notum-calendar-date-value" style="color:var(--color-text); font-size:13px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">' +
                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent, #2563eb)" stroke-width="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
                formattedDate + '</span>';
        }
        closeActivePopover();
        saveDocumentContent();
    }

    function selectCalendarQuick(option, event) {
        if (event) event.stopPropagation();
        var d = new Date();
        if (option === 'tomorrow') d.setDate(d.getDate() + 1);
        selectCalendarDate(d.getFullYear(), d.getMonth(), d.getDate(), event);
    }

    function clearCalendarDate(event) {
        if (event) event.stopPropagation();
        if (activeCalendarDateCell) {
            activeCalendarDateCell.innerHTML = '<span class="notum-calendar-date-value" style="color:var(--color-text-tertiary); font-size:13px; cursor:pointer;">Tarih Seç</span>';
        }
        closeActivePopover();
        saveDocumentContent();
    }

    function handleFileCellClick(cell, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        if (event.target.classList.contains('notum-file-placeholder')) {
            var fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.style.display = 'none';

            fileInput.onchange = function(e) {
                var file = e.target.files[0];
                if (!file) return;

                var reader = new FileReader();
                reader.onload = function(evt) {
                    var dataUrl = evt.target.result;
                    cell.innerHTML = 
                        '<div style="display: inline-flex; align-items: center; gap: 6px;">' +
                        '  <a href="' + dataUrl + '" download="' + file.name + '" class="notum-file-link" style="color: var(--color-primary, #0066cc); text-decoration: underline; font-size: 13px; font-weight: 500; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="İndir: ' + file.name + '">📄 ' + file.name + '</a>' +
                        '  <span class="notum-file-delete-btn" onclick="Tablo.handleFileDelete(this, event)" style="color: var(--color-danger, #ef4444); cursor: pointer; font-size: 13px; font-weight: bold; padding: 2px 4px;" title="Dosyayı Kaldır">✕</span>' +
                        '</div>';
                    saveDocumentContent();
                };
                reader.readAsDataURL(file);
            };

            document.body.appendChild(fileInput);
            fileInput.click();
            document.body.removeChild(fileInput);
        }
    }

    function handleFileDelete(deleteBtn, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        var cell = deleteBtn.closest('.notum-cell-files');
        if (cell) {
            cell.innerHTML = '<span class="notum-file-placeholder" style="color:var(--color-text-tertiary); font-size:13px; cursor:pointer;">Dosya Ekle</span>';
            saveDocumentContent();
        }
    }

    function evaluateFormula(formulaStr, row, headers) {
        if (!formulaStr) return '';
        try {
            var evalStr = formulaStr;
            headers.forEach(function(th, idx) {
                var colName = th.querySelector('.notum-th-name').textContent.trim();
                var cell = row.children[idx];
                var val = '';
                if (cell) {
                    if (th.getAttribute('data-col-type') === 'checkbox') {
                        var cb = cell.querySelector('.notum-checkbox-input');
                        val = cb ? cb.checked : false;
                    } else {
                        val = cell.textContent.trim();
                    }
                }
                
                var cleanedVal = val.toString().replace(',', '.').trim();
                if (cleanedVal !== '' && !isNaN(Number(cleanedVal))) {
                    val = Number(cleanedVal);
                }
                
                var replacement = typeof val === 'string' ? JSON.stringify(val) : val;
                
                var escapedColName = colName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                var regex = new RegExp('{' + escapedColName + '}', 'g');
                evalStr = evalStr.replace(regex, replacement);
            });

            var result = new Function('return (' + evalStr + ')')();
            return result !== undefined && result !== null ? result : '';
        } catch (e) {
            return 'Hata';
        }
    }

    function recalculateTableFormulas(table) {
        var headers = table.querySelectorAll('thead th.notum-db-th');
        var formulaCols = [];
        headers.forEach(function(th, idx) {
            if (th.getAttribute('data-col-type') === 'formula') {
                formulaCols.push({ index: idx, formula: th.getAttribute('data-formula') || '' });
            }
        });

        if (formulaCols.length === 0) return;

        var rows = table.querySelectorAll('tbody tr');
        rows.forEach(function(row) {
            formulaCols.forEach(function(col) {
                var cell = row.children[col.index];
                if (cell) {
                    var calculated = evaluateFormula(col.formula, row, headers);
                    cell.textContent = calculated;
                }
            });
        });
    }

    function recalculateAllFormulas() {
        var tables = document.querySelectorAll('.notum-db-table');
        tables.forEach(recalculateTableFormulas);
    }

    // Auto initialize DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        init: init,
        showColumnPopover: showColumnPopover,
        addNotionColumn: addNotionColumn,
        addNotionRow: addNotionRow,
        handleCheckboxChange: handleCheckboxChange,
        handleSelectCellClick: handleSelectCellClick,
        handleLocationCellClick: handleLocationCellClick,
        handleCalendarDateCellClick: handleCalendarDateCellClick,
        handleFileCellClick: handleFileCellClick,
        handleFileDelete: handleFileDelete,
        selectLocationForCell: selectLocationForCell,
        selectCalendarDate: selectCalendarDate,
        selectCalendarQuick: selectCalendarQuick,
        clearCalendarDate: clearCalendarDate,
        calendarPrev: calendarPrev,
        calendarNext: calendarNext,
        saveDocumentContent: saveDocumentContent,
        alignTable: alignTable,
        deleteTable: deleteTable,
        duplicateTable: duplicateTable,
        copyTable: copyTable,
        closeActivePopover: closeActivePopover,
        closeActiveTagPicker: closeActiveTagPicker,
        duplicateColumn: duplicateColumn,
        deleteColumn: deleteColumn,
        changeColumnType: changeColumnType,
        insertColumnOfType: insertColumnOfType
    };
})();
