import chai, {assert} from "chai";
describe("Testing Decorators", async () => {
  it('should be able to do a simple GET', async () => {
    const testVal = 'simpleGETResponse'
    const { body, status } = await chai.request(global._expressApp).get(`/api/v1/foo?val=${testVal}`).send()
    assert.equal(status, 200)
    assert.equal(body.val, testVal)
  })

  it('should be able to do a simple POST', async () => {
    const testVal = 'simplePOSTResponse'
    const { body, status } = await chai.request(global._expressApp).post(`/api/v1/foo`).send({ val: testVal })
    assert.equal(status, 200)
    assert.equal(body.val, testVal)
  })

  it('should be able to do a simple PUT', async () => {
    const testVal = 'simplePUTResponse'
    const { body, status } = await chai.request(global._expressApp).put(`/api/v1/foo`).send({ val: testVal })
    assert.equal(status, 200)
    assert.equal(body.val, testVal)
  })

  it('should be able to do a simple DELETE', async () => {
    const testVal = 'simpleDELETEResponse'
    const { body, status } = await chai.request(global._expressApp).put(`/api/v1/foo`).send({ val: testVal })
    assert.equal(status, 200)
    assert.equal(body.val, testVal)
  })

  it('should be able to do a simple PATCH', async () => {
    const testVal = 'simplePATCHResponse'
    const { body, status } = await chai.request(global._expressApp).put(`/api/v1/foo`).send({ val: testVal })
    assert.equal(status, 200)
    assert.equal(body.val, testVal)
  })

  it('should be able use urlParams', async () => {
    const testVal = 'simpleURLparam'
    const { body, status } = await chai.request(global._expressApp).get(`/api/v1/foo/${testVal}/test`).send()
    assert.equal(status, 200)
    assert.equal(body.urlParam, testVal)
  })

  it('should be able use urlParams', async () => {
    const testVal = 'simpleURLparam'
    const { body, status } = await chai.request(global._expressApp).get(`/api/v1/foo/${testVal}/test`).send()
    assert.equal(status, 200)
    assert.equal(body.urlParam, testVal)
  })

  it('should be able use urlParams', async () => {
    const testVal = 'simpleURLparam'
    const { body, status } = await chai.request(global._expressApp).get(`/api/v1/foo/${testVal}/test`).send()
    assert.equal(status, 200)
    assert.equal(body.urlParam, testVal)
  })

  it('should be able to use res for custom response', async () => {
    const { body, status } = await chai.request(global._expressApp).get(`/api/v1/foo/decorator-res-test`).send()
    assert.equal(status, 200)
    assert.equal(body.success, true)
  })

  it('should be able to use build in and extended casters', async () => {
    const { body, status } = await chai.request(global._expressApp).get(
      `/api/v1/foo/caster-test?myDate=2022-10-11&isBool=true&age=12`
    ).send()
    assert.equal(status, 200)
    assert.equal(body.myDate, new Date('2022-10-11').toJSON())
    assert.equal(body.isBool, true)
    assert.equal(body.age, 12)
  })

  it.only('should be able to read headers from Request object (testing Req decorator)', async () => {
    const headerName = 'x-test-head'
    const headerVal = 'test-header'
    const { body, status } = await chai
      .request(global._expressApp)
      .get(`/api/v1/foo/read-req-header?headerName=${headerName}`)
      .set(headerName, headerVal)
      .send()
    assert.equal(status, 200)
    assert.equal(body[headerName], headerVal)
  })

})
