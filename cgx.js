/**
 * CGx Design Language - Interactive Components
 * Provides progressive enhancement for native HTML elements.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Smooth `<details>` Animation Handler for HUDs
    // Intercepts the click on the summary to allow CSS closing animations to play
    // before the `open` attribute is removed by the browser.

    const huds = document.querySelectorAll('details.cgx-hud, details.cgx-panel');

    huds.forEach(hud => {
        const summary = hud.querySelector('summary');
        const content = hud.querySelector('div');

        if (!summary || !content) return;

        summary.addEventListener('click', (e) => {
            // Prevent native instant toggle
            e.preventDefault();

            if (hud.hasAttribute('open')) {
                // Closing
                hud.classList.add('cgx-is-closing');
                setTimeout(() => {
                    hud.classList.remove('cgx-is-closing');
                    hud.removeAttribute('open');
                }, 400); // 400ms matches the transition duration in cgx.css
            } else {
                // Opening - force a browser reflow to guarantee CSS transition on first click
                hud.setAttribute('open', '');

                // Set initial state for transition
                content.style.maxHeight = '0';
                content.style.opacity = '0';
                content.style.padding = '0 16px';

                // Force layout recalculation
                void content.offsetWidth;

                // Remove inline styles to let CSS classes take over the transition to open
                content.style.maxHeight = '';
                content.style.opacity = '';
                content.style.padding = '';
            }
        });
    });

    // 2. Draggable Number Inputs Logic
    const dragInputs = document.querySelectorAll('.cgx-drag-input');

    dragInputs.forEach(container => {
        const input = container.querySelector('.cgx-drag-field');
        if (!input) return;

        let isDragging = false;
        let startX = 0;
        let startVal = 0;
        
        // Grab step from HTML, default to 1 if not provided
        let step = parseFloat(input.getAttribute('step')) || 1;
        
        // Ensure sensible float fixing based on the step increment
        const decimals = (step.toString().split('.')[1] || '').length;

        container.addEventListener('mousedown', (e) => {
            // Do not initiate drag if user is explicitly inside the text field trying to type
            if (document.activeElement === input) return;

            isDragging = true;
            startX = e.clientX;
            startVal = parseFloat(input.value) || 0;
            
            // Prevent text highlighting while dragging
            e.preventDefault(); 
            
            // Force cursor on body so it doesn't flicker when leaving the box
            document.body.style.cursor = 'ew-resize';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            // Configurable sensitivity (pixels of mouse drag required per 1 numerical step)
            const sensitivity = 2; 
            
            const stepsToMove = Math.floor(deltaX / sensitivity);
            let newVal = startVal + (stepsToMove * step);
            
            // Boundary clamping based on min/max html attributes
            const min = input.hasAttribute('min') ? parseFloat(input.getAttribute('min')) : -Infinity;
            const max = input.hasAttribute('max') ? parseFloat(input.getAttribute('max')) : Infinity;
            newVal = Math.max(min, Math.min(max, newVal));
            
            input.value = newVal.toFixed(decimals);
            
            // Dispatch native input event so other scripts (like preview.js) can react
            input.dispatchEvent(new Event('input'));
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.cursor = '';
            }
        });

        // Fallback: If they just click, pop them into precise text-entry mode
        container.addEventListener('click', () => {
            if (document.activeElement !== input) {
                input.focus();
            }
        });
        
        // Auto-resize logic so the input grows if values get extremely large
        const updateWidth = () => {
            // Set width based on character count, ensuring a minimum of 5ch
            input.style.width = Math.max(5, input.value.length) + 'ch';
        };

        // Listen for internal drag events and manual user typing
        input.addEventListener('input', updateWidth);
        input.addEventListener('change', updateWidth); // Catch external programmed changes

        // Run once on load to set initial state
        updateWidth();
    });

    // 3. Toggle Buttons (.cgx-button-toggle)
    // Toggles the [data-active] attribute and swaps the button label text
    // between [data-label-active] and [data-label-inactive] on click.
    document.querySelectorAll('.cgx-button-toggle').forEach(btn => {
        const labelActive   = btn.dataset.labelActive   || 'Stop';
        const labelInactive = btn.dataset.labelInactive || 'Start';
        const iconActive    = btn.dataset.iconActive    || '';
        const iconInactive  = btn.dataset.iconInactive  || '';

        const fullActive   = iconActive   ? `${iconActive} ${labelActive}`   : labelActive;
        const fullInactive = iconInactive ? `${iconInactive} ${labelInactive}` : labelInactive;

        const isInitiallyActive = btn.dataset.active === 'true';

        // Measure both label widths to lock min-width and prevent layout shift
        btn.style.minWidth = '';
        btn.textContent = fullActive;
        const wActive = btn.offsetWidth;
        btn.textContent = fullInactive;
        const wInactive = btn.offsetWidth;
        btn.style.minWidth = Math.max(wActive, wInactive) + 'px';

        // Restore initial state
        btn.textContent = isInitiallyActive ? fullActive : fullInactive;

        btn.addEventListener('click', () => {
            const isActive = btn.dataset.active === 'true';
            btn.dataset.active = (!isActive).toString();
            btn.textContent = !isActive ? fullActive : fullInactive;
        });
    });

    // 4. Line Chart Plot (.cgx-plot)
    // Draws one or more data series onto a <canvas class="cgx-plot"> element.
    // Data is supplied via data-series (JSON array of arrays).
    // Colors cycle through the CGx palette automatically.
    const CGX_PLOT_PALETTE = [
        '--cgx-primary',
        '--cgx-color-green',
        '--cgx-color-blue',
        '--cgx-color-cyan',
        '--cgx-color-magenta',
        '--cgx-color-yellow',
        '--cgx-color-red',
        '--cgx-color-green-bright',
        '--cgx-color-blue-bright',
        '--cgx-color-cyan-bright',
    ];

    function cgxDrawPlot(canvas) {
        const ctx = canvas.getContext('2d');
        const style = getComputedStyle(document.documentElement);
        const dpr = window.devicePixelRatio || 1;

        // Match internal canvas resolution to CSS size
        const rect = canvas.getBoundingClientRect();
        canvas.width  = rect.width  * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const W = rect.width;
        const H = rect.height;

        // Parse options
        let seriesData = [];
        try { seriesData = JSON.parse(canvas.dataset.series || '[]'); } catch (_) {}
        if (!Array.isArray(seriesData[0])) seriesData = [seriesData];
        if (!seriesData.length || !seriesData[0].length) return;

        let labels = [];
        try { labels = JSON.parse(canvas.dataset.labels || '[]'); } catch (_) {}

        const xlabel = canvas.dataset.xlabel || '';
        const ylabel = canvas.dataset.ylabel || '';
        const monoFont = style.getPropertyValue('--cgx-font-mono').trim();
        const labelColor = style.getPropertyValue('--cgx-color-white-trans-50').trim();

        // Dynamic padding based on active features
        const LEGEND_H  = labels.length ? 22 : 0;
        const XLABEL_H  = xlabel ? 16 : 0;
        const YLABEL_W  = ylabel ? 14 : 0;

        const PAD = {
            top:    12,
            right:  12,
            bottom: 24 + XLABEL_H + LEGEND_H,
            left:   36 + YLABEL_W,
        };
        const innerW = W - PAD.left - PAD.right;
        const innerH = H - PAD.top  - PAD.bottom;

        // Clear
        ctx.clearRect(0, 0, W, H);

        // Global min/max
        const allVals = seriesData.flat();
        const dataMin = Math.min(...allVals);
        const dataMax = Math.max(...allVals);
        const dataRange = dataMax - dataMin || 1;

        const gridColor = style.getPropertyValue('--cgx-color-white-trans-10').trim();

        // Y-axis grid lines + labels
        ctx.font = `10px ${monoFont}`;
        ctx.fillStyle = labelColor;
        ctx.textAlign = 'right';
        const gridLines = 4;
        for (let i = 0; i <= gridLines; i++) {
            const t = i / gridLines;
            const y = PAD.top + innerH * (1 - t);
            const val = dataMin + dataRange * t;

            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(PAD.left, y);
            ctx.lineTo(PAD.left + innerW, y);
            ctx.stroke();

            ctx.fillStyle = labelColor;
            ctx.fillText(val.toFixed(1), PAD.left - 4, y + 3.5);
        }

        // X-axis tick labels
        ctx.textAlign = 'center';
        ctx.fillStyle = labelColor;
        const maxLen = Math.max(...seriesData.map(s => s.length));
        const step = Math.ceil(maxLen / 6);
        for (let i = 0; i < maxLen; i += step) {
            const x = PAD.left + (i / (maxLen - 1)) * innerW;
            ctx.fillText(i, x, PAD.top + innerH + 14);
        }

        // X-axis title
        if (xlabel) {
            ctx.fillStyle = labelColor;
            ctx.textAlign = 'center';
            ctx.font = `10px ${monoFont}`;
            ctx.fillText(xlabel, PAD.left + innerW / 2, PAD.top + innerH + 14 + XLABEL_H);
        }

        // Y-axis title (rotated)
        if (ylabel) {
            ctx.save();
            ctx.translate(10, PAD.top + innerH / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = labelColor;
            ctx.textAlign = 'center';
            ctx.font = `10px ${monoFont}`;
            ctx.fillText(ylabel, 0, 0);
            ctx.restore();
        }

        // Draw each series (linear)
        seriesData.forEach((series, si) => {
            const cssVar = CGX_PLOT_PALETTE[si % CGX_PLOT_PALETTE.length];
            const color = style.getPropertyValue(cssVar).trim();
            const n = series.length;

            const points = series.map((v, i) => ({
                x: PAD.left + (n > 1 ? i / (n - 1) : 0.5) * innerW,
                y: PAD.top  + innerH * (1 - (v - dataMin) / dataRange),
            }));

            // Filled area (linear)
            ctx.beginPath();
            ctx.moveTo(points[0].x, PAD.top + innerH);
            ctx.lineTo(points[0].x, points[0].y);
            points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
            ctx.lineTo(points[points.length - 1].x, PAD.top + innerH);
            ctx.closePath();
            ctx.fillStyle = color.startsWith('#') || color.startsWith('rgb')
                ? `${color}22`
                : 'rgba(255,255,255,0.04)';
            ctx.fill();

            // Line (linear)
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.stroke();

            // Dots
            points.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            });
        });

        // Legend
        if (labels.length) {
            const legendY = H - LEGEND_H + 6;
            const itemSpacing = innerW / Math.max(labels.length, 1);
            ctx.font = `10px ${monoFont}`;
            ctx.textAlign = 'left';

            labels.forEach((label, si) => {
                const cssVar = CGX_PLOT_PALETTE[si % CGX_PLOT_PALETTE.length];
                const color = style.getPropertyValue(cssVar).trim();
                const x = PAD.left + si * itemSpacing;

                // Short line swatch
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, legendY);
                ctx.lineTo(x + 14, legendY);
                ctx.stroke();

                // Dot in the middle of the swatch
                ctx.beginPath();
                ctx.arc(x + 7, legendY, 3, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();

                // Label text
                ctx.fillStyle = labelColor;
                ctx.fillText(label, x + 18, legendY + 3.5);
            });
        }
    }

    document.querySelectorAll('canvas.cgx-plot').forEach(canvas => {
        cgxDrawPlot(canvas);

        // Redraw on resize
        if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(() => cgxDrawPlot(canvas)).observe(canvas);
        }
    });
});
