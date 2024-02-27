import {GenericLogger, Log, Logger} from "../../../pkg";

export class TestService {
  @Log()
  static hello(@Logger() logger?: GenericLogger) {
    logger.info('test')
  }
}
