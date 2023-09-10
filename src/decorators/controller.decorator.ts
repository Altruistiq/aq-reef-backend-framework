import 'reflect-metadata'

import {controllerMetaSymbol, middlewareControllerKey} from './symbols'

/**
 * Controller decorator function.
 * Stores the controller information on the class metadata on the "reef:decorators:controller" symbol
 * @param {string} basePath
 */
export function Controller(basePath: string) {
  return function (constructor) {
    let controllerMeta = Reflect.getMetadata(controllerMetaSymbol, constructor) || {}

    controllerMeta = {
      ...controllerMeta,
      basePath,
    }

    Reflect.defineMetadata(controllerMetaSymbol, controllerMeta, constructor)
  }
}

export function createControllerMiddleware(subject: symbol, params: unknown) {
  return function (constructor) {
    const controllerMiddlewareInfo = Reflect.getMetadata(subject, constructor) || {}
    if (!controllerMiddlewareInfo[middlewareControllerKey]) controllerMiddlewareInfo[middlewareControllerKey] = []
    controllerMiddlewareInfo[middlewareControllerKey].push(params)
    Reflect.defineMetadata(subject, controllerMiddlewareInfo, constructor)
  }
}
