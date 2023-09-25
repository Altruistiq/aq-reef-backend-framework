import { RequestHandler, Request, Response, NextFunction } from 'express'

import { DefaultCasters } from './default-casters.helper'

import { BaseController } from './base-controller.class'

export type CasterClass<T extends DefaultCasters> = new (...args: any[]) => T & typeof DefaultCasters

export type AnyError<T extends Error> = new (...args: any[]) => T

export type MiddlewareGenericOptions = { [key: symbol]: unknown[] }
export interface IMiddlewareGenerator {
  getMiddlewareSymbols(): symbol[]
  getMiddleware(
    controllerOptions: MiddlewareGenericOptions,
    endpointOptions: MiddlewareGenericOptions,
  ): RequestHandler[]
}

export type MiddlewareGeneratorClass = new (...args: any[]) => IMiddlewareGenerator

export type AnyFunction = (...args: unknown[]) => unknown

export type LogParamDecorator = (target: any, methodName: string | symbol, parameterIndex: number) => void

export type EndpointFunc = (...args: unknown[]) => unknown

export type ExpressRouteFunc = (req: Request, res: Response) => void

export type EndpointParamMeta = {
  actions: IParamDecoratorActions
  cast: boolean
  decorator: string
  index: number
  isRequired?: boolean
  name: string
  path: string | undefined
  type: typeof Object
}

export type EndpointInfo = {
  autoResponse: boolean
  descriptor: PropertyDescriptor
  method: REST_METHODS
  methodName: string
  path: string
  target: any
}

export type CreatedEndpointInfo = {
  HTTPMethod: REST_METHODS
  endpointParamMeta: EndpointParamMeta[]
  methodName: string
  path: string
}

export type ControllerMeta = {
  basePath: string
}

export type EndpointDecorator<C extends BaseController> = (
  target: C,
  methodName: string,
  descriptor: PropertyDescriptor,
) => void

export type ParamDecorator = (target: any, methodName: string | symbol, parameterIndex: number) => void

export interface IEndpointOptions {
  [key: string]: unknown
}

export interface GenericLogger {
  info: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

export interface IParamDecoratorActions {
  getValue(
    req: Request,
    res: Response,
    casters: DefaultCasters,
    meta: EndpointParamMeta,
    next: NextFunction,
  ): unknown | Promise<unknown>
  preEndpoint?(
    req: Request,
    res: Response,
    casters: DefaultCasters,
    meta: EndpointParamMeta,
  ): unknown | Promise<unknown>
  postEndpoint?(
    req: Request,
    res: Response,
    casters: DefaultCasters,
    meta: EndpointParamMeta,
  ): unknown | Promise<unknown>
}

export enum REST_METHODS {
  DELETE = 'delete',
  GET = 'get',
  PATCH = 'patch',
  POST = 'post',
  PUT = 'put',
}

export type ControllerBundle = {
  name?: string
  baseRoute: string
  controllerDirPath: string
  controllerFileNamePattern?: RegExp
}

export type PreHookFn = (
  params: unknown,
  endpointVariables: unknown[],
  req: Request,
  res: Response,
  paramMeta: EndpointParamMeta[],
) => Promise<void>

export type EndpointHook = {
  params: unknown
  preHook: PreHookFn
}
