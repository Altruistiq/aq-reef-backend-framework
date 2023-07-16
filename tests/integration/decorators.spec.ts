import chai, {assert} from "chai";
describe("Testing Decorators", async () => {
  it('should be able to do a simple GET', async () => {
    const testVal = 'simpleGETResponse'
    const { body, status } = await chai.request(global._expressApp).get(`/api/v1/bar?val=${testVal}`).send()
    assert.equal(status, 200)
    assert.equal(body.val, testVal)
  })

  it('should be able to do a simple POST', async () => {
    const testVal = 'simplePOSTResponse'
    const { body, status } = await chai.request(global._expressApp).post(`/api/v1/bar`).send({ val: testVal })
    assert.equal(status, 200)
    assert.equal(body.val, testVal)
  })

  it('should be able to do a simple PUT', async () => {
    const testVal = 'simplePUTResponse'
    const { body, status } = await chai.request(global._expressApp).put(`/api/v1/bar`).send({ val: testVal })
    assert.equal(status, 200)
    assert.equal(body.val, testVal)
  })

  it('should be able to do a simple DELETE', async () => {
    const testVal = 'simpleDELETEResponse'
    const { body, status } = await chai.request(global._expressApp).put(`/api/v1/bar`).send({ val: testVal })
    assert.equal(status, 200)
    assert.equal(body.val, testVal)
  })

  it('should be able to do a simple PATCH', async () => {
    const testVal = 'simplePATCHResponse'
    const { body, status } = await chai.request(global._expressApp).put(`/api/v1/bar`).send({ val: testVal })
    assert.equal(status, 200)
    assert.equal(body.val, testVal)
  })

  it('should be able use urlParams', async () => {
    const testVal = 'simpleURLparam'
    const { body, status } = await chai.request(global._expressApp).get(`/api/v1/bar/${testVal}/test`).send()
    assert.equal(status, 200)
    assert.equal(body.urlParam, testVal)
  })

  it('should be able use urlParams', async () => {
    const testVal = 'simpleURLparam'
    const { body, status } = await chai.request(global._expressApp).get(`/api/v1/bar/${testVal}/test`).send()
    assert.equal(status, 200)
    assert.equal(body.urlParam, testVal)
  })

  it('should be able use urlParams', async () => {
    const testVal = 'simpleURLparam'
    const { body, status } = await chai.request(global._expressApp).get(`/api/v1/bar/${testVal}/test`).send()
    assert.equal(status, 200)
    assert.equal(body.urlParam, testVal)
  })

  it('should be able to use res for custom response', async () => {
    const { body, status } = await chai.request(global._expressApp).get(`/api/v1/bar/decorator-res-test`).send()
    assert.equal(status, 200)
    assert.equal(body.success, true)
  })

  it('should be able to use build in and extended casters', async () => {
    const { body, status } = await chai.request(global._expressApp).get(
      `/api/v1/bar/caster-test?myDate=2022-10-11&isBool=true&age=12`
    ).send()
    assert.equal(status, 200)
    assert.equal(body.myDate, new Date('2022-10-11').toJSON())
    assert.equal(body.isBool, true)
    assert.equal(body.age, 12)
  })

  it('should be able to read headers from Request object (testing Req decorator)', async () => {
    const headerName = 'x-test-head'
    const headerVal = 'test-header'
    const { body, status } = await chai
      .request(global._expressApp)
      .get(`/api/v1/bar/read-req-header?headerName=${headerName}`)
      .set(headerName, headerVal)
      .send()
    assert.equal(status, 200)
    assert.equal(body[headerName], headerVal)
  })

  it('should be able use middleware (testing AuthRoles custom decorator) -- success', async () => {
    const { status } = await chai
      .request(global._expressApp)
      .get(`/api/v1/bar/custom-decorator-role`)
      .set('x-role', 'USER')
      .send()
    assert.equal(status, 200)
  })

  it('should be able use middleware (testing AuthRoles custom decorator) -- fail', async () => {
    const { body, status } = await chai
      .request(global._expressApp)
      .get(`/api/v1/bar/custom-decorator-role`)
      .set('x-role', 'USER_2')
      .send()
    assert.notEqual(status, 200)
    assert.exists(body.err)
  })

  it('should be able use middleware (testing CAuthRoles custom decorator) -- success', async () => {
    const { status } = await chai
      .request(global._expressApp)
      .get(`/api/v1/foo/controller-level-middleware`)
      .set('x-role', 'USER')
      .send()
    assert.equal(status, 200)
  })

  it('should be able use middleware (testing AuthRoles override CAuthRoles on custom decorator)', async () => {
    const { status: failStatus } = await chai
      .request(global._expressApp)
      .get(`/api/v1/foo/endpoint-middleware-override`)
      .set('x-role', 'ADMIN')
      .send()
    assert.equal(failStatus, 505)

    const { status: successStatus } = await chai
      .request(global._expressApp)
      .get(`/api/v1/foo/endpoint-middleware-override`)
      .set('x-role', 'USER')
      .send()
    assert.equal(successStatus, 200)
  })

  it('should not reach the controller with the wrong filename pattern', async () => {
    const { status } = await chai
      .request(global._expressApp)
      .get(`/api/v1/not-reachable`)
      .send()
    assert.equal(status, 404)

  })
})
