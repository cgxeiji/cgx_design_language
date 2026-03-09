# CGx Design Language

This document describes the design elements of the CGx design language. It is intended for both human reference and LLM ingestion.

## Core Principles
(To be defined)

## Color Palette

The color palette is built on a dark theme foundation, utilizing standard terminal colors for semantic meaning.

### Base Colors
*   **Background (`--cgx-bg`)**: `#000000`
*   **Foreground Text (`--cgx-fg`)**: `#ecf0f1`
*   **Element Background (`--cgx-element-bg`)**: `#181818` - Intended for components like buttons, cards, and inputs.

### Terminal Palette
*   **Black**: `#34495e` (`--cgx-color-black`) / `#2c3e50` (`--cgx-color-black-bright`)
*   **Red**: `#e74c3c` (`--cgx-color-red`) / `#c0392b` (`--cgx-color-red-bright`)
*   **Green**: `#2ecc71` (`--cgx-color-green`) / `#27ae60` (`--cgx-color-green-bright`)
*   **Yellow**: `#f1c40f` (`--cgx-color-yellow`) / `#f39c12` (`--cgx-color-yellow-bright`)
*   **Orange**: `#e67e22` (`--cgx-color-orange`) / `#d35400` (`--cgx-color-orange-bright`)
*   **Blue**: `#3498db` (`--cgx-color-blue`) / `#2980b9` (`--cgx-color-blue-bright`)
*   **Magenta**: `#9b59b6` (`--cgx-color-magenta`) / `#8e44ad` (`--cgx-color-magenta-bright`)
*   **Cyan**: `#1abc9c` (`--cgx-color-cyan`) / `#7aa085` (`--cgx-color-cyan-bright`)
*   **White**: `#ecf0f1` (`--cgx-color-white`) / `#bdc3c7` (`--cgx-color-white-bright`)

### Semantic Colors
*   **Primary (`--cgx-primary`)**: Mapped to **Orange** (`--cgx-color-orange`). Used for primary actions, highlights, and emphasis.
*   **Secondary (`--cgx-secondary`)**: Mapped to **Blue** (`--cgx-color-blue`). Used for secondary actions, subtle backgrounds, and grouping.

## Typography

The design language uses a monospaced font as its base to pair with the terminal-inspired aesthetic.

*   **Base Font (`--cgx-font-mono`)**: `'Noto Sans Mono', monospace`
    *   This font is imported from Google Fonts.
    *   It is applied globally to the `.cgx-body` class.
*   **Inline Code (`<code>`)**:
    *   Uses `--cgx-element-bg` for a slight pill background.
    *   Text is explicitly colored using `--cgx-primary` to pop against standard paragraphs.
*   **Link (`<a>`)**:
    *   Uses `--cgx-primary` color.
    *   A subtle bottom border via `color-mix` is applied instead of a standard `text-decoration: underline`.
    *   On hover, the text and border transition to `--cgx-primary-bright`.

## Spacing, Layout & Shapes

*   **Page Spacing (`--cgx-spacing`)**: `12px` - The default outer padding applied to the `.cgx-body` to keep content from touching the edges of the viewport while maximizing screen real estate.
*   **Border Radius (`--cgx-radius`)**: `12px` - The default rounded corner size for all standard elements like buttons, inputs, and cards.

## Components

### Buttons
Buttons trigger actions within the application. All buttons share the `.cgx-button` base class.

**Base Class:** `.cgx-button`
*   Uses `--cgx-radius` for corners and `--cgx-font-default`.
*   By default, all buttons use the transparent `--cgx-element-bg` background.
*   The default "Normal" button styling uses a white border and white text. Let's it stand out without overwhelming.
*   On hover, the button fills with its bright color variant, and text flips to the background color for high contrast.

**Variants:**
*   **`.cgx-button-primary`**: Uses Primary Orange for border and text. Fills with Bright Orange on hover.
*   **`.cgx-button-secondary`**: Uses Secondary Blue for border and text. Fills with Bright Blue on hover.
*   **`.cgx-button-danger`**: Uses Red for border and text. Fills with Bright Red on hover.
*   **`.cgx-button-success`**: Uses Green for border and text. Fills with Bright Green on hover.
*   **`.cgx-button-warning`**: Uses Yellow for border and text. Fills with Bright Yellow on hover.
*   **`.cgx-button-ghost`**: Transparent border and background. Subtle hover effect using the primary color.
*   **`.cgx-button-toggle`**: A special stateful button for Start/Stop style controls. State is driven by the `[data-active]` attribute (toggled automatically by `cgx.js`). When `data-active="false"` (default), the button appears dimmed with a neutral dot indicator. When `data-active="true"`, it activates a green border, background tint, and a small pulsing green dot to communicate a running/active process. Label text automatically swaps between `data-label-inactive` (e.g., "Start Simulation") and `data-label-active` (e.g., "Stop Simulation") on every click. Requires `cgx.js`.

### Cards
Cards are flexible containers used to group related content, actions, or data. All cards use the `.cgx-card` base class.

**Base Class:** `.cgx-card`
*   Uses `--cgx-element-bg` for background and `--cgx-radius` for corners.
*   Includes a default `20px` padding and sets up a `flex` column layout.
*   Child elements like `.cgx-card-header`, `.cgx-card-body`, and `.cgx-card-footer` provide consistent spacing.

**Variants:**
*   **`.cgx-card-outlined`**: Adds a subtle `var(--cgx-color-white-trans-10)` border. Provides a sharp, modern edge for distinct grouping on dark backgrounds.
*   **`.cgx-card-interactive`**: Adds hover states (lifts up 2px and gets a solid white border) indicating the entire card is clickable.
*   **`.cgx-card-cta`**: Used for high-emphasis actions. Built using a solid foundation and a 1px masked `conic-gradient` background. This creates a slowly rotating colorful border (transitioning between Primary Orange and Yellow) running on a continuous 24-second cycle.

### Panels
Panels are simple, nestable containers used to group UI elements, layout sections, or form controls. Unlike Cards (which suggest distinct physical objects or interactive items like the CTA), Panels are structural building blocks.

**Base Class:** `.cgx-panel`
*   Features an outlined border `1px solid var(--cgx-color-white-trans-30)` (30% transparency) with a transparent background by default.
*   Applies a standard `16px` internal padding and `--cgx-radius` corners.
*   Designed to be a flexible, nestable block.

**Collapsible Panels:**
Panels can be made collapsible by applying the `.cgx-panel` class to a native HTML `<details>` element instead of a `<div>`.
*   The `<summary>` element acts as the clickable header and automatically receives padding, cursor styling, hover states, and a custom `+`/`-` animated marker.
*   Hovering over the collapsed summary header triggers a single, one-time CSS particle eruption effect behind the `+` icon, built using animated box-shadows reflecting the primary theme colors.
*   Wrap the inner content in a standard `<div>` immediately following the `<summary>` to ensure proper structural padding.
*   **Animation**: When `cgx.js` is included in the project, these panels benefit from the same smooth, intercepted `max-height` closing animation as the HUD components.

**Variants:**
*   **`.cgx-panel-ghost`**: Uses a dashed border at 30% transparency `1px dashed var(--cgx-color-white-trans-30)`. Ideal for empty states or drop zones.

### Heads Up Display (HUD)
The HUD represents a fixed-position control panel designed to float globally over the application content, providing immediate access to actions and information regardless of scroll depth.

**Base Class:** `.cgx-hud`
*   Features a fixed position with a high `z-index` to float above all other elements.
*   Background uses `--cgx-color-bg-trans-70`, ensuring an exact 70% transparency of the primary background color for readability without fully obscuring content.
*   Includes a backdrop blur for modern browsers to further enhance text legibility against complex backgrounds.
*   Includes a deep drop shadow to separate it visually from the underlying content.
*   **Internal Spacing:** Adjacent block elements inside a HUD (or its collapsible `<div>` body) automatically receive vertical spacing (`margin-top: var(--cgx-spacing);`).

**Placement Modifiers:**
The HUD requires explicit anchor classes to position it correctly on the screen, locked relative to the viewport using the standard `--cgx-spacing`:
*   **Corners**: `.cgx-hud-top-left`, `.cgx-hud-top-right`, `.cgx-hud-bottom-left`, `.cgx-hud-bottom-right`
*   **Edges (Centered)**: `.cgx-hud-top`, `.cgx-hud-bottom`, `.cgx-hud-left`, `.cgx-hud-right`

**Minimized State:**
The HUD can natively minimize into a floating icon button using the `<details>` pattern (similar to Collapsible Panels).
*   Apply the `.cgx-hud` and placement modifier classes to a native `<details>` element.
*   The `<summary>` acts as the toggle. It natively supports a `.cgx-hud-title` span.
*   When closed, only a Hamburger icon (`≡`) is visible.
*   When open, the header expands to show the Hamburger icon on the left, the `.cgx-hud-title` text in the middle, and a Close icon (`×`) on the right.
*   Wrap the inner control panel content in a standard `<div>` immediately following the `<summary>`.

**Animation & Interactivity (`cgx.js`):**
*   While the HUD opens natively, the closing animation requires the inclusion of `cgx.js`.
*   This lightweight script intercepts the `<summary>` click event on open HUDs, adds a `.cgx-is-closing` class to trigger the CSS shrinking animation, and removes the `open` attribute only after the animation completes. Without `cgx.js`, the HUD will snap closed instantly.

**Customizing Icons:**
You can seamlessly customize the open and closed icons for each specific HUD instance directly in your HTML without needing new CSS classes.
*   Add inline styles to the `<details>` element to override the CSS properties: `style="--cgx-hud-icon-closed: '⚙️'; --cgx-hud-icon-open: '✖';"`.
*   This relies purely on CSS variables and native content substitution.

### Inputs
Forms dictate the rhythm of user data entry. The design language provides distinct structural classes for aligning text inputs.

**Base Classes:**
*   **`.cgx-label`**: Subtly bright white label text (`0.9em`) to pair with inputs.
*   **`.cgx-input` / `.cgx-textarea`**: The foundational text input elements designed for a minimal aesthetic. Features a fully transparent background, no border radius, and relies entirely on a single subtle bottom border (`1px solid var(--cgx-color-white-trans-30)`). On focus, the bottom border brightens solidly to `--cgx-primary` with a slight glowing box-shadow to indicate active state without cluttering the form.
*   **`.cgx-unit`**: A generalized suffix class (e.g., `%`, `ms`, `px`) meant to sit directly after a `.cgx-input` or slider output value. It uses smaller text (`0.75em`) and 30% transparent white to visually recede and prevent interference with the primary data value. Can be applied to a simple `<span>`.
*   **`.cgx-select`**: A custom-styled dropdown menu using `appearance: none` and relying on a custom inline SVG chevron via CSS `background-image`. Shares the default bottom-border aesthetic of text inputs.
*   **`.cgx-checkbox`**: A custom, CSS-only checkbox implementation utilizing `appearance: none`. It defines a minimal outlined box. When checked, it transforms a dynamic SVG path clipped via `clip-path` into view, colored entirely by `--cgx-bg`, against the filled `--cgx-primary` background. Requires no JavaScript.
*   **`.cgx-radio`**: A custom, CSS-only radio button utilizing `appearance: none`. Instead of a checkmark, it employs a `::before` pseudo-element expanding a solid `--cgx-bg` circle within the `--cgx-primary` background upon selection.

*   **`.cgx-range`**: An overarching reset class for standard `<input type="range">`. Customizes both the webkit slider track (`::-webkit-slider-runnable-track`) with `--cgx-color-white-trans-10` and the interactive webkit slider thumb (`::-webkit-slider-thumb`) with an expanding `--cgx-primary` circular node that shrinks dynamically on click.
*   **`.cgx-toggle`**: A pill-shaped toggle switch built on a hidden `<input type="checkbox">`. Requires a specific structure: `<label class="cgx-toggle"><input type="checkbox"><span class="cgx-toggle-track"></span>[optional label text]</label>`. The `.cgx-toggle-track` renders the pill background and the sliding thumb as `::after`. When unchecked, the track is a dim translucent white. When checked, it fills with `--cgx-primary` and the thumb slides to the right. Hover and focus states are both supported.
*   **`.cgx-drag-group` / `.cgx-drag-input`**: A denser, Blender-style spatial alternative for tightly packing coordinates. Wrap `.cgx-drag-input` blocks inside a `.cgx-drag-group`. Each input expects a `.cgx-drag-label` (e.g., "X") and a `.cgx-drag-field` (`<input type="number">`), optionally followed by a `.cgx-drag-unit` (e.g., "mm"). The field naturally defaults to 5 characters wide but will auto-expand for larger values. Clicking the field allows exact manual typing. Clicking and dragging horizontally over any part of the wrapper continuously increments/decrements the value based on the `step` attribute. Math and tracking logic rely on `cgx.js`.

**Form Layouts:**
To ensure inputs align seamlessly, standard layout containers must be used:
1.  **Vertical Layout (`.cgx-form-vertical`)**: A standard flex-column wrapper. Group individual label and input pairs inside a `div.cgx-form-group` which tightly couples them visually.
2.  **Horizontal Layout (`.cgx-form-horizontal`)**: A grid-based layout container (`display: grid; grid-template-columns: minmax(120px, max-content) 1fr;`). Place `.cgx-label` and `.cgx-input` elements directly inside as children. The grid naturally aligns the labels to the right and stretches the inputs to the left, guaranteeing multiple horizontal inputs stay perfectly aligned regardless of label width. It automatically stacks vertically on screens below 480px.

### Layout Grid
**Base Class:** `.cgx-grid`
A responsive multi-panel layout container. It uses `display: grid` with `auto-fit` and a `minmax(280px, 1fr)` column template, so child panels automatically wrap into a new row when the screen is too narrow to fit them. The gap defaults to `--cgx-spacing` to maintain visual consistency with page padding. Place any block-level elements—such as `.cgx-panel` or `.cgx-card`—as direct children.

### Console
The Console provides a dedicated container for displaying logs, events, or terminal-like output. It features a configurable fixed height and custom scrollbar styling.

**Console Architecture:**
The Console area can be used as a standalone display window, or it can be combined with an input bar to create an interactive terminal.
*   **`.cgx-console-wrapper`**: Use this `<div>` as the main outer container if you are pairing the console with an input bar. It applies the main background, borders, and rounded corners, unifying the log window and input area into a single block. 
*   **`.cgx-console-status`**: An optional status bar placed as the **first child** inside `.cgx-console-wrapper`, above the log area. It displays a colored dot indicator, a status label, and an optional right-side info slot (`.cgx-console-status-info` span). Apply one of three state modifier classes: `.cgx-status-connected` (green), `.cgx-status-connecting` (yellow, pulsing dot), or `.cgx-status-disconnected` (red). Without a modifier the bar renders in a neutral dim style.
*   **`.cgx-console`**: The essential internal scrollable area that holds the logs. If used standalone, it applies its own borders and background. If placed inside a `.cgx-console-wrapper`, it seamlessly drops its external styling to fit flush inside the wrapper. Control its height via inline CSS: `style="--cgx-console-height: 120px;"` (defaults to `150px`).
*   **`.cgx-console-input-bar`**: A flex container placed *below* the `.cgx-console` (inside the wrapper) to hold the input layout.
*   **`.cgx-console-input-field`**: A specialized `<input type="text">` designed exclusively for the input bar. It drops all default browser styles, matching the font and colors of the console.

**Log Lines:** `.cgx-log`
A base class applied to individual `<div>` log elements inside the console. It applies mono-spaced fonts, breaking words where necessary, and reserves space for an indicator border.

**Severity Modifiers:**
Combine with `.cgx-log` to apply visually distinct colors and background tones based on severity:
*   `.cgx-log-trace`: Dimmed output (`--cgx-color-white-trans-50`).
*   `.cgx-log-debug`: Black/slate gray output (`--cgx-color-black`).
*   `.cgx-log-info`: White output (`--cgx-color-white`).
*   `.cgx-log-warning`: Orange coloring (`--cgx-color-orange`) with a subtle 10% tinted background and solid left border.
*   `.cgx-log-error`: Red coloring (`--cgx-color-red`) with a subtle 10% tinted background and solid left border.
*   `.cgx-log-user`: Green color (`--cgx-color-green`), reserved for highlighting user-submitted commands or inputs.

### Charts & Plots
**Base Class:** `.cgx-plot`
A `<canvas>` element that renders smooth bezier line charts using the CGx color palette. Data is supplied via the `data-series` attribute as a JSON array. A single array (e.g. `[10, 40, 25]`) draws one series; a nested array (e.g. `[[...], [...]]`) renders multiple overlapping series. Colors are automatically assigned by cycling through the CGx palette in this order: `--cgx-primary`, `--cgx-color-green`, `--cgx-color-blue`, `--cgx-color-cyan`, `--cgx-color-magenta`, `--cgx-color-yellow`, `--cgx-color-red`. The chart includes Y-axis grid lines with value labels, X-axis tick labels, smooth bezier curves, a subtle fill under each line, and dot markers at data points. It is fully responsive via `ResizeObserver`. Requires `cgx.js`.
