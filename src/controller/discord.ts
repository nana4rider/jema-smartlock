import config from 'config';
import Eris, { ComponentInteraction, Constants } from 'eris';
import * as log4js from 'log4js';
import { exit } from 'process';
import Context from '../Context';

const { jema } = Context;

const logger = log4js.getLogger();

const channelId: string = config.get('discord.channelId');
const doorId = config.get('door.id');
const doorName: string = config.get('door.name');
const buttonCustomId = `custom_id_${doorId}`;
const unlockNotificationMinute: number = config.get('discord.unlockNotificationMinute');

let notificationTimerId: NodeJS.Timeout | undefined = undefined;
let warningMessageId: string | undefined = undefined;

const bot = new Eris.CommandClient(config.get('discord.token'), {
  intents: Constants.Intents.guildMessages
}, {
  prefix: ['/'],
  defaultHelpCommand: false
});

void bot.connect();

bot.once('ready', () => {
  logger.info('- Discord BOT Start -');
});

bot.on('error', error => {
  logger.error('Bot Error: ', error.message);
  if (error.message.includes('getaddrinfo ENOTFOUND gateway.discord.gg')) {
    exit(1);
  }
});

// 施錠忘れ防止
jema.on('change', lock => {
  if (!lock) {
    if (!notificationTimerId) {
      notificationTimerId = setTimeout(() => {
        void bot.createMessage(channelId, {
          content: `@everyone ${doorName}が${unlockNotificationMinute}分以上解錠されています🔓`,
          components: [{
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [{
              type: Constants.ComponentTypes.BUTTON,
              style: Constants.ButtonStyles.SUCCESS,
              custom_id: buttonCustomId,
              label: '施錠'
            }]
          }]
        }).then(message => {
          warningMessageId = message.id;
        });
      }, 1000 * 60 * unlockNotificationMinute);
    }
  } else {
    if (warningMessageId) {
      // 施錠ボタン以外の方法で施錠された場合
      void bot.createMessage(channelId, {
        messageReference: { messageID: warningMessageId },
        content: `${doorName}を施錠しました🔒`
      });
      warningMessageId = undefined;
    }
    if (notificationTimerId) {
      clearTimeout(notificationTimerId);
      notificationTimerId = undefined;
    }
  }
});

bot.on('interactionCreate', async interaction => {
  if (!(interaction instanceof ComponentInteraction)
    || interaction.data.custom_id !== buttonCustomId) {
    return;
  }

  const lock = await jema.getMonitor();
  const mention = interaction.member ? `<@${interaction.member.id}>` : '';

  if (lock) {
    void interaction.createMessage({
      content: `${mention} ${doorName}は既に施錠されています🔒`,
    });
  } else {
    warningMessageId = undefined;
    await jema.sendControl();
    void interaction.createMessage({
      content: `${mention} ${doorName}を施錠しました🔒`,
    });
  }
});
