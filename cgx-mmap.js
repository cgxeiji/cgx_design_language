/**
 * CGx Mindmap — Interactive Flowchart Component
 * Requires: cgx-mmap-yaml.js (loaded before this script)
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.cgx-mmap').forEach(container => cgxInitMmap(container));
});

function cgxInitMmap(container) {
    const style = getComputedStyle(container);
    const GRID = parseInt(style.getPropertyValue('--cgx-mmap-grid')) || 20;
    const DEF_W = parseInt(style.getPropertyValue('--cgx-mmap-default-w')) || 160;
    const DEF_H = parseInt(style.getPropertyValue('--cgx-mmap-default-h')) || 80;

    const rootStyle = getComputedStyle(document.documentElement);

    // ── DOM setup ──
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const toolbar = document.createElement('div');
    toolbar.className = 'cgx-mmap-toolbar';
    toolbar.innerHTML =
        '<input class="cgx-mmap-title" value="Untitled" spellcheck="false">' +
        '<button class="cgx-button cgx-button-ghost" data-action="upload" style="padding:4px 8px;font-size:0.8em">↑ Upload</button>' +
        '<button class="cgx-button cgx-button-ghost" data-action="download" style="padding:4px 8px;font-size:0.8em">↓ Download</button>';
    container.appendChild(toolbar);

    const titleInput = toolbar.querySelector('.cgx-mmap-title');

    const ctxMenu = document.createElement('div');
    ctxMenu.className = 'cgx-mmap-ctx';
    container.appendChild(ctxMenu);

    const editBox = document.createElement('textarea');
    editBox.className = 'cgx-mmap-edit';
    editBox.spellcheck = false;
    container.appendChild(editBox);

    // ── State ──
    const state = {
        name: 'Untitled',
        entries: [],
        cam: { x: 0, y: 0, zoom: 1 },
        interaction: 'idle',  // idle | dragging | resizing | panning | editing | context
        active: null,         // entry being interacted with
        resizeEdge: null,     // 'left'|'right'|'top'|'bottom'
        dragStart: { mx: 0, my: 0, ex: 0, ey: 0, ew: 0, eh: 0 },
        panStart: { mx: 0, my: 0, cx: 0, cy: 0 },
        hoveredParent: null,  // uid highlighted during parent selection
    };

    // ── Helpers ──
    function snap(v) { return Math.round(v / GRID) * GRID; }
    function genUID() { return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
    function findEntry(uid) { return state.entries.find(e => e.uid === uid); }

    // Convert screen (mouse) coords to world coords
    function screenToWorld(sx, sy) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (sx - rect.left - state.cam.x) / state.cam.zoom,
            y: (sy - rect.top - state.cam.y) / state.cam.zoom,
        };
    }

    // Convert world coords to screen (canvas pixel) coords
    function worldToScreen(wx, wy) {
        return {
            x: wx * state.cam.zoom + state.cam.x,
            y: wy * state.cam.zoom + state.cam.y,
        };
    }

    // ── Rendering ──
    function render() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        const W = rect.width;
        const H = rect.height;

        ctx.clearRect(0, 0, W, H);

        // Grid
        drawGrid(W, H);

        // Arrows (parent → child)
        drawArrows();

        // Boxes
        state.entries.forEach(e => drawBox(e));
    }

    function drawGrid(W, H) {
        const g = GRID * state.cam.zoom;
        if (g < 4) return; // too small to draw

        const offX = state.cam.x % g;
        const offY = state.cam.y % g;

        ctx.strokeStyle = rootStyle.getPropertyValue('--cgx-color-white-trans-05').trim();
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = offX; x < W; x += g) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
        }
        for (let y = offY; y < H; y += g) {
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
        }
        ctx.stroke();
    }

    function drawBox(entry) {
        const s = worldToScreen(entry.x, entry.y);
        const w = entry.w * state.cam.zoom;
        const h = entry.h * state.cam.zoom;
        const r = 6 * state.cam.zoom;

        const isActive = state.active === entry;
        const isHoveredParent = state.hoveredParent === entry.uid;

        // Fill
        ctx.fillStyle = isHoveredParent
            ? rootStyle.getPropertyValue('--cgx-color-white-trans-10').trim()
            : rootStyle.getPropertyValue('--cgx-element-bg').trim();
        roundRect(ctx, s.x, s.y, w, h, r);
        ctx.fill();

        // Border
        ctx.strokeStyle = isActive
            ? rootStyle.getPropertyValue('--cgx-primary').trim()
            : isHoveredParent
                ? rootStyle.getPropertyValue('--cgx-primary').trim()
                : rootStyle.getPropertyValue('--cgx-color-white-trans-30').trim();
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.stroke();

        // Text
        const fontSize = Math.max(10, 12 * state.cam.zoom);
        ctx.font = `${fontSize}px ${rootStyle.getPropertyValue('--cgx-font-mono').trim()}`;
        ctx.fillStyle = rootStyle.getPropertyValue('--cgx-fg').trim();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Simple word-wrap
        const maxTextW = w - 12 * state.cam.zoom;
        const words = entry.text.split(' ');
        const lines = [];
        let currentLine = '';
        words.forEach(word => {
            const test = currentLine ? currentLine + ' ' + word : word;
            if (ctx.measureText(test).width > maxTextW && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = test;
            }
        });
        if (currentLine) lines.push(currentLine);

        const lineH = fontSize * 1.3;
        const totalH = lines.length * lineH;
        const startY = s.y + h / 2 - totalH / 2 + lineH / 2;
        lines.forEach((line, i) => {
            ctx.fillText(line, s.x + w / 2, startY + i * lineH, maxTextW);
        });

        // Resize handles (only on active entry)
        if (isActive && state.interaction !== 'dragging') {
            drawResizeHandles(s.x, s.y, w, h);
        }
    }

    function drawResizeHandles(sx, sy, w, h) {
        const hs = 6;
        ctx.fillStyle = rootStyle.getPropertyValue('--cgx-primary').trim();

        // left, right, top, bottom midpoints
        const handles = [
            { x: sx - hs / 2, y: sy + h / 2 - hs / 2 },
            { x: sx + w - hs / 2, y: sy + h / 2 - hs / 2 },
            { x: sx + w / 2 - hs / 2, y: sy - hs / 2 },
            { x: sx + w / 2 - hs / 2, y: sy + h - hs / 2 },
        ];
        handles.forEach(p => ctx.fillRect(p.x, p.y, hs, hs));
    }

    function drawArrows() {
        ctx.strokeStyle = rootStyle.getPropertyValue('--cgx-color-white-trans-30').trim();
        ctx.lineWidth = 1.5 * state.cam.zoom;

        state.entries.forEach(child => {
            if (!child.parent) return;
            const parent = findEntry(child.parent);
            if (!parent) return;

            const pts = closestSidePoints(parent, child);
            const from = worldToScreen(pts.fx, pts.fy);
            const to = worldToScreen(pts.tx, pts.ty);

            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();

            // Arrowhead
            drawArrowhead(to.x, to.y, Math.atan2(to.y - from.y, to.x - from.x));
        });
    }

    function drawArrowhead(x, y, angle) {
        const sz = 8 * state.cam.zoom;
        ctx.fillStyle = rootStyle.getPropertyValue('--cgx-color-white-trans-30').trim();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - sz * Math.cos(angle - 0.4), y - sz * Math.sin(angle - 0.4));
        ctx.lineTo(x - sz * Math.cos(angle + 0.4), y - sz * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
    }

    function closestSidePoints(a, b) {
        // Centers
        const acx = a.x + a.w / 2, acy = a.y + a.h / 2;
        const bcx = b.x + b.w / 2, bcy = b.y + b.h / 2;

        function midSide(box, targetX, targetY) {
            const cx = box.x + box.w / 2;
            const cy = box.y + box.h / 2;
            const dx = targetX - cx;
            const dy = targetY - cy;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (absDx / box.w > absDy / box.h) {
                // Horizontal side
                return dx > 0
                    ? { x: box.x + box.w, y: cy }
                    : { x: box.x, y: cy };
            } else {
                return dy > 0
                    ? { x: cx, y: box.y + box.h }
                    : { x: cx, y: box.y };
            }
        }

        const fromPt = midSide(a, bcx, bcy);
        const toPt = midSide(b, acx, acy);
        return { fx: fromPt.x, fy: fromPt.y, tx: toPt.x, ty: toPt.y };
    }

    function roundRect(c, x, y, w, h, r) {
        c.beginPath();
        c.moveTo(x + r, y);
        c.lineTo(x + w - r, y);
        c.quadraticCurveTo(x + w, y, x + w, y + r);
        c.lineTo(x + w, y + h - r);
        c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        c.lineTo(x + r, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - r);
        c.lineTo(x, y + r);
        c.quadraticCurveTo(x, y, x + r, y);
        c.closePath();
    }

    // ── Hit Testing ──
    const HANDLE_PX = 8;

    function hitTest(sx, sy) {
        const w = screenToWorld(sx, sy);
        // Check entries in reverse (top-most first)
        for (let i = state.entries.length - 1; i >= 0; i--) {
            const e = state.entries[i];
            // Resize handles (only on active)
            if (state.active === e) {
                const hs = HANDLE_PX / state.cam.zoom / 2;
                const midX = e.x + e.w / 2, midY = e.y + e.h / 2;
                if (Math.abs(w.x - e.x) < hs && Math.abs(w.y - midY) < hs) return { type: 'resize', entry: e, edge: 'left' };
                if (Math.abs(w.x - (e.x + e.w)) < hs && Math.abs(w.y - midY) < hs) return { type: 'resize', entry: e, edge: 'right' };
                if (Math.abs(w.y - e.y) < hs && Math.abs(w.x - midX) < hs) return { type: 'resize', entry: e, edge: 'top' };
                if (Math.abs(w.y - (e.y + e.h)) < hs && Math.abs(w.x - midX) < hs) return { type: 'resize', entry: e, edge: 'bottom' };
            }
            // Box body
            if (w.x >= e.x && w.x <= e.x + e.w && w.y >= e.y && w.y <= e.y + e.h) {
                return { type: 'node', entry: e };
            }
        }
        return { type: 'empty' };
    }

    // ── Pointer Events ──
    canvas.addEventListener('pointerdown', e => {
        if (e.button === 2) return; // right-click handled by contextmenu
        closeContextMenu();
        closeEditor();

        const hit = hitTest(e.clientX, e.clientY);

        if (hit.type === 'node') {
            state.active = hit.entry;
            state.interaction = 'dragging';
            state.dragStart = { mx: e.clientX, my: e.clientY, ex: hit.entry.x, ey: hit.entry.y };
            canvas.setPointerCapture(e.pointerId);
        } else if (hit.type === 'resize') {
            state.active = hit.entry;
            state.interaction = 'resizing';
            state.resizeEdge = hit.edge;
            state.dragStart = { mx: e.clientX, my: e.clientY, ex: hit.entry.x, ey: hit.entry.y, ew: hit.entry.w, eh: hit.entry.h };
            canvas.setPointerCapture(e.pointerId);
        } else {
            state.active = null;
            state.interaction = 'panning';
            state.panStart = { mx: e.clientX, my: e.clientY, cx: state.cam.x, cy: state.cam.y };
            canvas.setPointerCapture(e.pointerId);
        }
        render();
    });

    canvas.addEventListener('pointermove', e => {
        if (state.interaction === 'dragging' && state.active) {
            const dx = (e.clientX - state.dragStart.mx) / state.cam.zoom;
            const dy = (e.clientY - state.dragStart.my) / state.cam.zoom;
            state.active.x = snap(state.dragStart.ex + dx);
            state.active.y = snap(state.dragStart.ey + dy);
            render();
        } else if (state.interaction === 'resizing' && state.active) {
            const dx = (e.clientX - state.dragStart.mx) / state.cam.zoom;
            const dy = (e.clientY - state.dragStart.my) / state.cam.zoom;
            const minW = GRID * 2;
            const minH = GRID * 2;
            if (state.resizeEdge === 'right') {
                state.active.w = snap(Math.max(minW, state.dragStart.ew + dx));
            } else if (state.resizeEdge === 'left') {
                const newX = snap(state.dragStart.ex + dx);
                const newW = state.dragStart.ew + (state.dragStart.ex - newX);
                if (newW >= minW) { state.active.x = newX; state.active.w = newW; }
            } else if (state.resizeEdge === 'bottom') {
                state.active.h = snap(Math.max(minH, state.dragStart.eh + dy));
            } else if (state.resizeEdge === 'top') {
                const newY = snap(state.dragStart.ey + dy);
                const newH = state.dragStart.eh + (state.dragStart.ey - newY);
                if (newH >= minH) { state.active.y = newY; state.active.h = newH; }
            }
            render();
        } else if (state.interaction === 'panning') {
            state.cam.x = state.panStart.cx + (e.clientX - state.panStart.mx);
            state.cam.y = state.panStart.cy + (e.clientY - state.panStart.my);
            render();
        } else {
            // Update cursor
            const hit = hitTest(e.clientX, e.clientY);
            if (hit.type === 'resize') {
                canvas.style.cursor = (hit.edge === 'left' || hit.edge === 'right') ? 'ew-resize' : 'ns-resize';
            } else if (hit.type === 'node') {
                canvas.style.cursor = 'grab';
            } else {
                canvas.style.cursor = 'default';
            }
        }
    });

    canvas.addEventListener('pointerup', e => {
        if (state.interaction === 'dragging' || state.interaction === 'resizing' || state.interaction === 'panning') {
            state.interaction = 'idle';
            canvas.releasePointerCapture(e.pointerId);
        }
    });

    // ── Zoom ──
    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const oldZoom = state.cam.zoom;
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        state.cam.zoom = Math.max(0.1, Math.min(5, oldZoom * factor));

        // Zoom towards cursor
        state.cam.x = mx - (mx - state.cam.x) * (state.cam.zoom / oldZoom);
        state.cam.y = my - (my - state.cam.y) * (state.cam.zoom / oldZoom);

        render();
    }, { passive: false });

    // ── Double Click ──
    canvas.addEventListener('dblclick', e => {
        const hit = hitTest(e.clientX, e.clientY);
        if (hit.type === 'node') {
            openEditor(hit.entry);
        } else {
            // Reset camera to fit all entries
            fitCamera();
        }
    });

    function fitCamera() {
        if (!state.entries.length) {
            state.cam = { x: 0, y: 0, zoom: 1 };
            render();
            return;
        }
        const rect = canvas.getBoundingClientRect();
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        state.entries.forEach(e => {
            minX = Math.min(minX, e.x);
            minY = Math.min(minY, e.y);
            maxX = Math.max(maxX, e.x + e.w);
            maxY = Math.max(maxY, e.y + e.h);
        });
        const worldW = maxX - minX || 200;
        const worldH = maxY - minY || 200;
        const pad = 60;
        const zoom = Math.min((rect.width - pad * 2) / worldW, (rect.height - pad * 2) / worldH, 2);
        state.cam.zoom = zoom;
        state.cam.x = (rect.width - worldW * zoom) / 2 - minX * zoom;
        state.cam.y = (rect.height - worldH * zoom) / 2 - minY * zoom;
        render();
    }

    // ── Inline Text Editor ──
    function openEditor(entry) {
        state.interaction = 'editing';
        state.active = entry;
        const s = worldToScreen(entry.x, entry.y);
        const w = entry.w * state.cam.zoom;
        const h = entry.h * state.cam.zoom;
        editBox.style.left = s.x + 'px';
        editBox.style.top = s.y + 'px';
        editBox.style.width = w + 'px';
        editBox.style.height = h + 'px';
        editBox.style.fontSize = Math.max(10, 12 * state.cam.zoom) + 'px';
        editBox.value = entry.text;
        editBox.classList.add('cgx-mmap-edit-visible');
        editBox.focus();
        editBox.select();
    }

    function closeEditor() {
        if (state.interaction === 'editing' && state.active) {
            state.active.text = editBox.value;
            state.interaction = 'idle';
            render();
        }
        editBox.classList.remove('cgx-mmap-edit-visible');
    }

    editBox.addEventListener('blur', () => closeEditor());
    editBox.addEventListener('keydown', e => {
        if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
            e.preventDefault();
            editBox.blur();
        }
    });

    // ── Context Menu ──
    function closeContextMenu() {
        ctxMenu.classList.remove('cgx-mmap-ctx-visible');
        ctxMenu.innerHTML = '';
        state.hoveredParent = null;
    }

    canvas.addEventListener('contextmenu', e => {
        e.preventDefault();
        closeEditor();

        const hit = hitTest(e.clientX, e.clientY);
        const rect = container.getBoundingClientRect();
        let menuX = e.clientX - rect.left;
        let menuY = e.clientY - rect.top;
        ctxMenu.innerHTML = '';

        if (hit.type === 'node') {
            state.active = hit.entry;
            render();

            // Remove entry
            const removeItem = document.createElement('div');
            removeItem.className = 'cgx-mmap-ctx-item cgx-mmap-ctx-danger';
            removeItem.textContent = '✕ Remove';
            removeItem.addEventListener('click', () => {
                // Also unparent any children
                state.entries.forEach(c => { if (c.parent === hit.entry.uid) c.parent = ''; });
                state.entries = state.entries.filter(x => x !== hit.entry);
                state.active = null;
                closeContextMenu();
                render();
            });
            ctxMenu.appendChild(removeItem);

            // Separator
            const sep = document.createElement('div');
            sep.className = 'cgx-mmap-ctx-separator';
            ctxMenu.appendChild(sep);

            // Set parent header
            const header = document.createElement('div');
            header.className = 'cgx-mmap-ctx-item';
            header.style.fontWeight = 'bold';
            header.style.cursor = 'default';
            header.textContent = 'Set Parent:';
            ctxMenu.appendChild(header);

            // No parent option
            const noParent = document.createElement('div');
            noParent.className = 'cgx-mmap-ctx-item' + (!hit.entry.parent ? ' cgx-mmap-ctx-active' : '');
            noParent.textContent = '(none — root)';
            noParent.addEventListener('click', () => {
                hit.entry.parent = '';
                closeContextMenu();
                render();
            });
            ctxMenu.appendChild(noParent);

            // Parent list
            const sub = document.createElement('div');
            sub.className = 'cgx-mmap-ctx-sub';
            state.entries.forEach(candidate => {
                if (candidate === hit.entry) return;
                const item = document.createElement('div');
                item.className = 'cgx-mmap-ctx-item' + (hit.entry.parent === candidate.uid ? ' cgx-mmap-ctx-active' : '');
                item.textContent = candidate.text || candidate.uid;
                item.addEventListener('mouseenter', () => {
                    state.hoveredParent = candidate.uid;
                    render();
                });
                item.addEventListener('mouseleave', () => {
                    state.hoveredParent = null;
                    render();
                });
                item.addEventListener('click', () => {
                    hit.entry.parent = candidate.uid;
                    closeContextMenu();
                    render();
                });
                sub.appendChild(item);
            });
            ctxMenu.appendChild(sub);

        } else {
            // Empty space menu
            const world = screenToWorld(e.clientX, e.clientY);

            const addItem = document.createElement('div');
            addItem.className = 'cgx-mmap-ctx-item';
            addItem.textContent = '+ Add Entry';
            addItem.addEventListener('click', () => {
                state.entries.push({
                    uid: genUID(),
                    text: 'New Entry',
                    x: snap(world.x),
                    y: snap(world.y),
                    w: DEF_W,
                    h: DEF_H,
                    parent: '',
                });
                closeContextMenu();
                render();
            });
            ctxMenu.appendChild(addItem);

            const sep2 = document.createElement('div');
            sep2.className = 'cgx-mmap-ctx-separator';
            ctxMenu.appendChild(sep2);

            const dlItem = document.createElement('div');
            dlItem.className = 'cgx-mmap-ctx-item';
            dlItem.textContent = '↓ Download YAML';
            dlItem.addEventListener('click', () => {
                downloadYAML();
                closeContextMenu();
            });
            ctxMenu.appendChild(dlItem);
        }

        ctxMenu.classList.add('cgx-mmap-ctx-visible');

        // Clamp menu position to stay within the container
        const menuW = ctxMenu.offsetWidth;
        const menuH = ctxMenu.offsetHeight;
        const containerW = rect.width;
        const containerH = rect.height;
        const pad = 4;

        if (menuX + menuW > containerW - pad) menuX = containerW - menuW - pad;
        if (menuY + menuH > containerH - pad) menuY = containerH - menuH - pad;
        if (menuX < pad) menuX = pad;
        if (menuY < pad) menuY = pad;

        ctxMenu.style.left = menuX + 'px';
        ctxMenu.style.top = menuY + 'px';

        state.interaction = 'context';
    });

    // Close context menu on any click outside
    document.addEventListener('pointerdown', e => {
        if (!ctxMenu.contains(e.target)) {
            closeContextMenu();
            if (state.interaction === 'context') state.interaction = 'idle';
        }
    });

    // ── Toolbar ──
    titleInput.addEventListener('input', () => { state.name = titleInput.value; });

    toolbar.querySelector('[data-action="download"]').addEventListener('click', () => downloadYAML());
    toolbar.querySelector('[data-action="upload"]').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.yaml,.yml';
        input.addEventListener('change', () => {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                loadYAML(reader.result);
            };
            reader.readAsText(file);
        });
        input.click();
    });

    function downloadYAML() {
        state.name = titleInput.value || 'Untitled';
        const yamlStr = mmapToYAML(state);
        const blob = new Blob([yamlStr], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (state.name.replace(/\s+/g, '_') || 'mindmap') + '.yaml';
        a.click();
        URL.revokeObjectURL(url);
    }

    function loadYAML(yamlStr) {
        const data = mmapFromYAML(yamlStr);
        state.name = data.name || 'Untitled';
        state.entries = data.entries;
        titleInput.value = state.name;
        state.active = null;
        state.interaction = 'idle';
        fitCamera();
    }

    // ── Load initial data from attribute if present ──
    if (container.dataset.initial) {
        try {
            loadYAML(container.dataset.initial);
        } catch (_) { /* ignore bad data */ }
    }

    // ── Initial render ──
    render();
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(() => render()).observe(container);
    }
}
