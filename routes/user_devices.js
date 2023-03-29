const router = require("express").Router();
const User_Devices = require("../models/user_devices.model");
const firebase = require("firebase-admin");

async function registerDeviceToken(username, deviceToken) {
    const twoMonthsInMiliSeconds = 1000*60*60*24*60;4444
    await User_Devices.updateOne({
        deviceToken: deviceToken,
    }, {username: username, expires: Date.now() + twoMonthsInMiliSeconds},
    {upsert: true})
}

async function removeDeviceToken(username, deviceToken) {
    await User_Devices.deleteOne({username: username, deviceToken: deviceToken});
}

async function getDeviceTokens(usernames) {
    return await User_Devices.find({username: {$in: usernames}}).distinct('deviceToken');
}

function sendMessageToDevices(message) {
    firebase.messaging().sendMulticast(message).then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
      })
      .catch((error) => {
        // Will need to see if I can get 400 and 401
        console.log('Error sending message:', error);
      });

}
module.exports = router;
module.exports.registerDeviceToken = registerDeviceToken;
module.exports.removeDeviceToken = removeDeviceToken;
module.exports.getDeviceTokens = getDeviceTokens;
module.exports.sendMessageToDevices = sendMessageToDevices;