
const { describe, it } = require('mocha')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const assert = chai.assert
const expect = chai.expect
const should = chai.should()

chai.use(chaiAsPromised)

const table = 'graphql-lambda-prod-users'
const record = {
  id: 'sess|3dd9b0174b5474d9a92a62b6fa79c20d'
}

const Db = require('../lib')

function log (promise) {
  promise.then(data => { console.log(data) })
}

describe('prepare(name, {})', function () {
  it('prepare(name, {})', function (done) {
    let db = Db().table(table)
    let promise = db.prepare(table, {})
    promise.should.eventually.be.fulfilled.notify(done)
    log(promise)
  })
})

describe('table(name).prepare(props)', function () {
  it('table(name).prepare(props)', function (done) {
    let db = Db()
    let promise = db.table(table).prepare(record)
    promise.should.eventually.be.fulfilled.notify(done)
    log(promise)
  })
})

describe('prepare(name.id)', function () {
  it('prepare(name.id)', function (done) {
    let db = Db().table(table)
    let promise = db.prepare(record.id)
    promise.should.eventually.be.fulfilled.notify(done)
    log(promise)
  })
})

describe('prepare(name.id, { id })', function () {
  it('prepare(name.id, { id })', function (done) {
    let db = Db().table(table)
    let promise = db.prepare(record.id, { id: record.id })
    promise.should.eventually.be.fulfilled.notify(done)
    log(promise)
  })
})

describe('table(name).get(id)', function () {
  it('table(name).get(id)', function (done) {
    let db = Db()
    let promise = db.table(table).get(record.id)
    log(promise)
    promise.should.eventually.be.fulfilled.notify(done)
  })
})

describe('table(name).get({ id })', function () {
  it('table(name).get({ id })', function (done) {
    let db = Db()
    let promise = db.table(table).get({ id: record.id })
    promise.should.eventually.be.fulfilled.notify(done)
    log(promise)
  })
})

describe('Db.plugin', function () {
  it('Db.plugin', function (done) {
    let db = Db().table(table)

    async function plugin (props, func) {
      let out = await func()
      console.log(out)
      return out
    }

    db.use(plugin)
    let promise = db.get(record.id)
    promise.should.eventually.be.fulfilled.notify(done)
  })
})

describe('Db.set', function () {
  it('Db.set', function (done) {
    let db = Db().table('stackerror-dev-state')

    const input = {
      repos: {
        page: 0,
        index: 0
      },
      terms: {
        index: 0
      },
      results: {
        index: 0
      },
      post: {
        id: 0
      }
    }

    let promise = db.set('ipsum', input)
    promise.then(data => {
      console.log(data)
    })
    promise.should.eventually.be.fulfilled.notify(done)
  })
})
