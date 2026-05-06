# Git Conventions

## Branch Naming

Branches are derived from the Linear ticket:

```
CDR-{id}_{kebab-title}
```

Examples:
```
CDR-820_roots-dashboard-setup
CDR-820_roots-automation-runs-table
```

## Commit Format

Conventional Commits: `type(scope): subject`

```
feat(roots): add automation runs table view

CDR-820
```

- **Subject line** — one line, present tense, imperative mood ("add" not "added")
- **Lowercase** after the colon — no capital letter
- **No period** at the end
- **50 chars max** for the subject (the part after `type(scope): `)
- **Body is optional** — one additional line max. Two lines total, never more.
- **CDR ticket trailer** — encouraged for the first commit on a branch, optional after that
- **No `Co-Authored-By` trailers** — no AI attribution lines in commits

### Commit Types

| Type | When to use |
|---|---|
| `feat` | New functionality, new behavior |
| `fix` | Bug fix |
| `refactor` | Code change that doesn't fix a bug or add a feature |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `chore` | Maintenance, deps, config — no production code change |
| `style` | Formatting, whitespace, linting — no logic change |
| `ci` | CI/CD changes |
| `perf` | Performance improvement |
| `build` | Build system or external dependency changes |

### Scopes

Scope is **optional**. Omit it for changes that span multiple areas.

| Scope | Area |
|---|---|
| `roots` | Cedar Roots dashboard (default for this repo) |
| `auth` | Authentication, Google OAuth |
| `ci` | CI/CD, deployment |
| `pkg` | Package dependencies |
| `config` | Configuration |
| `infra` | Infrastructure, Docker, Cloud Run |

## Pull Requests

- **Always create PRs as draft** — use `--draft` flag with `gh pr create`

## PR Titles

Every pull request title starts with the Linear ticket ID:

```
CDR-{id}: {short informative title}
```

- **Sentence case** after the colon
- **Under 70 characters** total
- **Describe the change**, not the ticket title verbatim

Examples:
```
CDR-820: Set up Next.js project with brutalist theme
CDR-820: Add automation runs list with search
CDR-820: Wire up create-web-session endpoint
```

## Linking to Linear

- **Branch name** includes `CDR-{id}`
- **PR title** starts with `CDR-{id}:`
- **First commit** on a branch includes `CDR-{id}` as a trailer in the body
