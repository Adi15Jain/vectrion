# D20 — Semantic Versioning & API Stability

| Field            | Value                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document ID**  | D20                                                                                                                                           |
| **Title**        | Semantic Versioning & API Stability                                                                                                           |
| **Tier**         | Tier 3 — Engineering Standards                                                                                                                |
| **Priority**     | P3                                                                                                                                            |
| **Status**       | Draft                                                                                                                                         |
| **Dependencies** | D01, D03, D08, D17                                                                                                                            |
| **Audience**     | Core Contributors, Package Consumers, Release Engineers                                                                                       |
| **Last Updated** | 2026-05-28                                                                                                                                    |

---

## 1. Executive Summary

This document defines Vectrion's versioning policy, API stability guarantees, deprecation procedures, and the contract between the SDK and its consumers. Vectrion follows **Semantic Versioning 2.0.0** (semver) with synchronized cross-package versioning.

---

## 2. Versioning Scheme

### 2.1 Semver Compliance

```
MAJOR.MINOR.PATCH[-prerelease][+build]

Examples:
  0.1.0         ← Initial development
  0.2.0-alpha.1 ← Pre-release
  1.0.0         ← First stable release
  1.1.0         ← Backward-compatible feature addition
  2.0.0         ← Breaking change
```

### 2.2 Version Semantics

| Increment | Trigger                                                        | Consumer Impact        |
| --------- | -------------------------------------------------------------- | ---------------------- |
| PATCH     | Bug fixes, performance improvements, documentation updates     | Safe to upgrade        |
| MINOR     | New features, new exports, new optional parameters             | Safe to upgrade        |
| MAJOR     | Breaking changes to public API surface                         | Requires migration     |

### 2.3 Pre-1.0 Stability Contract

While Vectrion is `< 1.0.0`:
- MINOR increments MAY include breaking changes
- PATCH increments MUST NOT include breaking changes
- The API surface is considered **unstable** but will stabilize toward `1.0.0`

---

## 3. API Surface Definition

### 3.1 What Constitutes the Public API

The public API surface is defined as **everything exported from a package's `index.ts` entry point**:

```typescript
// packages/core/src/index.ts — This IS the public API
export { Vectrion } from './client.js';
export type { VectrionConfig, GenerateRequest, GenerateResult } from './types.js';
```

### 3.2 What Is NOT Public API

- Internal module paths (e.g., `@vectrion/core/src/middleware`)
- Private class members
- Any export not re-exported from `index.ts`
- Peer dependency version ranges
- Build output file names

### 3.3 Stability Tiers

| Tier        | Marker            | Commitment                                              |
| ----------- | ----------------- | ------------------------------------------------------- |
| **Stable**  | (default)         | Breaking changes only in MAJOR versions                 |
| **Beta**    | `@beta` JSDoc tag | May change in MINOR versions with deprecation notice    |
| **Alpha**   | `@alpha` JSDoc tag| May change or be removed in any version                 |
| **Internal**| `@internal` JSDoc | Not part of the public API, may change without notice   |

```typescript
/**
 * Generate a response from an AI provider.
 * @stable
 */
export async function generate<T>(request: GenerateRequest<T>): Promise<GenerateResult<T>> { ... }

/**
 * Experimental streaming API.
 * @beta — May change in minor versions
 */
export async function* generateStream(request: GenerateRequest): AsyncGenerator<StreamChunk> { ... }
```

---

## 4. Breaking Change Policy

### 4.1 Definition of a Breaking Change

A change is considered **breaking** if it causes existing consumer code that was correct under the previous version to fail (compilation error, runtime error, or behavioral change).

**Breaking changes include**:
- Removing or renaming an exported symbol
- Changing a function's required parameters
- Changing return type shape (narrowing is safe, widening is breaking)
- Removing or renaming interface properties
- Changing enum values
- Changing error types thrown

**NOT breaking**:
- Adding new optional parameters
- Adding new exports
- Adding new interface properties (if the interface is not implemented by consumers)
- Widening a union type
- Improving error messages

### 4.2 Deprecation Process

1. **Mark**: Add `@deprecated` JSDoc tag with replacement guidance
2. **Warn**: Emit a runtime deprecation warning (once per process)
3. **Document**: Add to the changelog and migration guide
4. **Wait**: Maintain the deprecated API for at least 2 MINOR versions
5. **Remove**: Remove in the next MAJOR version

```typescript
/**
 * @deprecated Use `generate()` instead. Will be removed in v2.0.0.
 */
export function executePrompt(prompt: string): Promise<string> {
  if (!executePrompt._warned) {
    console.warn('[vectrion] executePrompt() is deprecated. Use generate() instead.');
    executePrompt._warned = true;
  }
  return this.generate({ model: 'auto', prompt }).then(r => r.data);
}
```

---

## 5. Synchronized Versioning

All `@vectrion/*` packages share the same version number. This means:

- A breaking change in ANY package triggers a MAJOR bump for ALL packages
- Consumers can always use `@vectrion/core@X.Y.Z` with `@vectrion/router@X.Y.Z`
- Cross-package compatibility is guaranteed by version equality

### 5.1 Why Synchronized Versioning

Independent versioning creates a compatibility matrix:
```
core@1.2.0 + router@1.0.0 → ❓ Compatible?
core@1.2.0 + router@1.2.0 → ✅ Known compatible
```

Synchronized versioning eliminates this ambiguity entirely.

---

## 6. Migration Guides

Every MAJOR version release MUST include a migration guide:

```markdown
# Migrating from v1.x to v2.0

## Breaking Changes

### `Vectrion` constructor signature changed
**Before (v1.x)**:
const ai = new Vectrion(providers, options);

**After (v2.0)**:
const ai = new Vectrion({ providers, ...options });

### `executePrompt()` removed
Use `generate()` instead:
const result = await ai.generate({ model: 'auto', prompt: '...' });
```

---

## 7. References

| Reference | Link |
| --------- | ---- |
| Semantic Versioning 2.0.0 | https://semver.org/ |
| D03 — Monorepo Structure | Internal |
| D08 — SDK API Surface | Internal |
| D17 — Build & Release | Internal |
