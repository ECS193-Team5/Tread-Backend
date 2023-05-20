const router = require("express").Router();
const User_devices = require("../models/user_devices.model");
const Notifications = require("../models/notifications.model");
const firebase = require("firebase-admin");

async function registerDeviceToken(username, deviceToken) {
    const twoMonthsInMiliSeconds = 1000*60*60*24*60;4444
    await User_devices.updateOne({
        deviceToken: deviceToken,
    }, {username: username, expires: Date.now() + twoMonthsInMiliSeconds},
    {upsert: true})
}

async function removeDeviceToken(username, deviceToken) {
    await User_devices.deleteOne({username: username, deviceToken: deviceToken});
}

async function removeMultipleDeviceTokens(deviceTokens) {
    await User_devices.deleteMany({deviceToken: {$in: deviceTokens}});
}

async function getDeviceTokens(usernames) {
    return await User_devices.find({username: {$in: usernames}}).distinct('deviceToken');
}

async function sendMessageToDevices(message) {
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

async function sendPushNotificationToUsers(usernames, title, page) {
    const deviceTokens = await getDeviceTokens(usernames);

    if (deviceTokens.length === 0) {
        return;
    }
    const message = {
        tokens: deviceTokens,
        notification:{
            title: title,
            body: ""
        },
        data: {
            page: page
        }
    }
    await sendMessageToDevices(message);
}
async function updateNotificationLog(usernames, message) {
    const notificationLogs = usernames.map(username => ({
        username: username,
        message: message
    }));
    try {
        await Notifications.insertMany(notificationLogs, {ordered: false});
    } catch(err){
        console.log(err);
    }
}

async function sendNotificationToUsers(usernames, message, page) {
    await Promise.all([
        sendPushNotificationToUsers(usernames, message, page),
        updateNotificationLog(usernames, message)
    ])
}

async function getNotifications(req, res) {
    const username = req.session.username;
    try {
        const notifications = await Notifications.find({
            username: username,
        }, {message : 1}).sort({date: -1}).lean();
        return res.status(200).json(notifications);
    } catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

router.route('/get_notifications').post(getNotifications);

async function deleteNotification(req, res){
    const username = req.session.username;
    const notificationID = req.body.notificationID;
    try {
        await Notifications.deleteOne({
            _id: notificationID, username: username
        }).lean();
        return res.sendStatus(200);
    } catch (err) {
        return res.sendStatus(500);
    }
}

router.route('/delete_notification').post(deleteNotification);

module.exports = router;
module.exports.registerDeviceToken = registerDeviceToken;
module.exports.removeDeviceToken = removeDeviceToken;
module.exports.sendNotificationToUsers = sendNotificationToUsers;