import { AnyError, EndpointParamMeta } from './aq-base.types';
export declare class DefaultCasters {
    protected ErrorClass: AnyError<Error>;
    cast(meta: EndpointParamMeta, rawValue: unknown): unknown;
    Number(input: unknown): number;
    Boolean(input: unknown): boolean;
}
