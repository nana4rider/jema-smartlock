import config from 'config';
import { ClickOrHold, FlicClient, FlicConnectionChannel } from 'fliclib-js';
import { getLogger } from 'log4js';
import { DateTime } from 'luxon';
import Context from '../Context';

const logger = getLogger();
const { jema } = Context;

const client = new FlicClient(config.get('flic.host'));

client.once('ready', () => {
  logger.info('- Flic Client Start -');

  const connectionChannel = new FlicConnectionChannel(config.get('flic.macAddress'));
  client.addConnectionChannel(connectionChannel);

  let prevTime = DateTime.local(1970);
  connectionChannel.on('buttonClickOrHold', async (clickType: ClickOrHold, wasQueued: boolean, timeDiff: number) => {
    const currTime = DateTime.local();
    if (timeDiff >= 5)  {
      logger.info('flicdの命令受信が5秒以上遅延');
      return;
    } else if (currTime.diff(prevTime).milliseconds <= 1500) {
      logger.info('前回の命令受信から1.5秒以内');
      return;
    }
    prevTime = currTime;

    // Click: unlock, Hold: lock
    const requestState = clickType !== 'ButtonClick';
    const currentState = await jema.getMonitor();
    if (requestState !== currentState) {
      await jema.sendControl();
    }
  });
});
