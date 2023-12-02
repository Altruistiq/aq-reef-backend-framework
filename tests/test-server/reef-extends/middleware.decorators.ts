import { USER_ROLE } from './basic.defs';
import {
	createControllerMiddleware,
	createEndpointMiddleware,
} from '../reef/decorators';
import { roleSymbol } from './reef.symbols';

export function CAuthRoles(...roles: USER_ROLE[]) {
	return createControllerMiddleware(roleSymbol, roles);
}

export function AuthRoles(...roles: USER_ROLE[]) {
	return createEndpointMiddleware(roleSymbol, roles);
}
