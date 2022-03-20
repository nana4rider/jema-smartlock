import config from 'config';
import { JEM1427Gpio } from 'jem1427-gpio-ts';

class Context {
  constructor(public jema: JEM1427Gpio) {
  }
}

const jema = new JEM1427Gpio(config.get('gpio.channel.monitor'), config.get('gpio.channel.control'));

// export as singleton
export default new Context(jema);
