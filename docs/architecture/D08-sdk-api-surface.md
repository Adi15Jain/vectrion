# D08 — SDK API Surface Specification

| Field            | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document ID**  | D08                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Title**        | SDK API Surface Specification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Status**       | Draft                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Priority**     | P0 — Core Interface                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Tier**         | Tier 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Author**       | Lead Systems Architect                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Dependencies** | [D01 — Product Vision](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D01-product-vision.md), [D02 — System Architecture Overview](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D02-system-architecture-overview.md), [D03 — Monorepo Structure](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D03-monorepo-structure.md), [D04 — Runtime Lifecycle](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D04-runtime-lifecycle.md), [D05 — Provider Adapter Design](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D05-provider-adapter.md), [D06 — Middleware Architecture](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D06-middleware-architecture.md), [D07 — Router Engine Specification](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D07-router-engine.md) |
| **Dependents**   | None (End-user application facing boundary)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Created**      | 2026-05-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Last Updated** | 2026-05-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [The Core Client Signature](#2-the-core-client-signature)
3. [Compile-Time Type-Safe Schema Generation](#3-compile-time-type-safe-schema-generation)
4. [Result Structures & Unified Context Returns](#4-result-structures--unified-context-returns)
5. [API Integration Blueprints (Progressive Complexity)](#5-api-integration-blueprints-progressive-complexity)
6. [SDK Exception Hierarchy](#6-sdk-exception-hierarchy)
7. [Glossary](#7-glossary)

---

## 1. Purpose

This document establishes the public-facing application programming interface (API) specifications for the **Vectrion SDK**. To prevent runtime integration errors and API parameter drift, Vectrion maintains a highly type-safe, predictable, and ergonomic developer surface.

This specification details the signature of the primary `Vectrion` engine, its configuration parameters, Zod-based compile-time type narrowing, error structures, and progressive integration blueprints ranging from single-line prototypes to enterprise-grade pipelines.

---

## 2. The Core Client Signature

The core SDK class `@vectrion/core` exports a single constructor, configuration layout, and registration interface:

```typescript
import { z } from 'zod';
import { ProviderAdapter, RouterEngine, Middleware, NormalizedResponse } from '@vectrion/types';

export interface VectrionConfig {
    // Collection of registered provider adapters (e.g. Gemini, Ollama adapters)
    providers: ProviderAdapter[];

    // Optional custom routing engine (Defaults to SimpleDefaultRouter failover cascade)
    router?: RouterEngine;
}

export class Vectrion {
    constructor(config: VectrionConfig);

    // Appends an execution middleware to the asynchronous Onion pipeline
    public use(middleware: Middleware): void;

    // Triggers inference execution, dynamically routing and parsing payloads
    public generate<T extends z.ZodTypeAny = z.ZodTypeAny>(params: {
        model: string; // Target model identifier
        prompt: string; // Primary user prompt text
        temperature?: number; // Randomness index [0.0 - 2.0]
        maxTokens?: number; // Hard output token cap
        schema?: T; // Optional output validation schema
    }): Promise<{
        data: T extends z.ZodTypeAny ? z.infer<T> : string;
        response: NormalizedResponse;
    }>;
}
```

---

## 3. Strict Compile-Time Type Safety

To prevent runtime errors, the `generate` API uses TypeScript generic parameterization to adjust return types dynamically:

```
                  +-------------------------------------+
                  |   Is 'schema' parameter provided?   |
                  +------------------+------------------+
                                     |
                       ┌─────────────┴─────────────┐
                      Yes                          No
                       ▼                           ▼
        +------------------------------+  +------------------+
        |  Return Type: z.infer<T>     |  |  Return Type:    |
        |  (Fully Typed Schema Object) |  |  string          |
        +------------------------------+  +------------------+
```

### 3.1 Type Assertions Mechanics

When a schema is omitted, `T` resolves to the default `ZodTypeAny`, which causes the returned `data` payload to narrow to a `string`. If a Zod Schema object is supplied (e.g. `z.object({ name: z.string() })`), the compiler parses the schema structure and maps `data` to its TypeScript type (e.g., `{ name: string }`).

---

## 4. Result Structures & Unified Context Returns

The response resolved from a `client.generate(...)` promise is a structured container containing both the clean data payload and detailed operational metadata:

```typescript
export interface GenerationResult<T extends z.ZodTypeAny> {
    // Clean generated data (Zod-parsed object or raw string text)
    data: T extends z.ZodTypeAny ? z.infer<T> : string;

    // Normalized telemetry and billing metrics (→ D02, D05)
    response: NormalizedResponse;
}
```

---

## 5. API Integration Blueprints (Progressive Complexity)

Vectrion's API scale is designed to support progressive integration complexity:

### 5.1 Blueprint Level 1: Quick Prototyping

A minimal setup requiring less than five lines to establish an active generation connection:

```typescript
import { Vectrion } from '@vectrion/core';
import { GoogleAIProviderAdapter } from '@vectrion/provider-google';

// Boot client in under 2 minutes
const client = new Vectrion({
    providers: [new GoogleAIProviderAdapter({ apiKey: process.env.GEMINI_API_KEY })],
});

// Generate standard string response
const { data } = await client.generate({
    model: 'gemini-1.5-flash',
    prompt: 'Write a headline for a modular AI framework.',
});

console.log(data); // data is typed as: string
```

---

### 5.2 Blueprint Level 2: Middleware & Observability Integration

Integrates retries, cost tracking, and local file tracing middlewares dynamically:

```typescript
import { Vectrion } from '@vectrion/core';
import { GoogleAIProviderAdapter } from '@vectrion/provider-google';
import { retry } from '@vectrion/core/middleware';
import { trackCost } from '@vectrion/cost';
import { localTraceSink } from '@vectrion/observe';

const client = new Vectrion({
    providers: [new GoogleAIProviderAdapter({ apiKey: process.env.GEMINI_API_KEY })],
});

// Compose Onion pipeline
client.use(retry({ maxAttempts: 3, backoff: 'exponential' }));
client.use(trackCost({ attribution: 'marketing-feature' }));
client.use(localTraceSink({ outputPath: './logs/traces.json' }));

const { data, response } = await client.generate({
    model: 'gemini-1.5-pro',
    prompt: 'Calculate the computational footprint of local inference.',
});

console.log(`USD Cost: ${response.cost.totalCostUsd}`);
console.log(`Latency: ${response.latencyMs}ms`);
```

---

### 5.3 Blueprint Level 3: Enterprise Structured Output & Fallback Routing

Constructs a dual-provider, load-balanced, schema-enforced, and cancelable production pipeline:

```typescript
import { z } from 'zod';
import { Vectrion } from '@vectrion/core';
import { CheapestRouter } from '@vectrion/router';
import { GoogleAIProviderAdapter } from '@vectrion/provider-google';
import { OllamaProviderAdapter } from '@vectrion/provider-ollama';

// 1. Establish Zod schema
const EmployeeSchema = z.object({
    name: z.string(),
    department: z.enum(['Engineering', 'Marketing', 'Sales']),
    id: z.number().int(),
});

// 2. Initialize dual providers with a Cheapest routing strategy
const client = new Vectrion({
    providers: [
        new GoogleAIProviderAdapter({ apiKey: process.env.GEMINI_API_KEY }),
        new OllamaProviderAdapter({ endpoint: 'http://localhost:11434' }),
    ],
    router: new CheapestRouter(),
});

// 3. Attach Abort Controller for network cancellation
const controller = new AbortController();

try {
    // 4. Generate structured output
    const { data, response } = await client.generate({
        model: 'gemini-1.5-flash', // Router falls back to Ollama llama3 if Gemini is rate-limited
        prompt: 'Create a synthetic profile for an engineer named Adi.',
        schema: EmployeeSchema, // Compiler extracts types automatically
    });

    // Compiler knows exactly that data matches: { name: string, department: "Engineering" | "Marketing" | "Sales", id: number }
    console.log(`Profile Name: ${data.name}`);
    console.log(`Resolved Provider: ${response.provider}`); // Logs "google-ai" or "ollama"
} catch (err) {
    console.error('Request failed validation or connection limits', err);
}
```

---

## 6. SDK Exception Hierarchy

All exceptions generated by the SDK extend the standard base class `VectrionError`. This guarantees that consumers can capture any pipeline failure safely under a single try-catch scope:

```typescript
// Root Error
export class VectrionError extends Error {
    readonly code: string;
    readonly timestamp: number;
    constructor(message: string, code: string);
}

// Router Fallback Exhaustion Error
export class VectrionRouterError extends VectrionError {
    readonly attemptedProviders: string[]; // List of providers that failed in cascade
    constructor(message: string, attemptedProviders: string[]);
}

// Schema Assertion and Parameter Validation Error
export class VectrionValidationError extends VectrionError {
    readonly issues: Array<{ path: string[]; message: string; code: string }>;
    constructor(message: string, issues: any[]);
}
```

---

## 7. Glossary

- **API Surface**: The public classes, constructors, methods, type schemas, and options exposed to external integrations.
- **Type Parameterization**: Specifying generic type variables (e.g. `<T>`) in code signatures to defer type determination until compiler execution.
- **Zod Schema**: A TypeScript-first validation library that models schema formats and extracts static typings.
- **Conditional Types**: Typings whose signature switches dynamically based on compilation tests (e.g. parameter availability).
- **Vectrion Result**: The standardized data container containing structured response variables alongside usage telemetry.
- **Onion Chaining**: The sequential registration of multiple middleware handlers executing inward-outward request lifecycles.
