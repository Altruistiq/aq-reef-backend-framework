import {Log, Logger} from "../reef/decorators/log.decorator";
import {GenericLogger} from "../reef/helpers/aq-base.types";

export class FooService {
  @Log(false)
  static foo(@Logger() logger?: GenericLogger) {
    logger.info('testing my logger')
  }
}
