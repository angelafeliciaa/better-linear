# Frontend Rules — Cedar Roots

These rules are **mandatory** for all frontend changes. Violations must be fixed before committing.

---

## Design Language: Warm Refined

Cedar Roots uses a **warm, refined, clean internal tool** aesthetic. This is NOT cedar-ui's glass morphism / deep space theme, and NOT brutalism.

Core principles:
- **Warm palette** — cream background (`--bg: #f6f5f3`), white surfaces (`--surface: #ffffff`), warm gray borders (`--border: #ddd8d0`), gold accent (`--accent: #c9a96e`)
- **Typography** — DM Sans for body/UI chrome, IBM Plex Mono for data/code values
- **Rounded corners** — 6px on buttons, 10px on modals, 20px pill on status badges
- **Sidebar navigation** — 232px fixed sidebar with brand, nav sections, and user avatar
- **Status badges** — colored dot + pill background (not plain uppercase text); green `#5a9a6e`, amber `#b8913a`, red `#c4594a`, orange `#c47a3a`, gray `#b5b0a8`
- **Subtle polish** — mild shadows on modals, hover states (`--hover: #f9f8f6`), clean transitions
- **Dense but polished** — information-first table layout with sticky headers, not sparse

---

## Types & Props

- Use `type` or `interface` for all component props. Export only if shared across files.
- Props must be as narrow as possible — **no `any`**, avoid `unknown` unless genuinely needed.
- Prefer required props. Only make props optional when the UX truly allows omission.
- Type callback signatures explicitly: `(value: string) => void`, never `Function`.
- Define types near the component that uses them, not in a distant shared file (unless reused).

---

## Component Design

- One file exports **one main component** and optionally a couple of tiny helpers.
- If a component exceeds **~200 lines**, extract subcomponents or hooks.
- Never build "god components" that own both data fetching and complex layout. Split into:
  - **Container** — fetches data, handles loading/error states.
  - **View** — purely renders props. No data fetching, no side effects.

---

## State & Effects

- Treat React state as a **minimal source of truth**. Derive values instead of storing duplicates.
- Store `items`, derive `filteredItems` via `useMemo` — never store both.
- Keep `useEffect` dependency arrays correct. If it's hard, you're mixing concerns — split the hook.
- Extract reusable stateful logic into custom hooks.

---

## JSX & Markup

- Use semantic HTML: `table`, `thead`, `tbody`, `tr`, `th`, `td` for tabular data (this is a database view).
- **Never use `<div onClick>`** when you mean a button. Keyboard and screen readers break.
- Always set `type="button"` on buttons that are NOT form submissions.
- Use `<a href>` for navigation, not `<button onClick>` with router push.

---

## Accessibility

- Every interactive element must be **keyboard-reachable** and announce a clear label.
- Icon-only buttons must have `aria-label` or visually hidden text.
- Never rely on color alone to communicate state — add text labels alongside status colors.
- Ensure sufficient color contrast — the warm palette's dark text (`--text: #1a1a1a`) on light backgrounds meets this by default, but verify for secondary text and status indicators.
- Tables must use proper `<th scope="col">` headers.

---

## Styling & Class Names

- Use **Tailwind CSS** consistently — this is the project standard.
- Use `cn()` or `clsx()` for conditional classes. **Never use inline string concatenation** for class names.
- Encapsulate repeated style patterns into components or style constants.
- Use CSS variables for all colors — never hardcode hex values in components. Key variables: `--bg`, `--surface`, `--border`, `--border-strong`, `--text`, `--text-secondary`, `--text-tertiary`, `--accent`, `--accent-soft`, `--hover`, and status colors (`--status-green`, `--status-amber`, `--status-red`, `--status-orange`, `--status-gray`).
- Typography classes: use `font-sans` (DM Sans) for UI chrome, `font-mono` (IBM Plex Mono) for data values.

---

## Naming & File Structure

- Component files: **`PascalCase.tsx`** with the export name matching the filename.
- Hook files: **`useCamelCase.ts`** with the export name matching the filename.
- Group related components by **feature/domain**, not generic folders.
- Avoid generic names: no `Component.tsx`, `Container.tsx`, `Utils.ts`. Be descriptive.

---

## Data Flow & API Shapes

- **Never leak raw backend shapes** throughout the UI. Map API responses to view models at the boundary.
- Normalize quirky backend fields (`snake_case`, odd enums) into clean TypeScript types.
- Handle **loading, error, and empty states explicitly** — no silent blanks.

---

## Error Handling & Edge Cases

- Render **deliberate states** for every scenario: loading, error, empty, partial data.
- Show specific empty states — never a silent blank screen.
- Never swallow errors. At minimum, `console.error` or surface a toast.

---

## Performance

- In lists: use **stable keys** (IDs). Never use array indices if items can reorder or be removed.
- Avoid creating new inline functions/objects in hot render paths — extract or memoize.
- Use `React.memo`, `useMemo`, `useCallback` only when you've identified a real re-render problem.

---

## Testing

Use the TDD cycle — **write a failing test, make it pass with minimal code, then clean up** — for:

- **Components with logic** — conditionals, derived state, user interaction flows.
- **Custom hooks** — any hook that computes, transforms, or manages state.
- **Bug fixes** — always reproduce the bug as a failing test first.
- **Utilities and helpers** — pure functions are the easiest TDD target.

Skip TDD for purely visual components (layout, styling) — use Storybook for visual review instead.

Test framework: **Vitest** with `jsdom` environment. Tests should be fast, isolated, repeatable, self-validating.
