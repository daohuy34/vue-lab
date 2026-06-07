import program from 'commander';
import { dev } from './commands/dev.js';
import { snapshot, snapshotWatch } from './commands/snapshot.js';

program
  .name('vue-lab')
  .description('Zero-config Component Explorer for Vue & Nuxt')
  .version('0.2.0');

program
  .command('dev')
  .description('Start Vue Lab development server')
  .option('-p, --port <port>', 'Port for dev server', '5678')
  .option('-o, --open', 'Open browser on start', true)
  .action(dev);

program
  .command('snapshot')
  .description('Generate component snapshots')
  .option('-o, --output <dir>', 'Output directory', '.vue-lab/snapshots')
  .option('-f, --format <format>', 'Image format (png, webp)', 'png')
  .option('-w, --width <width>', 'Viewport width', '800')
  .option('-h, --height <height>', 'Viewport height', '600')
  .option('--only <components...>', 'Only snapshot specific components')
  .option('-c, --compare', 'Compare with previous snapshots')
  .action(async (options) => {
    await snapshot({
      output: options.output,
      format: options.format as 'png' | 'webp',
      width: parseInt(options.width),
      height: parseInt(options.height),
      only: options.only,
      compare: options.compare,
    });
  });

program
  .command('snapshot:watch')
  .description('Watch and generate snapshots on changes')
  .option('-o, --output <dir>', 'Output directory', '.vue-lab/snapshots')
  .option('-f, --format <format>', 'Image format (png, webp)', 'png')
  .option('-w, --width <width>', 'Viewport width', '800')
  .option('-h, --height <height>', 'Viewport height', '600')
  .action(async (options) => {
    await snapshotWatch({
      output: options.output,
      format: options.format as 'png' | 'webp',
      width: parseInt(options.width),
      height: parseInt(options.height),
    });
  });

program
  .command('version')
  .description('Show version information')
  .action(() => {
    console.log('vue-lab v0.2.0');
  });

program.parse(process.argv);
