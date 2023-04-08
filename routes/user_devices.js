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

async function removeMultipleDeviceTokens(deviceTokens) {
    await User_Devices.deleteMany({deviceToken: {$in: deviceTokens}});
}

async function getDeviceTokens(usernames) {
    return await User_Devices.find({username: {$in: usernames}}).distinct('deviceToken');
}

async function sendMessageToDevices(message) {
    if (!message["token"] || message["token"].length === 0) {
        return;
    }

    const messageReport = await firebase.messaging().sendMulticast(message);
    if (messageReport.failureCount > 0) {
        const expiredOrInvalidTokens = [];
          messageReport.responses.forEach((resp, idx) => {
            if (!resp.success &&
                (resp.error.code === "messaging/invalid-argument"
                || resp.error.code === "messaging/unregistered")) {
                expiredOrInvalidTokens.push(message.tokens[idx]);
            }
          });
        console.log('List of tokens that caused failures: ' + expiredOrInvalidTokens);
        await removeMultipleDeviceTokens(expiredOrInvalidTokens);
    }
}
module.exports = router;
module.exports.registerDeviceToken = registerDeviceToken;
module.exports.removeDeviceToken = removeDeviceToken;
module.exports.getDeviceTokens = getDeviceTokens;
module.exports.sendMessageToDevices = sendMessageToDevices;