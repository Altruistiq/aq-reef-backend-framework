import 'reflect-metadata';
export declare function Controller(basePath: string): (targetClass: any, _unused?: any) => void;
export declare function createControllerMiddleware(subject: symbol, params: unknown): (constr: any) => void;
