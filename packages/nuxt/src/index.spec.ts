import { describe, it, expect } from 'vitest';
import { NuxtDetector, NuxtRuntime } from '../src/index.js';

describe('NuxtDetector', () => {
  it('should detect Nuxt project', async () => {
    const detector = new NuxtDetector();
    const info = await detector.detect();
    
    expect(info).toBeDefined();
    expect(info.isNuxtProject).toBe(false);
    expect(info.features).toBeDefined();
  });
});

describe('NuxtRuntime', () => {
  it('should initialize', async () => {
    const runtime = new NuxtRuntime();
    await runtime.init();
    
    expect(runtime).toBeDefined();
    expect(runtime.isNuxt()).toBe(false);
  });
});
