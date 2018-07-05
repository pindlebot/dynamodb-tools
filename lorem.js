let db = require('./lib')().table('stackerror-dev-state')
db.get('1234')
  .then(data => {
    console.log(data)
  })
  .catch(err => {
    console.log(err)
  })
