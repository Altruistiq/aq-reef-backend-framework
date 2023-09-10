import {Request, Response} from "express";
import {kebabCase} from "lodash";
import {createParamDecorator} from "../reef/decorators/base-param-decorators.class";
import { DefaultCasters } from "../reef/helpers/default-casters.helper";
import { EndpointParamMeta } from "../reef/helpers/aq-base.types";

export function Header(headerName?: string) {
  return createParamDecorator({
    getValue(req: Request, res: Response, casters: DefaultCasters, meta: EndpointParamMeta): unknown | Promise<unknown> {
      return req.header(headerName || kebabCase(meta.name))
    }
  })
}
