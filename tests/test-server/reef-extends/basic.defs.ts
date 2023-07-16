import {limitSymbol, roleSymbol} from "./reef.symbols";

export enum USER_ROLE {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SOLUTION_ADVISOR = 'SOLUTION_ADVISOR',
}

export type MiddlewareOptions = {
  [roleSymbol]: USER_ROLE[],
  [limitSymbol]: { maxCalls: number, perSeconds: number }[]
}
