"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEndpointPreExecutionHook = exports.createEndpointMiddleware = exports.Middleware = exports.Delete = exports.Patch = exports.Put = exports.Post = exports.Get = exports.Endpoint = void 0;
require("reflect-metadata");
const aq_base_types_1 = require("../helpers/aq-base.types");
const symbols_1 = require("./symbols");
function Endpoint(path, autoResponse = true) {
    return defineEndpoint(path, autoResponse);
}
exports.Endpoint = Endpoint;
function Get(path, autoResponse = true) {
    return defineEndpoint(path, autoResponse, aq_base_types_1.REST_METHODS.GET);
}
exports.Get = Get;
function Post(path, autoResponse = true) {
    return defineEndpoint(path, autoResponse, aq_base_types_1.REST_METHODS.POST);
}
exports.Post = Post;
function Put(path, autoResponse = true) {
    return defineEndpoint(path, autoResponse, aq_base_types_1.REST_METHODS.PUT);
}
exports.Put = Put;
function Patch(path, autoResponse = true) {
    return defineEndpoint(path, autoResponse, aq_base_types_1.REST_METHODS.PATCH);
}
exports.Patch = Patch;
function Delete(path, autoResponse = true) {
    return defineEndpoint(path, autoResponse, aq_base_types_1.REST_METHODS.DELETE);
}
exports.Delete = Delete;
function Middleware(...args) {
    return createEndpointMiddleware(symbols_1.directMiddlewareSymbol, args);
}
exports.Middleware = Middleware;
function defineEndpoint(path, autoResponse = true, method = null) {
    return function (target, methodName, descriptor) {
        const endpointInfo = Reflect.getMetadata(symbols_1.endpointMetaSymbol, target) || [];
        const payload = {
            path,
            methodName,
            descriptor,
            autoResponse,
            method,
            target,
        };
        endpointInfo.push(payload);
        Reflect.defineMetadata(symbols_1.endpointMetaSymbol, endpointInfo, target);
    };
}
function createEndpointMiddleware(subject, params) {
    return function (target, methodName) {
        const controllerMiddlewareInfo = Reflect.getMetadata(subject, target) || {};
        if (!controllerMiddlewareInfo[methodName])
            controllerMiddlewareInfo[methodName] = [];
        controllerMiddlewareInfo[methodName].push(params);
        Reflect.defineMetadata(subject, controllerMiddlewareInfo, target);
    };
}
exports.createEndpointMiddleware = createEndpointMiddleware;
function createEndpointPreExecutionHook(params, preHook) {
    return function (target, methodName) {
        const endpointHookInfo = Reflect.getMetadata(symbols_1.preExecutionHookSymbol, target, methodName) || [];
        endpointHookInfo.push({ params, preHook });
        Reflect.defineMetadata(symbols_1.preExecutionHookSymbol, endpointHookInfo, target, methodName);
    };
}
exports.createEndpointPreExecutionHook = createEndpointPreExecutionHook;
//# sourceMappingURL=endpoint.decorator.js.map