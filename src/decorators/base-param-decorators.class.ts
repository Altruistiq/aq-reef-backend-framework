import { NextFunction, Request, Response } from 'express'

import { get } from 'lodash'

import { EndpointParamMeta, IParamDecoratorActions, ParamDecorator } from '../helpers/aq-base.types'

import {castDecoratorSymbol, paramMetaSymbol} from './symbols'
import {DefaultCasters} from "../helpers/default-casters.helper";
import {BaseController} from "../helpers/base-controller.class";

export function UnifiedParam(path?: string, autoCast = true) {
  return createParamDecoratorInternal(path, autoCast, {
    getValue: (
      req: Request,
      res: Response,
      casters: DefaultCasters,
      meta: EndpointParamMeta,
    ): unknown | Promise<unknown> => {
      const data = { ...req.body, ...req.query, ...req.params }
      const rawValue: unknown = get(data, meta.path || meta.name)
      return casters.cast(meta, rawValue)
    },
  })
}
export function Param(path?: string, autoCast = true) {
  return createParamDecoratorInternal(path, autoCast, {
    getValue: (
      req: Request,
      res: Response,
      casters: DefaultCasters,
      meta: EndpointParamMeta,
    ): unknown | Promise<unknown> => {
      const rawValue: unknown = get(req.params, meta.path || meta.name)
      return casters.cast(meta, rawValue)
    },
  })
}

export function Body(path?: string, autoCast = true) {
  return createParamDecoratorInternal(path, autoCast, {
    getValue: (
      req: Request,
      res: Response,
      casters: DefaultCasters,
      meta: EndpointParamMeta,
    ): unknown | Promise<unknown> => {
      const rawValue: unknown = get(req.body, meta.path || meta.name)
      return casters.cast(meta, rawValue)
    },
  })
}

export function Query(path?: string, autoCast = true) {
  return createParamDecoratorInternal(path, autoCast, {
    getValue: (
      req: Request,
      res: Response,
      casters: DefaultCasters,
      meta: EndpointParamMeta,
    ): unknown | Promise<unknown> => {
      const rawValue: unknown = get(req.query, meta.path || meta.name)
      return casters.cast(meta, rawValue)
    },
  })
}
export function Res() {
  return createParamDecoratorInternal('', false, {
    getValue: (req: Request, res: Response): unknown | Promise<unknown> => res,
  })
}

export function Req() {
  return createParamDecoratorInternal('', false, {
    getValue: (req: Request): unknown | Promise<unknown> => req,
  })
}

export function Next() {
  return createParamDecoratorInternal('', false, {
    getValue: (
      req: Request,
      res: Response,
      casters: DefaultCasters,
      meta: EndpointParamMeta,
      next: NextFunction,
    ): unknown | Promise<unknown> => next,
  })
}

function createParamDecoratorInternal(
  reqPath: string | null,
  autoCast: boolean,
  actions: IParamDecoratorActions,
): ParamDecorator {
  return function (target: any, methodName: string, parameterIndex: number) {
    const propertyType = getParamMetaByIndex(target, methodName, parameterIndex)
    const variableName = getVariableName(methodName, target[methodName], parameterIndex)

    const paramMeta: EndpointParamMeta[] =
      Reflect.getMetadata(paramMetaSymbol, target, methodName) || new Array(target[methodName].length)
    paramMeta[parameterIndex] = {
      ...paramMeta[parameterIndex],
      actions,
      type: propertyType,
      index: parameterIndex,
      name: variableName,
      path: reqPath,
      cast: autoCast,
    }
    Reflect.defineMetadata(paramMetaSymbol, paramMeta, target, methodName)
  }
}

function getParamMetaByIndex(target: typeof BaseController, methodName: string, parameterIndex: number): unknown | undefined {
  const propertyTypes: unknown[] =
    // If we are on tsc/node we get the parameter type from the design:paramtypes
    Reflect.getMetadata('design:paramtypes', target, methodName)
    // In any other case we get the type from custom metadata set by the @Cast decorator -- e.g. bun.sh does not implement design:paramtypes metadata
  || Reflect.getMetadata(castDecoratorSymbol, target, methodName)

  return propertyTypes && propertyTypes[parameterIndex]


}

export function createParamDecorator(actions: IParamDecoratorActions) {
  return createParamDecoratorInternal(null, false, actions)
}

/**
 * Given the index of a method parameter and the method itself returns the name of the parameter
 * @param {string} methodName - the method name
 * @param {function} method - the actual method of the controller
 * @param {number} index - the index of the parameter in the method parameters
 */
export function getVariableName(methodName: string, method: (...args) => unknown, index: number): string {
  const methodStr = method.toString()
  const methodSanitized = methodStr.replace(/\n/g, '').replace(/\s+/g, ' ')

  let funcDefParams = ''
  let funcDefParamsStart = false
  let foundFuncDefEnd = false
  let charIndex = 0
  let openParenthesisCount = 0

  while (!(foundFuncDefEnd && funcDefParamsStart)) {
    const c = methodSanitized.charAt(charIndex++)
    if (c === '(') {
      openParenthesisCount++
      funcDefParamsStart = true
    } else if (c === ')') {
      openParenthesisCount--
    }
    if (openParenthesisCount === 0 && funcDefParamsStart) foundFuncDefEnd = true
    if (funcDefParamsStart) funcDefParams += c
  }

  funcDefParams = funcDefParams.substring(1, funcDefParams.length - 1)
  const paramsArr = funcDefParams.split(',')

  const paramToRetun = paramsArr[index]
  if (!paramToRetun) throw new Error(`cannot find variable on index ${index} for ${methodName}`)

  if (paramToRetun.includes('=')) {
    return paramToRetun.split('=')[0].trim()
  }
  return paramToRetun.trim()
}
