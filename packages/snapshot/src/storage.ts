import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

export interface Snapshot {
  id: string;
  componentId: string;
  componentName: string;
  timestamp: number;
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'webp' | 'svg';
  data: string; // base64 encoded
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

export class SnapshotStorage {
  private baseDir: string;
  private format: 'png' | 'jpeg' | 'webp';

  constructor(options: SnapshotOptions = {}) {
    this.baseDir = options.outputDir || join(process.cwd(), '.vue-lab', 'snapshots');
    this.format = options.format || 'png';
  }

  async init(): Promise<void> {
    await mkdir(this.baseDir, { recursive: true });
  }

  async save(snapshot: Snapshot): Promise<string> {
    await this.init();

    const componentDir = join(this.baseDir, snapshot.componentId);
    await mkdir(componentDir, { recursive: true });

    const filename = `${snapshot.timestamp}.${snapshot.format === 'svg' ? 'svg' : this.format}`;
    const filePath = join(componentDir, filename);

    const imageData = snapshot.data.replace(/^data:image\/\w+;base64,/, '');
    await writeFile(filePath, Buffer.from(imageData, 'base64'));

    const metaPath = join(componentDir, `${snapshot.timestamp}.json`);
    await writeFile(metaPath, JSON.stringify(snapshot, null, 2));

    const indexPath = join(componentDir, 'index.json');
    const snapshots = await this.getSnapshots(snapshot.componentId);
    snapshots.push(snapshot);
    await writeFile(indexPath, JSON.stringify(snapshots, null, 2));

    return filePath;
  }

  async getSnapshots(componentId: string): Promise<Snapshot[]> {
    const indexPath = join(this.baseDir, componentId, 'index.json');

    try {
      const { readFile } = await import('fs/promises');
      const content = await readFile(indexPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  async getLatestSnapshot(componentId: string): Promise<Snapshot | null> {
    const snapshots = await this.getSnapshots(componentId);
    if (snapshots.length === 0) return null;

    return snapshots.reduce((latest, current) =>
      current.timestamp > latest.timestamp ? current : latest
    );
  }

  async getSnapshot(componentId: string, timestamp: number): Promise<Snapshot | null> {
    const snapshots = await this.getSnapshots(componentId);
    return snapshots.find(s => s.timestamp === timestamp) || null;
  }

  async deleteSnapshot(componentId: string, timestamp: number): Promise<void> {
    const { unlink } = await import('fs/promises');
    const componentDir = join(this.baseDir, componentId);
    
    try {
      await unlink(join(componentDir, `${timestamp}.${this.format}`));
    } catch { /* ignore */ }

    try {
      await unlink(join(componentDir, `${timestamp}.json`));
    } catch { /* ignore */ }

    const snapshots = await this.getSnapshots(componentId);
    const filtered = snapshots.filter(s => s.timestamp !== timestamp);
    const indexPath = join(componentDir, 'index.json');
    await writeFile(indexPath, JSON.stringify(filtered, null, 2));
  }

  async listComponents(): Promise<string[]> {
    const { readdir } = await import('fs/promises');
    try {
      const entries = await readdir(this.baseDir);
      return entries.filter(e => !e.startsWith('.'));
    } catch {
      return [];
    }
  }

  async getAllSnapshots(): Promise<Map<string, Snapshot[]>> {
    const components = await this.listComponents();
    const result = new Map<string, Snapshot[]>();

    for (const componentId of components) {
      result.set(componentId, await this.getSnapshots(componentId));
    }

    return result;
  }

  async getSnapshotCount(): Promise<number> {
    let count = 0;
    const components = await this.listComponents();

    for (const componentId of components) {
      const snapshots = await this.getSnapshots(componentId);
      count += snapshots.length;
    }

    return count;
  }

  getSnapshotPath(componentId: string, timestamp: number): string {
    return join(this.baseDir, componentId, `${timestamp}.${this.format}`);
  }

  getDiffPath(componentId: string): string {
    return join(this.baseDir, componentId, 'diff.png');
  }

  get baseDirectory(): string {
    return this.baseDir;
  }
}
