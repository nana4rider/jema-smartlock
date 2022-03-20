import config from 'config';
import * as log4js from 'log4js';
import * as mqtt from 'mqtt';
import Context from '../Context';

const { jema } = Context;

const logger = log4js.getLogger();
const client = mqtt.connect(config.get('mqtt.broker'));
const doorId = config.get('door.id');
const topicBase = `smartlock/${doorId}`;

client.on('connect', () => {
  client.subscribe(`${topicBase}/post`, { qos: 2 }, err => {
    if (err) {
      logger.error(err);
    }
  });

  jema.on('change', lock => {
    client.publish(`${topicBase}/get`, lock ? 'LOCK' : 'UNLOCK', { qos: 1 });
  });

  logger.info('- MQTT Start -');
});

client.on('message', async (topic, message) => {
  if (topic !== `${topicBase}/post`) return;

  const strRequestState = message.toString();

  let requestState: boolean;
  if (strRequestState === 'LOCK') {
    requestState = true;
  } else if (strRequestState === 'UNLOCK') {
    requestState = false;
  } else {
    return;
  }

  const currentState = await jema.getMonitor();
  if (requestState !== currentState) {
    await jema.sendControl();
  }
});
