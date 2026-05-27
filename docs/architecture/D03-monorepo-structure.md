# D03 — Monorepo Structure & Package Boundaries

| Field            | Value                                                                                                                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document ID**  | D03                                                                                                                                                                                                                                                              |
| **Title**        | Monorepo Structure & Package Boundaries                                                                                                                                                                                                                          |
| **Status**       | Draft                                                                                                                                                                                                                                                            |
| **Priority**     | P1 — Structural Integrity                                                                                                                                                                                                                                        |
| **Tier**         | Tier 1                                                                                                                                                                                                                                                           |
| **Author**       | Lead Systems Architect                                                                                                                                                                                                                                           |
| **Dependencies** | [D01 — Product Vision](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D01-product-vision.md), [D02 — System Architecture Overview](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D02-system-architecture-overview.md) |
| **Dependents**   | D04, D05, D06, D07, D08 (and all Tier 2+ documents)                                                                                                                                                                                                              |
| **Created**      | 2026-05-28                                                                                                                                                                                                                                                       |
| **Last Updated** | 2026-05-28                                                                                                                                                                                                                                                       |

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Monorepo Tooling Architecture](#2-monorepo-tooling-architecture)
3. [Physical Repository Directory Tree](#3-physical-repository-directory-tree)
4. [Package Boundaries & Specifications](#4-package-boundaries--specifications)
5. [Acyclic Dependency Matrix](#5-acyclic-dependency-matrix)
6. [Strict Import & Coupling Rules](#6-strict-import--coupling-rules)
7. [Build Orchestration & Caching](#7-build-orchestration--caching)
8. [Code Sharing & Boundary Standards](#8-code-sharing--boundary-standards)
9. [Glossary](#9-glossary)

---

## 1. Purpose

This document establishes the physical structural architecture of **Vectrion**'s monorepo workspace. It defines the workspace configurations, package boundaries, dependency directions, export interfaces, and compilation behaviors required to preserve Vectrion's core architectural principle of _Separation of Operational Concerns_.

This specification provides concrete, checkable rules to prevent code coupling, lateral import bleed, circular dependencies, and build-time fragmentation as the monorepo scales.

---

## 2. Monorepo Tooling Architecture

Vectrion uses a modern, performant, and type-safe monorepo tooling stack:

- **Package Manager**: [pnpm (v8)](https://pnpm.io/) manages the workspace. It enforces strict module resolution (preventing phantom dependencies) and shares lockfiles to maximize disk and caching efficiencies.
- **Build Orchestrator**: [Turborepo](https://turbo.build/repo) schedules task execution pipelines (builds, tests, linting, typechecking) with precise caching of build artifacts.
- **Transpilation Engine**: [tsup](https://tsup.egoist.dev/) transpiles TypeScript into highly optimized ES Modules (ESM) and CommonJS (CJS) outputs with automated declaration (`.d.ts`) generation.

---

## 3. Physical Repository Directory Tree

The physical monorepo is structured as follows:

```
vectrion/
├── apps/                          # Executable End-User Applications
│   ├── docs/                      # [NEW] Documentation display portal & web app
│   └── playground/                # Local sandbox testing application
│
├── packages/                      # Core Subsystems and Modular SDK Libraries
│   ├── core/                      # Client SDK Orchestration Runtime Engine
│   ├── guard/                     # Input/Output schema and guardrail validation package
│   ├── observe/                   # OpenTelemetry logging, tracing, metrics collectors
│   ├── provider-google/           # Google Gemini API adapter package
│   ├── provider-ollama/           # Local Ollama AI adapter package
│   ├── router/                    # Routing engine and provider fallback managers
│   ├── shared/                    # Common utility structures and standard custom Errors
│   └── types/                     # Shared protocol type definitions
│
├── docs/                          # Static Documentation Assets
│   └── architecture/              # Comprehensive Architectural Specifications (D01-D25)
│
├── package.json                   # Root package definition (Workspace orchestrator config)
├── pnpm-lock.yaml                 # Unified workspace dependency lockfile
├── pnpm-workspace.yaml            # PNPM workspace layout definitions
├── turbo.json                     # Turborepo task pipeline configuration
└── tsconfig.json                  # Root TypeScript compilation preferences
```

---

## 4. Package Boundaries & Specifications

Each package within the `/packages` folder represents a single-responsibility subsystem with strict, declared dependencies and consumer access permissions.

```
                  +---------------------------------+
                  |          @vectrion/types        |
                  +----------------+----------------+
                                   ^
            +----------------------+----------------------+
            |                                             |
+-----------+-----------+                      +----------+----------+
|   @vectrion/shared    |                      |   @vectrion/core    |
+-----------+-----------+                      +----------+----------+
            ^                                             ^
            |                                             |
            +---------------------+-----------------------+
                                  |
            +---------------------+-----------------------+
            |                                             |
+-----------+-----------+                      +----------+----------+
|  @vectrion/router     |                      | @vectrion/provider-*|
+-----------------------+                      +---------------------+
|  @vectrion/observe    |                      | @vectrion/guard     |
+-----------------------+                      +---------------------+
```

### 4.1 `@vectrion/types`

The root specification layer containing no runtime JavaScript execution logic.

- **Purpose**: Defines shared protocol interfaces and request configurations.
- **Export Surface**: TypeScript interface contracts (`RequestContext`, `NormalizedResponse`, `ProviderAdapter`, `RouterEngine`).
- **Dependencies**: `zod` (for validation models).
- **Dependents**: All other workspace packages.

### 4.2 `@vectrion/shared`

Common cross-cutting utilities and base structures.

- **Purpose**: Houses core errors and primitive helpers.
- **Export Surface**: Custom error definitions (`VectrionError`, `VectrionRouterError`, `VectrionValidationError`), common constants.
- **Dependencies**: None.
- **Dependents**: `core`, `router`, `guard`, `observe`, `provider-*`.

### 4.3 `@vectrion/core`

The primary SDK runtime coordinator.

- **Purpose**: Orchestrates initialization, config validation, and drives the middleware/router execution loop.
- **Export Surface**: `Vectrion` client, `VectrionConfig`, `MiddlewareRunner`.
- **Dependencies**: `@vectrion/types`, `@vectrion/shared`.
- **Dependents**: External applications (`apps/playground`, `apps/docs`), third-party integrators.

### 4.4 `@vectrion/router`

The request distribution and failover routing logic.

- **Purpose**: Manages multi-provider execution cascades and load-balancing algorithms.
- **Export Surface**: `SimpleDefaultRouter`, weight-based routing definitions, fallback routers.
- **Dependencies**: `@vectrion/types`, `@vectrion/shared`.
- **Dependents**: `core`, External applications.

### 4.5 `@vectrion/guard`

The sanitization and schema assertion pipeline.

- **Purpose**: Inspects request inputs and normalized outputs against strict validation schemas.
- **Export Surface**: Schema validator engines, PII scrapers.
- **Dependencies**: `@vectrion/types`, `@vectrion/shared`, `zod`.
- **Dependents**: `core`, External applications.

### 4.6 `@vectrion/observe`

The OpenTelemetry-compatible telemetry system.

- **Purpose**: Captures application traces, registers metrics, and logs request cycles.
- **Export Surface**: OTLP tracing hooks, metric middleware injectors, logging formatters.
- **Dependencies**: `@vectrion/types`, `@vectrion/shared`, `@opentelemetry/api`, `pino`.
- **Dependents**: `core`, External applications.

### 4.7 `@vectrion/provider-google` & `@vectrion/provider-ollama`

Vendor-specific API bindings.

- **Purpose**: Translates Normalized requests to provider-native payloads.
- **Export Surface**: Concrete adapter classes (e.g. `GoogleAIProviderAdapter`, `OllamaProviderAdapter`).
- **Dependencies**: `@vectrion/types`, `@vectrion/shared`.
- **Dependents**: `core`, `router`, External applications.

---

## 5. Acyclic Dependency Matrix

To prevent circular reference compiling errors, dependencies between workspace packages must strictly flow downwards toward `@vectrion/types` and `@vectrion/shared`. The matrix below defines the permitted references:

| Downstream Target (columns) → <br>Upstream Package (rows) ↓ | `types` | `shared` | `core` | `router` | `guard` | `observe` | `provider-*` |
| :---------------------------------------------------------- | :-----: | :------: | :----: | :------: | :-----: | :-------: | :----------: |
| **`@vectrion/types`**                                       |    —    |    ❌    |   ❌   |    ❌    |   ❌    |    ❌     |      ❌      |
| **`@vectrion/shared`**                                      |   ❌    |    —     |   ❌   |    ❌    |   ❌    |    ❌     |      ❌      |
| **`@vectrion/core`**                                        |   ✅    |    ✅    |   —    |    ❌    |   ❌    |    ❌     |      ❌      |
| **`@vectrion/router`**                                      |   ✅    |    ✅    |   ❌   |    —     |   ❌    |    ❌     |      ❌      |
| **`@vectrion/guard`**                                       |   ✅    |    ✅    |   ❌   |    ❌    |    —    |    ❌     |      ❌      |
| **`@vectrion/observe`**                                     |   ✅    |    ✅    |   ❌   |    ❌    |   ❌    |     —     |      ❌      |
| **`@vectrion/provider-*`**                                  |   ✅    |    ✅    |   ❌   |    ❌    |   ❌    |    ❌     |      —       |

- **✅ Permitted Dependency**: Package declared on the row can import from the package declared in the column.
- **❌ Forbidden Dependency**: Package declared on the row CANNOT import from the package in the column. Lateral or upward imports violate boundary structures.

---

## 6. Strict Import & Coupling Rules

We enforce three structural boundaries to maintain modularity:

### 6.1 No Lateral Importing Between Subsystems

- **Rule**: Subsystem packages (`router`, `guard`, `observe`, `provider-*`) must never import directly from each other.
- **Example**: `@vectrion/router` cannot import a validation utility from `@vectrion/guard`.
- **Enforcement**: Monorepo linters will reject compilation if imports cross subsystem lines. If a function is needed in both places, it must be extracted into `@vectrion/shared` or mapped to an interface inside `@vectrion/types`.

### 6.2 Zero-Dependency Runtime Core

- **Rule**: `@vectrion/core` must maintain zero direct dependencies on external packages, keeping a footprint consisting strictly of native Node/Web APIs and internal workspace references.
- **Enforcement**: Audit scripts block third-party npm package registration in `@vectrion/core/package.json`.

### 6.3 Isolated Provider Dependencies

- **Rule**: Third-party vendor SDKs (e.g. `@google/generative-ai`) must stay isolated inside their respective adapter packages (e.g. `@vectrion/provider-google`).
- **Enforcement**: Under no circumstance is a provider package allowed to bleed imports into `@vectrion/core`.

---

## 7. Build Orchestration & Caching

Vectrion manages compile steps using a unified Turborepo pipeline. The task relationships are specified inside the root `turbo.json`:

```json
{
    "$schema": "https://turbo.build/schema.json",
    "pipeline": {
        "build": {
            "dependsOn": ["^build"],
            "outputs": ["dist/**", ".next/**"]
        },
        "lint": {
            "outputs": []
        },
        "typecheck": {
            "dependsOn": ["^build"],
            "outputs": []
        },
        "test": {
            "dependsOn": ["build"],
            "outputs": []
        }
    }
}
```

### Build Caching Rules

- When running `turbo run build`, Turborepo checks if package sources have changed. If not, it skips compiling and pulls from local or remote cache.
- The `dependsOn: ["^build"]` constraint guarantees that a package is built _only_ after all of its internal workspace dependencies have successfully completed their builds.

---

## 8. Code Sharing & Boundary Standards

To determine where code must reside, engineers follow this simple classification workflow:

```
                  Does this code contain executable SDK logic?
                               /               \
                             No                 Yes
                             /                     \
      Does it only define API contracts?        Is it used by multiple subsystems?
                    /         \                         /              \
                  Yes          No                     Yes               No
                  /             \                     /                   \
        [@vectrion/types]  [Out of Scope]   [@vectrion/shared]    [Dedicated Subsystem]
```

### 8.1 Shared Package Constraints

To keep `@vectrion/shared` lightweight, only three classes of code are permitted inside:

1. Standard custom error classes extending `VectrionError`.
2. Pure utility functions containing zero business logic (e.g., timing backoff calculators, text cleaners).
3. Common runtime constants.

---

## 9. Glossary

- **Monorepo**: A software development strategy where code for multiple projects or libraries is stored in the same repository.
- **Phantom Dependency**: Importing a package in your code that is not explicitly declared as a dependency in your `package.json`.
- **Acyclic Graph**: A directed graph with no paths that start and end at the same node, ensuring no circular dependencies exist.
- **Transpilation**: The process of taking source code written in one language/syntax and transforming it into another (e.g., TS to ESM JavaScript).
- **ES Modules (ESM)**: The official standardized module system for JavaScript, using `import` and `export` statements.
