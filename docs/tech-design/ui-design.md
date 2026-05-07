# better-linear · UI design

**Date:** 2026-05-07
**Status:** Locked (v5 mockup approved)
**Reference mockup:** `docs/tech-design/mockups/v5.html`

This is the implementation contract for the `/graph` page. It captures the locked tokens, components, and visual rules. PRODUCT.md and DESIGN.md own the higher-level "why"; this doc owns the "what to render."

## Type system

```css
--sans: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
--mono: "Geist Mono", "SF Mono", ui-monospace, monospace;

--text-xs:   0.6875rem; /* 11px — labels, meta, IDs in node */
--text-sm:   0.8125rem; /* 13px — body, node title, ready row title */
--text-base: 1rem;      /* 16px — ready-panel impact count */
--text-lg:   1.25rem;   /* 20px — reserved, unused in graph view */
```

Letter spacing: `-0.005em` for sans body, `-0.015em` for the wordmark, `-0.01em` for mono. All-caps labels (panel titles) use `0.09em` and weight 500, never bold.

Weights: 400 default, 500 for titles and ready-state IDs, 600 for the wordmark only.

Font feature settings on the body: `"ss01", "ss03", "tnum"`. Tabular numerics matter for the impact counts and meta strings.

## Color tokens (OKLCH, warm hue 80, restrained)

```css
--ink:           oklch(0.18  0.012 80);   /* primary text */
--ink-2:         oklch(0.34  0.010 80);   /* secondary text */
--muted:         oklch(0.58  0.008 80);   /* IDs, meta */
--muted-2:       oklch(0.72  0.006 80);   /* tertiary, blocked-row deemphasis */
--line:          oklch(0.91  0.006 80);   /* hairline borders */
--line-strong:   oklch(0.84  0.008 80);   /* node default border */
--line-ink:      oklch(0.40  0.010 80);   /* ready-node border (the only contrast) */
--paper:         oklch(0.965 0.005 80);   /* page background */
--app:           oklch(0.985 0.004 80);   /* app canvas, panel surface */
--surface:       oklch(0.995 0.002 80);   /* node card */
--hover:         oklch(0.94  0.006 80);   /* button/segment hover */
```

Avatars use three slightly more saturated OKLCH tints (lightness 0.78, chroma 0.05) at hues 60 (warm tan), 200 (cool slate), 140 (sage). Avatar backgrounds are picked by hashing the assignee ID into one of the three buckets, deterministic.

State semantics (`--success`, `--warning`, `--error`) are reserved as OKLCH tokens but unused in v1. They will appear only on system feedback (toasts, error banners). Never as decoration.

**Bans:** `#fff`, `#000`, plain hex grays without a tint, side-stripe borders > 1px as accents, gradient text, glassmorphism, em dashes in copy.

## Layout

Top bar 46 px. Body `grid-template-columns: 1fr 305px`. Footer 36 px. Right panel fixed 305 px, the graph canvas takes the rest. App card is `border-radius: 10px`, single elevation:

```css
box-shadow: 0 1px 0 oklch(0.18 0.012 80 / 0.02),
            0 30px 80px -36px oklch(0.18 0.012 80 / 0.18);
```

Nodes are absolutely positioned within the canvas. Layout is computed by dagre with `rankdir: TB`, then mapped to absolute pixel positions (no SVG node rendering, plain divs).

## Components

### Topbar

- **Wordmark** (left): "better-linear", weight 600, `--text-sm`, `letter-spacing: -0.02em`.
- **Scope segmented control** (left, after wordmark): `My Work | Project | Cycle | Team`. Active state has `--hover` background and `--ink` color, weight 500. Inactive is `--muted`. Hover applies `--hover` to inactive items.
- **Sub-picker** (left, conditional): appears when scope is Project / Cycle / Team. Inline, divider on the left, format `Project ▾ <name>`. Click opens a small popover (component below).
- **Filters button** (right): "Filters 2" with the count in mono `--muted`. Opens a filter sheet popover.
- **Show-done toggle** (right): icon button (28×28), checkmark-in-circle icon. On state inverts colors.
- **Refresh** (right): icon button (28×28), circular arrow icon. Spins on refetch.

### Node card

- 220 px wide, auto height. `--surface` background, 1 px `--line-strong` border, 5 px radius.
- Padding 10 px / 12 px.
- Header row: status circle, ID, avatar (right-aligned via margin-left auto).
- Title: `--text-sm`, weight 500, line-clamp 2.
- Meta row: `--text-xs` mono, format `P{0..3} · <team>`.
- **Ready state:** border swaps to `--line-ink`. ID swaps to `--ink` color, weight 500.
- **Dimmed state** (selection): opacity 0.32, transition 180 ms cubic-bezier(0.22, 1, 0.36, 1).

### Status circle

11×11 px, 1.25 px border in `--ink-2`.
- `todo`: transparent fill.
- `in-progress`: conic-gradient half-fill in `--ink-2`.
- `done`: solid fill `--ink-2`.

(Done is hidden by default; toggling Show-Done in the toolbar reveals.)

### Avatar

18 px circle in node header, 14 px in the Ready panel meta row. Single initial of the first name in mono, 9 px (or 8 px for the small variant), weight 500. Background hue picked by hashing assignee UUID into one of three OKLCH buckets.

### Edge

Orthogonal stepped path, 1.25 px stroke in `--line-strong`, no arrowhead, no fill. Routed center-bottom of source to center-top of target via a midpoint at the vertical halfway between layers. Direction is implicit from vertical position (top blocks bottom). Computed in code from dagre's edge routing output.

### Ready panel

- Section header: `Ready to work` with mono count to the right.
- Each row:
  - Head: ID (mono `--text-xs` `--muted`) and title (`--text-sm` weight 500 `--ink`).
  - Impact line: count (mono `--text-base` weight 500 `--ink`), label "issues unblock" (`--text-sm` `--ink-2`).
  - Meta row: small avatar, full assignee name, priority, team. All `--text-xs` mono `--muted`.
- Sort order: descending by `unblock_count * 10 + (5 - priority)`, ties broken by `updatedAt` descending.

### Blocked rows

Same structure minus the impact line. Title and IDs deemphasize to `--ink-2` and `--muted-2`. Meta line reads `waiting on ENG-642, ENG-651` in mono.

### Footer

36 px, `--text-xs` mono. Stats on the left (`7 issues`, `3 ready`, `4 blocked`, `updated 12s ago`). Help link on the right (`<kbd>?</kbd> shortcuts`). `<kbd>` styled with `--hover` background, 3 px radius.

## Interaction

- **Click a node** → all nodes outside its dependency closure (transitive ancestors and descendants) get `dim` class. Click on empty canvas to clear.
- **Click a Ready row** → pan/zoom the graph to center the corresponding node, briefly outline it.
- **Hover a node** → tooltip with full title (in case of clamp), assignee, project, last update. 250 ms open delay, 100 ms close.
- **Keyboard:** `?` opens shortcut panel. `r` refresh. `1`/`2`/`3`/`4` switch scope. `Esc` clears selection.

## Motion

- Opacity and color transitions only. 150–200 ms. `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart).
- No layout animation. No bounce. No staggered entrance choreography.
- Selection dim: 180 ms.

## Empty / loading / error

- **Loading:** the graph canvas shows a 1 px hairline pulse on the topbar progress region (planned, out of v1 mock). Skeleton is not used because there is nothing to skeleton: the canvas is meaningfully empty until data arrives.
- **Empty (no assigned issues):** centered, max-width 320 px: `<title>Nothing assigned to you.</title> <body>Switch scope or pick a project.</body>` Both lines `--ink-2`.
- **Empty Ready panel:** `Nothing ready right now.` followed by `Resolve any blocker to unblock work.` Both `--text-sm` `--ink-2`.
- **Error (Linear 401):** the graph canvas is replaced by a centered card: `Linear sign-in expired.` plus a `Sign in again` button. No retry loop.
- **Error (Linear 429):** toast, top-right, autodismiss 6 s. `Linear is rate-limiting us. Retry in N seconds.` Refresh button disabled until the retry-after.

## Responsive

Out of scope for v1. Below 1024 px, render a card: `better-linear works best on a wider screen.` and link to a static "what is this" page.

## Accessibility

- All interactive elements reachable by Tab. Focus ring uses `outline: 2px solid var(--ink); outline-offset: 2px;`.
- Status circle paired with `aria-label="Todo" / "In Progress" / "Done"`.
- Avatars have `title` attribute and `aria-label`.
- Edges are decorative; nodes carry the semantic relationship via `aria-describedby` to a hidden list of blockers.
- Color is never the only signal: ready state is reinforced by border weight, ID weight, and panel position.

## Open questions, deferred to v1.1

- "Show downstream impact halo" on hover (highlight closure without click) — flagged once and rejected for v1 to keep the click model unambiguous.
- A "critical path" overlay that highlights the longest dependency chain.
- Drag-to-pan keyboard shortcut.
- A second density mode ("compact") with smaller nodes for >100 issue workspaces.
