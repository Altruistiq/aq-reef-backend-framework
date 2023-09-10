import {castDecoratorSymbol} from "./symbols";

export function __BUN_REEF_TYPE__(type: unknown) {
  return function (target: any, methodName: string, parameterIndex: number) {
    const propertyTypes: unknown[] = Reflect.getMetadata(castDecoratorSymbol, target, methodName) || []
    propertyTypes[parameterIndex] = type
    Reflect.defineMetadata(castDecoratorSymbol, propertyTypes, target, methodName)
  }
}
