const cloudinary = require('cloudinary').v2
require('dotenv').config();

async function uploadImage(fileSource, folder, publicID){
    await cloudinary.uploader.upload(fileSource, {
        upload_preset: process.env.CLOUDINARY_PRESET,
        public_id: publicID,
        folder: folder,
        unique_filename: true,
        resource_type: 'image',
        overwrite: true
    });
}

module.exports.uploadImage = uploadImage;