import config from 'config';
import express, { NextFunction, Request, Response } from 'express';
import PromiseRouter from 'express-promise-router';
import createHttpError, { HttpError } from 'http-errors';
import * as log4js from 'log4js';
import passport from 'passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import Context from '../Context';

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

rootRouter.get('/', passport.authenticate('headerapikey', { session: false }), async (req, res) => {
  const currentState = await jema.getMonitor();

  res.json({ state: currentState ? 'LOCK' : 'UNLOCK' });
});

rootRouter.post('/', passport.authenticate('headerapikey', { session: false }), async (req, res) => {
  const strRequestState = req.body.state;

  let requestState: boolean;
  if (strRequestState === 'LOCK') {
    requestState = true;
  } else if (strRequestState === 'UNLOCK') {
    requestState = false;
  } else {
    throw createHttpError(400);
  }

  const currentState = await jema.getMonitor();
  if (requestState === currentState) {
    res.send();
    return;
  }

  await jema.sendControl();
  jema.once('change', () => res.send());
});
