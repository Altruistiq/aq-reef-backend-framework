"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.Log = exports.setLoggerFn = void 0;
require("reflect-metadata");
const base_controller_class_1 = require("../helpers/base-controller.class");
const base_param_decorators_class_1 = require("./base-param-decorators.class");
const symbols_1 = require("./symbols");
let getLogger;
function setLoggerFn(getLoggerFn) {
    getLogger = getLoggerFn;
}
exports.setLoggerFn = setLoggerFn;
function Log(logAround = true) {
    return function (target, methodName, descriptor) {
        const oldFunc = descriptor.value;
        descriptor.value = (...args) => {
            const funcDef = `${target?.name}.${oldFunc?.name}`;
            const loggerParamIndex = Reflect.getOwnMetadata(symbols_1.loggerMetadataKeySymbol, target, methodName);
            const logger = getLogger(funcDef);
            args[loggerParamIndex] = logger;
            if (logAround)
                logger.info(`${funcDef} invoked`);
            const result = oldFunc(...args);
            return Promise.resolve(result).then((value) => {
                if (logAround)
                    logger.info(`${funcDef} finished`);
                return value;
            });
        };
    };
}
exports.Log = Log;
function Logger() {
    return function (target, methodName, parameterIndex) {
        if (Object.getPrototypeOf(target.constructor) === base_controller_class_1.BaseController) {
            const variableName = (0, base_param_decorators_class_1.getVariableName)(String(methodName), target[methodName], parameterIndex);
            const paramMeta = Reflect.getMetadata(symbols_1.paramMetaSymbol, target, methodName) ||
                new Array(target[methodName].length);
            paramMeta[parameterIndex] = {
                ...paramMeta[parameterIndex],
                type: null,
                index: parameterIndex,
                name: variableName,
                path: null,
                cast: false,
                actions: { getValue: () => getLogger('MY LOGGER') },
            };
            Reflect.defineMetadata(symbols_1.paramMetaSymbol, paramMeta, target, methodName);
        }
        else {
            Reflect.defineMetadata(symbols_1.loggerMetadataKeySymbol, parameterIndex, target, methodName);
        }
    };
}
exports.Logger = Logger;
//# sourceMappingURL=log.decorator.js.map