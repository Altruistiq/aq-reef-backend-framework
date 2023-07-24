import 'reflect-metadata'
import { BaseController } from '../helpers/base-controller.class'

import {EndpointDecorator, EndpointInfo, IEndpointOptions, REST_METHODS} from '../helpers/aq-base.types'

import { endpointMetaSymbol } from './symbols'

/**
 * Decorator for the target endpoint function
 * This decorator use automatic method assigning based on the given path
 * @param {string} path - the endpoint sub-path
 * @param {boolean} autoResponse - if false the endpoint won't convert the return of the function to the request response
 */
export function Endpoint(path: string, autoResponse = true) {
  return defineEndpoint(path, autoResponse)
}

/**
 * Decorator for the GET endpoint functions
 * @param {string} path - the endpoint sub-path
 * @param {boolean} autoResponse - if false the endpoint won't convert the return of the function to the request response
 */
export function Get<C extends BaseController>(
  path: string,
  autoResponse = true
): EndpointDecorator<C> {
  return defineEndpoint(path, autoResponse, REST_METHODS.GET)
}

/**
 * Decorator for the POST endpoint functions
 * @param {string} path - the endpoint sub-path
 * @param {boolean} autoResponse - if false the endpoint won't convert the return of the function to the request response
 */
export function Post<C extends BaseController>(
  path: string,
  autoResponse = true
): EndpointDecorator<C> {
  return defineEndpoint(path, autoResponse, REST_METHODS.POST)
}

/**
 * Decorator for the PUT endpoint functions
 * @param {string} path - the endpoint sub-path
 * @param {boolean} autoResponse - if false the endpoint won't convert the return of the function to the request response
 */
export function Put<C extends BaseController>(
  path: string,
  autoResponse = true
): EndpointDecorator<C> {
  return defineEndpoint(path, autoResponse, REST_METHODS.PUT)
}

/**
 * Decorator for the PATCH endpoint functions
 * @param {string} path - the endpoint sub-path
 * @param {boolean} autoResponse - if false the endpoint won't convert the return of the function to the request response
 */
export function Patch<C extends BaseController>(
  path: string,
  autoResponse = true
): EndpointDecorator<C> {
  return defineEndpoint(path, autoResponse, REST_METHODS.PATCH)
}

/**
 * Decorator for the DELETE endpoint functions
 * @param {string} path - the endpoint sub-path
 * @param {boolean} autoResponse - if false the endpoint won't convert the return of the function to the request response
 */
export function Delete<C extends BaseController>(
  path: string,
  autoResponse = true
): EndpointDecorator<C> {
  return defineEndpoint(path, autoResponse, REST_METHODS.DELETE)
}

/**
 * Function that stores the endpoint information in an array format
 * on the controller's class metadata on the "reef:decorators:endpoint" symbol
 * @param {string} path - the endpoint sub-path
 * @param {boolean} autoResponse - if false the endpoint won't convert the return of the function to the request response
 * @param {REST_METHODS | null} method
 */
function defineEndpoint<C extends BaseController>(
  path: string,
  autoResponse = true,
  method: REST_METHODS | null = null
): EndpointDecorator<C> {
  return function (target: BaseController, methodName: string, descriptor: PropertyDescriptor) {
    const endpointInfo = Reflect.getMetadata(endpointMetaSymbol, target) || []

    const payload: EndpointInfo = {
      path,
      methodName,
      descriptor,
      autoResponse,
      method,
      target,
    }

    endpointInfo.push(payload)
    Reflect.defineMetadata(endpointMetaSymbol, endpointInfo, target)
  }
}

export function createEndpointMiddleware(subject: symbol, params: unknown) {
  return function (target: BaseController, methodName: string, descriptor: PropertyDescriptor) {
    const controllerMiddlewareInfo = Reflect.getMetadata(subject, target) || {}
    if (!controllerMiddlewareInfo[methodName]) controllerMiddlewareInfo[methodName] = []
    controllerMiddlewareInfo[methodName].push(params)
    Reflect.defineMetadata(subject, controllerMiddlewareInfo, target)
  }
}
