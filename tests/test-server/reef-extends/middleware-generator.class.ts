import {IMiddlewareGenerator} from "../reef/helpers/aq-base.types";
import {limitSymbol, roleSymbol} from "./reef.symbols";
import {MiddlewareOptions, USER_ROLE} from "./basic.defs";
import {RequestHandler, Request, Response, NextFunction} from "express";


export class MiddlewareGenerator implements IMiddlewareGenerator {
  getMiddleware(
    controllerOptions: MiddlewareOptions,
    endpointOptions: MiddlewareOptions
  ): RequestHandler[] {
    const roleOptions = this.getRoleOptions(endpointOptions, controllerOptions)
    const roleMiddlewares = this.getRoleMiddleware(roleOptions)
    return [...roleMiddlewares];
  }

  getMiddlewareSymbols(): symbol[] {
    return [ roleSymbol ];
  }

  getRoleMiddleware(roleOptions): RequestHandler[] {
    if (!roleOptions || !roleOptions.length) return []
    return [MiddlewareGenerator.roleMiddleware.bind(null, roleOptions)]
  }

  getRoleOptions(endpointOptions: MiddlewareOptions, controllerOptions: MiddlewareOptions): USER_ROLE[] {
    const endpointRoles = endpointOptions && endpointOptions[roleSymbol].flat()
    const controllerRoles = controllerOptions && controllerOptions[roleSymbol].flat()

    return endpointRoles || controllerRoles || []
  }


  static roleMiddleware(roleOptions: USER_ROLE[], req: Request, res: Response, next: NextFunction) {
    const incomingRole = req.header('x-role') as USER_ROLE | undefined
    if (!roleOptions.includes(incomingRole)) return next(new Error('forbidden'))
    next()
  }

}
