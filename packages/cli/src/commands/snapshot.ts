import { Scanner } from '@vue-lab/scanner';
import { SnapshotGenerator, SnapshotStorage, SnapshotComparisonEngine } from '@vue-lab/snapshot';
import { ComponentMeta, FileWatchEvent } from '@vue-lab/core';

export interface SnapshotCommandOptions {
  output?: string;
  format?: 'png' | 'webp';
  width?: number;
  height?: number;
  only?: string[];
  watch?: boolean;
  compare?: boolean;
}

export async function snapshot(options: SnapshotCommandOptions = {}) {
  const outputDir = options.output || '.vue-lab/snapshots';
  
  console.log('Scanning components...');

  try {
    const scanner = new Scanner({
      root: process.cwd(),
      srcDir: 'src',
    });

    const components = await scanner.scanWithAnalysis();

    if (components.length === 0) {
      console.log('\nNo Vue components found in src/**/*.vue');
      return;
    }

    console.log(`Found ${components.length} components\n`);

    const filteredComponents = options.only
      ? components.filter(c => options.only!.includes(c.name) || options.only!.includes(c.id))
      : components;

    if (filteredComponents.length === 0) {
      console.log('No matching components found');
      return;
    }

    const generator = new SnapshotGenerator({
      outputDir,
      format: options.format || 'png',
      width: options.width || 800,
      height: options.height || 600,
    });

    const storage = new SnapshotStorage({ outputDir });
    const comparisonEngine = new SnapshotComparisonEngine(storage);

    let current = 0;
    const results: { component: ComponentMeta; success: boolean; error?: string }[] = [];

    for (const component of filteredComponents) {
      current++;
      const progress = `[${current}/${filteredComponents.length}]`;
      process.stdout.write(`\r${progress} Capturing ${component.name}...`);

      const result = await generator.capture(component);

      if (result.success && result.snapshot) {
        await storage.save(result.snapshot);
        results.push({ component, success: true });
      } else {
        results.push({ component, success: false, error: result.error });
      }
    }

    console.log('\n\n');

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log('Snapshot Results:');
    console.log('─'.repeat(40));
    console.log(`  Total: ${results.length}`);
    console.log(`  Success: ${successCount}`);
    console.log(`  Failed: ${failCount}`);

    if (options.compare) {
      console.log('\nComparing with previous snapshots...\n');

      for (const result of results) {
        if (result.success) {
          const latestSnapshot = await storage.getLatestSnapshot(result.component.id);
          if (latestSnapshot) {
            const diffResult = await comparisonEngine.compareWithLatest(result.component.id, latestSnapshot);
            if (diffResult && diffResult.diff.similarity < 0.99) {
              console.log(`  ${result.component.name}: changed (${Math.round(diffResult.diff.similarity * 100)}% similar)`);
            }
          }
        }
      }
    }

    console.log(`\nSnapshots saved to: ${outputDir}`);

  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

export async function snapshotWatch(options: SnapshotCommandOptions = {}) {
  console.log('Starting snapshot watch mode...\n');
  console.log('Press Ctrl+C to stop\n');

  const scanner = new Scanner({
    root: process.cwd(),
    srcDir: 'src',
  });

  const generator = new SnapshotGenerator({
    outputDir: options.output || '.vue-lab/snapshots',
    format: options.format || 'png',
    width: options.width || 800,
    height: options.height || 600,
  });

  await scanner.watch();

  scanner.onChange = async (event: FileWatchEvent) => {
    if (event.component) {
      console.log(`\n[${event.event}] ${event.component.name}`);

      if (event.event !== 'unlink') {
        const result = await generator.capture(event.component);
        if (result.success) {
          console.log('  Snapshot captured');
        } else {
          console.log(`  Error: ${result.error}`);
        }
      }
    }
  };

  console.log('Watching for changes...\n');
}
