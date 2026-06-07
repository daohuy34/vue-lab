import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { SnapshotStorage } from './storage.js';

export interface Snapshot {
  id: string;
  componentId: string;
  componentName: string;
  timestamp: number;
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'webp' | 'svg';
  data: string;
  props: Record<string, unknown>;
  metadata: SnapshotMetadata;
}

export interface SnapshotMetadata {
  browser: string;
  viewport: string;
  pixelRatio: number;
  runtime: 'isolated' | 'project';
}

export interface SnapshotComparison {
  id: string;
  before: Snapshot;
  after: Snapshot;
  diff: SnapshotDiff;
  timestamp: number;
}

export interface SnapshotDiff {
  added: number;
  removed: number;
  changed: number;
  similarity: number;
  imagePath: string;
}

export interface SnapshotOptions {
  outputDir?: string;
  format?: 'png' | 'jpeg' | 'webp';
  width?: number;
  height?: number;
  pixelRatio?: number;
}

export interface ComparisonOptions {
  threshold?: number;
  outputDir?: string;
}

export class SnapshotComparisonEngine {
  private storage: SnapshotStorage;
  private threshold: number;

  constructor(storage: SnapshotStorage, options: ComparisonOptions = {}) {
    this.storage = storage;
    this.threshold = options.threshold || 0.1;
  }

  async compare(
    componentId: string,
    beforeTimestamp: number,
    afterTimestamp: number
  ): Promise<SnapshotComparison | null> {
    const before = await this.storage.getSnapshot(componentId, beforeTimestamp);
    const after = await this.storage.getSnapshot(componentId, afterTimestamp);

    if (!before || !after) {
      return null;
    }

    const diff = await this.computeDiff(before, after);

    return {
      id: `${componentId}-${beforeTimestamp}-${afterTimestamp}`,
      before,
      after,
      diff,
      timestamp: Date.now(),
    };
  }

  async compareWithLatest(
    componentId: string,
    currentSnapshot: Snapshot
  ): Promise<SnapshotComparison | null> {
    const latest = await this.storage.getLatestSnapshot(componentId);

    if (!latest) {
      return null;
    }

    return this.compare(componentId, latest.timestamp, currentSnapshot.timestamp);
  }

  async compareAll(
    componentIds: string[],
    beforeTimestamp: number,
    afterTimestamp: number
  ): Promise<SnapshotComparison[]> {
    const comparisons: SnapshotComparison[] = [];

    for (const componentId of componentIds) {
      const comparison = await this.compare(componentId, beforeTimestamp, afterTimestamp);
      if (comparison) {
        comparisons.push(comparison);
      }
    }

    return comparisons;
  }

  async generateDiffReport(comparisons: SnapshotComparison[]): Promise<DiffReport> {
    const passed = comparisons.filter(c => c.diff.similarity >= 1 - this.threshold);
    const failed = comparisons.filter(c => c.diff.similarity < 1 - this.threshold);

    const report: DiffReport = {
      total: comparisons.length,
      passed: passed.length,
      failed: failed.length,
      timestamp: Date.now(),
      comparisons,
    };

    return report;
  }

  private async computeDiff(before: Snapshot, after: Snapshot): Promise<SnapshotDiff> {
    const beforeData = before.data.replace(/^data:image\/\w+;base64,/, '');
    const afterData = after.data.replace(/^data:image\/\w+;base64,/, '');

    let added = 0;
    let removed = 0;
    let changed = 0;

    const beforeBuffer = Buffer.from(beforeData, 'base64');
    const afterBuffer = Buffer.from(afterData, 'base64');

    const minLength = Math.min(beforeBuffer.length, afterBuffer.length);
    let identicalPixels = 0;

    for (let i = 0; i < minLength; i++) {
      if (beforeBuffer[i] === afterBuffer[i]) {
        identicalPixels++;
      } else {
        changed++;
      }
    }

    if (afterBuffer.length > beforeBuffer.length) {
      added = afterBuffer.length - beforeBuffer.length;
    } else if (beforeBuffer.length > afterBuffer.length) {
      removed = beforeBuffer.length - afterBuffer.length;
    }

    const similarity = beforeBuffer.length > 0
      ? identicalPixels / beforeBuffer.length
      : 1;

    const diffPath = await this.saveDiffImage(before, after);

    return {
      added,
      removed,
      changed,
      similarity: Math.max(0, Math.min(1, similarity)),
      imagePath: diffPath || '',
    };
  }

  private async saveDiffImage(before: Snapshot, after: Snapshot): Promise<string | null> {
    try {
      const diffDir = join(this.storage.baseDirectory, 'diffs');
      await mkdir(diffDir, { recursive: true });

      const diffPath = join(diffDir, `${before.componentId}-${Date.now()}.png`);

      const afterData = after.data.replace(/^data:image\/\w+;base64,/, '');
      await writeFile(diffPath, Buffer.from(afterData, 'base64'));

      return diffPath;
    } catch {
      return null;
    }
  }

  async getChangeHistory(componentId: string): Promise<ChangeEvent[]> {
    const snapshots = await this.storage.getSnapshots(componentId);

    if (snapshots.length < 2) {
      return [];
    }

    const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);
    const changes: ChangeEvent[] = [];

    for (let i = 1; i < sorted.length; i++) {
      const comparison = await this.compare(
        componentId,
        sorted[i - 1].timestamp,
        sorted[i].timestamp
      );

      if (comparison) {
        changes.push({
          componentId,
          timestamp: sorted[i].timestamp,
          beforeSnapshot: sorted[i - 1],
          afterSnapshot: sorted[i],
          changeType: this.categorizeChange(comparison.diff),
        });
      }
    }

    return changes;
  }

  private categorizeChange(diff: SnapshotDiff): ChangeType {
    if (diff.similarity >= 0.99) {
      return 'none';
    } else if (diff.similarity >= 0.9) {
      return 'minor';
    } else if (diff.similarity >= 0.5) {
      return 'major';
    } else {
      return 'breaking';
    }
  }
}

export interface DiffReport {
  total: number;
  passed: number;
  failed: number;
  timestamp: number;
  comparisons: SnapshotComparison[];
}

export interface ChangeEvent {
  componentId: string;
  timestamp: number;
  beforeSnapshot: Snapshot;
  afterSnapshot: Snapshot;
  changeType: ChangeType;
}

export type ChangeType = 'none' | 'minor' | 'major' | 'breaking';
