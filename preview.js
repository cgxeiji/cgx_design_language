/**
 * Preview.js
 * Contains JavaScript logic specific to the preview.html demo page.
 * Not part of the core CGx design language.
 */

document.addEventListener('DOMContentLoaded', () => {
    // HUD Placement Controls
    const mainHud = document.getElementById('main-hud');
    const placementBtns = document.querySelectorAll('.placement-btn');
    
    // Map of placements to their respective unicode arrows
    const iconMap = {
        'top-left': '↖',
        'top': '↑',
        'top-right': '↗',
        'left': '←',
        'right': '→',
        'bottom-left': '↙',
        'bottom': '↓',
        'bottom-right': '↘'
    };

    placementBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const placement = btn.dataset.placement;
            if (!placement || !mainHud) return;

            // Remove all placement classes
            mainHud.classList.forEach(className => {
                if (className.startsWith('cgx-hud-')) {
                    mainHud.classList.remove(className);
                }
            });

            // Add the new placement class
            mainHud.classList.add(`cgx-hud-${placement}`);

            // Update the closed icon to match the new direction
            mainHud.style.setProperty('--cgx-hud-icon-closed', `'${iconMap[placement]}'`);

            // Apply active button styling
            placementBtns.forEach(b => {
                b.classList.remove('cgx-button-primary');
                b.classList.add('cgx-button-ghost');
            });
            btn.classList.remove('cgx-button-ghost');
            btn.classList.add('cgx-button-primary');
        });
    });

    // Slider Synchronization
    const sliders = document.querySelectorAll('input[type="range"].cgx-range');
    
    sliders.forEach(slider => {
        // Find corresponding numeric input if it exists (by ID convention: sliderId + '-num')
        const numInput = document.getElementById(`${slider.id}-num`);
        
        // If no explicit number input, look for a directly adjacent span
        let displaySpan = null;
        if (!numInput && slider.nextElementSibling && slider.nextElementSibling.tagName.toLowerCase() === 'span') {
            displaySpan = slider.nextElementSibling;
        }

        // Two-way binding for <input type="number">
        if (numInput) {
            slider.addEventListener('input', () => {
                numInput.value = slider.value;
            });
            numInput.addEventListener('input', () => {
                slider.value = numInput.value;
            });
        }

        // One-way binding for display <span>
        if (displaySpan) {
            slider.addEventListener('input', () => {
                displaySpan.textContent = slider.value;
            });
        }
    });
});

