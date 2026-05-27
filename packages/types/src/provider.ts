import { z } from 'zod';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ModelCost {
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
}

export interface NormalizedResponse {
  id: string;
  text: string;
  model: string;
  provider: string;
  usage: TokenUsage;
  cost: ModelCost;
  latencyMs: number;
  rawResponse: unknown;
}

export interface ProviderCapabilities {
  supportsStructuredOutputs: boolean;
  supportsStreaming: boolean;
  maxContextTokens: number;
}

export interface RequestContext {
  request: {
    model: string;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    schema?: z.ZodTypeAny;
  };
  response?: NormalizedResponse;
  metrics?: {
    latencyMs: number;
    promptTokens: number;
    completionTokens: number;
    unitCostUsd: number;
  };
  metadata: Record<string, any>;
}

export type NextFunction = () => Promise<void>;
export type Middleware = (ctx: RequestContext, next: NextFunction) => Promise<void>;

export interface ProviderAdapter {
  readonly providerId: string;
  readonly capabilities: Record<string, ProviderCapabilities>;
  
  initialize(): Promise<void>;
  execute(
    ctx: RequestContext,
    options?: { signal?: AbortSignal }
  ): Promise<NormalizedResponse>;
}
