import { Middleware, RequestContext } from '@vectrion/types';

export class MiddlewareRunner {
  private middlewares: Middleware[] = [];

  public use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  public async run(ctx: RequestContext, coreExecution: () => Promise<void>): Promise<void> {
    const dispatch = async (index: number): Promise<void> => {
      if (index === this.middlewares.length) {
        return coreExecution();
      }
      const middleware = this.middlewares[index];
      if (!middleware) return;
      
      await middleware(ctx, () => dispatch(index + 1));
    };

    await dispatch(0);
  }
}
