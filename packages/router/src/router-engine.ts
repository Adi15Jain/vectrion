import { 
  ProviderAdapter, 
  RouterEngine, 
  RequestContext, 
  NormalizedResponse, 
  RoutingConfig
} from '@vectrion/types';
import { VectrionRouterError } from '@vectrion/shared';

// Standardized Pricing Registry (per 1,000,000 tokens)
export const MODEL_PRICING: Record<string, { input1M: number; output1M: number }> = {
  'gemini-1.5-flash': { input1M: 0.35, output1M: 1.05 },
  'gemini-1.5-pro': { input1M: 7.00, output1M: 21.00 },
  'llama3': { input1M: 0.0, output1M: 0.0 }, // Local models are free!
  'mistral': { input1M: 0.0, output1M: 0.0 },
};

export class VectrionRouter implements RouterEngine {
  private config: RoutingConfig;
  private latencyHistory: Map<string, number[]> = new Map();

  constructor(config: RoutingConfig) {
    this.config = config;
  }

  public recordLatency(providerId: string, latencyMs: number): void {
    const history = this.latencyHistory.get(providerId) || [];
    history.push(latencyMs);
    if (history.length > 10) history.shift(); // Keep last 10 trials
    this.latencyHistory.set(providerId, history);
  }

  private getAverageLatency(providerId: string): number {
    const history = this.latencyHistory.get(providerId);
    if (!history || history.length === 0) return 1000; // Default estimate
    return history.reduce((sum, v) => sum + v, 0) / history.length;
  }

  public async routeAndExecute(
    ctx: RequestContext,
    providers: Map<string, ProviderAdapter>,
    options?: { signal?: AbortSignal }
  ): Promise<NormalizedResponse> {
    const strategy = this.config.strategy;
    const requestedModel = ctx.request.model;

    // Resolve order of providers based on strategy
    let orderedProviders = Array.from(providers.values());

    if (strategy === 'cheapest') {
      orderedProviders.sort((a, b) => {
        const costA = this.estimateProviderCost(a, requestedModel);
        const costB = this.estimateProviderCost(b, requestedModel);
        return costA - costB;
      });
    } else if (strategy === 'fastest') {
      orderedProviders.sort((a, b) => {
        return this.getAverageLatency(a.providerId) - this.getAverageLatency(b.providerId);
      });
    } else if (strategy === 'fallback') {
      // Order strictly according to the fallback chain configuration
      const fallbackList = this.config.fallback || [];
      orderedProviders.sort((a, b) => {
        const indexA = fallbackList.indexOf(a.providerId);
        const indexB = fallbackList.indexOf(b.providerId);
        const valA = indexA === -1 ? 999 : indexA;
        const valB = indexB === -1 ? 999 : indexB;
        return valA - valB;
      });
    }

    const attempted: string[] = [];
    let lastError: unknown;

    for (const provider of orderedProviders) {
      // Skip if provider is not in configured fallback list and we are strictly fallback routing
      if (strategy === 'fallback' && !this.config.fallback.includes(provider.providerId)) {
        continue;
      }

      try {
        attempted.push(provider.providerId);
        const startTime = Date.now();
        const response = await provider.execute(ctx, options);
        const latency = Date.now() - startTime;
        
        response.latencyMs = latency;
        this.recordLatency(provider.providerId, latency);
        
        return response;
      } catch (err) {
        lastError = err;
      }
    }

    throw new VectrionRouterError(
      `Router failed to execute request on all target adapters using strategy '${strategy}'. Attempts: ${attempted.join(' -> ')}. Error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
      attempted
    );
  }

  private estimateProviderCost(provider: ProviderAdapter, model: string): number {
    // Standard cost lookups
    const providerId = provider.providerId.toLowerCase();
    
    // Local models cost nothing
    if (providerId.includes('ollama')) {
      return 0;
    }

    const price = MODEL_PRICING[model];
    if (price) {
      return price.input1M;
    }

    // Default estimate if not matched
    return 10.0;
  }
}
