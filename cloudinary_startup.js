const cloudinary = require('cloudinary').v2
require('dotenv').config();

module.exports = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });
    cloudinary.config();
    console.log("Initialized Cloudinary SDK");
};