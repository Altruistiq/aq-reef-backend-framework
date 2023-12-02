"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createControllerMiddleware = exports.Controller = void 0;
require("reflect-metadata");
const symbols_1 = require("./symbols");
function Controller(basePath) {
    return function (targetClass, _unused) {
        let controllerMeta = Reflect.getMetadata(symbols_1.controllerMetaSymbol, targetClass) || {};
        controllerMeta = {
            ...controllerMeta,
            basePath,
        };
        Reflect.defineMetadata(symbols_1.controllerMetaSymbol, controllerMeta, targetClass);
    };
}
exports.Controller = Controller;
function createControllerMiddleware(subject, params) {
    return function (constr) {
        const controllerMiddlewareInfo = Reflect.getMetadata(subject, constr) || {};
        if (!controllerMiddlewareInfo[symbols_1.middlewareControllerKey])
            controllerMiddlewareInfo[symbols_1.middlewareControllerKey] = [];
        controllerMiddlewareInfo[symbols_1.middlewareControllerKey].push(params);
        Reflect.defineMetadata(subject, controllerMiddlewareInfo, constr);
    };
}
exports.createControllerMiddleware = createControllerMiddleware;
//# sourceMappingURL=controller.decorator.js.map