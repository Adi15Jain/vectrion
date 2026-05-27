# D05 — Provider Adapter System Design

| Field            | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document ID**  | D05                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Title**        | Provider Adapter System Design                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Status**       | Draft                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Priority**     | P0 — Core Contract                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Tier**         | Tier 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Author**       | Lead Systems Architect                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Dependencies** | [D01 — Product Vision](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D01-product-vision.md), [D02 — System Architecture Overview](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D02-system-architecture-overview.md), [D03 — Monorepo Structure](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D03-monorepo-structure.md), [D04 — Runtime Lifecycle](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D04-runtime-lifecycle.md) |
| **Dependents**   | D06, D07, D08 (and all Tier 2+ subsystems)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Created**      | 2026-05-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Last Updated** | 2026-05-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [The Normalization Concept](#2-the-normalization-concept)
3. [Provider Capabilities Schema](#3-provider-capabilities-schema)
4. [ProviderAdapter Interface Specification](#4-provideradapter-interface-specification)
5. [Input Parameter Normalization Workflow](#5-input-parameter-normalization-workflow)
6. [Output Normalization Specification](#6-output-normalization-specification)
7. [Concrete Adapter Blueprints](#7-concrete-adapter-blueprints)
8. [Unified Error Translation Grid](#8-unified-error-translation-grid)
9. [Token Estimation & Cost Engine](#9-token-estimation--cost-engine)
10. [Glossary](#10-glossary)

---

## 1. Purpose

This document establishes the architecture and design specifications for the **Provider Adapter Subsystem** in Vectrion. AI model providers employ highly heterogeneous request parameters, authentication techniques, streaming mechanisms, pricing layers, and failure signatures.

This specification defines the strict contract (`ProviderAdapter`), parameter mapping pathways, cost calculation engines, and unified error translator grids required to normalize diverse upstream platforms under a single, unified, type-safe SDK interface.

---

## 2. The Normalization Concept

Vectrion decouples application logic from vendor formats through a two-way normalization pipeline executed inside each provider adapter:

```
        [Client Application]
                 │
                 ▼
  [Normalized RequestContext Input]
                 │
      (Inward Normalization)  ───► Map standard prompt/temp to vendor payload
                 │
                 ▼
     [Vendor API Payload (REST)]
                 │
                 ▼
       (Network Fetch Execution)
                 │
                 ▼
     [Vendor Raw Response Body]
                 │
     (Outward Normalization) ───► Parse text, normalize tokens, calculate cost
                 │
                 ▼
    [NormalizedResponse Output]
                 │
                 ▼
        [Client Application]
```

---

## 3. Provider Capabilities Schema

Each adapter declares a static `capabilities` dictionary mapping supported models to their operational parameters, enabling compile-time and runtime feature routing.

```typescript
export interface ProviderCapabilities {
    supportsStructuredOutputs: boolean; // Can parse output JSON schemas natively
    supportsStreaming: boolean; // Can stream tokens via SSE
    maxContextTokens: number; // Master token context window boundary
}
```

---

## 4. ProviderAdapter Interface Specification

All provider packages must export a concrete class implementing the static `ProviderAdapter` contract:

```typescript
export interface ProviderAdapter {
    // Unique system string identifying the provider (e.g. "google-ai", "ollama")
    readonly providerId: string;

    // Capability mappings of all models served by this adapter
    readonly capabilities: Record<string, ProviderCapabilities>;

    // Handles network diagnostic checks and boots internal dependencies
    initialize(): Promise<void>;

    // Executes the normalized request context against the provider endpoint
    execute(ctx: RequestContext, options?: { signal?: AbortSignal }): Promise<NormalizedResponse>;
}
```

---

## 5. Input Parameter Normalization Workflow

When mapping a standard `RequestContext` input, adapters transform parameters according to the following normalization criteria:

| Standard Key  | Description                      | Google Gemini API Mapping                                                  | Ollama API Mapping                  |
| :------------ | :------------------------------- | :------------------------------------------------------------------------- | :---------------------------------- |
| `model`       | Exact target model identifier    | `model` string segment in endpoint url                                     | `model` JSON field                  |
| `prompt`      | Primary input instruction        | Translated to `contents: [{ role: 'user', parts: [{ text }] }]`            | `prompt` JSON string field          |
| `temperature` | Inference randomness [0.0 - 2.0] | `generationConfig.temperature`                                             | `options.temperature`               |
| `maxTokens`   | Hard output token limit          | `generationConfig.maxOutputTokens`                                         | `options.num_predict`               |
| `schema`      | Output Zod schema validation     | `generationConfig.responseSchema` + `responseMimeType: "application/json"` | Passes schema instruction in prompt |

---

## 6. Output Normalization Specification

Every adapter must resolve the raw API output into a standardized `NormalizedResponse` structure. No provider-specific object properties are allowed to bleed into the top-level response properties:

```typescript
export interface NormalizedResponse {
    id: string; // Standardized Unique Request ID
    text: string; // Primary resolved textual content
    model: string; // Standardized model name that executed the request
    provider: string; // The providerId of the executing adapter
    usage: TokenUsage; // Uniform token metadata
    cost: ModelCost; // Standardized USD pricing calculation
    latencyMs: number; // Execution duration calculated at adapter boundary
    rawResponse: unknown; // Full, un-mutated raw API response body for fallback debugging
}
```

---

## 7. Concrete Adapter Blueprints

Vectrion ships with two production-grade adapter implementations:

### 7.1 Google Gemini Adapter (`@vectrion/provider-google`)

- **API Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **Auth Model**: `x-goog-api-key` HTTP Header injection.
- **Capabilities Matrix**:
    - `gemini-1.5-pro`: Structured Outputs (True), Streaming (True), Context (1,048,576 tokens).
    - `gemini-1.5-flash`: Structured Outputs (True), Streaming (True), Context (1,048,576 tokens).
- **Zod Schema Normalization**: Maps Zod schemas to OpenAPI-compatible JSON Schemas and injects them into the `generationConfig.responseSchema` payload.

### 7.2 Ollama Local Adapter (`@vectrion/provider-ollama`)

- **API Endpoint**: `http://localhost:11434/api/generate`
- **Auth Model**: None (local sandbox).
- **Capabilities Matrix**:
    - `llama3`: Structured Outputs (False - relies on local parsing), Streaming (True), Context (8,192 tokens).
    - `mistral`: Structured Outputs (False), Streaming (True), Context (32,768 tokens).
- **JSON Schema Strategy**: Since local models lack hardware-level schema enforcement, Ollama adapters append the validation instruction: `"Respond strictly in valid JSON matching this schema: [JSON_SCHEMA]"` directly to the prompt payload.

---

## 8. Unified Error Translation Grid

Adapters capture raw connection exceptions or HTTP error codes and translate them into standard `@vectrion/shared` classes. The consumer should never catch a provider-native exception.

```
+--------------------------+     +-------------------------------+
|  Raw Connection Exception| ──> |  VectrionAuthenticationError  |
|  (e.g., HTTP 401, 403)   |     +-------------------------------+
+--------------------------+
+--------------------------+     +-------------------------------+
|  Rate Limiting Signals   | ──> |    VectrionRateLimitError     |
|  (e.g., HTTP 429)        |     +-------------------------------+
+--------------------------+
+--------------------------+     +-------------------------------+
|  Backend Failures        | ──> |    VectrionServerDownError    |
|  (e.g., HTTP 500, 503)   |     +-------------------------------+
+--------------------------+
```

### The Error Translation Grid:

| Upstream Status     | Raw Exception Source                        | Vectrion Normalization Target |
| :------------------ | :------------------------------------------ | :---------------------------- |
| **HTTP 401 / 403**  | Expired API Keys / Invalid Credentials      | `VectrionAuthenticationError` |
| **HTTP 429**        | Token or Request rate limit exhausted       | `VectrionRateLimitError`      |
| **HTTP 400**        | Malformed parameters / Unsupported features | `VectrionValidationError`     |
| **HTTP 500 / 503**  | Remote provider backend crash               | `VectrionServerDownError`     |
| **Network Timeout** | Fetch socket timeout                        | `VectrionTimeoutError`        |

---

## 9. Token Estimation & Cost Engine

The SDK tracks costs in real-time by compiling a local cost configuration matrix inside the `@vectrion/cost` package.

### 9.1 Cost Calculation Algorithm

The cost of an execution is structured into `ModelCost` under the following algorithm:

$$\text{Total Cost (USD)} = (\text{Prompt Tokens} \times \text{Input Rate per Token}) + (\text{Completion Tokens} \times \text{Output Rate per Token})$$

```typescript
export interface ModelCost {
    inputCostUsd: number;
    outputCostUsd: number;
    totalCostUsd: number;
}
```

### 9.2 Reference Pricing Index (2026-05-28)

Adapters reference the pricing dictionary below to calculate costs dynamically:

| Provider      | Model Name         | Input Price (per 1M tokens) | Output Price (per 1M tokens) |
| :------------ | :----------------- | :-------------------------: | :--------------------------: |
| **Google AI** | `gemini-1.5-pro`   |           \$3.50            |           \$10.50            |
| **Google AI** | `gemini-1.5-flash` |           \$0.35            |            \$1.05            |
| **Ollama**    | _All Local Models_ |           \$0.00            |            \$0.00            |

---

## 10. Glossary

- **API Normalization**: The process of mapping diverse API structures, parameter keys, and responses onto a single uniform signature.
- **Provider Capabilities**: Metadata describing what features a model supports (e.g. structural schema parsing or text streaming).
- **Zod Schema**: A TypeScript-first schema declaration and validation library.
- **Structured Outputs**: High-reliability LLM configurations where generations are mathematically constrained to match structural JSON schemas.
- **Error Mapping**: Standardizing different API error states and HTTP exceptions into a uniform hierarchy of typed SDK errors.
