import { RequestHandler } from 'express';
import 'reflect-metadata';

import { BaseController } from '../helpers';

import {
	AfterResponseHookFn,
	EndpointDecorator,
	EndpointInfo,
	PreHookFn,
	REST_METHODS,
} from '../helpers/aq-base.types';

import {
	afterResponseExecutionHookSymbol,
	directMiddlewareSymbol,
	endpointMetaSymbol,
	preExecutionHookSymbol,
} from './symbols';

/**
 * Decorator for the target endpoint function
 * This decorator use automatic method assigning based on the given path
 * @param {string} path - the endpoint sub-path
 * @param {boolean} autoResponse - if false the endpoint won't convert the return of the function to the request response
 */
export function Endpoint(path: string, autoResponse = true) {
	return defineEndpoint(path, autoResponse);
}

/**
 * Decorator for the GET endpoint functions
 * @param {string} path - the endpoint sub-path
 * @param {boolean} autoResponse - if false the endpoint won't convert the return of the function to the request response
 */
export function Get(path: string, autoResponse = true): EndpointDecorator {
	return defineEndpoint(path, autoResponse, REST_METHODS.GET);
}

/**
 * Decorator for the POST endpoint functions
 * @param {string} path - the endpoint sub-path
 * @param {boolean} autoResponse - if false the endpoint won't convert the return of the function to the request response
 */
export function Post(path: string, autoResponse = true): EndpointDecorator {
	return defineEndpoint(path, autoResponse, REST_METHODS.POST);
}

/**
 * Decorator for the PUT endpoint functions
 * @param {string} path - the endpoint sub-path
 * @param {boolean} autoResponse - if false the endpoint won't convert the return of the function to the request response
 */
export function Put(path: string, autoResponse = true): EndpointDecorator {
	return defineEndpoint(path, autoResponse, REST_METHODS.PUT);
}

/**
 * Decorator for the PATCH endpoint functions
 * @param {string} path - the endpoint sub-path
 * @param {boolean} autoResponse - if false the endpoint won't convert the return of the function to the request response
 */
export function Patch(path: string, autoResponse = true): EndpointDecorator {
	return defineEndpoint(path, autoResponse, REST_METHODS.PATCH);
}

/**
 * Decorator for the DELETE endpoint functions
 * @param {string} path - the endpoint sub-path
 * @param {boolean} autoResponse - if false the endpoint won't convert the return of the function to the request response
 */
export function Delete(path: string, autoResponse = true): EndpointDecorator {
	return defineEndpoint(path, autoResponse, REST_METHODS.DELETE);
}

export function Middleware(...args: RequestHandler[]) {
	return createEndpointMiddleware(directMiddlewareSymbol, args);
}

/**
 * Function that stores the endpoint information in an array format
 * on the controller's class metadata on the "reef:decorators:endpoint" symbol
 * @param {string} path - the endpoint sub-path
 * @param {boolean} autoResponse - if false the endpoint won't convert the return of the function to the request response
 * @param {REST_METHODS | null} method
 */
function defineEndpoint(
	path: string,
	autoResponse = true,
	method: REST_METHODS | null = null,
): EndpointDecorator {
	return function (
		target: any,
		methodName: string,
		descriptor: PropertyDescriptor,
	) {
		const endpointInfo = Reflect.getMetadata(endpointMetaSymbol, target) || [];

		const payload: EndpointInfo = {
			path,
			methodName,
			descriptor,
			autoResponse,
			method,
			target,
		};

		endpointInfo.push(payload);
		Reflect.defineMetadata(endpointMetaSymbol, endpointInfo, target);
	};
}

export function createEndpointMiddleware(subject: symbol, params: unknown) {
	return function (target: BaseController, methodName: string) {
		const controllerMiddlewareInfo = Reflect.getMetadata(subject, target) || {};
		if (!controllerMiddlewareInfo[methodName])
			controllerMiddlewareInfo[methodName] = [];
		controllerMiddlewareInfo[methodName].push(params);
		Reflect.defineMetadata(subject, controllerMiddlewareInfo, target);
	};
}

export function createAfterResponseExecutionHook(params: unknown, hook: AfterResponseHookFn) {
	return function (target: BaseController, methodName: string) {
		const endpointHookInfo =
			Reflect.getMetadata(afterResponseExecutionHookSymbol, target, methodName) || [];
		endpointHookInfo.push({ params, hook });
		Reflect.defineMetadata(
			afterResponseExecutionHookSymbol,
			endpointHookInfo,
			target,
			methodName,
		);
	};

}

/**
 * Function that helps to create a decorator that adds a pre-execution hook for an endpoint
 * @param params
 * @param preHook
 */
export function createEndpointPreExecutionHook(
	params: unknown,
	preHook: PreHookFn,
) {
	return function (target: BaseController, methodName: string) {
		const endpointHookInfo =
			Reflect.getMetadata(preExecutionHookSymbol, target, methodName) || [];
		endpointHookInfo.push({ params, preHook });
		Reflect.defineMetadata(
			preExecutionHookSymbol,
			endpointHookInfo,
			target,
			methodName,
		);
	};
}
