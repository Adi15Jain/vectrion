# D21 — Contribution Guidelines

| Field            | Value                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document ID**  | D21                                                                                                                                           |
| **Title**        | Contribution Guidelines                                                                                                                       |
| **Tier**         | Tier 4 — Governance & Roadmap                                                                                                                 |
| **Priority**     | P3                                                                                                                                            |
| **Status**       | Draft                                                                                                                                         |
| **Dependencies** | D01, D03, D15, D16, D17, D20                                                                                                                  |
| **Audience**     | External Contributors, Core Maintainers, First-Time Contributors                                                                              |
| **Last Updated** | 2026-05-28                                                                                                                                    |

---

## 1. Welcome

Thank you for your interest in contributing to Vectrion! This document provides everything you need to know to submit high-quality contributions to the project. Vectrion is an infrastructure-focused TypeScript SDK, and contributions should reflect production software engineering standards.

---

## 2. Types of Contributions

| Type                  | Complexity | Review Required     | Examples                                          |
| --------------------- | ---------- | ------------------- | ------------------------------------------------- |
| Documentation         | Low        | 1 maintainer        | Typo fixes, clarification, new examples           |
| Bug Fix               | Medium     | 1 maintainer        | Error handling fix, edge case correction           |
| Feature Enhancement   | Medium     | 2 maintainers       | New middleware, new guard pattern                   |
| New Package / Adapter | High       | 2 maintainers + RFC | New provider adapter, new subsystem package         |
| Architecture Change   | High       | Full team + RFC     | Core interface changes, new pipeline stages         |

---

## 3. Development Setup

### 3.1 Prerequisites

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **Git**: >= 2.30.0

### 3.2 Getting Started

```bash
# Clone the repository
git clone https://github.com/vectrion/vectrion.git
cd vectrion

# Install dependencies
pnpm install

# Build all packages
pnpm run build --filter='./packages/*'

# Run tests
npx vitest run

# Run type checking
pnpm run typecheck --filter='./packages/*'
```

### 3.3 Monorepo Structure

```
vectrion/
├── packages/
│   ├── core/            # Central SDK client (@vectrion/core)
│   ├── types/           # Shared type definitions (@vectrion/types)
│   ├── shared/          # Common utilities (@vectrion/shared)
│   ├── router/          # Routing engine (@vectrion/router)
│   ├── guard/           # Prompt safety (@vectrion/guard)
│   ├── observe/         # Observability (@vectrion/observe)
│   ├── provider-google/ # Google AI adapter
│   └── provider-ollama/ # Ollama local adapter
├── apps/
│   ├── docs/            # Documentation website
│   └── playground/      # Integration demo
└── docs/
    └── architecture/    # Architecture documents (D01-D25)
```

---

## 4. Branching Model

### 4.1 Branch Naming

```
<type>/<short-description>

Types:
  feat/     ← New feature
  fix/      ← Bug fix
  docs/     ← Documentation only
  refactor/ ← Code restructuring
  test/     ← Test additions/fixes
  chore/    ← Build, CI, dependency updates
```

**Examples**:
```
feat/streaming-api
fix/router-cheapest-tiebreak
docs/d05-provider-adapter-update
refactor/middleware-pipeline-perf
test/guard-injection-patterns
```

### 4.2 Workflow

```
1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Run the full quality gate locally:
   pnpm run build --filter='./packages/*'
   npx vitest run
   pnpm run typecheck --filter='./packages/*'
5. Commit with conventional commit messages
6. Open a Pull Request against `main`
```

---

## 5. Commit Conventions

Vectrion uses **Conventional Commits**:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 5.1 Types

| Type       | Description                    | Version Bump |
| ---------- | ------------------------------ | ------------ |
| `feat`     | New feature                    | MINOR        |
| `fix`      | Bug fix                        | PATCH        |
| `docs`     | Documentation only             | None         |
| `refactor` | Code change (no behavior)      | None         |
| `test`     | Test additions/changes         | None         |
| `chore`    | Build/CI/dependency updates    | None         |
| `perf`     | Performance improvement        | PATCH        |

### 5.2 Scopes

| Scope              | Package                    |
| ------------------ | -------------------------- |
| `core`             | `@vectrion/core`           |
| `types`            | `@vectrion/types`          |
| `shared`           | `@vectrion/shared`         |
| `router`           | `@vectrion/router`         |
| `guard`            | `@vectrion/guard`          |
| `observe`          | `@vectrion/observe`        |
| `provider-google`  | `@vectrion/provider-google`|
| `provider-ollama`  | `@vectrion/provider-ollama`|
| `docs`             | Documentation site/content |
| `playground`       | Playground app             |

### 5.3 Examples

```
feat(core): add streaming support to generate()
fix(router): correct cheapest strategy when costs are equal
docs(d05): add sequence diagram for adapter initialization
test(guard): add injection pattern for base64 evasion
chore: update tsup to v9.0
```

---

## 6. Pull Request Process

### 6.1 PR Template

```markdown
## Summary
Brief description of what this PR does.

## Type
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Refactor
- [ ] Test

## Changes
- List of specific changes made

## Testing
- How were these changes tested?
- Any new tests added?

## Checklist
- [ ] Code follows existing style conventions
- [ ] All tests pass locally
- [ ] TypeScript typecheck passes
- [ ] Documentation updated if needed
- [ ] Conventional commit message format used
```

### 6.2 Review Standards

- **All PRs** require at least 1 approval from a core maintainer
- **Architecture changes** require 2 approvals and an RFC
- **New packages** require 2 approvals and a design document
- Reviewers should check: correctness, tests, types, docs, performance impact

---

## 7. Code Standards

### 7.1 TypeScript

- Strict mode enabled (`"strict": true`)
- No `any` types without explicit justification
- All public APIs must have JSDoc documentation
- Prefer `interface` over `type` for object shapes
- Use `readonly` for immutable properties

### 7.2 File Organization

- One class per file
- Barrel exports via `index.ts`
- Tests mirror source structure: `src/client.ts` → `tests/client.test.ts`
- Test fixtures in `tests/fixtures/`

### 7.3 Error Handling

- Use Vectrion's custom error hierarchy (`VectrionError`, `VectrionProviderError`, `VectrionValidationError`)
- Never throw generic `Error` — always use typed errors
- Error messages should be actionable and include context

---

## 8. References

| Reference | Link |
| --------- | ---- |
| Conventional Commits | https://www.conventionalcommits.org/ |
| D03 — Monorepo Structure | Internal |
| D15 — Developer Experience | Internal |
| D16 — Testing Strategy | Internal |
| D17 — Build & Release | Internal |
| D20 — Semantic Versioning | Internal |
