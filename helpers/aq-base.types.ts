import { RequestHandler, Request, Response } from 'express'

import { DefaultCasters } from './default-casters.helper'

import { BaseController } from './base-controller.class'

export type CasterClass<T extends DefaultCasters> = new (...args: any[]) => T & typeof DefaultCasters

export type AnyError<T extends Error> = new (...args: any[]) => T
export interface IMiddlewareGenerator {
  getMiddleware(controllerOptions: IEndpointOptions, endpointOptions: IEndpointOptions): RequestHandler[]
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
  options: IEndpointOptions
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
  options: IEndpointOptions
}

export type EndpointDecorator<C extends BaseController> = (
  target: C,
  methodName: string,
  descriptor: PropertyDescriptor
) => void

export type ParamDecorator = (
  target: any,
  methodName: string | symbol,
  parameterIndex: number
) => void

export interface IEndpointOptions {
  features?: string[]
  limits?: unknown
}

export interface GenericLogger {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  log: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

export interface IParamDecoratorActions {
  getValue(req: Request, res: Response, casters: DefaultCasters, meta: EndpointParamMeta): unknown | Promise<unknown>
  preEndpoint?(
    req: Request,
    res: Response,
    casters: DefaultCasters,
    meta: EndpointParamMeta
  ): unknown | Promise<unknown>
  postEndpoint?(
    req: Request,
    res: Response,
    casters: DefaultCasters,
    meta: EndpointParamMeta
  ): unknown | Promise<unknown>
}

export enum REST_METHODS {
  DELETE = 'delete',
  GET = 'get',
  PATCH = 'patch',
  POST = 'post',
  PUT = 'put',
}
