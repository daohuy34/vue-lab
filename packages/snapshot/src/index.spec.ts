import { describe, it, expect } from 'vitest';
import { SnapshotStorage, SnapshotGenerator, SnapshotComparisonEngine } from '../src/index.js';

describe('SnapshotStorage', () => {
  it('should initialize', () => {
    const storage = new SnapshotStorage();
    expect(storage).toBeDefined();
  });
});

describe('SnapshotGenerator', () => {
  it('should initialize', () => {
    const generator = new SnapshotGenerator();
    expect(generator).toBeDefined();
  });
});

describe('SnapshotComparisonEngine', () => {
  it('should initialize', () => {
    const storage = new SnapshotStorage();
    const engine = new SnapshotComparisonEngine(storage);
    expect(engine).toBeDefined();
  });
});
