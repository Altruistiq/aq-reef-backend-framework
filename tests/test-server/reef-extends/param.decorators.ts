import {createParamDecorator} from "../reef/decorators";
import {Request, Response} from "express";
import {DefaultCasters} from "../reef/helpers";
import {EndpointParamMeta} from "../reef/helpers";
import {kebabCase} from "lodash";

export function Header(headerName?: string) {
  return createParamDecorator({
    getValue(req: Request, res: Response, casters: DefaultCasters, meta: EndpointParamMeta): unknown | Promise<unknown> {
      return req.header(headerName || kebabCase(meta.name))
    }
  })
}
