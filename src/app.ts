import config from 'config';
import * as log4js from 'log4js';
import * as luxon from 'luxon';
import * as log4jconfig from './config/log4js';
import Context from './Context';

const { jema } = Context;

// Luxon
const locale: string = config.get('date.locale');
const timezone: string = config.get('date.timezone');
luxon.Settings.defaultLocale = locale;
luxon.Settings.defaultZone = timezone;
luxon.Settings.throwOnInvalid = true;

// log4js
log4js.configure(log4jconfig.configures[config.get('env') as string]);
const logger = log4js.getLogger();

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at:', p, 'reason:', reason);
});

// main
require('./controller/discord');
require('./controller/rest');
require('./controller/mqtt');
if (config.has('flic')) {
  require('./controller/flic');
}

void jema.init();

jema.once('ready', () => {
  logger.info('- JEM-A Start -');
});
