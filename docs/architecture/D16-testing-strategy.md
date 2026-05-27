# D16 — Testing Strategy & Quality Architecture

| Field            | Value                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document ID**  | D16                                                                                                                                           |
| **Title**        | Testing Strategy & Quality Architecture                                                                                                       |
| **Tier**         | Tier 3 — Engineering Standards                                                                                                                |
| **Priority**     | P3                                                                                                                                            |
| **Status**       | Draft                                                                                                                                         |
| **Dependencies** | D01, D02, D03, D04, D05, D06, D07                                                                                                            |
| **Audience**     | Core Contributors, Package Maintainers, CI/CD Engineers                                                                                       |
| **Last Updated** | 2026-05-28                                                                                                                                    |

---

## 1. Executive Summary

This document defines Vectrion's comprehensive testing strategy: the testing pyramid, test categorization, tooling choices, coverage targets, mock/adapter patterns, and the integration of automated quality gates within the CI/CD pipeline. Vectrion adopts a **shift-left** testing philosophy — catch defects as early as possible through rigorous, layered, and reproducible automated testing at every boundary.

---

## 2. Testing Philosophy

### 2.1 Core Principles

1. **Deterministic by Default**: Every test must produce the same result regardless of execution environment, ordering, or external state. No test may depend on network availability, API keys, or timing.
2. **Infrastructure Tests, Not Application Tests**: Tests validate the SDK's runtime contracts — middleware ordering, provider abstraction compliance, router strategy correctness — not end-user business logic.
3. **Boundary-Centric**: Tests focus on package boundaries and interface contracts. Each package's public API surface is the unit under test.
4. **Zero External Dependencies in CI**: All provider interactions are mocked. Live integration tests are opt-in and isolated to a separate CI stage.

### 2.2 Testing Pyramid

```
         ╭─────────────╮
         │   E2E (5%)  │   ← Playground integration, full-stack smoke tests
         ├─────────────┤
         │Integration  │   ← Cross-package contract tests (20%)
         │  (20%)      │
         ├─────────────┤
         │  Unit Tests │   ← Per-package isolated tests (75%)
         │   (75%)     │
         ╰─────────────╯
```

---

## 3. Test Categorization

### 3.1 Unit Tests

**Scope**: Single package, single module. No cross-package imports beyond type definitions.

**Location**: `packages/<name>/tests/*.test.ts`

**What is tested**:
- Pure function behavior (middleware composition, slug generation, cost calculation)
- Class method contracts (adapter initialization, router strategy selection)
- Error boundary validation (custom error types, rejection handling)
- Type narrowing behavior (generic `generate<T>()` signature correctness)

**Example**:
```typescript
// packages/core/tests/client.test.ts
import { describe, it, expect, vi } from 'vitest';
import { Vectrion } from '../src/client.js';
import { ProviderAdapter, RequestContext, NormalizedResponse } from '@vectrion/types';

class MockAdapter implements ProviderAdapter {
  public readonly providerId = 'mock';
  public readonly capabilities = {};
  public async initialize(): Promise<void> {}
  public async execute(ctx: RequestContext): Promise<NormalizedResponse> {
    return {
      id: 'mock-1',
      text: '{"result": "ok"}',
      model: ctx.request.model,
      provider: this.providerId,
      usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
      cost: { inputCostUsd: 0, outputCostUsd: 0, totalCostUsd: 0 },
      latencyMs: 1,
      rawResponse: {},
    };
  }
}

describe('Vectrion Client', () => {
  it('should execute generate and return normalized response', async () => {
    const ai = new Vectrion({ providers: [new MockAdapter()] });
    const result = await ai.generate({ model: 'test', prompt: 'Hello' });
    expect(result.response.provider).toBe('mock');
  });
});
```

### 3.2 Integration Tests

**Scope**: Cross-package interactions. Tests that verify contract compliance between packages.

**Location**: `tests/integration/*.test.ts` (monorepo root)

**What is tested**:
- Core + Router interaction (routing strategy selection, failover cascades)
- Core + Middleware pipeline (observability hooks fire in correct order)
- Core + Guard (prompt injection blocks before provider execution)
- Core + Provider Adapter (adapter interface compliance verification)

### 3.3 End-to-End Tests

**Scope**: Full playground-style workflows using mock providers.

**Location**: `tests/e2e/*.test.ts` or `apps/playground/`

**What is tested**:
- Complete request lifecycle from `ai.generate()` to typed response
- Multi-provider failover with observability trace emission
- Schema validation + guardrail + routing combined pipeline

---

## 4. Tooling

### 4.1 Test Runner: Vitest

Vectrion uses **Vitest** as the sole test runner:

```typescript
// vitest.config.ts (root)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    include: ['packages/*/tests/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/index.ts'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
    typecheck: {
      enabled: true,
    },
    passWithNoTests: true,
    reporters: ['verbose'],
  },
});
```

**Why Vitest**:
- Native ESM and TypeScript support — no transpilation step
- Compatible with `vi.fn()`, `vi.mock()`, `vi.spyOn()` for mocking
- Integrated coverage via V8 provider
- Workspace-aware — discovers tests across the monorepo
- Sub-200ms startup for the current test suite

### 4.2 Mocking Patterns

All provider interactions use **mock adapters** that implement the `ProviderAdapter` interface:

```typescript
// Shared test fixture: packages/core/tests/fixtures/mock-adapters.ts

export class SuccessMockAdapter implements ProviderAdapter {
  public readonly providerId = 'success-mock';
  public readonly capabilities = {};
  public async initialize(): Promise<void> {}
  public async execute(ctx: RequestContext): Promise<NormalizedResponse> {
    return { id: 'mock-1', text: 'ok', model: ctx.request.model, /* ... */ };
  }
}

export class FailureMockAdapter implements ProviderAdapter {
  public readonly providerId = 'failure-mock';
  public readonly capabilities = {};
  public async initialize(): Promise<void> {}
  public async execute(): Promise<NormalizedResponse> {
    throw new Error('Simulated provider failure');
  }
}

export class LatencyMockAdapter implements ProviderAdapter {
  constructor(private delayMs: number) {}
  public readonly providerId = 'latency-mock';
  public readonly capabilities = {};
  public async initialize(): Promise<void> {}
  public async execute(ctx: RequestContext): Promise<NormalizedResponse> {
    await new Promise(r => setTimeout(r, this.delayMs));
    return { id: 'mock-1', text: 'delayed', model: ctx.request.model, /* ... */ };
  }
}
```

### 4.3 Assertion Patterns

```typescript
// Response shape assertions
expect(result.response).toMatchObject({
  provider: expect.any(String),
  usage: {
    promptTokens: expect.any(Number),
    completionTokens: expect.any(Number),
    totalTokens: expect.any(Number),
  },
  cost: {
    totalCostUsd: expect.any(Number),
  },
});

// Error type assertions
await expect(ai.generate({ ... })).rejects.toThrow(VectrionValidationError);
await expect(ai.generate({ ... })).rejects.toThrow(/safety verification/);

// Middleware ordering assertions
const callOrder: string[] = [];
ai.use(async (ctx, next) => { callOrder.push('A-pre'); await next(); callOrder.push('A-post'); });
ai.use(async (ctx, next) => { callOrder.push('B-pre'); await next(); callOrder.push('B-post'); });
await ai.generate({ ... });
expect(callOrder).toEqual(['A-pre', 'B-pre', 'B-post', 'A-post']);
```

---

## 5. Coverage Targets

| Package              | Statements | Branches | Functions | Lines |
| -------------------- | ---------- | -------- | --------- | ----- |
| `@vectrion/core`     | 90%        | 85%      | 90%       | 90%   |
| `@vectrion/types`    | N/A        | N/A      | N/A       | N/A   |
| `@vectrion/shared`   | 85%        | 80%      | 85%       | 85%   |
| `@vectrion/router`   | 90%        | 85%      | 90%       | 90%   |
| `@vectrion/guard`    | 85%        | 80%      | 85%       | 85%   |
| `@vectrion/observe`  | 80%        | 75%      | 80%       | 80%   |
| Provider Adapters    | 75%        | 70%      | 75%       | 75%   |

> [!IMPORTANT]
> `@vectrion/types` is a pure type-definition package and is exempt from runtime coverage metrics. Its correctness is validated via `tsc --noEmit` typecheck.

---

## 6. Test Naming Conventions

```
should <expected_behavior> when <condition_or_trigger>
```

**Examples**:
- `should return normalized response when provider executes successfully`
- `should throw VectrionValidationError when response text is not valid JSON`
- `should route to cheapest provider when strategy is set to cheapest`
- `should fire pre-hook before provider execution and post-hook after`

---

## 7. CI Integration

### 7.1 Pipeline Stages

```yaml
# .github/workflows/ci.yml (conceptual)
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - run: pnpm install --frozen-lockfile
    - run: pnpm run build --filter='./packages/*'
    - run: npx vitest run --reporter=verbose --coverage
    - uses: codecov/codecov-action@v4
      with:
        files: coverage/lcov.info
```

### 7.2 Quality Gates

| Gate                   | Threshold         | Enforcement         |
| ---------------------- | ----------------- | ------------------- |
| All tests pass         | 100%              | PR merge blocker    |
| Coverage (statements)  | ≥80% global       | PR merge blocker    |
| TypeScript typecheck   | Zero errors       | PR merge blocker    |
| ESLint                 | Zero errors       | PR merge blocker    |
| Build success          | All packages      | PR merge blocker    |

### 7.3 Pre-Commit Hooks

```json
// .husky/pre-commit (conceptual)
{
  "hooks": {
    "pre-commit": "npx lint-staged"
  }
}
```

```json
// lint-staged.config.js
{
  "packages/*/src/**/*.ts": [
    "eslint --fix",
    "vitest related --run"
  ]
}
```

---

## 8. Future Considerations

- **Property-Based Testing**: Adopt `fast-check` for fuzzing middleware composition and router strategy edge cases.
- **Mutation Testing**: Evaluate `stryker-mutator` to measure test effectiveness beyond line coverage.
- **Snapshot Testing**: Consider snapshot tests for serialized `NormalizedResponse` shapes to catch accidental contract breakage.
- **Benchmarking**: Add `vitest bench` for middleware pipeline throughput and router strategy selection latency.

---

## 9. References

| Reference | Link |
| --------- | ---- |
| Vitest Documentation | https://vitest.dev/ |
| V8 Coverage Provider | https://vitest.dev/guide/coverage |
| Testing Pyramid (Martin Fowler) | https://martinfowler.com/bliki/TestPyramid.html |
| D04 — Runtime Lifecycle | Internal |
| D15 — Developer Experience Standards | Internal |
