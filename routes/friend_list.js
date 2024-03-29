const router = require("express").Router();
let User = require("../models/user.model");
const User_inbox = require("../models/user_inbox.model");
const Friend_connection = require("../models/friend_connection.model");
const Exercise_log = require("../models/exercise_log.model");
const {isExistingUser} = require("./user.js");
const {sendNotificationToUsers} = require("./notifications.js");
const {getSortedFieldFrequency} = require("./helpers.js");

async function getPropertyOfFriendList(username, property) {
    return User_inbox.findOne({username: username }, property).lean();
}

async function getPendingRequests (req, res) {
    const username = req.session.username;

    const pendingRequests = await User_inbox.findOne({username: username },
        'sentRequests receivedRequests').lean();

    return res.json(pendingRequests);
}

router.route('/pending_requests').post(getPendingRequests);

async function getFriendList(username) {
    return Friend_connection.find({username: username}).distinct('friendName');
}

async function getOnlyUsernamesFriendList(req, res) {
    const username = req.session.username;

    const friendList = await getFriendList(username);

    return res.json(friendList);
}

router.route('/friend_list').post(getOnlyUsernamesFriendList);

async function getUsernameDisplayName(usernameArray){
    return User.find({username: {$in: usernameArray}}, 'username displayName');
}

async function getAllFriendsInfo (req, res) {
    const username = req.session.username;

    const friendList = await getFriendList(username);

    const friendInfo = await getUsernameDisplayName(friendList);

    return res.json(friendInfo);
}

router.route('/get_all_friends_info').post(getAllFriendsInfo);

async function getUsernameDisplayNameFromInboxNames(username, inboxField) {
    const usernameList = await getPropertyOfFriendList(username, inboxField);

    return await getUsernameDisplayName(usernameList[inboxField]);
}

async function getSentRequestList(req, res) {
    const username = req.session.username;

    const requestInfoArray = await getUsernameDisplayNameFromInboxNames(username, 'sentRequests');

    return res.json(requestInfoArray);
}

router.route('/sent_request_list').post(getSentRequestList);

async function getReceivedRequestList(req, res)  {
    const username = req.session.username;

    const requestList = await getUsernameDisplayNameFromInboxNames(username, 'receivedRequests');

    return res.json(requestList);
}
router.route('/received_request_list').post(getReceivedRequestList);

async function getBlockedList(req, res) {
    const username = req.session.username;

    const blockedList = await getUsernameDisplayNameFromInboxNames(username, 'blocked');

    return res.json(blockedList);
}

router.route('/blocked_list').post(getBlockedList);

async function removeFriend(username, friendName) {
    await Friend_connection.bulkWrite([
        {
            deleteOne:{
                filter: {
                    username: username,
                    friendName: friendName
                }
            }
        },
        {
            deleteOne:{
                filter: {
                    username: friendName,
                    friendName: username
                }
            }
        }
    ], {ordered: false});
}

async function setUpRemoveFriend (req, res) {
    const username = req.session.username;
    const friendName = req.body.friendName;

    removeFriend(username, friendName);

    return res.sendStatus(200);
}

router.route('/remove_friend').post(
    verifyFriendExists,
    setUpRemoveFriend
);

async function getUserFriendDocument(username) {
    return User_inbox.findOne({username: username}).lean();
}

function isRequestSentAlready(userFriendDocument, friendName) {
    return userFriendDocument["sentRequests"].includes(friendName);
}

function isBlocking(userFriendDocument, friendName) {
    return userFriendDocument["blocked"].includes(friendName);
}

async function unblock(blocker, blocked) {
    await Promise.all([
        User_inbox.updateOne(
        {username : blocker}, {$pull: {blocked: blocked}}).lean(),
        User_inbox.updateOne(
        {username : blocked}, {$pull: {blockedBy: blocker}}).lean()
    ]);
}

function isBlockedBy(userFriendDocument, friendName) {
    return userFriendDocument["blockedBy"].includes(friendName);
}

async function isFriend(username, friendName) {
    return (await Friend_connection.exists({username: username, friendName: friendName}).lean() !== null)
}

function isRequestReceived(userFriendDocument, friendName) {
    return userFriendDocument["receivedRequests"].includes(friendName);
}

async function createFriendConnection(username, friendName) {
    await Friend_connection.bulkWrite([
        {
            insertOne:{
                document: {
                    username: username,
                    friendName: friendName
                }
            }
        },
        {
            insertOne:{
                document: {
                    username: friendName,
                    friendName: username
                }
            }
        },
    ], {ordered: false});
}

async function acceptFriendRequest(username, friendName) {
    Promise.all([
        removeReceivedRequest(username, friendName),
        createFriendConnection(username, friendName)
    ]);
}

async function sendRequest(sender, receiver) {
    await Promise.all([
        User_inbox.updateOne(
            {username : sender},
            {$addToSet: {sentRequests : receiver}}
        ).lean(),
        User_inbox.updateOne(
            {username : receiver},
            {$addToSet: { receivedRequests : sender}}
        ).lean()
    ]);
}

function verifyFriendNameNotUsername(req, res, next) {
    if (req.session.username === req.body.friendName) {
        return res.sendStatus(404);
    }

    next()
}

async function verifyFriendExists(req, res, next) {
    if (! (await isExistingUser(req.body.friendName))) {
        return res.sendStatus(404);
    }
    next()
}

async function notifyFriend(username, friendName, actionMessage) {
    sendNotificationToUsers([friendName], username + actionMessage , "socialFriendPage");
}


async function sendFriendRequest (req, res) {
    const username = req.session.username
    const friendName = req.body.friendName

    const userFriendDocument = await getUserFriendDocument(username);

    if (isRequestSentAlready(userFriendDocument, friendName)) {
        return res.json("You have already sent "
            + friendName + " a friend request.");
    }

    if (isBlocking(userFriendDocument, friendName)) {
        unblock(username, friendName);
    }

    if (isBlockedBy(userFriendDocument, friendName)) {
        return res.json("You are blocked by " + friendName + ".");
    }

    if (await isFriend(username, friendName)) {
        return res.json("You were already friends with " + friendName + ".")
    }

    if (isRequestReceived(userFriendDocument, friendName)) {
        await acceptFriendRequest(username, friendName);
        return res.status(200).json("You were automatically added as a friend because "
            + friendName + " had already sent you a friend request.");
    }

    sendRequest(username, friendName);

    await notifyFriend(username, friendName, " sent you a friend request.")

    return res.status(200).json("Successfully sent "
        + friendName + " a friend request.");
}

router.route('/send_friend_request').post(
    verifyFriendNameNotUsername,
    verifyFriendExists,
    sendFriendRequest);

async function acceptReceivedRequest(req, res) {
    const username = req.session.username
    const friendName = req.body.friendName

    acceptFriendRequest(username, friendName);
    await notifyFriend(username, friendName, " accepted your friend request.")

    return res.sendStatus(200);
}

router.route('/accept_received_request').post(
    verifyFriendExists,
    acceptReceivedRequest);


async function removeRequest(sender, receiver) {
    User_inbox.bulkWrite([
        {
            updateOne:{
                filter: {username : receiver, receivedRequests : sender},
                update: {
                    $pull: {receivedRequests : sender}
                }
            }
        },
        {
            updateOne:{
                filter: {username : sender, sentRequests : receiver},
                update: {
                    $pull: {sentRequests : receiver}
                }
            }
        },
    ], {ordered: false})
}

async function removeSentRequest(username, receiver) {
    removeRequest(username, receiver);
}

async function removeReceivedRequest(username, sender) {
    removeRequest(sender, username);
}

async function callRemoveSentRequest(req, res) {
    const username= req.session.username;
    const friendName = req.body.friendName;

    removeSentRequest(username, friendName);

    return res.sendStatus(200);
}

router.route('/remove_sent_request').post(
    verifyFriendExists,
    callRemoveSentRequest);

async function callRemoveReceivedRequest(req, res)  {
    const username= req.session.username;
    const friendName = req.body.friendName;

    removeReceivedRequest(username, friendName);

    return res.sendStatus(200);
}

router.route('/remove_received_request').post(
    verifyFriendExists,
    callRemoveReceivedRequest);

async function callUnblockUser(req, res) {
    const username = req.session.username;
    const friendName = req.body.friendName;

    unblock(username, friendName);

    return res.sendStatus(200);
}

router.route('/unblock_user').post(
    verifyFriendExists,
    callUnblockUser);

async function blockUser(username, target) {
    Promise.all([
        User_inbox.bulkWrite([
            {
                updateOne:{
                    filter: {username : username},
                    update: {
                        $pull:
                            {receivedRequests : target,
                                sentRequests : target},
                            $addToSet: {blocked: target}
                    }
                }
            },
            {
                updateOne:{
                    filter: {username : target},
                    update: {
                        $pull:
                            {sentRequests : username,
                            receivedRequests : username},
                            $addToSet: {blockedBy: username}
                    }
                }
            },
        ], {ordered: false}),

        removeFriend(username, target)
    ]);
}

async function setUpBlockUser(req, res) {
    const username = req.session.username;
    const friendName = req.body.friendName;
    await blockUser(username, friendName);
    return res.sendStatus(200);
}

router.route('/block_user').post(
    verifyFriendNameNotUsername,
    verifyFriendExists,
    setUpBlockUser
);

async function getRecommended(req, res, next) {
    const username = req.session.username;
    const MUTUAL_FRIEND_QUERY_LIMIT = 6000;

    const friendList = await Friend_connection.find({
        username: username,
    }).distinct("friendName");

    const invalidFriends = [...friendList, username]
    const mutualFriends = await Friend_connection.find({
        username: {$in: friendList},
        friendName:{$nin: invalidFriends}
    }, {"_id": 0, "friendName": 1}).limit(MUTUAL_FRIEND_QUERY_LIMIT).lean()

    const mutualFriendsFrequency = await getSortedFieldFrequency("friendName", mutualFriends);

    return res.status(200).json(mutualFriendsFrequency.slice(0,5));
}

router.route('/get_recommended').post(getRecommended);

async function getRecentActivity (req, res, next) {

    const username = req.session.username;

    const friendList = await Friend_connection.find({
        username: username
    }).distinct("friendName");

    const recentFriendActivity = await Exercise_log.find({
        username: {$in: friendList}
    },{
        "_id": 0,
    }).sort({loggedDate: -1}).limit(5).lean();

    return res.status(200).json(recentFriendActivity);
}

router.route('/get_recent_activity').post(getRecentActivity);

module.exports = router;
module.exports.isFriend = isFriend;