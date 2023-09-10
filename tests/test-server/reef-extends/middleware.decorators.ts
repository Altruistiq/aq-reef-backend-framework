import { createControllerMiddleware } from "../reef/decorators/controller.decorator";
import { createEndpointMiddleware } from "../reef/decorators/endpoint.decorator";
import { USER_ROLE } from "./basic.defs";
import {roleSymbol} from "./reef.symbols";

export function CAuthRoles(...roles: USER_ROLE[]) {
  return createControllerMiddleware(roleSymbol, roles)
}

export function AuthRoles(...roles: USER_ROLE[]) {
  return createEndpointMiddleware(roleSymbol, roles)
}
