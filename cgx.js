/**
 * CGx Design Language - Interactive Components
 * Provides progressive enhancement for native HTML elements.
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

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

            // Ignore click if it was on a button/restore icon, or if we just finished dragging
            if (e.target.closest('button, .cgx-hud-restore')) return;
            if (hud.hasAttribute('data-is-dragging')) return;

            if (hud.hasAttribute('open')) {
                // Closing
                hud.classList.add('cgx-is-closing');

                // If draggable, remove custom position styles during close so it animates back to original anchor
                if (hud.hasAttribute('data-draggable')) {
                    // We don't clear the cache, just the inline styles holding it in place
                    hud.style.left = '';
                    hud.style.top = '';
                    hud.style.right = '';
                    hud.style.bottom = '';
                    hud.style.transform = '';
                    
                    // Hide restore button during collapse
                    let restoreBtn = summary.querySelector('.cgx-hud-restore');
                    if (restoreBtn) {
                        restoreBtn.style.display = 'none';
                    }
                }

                setTimeout(() => {
                    hud.classList.remove('cgx-is-closing');
                    hud.removeAttribute('open');
                }, 400); // 400ms matches the transition duration in cgx.css
            } else {
                // Opening - force a browser reflow to guarantee CSS transition on first click
                hud.setAttribute('open', '');

                // Restore cached position if draggable
                if (hud.hasAttribute('data-draggable') && hud.id) {
                    const cacheKey = `cgx-hud-pos-${hud.id}`;
                    const cached = localStorage.getItem(cacheKey);
                    if (cached) {
                        try {
                            const pos = JSON.parse(cached);
                            // Apply exact position and clear conflicting anchor classes implicitly
                            hud.style.left = pos.left + 'px';
                            hud.style.top = pos.top + 'px';
                            hud.style.right = 'auto';
                            hud.style.bottom = 'auto';
                            hud.style.transform = 'none';
                            
                            // Show restore button
                            let restoreBtn = summary.querySelector('.cgx-hud-restore');
                            if (restoreBtn) {
                                restoreBtn.style.display = '';
                            }
                        } catch(e) {}
                    }
                }

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
        
        // Setup Draggable HUDs
        if (hud.classList.contains('cgx-hud') && hud.hasAttribute('data-draggable') && hud.id) {
            setupDraggableHud(hud, summary);
        }
    });

    // Extract Draggable HUD logic

    // Extract Draggable HUD logic
    function setupDraggableHud(hud, summary) {
        let isDragging = false;
        let hasDragged = false; // Add flag to track if actual movement occurred
        let startX, startY, initialLeft, initialTop;
        const cacheKey = `cgx-hud-pos-${hud.id}`;

        // Inject Restore Button
        let restoreBtn = document.createElement('span');
        restoreBtn.className = 'cgx-hud-restore';
        restoreBtn.title = 'Restore Default Position';
        restoreBtn.innerHTML = '⌂';
        restoreBtn.style.display = 'none'; // Hidden by default
        
        // Prevent details toggle when clicking restore
        restoreBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Stop native details toggle
            e.stopPropagation(); // Stop our custom toggler
            localStorage.removeItem(cacheKey);
            hud.style.left = '';
            hud.style.top = '';
            hud.style.right = '';
            hud.style.bottom = '';
            hud.style.transform = '';
            restoreBtn.style.display = 'none';
        });
        
        summary.appendChild(restoreBtn);

        // Check if cached position exists on load
        const cached = localStorage.getItem(cacheKey);
        if (cached && hud.hasAttribute('open')) {
            try {
                const pos = JSON.parse(cached);
                hud.style.left = pos.left + 'px';
                hud.style.top = pos.top + 'px';
                hud.style.right = 'auto';
                hud.style.bottom = 'auto';
                hud.style.transform = 'none';
                restoreBtn.style.display = '';
            } catch(e) {}
        }

        // Pointer Events for Dragging
        // Prevent native touch scrolling when touching the summary
        summary.style.touchAction = 'none';

        const handlePointerMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            // Only consider it a drag if moved more than a couple pixels
            if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
                hasDragged = true;
            }

            let newLeft = initialLeft + deltaX;
            let newTop = initialTop + deltaY;

            // Viewport clamping
            const rect = hud.getBoundingClientRect();
            const maxLeft = window.innerWidth - rect.width;
            const maxTop = window.innerHeight - rect.height;

            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));

            hud.style.left = newLeft + 'px';
            hud.style.top = newTop + 'px';
        };

        const handlePointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            hud.classList.remove('cgx-hud-dragging');
            document.body.style.cursor = '';
            
            // Remove window listeners when drag ends
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);

            if (hasDragged) {
                // Save new position
                const rect = hud.getBoundingClientRect();
                localStorage.setItem(cacheKey, JSON.stringify({
                    left: rect.left,
                    top: rect.top
                }));
                
                // Show restore button
                restoreBtn.style.display = '';

                // Tell main click handler to ignore the subsequent click
                hud.setAttribute('data-is-dragging', 'true');
                setTimeout(() => hud.removeAttribute('data-is-dragging'), 100);
                
                hasDragged = false;
            }
        };

        summary.addEventListener('pointerdown', (e) => {
            // Only drag when open
            if (!hud.hasAttribute('open')) return;
            // Only allow left click / primary touch
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            // Don't drag if clicking buttons within summary
            if (e.target.closest('button, .cgx-hud-restore')) return;

            // Prevent default to stop text selection during drag
            if (e.cancelable) e.preventDefault();

            isDragging = true;
            hasDragged = false;
            startX = e.clientX;
            startY = e.clientY;

            // Get current computed position
            const rect = hud.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            // Clear anchor classes via inline override
            hud.style.right = 'auto';
            hud.style.bottom = 'auto';
            hud.style.transform = 'none';

            hud.classList.add('cgx-hud-dragging');
            document.body.style.cursor = 'grabbing';
            
            // Attach to window during drag so we don't lose the cursor
            window.addEventListener('pointermove', handlePointerMove, { passive: false });
            window.addEventListener('pointerup', handlePointerUp);
            window.addEventListener('pointercancel', handlePointerUp);
        });
    }

    // 2. Draggable Number Inputs Logic
    const dragInputs = document.querySelectorAll('.cgx-drag-input');

    dragInputs.forEach(container => {
        const input = container.querySelector('.cgx-drag-field');
        if (!input) return;

        let isDragging = false;
        let hasMoved = false;
        let startX = 0;
        let startVal = 0;

        // Grab step from HTML, default to 1 if not provided
        let step = parseFloat(input.getAttribute('step')) || 1;

        // Ensure sensible float fixing based on the step increment
        const decimals = (step.toString().split('.')[1] || '').length;

        // Prevent native touch scrolling when dragging the input
        container.style.touchAction = 'none';

        const handlePointerDown = (e) => {
            // Only react to left clicks and primary touch
            if (e.pointerType === 'mouse' && e.button !== 0) return;

            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startVal = parseFloat(input.value) || 0;

            if (document.activeElement !== input && e.cancelable) {
                e.preventDefault();
            }
        };

        const handlePointerMove = (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;

            if (!hasMoved) {
                if (Math.abs(deltaX) > 2) {
                    hasMoved = true;
                    if (document.activeElement === input) {
                        input.blur();
                    }
                    document.body.style.cursor = 'ew-resize';
                } else {
                    return;
                }
            }

            if (e.cancelable) {
                e.preventDefault();
            }

            const sensitivity = 2;
            const stepsToMove = Math.floor(deltaX / sensitivity);
            let newVal = startVal + (stepsToMove * step);

            const min = input.hasAttribute('min') ? parseFloat(input.getAttribute('min')) : -Infinity;
            const max = input.hasAttribute('max') ? parseFloat(input.getAttribute('max')) : Infinity;
            newVal = Math.max(min, Math.min(max, newVal));

            input.value = newVal.toFixed(decimals);

            input.dispatchEvent(new Event('input'));
        };

        const handlePointerUp = () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.cursor = '';

                if (!hasMoved) {
                    if (document.activeElement !== input) {
                        input.focus();
                        input.select();
                    }
                }
            }
        };

        container.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove, { passive: false });
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);

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
        const labelActive = btn.dataset.labelActive || 'Stop';
        const labelInactive = btn.dataset.labelInactive || 'Start';
        const iconActive = btn.dataset.iconActive || '';
        const iconInactive = btn.dataset.iconInactive || '';

        const fullActive = iconActive ? `${iconActive} ${labelActive}` : labelActive;
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
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const W = rect.width;
        const H = rect.height;

        // Parse options
        let seriesData = [];
        try { seriesData = JSON.parse(canvas.dataset.series || '[]'); } catch (_) { }
        if (!Array.isArray(seriesData[0])) seriesData = [seriesData];
        if (!seriesData.length || !seriesData[0].length) return;

        // Parse Options
        const fixedDigitsX = canvas.hasAttribute('data-fixed-digits-x') ? parseInt(canvas.dataset.fixedDigitsX, 10) : (canvas.hasAttribute('data-fixed-digits') ? parseInt(canvas.dataset.fixedDigits, 10) : null);
        const fixedDigitsY = canvas.hasAttribute('data-fixed-digits-y') ? parseInt(canvas.dataset.fixedDigitsY, 10) : (canvas.hasAttribute('data-fixed-digits') ? parseInt(canvas.dataset.fixedDigits, 10) : null);
        const gridX = canvas.hasAttribute('data-grid-x') ? parseFloat(canvas.dataset.gridX) : null;
        const gridY = canvas.hasAttribute('data-grid-y') ? parseFloat(canvas.dataset.gridY) : null;

        // Parse X values — if absent, fall back to 0-based index
        const maxLen = Math.max(...seriesData.map(s => s.length));
        let xValues = [];
        try { xValues = JSON.parse(canvas.dataset.x || 'null'); } catch (_) { }
        if (!Array.isArray(xValues) || xValues.length !== maxLen) {
            xValues = Array.from({ length: maxLen }, (_, i) => i);
        }
        
        let xMin, xMax;
        const actualXMin = Math.min(...xValues);
        const actualXMax = Math.max(...xValues);

        if (canvas.hasAttribute('data-x-min') && canvas.hasAttribute('data-x-max')) {
            xMin = parseFloat(canvas.dataset.xMin);
            xMax = parseFloat(canvas.dataset.xMax);
        } else if (canvas.hasAttribute('data-x-range')) {
            const range = parseFloat(canvas.dataset.xRange);
            if (canvas.hasAttribute('data-x-min')) {
                xMin = parseFloat(canvas.dataset.xMin);
                xMax = xMin + range;
            } else if (canvas.hasAttribute('data-x-max')) {
                xMax = parseFloat(canvas.dataset.xMax);
                xMin = xMax - range;
            } else {
                xMax = actualXMax;
                xMin = xMax - range;
            }
        } else {
            xMin = canvas.hasAttribute('data-x-min') ? parseFloat(canvas.dataset.xMin) : actualXMin;
            xMax = canvas.hasAttribute('data-x-max') ? parseFloat(canvas.dataset.xMax) : actualXMax;
        }
        
        const xRange = xMax - xMin || 1;

        // Map an x-value to a canvas pixel x coordinate
        const xToCanvas = xv => PAD.left + ((xv - xMin) / xRange) * innerW;

        let labels = [];
        try { labels = JSON.parse(canvas.dataset.labels || '[]'); } catch (_) { }

        const xlabel = canvas.dataset.xlabel || '';
        const ylabel = canvas.dataset.ylabel || '';
        const monoFont = style.getPropertyValue('--cgx-font-mono').trim();
        const labelColor = style.getPropertyValue('--cgx-color-white-trans-50').trim();

        // Dynamic padding based on active features
        const LEGEND_H = labels.length ? 22 : 0;
        const XLABEL_H = xlabel ? 16 : 0;
        const YLABEL_W = ylabel ? 14 : 0;

        const PAD = {
            top: 12,
            right: 12,
            bottom: 24 + XLABEL_H + LEGEND_H,
            left: 36 + YLABEL_W,
        };
        const innerW = W - PAD.left - PAD.right;
        const innerH = H - PAD.top - PAD.bottom;

        // Clear
        ctx.clearRect(0, 0, W, H);

        // Global Y min/max
        const allVals = seriesData.flat();
        const actualYMin = Math.min(...allVals);
        const actualYMax = Math.max(...allVals);
        let dataMin, dataMax;

        if (canvas.hasAttribute('data-y-min') && canvas.hasAttribute('data-y-max')) {
            dataMin = parseFloat(canvas.dataset.yMin);
            dataMax = parseFloat(canvas.dataset.yMax);
        } else if (canvas.hasAttribute('data-y-range')) {
            const range = parseFloat(canvas.dataset.yRange);
            if (canvas.hasAttribute('data-y-min')) {
                dataMin = parseFloat(canvas.dataset.yMin);
                dataMax = dataMin + range;
            } else if (canvas.hasAttribute('data-y-max')) {
                dataMax = parseFloat(canvas.dataset.yMax);
                dataMin = dataMax - range;
            } else {
                const mid = (actualYMin + actualYMax) / 2;
                dataMin = mid - range / 2;
                dataMax = mid + range / 2;
            }
        } else {
            dataMin = canvas.hasAttribute('data-y-min') ? parseFloat(canvas.dataset.yMin) : actualYMin;
            dataMax = canvas.hasAttribute('data-y-max') ? parseFloat(canvas.dataset.yMax) : actualYMax;
        }

        const dataRange = dataMax - dataMin || 1;

        const gridColor = style.getPropertyValue('--cgx-color-white-trans-10').trim();

        // Y-axis grid lines + labels
        ctx.font = `10px ${monoFont}`;
        ctx.fillStyle = labelColor;
        ctx.textAlign = 'right';
        
        if (gridY !== null && gridY > 0) {
            const startY = Math.ceil(dataMin / gridY) * gridY;
            for (let val = startY; val <= dataMax; val += gridY) {
                const t = (val - dataMin) / dataRange;
                const y = PAD.top + innerH * (1 - t);
                
                ctx.strokeStyle = gridColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(PAD.left, y);
                ctx.lineTo(PAD.left + innerW, y);
                ctx.stroke();

                const lbl = fixedDigitsY !== null ? val.toFixed(fixedDigitsY) : val.toFixed(1);
                ctx.fillStyle = labelColor;
                ctx.fillText(lbl, PAD.left - 4, y + 3.5);
            }
        } else {
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

                const lbl = fixedDigitsY !== null ? val.toFixed(fixedDigitsY) : val.toFixed(1);
                ctx.fillStyle = labelColor;
                ctx.fillText(lbl, PAD.left - 4, y + 3.5);
            }
        }

        // X-axis tick labels from xValues
        ctx.textAlign = 'center';
        ctx.fillStyle = labelColor;

        if (gridX !== null && gridX > 0) {
            const startX = Math.ceil(xMin / gridX) * gridX;
            for (let val = startX; val <= xMax; val += gridX) {
                const cx = xToCanvas(val);
                
                // Draw vertical grid line
                ctx.strokeStyle = gridColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx, PAD.top);
                ctx.lineTo(cx, PAD.top + innerH);
                ctx.stroke();

                const lbl = fixedDigitsX !== null ? val.toFixed(fixedDigitsX) : (Number.isInteger(val) ? val : val.toFixed(2));
                ctx.fillText(lbl, cx, PAD.top + innerH + 14);
            }
        } else {
            // Dynamic value-based ticks to prevent label jitter natives
            const targetTicks = 6;
            const roughStep = xRange / targetTicks;
            const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep || 1)));
            const normalizedStep = roughStep / magnitude;
            
            let stepMult = 1;
            if (normalizedStep < 1.5) stepMult = 1;
            else if (normalizedStep < 3) stepMult = 2;
            else if (normalizedStep < 7) stepMult = 5;
            else stepMult = 10;
            
            const stepX = stepMult * Math.max(magnitude, Number.EPSILON);
            const startX = Math.ceil(xMin / stepX) * stepX;
            
            for (let val = startX; val <= xMax + stepX * 0.01; val += stepX) {
                const cx = xToCanvas(val);
                const autoDecimals = stepX < 1 ? Math.max(0, -Math.floor(Math.log10(stepX))) : 0;
                const lbl = fixedDigitsX !== null ? val.toFixed(fixedDigitsX) : val.toFixed(autoDecimals);
                ctx.fillText(lbl, cx, PAD.top + innerH + 14);
            }
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
        ctx.save();
        ctx.beginPath();
        ctx.rect(PAD.left, PAD.top, innerW, innerH);
        ctx.clip();

        seriesData.forEach((series, si) => {
            const cssVar = CGX_PLOT_PALETTE[si % CGX_PLOT_PALETTE.length];
            const color = style.getPropertyValue(cssVar).trim();

            const points = series.map((v, i) => ({
                x: xToCanvas(xValues[i] ?? i),
                y: PAD.top + innerH * (1 - (v - dataMin) / dataRange),
            }));

            // Filled area (linear)
            ctx.beginPath();
            ctx.moveTo(points[0].x, PAD.top + innerH);
            ctx.lineTo(points[0].x, points[0].y);
            points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
            ctx.lineTo(points[points.length - 1].x, PAD.top + innerH);
            ctx.closePath();

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
        
        ctx.restore();

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

        // Expose redraw for external use (e.g. live data updates)
        canvas._cgxRedraw = () => cgxDrawPlot(canvas);

        // Redraw on resize
        if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(() => cgxDrawPlot(canvas)).observe(canvas);
        }
    });
});
