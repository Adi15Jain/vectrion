# D09 — Observability Pipeline Design

| Field            | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document ID**  | D09                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Title**        | Observability Pipeline Design                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Status**       | Draft                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Priority**     | P1 — Structural Transparency                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Tier**         | Tier 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Author**       | Lead Systems Architect                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Dependencies** | [D01 — Product Vision](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D01-product-vision.md), [D02 — System Architecture Overview](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D02-system-architecture-overview.md), [D03 — Monorepo Structure](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D03-monorepo-structure.md), [D04 — Runtime Lifecycle](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D04-runtime-lifecycle.md) |
| **Dependents**   | D15, D18 (and all telemetry integrations)                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Created**      | 2026-05-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Last Updated** | 2026-05-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Observability Subsystem Overview](#2-observability-subsystem-overview)
3. [Distributed Tracing & Execution Spans](#3-distributed-tracing--execution-spans)
4. [Standard Metrics Registry](#4-standard-metrics-registry)
5. [Pino-Compatible Structured Logging](#5-pino-compatible-structured-logging)
6. [Local-First Default Storage & OTLP Exporter](#6-local-first-default-storage--otlp-exporter)
7. [Trace Sequence Diagrams](#7-trace-sequence-diagrams)
8. [Glossary](#8-glossary)

---

## 1. Purpose

This document establishes the architecture and interface contracts for the **Vectrion Observability Subsystem** (`@vectrion/observe`). Operating complex, multi-provider AI infrastructures requires deep operational visibility. When a request experiences high latency, cost spikes, or validation failures, developers must be able to pinpoint the root cause instantly.

This specification details the OpenTelemetry-compatible tracing model, parent-child span boundaries, standard metric collections, and local-first telemetry storage default structures.

---

## 2. Observability Subsystem Overview

The `@vectrion/observe` package collects instrumentation data across the entire execution cycle. It hooks into the `@vectrion/core` middleware pipeline, intercepting request contexts to populate spans, metrics, and logs:

```
[RequestContext] ──► [Trace Middleware] ────► [Span Generator]
                            │                     │
                            ├──► Metric Collector ├──► Prometheus / console
                            │                     │
                            └──► JSON Logger      └──► Pino log files
```

---

## 3. Distributed Tracing & Execution Spans

Vectrion models every AI request execution as a **Distributed Trace** consisting of hierarchical, parent-child execution **Spans**.

### 3.1 Trace Structure & Context Propagation

Each client request instantiates a unique, 128-bit `traceId` which is propagated downstream through all middleware layers, routers, and provider adapters via the `RequestContext` metadata block:

```
Vectrion.generate()  [Trace: 4f82...]  (Parent Span: client-generation)
        │
        ├──► Middleware Pipeline       (Child Span: middleware-runner)
        │
        ├──► Router Selection          (Child Span: router-selection)
        │
        └──► Provider Adapter          (Child Span: provider-execute)
```

### 3.2 Span Metadata Attributes

Each span captures critical performance and context attributes, mapping directly to standard OpenTelemetry Semantic Conventions:

| Attribute Key                | Description                        | Example Value         |
| :--------------------------- | :--------------------------------- | :-------------------- |
| `gen_ai.system`              | Target provider system name        | `"google-ai"`         |
| `gen_ai.request.model`       | The requested model version        | `"gemini-1.5-pro"`    |
| `gen_ai.response.model`      | The actual executing model version | `"gemini-1.5-pro-v1"` |
| `gen_ai.usage.input_tokens`  | Prompt token count                 | `1240`                |
| `gen_ai.usage.output_tokens` | Output token count                 | `452`                 |
| `vectrion.latency_ms`        | Precise execution duration         | `824.5`               |
| `vectrion.cost_usd`          | Standardized execution cost        | `0.00908`             |

---

## 4. Standard Metrics Registry

The SDK maintains an in-memory metrics registry collecting five core categories of operational telemetry:

```typescript
export interface MetricRegistry {
    // Latency counter tracking total round-trip durations (Histogram)
    vectrion_request_duration_ms: Histogram;

    // Usage statistics tracking prompt, completion, and total tokens (Counter)
    vectrion_token_usage_total: Counter<{ direction: 'input' | 'output'; model: string }>;

    // Billing statistics accumulating raw execution costs in USD (Counter)
    vectrion_cost_usd_total: Counter<{ model: string; attribution?: string }>;

    // Cache efficiency metrics tracking hit and miss ratios (Counter)
    vectrion_cache_hits_total: Counter<{ result: 'hit' | 'miss' }>;

    // Failover statistics tracking provider fallback cascades (Counter)
    vectrion_router_failover_total: Counter<{ attempted: string; failed: string }>;
}
```

---

## 5. Pino-Compatible Structured Logging

Logs inside `@vectrion/observe` use a structured JSON layout, optimized for high throughput and direct parsing by aggregators (e.g. Datadog, ELK).

### 5.1 JSON Log Format

All logs output as a single, newline-delimited JSON string:

```json
{
    "level": 30,
    "time": 1780003200000,
    "pid": 48120,
    "hostname": "mbp.local",
    "msg": "Vectrion generation completed successfully",
    "traceId": "4f828a2c00a98b115629c118",
    "model": "gemini-1.5-flash",
    "latencyMs": 240.2,
    "tokens": { "prompt": 128, "completion": 48 },
    "costUsd": 0.000095
}
```

---

## 6. Local-First Default Storage & OTLP Exporter

To satisfy our _Local-First, Zero-Cost_ infrastructure philosophy (→ D01), Vectrion avoids requiring developers to run hosted metrics servers:

### 6.1 Default Local File Sink

If no external OTLP endpoint is configured, trace logs are stored locally:

- **Location**: Defaults to writing to `.vectrion/traces.jsonl` within the project root directory.
- **Eviction**: Log files are capped at **50MB** and rotate automatically using standard rolling file mechanisms.

### 6.2 OpenTelemetry (OTLP) Exporter

For production staging, `@vectrion/observe` exposes an export pipeline compatible with standard OpenTelemetry Collectors (e.g. Honeycomb, Dynatrace, Jaeger):

```typescript
import { OTLPTraceExporter } from '@vectrion/observe';

const client = new Vectrion({
    providers: [new GoogleAIProviderAdapter({ apiKey })],
});

// Configure exporting pipeline to local Jaeger server
client.use(
    OTLPTraceExporter({
        endpoint: 'http://localhost:4318/v1/traces',
        headers: { Authorization: 'Bearer ...' },
    }),
);
```

---

## 7. Trace Sequence Diagrams

### 7.1 Successful Trace Span Lifecycle

The timeline below maps the nesting and duration of spans during a standard successful generation:

```
Span Name                Start Time (ms) ──────────► End Time (ms)
----------------------------------------------------------------------
[client-generation]     0ms |====================================| 850ms
  [middleware-runner]   2ms   |==================================| 848ms
    [router-selection]  5ms     |==| 15ms
    [provider-execute]  20ms       |=============================| 840ms
```

---

## 8. Glossary

- **Distributed Trace**: A record of the path a request takes through a multi-component distributed system.
- **Span**: The primary building block of a trace, representing a single unit of work (e.g., calling an API or running a middleware).
- **OTLP**: OpenTelemetry Protocol, the standardized protocol for transmitting telemetry data (metrics, logs, traces).
- **Structured Logging**: Logging data in a standardized, machine-readable format (typically JSON) instead of raw text.
- **Telemetry**: The automated collection and transmission of operational measurements (metrics, logs, traces) from remote sources.
