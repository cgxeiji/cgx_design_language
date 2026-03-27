/**
 * CGx Design Language - HUD & Panel Components
 * Smooth <details> toggle animation and draggable HUD positioning.
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ── Helpers ──────────────────────────────────────────────────────

    /** Clear all inline positioning styles from an element. */
    function clearPosition(el) {
        el.style.left = '';
        el.style.top = '';
        el.style.right = '';
        el.style.bottom = '';
        el.style.transform = '';
    }

    /** Apply an absolute pixel position and override CSS anchoring. */
    function applyPosition(el, left, top) {
        el.style.left = left + 'px';
        el.style.top = top + 'px';
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        el.style.transform = 'none';
    }

    /** Build the localStorage key for a draggable HUD. */
    function cacheKeyFor(id) {
        return `cgx-hud-pos-${id}`;
    }

    /** Determine anchor corner from HUD placement class. */
    function getAnchorCorner(hud) {
        const cl = hud.classList;
        if (cl.contains('cgx-hud-top-right'))    return 'tr';
        if (cl.contains('cgx-hud-bottom-left'))  return 'bl';
        if (cl.contains('cgx-hud-bottom-right')) return 'br';
        if (cl.contains('cgx-hud-top'))          return 'tc';
        if (cl.contains('cgx-hud-bottom'))       return 'bc';
        if (cl.contains('cgx-hud-left'))         return 'ml';
        if (cl.contains('cgx-hud-right'))        return 'mr';
        return 'tl';
    }

    /** Compute minimized icon position from expanded rect and anchor corner. */
    function getMinimizedPos(expRect, iconW, iconH, anchor) {
        switch (anchor) {
            case 'tr': return { left: expRect.right - iconW, top: expRect.top };
            case 'bl': return { left: expRect.left, top: expRect.bottom - iconH };
            case 'br': return { left: expRect.right - iconW, top: expRect.bottom - iconH };
            case 'tc': return { left: expRect.left + expRect.width / 2 - iconW / 2, top: expRect.top };
            case 'bc': return { left: expRect.left + expRect.width / 2 - iconW / 2, top: expRect.bottom - iconH };
            case 'ml': return { left: expRect.left, top: expRect.top + expRect.height / 2 - iconH / 2 };
            case 'mr': return { left: expRect.right - iconW, top: expRect.top + expRect.height / 2 - iconH / 2 };
            default:   return { left: expRect.left, top: expRect.top };
        }
    }

    // ── Toggle Animation ────────────────────────────────────────────

    const huds = document.querySelectorAll('details.cgx-hud, details.cgx-panel');

    huds.forEach(hud => {
        const summary = hud.querySelector('summary');
        const content = hud.querySelector('div');
        if (!summary || !content) return;

        const isDraggable = hud.classList.contains('cgx-hud')
            && hud.hasAttribute('data-draggable') && hud.id;
        const key = isDraggable ? cacheKeyFor(hud.id) : null;

        summary.addEventListener('click', (e) => {
            e.preventDefault();
            if (e.target.closest('button, .cgx-hud-restore')) return;
            if (hud.hasAttribute('data-is-dragging')) return;

            if (hud.hasAttribute('open')) {
                handleClose(hud, summary, content, isDraggable, key);
            } else {
                handleOpen(hud, summary, content, isDraggable, key);
            }
        });

        // Setup draggable behaviour
        if (isDraggable) {
            setupDraggableHud(hud, summary, key);
        }
    });

    // ── Close Handler ───────────────────────────────────────────────

    function handleClose(hud, summary, content, isDraggable, key) {
        const hasCachedPos = isDraggable && !!localStorage.getItem(key);
        let expandedRect = null;

        if (isDraggable && hasCachedPos) {
            expandedRect = hud.getBoundingClientRect();
        } else if (isDraggable) {
            clearPosition(hud);
        }

        if (isDraggable) {
            const btn = summary.querySelector('.cgx-hud-restore');
            if (btn) btn.style.display = 'none';
        }

        hud.classList.add('cgx-is-closing');

        setTimeout(() => {
            hud.classList.remove('cgx-is-closing');
            hud.removeAttribute('open');

            if (expandedRect) {
                hud.style.transition = 'none';
                const iconRect = hud.getBoundingClientRect();
                const anchor = getAnchorCorner(hud);
                const pos = getMinimizedPos(expandedRect, iconRect.width, iconRect.height, anchor);
                applyPosition(hud, pos.left, pos.top);
                void hud.offsetWidth;
                hud.style.transition = '';

                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    data.minLeft = pos.left;
                    data.minTop = pos.top;
                    localStorage.setItem(key, JSON.stringify(data));
                } catch (_) {}
            }
        }, 400);
    }

    // ── Open Handler ────────────────────────────────────────────────

    function handleOpen(hud, summary, content, isDraggable, key) {
        hud.setAttribute('open', '');

        if (isDraggable) {
            const cached = localStorage.getItem(key);
            if (cached) {
                try {
                    const pos = JSON.parse(cached);
                    applyPosition(hud, pos.left, pos.top);
                    const btn = summary.querySelector('.cgx-hud-restore');
                    if (btn) btn.style.display = '';
                } catch (_) {}
            } else {
                clearPosition(hud);
            }
        }

        // Set initial state for CSS transition
        content.style.maxHeight = '0';
        content.style.opacity = '0';
        content.style.padding = '0 16px';

        void content.offsetWidth; // force reflow

        content.style.maxHeight = '';
        content.style.opacity = '';
        content.style.padding = '';
    }

    // ── Draggable HUD Setup ─────────────────────────────────────────

    function setupDraggableHud(hud, summary, key) {
        let isDragging = false;
        let hasDragged = false;
        let startX, startY, initialLeft, initialTop;

        // Inject restore button
        const restoreBtn = document.createElement('span');
        restoreBtn.className = 'cgx-hud-restore';
        restoreBtn.title = 'Restore Default Position';
        restoreBtn.innerHTML = '⌂';
        restoreBtn.style.display = 'none';

        restoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            localStorage.removeItem(key);
            clearPosition(hud);
            restoreBtn.style.display = 'none';
        });

        summary.appendChild(restoreBtn);

        // Restore cached position on load
        const cached = localStorage.getItem(key);
        if (cached) {
            try {
                const pos = JSON.parse(cached);
                if (hud.hasAttribute('open')) {
                    applyPosition(hud, pos.left, pos.top);
                    restoreBtn.style.display = '';
                } else if (pos.minLeft != null) {
                    hud.style.transition = 'none';
                    applyPosition(hud, pos.minLeft, pos.minTop);
                    void hud.offsetWidth;
                    hud.style.transition = '';
                }
            } catch (_) {}
        }

        // Pointer events for dragging
        summary.style.touchAction = 'none';

        const handlePointerMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (!hasDragged && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
                hasDragged = true;
                hud.style.right = 'auto';
                hud.style.bottom = 'auto';
                hud.style.transform = 'none';
            }
            if (!hasDragged) return;

            const rect = hud.getBoundingClientRect();
            const newLeft = Math.max(0, Math.min(initialLeft + dx, window.innerWidth - rect.width));
            const newTop  = Math.max(0, Math.min(initialTop + dy, window.innerHeight - rect.height));

            hud.style.left = newLeft + 'px';
            hud.style.top  = newTop + 'px';
        };

        const handlePointerUp = () => {
            if (!isDragging) return;
            isDragging = false;
            hud.classList.remove('cgx-hud-dragging');
            document.body.style.cursor = '';

            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);

            if (hasDragged) {
                const rect = hud.getBoundingClientRect();
                const dx = rect.left - initialLeft;
                const dy = rect.top - initialTop;

                if (hud.hasAttribute('open')) {
                    localStorage.setItem(key, JSON.stringify({
                        left: rect.left, top: rect.top
                    }));
                    restoreBtn.style.display = '';
                } else {
                    const existing = localStorage.getItem(key);
                    if (existing) {
                        try {
                            const pos = JSON.parse(existing);
                            pos.left += dx;
                            pos.top += dy;
                            pos.minLeft = rect.left;
                            pos.minTop = rect.top;
                            localStorage.setItem(key, JSON.stringify(pos));
                        } catch (_) {}
                    } else {
                        localStorage.setItem(key, JSON.stringify({
                            left: rect.left, top: rect.top,
                            minLeft: rect.left, minTop: rect.top
                        }));
                    }
                }

                hud.setAttribute('data-is-dragging', 'true');
                setTimeout(() => hud.removeAttribute('data-is-dragging'), 100);
                hasDragged = false;
            }
        };

        summary.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            if (e.target.closest('button, .cgx-hud-restore')) return;

            isDragging = true;
            hasDragged = false;
            startX = e.clientX;
            startY = e.clientY;

            const rect = hud.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            hud.classList.add('cgx-hud-dragging');
            document.body.style.cursor = 'grabbing';

            window.addEventListener('pointermove', handlePointerMove, { passive: false });
            window.addEventListener('pointerup', handlePointerUp);
            window.addEventListener('pointercancel', handlePointerUp);
        });
    }
});
