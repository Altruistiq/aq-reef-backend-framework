import { AnyError, EndpointParamMeta } from './aq-base.types'

export class DefaultCasters {
  private ErrorClass: AnyError<Error> = Error

  public cast(meta: EndpointParamMeta, rawValue: unknown): unknown {
    if (!meta.cast || !this[meta.type.name]) return rawValue
    if (rawValue instanceof meta.type) return rawValue
    try {
      return this[meta.type.name](rawValue)
    } catch (err) {
      throw new this.ErrorClass(`cannot convert param '${meta.path || meta.name}' to type '${meta.type.name}'`)
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
    if (typeof input !== 'string' && typeof input !== 'number') {
      throw new Error('cannot_cast')
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
