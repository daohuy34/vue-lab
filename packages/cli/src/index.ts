import cac from 'cac';
import { dev } from './commands/dev.js';
import { snapshot, snapshotWatch } from './commands/snapshot.js';

const cli = cac('vue-lab');

cli.version('0.2.0');

cli
  .command('dev', 'Start Vue Lab development server')
  .option('-p, --port <port>', 'Port for dev server', { default: '5678' })
  .option('-o, --open', 'Open browser on start', { default: true })
  .action((options) => dev(options));

cli
  .command('snapshot', 'Generate component snapshots')
  .option('-o, --output <dir>', 'Output directory', { default: '.vue-lab/snapshots' })
  .option('-f, --format <format>', 'Image format (png, webp)', { default: 'png' })
  .option('-w, --width <width>', 'Viewport width', { default: '800' })
  .option('-h, --height <height>', 'Viewport height', { default: '600' })
  .option('--only <components...>', 'Only snapshot specific components')
  .option('-c, --compare', 'Compare with previous snapshots')
  .action(async (options) => {
    await snapshot({
      output: options.output as string,
      format: options.format as 'png' | 'webp',
      width: parseInt(options.width as string),
      height: parseInt(options.height as string),
      only: options.only as string[] | undefined,
      compare: options.compare as boolean | undefined,
    });
  });

cli
  .command('snapshot:watch', 'Watch and generate snapshots on changes')
  .option('-o, --output <dir>', 'Output directory', { default: '.vue-lab/snapshots' })
  .option('-f, --format <format>', 'Image format (png, webp)', { default: 'png' })
  .option('-w, --width <width>', 'Viewport width', { default: '800' })
  .option('-h, --height <height>', 'Viewport height', { default: '600' })
  .action(async (options) => {
    await snapshotWatch({
      output: options.output as string,
      format: options.format as 'png' | 'webp',
      width: parseInt(options.width as string),
      height: parseInt(options.height as string),
    });
  });

cli.help();
cli.parse();
