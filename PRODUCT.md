# better-linear

## Register

product

## Product purpose

A read-only graph view layered on top of a user's Linear workspace. The interface shows the user's open issues as a top-down dependency graph (blocks / blocked-by) and ranks ready-to-start issues by how many other issues each one would unblock. The headline question it answers is "what should I work on next?" in roughly two seconds.

## Users

Engineers who already use Linear daily. Comfortable with keyboard shortcuts. Familiar with Linear's visual vocabulary (status circles, priority labels, issue identifiers like ENG-123). Skeptical of any tool that wraps Linear without earning trust.

Primary use moments:
- Monday morning, picking the week's first issue from a backlog of fifteen assigned tickets.
- Mid-sprint, after a blocker resolves, deciding what becomes possible next.
- After standup, scanning the cycle to see which threads are stuck and which are ready.

## Tone

Quiet, confident, useful. The opposite of marketing-loud. Closer to a well-typeset reference manual than a SaaS dashboard.

## Strategic principles

1. **Information density beats decoration.** Every pixel earns a place; if it does not communicate state, structure, or affordance, it is not there.
2. **Position carries meaning.** The graph layout is the explanation. Top of canvas, no inbound edges, ready to start. Down the canvas, more dependencies. The layout *is* the documentation.
3. **One unit of contrast.** A single visual register separates "ready" from "not ready." Color is reserved for state semantics that Linear users already know (none in v1; all readability comes from typography and weight).
4. **Earned familiarity.** Linear users sit down and recognize the patterns instantly. No reinvented affordances for flavor.
5. **Degrade visibly.** Loading, empty, and error states are designed first-class, not last. A user must always know whether nothing is there or whether the app is fetching.

## Anti-references

- Generic Vercel-template SaaS dashboard with purple gradients, glassmorphism, oversized hero numbers.
- Asana, Jira: dense color, badge-heavy, panel-stuffed. Communicates "enterprise" and "complexity."
- Notion: flexible but structurally amorphous. We are *not* a content surface; we are a focused tool.
- ClickUp: kitchen-sink. Anything labelled "everything app" is the negative reference.

## Aesthetic family

Editorial-utility on warm paper. Geist Sans for UI, Geist Mono for identifiers and counts. OKLCH neutrals tinted toward warm yellow-orange at very low chroma; no pure white, no pure black. Hairline borders, predictable grids, no decoration.
