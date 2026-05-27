import { z } from 'zod';

export class VectrionError extends Error {
  constructor(message: string, public readonly code: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class VectrionValidationError extends VectrionError {
  constructor(message: string, public readonly issues: z.ZodIssue[]) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class VectrionProviderError extends VectrionError {
  constructor(message: string, public readonly provider: string, public readonly rawError?: unknown) {
    super(message, 'PROVIDER_ERROR');
  }
}

export class VectrionTimeoutError extends VectrionError {
  constructor(message: string, public readonly provider: string) {
    super(message, 'TIMEOUT_ERROR');
  }
}

export class VectrionRouterError extends VectrionError {
  constructor(message: string, public readonly attemptedProviders: string[]) {
    super(message, 'ROUTER_ERROR');
  }
}
