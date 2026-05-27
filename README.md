# Vectrion

**A modular TypeScript runtime infrastructure SDK for AI applications.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)](https://nodejs.org/)
[![Documentation](https://img.shields.io/badge/docs-live-brightgreen.svg)](https://vectrion.vercel.app/)

📖 **Read the live documentation and complete architectural specifications at [vectrion.vercel.app](https://vectrion.vercel.app/).**

Vectrion is an infrastructure-focused SDK that abstracts the operational complexity of modern AI application development. It provides a unified interface for multi-provider AI inference with middleware pipelines, intelligent routing, structured output validation, observability, and prompt safety — all with near-zero overhead.

## Quick Start

```bash
npm install @vectrion/core @vectrion/provider-google zod
```

```typescript
import { Vectrion } from "@vectrion/core";
import { GoogleProviderAdapter } from "@vectrion/provider-google";
import { z } from "zod";

const ai = new Vectrion({
    providers: [
        new GoogleProviderAdapter({ apiKey: process.env.GOOGLE_API_KEY! }),
    ],
});

// Simple text generation
const result = await ai.generate({
    model: "gemini-2.0-flash",
    prompt: "What is TypeScript?",
});
console.log(result.data);

// Type-safe structured output
const structured = await ai.generate({
    model: "gemini-2.0-flash",
    prompt: 'Extract: "John is 25 years old"',
    schema: z.object({ name: z.string(), age: z.number() }),
});
console.log(structured.data.name); // "John" — fully typed
```

## Packages

| Package                                                 | Description                                       |
| ------------------------------------------------------- | ------------------------------------------------- |
| [`@vectrion/core`](packages/core)                       | Central SDK client with middleware pipeline       |
| [`@vectrion/types`](packages/types)                     | Shared TypeScript interfaces and type definitions |
| [`@vectrion/shared`](packages/shared)                   | Error hierarchy and common utilities              |
| [`@vectrion/router`](packages/router)                   | Multi-strategy provider routing engine            |
| [`@vectrion/guard`](packages/guard)                     | Prompt injection detection and safety guards      |
| [`@vectrion/observe`](packages/observe)                 | Local-first observability and tracing middleware  |
| [`@vectrion/provider-google`](packages/provider-google) | Google AI (Gemini) provider adapter               |
| [`@vectrion/provider-ollama`](packages/provider-ollama) | Ollama local inference provider adapter           |

## Key Features

- **🔌 Multi-Provider Abstraction** — Write once, switch providers via config
- **🧅 Middleware Pipeline** — Composable onion-model middleware (observability, safety, custom logic)
- **🔀 Intelligent Routing** — Cheapest, fastest, and fallback routing strategies
- **📐 Structured Output** — Zod schema validation with full TypeScript type inference
- **🛡️ Prompt Safety** — Built-in prompt injection detection guardrails
- **📊 Observability** — Automatic JSONL trace emission with latency, cost, and token tracking
- **💰 Cost Tracking** — Per-request cost attribution across providers
- **🏠 Local-First** — Ollama support for zero-cost local development

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 ai.generate()                    │
├─────────────────────────────────────────────────┤
│            Middleware Pipeline (Onion)            │
│  ┌─────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Guard   │→│ Observe  │→│ Custom Middleware │  │
│  └─────────┘ └──────────┘ └──────────────────┘  │
├─────────────────────────────────────────────────┤
│              Router Engine                       │
│  cheapest | fastest | fallback                   │
├─────────────────────────────────────────────────┤
│            Provider Adapters                     │
│  ┌─────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Google  │ │ Ollama   │ │ Custom Provider  │  │
│  └─────────┘ └──────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Development

```bash
git clone https://github.com/vectrion/vectrion.git
cd vectrion
pnpm install
pnpm run build --filter='./packages/*'
npx vitest run
```

## Documentation

Full architecture documentation available at the [docs site](apps/docs) covering 25 design documents across system architecture, middleware design, routing strategies, observability pipelines, security models, and more.

## License

[MIT](LICENSE)
