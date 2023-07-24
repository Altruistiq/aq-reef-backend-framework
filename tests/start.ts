import {initializeServer} from "./test-server";
import chai from 'chai'
import chaiHttp from 'chai-http'
import chaiAsPromised from 'chai-as-promised'
import { after, before } from 'mocha'

chai.use(chaiAsPromised)
chai.use(chaiHttp)

/**
 * Global before all tests
 */
before(async () => {
  console.log('initializing Tests (global pre-test hook)')
  global._expressApp = await initializeServer()
})


