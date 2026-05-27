import { Middleware, RequestContext } from '@vectrion/types';
import { VectrionValidationError } from '@vectrion/shared';

export function promptInjectionGuard(): Middleware {
  const injectionPatterns = [
    /ignore (?:all )?previous instructions/i,
    /system prompt/i,
    /you are now a/i,
    /bypass safety/i,
    /forget what we talked about/i,
  ];

  return async (ctx: RequestContext, next: () => Promise<void>): Promise<void> => {
    const prompt = ctx.request.prompt;
    for (const pattern of injectionPatterns) {
      if (pattern.test(prompt)) {
        throw new VectrionValidationError(
          'Input prompt failed strict safety verification checks: Potential injection signature identified.',
          [{
            path: ['prompt'],
            message: `Potential prompt injection signature matched: ${pattern.toString()}`,
            code: 'custom',
          }]
        );
      }
    }
    await next();
  };
}

export function outputRepairFilter(output: string): string {
  let cleaned = output.trim();

  // Strip Markdown JSON code blocks: ```json ... ```
  if (cleaned.startsWith('```')) {
    const lines = cleaned.split('\n');
    if (lines[0]?.startsWith('```')) {
      lines.shift();
    }
    if (lines[lines.length - 1]?.startsWith('```')) {
      lines.pop();
    }
    cleaned = lines.join('\n').trim();
  }

  return cleaned;
}
