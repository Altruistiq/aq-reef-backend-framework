import { Controller, Get } from '../reef/decorators';
import { BaseController } from '../reef/helpers/base-controller.class';

@Controller('not-reachable')
export default class FooController extends BaseController {
	@Get('/')
	notReachable() {
		return { success: false };
	}
}
