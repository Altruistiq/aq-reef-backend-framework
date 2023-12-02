"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reef = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
require("reflect-metadata");
const log_decorator_1 = require("../decorators/log.decorator");
const default_casters_helper_1 = require("./default-casters.helper");
class Reef {
    constructor(app) {
        this.mainRoute = '';
        this.preRunList = [];
        this.postRunList = [];
        this.controllerBundles = [];
        this.globalMiddleware = [];
        this.hideLogsForErrors = [];
        this.app = app;
    }
    preRun(funcList) {
        this.preRunList.push(funcList);
        return this;
    }
    postRun(funcList) {
        this.postRunList.push(funcList);
        return this;
    }
    setMiddlewareGenerator(MiddlewareGenerator) {
        this.middlewareGenerator = new MiddlewareGenerator();
        return this;
    }
    defineParamCaster(casters) {
        this.CastersClass = casters;
        return this;
    }
    setControllerBundle(bundle) {
        this.controllerBundles.push(bundle);
        return this;
    }
    setTraceIdFn(getTraceIdFunction) {
        this.getTraceIdFunction = getTraceIdFunction;
        return this;
    }
    async launch() {
        Error.stackTraceLimit = Infinity;
        (0, log_decorator_1.setLoggerFn)(this.getLoggerFn);
        this.globalMiddleware.forEach((m) => this.app.use(m));
        const promises = this.preRunList.map((f) => f(this.app));
        return Promise.all(promises)
            .then(() => this.controllerBundles.reduce((accPromise, controllerBundle) => {
            return accPromise.then(() => this.loadControllers(controllerBundle));
        }, Promise.resolve()))
            .then(() => {
            return Promise.all(this.postRunList.map((f) => f(this.app)));
        })
            .then(() => {
            if (this.errorHandlerFn)
                this.app.use(this.errorHandlerFn);
        });
    }
    setGlobalMiddleware(...middleware) {
        this.globalMiddleware.push(...middleware);
        return this;
    }
    addErrorHandler(errorHandler) {
        this.errorHandlerFn = errorHandler;
        return this;
    }
    setLoggerFn(loggerFn) {
        this.getLoggerFn = loggerFn;
        return this;
    }
    loadControllers(controllerBundle) {
        const { controllerDirPath, controllerFileNamePattern, baseRoute, name: bundleName, } = controllerBundle;
        const allowedExtRegexp = /^.+?(\.ts$)|(\.js$)/g;
        const absolutePathFiles = this.getFilesRecursively(controllerDirPath);
        const controllerLoadFns = [];
        for (const file of absolutePathFiles) {
            if (controllerFileNamePattern?.lastIndex)
                controllerFileNamePattern.lastIndex = 0;
            allowedExtRegexp.lastIndex = 0;
            const allowExt = allowedExtRegexp.test(file);
            if (!allowExt)
                continue;
            if (controllerFileNamePattern && !controllerFileNamePattern.test(file))
                continue;
            controllerLoadFns.push(() => Promise.resolve(`${file}`).then(s => __importStar(require(s))).then((importPayload) => {
                const Controller = importPayload.default;
                new Controller(this.app, baseRoute, this.CastersClass
                    ? new this.CastersClass()
                    : new default_casters_helper_1.DefaultCasters(), this.getTraceIdFunction, this.getLoggerFn, this.middlewareGenerator, bundleName);
            })
                .catch((err) => {
                console.error('cannot load controller file: ', file, err);
                throw err;
            }));
        }
        return controllerLoadFns.reduce((accPromise, currPromise) => accPromise.then(currPromise), Promise.resolve());
    }
    getFilesRecursively(directory, files = []) {
        const filesInDirectory = (0, fs_1.readdirSync)(directory, { encoding: 'utf8' });
        for (const file of filesInDirectory) {
            const absolute = (0, path_1.join)(directory, file);
            if ((0, fs_1.statSync)(absolute).isDirectory()) {
                this.getFilesRecursively(absolute, files);
            }
            else {
                files.push(absolute);
            }
        }
        return files;
    }
}
exports.Reef = Reef;
//# sourceMappingURL=reef.js.map