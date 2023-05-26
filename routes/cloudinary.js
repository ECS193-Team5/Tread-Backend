const cloudinary = require('cloudinary').v2
require('dotenv').config();

async function uploadImage(fileSource, folder, publicID){

    await cloudinary.uploader.upload(fileSource, {
        upload_preset: process.env.CLOUDINARY_PRESET,
        public_id: publicID,
        folder: folder,
        unique_filename: true,
        resource_type: 'image',
        overwrite: true,
        invalidate: true
    });

}

async function deleteImage(publicID) {
    await cloudinary.uploader.destroy(publicID, {
        resource_type: 'image',
        type: 'upload',
        invalidate: false
    })
}

module.exports.uploadImage = uploadImage;
module.exports.deleteImage = deleteImage;