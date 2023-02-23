const router = require("express").Router();
let Friend_lists = require("../models/friend_list.model");


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
    return Friend_lists.findOne({username: username }, property);
}

router.route('/pending_requests').post(async (req, res) => {
    const username = req.body.username;

    const pendingRequests = await Friend_lists.findOne({username: username },
        'sentRequests receivedRequests');

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
    await Friend_lists.findOneAndUpdate(
        {username: username}, {$pull: {friends: friendName}
    });

    await Friend_lists.findOneAndUpdate(
        {username: friendName}, {$pull: {friends: username}
    });

}

router.route('/remove_friend').post(async (req, res) => {
    const username = req.session.username;
    const friendName = req.body.friendName;

    removeFriend(username, friendName);

    return res.sendStatus(200);
});

async function isExistingUser(username) {
    return (await Friend_lists.exists({username: username}).lean() !== null);
}

async function getUserFriendDocument(username) {
    return Friend_lists.findOne({username: username});
}

function isRequestSentAlready(userFriendDocument, friendName) {
    return userFriendDocument["sentRequests"].includes(friendName);
}

function isBlocking(userFriendDocument, friendName) {
    return userFriendDocument["blocked"].includes(friendName);
}

async function unblock(blocker, blocked) {
    await Friend_lists.findOneAndUpdate(
        {username : blocker}, {$pull: {blocked: blocked}});
    await Friend_lists.findOneAndUpdate(
        {username : blocked}, {$pull: {blockedBy: blocker}});
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
    await Friend_lists.findOneAndUpdate(
        {username : username, receivedRequests : friendName},
        {
            $addToSet: { friends : friendName},
            $pull: {receivedRequests : friendName}
        }
    );
    await Friend_lists.findOneAndUpdate(
        {username : friendName, sentRequests : username},
        {
            $addToSet: { friends : username},
            $pull: {sentRequests : username}
        }
    );
}

async function sendRequest(sender, receiver) {
    await Friend_lists.findOneAndUpdate(
        {username : sender},
        {$addToSet: {sentRequests : receiver}}
    );
    await Friend_lists.findOneAndUpdate(
        {username : receiver},
        {$addToSet: { receivedRequests : sender}}
    );
}

router.route('/send_friend_request').post(async (req, res) => {
    const username = req.session.username
    const friendName = req.body.friendName

    if (!isExistingUser(friendName)) {
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

    acceptFriendRequest(username, friendName);

    return res.sendStatus(200);
});


async function removeRequest(sender, receiver) {
    await Friend_lists.findOneAndUpdate(
        {username : receiver}, {$pull: {receivedRequests : sender}}
    );

    await Friend_lists.findOneAndUpdate(
        {username : sender}, {$pull: {sentRequests : receiver}}
    );
}



router.route('/remove_sent_request').post(async (req, res) => {
    const username= req.session.username;
    const receiver = req.body.receiver;

    removeRequest(username, receiver);

    return res.sendStatus(200);
});

router.route('/remove_received_request').post(async (req, res) => {
    const username= req.session.username;
    const sender = req.body.sender;

    removeRequest(sender, username);

    return res.sendStatus(200);
});

router.route('/unblock_user').post(async (req, res) => {
    const username= req.session.username;
    const target = req.body.target;

    unblock(username, target);

    return res.sendStatus(200);
});

async function blockUser(username, target) {
    await Friend_lists.findOneAndUpdate(
        {username : username},
        {$pull:
            {receivedRequests : target,
                sentRequests : target,
            friends : target},
            $addToSet: {blocked: target}}
    );
    await Friend_lists.findOneAndUpdate(
        {username : target},
        {$pull:
            {sentRequests : username,
            receivedRequests : username,
        friends: username},
        $addToSet: {blockedBy: username}}
    );
}

router.route('/block_user').post(async (req, res) => {
    const username = req.session.username;
    const target = req.body.target;

    if (!isExistingUser(target)) {
        return res.sendStatus(404);
    }

    blockUser(username, target);



    return res.sendStatus(200);
});







module.exports = router;
module.exports = router;