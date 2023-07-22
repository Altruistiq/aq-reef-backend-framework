import {DefaultCasters} from "../reef/helpers/default-casters.helper";

export class TestCasters extends DefaultCasters {
  Date(input: unknown) {
    const timestamp = Date.parse(input as string)
    if (isNaN(timestamp)) throw new this.ErrorClass('date_not_valid')
    return new Date(timestamp)
  }
}
