# D17 — Build, Release & CI/CD Architecture

| Field            | Value                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document ID**  | D17                                                                                                                                           |
| **Title**        | Build, Release & CI/CD Architecture                                                                                                           |
| **Tier**         | Tier 3 — Engineering Standards                                                                                                                |
| **Priority**     | P3                                                                                                                                            |
| **Status**       | Draft                                                                                                                                         |
| **Dependencies** | D01, D02, D03, D16                                                                                                                            |
| **Audience**     | Core Contributors, Release Engineers, DevOps                                                                                                  |
| **Last Updated** | 2026-05-28                                                                                                                                    |

---

## 1. Executive Summary

This document specifies Vectrion's build system architecture, release pipeline, artifact generation strategy, and continuous integration/delivery workflows. The build system must produce correct ESM, CJS, and TypeScript declaration outputs for all packages while maintaining sub-10-second cold build times across the monorepo.

---

## 2. Build Toolchain

### 2.1 Build Tool: tsup

Every package in the Vectrion monorepo uses **tsup** (powered by esbuild) as its build tool:

```typescript
// packages/<name>/tsup.config.ts (canonical template)
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'es2022',
});
```

**Output artifacts per package**:

| Artifact          | Path               | Purpose                        |
| ----------------- | ------------------ | ------------------------------ |
| ESM Bundle        | `dist/index.js`    | Modern `import` consumers      |
| CJS Bundle        | `dist/index.cjs`   | Legacy `require()` consumers   |
| Type Declarations | `dist/index.d.ts`  | TypeScript consumers           |
| Source Maps        | `dist/*.map`       | Debug and error tracing        |

### 2.2 Package Exports Configuration

Every package declares conditional exports:

```json
{
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

### 2.3 Build Orchestration: Turborepo

Turborepo manages build task dependencies and caching:

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["tsconfig.json"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

**Build Dependency Resolution**:

```
@vectrion/types      ← builds first (zero dependencies)
@vectrion/shared     ← depends on types
@vectrion/core       ← depends on types, shared
@vectrion/router     ← depends on types, shared
@vectrion/guard      ← depends on types, shared
@vectrion/observe    ← depends on types, shared
@vectrion/provider-* ← depends on types, shared
```

---

## 3. Monorepo Package Manager: pnpm

### 3.1 Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### 3.2 Workspace Protocol

All internal dependencies use the `workspace:*` protocol:

```json
{
  "dependencies": {
    "@vectrion/types": "workspace:*",
    "@vectrion/shared": "workspace:*"
  }
}
```

This ensures:
- Development always uses the local source
- `pnpm publish` automatically replaces `workspace:*` with the actual version at publish time
- No circular dependency risk (enforced by the build DAG)

---

## 4. CI/CD Pipeline Architecture

### 4.1 Pipeline Overview

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Install  │───▶│  Build   │───▶│  Check   │───▶│ Publish  │
│  (pnpm)  │    │  (tsup)  │    │(test/lint│    │  (npm)   │
│          │    │          │    │/typecheck│    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### 4.2 CI Workflow (Pull Requests)

```yaml
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build --filter='./packages/*'
      - run: pnpm run typecheck --filter='./packages/*'
      - run: npx vitest run --reporter=verbose --coverage
      - run: pnpm run lint --filter='./packages/*'
```

### 4.3 Release Workflow

```yaml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build --filter='./packages/*'
      - run: npx vitest run
      - run: pnpm -r publish --access public --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 5. Versioning Strategy

### 5.1 Synchronized Versioning

All `@vectrion/*` packages share the **same version number** at all times. This eliminates cross-package version matrix complexity:

```
@vectrion/core@0.2.0
@vectrion/types@0.2.0
@vectrion/shared@0.2.0
@vectrion/router@0.2.0
// ... all 0.2.0
```

### 5.2 Version Bumping

Versions are bumped using a single root-level script:

```bash
# Bump all packages to the next patch/minor/major
node scripts/bump-version.mjs patch   # 0.1.0 → 0.1.1
node scripts/bump-version.mjs minor   # 0.1.0 → 0.2.0
node scripts/bump-version.mjs major   # 0.1.0 → 1.0.0
```

### 5.3 Changelog Generation

Changelogs are generated from conventional commit messages:

```
feat(core): add streaming support to generate()
fix(router): correct cheapest strategy tie-breaking logic
docs(d05): update provider adapter interface specification
```

---

## 6. Build Performance Budget

| Metric                  | Target       | Current      |
| ----------------------- | ------------ | ------------ |
| Cold build (all pkgs)   | < 10s        | ~4.8s ✅     |
| Warm build (cached)     | < 1s         | ~0.3s ✅     |
| Single package build    | < 1s         | ~0.5s ✅     |
| DTS generation          | < 2s/pkg     | ~0.4s ✅     |
| `pnpm install` (cached) | < 5s         | ~2s ✅       |
| Full CI pipeline        | < 3min       | TBD          |

---

## 7. Artifact Integrity

### 7.1 Pre-Publish Checks

Before any publish, the following must pass:

1. `pnpm run build` — All packages compile
2. `pnpm run typecheck` — Zero TypeScript errors
3. `npx vitest run` — All tests pass
4. `pnpm pack --dry-run` — Package contents are correct
5. `publint` — Package.json exports are valid

### 7.2 publint Integration

```bash
npx publint packages/core
npx publint packages/router
# ... for each publishable package
```

`publint` validates:
- `exports` field correctness
- `main`/`module`/`types` field resolution
- ESM/CJS interop correctness
- Missing files in the package

---

## 8. References

| Reference | Link |
| --------- | ---- |
| tsup Documentation | https://tsup.egoist.dev/ |
| Turborepo Pipeline | https://turbo.build/repo/docs |
| pnpm Workspaces | https://pnpm.io/workspaces |
| publint | https://publint.dev/ |
| D03 — Monorepo Structure | Internal |
| D16 — Testing Strategy | Internal |
| D20 — Semantic Versioning | Internal |
