import { 
  ProviderAdapter, 
  ProviderCapabilities, 
  RequestContext, 
  NormalizedResponse 
} from '@vectrion/types';
import { VectrionProviderError } from '@vectrion/shared';

export interface GoogleProviderConfig {
  apiKey: string;
}

export class GoogleProviderAdapter implements ProviderAdapter {
  public readonly providerId = 'google';
  public readonly capabilities: Record<string, ProviderCapabilities> = {
    'gemini-1.5-flash': {
      supportsStructuredOutputs: true,
      supportsStreaming: true,
      maxContextTokens: 1048576,
    },
    'gemini-1.5-pro': {
      supportsStructuredOutputs: true,
      supportsStreaming: true,
      maxContextTokens: 2097152,
    },
  };

  private apiKey: string;

  constructor(config: GoogleProviderConfig) {
    this.apiKey = config.apiKey || process.env.GOOGLE_API_KEY || '';
  }

  public async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new VectrionProviderError(
        'Google API Key is not set. Please provide it in constructor or set GOOGLE_API_KEY env var.',
        this.providerId
      );
    }
  }

  public async execute(
    ctx: RequestContext,
    options?: { signal?: AbortSignal }
  ): Promise<NormalizedResponse> {
    await this.initialize();

    let model = ctx.request.model;
    if (model === 'auto') {
      model = 'gemini-1.5-flash'; // Default to fast/cheap for auto
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const generationConfig: Record<string, any> = {};
    if (ctx.request.temperature !== undefined) {
      generationConfig.temperature = ctx.request.temperature;
    }
    if (ctx.request.maxTokens !== undefined) {
      generationConfig.maxOutputTokens = ctx.request.maxTokens;
    }
    if (ctx.request.schema) {
      generationConfig.responseMimeType = 'application/json';
    }

    const payload = {
      contents: [
        {
          parts: [
            { text: ctx.request.prompt }
          ]
        }
      ],
      generationConfig
    };

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
        const errorText = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errorText}`);
      }

      const data = await response.json() as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const usageMetadata = data.usageMetadata || {};
      const promptTokens = usageMetadata.promptTokenCount || 0;
      const completionTokens = usageMetadata.candidatesTokenCount || 0;
      const totalTokens = usageMetadata.totalTokenCount || (promptTokens + completionTokens);

      const pricing = this.getPricing(model);
      const inputCost = (promptTokens / 1000000) * pricing.input1M;
      const outputCost = (completionTokens / 1000000) * pricing.output1M;

      const normalized: NormalizedResponse = {
        id: `google-${crypto.randomUUID()}`,
        text,
        model,
        provider: this.providerId,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
        },
        cost: {
          inputCostUsd: inputCost,
          outputCostUsd: outputCost,
          totalCostUsd: inputCost + outputCost,
        },
        latencyMs: Date.now() - startTime,
        rawResponse: data,
      };

      return normalized;
    } catch (err) {
      throw new VectrionProviderError(
        `Google API request execution failed: ${err instanceof Error ? err.message : String(err)}`,
        this.providerId,
        err
      );
    }
  }

  private getPricing(model: string): { input1M: number; output1M: number } {
    if (model === 'gemini-1.5-pro') {
      return { input1M: 7.00, output1M: 21.00 };
    }
    // gemini-1.5-flash pricing
    return { input1M: 0.35, output1M: 1.05 };
  }
}
