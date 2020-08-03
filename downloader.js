const download              = require('image-downloader')
const ora                   = require('ora')
const config                = require('./config.json')
const fs                    = require('fs')

async function downloadImages(imgPhotos) {
    let imagesDownloaded = 0
    let spinner = ora(`Downloading images.`).start()
    
    for (let i = 0; i < imgPhotos.length; i++) {
        let imgPhoto = imgPhotos[i]
        const options = {
            url: imgPhoto.link,
            dest: './images'                
        }

        try {
            let parts = imgPhoto.link.split('/')
            let filename = parts[parts.length-1]
            let imageExists = fs.existsSync(`./images/${filename}`)
            
            if (!imageExists) {
                spinner.text = `Downloading image ${imgPhoto.link}.`    
                let result = await download.image(options)
                imagesDownloaded++
            }
        }
        catch {
        }
    }
    spinner.succeed(`Downloading ${imagesDownloaded} images.`)
}

module.exports = {
    downloadImages
}

