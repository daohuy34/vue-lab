import { cac } from 'cac';
import { dev } from './commands/dev.js';
import { version } from './version.js';

const cli = cac('vue-lab');

cli.version(version);

cli.command('dev', 'Start Vue Lab development server')
  .option('-p, --port <port>', 'Port to run the server on', { default: 5678 })
  .option('-h, --host <host>', 'Host to bind the server on', { default: 'localhost' })
  .option('--no-open', 'Disable automatic browser opening')
  .option('--root <path>', 'Project root directory', { default: process.cwd() })
  .action(dev);

cli.help();

cli.parse();
