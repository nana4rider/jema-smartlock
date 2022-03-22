import config from 'config';
import express, { NextFunction, Request, Response } from 'express';
import PromiseRouter from 'express-promise-router';
import createHttpError, { HttpError } from 'http-errors';
import * as log4js from 'log4js';
import passport from 'passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import Context from '../Context';
import { convertJemaState, convertLockState } from '../util';

const { jema } = Context;

const logger = log4js.getLogger();
const app = express();
const rootRouter = PromiseRouter();
const apikey = config.get('rest.apikey');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', rootRouter);

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(error);

  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode);
    res.send({ message: error.message });
  } else {
    res.status(500);
    res.send({ message: 'エラーが発生しました。' });
  }
});

app.listen(config.get('server.port'), () => {
  logger.info('- HTTP Server Start -');
});

passport.use(new HeaderAPIKeyStrategy(
  { header: 'Authorization', prefix: 'Api-Key ' }, false,
  (inputkey, done) => {
    if (apikey && inputkey !== apikey) {
      done(createHttpError(401));
    } else {
      done(null, true);
    }
  }
));

rootRouter.use('/', passport.authenticate('headerapikey', { session: false }));

rootRouter.get('/', async (req, res) => {
  const currentState = await jema.getMonitor();

  res.json({ state: convertLockState(currentState) });
});

rootRouter.put('/', async (req, res) => {
  let requestState;
  try {
    requestState = convertJemaState(req.body.state);
  } catch (e) {
    throw createHttpError(400);
  }

  const currentState = await jema.getMonitor();
  if (requestState === currentState) {
    res.send();
    return;
  }

  await jema.sendControl();

  const timer = setTimeout(() => {
    throw createHttpError(503);
  }, 3000);

  jema.once('change', () => {
    clearTimeout(timer);
    res.send();
  });
});
