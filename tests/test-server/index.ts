import {join} from "path";
import express, {Express} from 'express'
import {TestCasters} from "./test-helpers/test-casters.class";
import {TestErrorHandler} from "./test-helpers/error.handler";
import {MiddlewareGenerator} from "./reef-extends/middleware-generator.class";
import {ControllerBundle, GenericLogger} from './reef/helpers/aq-base.types';
import { Reef } from "./reef/helpers/reef";


function getLogger(funcName: string, path?: string): GenericLogger {
  return {
    info: (...args) => console.info(funcName, path, ...args),
    debug: (...args) => console.info(funcName, path, ...args),
    warn: (...args) => console.info(funcName, path, ...args),
    error: (...args) => console.info(funcName, path, ...args),
  }
}

export async function initializeServer(bindToPort?: boolean) {
  const app: Express = express()

  const v1Bundle: ControllerBundle = {
    baseRoute: '/api/v1',
    controllerDirPath: join(__dirname, 'controllers'),
    controllerFileNamePattern: /^.+\.controller/g,
  }

  const clh = new Reef(app)
  await clh
    .setGlobalMiddleware(express.json())
    .setGlobalMiddleware(express.urlencoded({extended: false}))
    .defineParamCaster(TestCasters)
    .setControllerBundle(v1Bundle)
    .setMiddlewareGenerator(MiddlewareGenerator)
    .addErrorHandler(TestErrorHandler)
    // .setGetTraceIdFunction((res) =>  res.header('x-aws-trace'))
    .setLoggerFn(getLogger)
    .launch()

  if (bindToPort) {
    app.listen(1082, () => {})
  }
    return app
}

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p)
  })
  .on('uncaughtException', err => {
    console.warn(err)
  })
