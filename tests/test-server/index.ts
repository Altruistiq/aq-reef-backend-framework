import {join} from "path";
import express, { Express } from 'express'
import {TestCasters} from "./test-helpers/test-casters.class";
import {TestErrorHandler} from "./test-helpers/error.handler";
import {ControllerLoaderHelper} from "./reef/helpers/controller-loader.helper";
import {GenericLogger} from "./reef/helpers/aq-base.types";

function getLogger(funcName: string, path?: string): GenericLogger {
  return {
    info: (...args) => console.info(funcName, path, ...args),
    log: (...args) => console.info(funcName, path, ...args),
    warn: (...args) => console.info(funcName, path, ...args),
    error: (...args) => console.info(funcName, path, ...args),
  }
}

export async function initializeServer() {
  const app: Express = express()

  app.use(express.json())
  app.use(express.urlencoded({extended: false}))

  const clh = new ControllerLoaderHelper(app)
  clh
    .setCasters(TestCasters)
    .setControllerBundle('/api/v1/', join(__dirname, 'controllers'), /^.+\.controller/g, false)
    .addErrorHandler(TestErrorHandler)
    .setGetLoggerFn(getLogger)
    // .setMiddlewareGenerator(AqMiddlewareGenerator)
  // .setGetTraceIdFunction((req: Request) => req.headers.get('x-trace-id'))
  await clh.launch()


  return app
}

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p)
  })
  .on('uncaughtException', err => {
    console.warn(err)
  })
