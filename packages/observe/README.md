# @vectrion/observe

Local-first observability middleware for the Vectrion AI runtime SDK. Automatically traces every request with latency, token usage, cost, and provider information.

📖 **Part of the Vectrion SDK. View the live documentation and architectural specifications at [vectrion.vercel.app](https://vectrion.vercel.app/).**

## Installation

```bash
npm install @vectrion/observe
```

## Usage

```typescript
import { observabilityMiddleware } from '@vectrion/observe';
import { Vectrion } from '@vectrion/core';

const ai = new Vectrion({ providers: [...] });

// Add observability — traces written to .vectrion/traces/
ai.use(observabilityMiddleware({ serviceName: 'my-ai-app' }));

const result = await ai.generate({ model: 'gemini-2.0-flash', prompt: 'Hello' });
// Trace automatically written to .vectrion/traces/YYYY-MM-DD.jsonl
```

## Trace Format

Each request produces a JSONL trace entry:

```json
{
    "timestamp": 1716900000000,
    "serviceName": "my-ai-app",
    "provider": "google",
    "model": "gemini-2.0-flash",
    "latencyMs": 342,
    "usage": { "promptTokens": 5, "completionTokens": 25, "totalTokens": 30 },
    "cost": { "totalCostUsd": 0.00003 }
}
```

## License

[MIT](../../LICENSE)
