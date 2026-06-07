export interface ProjectConfig {
  root: string;
  srcDir: string;
  type: 'vue' | 'nuxt';
}

export interface ProjectSetup {
  pinia: {
    detected: boolean;
    entryPath?: string;
    storeFiles?: string[];
  } | null;
  router: {
    detected: boolean;
    entryPath?: string;
    routesFile?: string;
  } | null;
  i18n: {
    detected: boolean;
    entryPath?: string;
    locales?: string[];
  } | null;
  nuxt: {
    detected: boolean;
    nuxtConfigPath?: string;
    modules?: string[];
  } | null;
}

export type RuntimeMode = 'isolated' | 'project';

export interface RuntimeContext {
  mode: RuntimeMode;
  config: ProjectConfig;
  setup: ProjectSetup;
  plugins: Map<string, unknown>;
  providers: Map<string, unknown>;
  stores: Map<string, unknown>;
}

export interface InjectionResult {
  success: boolean;
  error?: string;
}

export interface ContextInjectorOptions {
  autoInject?: boolean;
  mockMissing?: boolean;
}

export type ComponentId = string;

export interface RenderOptions {
  componentId: ComponentId;
  props?: Record<string, unknown>;
}

export interface PluginInjector {
  injectPlugin(context: RuntimeContext, name: string, plugin: unknown): InjectionResult;
  injectProvider(context: RuntimeContext, name: string, provider: unknown): InjectionResult;
  injectStore(context: RuntimeContext, name: string, store: unknown): InjectionResult;
  hasPlugin(context: RuntimeContext, name: string): boolean;
  hasProvider(context: RuntimeContext, name: string): boolean;
  hasStore(context: RuntimeContext, name: string): boolean;
}

export interface PluginDefinition {
  name: string;
  install: (app: unknown) => void;
}

export interface ProviderDefinition {
  name: string;
  provide: () => unknown;
}

export interface StoreDefinition {
  name: string;
  store: unknown;
}

export interface ProjectRuntimeOptions {
  config: ProjectConfig;
  setup?: ProjectSetup;
  injector?: PluginInjector;
  mockMissing?: boolean;
  renderFn?: (options: RenderOptions) => Promise<unknown>;
}
