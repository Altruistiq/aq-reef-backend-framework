# Reef Typescript Web Framework


## Table of Contents

#### Installation
- [Bootstrap the framework](#bootstrap-the-framework)
- [Create a controller bundle](#create-a-controller-bundle)
- [Add global middleware](#add-global-middleware)
- [Set the API incoming parameters casters](#set-the-api-incoming-parameters-casters)
- [Set the error handler](#set-the-error-handler)
- [Set the logger](#set-the-logger)
- [Set the trace id function](#set-the-trace-id-function)
- [Launch the framework](#launch-the-framework)

#### Controllers
- [Create a controller](#create-a-controller)
- [Endpoint decorators](#endpoint-decorators)
- [Endpoint parameters decorators](#endpoint-parameters-decorators)
- [Defining custom endpoint variable decorators](#defining-custom-endpoint-variable-decorators)

#### Middleware
- [Fine grain control over the endpoints middleware](#fine-grain-control-over-the-endpoint-middlewarebr-and-custom-middleware-decorators)


## Bootstrap the framework

In order to bootstrap the framework, you need to create a new `Reef` class passing the express app:

```typescript
  const app: Express = express()
const reef = new Reef(app)
```

### Controller Bundle Setup

To configure a controller bundle, create a `ControllerBundle` object with properties: `name` for the bundle identifier, `controllerDirPath` for the absolute path of the controller files, `baseRoute` for the base URL path, and `controllerFileNamePattern` which is a regex for matching controller filenames, supporting both `.ts` and `.js` files.

Example in TypeScript:

```typescript
  const controllerBundle: ControllerBundle = {
    name: 'internal-api',
    controllerDirPath: join(__dirname, 'controllers-internal-api'),
    baseRoute: '/api/v1/',
    controllerFileNamePattern: /(\.controller|Controller)\.(ts|js)/g,
  }

  reef.setControllerBundle(controllerBundle);
```

### Add global middleware

You can add global middleware to the express app

```typescript
reef.addGlobalMiddleware(express.json())
reef.addGlobalMiddleware(express.urlencoded({extended: false}))
```

### Set the API incoming parameters casters

You can set the casters for the incoming parameters, the casters are used to cast the incoming request parameters to the
desired type, e.g. if you want to cast a string to a date, you can create a caster for that

e.g. setting the casters

```typescript
  class MyCasters extends DefaultCasters {
  Date(input: unknown) {
    const timestamp = Date.parse(input as string)
    if (isNaN(timestamp)) throw new this.ErrorClass('date_not_valid')
    return new Date(timestamp)
  }
}

reef.setCasters(MyCasters)
```

e.g. using the casters

```typescript
@Controller('/')
export class TestController {
  @Get('/get')
  test(@Query() date: Date) {
    return date
  }
}
```

the date query parameter will be cast to a `Date` object according to the caster class method `Date` by matching the
class name of the endpoint parameter, with the caster class method name

### Set the error handler

You can set the error handler for the express app

```typescript
  function MyErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  res.status(500).send('Something broke!')
}

reef.setErrorHandler(MyErrorHandler)
```

### Set the logger

You can set the logger for the express app. The getLogger function must return an instance of a class that implements
the `GenericLogger` interface

```typescript
class Logger implements GenericLogger {
  debug(...messages: string[]) {
    console.debug(...messages)
  }

  info(...messages: string[]) {
    console.info(...messages)
  }

  warn(...messages: string[]) {
    console.warn(...messages)
  }

  error(...messages: string[]) {
    console.error(...messages)
  }
}

function getLogger() {
  return new Logger()
}

reef.setGetLoggerFn(getLogger)
```

### Set the trace id function

You can set the trace id function for the express app. The trace id function must return a string

```typescript
function getTraceId(req: e.Request) {
  return req.header('X-Trace-Id') || uuidv4()
}

reef.setGetTraceIdFn(getTraceId)
```

### Launch the framework

You can launch the framework

```typescript
  reef.launch()
```

### Example

```typescript
import express, {Express} from 'express'
import {Reef} from 'reef-framework'
import {join} from 'path'
import {DefaultCasters} from 'reef-framework'
import {GenericLogger} from 'reef-framework'
import {Request} from 'express'
import {Response} from 'express'
import {NextFunction} from 'express'
import {v4 as uuidv4} from 'uuid'

class MyCasters extends DefaultCasters {
  Date(input: unknown) {
    const timestamp = Date.parse(input as string)
    if (isNaN(timestamp)) throw new this.ErrorClass('date_not_valid')
    return new Date(timestamp)
  }
}

class Logger implements GenericLogger {
  debug(...messages: string[]) {
    console.debug(...messages)
  }

  info(...messages: string[]) {
    console.info(...messages)
  }

  warn(...messages: string[]) {
    console.warn(...messages)
  }

  error(...messages: string[]) {
    console.error(...messages)
  }
}

function getLogger() {
  return new Logger()
}

function getTraceId(req: Request) {
  return req.header('X-Trace-Id') || uuidv4()
}

function MyErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  res.status(500).send('Something broke!')
}

const app: Express = express()
const reef = new Reef(app)

reef
  .setControllerBundle(
    '/api/v1/',
    join(__dirname, 'controllers'),
    /^.+\.controller/g,
    true
  ).setControllerBundle(
  '/api/v2/',
  join(__dirname, 'controllers-v2'),
  /^.+\.controller/g,
  true
)
  .addGlobalMiddleware(express.json())
  .addGlobalMiddleware(express.urlencoded({extended: false}))
  .setCasters(MyCasters)
  .setGetLoggerFn(getLogger)
  .setGetTraceIdFn(getTraceId)
  .setErrorHandler(MyErrorHandler)
  .launch()
```

## Controller

### Create a controller

In order to create a controller you need to create a class that extends the `BaseController` class and decorate it with
the `@Controller(basePath: string)` decorator

```typescript

@Controller('/users')
export class MyController extends BaseController {
  private users = [
    {id: 1, name: 'George'},
    {id: 2, name: 'John'},
    {id: 3, name: 'Paul'},
    {id: 4, name: 'Ringo'},
  ]

  @Get('/')
  getAllUsers() {
    return this.users
  }

  @Get('/:id')
  getUserById(@Param() id: number) {
    return this.users.find(u => u.id === id)
  }

  @Post('/')
  createUser(@Body() user: { name: string }) {
    this.users.push({id: this.users.length + 1, name: user.name})
    return this.users
  }
}
```

### Endpoint decorators

There are 5 endpoint decorators:
`@Get`, `@Delete`, `@Put`, `@Post` and `@Patch`
All 5 accept 2 arguments `path: string` and  `autoResponse: boolean` (optional) -- defaults to true
path is the uri part after the controller base path
autoResponse is a boolean that sets if the framework will automatically send the response or if the endpoint will send
the response manually

e.g.

```typescript
@Controller('/my-controller')
class MyController extends BaseController {

  @Get('/')
  getAllUsers() {
    return {success: true}
  }

  @Get('/manual-response', false)
  getAllUsers(@Res() res: e.Response) {
    res.setHeader('Content-Type', 'application/json')
      .status(204)
      .send({success: true})
  }
}
```

### Endpoint parameters decorators

#### parameter binding

there are 3 endpoint parameters decorators for the 3 types of parameters:
`@Body`, `@Query` and `@Param`
All 3 accept 2 arguments `path?: string` (optional) -- defaults to the parameter name
and `autoCast?: boolean` (optional) -- defaults to true
path is the path for the variable value in the `req.body`, `req.query` and `req.param` respectively
in the case of the body you can use the dot notation to access nested properties

```typescript
@Controller('/my-controller')
class MyController extends BaseController {

  // This endpoint is called with the following request body:
  // {
  //   "user": {
  //     "name": "John"
  //   }
  // }

  @Post('/')
  createUser(@Body('user.name') user: string) {
    console.log(user) // John
    return {success: true}
  }
}
```

`autoCast` is a `boolean` that sets if the framework will automatically cast the parameter to the desired type (based on the
casters that are set in the bootstrap phase)

```typescript
@Controller('/my-controller')
class MyController extends BaseController {

  // Both endpoints are called with the following request query:
  // ?returnDeleted=true

  // Even though the query parameters are always strings, if you set autoCast to true (which is the default) 
  // the parameter will be casted to the desired type (if a caster is defined for that type)
  @Get('/users')
  getUsers(@Query() returnDeleted: boolean) {
    console.log(typeof returnDeleted) // "boolean"
    return {success: true}
  }

  // Since query parameters are always strings, if you set autoCast to false, 
  // the parameter will be a string no matter what you pass as a query parameter type
  @Get('/users2')
  getUsers2(@Query(null, false) returnDeleted: boolean) {
    console.log(typeof returnDeleted) // "string"
    return {success: true}
  }
}
```

#### parameter binding
There are 2 more decorators for the endpoint parameters:
`@Req()` and `@Res()`

Both does not accept any arguments and return the `req` and `res` objects respectively

```typescript
@Controller('/my-controller')
class MyController extends BaseController {

  @Get('/users')
  getUsers(@Req() req: e.Request, @Res() res: e.Response) {
    console.log(req) // Request object
    console.log(res) // Response object
    return {success: true}
  }
}
```

## Defining custom endpoint variable decorators

You can define your own endpoint variable decorators by using the `createParamDecoratorInternal` function and passing the following arguments:
- `path: string` -- the path for the variable value in the `req.body`, `req.query` and `req.param` respectively
- `autoCast: boolean` -- a `boolean` that sets if the framework will automatically cast the parameter to the desired type
- `getValue: (req: Request, res: Response, casters: DefaultCasters, meta: EndpointParamMeta) => unknown | Promise<unknown>` -- a function that returns the value of the variable

e.g.
```typescript
export function Header(headerName?: string) {
  return createParamDecorator('', false, {
    getValue(req: Request, res: Response, casters: DefaultCasters, meta: EndpointParamMeta): unknown | Promise<unknown> {
      return req.header(headerName || kebabCase(meta.name))
    }
  })
}

@Controller('/my-controller')
class MyController extends BaseController {

  @Get('custom-param-decorator-test')
  customParamDecoratorTest(@Header() xTestHeader: string) {
    return { header: xTestHeader }
  }
}
```

## Fine grain control over the endpoint middleware<br/>and custom middleware decorators

```typescript
function createEndpointMiddleware(subject: symbol, params: unknown) {}  
```

### Creating a custom middleware decorator
There are 2 functions that can be used to create custom middleware decorators:
- `createEndpointMiddleware` -- creates a middleware decorator for the endpoint functions
- `createControllerMiddleware` -- creates a middleware decorator for the controller class
Both functions accept 2 arguments:
- `subject: symbol` -- the symbol that represents the middleware decorator
- `params: unknown` -- the parameters that will be passed to the middleware generator class in order to return the proper middleware functions

Reef class -- in the bootstrapping phase implements a method called `setMiddlewareGenerator` that accepts a class that implements the `IMiddlewareGenerator` interface
`IMiddlewareGenerator` interface has 2 methods:
- `getMiddlewareSymbols` -- this function is the first one triggered by the framework. 
The function should return the symbols of the custom middleware decorators in order for the framework 
to search for those symbols in the metadata of the controllers and the endpoints.
- `getMiddleware` -- The framework after getting the symbols and gathering the metadata passed to the controllers and endpoints 
through the custom decorators, invokes this function with parameters that contain the metadata of the controllers and the endpoints.
The data are passed in a form of an object that has as keys the symbols that got through the `getMiddlewareSymbols` function 
and as value the parameters passed to the decorators. Since a decorator can be used multiple times in the same controller or endpoint, the parameters are passed as an item in an array.
The function should return an array of `RequestHandler` functions that will be used as middleware for the controllers and the endpoints.


e.g. Lets say that we want on endpoint level to set a role -- or roles -- and allow access to that endpoint only when we have that role in the header field `x-role`

Lets first create the custom middleware decorators for the endpoint and the class
```typescript
/// file: auth.middleware.ts
import {createControllerMiddleware} from "./controller.decorator";

export enum ROLE {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export const authSymbol = Symbol('auth-symbol')

// endpoint decorator
export function Auth(role: ROLE) {
  return createEndpointMiddleware(authSymbol, role)
}

// controller decorator
export function CAuth(role: ROLE) {
  return createControllerMiddleware(authSymbol, role)
}
```

Now lets create the middleware generator class. 
```typescript
/// file: my-middleware-generator.class.ts

export type MiddlewareOptions = {
  [authSymbol]: ROLE[],
}

export class MyMiddlewareGenerator implements IMiddlewareGenerator {
  getMiddlewareSymbols(): symbol[] {
    return [authSymbol]
  }

  getMiddleware(
    controllerOptions: MiddlewareOptions,
    endpointOptions: MiddlewareOptions
  ): RequestHandler[] {

    // We would like to use the endpointOptions if they are defined, otherwise we will use the controllerOptions
    const acceptedRoles = []
    if (endpointOptions && endpointOptions[authSymbol]) {
      acceptedRoles.push(...endpointOptions[authSymbol])
    } else if (controllerOptions && controllerOptions[authSymbol]) {
      acceptedRoles.push(...controllerOptions[authSymbol])
    }
    
    if (!acceptedRoles.length) {
      return []
    }
    
    // We return an array of RequestHandler functions that will be used as middleware for the endpoints
    return [(req: e.Request, res: e.Request, next: e.NextFunction) => {
      const role = req.header('x-role')
      if (acceptedRoles.includes(role)) {
        return next()
      }
      return res.status(403).send('Forbidden')
    }]
  }
}
```

Now lets use the middleware generator class in the bootstrap phase
```typescript
import {MyMiddlewareGenerator} from "./my-middleware-generator.class";

const app: Express = express()
const reef = new Reef(app)

reef
  .setControllerBundle('/api/v1/', join(__dirname, 'controllers'), /^.+\.controller/g, true)
  .addGlobalMiddleware(express.json())
  .addGlobalMiddleware(express.urlencoded({extended: false}))
  .setCasters(MyCasters)
  .setGetLoggerFn(getLogger)
  .setGetTraceIdFn(getTraceId)
  .setErrorHandler(MyErrorHandler)
  .setMiddlewareGenerator(MyMiddlewareGenerator)
  .launch()
```

