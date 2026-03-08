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
});
