import { describe, it, expect } from 'vitest';
import { VERSION, DEFAULT_SERVER_PORT, DEFAULT_COMPONENTS_PATTERN } from './index.js';

describe('core', () => {
  it('should export VERSION', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('should export DEFAULT_SERVER_PORT', () => {
    expect(DEFAULT_SERVER_PORT).toBe(5678);
  });

  it('should export DEFAULT_COMPONENTS_PATTERN', () => {
    expect(DEFAULT_COMPONENTS_PATTERN).toBe('**/*.vue');
  });
});
