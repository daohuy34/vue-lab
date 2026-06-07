import { ComponentId, RenderResult, RenderStatus } from '@vue-lab/core';
import { ComponentLoader } from './loader.js';
import { ErrorBoundary } from './error-boundary.js';

export interface RuntimeOptions {
  root: string;
  mode: 'isolated' | 'project';
  viteServer?: any;
}

export type RuntimeState = 'idle' | 'loading' | 'rendering' | 'ready' | 'error';

export class Runtime {
  private root: string;
  private mode: 'isolated' | 'project';
  private loader: ComponentLoader;
  private errorBoundary: ErrorBoundary;
  private state: RuntimeState = 'idle';
  private currentComponent: ComponentId | null = null;
  private lastError: Error | null = null;
  private viteServer: any = null;
  private componentCache: Map<ComponentId, any> = new Map();

  constructor(options: RuntimeOptions) {
    this.root = options.root;
    this.mode = options.mode;
    this.viteServer = options.viteServer;
    this.loader = new ComponentLoader({ root: options.root });
    this.errorBoundary = new ErrorBoundary();
  }

  setViteServer(server: any): void {
    this.viteServer = server;
  }

  async render(componentId: ComponentId, props: Record<string, unknown> = {}): Promise<RenderResult> {
    this.state = 'loading';
    this.currentComponent = componentId;
    this.lastError = null;

    try {
      const source = await this.loader.getSource(componentId);
      if (!source) {
        this.state = 'error';
        return {
          status: 'failed',
          error: {
            type: 'COMPILE_ERROR',
            message: `Component ${componentId} not found or failed to load`,
          },
        };
      }

      if (this.viteServer) {
        const analysis = this.errorBoundary.analyzeComponent(source);
        if (analysis.missingDeps.length > 0) {
          this.state = 'ready';
          return {
            status: 'warning',
            error: {
              type: 'MISSING_INJECT',
              message: `Missing dependencies: ${analysis.missingDeps.join(', ')}`,
              missingDeps: analysis.missingDeps,
            },
          };
        }

        this.state = 'ready';
        return {
          status: 'ready',
        };
      }

      const componentModule = await this.loader.load(componentId);
      if (!componentModule) {
        this.state = 'ready';
        return {
          status: 'ready',
        };
      }

      this.state = 'ready';
      return {
        status: 'ready',
      };
    } catch (error) {
      this.state = 'error';
      this.lastError = error instanceof Error ? error : new Error(String(error));
      return this.errorBoundary.catch(error);
    }
  }

  async loadComponentForRender(componentId: ComponentId): Promise<{ component: any; props: Record<string, unknown> } | null> {
    if (this.componentCache.has(componentId)) {
      return {
        component: this.componentCache.get(componentId),
        props: {},
      };
    }

    try {
      const componentModule = await this.loader.load(componentId);
      if (componentModule) {
        this.componentCache.set(componentId, componentModule);
        return {
          component: componentModule,
          props: {},
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  getRenderContext(componentId: ComponentId): Record<string, unknown> {
    const context: Record<string, unknown> = {
      mode: this.mode,
      root: this.root,
    };

    if (this.mode === 'project') {
      context.viteServer = !!this.viteServer;
    }

    return context;
  }

  async loadComponentSource(componentId: ComponentId): Promise<string | null> {
    return this.loader.getSource(componentId);
  }

  getStatus(): RuntimeState {
    return this.state;
  }

  getLastError(): Error | null {
    return this.lastError;
  }

  getCurrentComponent(): ComponentId | null {
    return this.currentComponent;
  }

  setMode(mode: 'isolated' | 'project'): void {
    this.mode = mode;
  }

  reset(): void {
    this.state = 'idle';
    this.currentComponent = null;
    this.lastError = null;
  }
}
