
const crypto = require('crypto')
const table = 'graphql-lambda-prod-users'
const record = {
  id: 'sess|3dd9b0174b5474d9a92a62b6fa79c20d'
}

const data = {
  createdAt: '2017-11-05T09:39:12+00:00',
  isAuthed: false,
  id: 'sess|3dd9b0174b5474d9a92a62b6fa79c20d',
  updatedAt: '2017-11-05T09:39:12+00:00'
}

const db = require('../../lib')().table(table)

// describe('get()', function () {
//  it('should return all records in a table', function (done) {
//    let promise = db.get()
//    promise.should.eventually.have.property('length').notify(done)
//    log(promise)
//  })
// })

it('get(id) should return a single record', () => {
  expect.assertions(1)
  return expect(db.get(record.id)).resolves.toMatchObject(data)
})

it('get({ id }) should return a single record', () => {
  expect.assertions(1)
  return expect(db.get({ id: record.id })).resolves.toMatchObject(data)
})

it('get(data) should return a single record matching the provided data', () => {
  expect.assertions(1)
  return expect(db.get({ primaryCard: 'cards|3fbb88593233adfd' })).resolves.toMatchObject({
    createdAt: '2017-11-04T16:57:23+00:00',
    primaryCard: 'cards|3fbb88593233adfd',
    id: 'sess|82b65b644ae3fe24ff64a7fc72d4a0cd',
    isAuthed: false,
    updatedAt: '2017-11-04T16:58:56+00:00'
  })
})

it('set(id, data) should create a new record', () => {
  let db = require('../../lib')().table('stackerror-dev-state')
  expect.assertions(1)
  return expect(db.set('somekey', { property: 'value' })).resolves.toMatchObject({
    id: 'somekey',
    property: 'value'
  })
})

it('set(data) should create a new record', () => {
  expect.assertions(1)
  let db = require('../../lib')().table('stackerror-dev-state')
  let id = crypto.randomBytes(8).toString('hex')

  return expect(db.set({ id, property: 'value' })).resolves.toMatchObject({
    id: id,
    property: 'value'
  })
})

it('remove(id) should delete a record', () => {
  expect.assertions(1)
  let db = require('../../lib')().table('stackerror-dev-state')
  return expect(db.remove('somekey')).resolves.toMatchObject({})
})

it('get(nonExistentId) should reject a promise', async () => {
  expect.assertions(1)
  let db = require('../../lib')().table('stackerror-dev-state')
  await expect(db.get('1234')).rejects.toMatchObject({
    message: 'unknown record'
  })
})
