
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const assert = chai.assert
const expect = chai.expect
const should = chai.should()

chai.use(chaiAsPromised)

const prefix = 'github-code-search-dev-'
const table = 'messages'
const record = {
  id: '0100462',
  repo: 'jquery/jquery',
  message: 'Q2Fubm90IGNsZWFyIHRpbWVyOiB0aW1lciBjcmVhdGVkIHdpdGggc2V0dHR5cGUoKSBidXQgY2xlYXJlZCB3aXRoIGNsZWFyKCk='
}

const Db = require('../')

function log (promise) {
  promise.then(data => { console.log(data.params) })
}

describe('prepare(name, {})', function () {
  it('prepare(name, {})', function (done) {
    let db = new Db(undefined, { prefix })
    let p = db.prepare('messages', {})
    p.should.eventually.be.fulfilled.notify(done)
    log(p)
  })
})

describe('table(name).prepare(props)', function () {
  it('table(name).prepare(props)', function (done) {
    let db = new Db(undefined, { prefix })
    let p = db.table('messages').prepare(record)
    p.should.eventually.be.fulfilled.notify(done)
    log(p)
  })
})

describe('prepare(name.id)', function () {
  it('prepare(name.id)', function (done) {
    let db = new Db(undefined, { prefix })
    let p = db.prepare(`messages.${record.id}`)
    p.should.eventually.be.fulfilled.notify(done)
    log(p)
  })
})

describe('prepare(name.id, { id })', function () {
  it('prepare(name.id, { id })', function (done) {
    let db = new Db(undefined, { prefix })
    let p = db.prepare(`messages.${record.id}`, { id: record.id })
    p.should.eventually.be.fulfilled.notify(done)
    log(p)
  })
})

describe('table(name).get(id)', function () {
  it('table(name).get(id)', function (done) {
    let db = new Db(undefined, {prefix, meta: true, dryRun: true})
    let p = db.table(table).get(record.id)
    log(p)
    p.should.eventually.be.fulfilled.notify(done)
  })
})

describe('table(name).get({ id })', function () {
  it('table(name).get({ id })', function (done) {
    let db = new Db(undefined, {prefix, dryRun: true})
    let p = db.table(table).get({ id: record.id })
    p.should.eventually.be.fulfilled.notify(done)
    log(p)
  })
})

/* describe('Db.get(name.id)', function () {
  it('Db.get(name.id)', function (done) {
    let db = new Db(undefined, {prefix})
    let p = db.get(`${table}.${record.id}`)
    p.should.eventually.have.property('id').notify(done)
  });
});

describe('Db.get(name, props)', function () {
  it('Db.get(name, props)', function (done) {
    let db = new Db(undefined, {prefix})
    let p = db.get(table, { message: record.message, repo: record.repo })
    p.should.eventually.have.property(0).notify(done);
    log(p)
  });
}); */

/* describe('Db.get(table)', function () {
  it('Db.get(table)', function (done) {
    let db = new Db(undefined, {prefix})
    let p = db.get('state')
    p.should.eventually.have.property(0).notify(done);
    log(p)
  });
});

describe('Db.get.5', function () {
  it('Db.get.5', function (done) {
    let db = new Db(undefined, {prefix})
    let p = db.get('state', o => o.id.indexOf('test') > -1)
    p.should.eventually.have.property(0).notify(done);
    // log(p)
  });
});

describe('Db.set.1', function() {
  it('Db.set.1', function(done) {
    let db = new Db(undefined, {prefix})
    let promise = db.set('state.test_record_id', { someProperty: 'someValue'})
    // log(promise)
    promise.should.eventually.have.property('id').notify(done);
  })
})

describe('Db.set.2', function() {
  it('Db.set.2', function(done) {
    let db = new Db(undefined, {prefix})
    let promise = db.set('state', { someProperty: 'someValue', id: 'test_record_id' })
    // log(promise)
    promise.should.eventually.have.property('someProperty').notify(done);
  })
})
*/
