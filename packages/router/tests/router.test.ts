import { describe, it, expect } from 'vitest';
import { VectrionRouter } from '../src/router-engine.js';
import { ProviderAdapter, RequestContext, NormalizedResponse } from '@vectrion/types';


class CheapMockAdapter implements ProviderAdapter {
  public readonly providerId = 'ollama-cheap';
  public readonly capabilities = {};
  public async initialize(): Promise<void> {}
  public async execute(): Promise<NormalizedResponse> {
    return {
      id: 'cheap-1',
      text: 'Response from cheap provider',
      model: 'cheap-model',
      provider: this.providerId,
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      cost: { inputCostUsd: 0.000001, outputCostUsd: 0.000002, totalCostUsd: 0.000003 },
      latencyMs: 100,
      rawResponse: {},
    };
  }
}

class ExpensiveMockAdapter implements ProviderAdapter {
  public readonly providerId = 'expensive-mock';
  public readonly capabilities = {};
  public async initialize(): Promise<void> {}
  public async execute(): Promise<NormalizedResponse> {
    return {
      id: 'exp-1',
      text: 'Response from expensive provider',
      model: 'expensive-model',
      provider: this.providerId,
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      cost: { inputCostUsd: 0.1, outputCostUsd: 0.2, totalCostUsd: 0.3 },
      latencyMs: 20,
      rawResponse: {},
    };
  }
}

describe('Vectrion Router Engine Strategy Tests', () => {
  it('should route to the cheapest provider first when using cheapest strategy', async () => {
    const cheap = new CheapMockAdapter();
    const expensive = new ExpensiveMockAdapter();
    const providers = new Map<string, ProviderAdapter>([
      [expensive.providerId, expensive],
      [cheap.providerId, cheap],
    ]);

    const router = new VectrionRouter({
      strategy: 'cheapest',
      fallback: [],
    });

    const ctx: RequestContext = {
      request: { model: 'gemini-1.5-flash', prompt: 'Hello' },
      metadata: {},
    };

    const response = await router.routeAndExecute(ctx, providers);
    expect(response.provider).toBe('ollama-cheap');
  });

  it('should fall back to second provider in chain if first provider is not in fallback list or fails', async () => {
    class FailingAdapter implements ProviderAdapter {
      public readonly providerId = 'failing-mock';
      public readonly capabilities = {};
      public async initialize(): Promise<void> {}
      public async execute(): Promise<NormalizedResponse> {
        throw new Error('Timeout');
      }
    }

    const failing = new FailingAdapter();
    const cheap = new CheapMockAdapter();
    const providers = new Map<string, ProviderAdapter>([
      [failing.providerId, failing],
      [cheap.providerId, cheap],
    ]);

    const router = new VectrionRouter({
      strategy: 'fallback',
      fallback: ['failing-mock', 'ollama-cheap'],
    });

    const ctx: RequestContext = {
      request: { model: 'auto', prompt: 'Hello' },
      metadata: {},
    };

    const response = await router.routeAndExecute(ctx, providers);
    expect(response.provider).toBe('ollama-cheap');
  });
});
