
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const assert = chai.assert
const expect = chai.expect
const should = chai.should()

chai.use(chaiAsPromised)

const prefix = 'graphql-lambda-prod-'
const table = 'users'
const record = {
  id: 'sess|3dd9b0174b5474d9a92a62b6fa79c20d'
}

const Db = require('../lib').Db

function log (promise) {
  promise.then(data => { console.log(data) })
}

/*describe('prepare(name, {})', function () {
  it('prepare(name, {})', function (done) {
    let db = new Db(undefined, { prefix })
    let p = db.prepare(table, {})
    p.should.eventually.be.fulfilled.notify(done)
    log(p)
  })
})

describe('table(name).prepare(props)', function () {
  it('table(name).prepare(props)', function (done) {
    let db = new Db(undefined, { prefix })
    let p = db.table(table).prepare(record)
    p.should.eventually.be.fulfilled.notify(done)
    log(p)
  })
})

describe('prepare(name.id)', function () {
  it('prepare(name.id)', function (done) {
    let db = new Db(undefined, { prefix })
    let p = db.prepare(`users.${record.id}`)
    p.should.eventually.be.fulfilled.notify(done)
    log(p)
  })
})

describe('prepare(name.id, { id })', function () {
  it('prepare(name.id, { id })', function (done) {
    let db = new Db(undefined, { prefix })
    let p = db.prepare(`users.${record.id}`, { id: record.id })
    p.should.eventually.be.fulfilled.notify(done)
    log(p)
  })
})

describe('table(name).get(id)', function () {
  it('table(name).get(id)', function (done) {
    let db = new Db(undefined, {prefix, meta: true, dryRun: false})
    let p = db.table(table).get(record.id)
    log(p)
    p.should.eventually.be.fulfilled.notify(done)
  })
})

describe('table(name).get({ id })', function () {
  it('table(name).get({ id })', function (done) {
    let db = new Db(undefined, {prefix, dryRun: false})
    let p = db.table(table).get({ id: record.id })
    p.should.eventually.be.fulfilled.notify(done)
    log(p)
  })
})

describe('Db.plugin', function () {
  it('Db.plugin', function (done) {
    let db = new Db(undefined, {prefix})

    async function plugin (props, func) {
      let out = await func()
      console.log(out)
      return out
    }

    db.use(plugin)
    let p = db.get(`${table}.${record.id}`)
    p.should.eventually.be.fulfilled.notify(done)
  });
});
*/
describe('Db.set', function () {
  it('Db.set', function (done) {
    let db = new Db(undefined, { prefix: 'stackerror-dev-', dryRun: true })

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
    
    let p = db.set('state.data', input)
    p.then(data => {
      console.log(data.params)
      console.log(data.params.toJSON())
    })
    //log(p)
    p.should.eventually.be.fulfilled.notify(done)
  });
});

/*
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
