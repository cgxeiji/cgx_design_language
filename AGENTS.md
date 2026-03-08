# Agent Directives for CGx Design Language

Welcome. If you are an AI assistant or agent working on this repository, please adhere to the following guidelines:

1.  **Prefix Requirement**: All custom CSS classes MUST be prefixed with `cgx-` (e.g., `.cgx-button`, `.cgx-card`).
2.  **CSS Exclusivity**: Use vanilla CSS in `cgx.css`. Do not add Tailwind, Bootstrap, or other CSS frameworks unless explicitly requested by the user.
3.  **Documentation Synchronization**: When adding new design elements, utility classes, or components to `cgx.css`, you MUST:
    *   Update `design.md` with the new element's description, purpose, and intended usage.
    *   Add a visual code example showcasing the new element in `preview.html`.
4.  **No Unrequested Additions**: NEVER add new components, sections, or styles (such as Inputs, Dropdowns, etc.) that the user has not explicitly requested. Only work on the component currently being discussed.
5.  **Strict Variable Usage for Colors**: All colors MUST be derived from the predefined CSS variables in the `:root` palette. NEVER use hardcoded Hex, RGB, or RGBA values directly in component rules unless generating custom opacities via `color-mix()` or if explicitly given a specific color value by the user. If a new shade or transparency level is needed repeatedly, add it to the `:root` variables.
6.  **Step-by-Step Evolution**: This design language is to be built iteratively step-by-step. Do not introduce sweeping design decisions (such as full color palettes, typography systems, or complex layouts) unless specifically instructed by the user. Maintain a barebones, foundational approach until directed otherwise.
6.  **LLM Readability**: `design.md` is specifically intended for LLM ingestion to understand the design system context. Ensure it remains well-structured, precise, and easily parsable.
7. **LLM Follow-up**: Do not follow up with questions after completing a task unless absolutely necessary. 