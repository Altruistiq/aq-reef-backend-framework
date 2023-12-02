import { Express, Request } from 'express';
import 'reflect-metadata';
import { GenericLogger, IMiddlewareGenerator } from './aq-base.types';
import { DefaultCasters } from './default-casters.helper';
export declare abstract class BaseController {
    private app;
    private mainRoutePath;
    private casters;
    private generateTraceId;
    private getLogger;
    private middlewareGenerator;
    private bundleName;
    private readonly endpointInfo;
    private controllerMeta;
    constructor(app: Express, mainRoutePath: string, casters: DefaultCasters, generateTraceId: (req: Request) => string, getLogger: (funcName: string, path?: string) => GenericLogger, middlewareGenerator: IMiddlewareGenerator | undefined, bundleName: string | undefined);
    protected afterInit(): void;
    private createEndpoints;
    private createEndpoint;
    getMiddleware(target: any, methodName: string): any[];
    private static generateCallStackId;
    private createEndpointFunc;
    private static handleResponseError;
    private static getEndpointInputVars;
    private static getParamVar;
    private getMethod;
    private printEndpointInfo;
}
