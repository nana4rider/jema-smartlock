import config from 'config';
import * as log4js from 'log4js';
import * as mqtt from 'mqtt';
import Context from '../Context';
import { convertJemaState, convertLockState } from '../util';

const { jema } = Context;

const logger = log4js.getLogger();
const client = mqtt.connect(config.get('mqtt.broker'));
const doorId = config.get('door.id');
const topicBase = `smartlock/${doorId}`;

client.on('connect', () => {
  client.subscribe(`${topicBase}/set`, { qos: 2 }, err => {
    if (err) {
      logger.error(err);
    }
  });

  jema.on('change', lock => {
    client.publish(`${topicBase}/get`, convertLockState(lock), { qos: 1, retain: true });
  });

  logger.info('- MQTT Start -');
});

client.on('message', async (topic, message) => {
  if (topic !== `${topicBase}/set`) return;

  const requestState = convertJemaState(message.toString());
  const currentState = await jema.getMonitor();

  if (requestState !== currentState) {
    await jema.sendControl();
  }
});
