# @vectrion/shared

Shared utilities, custom error hierarchy, and helpers used across all Vectrion packages.

📖 **Part of the Vectrion SDK. View the live documentation and architectural specifications at [vectrion.vercel.app](https://vectrion.vercel.app/).**

## Installation

```bash
npm install @vectrion/shared
```

## Error Hierarchy

```typescript
import {
    VectrionError,
    VectrionProviderError,
    VectrionRouterError,
    VectrionValidationError,
} from "@vectrion/shared";

// Base error
throw new VectrionError("Something went wrong");

// Provider-specific error
throw new VectrionProviderError("API rate limited", "google");

// Router error with attempted providers
throw new VectrionRouterError("All providers failed", ["google", "ollama"]);

// Validation error with Zod issues
throw new VectrionValidationError("Schema mismatch", zodIssues);
```

## Utilities

- `JsonlWriter` — Async JSONL file writer for observability traces

## License

[MIT](../../LICENSE)
