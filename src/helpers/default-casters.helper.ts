import { AnyError, EndpointParamMeta } from './aq-base.types'
import { ResError } from '../errors'

export class DefaultCasters {
  protected ErrorClass: AnyError<Error> = Error

  public cast(meta: EndpointParamMeta, rawValue: unknown): unknown {
    // @ts-ignore
    if (!meta.cast || !this[meta.type?.name]) return rawValue
    if (rawValue instanceof (meta.type as typeof Object)) return rawValue
    if (rawValue === undefined) return undefined
    try {
      // @ts-ignore
      return this[meta.type.name](rawValue)
    } catch (err) {
      // @ts-ignore
      throw new ResError(`invalid_param_type`, { param: meta.name, type: meta.type.name })
    }
  }

  public Number(input: any) {
    const transformed = Number(input)
    if (Number.isNaN(transformed)) {
      throw new this.ErrorClass('cannot_cast')
    }
    return transformed
  }

  public Boolean(input: any) {
    if (typeof input === 'boolean') return input
    if (typeof input !== 'string' && typeof input !== 'number') {
      throw new this.ErrorClass('cannot_cast')
    }
    if (['1', 'true', 't'].indexOf(String(input).toLowerCase()) > -1) {
      return true
    }
    if (['0', 'false', 'f'].indexOf(String(input).toLowerCase()) > -1) {
      return false
    }
    throw new this.ErrorClass('cannot_cast')
  }
}
