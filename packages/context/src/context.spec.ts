import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { ProjectSetupDetector } from './detector-setup.js';
import { VueInjector } from './injector.js';

describe('ProjectSetupDetector', () => {
  let testDir: string;
  let detector: ProjectSetupDetector;

  beforeEach(() => {
    testDir = join('/tmp', `vue-lab-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, 'src'), { recursive: true });
    detector = new ProjectSetupDetector({ strict: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('detectProjectType', () => {
    it('should detect vue project', async () => {
      const result = await detector.detectProjectType({
        root: testDir,
        srcDir: 'src',
        type: 'vue',
      });

      expect(result).toBe('vue');
    });

    it('should detect nuxt project when nuxt.config.ts exists', async () => {
      writeFileSync(join(testDir, 'nuxt.config.ts'), 'export default {}');

      const result = await detector.detectProjectType({
        root: testDir,
        srcDir: 'src',
        type: 'nuxt',
      });

      expect(result).toBe('nuxt');
    });
  });

  describe('detect', () => {
    it('should detect empty project', async () => {
      const result = await detector.detect({
        root: testDir,
        srcDir: 'src',
        type: 'vue',
      });

      expect(result.pinia.detected).toBe(false);
      expect(result.router.detected).toBe(false);
      expect(result.i18n.detected).toBe(false);
      expect(result.nuxt).toBeNull();
    });
  });
});

describe('VueInjector', () => {
  const injector = new VueInjector();
  const context = {
    mode: 'project' as const,
    config: { root: '/mock', srcDir: 'src', type: 'vue' as const },
    setup: {
      pinia: { detected: false },
      router: { detected: false },
      i18n: { detected: false },
      nuxt: { detected: false },
    },
    plugins: new Map(),
    providers: new Map(),
    stores: new Map(),
  };

  it('should inject plugin', async () => {
    const plugin = {
      name: 'test-plugin',
      install: () => {},
    };

    const result = await injector.injectPlugin(context, 'test-plugin', plugin);

    expect(result.success).toBe(true);
    expect(context.plugins.has('test-plugin')).toBe(true);
  });

  it('should inject provider', async () => {
    const provider = {
      name: 'test-provider',
      provide: () => ({ value: 'test' }),
    };

    const result = await injector.injectProvider(context, 'test-provider', provider);

    expect(result.success).toBe(true);
    expect(context.providers.has('test-provider')).toBe(true);
  });

  it('should inject store', async () => {
    const store = { state: { count: 0 } };

    const result = await injector.injectStore(context, 'test-store', store);

    expect(result.success).toBe(true);
    expect(context.stores.has('test-store')).toBe(true);
  });

  it('should check hasPlugin', async () => {
    expect(injector.hasPlugin(context, 'test-plugin')).toBe(true);
    expect(injector.hasPlugin(context, 'nonexistent')).toBe(false);
  });

  it('should check hasProvider', async () => {
    expect(injector.hasProvider(context, 'test-provider')).toBe(true);
    expect(injector.hasProvider(context, 'nonexistent')).toBe(false);
  });

  it('should check hasStore', async () => {
    expect(injector.hasStore(context, 'test-store')).toBe(true);
    expect(injector.hasStore(context, 'nonexistent')).toBe(false);
  });
});
