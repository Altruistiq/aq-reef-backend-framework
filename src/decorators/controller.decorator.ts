import 'reflect-metadata'

import { IEndpointOptions } from '../helpers/aq-base.types'

import { controllerMetaSymbol } from './symbols'

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
