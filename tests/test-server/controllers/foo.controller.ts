import {BaseController} from "../reef/helpers/base-controller.class";
import {Controller, Get} from "../reef/decorators";
import {AuthRoles, CAuthRoles} from "../reef-extends/middleware.decorators";
import {USER_ROLE} from "../reef-extends/basic.defs";


@CAuthRoles(USER_ROLE.USER, USER_ROLE.ADMIN)
@Controller('foo')
export default class FooController extends BaseController {

  @Get('controller-level-middleware')
  controllerLevelMiddleware() {
    return { success: true }
  }

  @AuthRoles(USER_ROLE.USER)
  @Get('endpoint-middleware-override')
  endpointOverrideLevelMiddleware() {
    return { success: true }
  }

}
