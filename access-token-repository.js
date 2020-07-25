const mysql     = require('mysql2/promise')
const config    = require('./config.json')

async function get() {
    const connection = await mysql.createConnection({
        host: config.mysql.host,
        port: config.mysql.port,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database    
    })

    let results = await connection.query(`SELECT * FROM homepage.imgur WHERE username = 'mattdurrant'`)
    
    const data = results[0].map(result =>     
    ({
        username:       result.username,
        accessToken:    result.access_token,
        refreshToken:   result.refresh_token,
        expiresAt:      result.expires_at
    }))

    return data[0]
}

async function update(accessToken, refreshToken, expiresAt) {
    const connection = await mysql.createConnection({
        host: config.mysql.host,
        port: config.mysql.port,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database    
    })

    await connection.query(`UPDATE homepage.imgur SET access_token = '${accessToken}', refresh_token = '${refreshToken}', expires_at = ${expiresAt} WHERE username = 'mattdurrant'`)
    console.log('Updated access token.')
}

module.exports = {
    get,
    update
}
