import type { RuntimeContext, InjectionResult } from './types.js';
import type { PluginInjector, PluginDefinition, ProviderDefinition } from './injector-types.js';

export class VueInjector implements PluginInjector {
  injectPlugin(context: RuntimeContext, name: string, plugin: unknown): InjectionResult {
    try {
      if (context.plugins.has(name)) {
        return { success: true };
      }

      context.plugins.set(name, plugin);

      const pluginDef = plugin as PluginDefinition;
      if (typeof pluginDef.install === 'function') {
        pluginDef.install({});
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  injectProvider(context: RuntimeContext, name: string, provider: unknown): InjectionResult {
    try {
      if (context.providers.has(name)) {
        return { success: true };
      }

      const providerDef = provider as ProviderDefinition;
      const value = providerDef.provide();
      context.providers.set(name, value);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  injectStore(context: RuntimeContext, name: string, store: unknown): InjectionResult {
    try {
      if (context.stores.has(name)) {
        return { success: true };
      }

      context.stores.set(name, store);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  hasPlugin(context: RuntimeContext, name: string): boolean {
    return context.plugins.has(name);
  }

  hasProvider(context: RuntimeContext, name: string): boolean {
    return context.providers.has(name);
  }

  hasStore(context: RuntimeContext, name: string): boolean {
    return context.stores.has(name);
  }
}

export class MockInjector implements PluginInjector {
  injectPlugin(_context: RuntimeContext, _name: string, _plugin: unknown): InjectionResult {
    return { success: true };
  }

  injectProvider(_context: RuntimeContext, _name: string, _provider: unknown): InjectionResult {
    return { success: true };
  }

  injectStore(_context: RuntimeContext, _name: string, _store: unknown): InjectionResult {
    return { success: true };
  }

  hasPlugin(_context: RuntimeContext, _name: string): boolean {
    return true;
  }

  hasProvider(_context: RuntimeContext, _name: string): boolean {
    return true;
  }

  hasStore(_context: RuntimeContext, _name: string): boolean {
    return true;
  }
}

export class CompositeInjector implements PluginInjector {
  private injectors: PluginInjector[] = [];

  addInjector(injector: PluginInjector): void {
    this.injectors.push(injector);
  }

  injectPlugin(context: RuntimeContext, name: string, plugin: unknown): InjectionResult {
    for (const injector of this.injectors) {
      const result = injector.injectPlugin(context, name, plugin);
      if (result.success) {
        return result;
      }
    }
    return { success: false, error: 'All injectors failed' };
  }

  injectProvider(context: RuntimeContext, name: string, provider: unknown): InjectionResult {
    for (const injector of this.injectors) {
      const result = injector.injectProvider(context, name, provider);
      if (result.success) {
        return result;
      }
    }
    return { success: false, error: 'All injectors failed' };
  }

  injectStore(context: RuntimeContext, name: string, store: unknown): InjectionResult {
    for (const injector of this.injectors) {
      const result = injector.injectStore(context, name, store);
      if (result.success) {
        return result;
      }
    }
    return { success: false, error: 'All injectors failed' };
  }

  hasPlugin(context: RuntimeContext, name: string): boolean {
    return this.injectors.some((injector) => injector.hasPlugin(context, name));
  }

  hasProvider(context: RuntimeContext, name: string): boolean {
    return this.injectors.some((injector) => injector.hasProvider(context, name));
  }

  hasStore(context: RuntimeContext, name: string): boolean {
    return this.injectors.some((injector) => injector.hasStore(context, name));
  }
}
