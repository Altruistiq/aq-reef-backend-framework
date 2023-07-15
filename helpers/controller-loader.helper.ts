import { readdirSync } from 'fs'
import { join } from 'path'

import { Express, RequestHandler } from 'express'

import { ErrorRequestHandler } from 'express-serve-static-core'

import { CasterClass, GenericLogger, IMiddlewareGenerator, MiddlewareGeneratorClass } from './aq-base.types'

/**
 * Class that find and loads the controllers
 */
export class ControllerLoaderHelper {
  constructor(app: Express) {
    this.app = app
  }

  private readonly app: Express

  private mainRoute = ''

  private CastersClass: CasterClass<any>

  private preRunList: Array<() => void | Promise<void>> = []

  private controllerPath!: string

  private controllerFileNamePattern?: RegExp

  private onlyTs!: boolean

  private globalMiddleware: RequestHandler[] = []

  private middlewareGenerator: IMiddlewareGenerator

  private errorHandlerFn: ErrorRequestHandler

  private getTraceIdFunction: (Request) => string

  private getLoggerFn: (funcName: string, path?: string) => GenericLogger

  private hideLogsForErrors: string[] = []

  preRun(funcList: () => void | Promise<void>) {
    this.preRunList.push(funcList)
    return this
  }

  /**
   * set the caster functions that will be passed in every controller constructor
   * @param casters
   */
  setMiddlewareGenerator(MiddlewareGenerator: MiddlewareGeneratorClass) {
    this.middlewareGenerator = new MiddlewareGenerator()
    return this
  }

  /**
   * set the caster functions that will be passed in every controller constructor
   * @param casters
   */
  setCasters(casters: CasterClass<any>) {
    this.CastersClass = casters
    return this
  }

  /**
   * sets the baseRoute that will be passed in every controller constructor
   * @param mainRoute
   */
  setMainRoute(mainRoute: string) {
    this.mainRoute = mainRoute
    return this
  }

  setControllerPath(path: string, fileNamePattern?: RegExp, onlyTs?: boolean) {
    this.controllerPath = path
    this.controllerFileNamePattern = fileNamePattern
    this.onlyTs = !!onlyTs
    return this
  }

  setGetTraceIdFunction(getTraceIdFunction: (Request) => string) {
    this.getTraceIdFunction = getTraceIdFunction

    return this
  }

  async launch() {
    this.globalMiddleware.forEach(m => this.app.use(m))
    const promises = this.preRunList.map(f => f())
    return Promise.all(promises)
      .then(() => this.loadControllers(this.controllerPath, this.controllerFileNamePattern, this.onlyTs))
      .then(() => this.app.use(this.errorHandlerFn))
  }

  addGlobalMiddleware(...middleware: RequestHandler[]) {
    this.globalMiddleware.push(...middleware)
    return this
  }

  addErrorHandler(errorHandler: ErrorRequestHandler) {
    this.errorHandlerFn = errorHandler
    return this
  }

  setGetLoggerFn(getLoggerFn: (funcName: string, path?: string) => GenericLogger) {
    this.getLoggerFn = getLoggerFn
    return this
  }

  setHideLogsFromErrors(errorClasses: string[]) {

  }

  /**
   * Search file in the given path with the given name pattern and tries to load them as controllers
   * @param {string} path - the path of the controller files
   * @param {RegExp} fileNamePattern - regular expression for matching the proper files
   * @param {boolean} onlyTs - only load ts files
   */
  private loadControllers(path: string, fileNamePattern?: RegExp, onlyTs?: boolean) {
    const allowedExtRegexp = onlyTs ? /^.+?(\.ts$)/g : /^.+?(\.ts$)|(\.js$)/g
    const files = readdirSync(path)

    for (const filename of files) {
      // eslint-disable-next-line no-param-reassign
      if (fileNamePattern && fileNamePattern.lastIndex) fileNamePattern.lastIndex = 0
      allowedExtRegexp.lastIndex = 0



      const allowExt = allowedExtRegexp.test(filename)
      if (!allowExt) continue


      if (fileNamePattern && !fileNamePattern.test(filename)) continue


      const filepath = join(path, filename)

      const controllerLoadFns = []
      const casters = new this.CastersClass()

      controllerLoadFns.push(() =>
        import(filepath).then(importPayload => {
          const Controller = importPayload.default
          // eslint-disable-next-line no-new
          new Controller(
            this.app,
            this.mainRoute,
            casters,
            this.getTraceIdFunction,
            this.getLoggerFn,
            this.middlewareGenerator,
            this.hideLogsForErrors
          )
        })
      )
      controllerLoadFns.reduce((accPromise, currPromise) => accPromise.then(currPromise), Promise.resolve())
    }
  }
}
