const cloudinary = require('cloudinary').v2
require('dotenv').config();

cloudinary.config({
    cloud_name: 'sample',
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure: true
  });

async function uploadImage(fileSource, folder, publicID){
    await cloudinary.uploader.upload(fileSource, {
        upload_preset: process.env.CLOUDINARY_PRESET,
        public_id: publicID,
        folder: folder,
        unique_filname: true,
        resource_type: 'image',
        overwrite: true
    });
}

module.exports.uploadImage = uploadImage;