# @vectrion/types

Core TypeScript type definitions and interfaces for the Vectrion AI runtime SDK. This package defines the contracts that all other packages implement.

📖 **Part of the Vectrion SDK. View the live documentation and architectural specifications at [vectrion.vercel.app](https://vectrion.vercel.app/).**

## Installation

```bash
npm install @vectrion/types
```

## Key Interfaces

### `ProviderAdapter`

The interface all provider adapters must implement:

```typescript
interface ProviderAdapter {
    readonly providerId: string;
    readonly capabilities: Record<string, ProviderCapabilities>;
    initialize(): Promise<void>;
    execute(
        ctx: RequestContext,
        options?: ExecuteOptions,
    ): Promise<NormalizedResponse>;
}
```

### `Middleware`

```typescript
type Middleware = (
    ctx: RequestContext,
    next: () => Promise<void>,
) => Promise<void>;
```

### `RouterEngine`

```typescript
interface RouterEngine {
    routeAndExecute(
        ctx: RequestContext,
        providers: Map<string, ProviderAdapter>,
        options?: { signal?: AbortSignal },
    ): Promise<NormalizedResponse>;
}
```

### `NormalizedResponse`

The unified response shape returned by all providers.

### `RequestContext`

The mutable context object passed through the middleware pipeline.

## License

[MIT](../../LICENSE)
