# @vectrion/provider-ollama

Ollama local inference provider adapter for the Vectrion AI runtime SDK. Run AI models locally with zero API costs.

📖 **Part of the Vectrion SDK. View the live documentation and architectural specifications at [vectrion.vercel.app](https://vectrion.vercel.app/).**

## Installation

```bash
npm install @vectrion/provider-ollama
```

## Prerequisites

[Ollama](https://ollama.ai) must be installed and running locally:

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.2

# Start the server (runs on http://localhost:11434 by default)
ollama serve
```

## Usage

```typescript
import { OllamaProviderAdapter } from "@vectrion/provider-ollama";
import { Vectrion } from "@vectrion/core";

const ai = new Vectrion({
    providers: [new OllamaProviderAdapter()],
});

const result = await ai.generate({
    model: "llama3.2",
    prompt: "Explain TypeScript generics",
});
```

## Configuration

```typescript
new OllamaProviderAdapter({
  baseUrl?: string,  // Default: 'http://localhost:11434'
})
```

## Why Ollama?

- **Zero cost** — No API keys, no usage charges
- **Privacy** — Data never leaves your machine
- **Speed** — No network latency for local models
- **Development** — Iterate on prompts without burning API budget

## License

[MIT](../../LICENSE)
