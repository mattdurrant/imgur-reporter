const mysql     = require('mysql2/promise')
const config    = require('./config.json')

async function insert(imgurPhotos) {
    const connection = await mysql.createConnection({
        host: config.mysql.host,
        port: config.mysql.port,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database 
      })

    for (let i = 0; i < imgurPhotos.length; i++) {
        let sql = `INSERT INTO homepage.events (timestamp, details, type_ind) VALUES ("${imgurPhotos[i].timestamp}", "${imgurPhotos[i].description}", "imgurPhotos") ON DUPLICATE KEY UPDATE details = "${imgurPhotos[i].description}"`
        console.log(sql)
        
        await connection.query(sql)
    }
}

module.exports = {
    insert
}
