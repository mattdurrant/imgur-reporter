
const ftp       = require("basic-ftp")
const fs        = require("fs") 
const ora       = require('ora')
const config    = require('./config.json')

async function upload(fileName, filePath) {
   
    const client = new ftp.Client()
    try {
        await client.access({
            host: config.website.ftp.host,
            user: config.website.ftp.username,
            password: config.website.ftp.password,
        })
        await client.cd(`public_html`)
        await client.cd(`images`)
        spinner = ora(`Uploading ${fileName} via FTP.`).start()
        await client.upload(fs.createReadStream(filePath), fileName)
        spinner.succeed(`${fileName} uploaded.`)
    }
    catch(ex) {
        console.log(ex)
        spinner.fail(`Files failed to upload.`)
    }   
    
    client.close()
}

module.exports = {
    upload
}