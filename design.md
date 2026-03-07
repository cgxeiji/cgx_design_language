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
*   **Black**: `#2c3e50` (`--cgx-color-black`) / `#34495e` (`--cgx-color-black-bright`)
*   **Red**: `#c0392b` (`--cgx-color-red`) / `#e74c3c` (`--cgx-color-red-bright`)
*   **Green**: `#27ae60` (`--cgx-color-green`) / `#2ecc71` (`--cgx-color-green-bright`)
*   **Yellow**: `#f39c12` (`--cgx-color-yellow`) / `#f1c40f` (`--cgx-color-yellow-bright`)
*   **Blue**: `#2980b9` (`--cgx-color-blue`) / `#3498db` (`--cgx-color-blue-bright`)
*   **Magenta**: `#8e44ad` (`--cgx-color-magenta`) / `#9b59b6` (`--cgx-color-magenta-bright`)
*   **Cyan**: `#7aa085` (`--cgx-color-cyan`) / `#1abc9c` (`--cgx-color-cyan-bright`)
*   **White**: `#bdc3c7` (`--cgx-color-white`) / `#ecf0f1` (`--cgx-color-white-bright`)

## Typography

The design language uses a monospaced font as its base to pair with the terminal-inspired aesthetic.

*   **Base Font (`--cgx-font-mono`)**: `'Noto Sans Mono', monospace`
    *   This font is imported from Google Fonts.
    *   It is applied globally to the `.cgx-body` class.

## Spacing, Layout & Shapes

*   **Border Radius (`--cgx-radius`)**: `12px` - The default rounded corner size for all standard elements like buttons, inputs, and cards.

## Components

### Buttons
(To be defined)

### Inputs
(To be defined)

### Cards
(To be defined)
