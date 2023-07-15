import {Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, Res} from "../reef/decorators";
import {BaseController} from "../reef/helpers/base-controller.class";
import {Request, Response} from "express"
import {FooService} from "../test-helpers/foo.service";


@Controller('foo')
export default class TestController extends BaseController {

  @Get('/')
  simpleGet(@Query() val: string) {
    return {val}
  }

  @Post('/')
  simplePost(@Body() val: string) {
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

  @Get('decorator-res-test', null, false)
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
}
