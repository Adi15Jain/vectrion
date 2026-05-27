import { 
  ProviderAdapter, 
  ProviderCapabilities, 
  RequestContext, 
  NormalizedResponse 
} from '@vectrion/types';
import { VectrionProviderError } from '@vectrion/shared';

export interface OllamaProviderConfig {
  endpoint?: string;
}

export class OllamaProviderAdapter implements ProviderAdapter {
  public readonly providerId = 'ollama';
  public readonly capabilities: Record<string, ProviderCapabilities> = {
    'llama3': {
      supportsStructuredOutputs: true,
      supportsStreaming: true,
      maxContextTokens: 8192,
    },
    'mistral': {
      supportsStructuredOutputs: true,
      supportsStreaming: true,
      maxContextTokens: 8192,
    },
  };

  private endpoint: string;

  constructor(config: OllamaProviderConfig = {}) {
    this.endpoint = config.endpoint || process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
  }

  public async initialize(): Promise<void> {
    // Check if Ollama daemon is accessible via a simple ping or info check if desired
    // For local-first MVP, we proceed directly or check endpoint
  }

  public async execute(
    ctx: RequestContext,
    options?: { signal?: AbortSignal }
  ): Promise<NormalizedResponse> {
    await this.initialize();

    let model = ctx.request.model;
    if (model === 'auto') {
      model = 'llama3'; // Default to llama3 for auto on local
    }

    const url = `${this.endpoint}/api/generate`;

    const requestOptions: Record<string, any> = {};
    if (ctx.request.temperature !== undefined) {
      requestOptions.temperature = ctx.request.temperature;
    }
    if (ctx.request.maxTokens !== undefined) {
      requestOptions.num_predict = ctx.request.maxTokens;
    }

    const payload: Record<string, any> = {
      model,
      prompt: ctx.request.prompt,
      stream: false,
      options: requestOptions
    };

    if (ctx.request.schema) {
      payload.format = 'json';
    }

    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: options?.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: Failed to reach Ollama daemon.`);
      }

      const data = await response.json() as any;
      const text = data.response || '';
      
      const promptTokens = data.prompt_eval_count || 0;
      const completionTokens = data.eval_count || 0;
      const totalTokens = promptTokens + completionTokens;

      const normalized: NormalizedResponse = {
        id: `ollama-${crypto.randomUUID()}`,
        text,
        model,
        provider: this.providerId,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
        },
        cost: {
          inputCostUsd: 0.0,
          outputCostUsd: 0.0,
          totalCostUsd: 0.0, // Local is completely free!
        },
        latencyMs: Date.now() - startTime,
        rawResponse: data,
      };

      return normalized;
    } catch (err) {
      throw new VectrionProviderError(
        `Ollama local request execution failed: ${err instanceof Error ? err.message : String(err)}`,
        this.providerId,
        err
      );
    }
  }
}
