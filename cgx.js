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
});
