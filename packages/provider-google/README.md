# @vectrion/provider-google

Google AI (Gemini) provider adapter for the Vectrion AI runtime SDK.

## Installation

```bash
npm install @vectrion/provider-google
```

## Usage

```typescript
import { GoogleProviderAdapter } from "@vectrion/provider-google";
import { Vectrion } from "@vectrion/core";

const ai = new Vectrion({
    providers: [
        new GoogleProviderAdapter({
            apiKey: process.env.GOOGLE_API_KEY!,
        }),
    ],
});

const result = await ai.generate({
    model: "gemini-2.0-flash",
    prompt: "Hello, world!",
});
```

## Supported Models

- `gemini-2.0-flash` — Fast, cost-effective
- `gemini-2.0-pro` — Higher quality
- `gemini-1.5-flash` — Previous generation
- Any model ID supported by the Google AI API

## Configuration

```typescript
new GoogleProviderAdapter({
  apiKey: string,       // Required — Google AI API key
  baseUrl?: string,     // Optional — Custom API endpoint
})
```

## License

[MIT](../../LICENSE)
