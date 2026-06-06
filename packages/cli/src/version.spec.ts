import { describe, it, expect } from 'vitest';
import { version } from './version.js';

describe('cli', () => {
  it('should export version', () => {
    expect(version).toBe('0.1.0');
  });
});
