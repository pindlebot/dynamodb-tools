const _key = require('default-key')
const jwt = require('jsonwebtoken')

async function createToken({
  sub = null,
  expiresIn = '12h',
  clientId = process.env.CLIENT_ID,
  clientSecret = process.env.CLIENT_SECRET
}) {
  let payload = {
    sub: _key('sess', 16)
  }
  
  if(sub) {
    payload.sub = sub;      
  }

  const options = { 
    audience: clientId,
    expiresIn: expiresIn
  }

  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      clientSecret,
      options,
      (err, token) => {
        if (err) {
          reject(err)
        }
        resolve({ token, payload })
      },
    )
  })
}

export default createToken