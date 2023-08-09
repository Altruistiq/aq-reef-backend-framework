import {Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, Res} from "../reef/decorators";
import {Request, Response} from "express"
import {FooService} from "../test-helpers/foo.service";
import {AuthRoles} from "../reef-extends/middleware.decorators";
import {USER_ROLE} from "../reef-extends/basic.defs";
import {BaseController} from "../reef/helpers";
import {Header} from "../reef-extends/param.decorators";


@Controller('bar')
export default class BarController extends BaseController {

  @Get('/')
  // ?var_name=123
  simpleGet(@Query('var_name') val: number) {
    return {val}
  }

  @Post('/')
  simplePost(@Body('obj.test') val: string) {
    return {val}
  }

  @Put('/')
  simplePut(@Body() val: string) {
    return {val}
  }
  @Delete('/')
  simpleDelete(@Body() val: string) {
    return { delete: 'delete' }
  }

  @Patch('/')
  simplePatch(@Body() val) {
    return { val }
  }
  @Get('/:urlParam/test')
  simpleURLParam(@Param() urlParam: string) {
    return { urlParam }
  }

  @Get('decorator-res-test', false)
  resParamTest(@Res() res: Response) {
    res.json({ success: true })

    return { success: false }
  }

  @Get('caster-test')
  castersTest(
    @Query() myDate: Date,
    @Query() age: number,
    @Query() isBool: boolean
  ) {
    return { myDate, age, isBool }
  }

  @Get('read-req-header')
  headerTest(@Req() req: Request, @Query() headerName: string) {
    FooService.foo()

    return { [headerName]: req.header(headerName) }
  }


  @AuthRoles(USER_ROLE.ADMIN, USER_ROLE.USER)
  @Get('custom-decorator-role')
  customDecoratorRole() {
    return { success: true }
  }

  @Get('custom-param-decorator-test')
  customParamDecoratorTest(@Header() xTestHeader: string) {
    return { header: xTestHeader }
  }
}
