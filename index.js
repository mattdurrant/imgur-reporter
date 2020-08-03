const eventRepository       = require('./event-repository.js')
const moment                = require('moment')
const request               = require('request-promise');
const accessTokenRepository = require('./access-token-repository.js')
const ora                   = require('ora')
const config                = require('./config.json')
const downloader            = require('./downloader.js')
const thumbnailGenerator    = require('./thumbnail-generator.js');

;
 (async () => {
  await start();
})()

async function start() {
    let imgurPhotos = await getImgurPhotos()
    if (imgurPhotos === null)
        return

    await downloader.downloadImages(imgurPhotos)
    await thumbnailGenerator.generate(imgurPhotos)
    await eventRepository.insert(imgurPhotos)
    process.exit()
}

async function getImgurPhotos() {
    let spinner     = ora(`Getting access token`).start()
    let accessToken = await getAccessToken()
    
    let response = null
    try {
        var options = {
            url: `https://api.imgur.com/3/account/mattdurrant/images/0`,
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };

        response = JSON.parse(await request.get(options)).data
    }
    catch {
        console.log(accessToken)
        let clientId = config.imgur.clientId
        spinner.fail(`Couldn't retrieve photos from Imgur`)
        console.log(`You may need to reauthenticate using the following url:`)
        console.log(`https://api.imgur.com/oauth2/authorize?client_id=${clientId}&response_type=token`)
        return null
    }

    
    const imgurPhotos = response.map(photo => ({
            title:          photo.title,
            link:           photo.link,
            width:          photo.width,
            height:         photo.height,
            description:    getDescription(photo),
            timestamp:      moment.unix(photo.datetime).format()
        }))

    spinner.succeed(`Retrieved ${response.length} photos from Imgur.`)
    return imgurPhotos
}

function getDescription(photo) {
    if (photo.name === null && photo.description === null) {
        return `<a href='${photo.link}'><br /><img src='${getThumbnailUrl(photo.link)}'></img></a> `
    } else if (photo.description === null) {
        return `<a href='${photo.link}'>${photo.title}</a> <a href='${photo.link}'><br /><img src='${getThumbnailUrl(photo.link)}'></img></a> `
    }
    return `<a href='${photo.link}'>${photo.title}</a> ${photo.description} <a href='${photo.link}'><br /><img src='${getThumbnailUrl(photo.link)}'></img></a> `
}

function getThumbnailUrl(link) {
    let parts = link.split('/')
    let filename = parts[parts.length-1]
    return `./images/thumbnail-${filename}`
}

async function getAccessToken() {
    let clientId = config.imgur.clientId
    let clientSecret = config.imgur.clientSecret
    
    let data = await accessTokenRepository.get()
    if (moment() < moment.unix(data.expiresAt)) {
        return data.accessToken
    }
   
    let refreshToken = data.refreshToken
    let spinner = ora(`Access token expired at ${moment.unix(data.expiresAt)}. Attempting to get a new access token using refresh token (${refreshToken}).`).start()
    let url = `https://api.imgur.com/oauth2/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`
    console.log(url)
    let response = JSON.parse(await request.post(url))
    spinner.text = `Saving new access token to database`    
    await accessTokenRepository.update(response.access_token , response.refresh_token, response.expires_at)
    spinner.text = `New access token saved to database`
    return response.access_token
}
