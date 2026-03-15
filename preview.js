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

    // Console Demo Interactivity
    const consoleContainer = document.getElementById('preview-console');
    const logBtns = document.querySelectorAll('.log-btn');
    const clearBtn = document.getElementById('clear-console-btn');

    if (consoleContainer) {
        // Auto-scroll function
        const scrollToBottom = () => {
            consoleContainer.scrollTop = consoleContainer.scrollHeight;
        };

        // Format current time as HH:MM:SS
        const getTimeString = () => {
            const now = new Date();
            return `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
        };

        // Handle adding new logs
        logBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const logEntry = document.createElement('div');
                logEntry.className = `cgx-log cgx-log-${type}`;
                
                let message = 'New system event recorded.';
                if (type === 'debug') message = 'Inspecting object bounds...';
                if (type === 'warning') message = 'High latency detected.';
                if (type === 'error') message = 'Connection failed (ERR_TIMEOUT).';

                logEntry.textContent = `${getTimeString()} ${message}`;
                
                consoleContainer.appendChild(logEntry);
                scrollToBottom();
            });
        });

        // Handle clear console
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                consoleContainer.innerHTML = '';
            });
        }

        // Handle Console Input Submission (Main Console)
        const cmdInput = document.getElementById('console-cmd-input');
        const cmdSendBtn = document.getElementById('console-cmd-send');

        if (cmdInput && cmdSendBtn) {
            const submitCommand = () => {
                const text = cmdInput.value.trim();
                if (!text) return; // Don't send empty commands

                const logEntry = document.createElement('div');
                logEntry.className = 'cgx-log cgx-log-user';
                logEntry.textContent = `${getTimeString()} > ${text}`;
                
                consoleContainer.appendChild(logEntry);
                scrollToBottom();
                
                cmdInput.value = ''; // Clear input
            };

            // Submit on button click
            cmdSendBtn.addEventListener('click', submitCommand);

            // Submit on Enter key
            cmdInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent default form submission if wrapped in form
                    submitCommand();
                }
            });
        }

        // Handle Console Input Submission (HUD Console)
        const hudConsole = document.getElementById('hud-console');
        const hudCmdInput = document.getElementById('hud-cmd-input');
        const hudCmdSendBtn = document.getElementById('hud-cmd-send');

        if (hudConsole && hudCmdInput && hudCmdSendBtn) {
            const submitHudCommand = () => {
                const text = hudCmdInput.value.trim();
                if (!text) return;

                const logEntry = document.createElement('div');
                logEntry.className = 'cgx-log cgx-log-user';
                logEntry.textContent = `${getTimeString()} > ${text}`;
                
                hudConsole.appendChild(logEntry);
                hudConsole.scrollTop = hudConsole.scrollHeight;
                
                hudCmdInput.value = '';
            };

            hudCmdSendBtn.addEventListener('click', submitHudCommand);

            hudCmdInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    submitHudCommand();
                }
            });
        }
    }

    // Live Plot Demo — Sine Wave Streaming
    const liveCanvas = document.getElementById('live-plot');
    const liveToggle = document.getElementById('live-plot-toggle');

    if (liveCanvas && liveToggle) {
        const BUFFER = 1000;          // number of visible samples
        const CHANNELS = [
            { freq: 1.0, phase: 0,              amp: 1.0  },
            { freq: 1.7, phase: Math.PI / 3,    amp: 0.7  },
            { freq: 0.6, phase: Math.PI * 1.1,  amp: 0.5  },
        ];

        // Initialise ring buffers with zeros + time values
        const buffers = CHANNELS.map(() => Array(BUFFER).fill(0));
        let times = Array(BUFFER).fill(0);  // parallel x-values for data-x
        let t = 0;
        let rafId = null;
        let running = false;

        function tick() {
            if (!running) return;

            // Advance real time by a variable amount to test non-constant updates
            const dt = 0.02 + Math.random() * 0.12; 
            t = parseFloat((t + dt).toFixed(3));

            // Push new sample + time value into ring buffers
            CHANNELS.forEach((ch, i) => {
                const val = ch.amp * Math.sin(ch.freq * t + ch.phase);
                buffers[i].push(val);
                if (buffers[i].length > BUFFER) buffers[i].shift();
            });
            times.push(t);
            if (times.length > BUFFER) times.shift();

            // Update the canvas data and redraw
            liveCanvas.dataset.x      = JSON.stringify(times);
            liveCanvas.dataset.series = JSON.stringify(buffers);
            liveCanvas._cgxRedraw?.();

            rafId = requestAnimationFrame(tick);
        }

        liveToggle.addEventListener('click', () => {
            running = liveToggle.dataset.active === 'true';
            if (running) {
                tick();
            } else {
                cancelAnimationFrame(rafId);
            }
        });

        // Draw the initial flat state once cgx.js has set up the canvas
        // (small delay to ensure _cgxRedraw is ready)
        setTimeout(() => liveCanvas._cgxRedraw?.(), 0);
    }
});
