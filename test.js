const Db = require('./src')

const plugins = {
  lorem: (...args) => { console.log(args) }
}

let db = Db({prefix: 'lorem', plugins})

console.log(db)
console.log(db.database())
