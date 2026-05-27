# @vectrion/core

The central SDK client for the Vectrion AI runtime infrastructure. Provides the `Vectrion` class with middleware pipeline orchestration, provider abstraction, and Zod-based structured output validation.

## Installation

```bash
npm install @vectrion/core @vectrion/types zod
```

## Usage

```typescript
import { Vectrion } from "@vectrion/core";
import { GoogleProviderAdapter } from "@vectrion/provider-google";
import { z } from "zod";

const ai = new Vectrion({
    providers: [
        new GoogleProviderAdapter({ apiKey: process.env.GOOGLE_API_KEY! }),
    ],
});

// Text generation
const result = await ai.generate({
    model: "gemini-2.0-flash",
    prompt: "Explain TypeScript in one sentence",
});
console.log(result.data);
console.log(result.response.usage); // { promptTokens, completionTokens, totalTokens }
console.log(result.response.cost); // { totalCostUsd }

// Structured output with Zod schema
const user = await ai.generate({
    model: "gemini-2.0-flash",
    prompt: 'Extract: "Jane is 30 and lives in NYC"',
    schema: z.object({ name: z.string(), age: z.number(), city: z.string() }),
});
console.log(user.data); // { name: "Jane", age: 30, city: "NYC" } — fully typed

// Middleware
ai.use(async (ctx, next) => {
    console.log(`Sending: ${ctx.request.prompt}`);
    await next();
    console.log(
        `Provider: ${ctx.response?.provider}, Latency: ${ctx.response?.latencyMs}ms`,
    );
});
```

## API

### `new Vectrion(config)`

- `config.providers` — Array of `ProviderAdapter` instances
- `config.router` — Optional `RouterEngine` (default: sequential fallback)

### `ai.generate(params)`

- `params.model` — Model identifier string
- `params.prompt` — Input prompt
- `params.schema` — Optional Zod schema for structured output
- Returns `{ data, response }` where `data` is typed to the schema

### `ai.use(middleware)`

- Adds middleware to the onion pipeline (pre/post hooks around provider execution)

## License

[MIT](../../LICENSE)
