import {readdirSync, statSync} from 'fs'
import { join } from 'path'
import 'reflect-metadata'

import { Express, RequestHandler, Request } from 'express'

import { ErrorRequestHandler } from 'express-serve-static-core'

import { setLoggerFn } from '../decorators/log.decorator'

import {
  CasterClass,
  ControllerBundle,
  GenericLogger,
  IMiddlewareGenerator,
  MiddlewareGeneratorClass,
} from './aq-base.types'
import { DefaultCasters } from './default-casters.helper'

/**
 * Class that find and loads the controllers
 */
export class Reef {
  constructor(app: Express) {
    this.app = app
  }

  private readonly app: Express

  private mainRoute = ''

  private CastersClass: CasterClass<any> | undefined

  private preRunList: Array<(...args: any[]) => void | Promise<void>> = []

  private postRunList: Array<(...args: any[]) => void | Promise<void>> = []

  private controllerBundles: ControllerBundle[] = []

  private globalMiddleware: RequestHandler[] = []

  private middlewareGenerator: IMiddlewareGenerator | undefined

  private errorHandlerFn: ErrorRequestHandler | undefined

  private getTraceIdFunction: ((req: Request) => string) | undefined

  private getLoggerFn: ((funcName: string, path?: string) => GenericLogger) | undefined

  private hideLogsForErrors: string[] = []

  preRun(funcList: (app?: Express) => void | Promise<void>) {
    this.preRunList.push(funcList)
    return this
  }

  postRun(funcList: (app?: Express) => void | Promise<void>) {
    this.postRunList.push(funcList)
    return this
  }

  setMiddlewareGenerator(MiddlewareGenerator: MiddlewareGeneratorClass) {
    this.middlewareGenerator = new MiddlewareGenerator()
    return this
  }

  /**
   * set the caster functions that will be passed in every controller constructor
   * @param casters
   */
  defineParamCaster(casters: CasterClass<any>) {
    this.CastersClass = casters
    return this
  }

  setControllerBundle(bundle: ControllerBundle) {
    this.controllerBundles.push(bundle)
    return this
  }

  setTraceIdFn(getTraceIdFunction: (req: Request) => string) {
    this.getTraceIdFunction = getTraceIdFunction

    return this
  }

  async launch() {
    Error.stackTraceLimit = Infinity
    setLoggerFn(this.getLoggerFn)
    this.globalMiddleware.forEach(m => this.app.use(m))
    const promises = this.preRunList.map(f => f(this.app))
    return Promise.all(promises)
      .then(() =>
        this.controllerBundles.reduce(
          // Chain all te loadController promises
          (accPromise, controllerBundle) => {
            return accPromise.then(() => this.loadControllers(controllerBundle))
          },
          Promise.resolve(),
        ),
      )
      .then(() => {
        return Promise.all(this.postRunList.map(f => f(this.app)))
      })
      .then(() => {
        if (this.errorHandlerFn) this.app.use(this.errorHandlerFn)
      })
  }

  setGlobalMiddleware(...middleware: RequestHandler[]) {
    this.globalMiddleware.push(...middleware)
    return this
  }

  addErrorHandler(errorHandler: ErrorRequestHandler) {
    this.errorHandlerFn = errorHandler
    return this
  }

  setLoggerFn(loggerFn: (funcName: string, path?: string) => GenericLogger) {
    this.getLoggerFn = loggerFn
    return this
  }

  /**
   * Search files in the given path with the given name pattern and tries to load them as controllers
   * @param {ControllerBundle} controllerBundle
   */
  private loadControllers(controllerBundle: ControllerBundle) {
    const { controllerDirPath, controllerFileNamePattern, baseRoute, name: bundleName } = controllerBundle
    const allowedExtRegexp = /^.+?(\.ts$)|(\.js$)/g
    const absolutePathFiles = this.getFilesRecursively(controllerDirPath)
    console.log({ absolutePathFiles })

    const controllerLoadFns = []

    for (const file of absolutePathFiles) {
      // eslint-disable-next-line no-param-reassign
      if (controllerFileNamePattern && controllerFileNamePattern.lastIndex) controllerFileNamePattern.lastIndex = 0
      allowedExtRegexp.lastIndex = 0

      const allowExt = allowedExtRegexp.test(file)
      if (!allowExt) continue

      if (controllerFileNamePattern && !controllerFileNamePattern.test(file)) continue

      controllerLoadFns.push(() =>
        import(file).then(importPayload => {
          const Controller = importPayload.default
          // eslint-disable-next-line no-new
          new Controller(
            this.app,
            baseRoute,
            this.CastersClass ? new this.CastersClass() : new DefaultCasters(),
            this.getTraceIdFunction,
            this.getLoggerFn,
            this.middlewareGenerator,
            bundleName,
          )
        }),
      )
    }

    return controllerLoadFns.reduce(
      (accPromise, currPromise) => accPromise.then(currPromise),
      Promise.resolve(),
    ) as Promise<void>
  }
  private getFilesRecursively(directory: string, files: string[] = []) {
    const filesInDirectory = readdirSync(directory, { encoding: 'utf8' })
    for (const file of filesInDirectory) {
      const absolute = join(directory, file)
      if (statSync(absolute).isDirectory()) {
        this.getFilesRecursively(absolute, files)
      } else {
        files.push(absolute)
      }
    }

    return files
  }

}
