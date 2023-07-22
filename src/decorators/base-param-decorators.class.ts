import { Request, Response } from 'express'

import { get } from 'lodash'

import { EndpointParamMeta, IParamDecoratorActions, ParamDecorator } from '../helpers/aq-base.types'

import { DefaultCasters } from '../helpers'

import { paramMetaSymbol } from './symbols'

export function UnifiedParam(path?: string, autoCast = true) {
  return defineIncomingVariable(path, autoCast, {
    getValue: (
      req: Request,
      res: Response,
      casters: DefaultCasters,
      meta: EndpointParamMeta
    ): unknown | Promise<unknown> => {
      const data = { ...req.body, ...req.query, ...req.params }
      const rawValue: unknown = get(data, meta.path || meta.name)
      return casters.cast(meta, rawValue)
    },
  })
}
export function Param(path?: string, autoCast = true) {
  return defineIncomingVariable(path, autoCast, {
    getValue: (
      req: Request,
      res: Response,
      casters: DefaultCasters,
      meta: EndpointParamMeta
    ): unknown | Promise<unknown> => {
      const rawValue: unknown = get(req.params, meta.path || meta.name)
      return casters.cast(meta, rawValue)
    },
  })
}

export function Body(path?: string, autoCast = true) {
  return defineIncomingVariable(path, autoCast, {
    getValue: (
      req: Request,
      res: Response,
      casters: DefaultCasters,
      meta: EndpointParamMeta
    ): unknown | Promise<unknown> => {
      const rawValue: unknown = get(req.body, meta.path || meta.name)
      return casters.cast(meta, rawValue)
    },
  })
}

export function Query(path?: string, autoCast = true) {
  return defineIncomingVariable(path, autoCast, {
    getValue: (
      req: Request,
      res: Response,
      casters: DefaultCasters,
      meta: EndpointParamMeta
    ): unknown | Promise<unknown> => {
      const rawValue: unknown = get(req.query, meta.path || meta.name)
      return casters.cast(meta, rawValue)
    },
  })
}

export function Res() {
  return defineIncomingVariable('', false, {
    getValue: (req: Request, res: Response): unknown | Promise<unknown> => res,
  })
}

export function Req(path?: string, autoCast = true) {
  return defineIncomingVariable(path, autoCast, {
    getValue: (req: Request): unknown | Promise<unknown> => req,
  })
}

export function defineIncomingVariable(
  reqPath: string | null,
  autoCast: boolean,
  actions: IParamDecoratorActions,
): ParamDecorator {
  return function (target: any, methodName: string, parameterIndex: number) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const propertyTypes: unknown[] = Reflect.getMetadata('design:paramtypes', target, methodName)
    if (!propertyTypes[parameterIndex]) return

    const propertyType = propertyTypes[parameterIndex] as typeof Object
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const variableName = getVariableName(methodName, target[methodName], parameterIndex)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const paramMeta: EndpointParamMeta[] =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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

/**
 * Given the index of a method parameter and the method itself returns the name of the parameter
 * @param {string} methodName - the method name
 * @param {function} method - the actual method of the controller
 * @param {number} index - the index of the parameter in the method parameters
 */
export function getVariableName(methodName: string, method: (...args) => unknown, index: number): string {
  const methodStr = method.toString()
  const methodSanitized = methodStr.replace(/\n/g, '').replace(/\s+/g, ' ')
  const varsRegExp = new RegExp(`${methodName}\\((?<names>(([a-zA-Z0-9_]+)+,?\\s*)+)\\)\\s*\\{.+\\}$`, 'g')
  const regResult = varsRegExp.exec(methodSanitized)
  if (!regResult) {
    throw new Error(`cannot find variables for ${methodName}`)
  }
  const varNames = regResult.groups.names
  const variables = varNames.split(',').map((v: string) => v.trim())
  if (!variables[index]) {
    throw new Error(`cannot find variable on index ${index} for ${methodName}`)
  }

  return variables[index]
}
