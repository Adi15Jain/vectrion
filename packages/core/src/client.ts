import { z } from 'zod';
import { 
  ProviderAdapter, 
  RouterEngine, 
  RequestContext, 
  NormalizedResponse, 
  Middleware 
} from '@vectrion/types';
import { VectrionRouterError, VectrionValidationError } from '@vectrion/shared';
import { MiddlewareRunner } from './middleware.js';

export interface VectrionConfig {
  providers: ProviderAdapter[];
  router?: RouterEngine;
}

class SimpleDefaultRouter implements RouterEngine {
  public async routeAndExecute(
    ctx: RequestContext,
    providers: Map<string, ProviderAdapter>,
    options?: { signal?: AbortSignal }
  ): Promise<NormalizedResponse> {
    const attempted: string[] = [];
    let lastError: unknown;

    for (const [id, provider] of providers.entries()) {
      try {
        attempted.push(id);
        const startTime = Date.now();
        const response = await provider.execute(ctx, options);
        response.latencyMs = Date.now() - startTime;
        return response;
      } catch (err) {
        lastError = err;
      }
    }

    throw new VectrionRouterError(
      `Default router failed to execute on all providers: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
      attempted
    );
  }
}

export class Vectrion {
  private providers: Map<string, ProviderAdapter> = new Map();
  private router: RouterEngine;
  private middlewareRunner = new MiddlewareRunner();

  constructor(config: VectrionConfig) {
    for (const p of config.providers) {
      this.providers.set(p.providerId, p);
    }
    this.router = config.router || new SimpleDefaultRouter();
  }

  public use(middleware: Middleware): void {
    this.middlewareRunner.use(middleware);
  }

  public async generate<T extends z.ZodTypeAny = z.ZodTypeAny>(params: {
    model: string;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    schema?: T;
  }): Promise<{ data: T extends z.ZodTypeAny ? z.infer<T> : string; response: NormalizedResponse }> {
    const ctx: RequestContext = {
      request: {
        model: params.model,
        prompt: params.prompt,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        schema: params.schema,
      },
      metadata: {},
    };

    const startTime = Date.now();

    await this.middlewareRunner.run(ctx, async () => {
      const response = await this.router.routeAndExecute(ctx, this.providers);
      ctx.response = response;
      ctx.metrics = {
        latencyMs: Date.now() - startTime,
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        unitCostUsd: response.cost.totalCostUsd,
      };
    });

    if (!ctx.response) {
      throw new Error('Vectrion execution completed but did not produce a response.');
    }

    const response = ctx.response;

    if (params.schema) {
      try {
        const cleanedText = response.text.trim();
        // Simple JSON extractor in case there are markdown tags
        const jsonStart = cleanedText.indexOf('{');
        const jsonEnd = cleanedText.lastIndexOf('}');
        let jsonStr = cleanedText;
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonStr = cleanedText.substring(jsonStart, jsonEnd + 1);
        }

        const parsed = JSON.parse(jsonStr);
        const result = params.schema.safeParse(parsed);
        if (!result.success) {
          throw new VectrionValidationError('Response failed output schema validation', result.error.issues);
        }
        return { data: result.data, response };
      } catch (err) {
        if (err instanceof VectrionValidationError) throw err;
        throw new VectrionValidationError(
          `Failed to parse response text as JSON matching the schema: ${err instanceof Error ? err.message : String(err)}`,
          [{ path: [], message: 'JSON parsing failure', code: 'custom' }]
        );
      }
    }

    return { data: response.text as any, response };
  }
}
