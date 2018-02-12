const Db = require('./src')

let db = Db({prefix: 'lorem'})

console.log(db)
console.log(db.database())
