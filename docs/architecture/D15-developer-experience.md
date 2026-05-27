# D15 — Developer Experience Standards

| Field            | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document ID**  | D15                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Title**        | Developer Experience Standards                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Status**       | Draft                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Priority**     | P2 — Developer Ergonomics                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Tier**         | Tier 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Author**       | Lead Systems Architect                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Dependencies** | [D01 — Product Vision](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D01-product-vision.md), [D02 — System Architecture Overview](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D02-system-architecture-overview.md), [D03 — Monorepo Structure](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D03-monorepo-structure.md), [D04 — Runtime Lifecycle](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D04-runtime-lifecycle.md), [D08 — SDK API Surface](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D08-sdk-api-surface.md), [D14 — Plugin & Extensibility System](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D14-plugin-system.md) |
| **Dependents**   | None (End of Phase 2 thematic boundary)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Created**      | 2026-05-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Last Updated** | 2026-05-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Ergonomic API Design Principles](#2-ergonomic-api-design-principles)
3. [Exhaustive Error Message Blueprint](#3-exhaustive-error-message-blueprint)
4. [In-IDE Auto-Complete & TSDoc Conventions](#4-in-ide-auto-complete--tsdoc-conventions)
5. [Local Diagnostic Command-Line Tools](#5-local-diagnostic-command-line-tools)
6. [Documentation Cleanliness & Sample Code Standards](#6-documentation-cleanliness--sample-code-standards)
7. [Glossary](#7-glossary)

---

## 1. Purpose

This document establishes the **Developer Experience (DX) Standards** for Vectrion. A highly capable infrastructure engine is ineffective if its API is frustrating to consume, its types are opaque, or its error messages swallow root-cause diagnostics. Vectrion prioritizes developer ergonomics alongside performance, ensuring that our SDK is intuitive to adopt, easy to debug, and pleasant to integrate.

This specification details API design guidelines, strict error formatting rules, TSDoc documentation standards, and local development diagnostic tooling.

---

## 2. Ergonomic API Design Principles

Vectrion's external-facing APIs adhere to three primary ergonomic guidelines:

### 2.1 Flat, Un-Nested Configuration Options

Configuration interfaces must prioritize clarity and simplicity, avoiding deeply nested option maps where possible:

```typescript
// Anti-Pattern: Deep nesting makes typing hard and verbose
const client = new Vectrion({
    settings: {
        connection: {
            timeout: 5000,
        },
    },
});

// Preferred Pattern: Clean, flat options are easier to read and discover
const client = new Vectrion({
    timeoutMs: 5000,
});
```

### 2.2 Predictable Naming Conventions

- **Action Verbs**: Methods must begin with clear action verbs (e.g. `generate()`, `use()`, `register()`).
- **Boolean Properties**: Boolean properties must be prefixed with clear interrogatives (e.g. `supportsStreaming`, `aborted`).

---

## 3. Exhaustive Error Message Blueprint

Vectrion outlaws generic, un-actionable console exceptions. Every error generated by the SDK must provide actionable diagnostics.

### 3.1 The Error Format Blueprint

All exceptions derived from `VectrionError` must include:

1. **Clear Description**: A plain-English explanation of _what_ went wrong.
2. **Contextual Cause**: The specific runtime condition or invalid parameter that triggered the error.
3. **Actionable Remediation**: Clear, step-by-step instructions on _how_ to resolve the issue.
4. **Documentation Link**: A direct reference to our troubleshooting guides.

```
VectrionRateLimitError: Rate limit exhausted on provider "google-ai" (Model: gemini-1.5-pro)

  ▸ The remote API returned HTTP Status 429 (Too Many Requests).
  ▸ Action: Reduce concurrent request volumes or configure Vectrion's retry middleware.
  ▸ Learn More: https://vectrion.dev/errors/rate-limiting
```

---

## 4. In-IDE Auto-Complete & TSDoc Conventions

To support developer productivity, all public functions, classes, and options must be documented using standardized **TSDoc comments** to enable rich in-IDE autocomplete, descriptions, and type highlights.

```typescript
/**
 * Executes a text generation request, dynamically routing the payload
 * and enforcing strict compile-time output schema validation.
 *
 * @param params - Configuration parameters for the generation.
 * @param params.model - The target model identifier (e.g., 'gemini-1.5-flash').
 * @param params.prompt - The primary user input text instructions.
 * @param params.schema - Optional Zod schema to enforce structured outputs.
 *
 * @returns A promise resolving to the validated structured data and metadata.
 *
 * @throws {@link VectrionValidationError} If response fails output schema validations.
 * @throws {@link VectrionRouterError} If all candidate fallback provider engines fail.
 */
```

---

## 5. Local Diagnostic Command-Line Tools

To support local debugging, the `@vectrion/core` package includes a diagnostic CLI companion:

```bash
npx vectrion doctor
```

### 5.1 Diagnostic Audits:

- **Connection Checks**: Pings local Ollama service endpoints and tests external Gemini API network latency.
- **Credential Validation**: Verifies that environment keys (such as `GEMINI_API_KEY`) are present and properly structured.
- **Config Audits**: Scans the project workspace and checks configurations for circular dependencies or potential stack size violations.

---

## 6. Documentation Cleanliness & Sample Code Standards

Code blocks in tutorials and reference manuals must compile and run successfully:

- **No Pseudo-Code**: Code blocks must use valid, compiling TypeScript.
- **Self-Contained Examples**: Snippets must include all necessary imports and configurations, ensuring developers can copy, paste, and run them directly.
- **Type Correctness**: All examples must pass strict compiler type checks (`tsc --noImplicitAny`).

---

## 7. Glossary

- **Developer Experience (DX)**: The ease, efficiency, and satisfaction of developer interaction with a library, tool, or API.
- **Ergonomics**: The design of APIs and systems to optimize developer productivity and reduce friction.
- **TSDoc**: A proposed standard for JSDoc-style comments in TypeScript source code files.
- **Self-Contained Code**: Code snippets that include all necessary setup and imports, making them ready to run without external dependencies.
- **Flat Configuration**: An API design pattern that avoids deeply nested configuration structures, keeping options flat and discoverable.
