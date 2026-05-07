# better-linear · DESIGN

## Color (OKLCH, restrained)

All neutrals tinted toward warm hue 80 at chroma 0.005 to 0.012. No `#fff`, no `#000`.

| Token | Value | Use |
|---|---|---|
| `--ink` | `oklch(0.18 0.012 80)` | Primary text, ink-grade weight, ready-state ID |
| `--ink-2` | `oklch(0.34 0.010 80)` | Secondary text, button labels |
| `--muted` | `oklch(0.58 0.008 80)` | Tertiary text, IDs, meta strings |
| `--line` | `oklch(0.91 0.006 80)` | Hairline 1px borders, panel dividers |
| `--line-strong` | `oklch(0.84 0.008 80)` | Node default border |
| `--line-ink` | `oklch(0.40 0.010 80)` | Ready-node full border |
| `--paper` | `oklch(0.97 0.005 80)` | Page background, the warm-paper field |
| `--app` | `oklch(0.985 0.004 80)` | App canvas, panel surfaces |
| `--surface` | `oklch(0.995 0.002 80)` | Node card, the lightest tier |
| `--hover` | `oklch(0.94 0.006 80)` | Hover background for buttons, segmented controls |

Color strategy: **Restrained.** Tinted neutrals plus exactly one accent, the `--ink` border around Ready nodes. Accent occupies less than 10 percent of canvas area at any time.

State semantics (added in code, not the static mock): `--success`, `--warning`, `--error` reserved as semantic OKLCH tokens, used only on system feedback, never decoration.

## Typography

One family for UI. One mono for identifiers, counts, and tabular data.

- **Sans:** Geist (400, 500, 600). Loaded from Google Fonts.
- **Mono:** Geist Mono (400, 500). For issue IDs, unblock counts, status strings, and the footer.

Scale, fixed in rem (1rem = 16px), ratio ~1.18 to 1.25:

| Step | Size | Used for |
|---|---|---|
| `--text-xs` | `0.6875rem` (11px) | Footer, panel-title labels, node meta |
| `--text-sm` | `0.8125rem` (13px) | Body, node title, ready-row title |
| `--text-base` | `1rem` (16px) | Ready-panel impact line ("Unblocks 4 issues") |
| `--text-lg` | `1.25rem` (20px) | Reserved for hero counts, not used in graph view |

Weights:
- Default body: 400
- Section titles, button labels, ready-state IDs: 500
- Counts in ready panel ("4"): 500 mono

Letter spacing: `-0.005em` for sans body, `-0.015em` for the wordmark, `-0.01em` for mono. Capitalized labels (panel titles) use `0.09em` tracking, never bold.

## Layout

- Predictable two-column body: graph canvas left, ready panel right at fixed 304px.
- Topbar 46px, footer 36px.
- Panel sections vary padding by content density: 16px y for ready rows, 20px y for the section header.
- No CSS containers around content blocks unless they semantically belong (the graph canvas is its own surface; the right panel is its own surface).

## Borders and elevation

- Hairline 1px borders only. No 2px or thicker borders anywhere.
- One elevation in the entire UI: the app card itself, with `0 1px 0 oklch(0.18 0.012 80 / 0.02), 0 30px 80px -36px oklch(0.18 0.012 80 / 0.18)`. Nodes sit flat on the canvas, no shadow.
- Border radius: 5px on nodes, 4px on buttons, 10px on the app card. No fully rounded corners.

## Motion

- Transitions on opacity and color only, 150 to 200 ms, ease-out-quart.
- No layout animation. No bounce. No staggered entrance choreography. The product loads into a task; users do not want to watch it load.

## Components present in v1

- Topbar with wordmark, scope segmented control, conditional sub-picker, filter button, icon buttons (Show Done, Refresh).
- Graph canvas with node component (3 states: default, ready, dimmed-on-selection), orthogonal hairline edges with no arrowheads.
- Right panel with section heading and two list types (ready row, blocked-muted row).
- Footer with stats and shortcut hint.

Each interactive component has, in code: default, hover, focus, active, loading, disabled. The static mock shows default plus ready.

## Banned in this codebase

- Side-stripe borders greater than 1px as colored accents. This was the v3 mistake; corrected.
- `#000`, `#fff`, plain hex grays without a tint.
- Em dashes in copy. Use commas, colons, semicolons, periods, or parentheses.
- Gradient text.
- Glassmorphism as decoration.
- Display fonts in any UI label.
- Custom scrollbars, custom form controls.
