const sharp             = require('sharp')
const ora               = require('ora')
const fs                = require('fs')
const uploader          = require('./uploader.js')

async function generate(imgurPhotos) {
    let thumbnailsGenerated = 0
    let spinner = ora(`Generating thumbnails.`).start()
    
    for (let i = 0; i < imgurPhotos.length; i++) {
        let imgurPhoto = imgurPhotos[i]
        let parts = imgurPhoto.link.split('/')
        let filename = parts[parts.length-1]
       
        let thumbnailImage = `images/thumbnail-${filename}`
        let imageExists = fs.existsSync(thumbnailImage)
        spinner.text = `Generated image for ./images/${filename}.`
           
        if (!imageExists) {
            try {
                await sharp(`./images/${filename}`)
                    .resize(400)
                    .toFile(thumbnailImage)
            
                await uploader.upload(`thumbnail-${filename}`, `images/thumbnail-${filename}`)
            }
            catch(ex) {
                console.log(ex)                
            }
            thumbnailsGenerated++
        }    
    }   
    
    spinner.succeed(`Generated ${thumbnailsGenerated} thumbnails.`)
}

module.exports = {
    generate
}