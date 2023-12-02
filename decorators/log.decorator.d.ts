import 'reflect-metadata';
import { LogParamDecorator } from '../helpers/aq-base.types';
export declare function setLoggerFn(getLoggerFn: any): void;
export declare function Log(logAround?: boolean): (target: any, methodName: string, descriptor: PropertyDescriptor) => void;
export declare function Logger(): LogParamDecorator;
