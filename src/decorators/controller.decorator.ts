import 'reflect-metadata'

import { IEndpointOptions } from '../helpers/aq-base.types'

import {controllerMetaSymbol, middlewareControllerKey} from './symbols'

/**
 * Controller decorator function.
 * Stores the controller information on the class metadata on the "reef:decorators:controller" symbol
 * @param {string} basePath
 * @param {IEndpointOptions} options
 */
export function Controller(basePath: string, options: IEndpointOptions = {}) {
  return function (constructor) {
    let controllerMeta = Reflect.getMetadata(controllerMetaSymbol, constructor) || {}

    controllerMeta = {
      ...controllerMeta,
      basePath,
      options,
    }

    Reflect.defineMetadata(controllerMetaSymbol, controllerMeta, constructor)
  }
}

export function createControllerMiddleware(subject: symbol, params: unknown, allowMultiple: boolean = false) {
  return function (constructor) {
    const controllerMiddlewareInfo = Reflect.getMetadata(subject, constructor) || {}
    if (!controllerMiddlewareInfo[middlewareControllerKey]) controllerMiddlewareInfo[middlewareControllerKey] = { params: [], allowMultiple }

    if (!allowMultiple && controllerMiddlewareInfo[middlewareControllerKey].length > 0) {
      throw new Error(`You can only use one ${subject.toString()} middleware decorator per controller`)
    }

    controllerMiddlewareInfo[middlewareControllerKey].params.push(params)
    Reflect.defineMetadata(subject, controllerMiddlewareInfo, constructor)
  }
}
