"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVariableName = exports.createParamDecorator = exports.Next = exports.Req = exports.Res = exports.Query = exports.Body = exports.Param = exports.UnifiedParam = void 0;
const lodash_1 = require("lodash");
const symbols_1 = require("./symbols");
function UnifiedParam(path, autoCast = true) {
    return createParamDecoratorInternal(path, autoCast, {
        getValue: (req, res, casters, meta) => {
            const data = { ...req.body, ...req.query, ...req.params };
            const rawValue = (0, lodash_1.get)(data, meta.path || meta.name);
            return casters.cast(meta, rawValue);
        },
    });
}
exports.UnifiedParam = UnifiedParam;
function Param(path, autoCast = true) {
    return createParamDecoratorInternal(path, autoCast, {
        getValue: (req, res, casters, meta) => {
            const rawValue = (0, lodash_1.get)(req.params, meta.path || meta.name);
            return casters.cast(meta, rawValue);
        },
    });
}
exports.Param = Param;
function Body(path, autoCast = true) {
    return createParamDecoratorInternal(path, autoCast, {
        getValue: (req, res, casters, meta) => {
            const rawValue = (0, lodash_1.get)(req.body, meta.path || meta.name);
            return casters.cast(meta, rawValue);
        },
    });
}
exports.Body = Body;
function Query(path, autoCast = true) {
    return createParamDecoratorInternal(path, autoCast, {
        getValue: (req, res, casters, meta) => {
            const rawValue = (0, lodash_1.get)(req.query, meta.path || meta.name);
            return casters.cast(meta, rawValue);
        },
    });
}
exports.Query = Query;
function Res() {
    return createParamDecoratorInternal('', false, {
        getValue: (req, res) => res,
    });
}
exports.Res = Res;
function Req() {
    return createParamDecoratorInternal('', false, {
        getValue: (req) => req,
    });
}
exports.Req = Req;
function Next() {
    return createParamDecoratorInternal('', false, {
        getValue: (req, res, casters, meta, next) => next,
    });
}
exports.Next = Next;
function createParamDecoratorInternal(reqPath, autoCast, actions) {
    return function (target, methodName, parameterIndex) {
        const propertyTypes = Reflect.getMetadata('design:paramtypes', target, methodName);
        if (!propertyTypes[parameterIndex])
            return;
        const propertyType = propertyTypes[parameterIndex];
        const variableName = getVariableName(methodName, target[methodName], parameterIndex);
        const paramMeta = Reflect.getMetadata(symbols_1.paramMetaSymbol, target, methodName) ||
            new Array(target[methodName].length);
        paramMeta[parameterIndex] = {
            ...paramMeta[parameterIndex],
            actions,
            type: propertyType,
            index: parameterIndex,
            name: variableName,
            path: reqPath,
            cast: autoCast,
        };
        Reflect.defineMetadata(symbols_1.paramMetaSymbol, paramMeta, target, methodName);
    };
}
function createParamDecorator(actions) {
    return createParamDecoratorInternal(null, false, actions);
}
exports.createParamDecorator = createParamDecorator;
function getVariableName(methodName, method, index) {
    const methodStr = method.toString();
    const methodSanitized = methodStr.replace(/\n/g, '').replace(/\s+/g, ' ');
    let funcDefParams = '';
    let funcDefParamsStart = false;
    let foundFuncDefEnd = false;
    let charIndex = 0;
    let openParenthesisCount = 0;
    while (!(foundFuncDefEnd && funcDefParamsStart)) {
        const c = methodSanitized.charAt(charIndex++);
        if (c === '(') {
            openParenthesisCount++;
            funcDefParamsStart = true;
        }
        else if (c === ')') {
            openParenthesisCount--;
        }
        if (openParenthesisCount === 0 && funcDefParamsStart)
            foundFuncDefEnd = true;
        if (funcDefParamsStart)
            funcDefParams += c;
    }
    funcDefParams = funcDefParams.substring(1, funcDefParams.length - 1);
    const paramsArr = funcDefParams.split(',');
    const paramToRetun = paramsArr[index];
    if (!paramToRetun)
        throw new Error(`cannot find variable on index ${index} for ${methodName}`);
    if (paramToRetun.includes('=')) {
        return paramToRetun.split('=')[0].trim();
    }
    return paramToRetun.trim();
}
exports.getVariableName = getVariableName;
//# sourceMappingURL=base-param-decorators.class.js.map