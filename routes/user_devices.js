const router = require("express").Router();
const User_Devices = require("../models/user_devices.model");

async function registerDeviceToken(username, deviceToken) {
    const twoMonthsInMiliSeconds = 1000*60*60*24*60;
    await User_Devices.updateOne({
        deviceToken: deviceToken,
    }, {username: username, expires: Date.now() + twoMonthsInMiliSeconds},
    {upsert: true})
}



module.exports = router;
module.exports.registerDeviceToken = registerDeviceToken;