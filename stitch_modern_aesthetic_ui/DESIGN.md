# Design System Strategy: Engineering Precision & Tonal Clarity

## 1. Overview & Creative North Star: "The Digital Architect"
This design system is built for the high-performance professional. Our North Star is **"The Digital Architect"**—a philosophy that prioritizes structural integrity, information density, and surgical precision. 

While the request calls for "sharp borders," we interpret this through a high-end lens: the UI should feel like a technical drawing or a luxury blueprint. We move beyond the "template" look by using aggressive white space as a structural element and replacing heavy-handed shadows with **Tonal Layering**. The result is an interface that feels less like a website and more like a high-utility instrument: cold, fast, and impeccably organized.

---

## 2. Colors: Tonal Architecture
We utilize a cold, technical palette to minimize eye fatigue and maximize focus.

*   **The "No-Line" Rule:** While borders are a hallmark of engineering tools, we prohibit their use for primary sectioning. Instead of 1px lines to divide a sidebar from a main view, use a shift from `surface` (#f7f9fb) to `surface-container-low` (#f0f4f7). Reserve borders strictly for interactive elements (inputs/buttons) or distinct data cards.
*   **Surface Hierarchy & Nesting:** Treat the UI as a physical stack of precision-cut plates.
    *   **Base:** `surface` (#f7f9fb)
    *   **Sub-sections:** `surface-container` (#e8eff3)
    *   **Interactive Cards:** `surface-container-lowest` (#ffffff) for maximum "pop" against the gray base.
*   **The "Glass & Gradient" Rule:** Even in a utilitarian tool, flat color can feel "dead." For primary actions, use a microscopic vertical gradient from `primary` (#4d44e3) to `primary_dim` (#4034d7). For overlays, use `surface_container_lowest` at 85% opacity with a `20px` backdrop blur to maintain context.

---

## 3. Typography: Monospaced Authority
The contrast between the geometric sans and the technical monospace creates the "Developer Tool" signature.

*   **The Headline Strategy:** Use **Inter** for all UI-related navigation and headers. Use `headline-sm` (1.5rem) with tighter letter-spacing (-0.02em) to give it an authoritative, "locked-in" feel.
*   **The Data Strategy:** Use **Space Grotesk** (our `label` tokens) for all dynamic data, code snippets, and status metrics. The shift from Inter (Body) to Space Grotesk (Labels/Data) signals to the user that they are transitioning from "Navigation" to "Information."
*   **Hierarchy:**
    *   **Labels (`label-md`):** All-caps with 0.05em tracking for metadata.
    *   **Body (`body-md`):** `on_surface_variant` (#566166) for secondary descriptions to reduce visual noise.

---

## 4. Elevation & Depth: Tonal Layering
We reject "Floating" UI in favor of "Inlaid" UI. 

*   **The Layering Principle:** Depth is achieved through value shifts. A `surface-container-highest` (#d9e4ea) element should feel like it is "closer" to the user than a `surface` element. 
*   **Ambient Shadows:** For dropdowns or modals, do not use black shadows. Use `on_surface` (#2a3439) at 6% opacity with a `32px` blur and a `16px` Y-offset. This mimics a soft laboratory light rather than a harsh drop shadow.
*   **The Ghost Border:** For containment, use `outline_variant` (#a9b4b9) at 30% opacity. It should be just visible enough to define a boundary but thin enough to disappear when the user focuses on the content.

---

## 5. Components: The Industrial Primitive

### Buttons
*   **Primary:** Background `primary` (#4d44e3), `on_primary` (#faf6ff) text. Radius: `sm` (0.125rem) for a sharp, technical look.
*   **Secondary:** Background `surface_container_high` (#e1e9ee), `on_surface` text. No border.
*   **Tertiary:** No background. `on_surface_variant` text. High-contrast `on_surface` on hover.

### Input Fields
*   **Styling:** Background `surface_container_lowest` (#ffffff). Border `outline_variant` (#a9b4b9).
*   **Focus State:** 1px solid `primary` (#4d44e3) with a 2px "echo" (a `primary` ring at 10% opacity).
*   **Data Entry:** Use `label-md` (Space Grotesk) for the input text itself to reinforce the engineering aesthetic.

### Cards & Lists
*   **The "No-Divider" Rule:** Never use `<hr>` tags or border-bottoms for list items. Use 12px of vertical `surface-container-low` padding to separate items. If separation is needed, use a 1-step tonal shift between alternating rows.

### Additional Components: The "Command Bar"
*   **The Command Palette:** A floating `surface-container-lowest` container with a 1px `outline_variant` border. This is the heart of a "Developer Tool"—it should be triggered by `Cmd+K` and utilize `label-md` for shortcut hints.

---

## 6. Do's and Don'ts

### Do
*   **Use Monospace for Numbers:** Always use `Space Grotesk` for timestamps, IDs, and counts. It ensures tabular alignment.
*   **Embrace "Tight" Radii:** Use `0.125rem` (sm) or `0.25rem` (DEFAULT). Rounder corners (lg/xl) feel too consumer-focused and "soft."
*   **Acknowledge Latency:** Use a `primary` indeterminate loading bar at the very top of the surface (0px from top) rather than spinners.

### Don't
*   **Don't use pure black:** Use `inverse_surface` (#0b0f10) for deep blacks to maintain the "ink on paper" feel.
*   **Don't use heavy shadows:** If you can't see the depth via tonal shifts, your layout is too flat; don't rely on shadows to fix it.
*   **Don't use icons without labels:** In a high-utility tool, clarity beats minimalism. Pair icons with `label-sm` text.