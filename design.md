# CGx Design Language

This document describes the design elements of the CGx design language. It is intended for both human reference and LLM ingestion.

## Core Principles
(To be defined)

## Color Palette

The color palette is built on a dark theme foundation, utilizing standard terminal colors for semantic meaning.

### Base Colors
*   **Background (`--cgx-bg`)**: `#000000`
*   **Foreground Text (`--cgx-fg`)**: `#ecf0f1`
*   **Element Background (`--cgx-element-bg`)**: `rgba(24, 24, 24, 0.7)` - Intended for components like buttons, cards, and inputs.

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

## Spacing, Layout & Shapes

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
*   **`.cgx-button-ghost`**: Transparent border and background. Subtle hover effect.

### Inputs
(To be defined)

### Cards
(To be defined)
