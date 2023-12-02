import { Controller, Get } from '../../reef/decorators';
import { BaseController } from '../../reef/helpers';

@Controller('recursive')
export default class FooController extends BaseController {
	@Get('/')
	simpleGet() {
		return { success: true };
	}
}
