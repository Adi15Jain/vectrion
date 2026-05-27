# D11 — Token & Cost Tracking System

| Field            | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document ID**  | D11                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Title**        | Token & Cost Tracking System                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Status**       | Draft                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Priority**     | P1 — Financial Control & Visibility                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Tier**         | Tier 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Author**       | Lead Systems Architect                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Dependencies** | [D01 — Product Vision](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D01-product-vision.md), [D02 — System Architecture Overview](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D02-system-architecture-overview.md), [D03 — Monorepo Structure](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D03-monorepo-structure.md), [D04 — Runtime Lifecycle](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D04-runtime-lifecycle.md), [D05 — Provider Adapter Design](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D05-provider-adapter.md) |
| **Dependents**   | D15, D18 (and all financial reporting modules)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Created**      | 2026-05-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Last Updated** | 2026-05-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Token & Cost Subsystem Architecture](#2-token--cost-subsystem-architecture)
3. [In-Process Token Estimation](#3-in-process-token-estimation)
4. [The Dynamic Cost Registry](#4-the-dynamic-cost-registry)
5. [Multi-Dimensional Cost Attribution Tags](#5-multi-dimensional-cost-attribution-tags)
6. [Budget Limit Guardrails & Throttling Middleware](#6-budget-limit-guardrails--throttling-middleware)
7. [Telemetry Export Sinks](#7-telemetry-export-sinks)
8. [Glossary](#8-glossary)

---

## 1. Purpose

This document establishes the architecture and design specifications for the **Token & Cost Tracking Subsystem** (`@vectrion/cost`). Commercial Large Language Model APIs are billed based on asymmetric input and output token volumes. Left unmonitored, runaway agent loops, high concurrency, or suboptimal prompting structures can result in significant financial surprises.

This specification details our in-process token counter approximations, dynamic pricing databases, tag-based multi-dimensional cost attribution models, and client-side budget throttling middleware.

---

## 2. Token & Cost Subsystem Overview

The `@vectrion/cost` package tracks the financial metrics of all request execution steps. It operates as an asynchronous middleware, capturing output usages and mapping them against a local pricing index:

```
[RequestContext Input] ──► [Cost Middleware] ────► [Dynamic Pricing Index]
                                  │                      │
                                  ├──► Attribution Tags  ├──► Budget Checks
                                  │                      │
                                  └──► Normalized Cost  ──┴──► [Returned Result]
```

---

## 3. In-Process Token Estimation

While adapters return actual token counts parsed from provider response metadata (→ D05), in-process estimation is required for proactive rate limiting and budget checks before making network calls.

### 3.1 Token Estimator Interface

```typescript
export interface TokenEstimator {
    // Approximate the token count of a raw string based on model target encoding
    estimateTokenCount(text: string, model: string): number;
}
```

### 3.2 Approximation Algorithm

Vectrion uses a lightweight, in-process character-to-token ratio approximation for local validation checks:

- **English Prose**: ~4 characters per token (ratio: 0.25).
- **Source Code**: ~3 characters per token (ratio: 0.33).
- **Fallback**: The estimator calculates `Math.ceil(text.length / 4)` to generate a conservative estimation.

---

## 4. The Dynamic Cost Registry

Cost calculations utilize a localized configuration directory that maps exact pricing coefficients per 1,000,000 tokens.

```typescript
export interface ModelPricing {
    readonly inputPricePerM: number; // Price in USD per 1M prompt tokens
    readonly outputPricePerM: number; // Price in USD per 1M completion tokens
}

export class CostRegistry {
    private static registry: Map<string, ModelPricing> = new Map();

    // Retrieve pricing config for a specific model ID
    public static getPricing(model: string): ModelPricing {
        return this.registry.get(model) || { inputPricePerM: 0, outputPricePerM: 0 };
    }
}
```

---

## 5. Multi-Dimensional Cost Attribution Tags

Vectrion attribute costs dynamically by inspecting standard metadata fields appended to the request context.

### 5.1 Cost Attribution Model

Attribution values are extracted from context tags to categorize and report spending across multiple dimensions:

```typescript
export interface CostAttribution {
    teamId?: string; // ID of the development team initiating the call
    featureId?: string; // Feature name (e.g. "semantic-search")
    environment?: string; // Environment designation ("production", "staging", "dev")
}
```

### 5.2 JSON Output Schema

```json
{
    "timestamp": 1780003200000,
    "model": "gemini-1.5-pro",
    "costUsd": 0.0035,
    "attribution": {
        "teamId": "ops-team",
        "featureId": "indexing",
        "environment": "production"
    }
}
```

---

## 6. Budget Limit Guardrails & Throttling Middleware

To prevent runaway loops or budget overruns, Vectrion includes a reactive **Budget Guardrail Middleware** that blocks execution once cost thresholds are exceeded.

### 6.1 Configuration Schema

```typescript
export interface BudgetConfig {
    dailyCostCapUsd: number; // Maximum allowed spend per 24 hours
    alertThresholdPercent?: number; // Trigger alert callbacks at e.g. 80% usage
    action: 'throttle' | 'throw'; // Block requests or throw errors (Default: 'throw')
}
```

### 6.2 Throttling Flow

If the rolling 24-hour spend exceeds the configured `dailyCostCapUsd`, the budget middleware blocks the execution path, skipping network calls and raising a typed `VectrionValidationError` (with code: `BUDGET_EXCEEDED`).

---

## 7. Telemetry Export Sinks

Calculated cost objects are routed to configured telemetry sinks for persistent logging and analysis:

```typescript
export interface CostSink {
    // Save calculated cost metrics to local or remote storage
    recordCost(record: CostRecord): Promise<void> | void;
}
```

### 7.1 Bundled Sinks:

- **Local JSON Sink**: Appends cost records directly to `.vectrion/costs.jsonl`.
- **Custom Callback Sink**: Forwards data to internal company endpoints (e.g., Datadog, internal billing systems).

---

## 8. Glossary

- **Token**: The basic semantic unit (word fragment or character sequence) processed by Large Language Models.
- **Cost Attribution**: Categorizing and tagging resource usage costs to specific business entities, such as teams or features.
- **Budget Throttling**: Automatically blocking new requests when spending limits are reached within a given timeframe.
- **Cost Registry**: A localized directory containing up-to-date pricing rates for supported model endpoints.
- **Token Estimation**: Using character ratios to estimate token counts before sending requests over the network.
