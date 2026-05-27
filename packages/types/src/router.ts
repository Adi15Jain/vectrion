import { ProviderAdapter, RequestContext, NormalizedResponse } from './provider.js';

export type RoutingStrategy = 'cheapest' | 'fastest' | 'balanced' | 'quality-first' | 'fallback';

export interface RoutingConfig {
  strategy: RoutingStrategy;
  fallback: string[];
  weights?: {
    cost?: number;
    latency?: number;
    quality?: number;
  };
}

export interface RouterEngineOptions {
  providers: string[];
  routing: RoutingConfig;
}

export interface RouterEngine {
  routeAndExecute(
    ctx: RequestContext,
    providers: Map<string, ProviderAdapter>,
    options?: { signal?: AbortSignal }
  ): Promise<NormalizedResponse>;
}
