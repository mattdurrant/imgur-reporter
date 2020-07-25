const eventRepository       = require('./event-repository.js')
const moment                = require('moment')
const request               = require('request-promise');
const accessTokenRepository = require('./access-token-repository.js')
const ora                   = require('ora')
const config                = require('./config.json')

; (async () => {
  await start();
})()

async function start() {
    let imgurPhotos = await getImgurPhotos()
    if (imgurPhotos === null)
        return
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

        let url = `https://api.imgur.com/3/account/mattdurrant/images/0`
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
            description:    `<a href='${photo.link}'>${photo.title}</a> ${photo.description} <a href='${photo.link}'><img src='${photo.link}'></img></a> `,
            timestamp:      moment.unix(photo.datetime).format()
        }))

    console.log(imgurPhotos)
    spinner.succeed(`Retrieved ${response.length} photos from Imgur.`)
    return imgurPhotos
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
