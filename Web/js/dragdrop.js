/* ========================================
   DRAG & DROP SIRALAMA SİSTEMİ
   Uzun tıklama (long-press) ile sürükle-bırak
   Modern Minimalist SaaS Dashboard tasarımı
   ======================================== */
var DragDrop = (function () {
    'use strict';

    var LONG_PRESS_DURATION = 400; // ms

    var _pressTimer = null;
    var _dragItem = null;
    var _dragClone = null;
    var _dragContainer = null;
    var _dragItems = [];
    var _placeholder = null;
    var _startY = 0;
    var _offsetY = 0;
    var _startX = 0;
    var _offsetX = 0;
    var _onReorder = null;
    var _isDragging = false;
    var _dragged = false;

    /* ---- Kayıt sırası yönetimi (localStorage) ---- */
    function getOrderKey(sectionKey) {
        var user = (typeof DB !== 'undefined' && DB.currentUser) ? DB.currentUser() : null;
        var userId = user ? (user.email || user.id || 'default') : 'default';
        return 'dragOrder_' + userId + '_' + sectionKey;
    }

    function getSavedOrder(sectionKey) {
        try {
            var key = getOrderKey(sectionKey);
            var data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) { return null; }
    }

    function saveOrder(sectionKey, idList) {
        try {
            var key = getOrderKey(sectionKey);
            localStorage.setItem(key, JSON.stringify(idList));
        } catch (e) { /* sessiz hata */ }
    }

    /* ---- Listeyi kaydedilmiş sıraya göre yeniden sırala ---- */
    function applySavedOrder(items, sectionKey, idField) {
        idField = idField || 'id';
        var order = getSavedOrder(sectionKey);
        if (!order || order.length === 0) return items;

        var map = {};
        items.forEach(function (item) { map[item[idField]] = item; });

        var sorted = [];
        order.forEach(function (id) {
            if (map[id]) {
                sorted.push(map[id]);
                delete map[id];
            }
        });
        /* Kalan (yeni eklenen) öğeleri başa ekle */
        var remaining = [];
        items.forEach(function (item) {
            var id = item[idField];
            if (map[id]) {
                remaining.push(item);
                delete map[id];
            }
        });
        return remaining.concat(sorted);
    }

    /* ---- Sürüklenebilir container'ı başlat ---- */
    function init(containerEl, sectionKey, onReorderCallback) {
        if (!containerEl) return;

        _onReorder = onReorderCallback || null;

        /* Her child item'a event listener ekle */
        var children = containerEl.querySelectorAll('[data-drag-id]');
        children.forEach(function (child) {
            child.addEventListener('mousedown', function (e) {
                handlePressStart(e, child, containerEl, sectionKey);
            });
            child.addEventListener('touchstart', function (e) {
                handlePressStart(e, child, containerEl, sectionKey);
            }, { passive: false });
        });
    }

    function handlePressStart(e, item, container, sectionKey) {
        /* Eğer buton veya input tıklanmışsa sürükleme başlatma */
        var target = e.target;
        while (target && target !== item) {
            var tag = target.tagName ? target.tagName.toLowerCase() : '';
            if (tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'a' ||
                target.classList.contains('team-task-checkbox') || target.classList.contains('finance-item-kebab') ||
                target.classList.contains('team-task-kebab') || target.onclick) {
                return;
            }
            target = target.parentElement;
        }

        clearTimeout(_pressTimer);
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var isTouch = !!e.touches;

        if (isTouch) {
            // Mobil cihazlarda uzun basma (long-press) ile başlat
            _pressTimer = setTimeout(function () {
                if (localStorage.getItem('notion_lock_page_preference') === 'true') {
                    if (typeof Toast !== 'undefined' && Toast.show) {
                        Toast.show("Bu sayfa kilitli. Düzenlemek için kilidi açın.", "warning");
                    }
                    return;
                }
                startDrag(e, item, container, sectionKey, clientY, clientX);
            }, LONG_PRESS_DURATION);

            var cancelPress = function () {
                clearTimeout(_pressTimer);
                document.removeEventListener('touchend', cancelPress);
                document.removeEventListener('touchmove', moveCheck);
            };

            var moveCheck = function (me) {
                var moveY = me.touches ? me.touches[0].clientY : me.clientY;
                var moveX = me.touches ? me.touches[0].clientX : me.clientX;
                if (Math.abs(moveY - clientY) > 8 || Math.abs(moveX - clientX) > 8) {
                    cancelPress();
                }
            };

            document.addEventListener('touchend', cancelPress);
            document.addEventListener('touchmove', moveCheck, { passive: false });
        } else {
            // Masaüstünde tıkla ve sürükle (5px hareket eşiği) ile anında başlat
            var onMouseMove = function (me) {
                var moveY = me.clientY;
                var moveX = me.clientX;
                if (Math.abs(moveY - clientY) > 5 || Math.abs(moveX - clientX) > 5) {
                    cleanupMouse();
                    if (localStorage.getItem('notion_lock_page_preference') === 'true') {
                        if (typeof Toast !== 'undefined' && Toast.show) {
                            Toast.show("Bu sayfa kilitli. Düzenlemek için kilidi açın.", "warning");
                        }
                        return;
                    }
                    startDrag(me, item, container, sectionKey, clientY, clientX);
                }
            };

            var onMouseUp = function () {
                cleanupMouse();
            };

            var cleanupMouse = function () {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
    }

    function startDrag(e, item, container, sectionKey, startClientY, startClientX) {
        if (_isDragging) return;
        _isDragging = true;
        _dragContainer = container;
        _dragItem = item;
        _dragged = false;

        /* Haptic feedback (mobile) */
        if (navigator.vibrate) navigator.vibrate(30);

        /* Item boyutlarını al */
        var rect = item.getBoundingClientRect();
        _startY = startClientY;
        _offsetY = startClientY - rect.top;
        _startX = (startClientX !== undefined) ? startClientX : (e.touches ? e.touches[0].clientX : e.clientX);
        _offsetX = _startX - rect.left;

        /* Placeholder oluştur */
        _placeholder = document.createElement('div');
        _placeholder.className = 'drag-placeholder';
        _placeholder.style.height = rect.height + 'px';
        _placeholder.style.margin = window.getComputedStyle(item).margin;
        item.parentNode.insertBefore(_placeholder, item);

        /* Klon oluştur (sürüklenen görsel) */
        _dragClone = item.cloneNode(true);
        _dragClone.className += ' drag-clone';
        _dragClone.style.width = rect.width + 'px';
        _dragClone.style.height = rect.height + 'px';
        _dragClone.style.left = rect.left + 'px';
        _dragClone.style.top = rect.top + 'px';
        document.body.appendChild(_dragClone);

        /* Orijinal öğeyi gizle */
        item.classList.add('drag-source');

        /* Container'daki tüm children */
        _dragItems = Array.prototype.slice.call(container.querySelectorAll('[data-drag-id]'));

        /* Event listeners */
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('touchmove', handleDragMove, { passive: false });

        var endDragHandler = function () {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('mouseup', endDragHandler);
            document.removeEventListener('touchend', endDragHandler);
            handleDragEnd(sectionKey);
        };

        document.addEventListener('mouseup', endDragHandler);
        document.addEventListener('touchend', endDragHandler);

        /* Container'a visual feedback */
        container.classList.add('drag-active');

        e.preventDefault();
    }

    function handleDragMove(e) {
        if (!_isDragging || !_dragClone) return;
        e.preventDefault();

        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;

        _dragClone.style.top = (clientY - _offsetY) + 'px';
        _dragClone.style.left = (clientX - _offsetX) + 'px';

        if (Math.abs(clientY - _startY) > 5 || Math.abs(clientX - _startX) > 5) {
            _dragged = true;
        }

        /* Placeholder pozisyonunu güncelle */
        var closestItem = null;
        var closestDist = Infinity;
        var insertBefore = true;

        _dragItems.forEach(function (child) {
            if (child === _dragItem || child.classList.contains('drag-source')) return;
            var r = child.getBoundingClientRect();
            var midY = r.top + r.height / 2;
            var midX = r.left + r.width / 2;

            // 2B Öklid mesafesi hesapla
            var dist = Math.pow(clientX - midX, 2) + Math.pow(clientY - midY, 2);
            if (dist < closestDist) {
                closestDist = dist;
                closestItem = child;

                if (clientY < r.top) {
                    insertBefore = true;
                } else if (clientY > r.bottom) {
                    insertBefore = false;
                } else {
                    insertBefore = clientX < midX;
                }
            }
        });

        if (closestItem && _placeholder) {
            if (insertBefore) {
                closestItem.parentNode.insertBefore(_placeholder, closestItem);
            } else {
                closestItem.parentNode.insertBefore(_placeholder, closestItem.nextSibling);
            }
        }
    }

    function handleDragEnd(sectionKey) {
        if (!_isDragging) return;
        _isDragging = false;

        /* Klon kaldır */
        if (_dragClone && _dragClone.parentNode) {
            _dragClone.parentNode.removeChild(_dragClone);
        }
        _dragClone = null;

        /* Orijinal öğeyi placeholder konumuna taşı */
        if (_placeholder && _placeholder.parentNode && _dragItem) {
            _placeholder.parentNode.insertBefore(_dragItem, _placeholder);
            _placeholder.parentNode.removeChild(_placeholder);
        }
        _placeholder = null;

        /* Visual feedback kaldır */
        if (_dragItem) _dragItem.classList.remove('drag-source');
        if (_dragContainer) _dragContainer.classList.remove('drag-active');

        /* Yeni sırayı kaydet */
        if (_dragContainer) {
            var newOrder = [];
            var items = _dragContainer.querySelectorAll('[data-drag-id]');
            items.forEach(function (item) {
                newOrder.push(item.getAttribute('data-drag-id'));
            });
            saveOrder(sectionKey, newOrder);

            if (_onReorder) _onReorder(newOrder);
        }

        /* Tıklama engelleme */
        if (_dragged) {
            var captureClick = function (e) {
                e.stopPropagation();
                e.preventDefault();
                window.removeEventListener('click', captureClick, true);
            };
            window.addEventListener('click', captureClick, true);
            setTimeout(function () {
                window.removeEventListener('click', captureClick, true);
            }, 50);
        }

        _dragItem = null;
        _dragContainer = null;
        _dragItems = [];
    }

    /* ---- Public API ---- */
    return {
        init: init,
        applySavedOrder: applySavedOrder,
        getSavedOrder: getSavedOrder,
        saveOrder: saveOrder
    };
})();
