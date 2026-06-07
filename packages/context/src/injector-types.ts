import type { RuntimeContext, InjectionResult } from './types.js';

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
