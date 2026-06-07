import { join } from 'path';
import type { RuntimeContext, ProjectConfig, ProjectSetup, InjectionResult } from './types.js';
import type { PluginInjector } from './injector-types.js';

export interface ProjectRuntimeOptions {
  config: ProjectConfig;
  setup?: ProjectSetup;
  injector?: PluginInjector;
  mockMissing?: boolean;
}

export class ProjectRuntime {
  private config: ProjectConfig;
  private setup: ProjectSetup | null = null;
  private injector: PluginInjector | null = null;
  private runtime: any = null;
  private context: RuntimeContext;
  private initialized = false;

  constructor(options: ProjectRuntimeOptions) {
    this.config = options.config;
    this.setup = options.setup || null;
    this.injector = options.injector || null;
    
    const mode = this.determineMode();
    this.context = {
      mode,
      config: this.config,
      setup: this.setup || this.getEmptySetup(),
      plugins: new Map(),
      providers: new Map(),
      stores: new Map(),
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    if (this.context.mode === 'project' && this.setup) {
      await this.loadProjectContext();
    }
    
    this.initialized = true;
  }

  async render(componentId: string, props: Record<string, unknown> = {}): Promise<unknown> {
    await this.initialize();
    
    if (!this.runtime) {
      throw new Error('Runtime not initialized');
    }
    
    return this.runtime.render(componentId, props);
  }

  async injectPlugin(name: string, plugin: unknown): Promise<InjectionResult> {
    if (!this.injector) {
      return { success: false, error: 'No injector configured' };
    }
    
    return this.injector.injectPlugin(this.context, name, plugin);
  }

  async injectProvider(name: string, provider: unknown): Promise<InjectionResult> {
    if (!this.injector) {
      return { success: false, error: 'No injector configured' };
    }
    
    return this.injector.injectProvider(this.context, name, provider);
  }

  async injectStore(name: string, store: unknown): Promise<InjectionResult> {
    if (!this.injector) {
      return { success: false, error: 'No injector configured' };
    }
    
    return this.injector.injectStore(this.context, name, store);
  }

  getContext(): RuntimeContext {
    return this.context;
  }

  getMode(): 'isolated' | 'project' {
    return this.context.mode;
  }

  getSetup(): ProjectSetup | null {
    return this.setup;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  setMode(mode: 'isolated' | 'project'): void {
    this.context.mode = mode;
  }

  async loadSetup(setup: ProjectSetup): Promise<void> {
    this.setup = setup;
    this.context.setup = setup;
    
    if (this.context.mode === 'project') {
      await this.loadProjectContext();
    }
  }

  private determineMode(): 'isolated' | 'project' {
    if (!this.setup) {
      return 'isolated';
    }

    const hasAnySetup = 
      this.setup.pinia?.detected ||
      this.setup.router?.detected ||
      this.setup.i18n?.detected ||
      this.setup.nuxt?.detected;

    return hasAnySetup ? 'project' : 'isolated';
  }

  private async loadProjectContext(): Promise<void> {
    if (!this.setup || !this.injector) return;

    if (this.setup.pinia?.detected && this.setup.pinia.entryPath) {
      await this.loadPinia(this.setup.pinia.entryPath);
    }

    if (this.setup.router?.detected && this.setup.router.entryPath) {
      await this.loadRouter(this.setup.router.entryPath);
    }

    if (this.setup.i18n?.detected && this.setup.i18n.entryPath) {
      await this.loadI18n(this.setup.i18n.entryPath);
    }

    if (this.setup.nuxt?.detected) {
      await this.loadNuxtContext();
    }
  }

  private async loadPinia(entryPath: string): Promise<void> {
    try {
      const fullPath = join(this.config.root, this.config.srcDir, entryPath);
      const module = await this.importModule(fullPath);
      
      const mod = module as Record<string, unknown> | null;
      const stores = mod?.default || mod?.stores || {};
      for (const [name, store] of Object.entries(stores as Record<string, unknown>)) {
        await this.doInjectStore(name, store);
      }
    } catch (error) {
      console.warn(`Failed to load Pinia setup from ${entryPath}:`, error);
    }
  }

  private async loadRouter(entryPath: string): Promise<void> {
    try {
      const fullPath = join(this.config.root, this.config.srcDir, entryPath);
      const module = await this.importModule(fullPath);
      
      const mod = module as Record<string, unknown> | null;
      const router = mod?.default || mod?.router;
      if (router) {
        await this.injectProvider('router', { provide: () => router });
      }
    } catch (error) {
      console.warn(`Failed to load Router setup from ${entryPath}:`, error);
    }
  }

  private async loadI18n(entryPath: string): Promise<void> {
    try {
      const fullPath = join(this.config.root, this.config.srcDir, entryPath);
      const module = await this.importModule(fullPath);
      
      const mod = module as Record<string, unknown> | null;
      const i18n = mod?.default || mod?.i18n;
      if (i18n) {
        await this.injectProvider('i18n', { provide: () => i18n });
      }
    } catch (error) {
      console.warn(`Failed to load I18n setup from ${entryPath}:`, error);
    }
  }

  private async loadNuxtContext(): Promise<void> {
    try {
      const nuxtApp = {
        $config: {},
        $pinia: null,
        $router: null,
        $i18n: null,
      };
      
      await this.injectProvider('nuxtApp', { provide: () => nuxtApp });
      await this.injectProvider('nuxt', { provide: () => ({ app: nuxtApp }) });
    } catch (error) {
      console.warn('Failed to load Nuxt context:', error);
    }
  }

  private async doInjectStore(name: string, store: unknown): Promise<void> {
    if (!this.injector) return;
    
    const result = await this.injector.injectStore(this.context, name, store);
    if (!result.success) {
      console.warn(`Failed to inject store ${name}:`, result.error);
    }
  }

  private importModule(path: string): Promise<unknown> {
    const fileUrl = new URL(`file://${path}`);
    return import(fileUrl.href).catch(() => null);
  }

  private getEmptySetup(): ProjectSetup {
    return {
      pinia: { detected: false },
      router: { detected: false },
      i18n: { detected: false },
      nuxt: { detected: false },
    };
  }
}
