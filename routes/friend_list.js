const router = require("express").Router();
let Friend_lists = require("../models/friend_list.model");
const {isExistingUser} = require("./user.js");
/*
router.route("/").get((req, res) => {
    Friend_lists.find()
      .then(function (data) {
        res.send({ data });
      })
      .catch(function (err) {
        res.status(400).json("Error from the router" + err);
      });

});
*/

async function getPropertyOfFriendList(username, property) {
    return Friend_lists.findOne({username: username }, property).lean();
}

router.route('/pending_requests').post(async (req, res) => {
    const username = req.session.username;

    const pendingRequests = await Friend_lists.findOne({username: username },
        'sentRequests receivedRequests').lean();

    return res.json(pendingRequests);
});


router.route('/friend_list').post(async (req, res) => {
    const username = req.session.username;

    const friendList = await getPropertyOfFriendList(username, 'friends');

    return res.json(friendList);
});

router.route('/sent_request_list').post(async (req, res) => {
    const username = req.session.username;

    const sentRequestList = await getPropertyOfFriendList(username, 'sentRequests');

    return res.json(sentRequestList);
});

router.route('/received_request_list').post(async (req, res) => {
    const username = req.session.username;

    const requestList = await getPropertyOfFriendList(username, 'receivedRequests');

    return res.json(requestList);
});

router.route('/blocked_list').post(async (req, res) => {
    const username = req.session.username;

    const blockedList = await getPropertyOfFriendList(username, 'blocked');

    return res.json(blockedList);
});

async function removeFriend(username, friendName) {
    await Promise.all([
        Friend_lists.updateOne(
            {username: username}, {$pull: {friends: friendName}
        }),

        Friend_lists.updateOne(
            {username: friendName}, {$pull: {friends: username}
        })
    ]);

}

router.route('/remove_friend').post(async (req, res) => {
    const username = req.session.username;
    const friendName = req.body.friendName;

    if (!(await isExistingUser(friendName))) {
        return res.sendStatus(404);
    }

    removeFriend(username, friendName);

    return res.sendStatus(200);
});

async function getUserFriendDocument(username) {
    return Friend_lists.findOne({username: username}).lean();
}

function isRequestSentAlready(userFriendDocument, friendName) {
    return userFriendDocument["sentRequests"].includes(friendName);
}

function isBlocking(userFriendDocument, friendName) {
    return userFriendDocument["blocked"].includes(friendName);
}

async function unblock(blocker, blocked) {
    await Promise.all([
        Friend_lists.updateOne(
        {username : blocker}, {$pull: {blocked: blocked}}).lean(),
        Friend_lists.updateOne(
        {username : blocked}, {$pull: {blockedBy: blocker}}).lean()
    ]);
}


function isBlockedBy(userFriendDocument, friendName) {
    return userFriendDocument["blockedBy"].includes(friendName);
}

function isFriend(userFriendDocument, friendName) {
    return userFriendDocument["friends"].includes(friendName);
}

function isRequestReceived(userFriendDocument, friendName) {
    return userFriendDocument["receivedRequests"].includes(friendName);
}

async function acceptFriendRequest(username, friendName) {
    await Promise.all([
        Friend_lists.updateOne(
            {username : username, receivedRequests : friendName},
            {
                $addToSet: { friends : friendName},
                $pull: {receivedRequests : friendName}
            }
        ).lean(),
        Friend_lists.updateOne(
            {username : friendName, sentRequests : username},
            {
                $addToSet: { friends : username},
                $pull: {sentRequests : username}
            }
        ).lean()
    ]);
}

async function sendRequest(sender, receiver) {
    await Promise.all([
        Friend_lists.updateOne(
            {username : sender},
            {$addToSet: {sentRequests : receiver}}
        ).lean(),
        Friend_lists.updateOne(
            {username : receiver},
            {$addToSet: { receivedRequests : sender}}
        ).lean()
    ]);
}

router.route('/send_friend_request').post(async (req, res) => {
    const username = req.session.username
    const friendName = req.body.friendName
    if (! (await isExistingUser(friendName))) {
        return res.sendStatus(404);
    }

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

    if (isFriend(userFriendDocument, friendName)) {
        return res.json("You are already a friend")
    }

    if (isRequestReceived(userFriendDocument, friendName)) {
        acceptFriendRequest(username, friendName);
        return res.sendStatus(200);
    }

    sendRequest(username, friendName);

    return res.sendStatus(200);
});

router.route('/accept_received_request').post(async (req, res) => {
    const username = req.session.username
    const friendName = req.body.friendName

    if (!(await isExistingUser(friendName))) {
        return res.sendStatus(404);
    }

    acceptFriendRequest(username, friendName);

    return res.sendStatus(200);
});


async function removeRequest(sender, receiver) {
    await Friend_lists.updateOne(
        {username : receiver}, {$pull: {receivedRequests : sender}}
    );

    await Friend_lists.updateOne(
        {username : sender}, {$pull: {sentRequests : receiver}}
    );
}



router.route('/remove_sent_request').post(async (req, res) => {
    const username= req.session.username;
    const receiver = req.body.receiver;

    if (!(await isExistingUser(receiver))) {
        return res.sendStatus(404);
    }

    removeRequest(username, receiver);

    return res.sendStatus(200);
});

router.route('/remove_received_request').post(async (req, res) => {
    const username= req.session.username;
    const sender = req.body.sender;

    if (!(await isExistingUser(sender))) {
        return res.sendStatus(404);
    }

    removeRequest(sender, username);

    return res.sendStatus(200);
});

router.route('/unblock_user').post(async (req, res) => {
    const username= req.session.username;
    const target = req.body.target;

    if (!(await isExistingUser(target))) {
        return res.sendStatus(404);
    }

    unblock(username, target);

    return res.sendStatus(200);
});

async function blockUser(username, target) {
    await Promise.all([
        Friend_lists.updateOne(
            {username : username},
            {$pull:
                {receivedRequests : target,
                    sentRequests : target,
                friends : target},
                $addToSet: {blocked: target}}
        ).lean(),
        Friend_lists.updateOne(
            {username : target},
            {$pull:
                {sentRequests : username,
                receivedRequests : username,
            friends: username},
            $addToSet: {blockedBy: username}}
        ).lean()
    ]);
}

router.route('/block_user').post(async (req, res) => {
    const username = req.session.username;
    const target = req.body.target;

    if (!(await isExistingUser(target))) {
        return res.sendStatus(404);
    }

    blockUser(username, target);



    return res.sendStatus(200);
});



module.exports = router;