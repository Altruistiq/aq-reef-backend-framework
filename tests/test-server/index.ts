import {join} from "path";
import express, { Express } from 'express'
import {TestCasters} from "./test-helpers/test-casters.class";
import {TestErrorHandler} from "./test-helpers/error.handler";
import {ControllerLoaderHelper} from "./reef/helpers/controller-loader.helper";
import {GenericLogger} from "./reef/helpers/aq-base.types";
import {MiddlewareGenerator} from "./reef-extends/middleware-generator.class";

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

  const clh = new ControllerLoaderHelper(app)
  await clh
    .addGlobalMiddleware(express.json())
    .addGlobalMiddleware(express.urlencoded({extended: false}))
    .setCasters(TestCasters)
    .setControllerBundle('/api/v1/', join(__dirname, 'controllers'), /^.+\.controller/g, false)
    .setMiddlewareGenerator(MiddlewareGenerator)
    .addErrorHandler(TestErrorHandler)
    // .setGetTraceIdFunction((res) =>  res.header('x-aws-trace'))
    .setGetLoggerFn(getLogger)
    .launch()

  return app
}

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p)
  })
  .on('uncaughtException', err => {
    console.warn(err)
  })
