import * as bcrypt from 'bcryptjs'
import {
  mapAttributes,
  scan,
} from './helpers'

interface Hash {
  password: any
  emailAddress: any
  saltWorkFactor: any
  table: any
}

class Hash {
  constructor({ 
    password, 
    emailAddress,
    table,
    saltWorkFactor = 10
  }) {
    this.password = password
    this.emailAddress = emailAddress
    this.saltWorkFactor = saltWorkFactor
  }

  async create() {
    const salt = await bcrypt.genSalt(this.saltWorkFactor)
    return bcrypt.hash(this.password, salt)
  }

  async verify() {
    const users = await this.getUserByEmail().catch(err => { throw new Error(err) })
    if(!users) {
      throw new Error ('User not found.')
    }
    const result = await bcrypt.compare(this.password, users[0].password)
    
    if(!result) {
      throw new Error('Incorrect password.')
    }
    
    return { user: users[0], result }
  }

  getUserByEmail() {
    const params = {
      TableName: this.table,
      ...mapAttributes({ emailAddress: this.emailAddress }),
      FilterExpression: '#emailAddress = :emailAddress',
    }

    return scan(params)
  }
}

export default Hash
