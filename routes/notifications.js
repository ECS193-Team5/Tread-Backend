const router = require("express").Router();
const User_devices = require("../models/user_devices.model");
const Notifications = require("../models/notifications.model");
const firebase = require("firebase-admin");


async function registerDeviceToken(username, deviceToken) {
    const twoMonthsInMiliSeconds = 1000*60*60*24*60;
    if (!deviceToken || !username) {
        return
    }
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
    return await User_devices.find({username: {$in: usernames}});
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

async function sendPushNotificationToUsers(usernames, messageBody, page) {
    const deviceTokens = await getDeviceTokens(usernames);

    if (!deviceTokens || deviceTokens.length === 0) {
        return;
    }
    const message = {
        tokens: deviceTokens,
        notification:{
            title: "Tread",
            body: messageBody
        },
        data: {
            page: page
        },
        webpush: {
            fcm_options: {
              link: "/" + page
            },
            notification:{
                title: "Tread",
                body: messageBody,
                icon: '../favicon.ico'
            }
        }
    }
    await sendMessageToDevices(message);
}
async function updateNotificationLog(usernames, message) {

    const notificationLogs = usernames.map(username => ({
        username: username,
        message: message
    }));
    await Notifications.insertMany(notificationLogs, {ordered: false});
}

async function sendNotificationToUsers(usernames, message, page) {
    try {
        await Promise.all([
            sendPushNotificationToUsers(usernames, message, page),
            updateNotificationLog(usernames, message)
        ]);
    } catch (err) {
        console.log(err);
    }
}

async function getNotifications(req, res) {
    const username = req.session.username;
    try {
        const notifications = await Notifications.find({
            username: username,
        }).sort({date: -1}).lean();
        return res.status(200).json(notifications);
    } catch(err) {
        console.log(err);
        return res.sendStatus(500);
    }
}

router.route('/get_notifications').post(getNotifications);

async function deleteNotification(req, res) {
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

async function deleteAllNotifications(req, res) {
    const username = req.session.username;
    try {
        await Notifications.deleteMany({
            username: username
        }).lean();
        return res.sendStatus(200);
    } catch (err) {
        return res.sendStatus(500);
    }
}

router.route('/delete_all_notifications').post(deleteAllNotifications);

module.exports = router;
module.exports.registerDeviceToken = registerDeviceToken;
module.exports.removeDeviceToken = removeDeviceToken;
module.exports.sendNotificationToUsers = sendNotificationToUsers;