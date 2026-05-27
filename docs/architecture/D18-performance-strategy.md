# D18 — Performance Strategy & Budgets

| Field            | Value                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document ID**  | D18                                                                                                                                           |
| **Title**        | Performance Strategy & Budgets                                                                                                                |
| **Tier**         | Tier 3 — Engineering Standards                                                                                                                |
| **Priority**     | P3                                                                                                                                            |
| **Status**       | Draft                                                                                                                                         |
| **Dependencies** | D01, D02, D04, D06                                                                                                                            |
| **Audience**     | Core Contributors, Performance Engineers                                                                                                      |
| **Last Updated** | 2026-05-28                                                                                                                                    |

---

## 1. Executive Summary

Vectrion is an infrastructure SDK that sits on the hot path of every AI inference call. Every microsecond of overhead added by the SDK is overhead multiplied by every request in production. This document defines performance budgets, profiling methodologies, and optimization strategies to ensure Vectrion remains a near-zero-overhead runtime layer.

---

## 2. Performance Philosophy

### 2.1 Core Principle: Infrastructure Tax Must Be Invisible

The SDK's total overhead — from `ai.generate()` call entry to provider HTTP dispatch — must be negligible compared to the provider's network latency (typically 200ms–5000ms). The SDK's internal processing budget is **< 1ms** for the complete middleware + routing pipeline.

### 2.2 Budgeting Model

```
Total Request Time = SDK Overhead + Network Latency + Provider Processing

Where:
  SDK Overhead = Middleware Pipeline + Router Selection + Schema Validation + Response Normalization
  Target: SDK Overhead < 1ms (p99)
  Provider Processing: 200ms - 5000ms (not under SDK control)
```

---

## 3. Performance Budgets

### 3.1 Runtime Budgets

| Operation                        | Budget (p50) | Budget (p99) | Notes                            |
| -------------------------------- | ------------ | ------------ | -------------------------------- |
| Middleware pipeline (5 layers)   | < 0.1ms      | < 0.5ms      | Pre + post hooks, onion model    |
| Router strategy selection        | < 0.05ms     | < 0.2ms      | Map lookup + sort                |
| Zod schema validation            | < 0.2ms      | < 1.0ms      | Depends on schema complexity     |
| Response normalization           | < 0.05ms     | < 0.1ms      | Object construction              |
| Observability trace emission     | < 0.1ms      | < 0.5ms      | Async JSONL write (non-blocking) |
| Guard/prompt safety check        | < 0.1ms      | < 0.3ms      | Regex pattern matching           |
| **Total SDK overhead**           | **< 0.5ms**  | **< 2.0ms**  | —                                |

### 3.2 Build & Startup Budgets

| Metric                           | Budget       | Current      |
| -------------------------------- | ------------ | ------------ |
| Package bundle size (ESM)        | < 10KB/pkg   | 1–4KB ✅     |
| `new Vectrion()` initialization  | < 5ms        | < 1ms ✅     |
| Cold `import` time               | < 50ms       | ~20ms ✅     |
| Full monorepo build              | < 10s        | ~4.8s ✅     |

### 3.3 Memory Budgets

| Metric                           | Budget       | Notes                            |
| -------------------------------- | ------------ | -------------------------------- |
| Base SDK memory footprint        | < 5MB        | After initialization, idle       |
| Per-request memory allocation    | < 100KB      | RequestContext + response buffer |
| Observability buffer             | < 1MB        | Before flush to JSONL file       |
| Memory leak detection threshold  | 0            | No growth over 10K requests      |

---

## 4. Zero-Allocation Hot Path Design

### 4.1 Object Pooling

The middleware pipeline reuses `RequestContext` objects where possible to minimize garbage collection pressure:

```typescript
// Conceptual — context reuse pattern
const contextPool: RequestContext[] = [];

function acquireContext(request: GenerateRequest): RequestContext {
  const ctx = contextPool.pop() || { request: null, metadata: {}, response: undefined };
  ctx.request = request;
  ctx.metadata = {};
  ctx.response = undefined;
  return ctx;
}

function releaseContext(ctx: RequestContext): void {
  contextPool.push(ctx);
}
```

### 4.2 Lazy Initialization

Expensive operations are deferred until first use:

```typescript
// Provider adapters initialize lazily on first execute()
class GoogleProviderAdapter implements ProviderAdapter {
  private initialized = false;

  async execute(ctx: RequestContext): Promise<NormalizedResponse> {
    if (!this.initialized) {
      await this.initialize();
      this.initialized = true;
    }
    // ... execute
  }
}
```

### 4.3 Async Non-Blocking Traces

Observability traces are written asynchronously and never block the request path:

```typescript
// Trace emission is fire-and-forget
export function observabilityMiddleware(config: ObserveConfig): Middleware {
  return async (ctx, next) => {
    const start = performance.now();
    await next();
    const duration = performance.now() - start;

    // Non-blocking — do not await
    writeTrace({
      timestamp: Date.now(),
      provider: ctx.response?.provider,
      latencyMs: duration,
      usage: ctx.response?.usage,
    }).catch(() => {}); // Silently ignore write failures
  };
}
```

---

## 5. Profiling & Benchmarking

### 5.1 Benchmark Suite

```typescript
// benchmarks/middleware-pipeline.bench.ts
import { bench, describe } from 'vitest';
import { Vectrion } from '@vectrion/core';

describe('Middleware Pipeline Throughput', () => {
  const ai = new Vectrion({ providers: [new MockAdapter()] });

  // Add 5 middleware layers
  for (let i = 0; i < 5; i++) {
    ai.use(async (ctx, next) => { await next(); });
  }

  bench('generate() with 5 middleware layers', async () => {
    await ai.generate({ model: 'test', prompt: 'bench' });
  });
});
```

### 5.2 Profiling Commands

```bash
# CPU profile
node --cpu-prof --cpu-prof-dir=./profiles apps/playground/dist/index.js

# Heap snapshot
node --heapsnapshot-signal=SIGUSR2 apps/playground/dist/index.js

# Benchmark
npx vitest bench benchmarks/
```

### 5.3 CI Performance Regression Detection

Performance benchmarks run in CI and fail if results exceed budget thresholds:

```yaml
- name: Run Benchmarks
  run: npx vitest bench --reporter=json > benchmark-results.json
- name: Check Performance Budget
  run: node scripts/check-perf-budget.mjs benchmark-results.json
```

---

## 6. Bundle Size Policy

### 6.1 Zero Runtime Dependencies (Core)

`@vectrion/core` maintains **zero** runtime dependencies. The only exceptions are:
- `@vectrion/types` (pure types, tree-shakes to zero)
- `@vectrion/shared` (shared error classes, < 3KB)

### 6.2 Tree-Shaking Verification

```bash
# Verify tree-shaking effectiveness
npx esbuild --bundle --analyze packages/core/dist/index.js
```

### 6.3 Import Cost Monitoring

Every PR that adds a new dependency must include an import cost analysis:

```
Package: new-dependency
ESM size: X KB
CJS size: Y KB
Gzip size: Z KB
Tree-shakeable: Yes/No
Justification: ...
```

---

## 7. References

| Reference | Link |
| --------- | ---- |
| Vitest Benchmarking | https://vitest.dev/guide/features#benchmarking |
| Node.js Profiling | https://nodejs.org/en/learn/diagnostics |
| D01 — Product Vision | Internal |
| D04 — Runtime Lifecycle | Internal |
| D06 — Middleware Architecture | Internal |
