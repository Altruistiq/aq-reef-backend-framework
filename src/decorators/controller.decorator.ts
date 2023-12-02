import 'reflect-metadata';

import { controllerMetaSymbol, middlewareControllerKey } from './symbols';

/**
 * Controller decorator function.
 * Stores the controller information on the class metadata on the "reef:decorators:controller" symbol
 * @param {string} basePath
 */
export function Controller(basePath: string) {
	return function (targetClass: any, _unused?: any) {
		let controllerMeta =
			Reflect.getMetadata(controllerMetaSymbol, targetClass) || {};

		controllerMeta = {
			...controllerMeta,
			basePath,
		};

		Reflect.defineMetadata(controllerMetaSymbol, controllerMeta, targetClass);
	};
}

export function createControllerMiddleware(subject: symbol, params: unknown) {
	return function (constr: any) {
		const controllerMiddlewareInfo = Reflect.getMetadata(subject, constr) || {};
		if (!controllerMiddlewareInfo[middlewareControllerKey])
			controllerMiddlewareInfo[middlewareControllerKey] = [];
		controllerMiddlewareInfo[middlewareControllerKey].push(params);
		Reflect.defineMetadata(subject, controllerMiddlewareInfo, constr);
	};
}
