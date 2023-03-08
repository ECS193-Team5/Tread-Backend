const router = require("express").Router();
let User = require("../models/user.model");
const User_inbox = require("../models/user_inbox.model");
const Friend_connection = require("../models/friend_connection.model");
const {isExistingUser} = require("./user.js");
/*
router.route("/").get((req, res) => {
    User_inbox.find()
      .then(function (data) {
        res.send({ data });
      })
      .catch(function (err) {
        res.status(400).json("Error from the router" + err);
      });

});
*/

async function getPropertyOfFriendList(username, property) {
    return User_inbox.findOne({username: username }, property).lean();
}

router.route('/pending_requests').post(async (req, res) => {
    const username = req.session.username;

    const pendingRequests = await User_inbox.findOne({username: username },
        'sentRequests receivedRequests').lean();

    return res.json(pendingRequests);
});

async function getfriendList(username) {
    return Friend_connection.find({username: username}).distinct('friendName');
}


router.route('/friend_list').post(async (req, res) => {
    const username = req.session.username;

    const friendList = await getfriendList(username);

    return res.json(friendList);
});

async function getUsernameDisplayNamePicture(usernameArray){
    return User.find({username: {$in: usernameArray}}, 'username displayName picture');
}

router.route('/get_all_friends_info').post(async (req, res) => {
    const username = req.session.username;

    const friendList = await getfriendList(username);

    const friendInfo = await getUsernameDisplayNamePicture(friendList);

    return res.json(friendInfo);
});

async function getUsernameDislayNamePictureFromInboxNames(username, inboxField) {
    const usernameList = await getPropertyOfFriendList(username, inboxField);

    return await getUsernameDisplayNamePicture(usernameList[inboxField]);

}

router.route('/sent_request_list').post(async (req, res) => {
    const username = req.session.username;

    const requestInfoArray = await getUsernameDislayNamePictureFromInboxNames(username, 'sentRequests');

    return res.json(requestInfoArray);
});

router.route('/received_request_list').post(async (req, res) => {
    const username = req.session.username;

    const requestList = await getUsernameDislayNamePictureFromInboxNames(username, 'receivedRequests');

    return res.json(requestList);
});

router.route('/blocked_list').post(async (req, res) => {
    const username = req.session.username;

    const blockedList = await getUsernameDislayNamePictureFromInboxNames(username, 'blocked');

    return res.json(blockedList);
});

async function removeFriend(username, friendName) {
    await Friend_connection.bulkWrite([
        {
            deleteOne:{
                filter: {username: username}
            }
        },
        {
            deleteOne:{
                filter: {username: friendName}
            }
        }
    ]);

}

router.route('/remove_friend').post(
    verifyFriendExists,
    async (req, res) => {
    const username = req.session.username;
    const friendName = req.body.friendName;

    removeFriend(username, friendName);

    return res.sendStatus(200);
});

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
    ]);
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

router.route('/send_friend_request').post(
    verifyFriendNameNotUsername,
    verifyFriendExists,
    async (req, res) => {
    const username = req.session.username
    const friendName = req.body.friendName

    userFriendDocument = await getUserFriendDocument(username);

    if (isRequestSentAlready(userFriendDocument, friendName)) {
        return res.json("Already sent");
    }

    if (isBlocking(userFriendDocument, friendName)) {
        unblock(username, friendName);
    }

    if (isBlockedBy(userFriendDocument, friendName)) {
        return res.json("You are blocked");
    }

    if (await isFriend(username, friendName)) {
        return res.json("You are already a friend")
    }

    if (isRequestReceived(userFriendDocument, friendName)) {
        await acceptFriendRequest(username, friendName);
        return res.sendStatus(200);
    }

    sendRequest(username, friendName);

    return res.sendStatus(200);
});

router.route('/accept_received_request').post(
    verifyFriendExists,
    async (req, res) => {
    const username = req.session.username
    const friendName = req.body.friendName

    acceptFriendRequest(username, friendName);

    return res.sendStatus(200);
});


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
    ])
}

async function removeSentRequest(username, receiver) {
    removeRequest(username, receiver);
}

async function removeReceivedRequest(username, sender) {
    removeRequest(sender, username);
}

router.route('/remove_sent_request').post(
    verifyFriendExists,
    async (req, res) => {
    const username= req.session.username;
    const friendName = req.body.friendName;

    removeSentRequest(username, friendName);

    return res.sendStatus(200);
});

router.route('/remove_received_request').post(
    verifyFriendExists,
    async (req, res) => {
    const username= req.session.username;
    const friendName = req.body.friendName;

    removeReceivedRequest(username, friendName);

    return res.sendStatus(200);
});

router.route('/unblock_user').post(
    verifyFriendExists,
    async (req, res) => {
    const username= req.session.username;
    const friendName = req.body.friendName;

    unblock(username, friendName);

    return res.sendStatus(200);
});

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
        ]),

        await removeFriend(username, target)
    ]);
}

router.route('/block_user').post(
    verifyFriendNameNotUsername,
    verifyFriendExists,
    async (req, res) => {
    const username = req.session.username;
    const friendName = req.body.friendName;


    blockUser(username, friendName);



    return res.sendStatus(200);
});


router.route('/get_recommended').post(async (req, res, next) => {

    const returnObj = [
        {"DisplayName": "Shazam", "MutualFriends": 6, "MutualLeagues": 4},
        {"DisplayName": "Wonder Woman", "MutualFriends": 7, "MutualLeagues": 6},
        {"DisplayName": "Bruce Wayne", "MutualFriends": 4, "MutualLeagues": 4},
        {"DisplayName": "Alan Rickman", "MutualFriends": 8, "MutualLeagues": 2},
        {"DisplayName": "Sinead O'Connor", "MutualFriends": 1, "MutualLeagues": 1},
        {"DisplayName": "Pikachu", "MutualFriends": 2, "MutualLeagues": 0},
    ];
    return res.status(200).json(returnObj);
});


router.route('/get_recent_activity').post(async (req, res, next) => {

    const returnObj = [{"photo":"https://i.imgur.com/3Ia9gVG.png","displayName": "Jonah Jameson", "challengeType": "Personal", "challengeTitle": "Do 50 push ups", "time": "1h", "type": "progress"},
    {"photo":"https://i.imgur.com/3Ia9gVG.png","displayName": "Ash Ketchum", "challengeType": "League", "challengeTitle": "Swim 4 km", "time": "2d", "type":"progress"},
    {"photo":"https://i.imgur.com/3Ia9gVG.png","displayName": "Elle Woods", "challengeType": "Global", "challengeTitle": "Run 10 miles", "time": "3d", "type":"complete"}
    ];
    return res.status(200).json(returnObj);
});



module.exports = router;