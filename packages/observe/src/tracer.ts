import * as path from 'path';
import { Middleware, RequestContext } from '@vectrion/types';
import { JsonlWriter } from '@vectrion/shared';

export interface ObservabilityOptions {
  logDir?: string;
  serviceName?: string;
}

export function observabilityMiddleware(options: ObservabilityOptions = {}): Middleware {
  const logDir = options.logDir || path.join(process.cwd(), '.vectrion', 'traces');
  const serviceName = options.serviceName || 'vectrion-core';

  return async (ctx: RequestContext, next: () => Promise<void>): Promise<void> => {
    const traceId = crypto.randomUUID();
    const spanId = crypto.randomUUID().substring(0, 16);
    const startTime = Date.now();

    ctx.metadata.traceId = traceId;
    ctx.metadata.spanId = spanId;

    try {
      await next();
    } finally {
      const durationMs = Date.now() - startTime;
      const today = new Date().toISOString().split('T')[0];
      const traceFile = path.join(logDir, `trace-${today}.jsonl`);

      const traceRecord = {
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        durationMs,
        service: serviceName,
        attributes: {
          'model.requested': ctx.request.model,
          'model.resolved': ctx.response?.model || 'unknown',
          'provider.resolved': ctx.response?.provider || 'unknown',
          'tokens.prompt': ctx.response?.usage.promptTokens ?? 0,
          'tokens.completion': ctx.response?.usage.completionTokens ?? 0,
          'tokens.total': ctx.response?.usage.totalTokens ?? 0,
          'cost.usd': ctx.response?.cost.totalCostUsd ?? 0.0,
          'execution.success': ctx.response !== undefined,
        },
        metadata: ctx.metadata,
      };

      // Non-blocking asynchronous JSONL file write
      JsonlWriter.appendLine(traceFile, traceRecord).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[ObservabilityMiddleware] Failed to append trace line:', err);
      });
    }
  };
}
