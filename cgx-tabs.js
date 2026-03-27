/**
 * CGx Design Language - Tabbed Panel Component
 * Provides tab switching for .cgx-panel-tabbed containers.
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    document.querySelectorAll('.cgx-panel-tabbed').forEach(panel => {
        const tabs = panel.querySelectorAll(':scope > .cgx-panel-tabs > .cgx-panel-tab');
        const panes = panel.querySelectorAll(':scope > .cgx-panel-tab-content > .cgx-panel-tab-pane');

        tabs.forEach((tab, i) => {
            tab.addEventListener('click', () => {
                // Deactivate all
                tabs.forEach(t => t.classList.remove('cgx-panel-tab-active'));
                panes.forEach(p => p.classList.remove('cgx-panel-tab-pane-active'));

                // Activate clicked
                tab.classList.add('cgx-panel-tab-active');
                if (panes[i]) panes[i].classList.add('cgx-panel-tab-pane-active');
            });
        });
    });
});
