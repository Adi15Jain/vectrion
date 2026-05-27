# @vectrion/router

Multi-strategy routing engine for the Vectrion AI runtime SDK. Routes requests across providers using configurable strategies.

## Installation

```bash
npm install @vectrion/router
```

## Usage

```typescript
import { VectrionRouter } from "@vectrion/router";
import { Vectrion } from "@vectrion/core";

// Cheapest-first routing — picks the lowest cost provider
const ai = new Vectrion({
    providers: [googleAdapter, ollamaAdapter],
    router: new VectrionRouter({ strategy: "cheapest" }),
});

// Fallback routing — tries providers in order until one succeeds
const ai2 = new Vectrion({
    providers: [googleAdapter, ollamaAdapter],
    router: new VectrionRouter({
        strategy: "fallback",
        fallback: ["google", "ollama"],
    }),
});
```

## Strategies

| Strategy   | Description                                               |
| ---------- | --------------------------------------------------------- |
| `cheapest` | Routes to the provider with the lowest cost per token     |
| `fallback` | Tries providers in specified order, falls back on failure |

## License

[MIT](../../LICENSE)
