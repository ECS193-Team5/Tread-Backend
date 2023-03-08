const router = require("express").Router();
const League = require("../models/league.model");
const Challenge = require("../models/challenge.model");
const Challenge_progress = require("../models/challenge_progress.model");
const User = require("../models/user.model");
var ObjectId = require('mongoose').Types.ObjectId;
const { isExistingUser } = require("./user.js");

async function createLeague(leagueInfo) {
    const newUser = new League(leagueInfo);
    return newUser.save()
}

router.route("/create_league").post(async (req, res) => {
    leagueInfo = {
        owner: req.session.username,
        leagueName: req.body.leagueName,
        leagueType: req.body.leagueType,
        leagueDescription: req.body.leagueDescription,
        leaguePicture: req.body.leaguePicture
    }

    try {
        await createLeague(leagueInfo)
    } catch (err){
        console.log(err)
        return res.status(500).json("Server error or name invalid");
    }

    return res.sendStatus(200);
});

async function updateLeague(req, res, next) {
    try {
        const updateReport = await League.updateOne(res.locals.filter, res.locals.updates).lean();
        if (updateReport.matchedCount == 0) {
            return res.sendStatus(404);
        }
    } catch (err) {
        // Try to catch with middleware later
        return res.sendStatus(500);
    }
    return res.sendStatus(200);
}

function checkLeagueID(req, res, next) {
    if (!req.body.leagueID){
        return res.sendStatus(400);
    }
    next();
}

router.route("/add_admin").post(
    checkLeagueID,
    async (req, res, next) => {
    const recipient = req.body.recipient;

    res.locals.filter = {
        _id : ObjectId(req.body.leagueID),
        admin : req.session.username,
        members : recipient,
    }
    res.locals.updates = {
        $addToSet: { admin : recipient},
    }
    next();
}, updateLeague);

router.route("/remove_admin").post(
    checkLeagueID,
    async (req, res, next) => {
    const recipient = req.body.recipient;

    res.locals.filter = {
        _id : ObjectId(req.body.leagueID),
        admin : req.session.username,
        owner : {$ne: recipient}
    }

    res.locals.updates = {
        $pull: { admin : recipient},
    }
    next();
}, updateLeague);


async function verifyRecipientUserExists(req, res, next) {
    if (await isExistingUser(req.body.recipient)) {
      next();
    } else {
        return res.status(400).json("Recipent does not exist");
    }
}

router.post("/kick_member", checkLeagueID,
    async (req, res, next) => {
    const recipient = req.body.recipient;

    res.locals.filter = {
        _id : ObjectId(req.body.leagueID),
        admin : req.session.username,
        members: recipient,
        owner : {$ne: recipient}
    }

    res.locals.updates = {
        $pull: { members : recipient, admin: recipient},
    }
    next();
}, updateLeague);


router.post("/leave_league", checkLeagueID,
    async (req, res, next) => {
    const username = req.session.username;

    res.locals.filter = {
        _id : ObjectId(req.body.leagueID),
        members: username,
        owner: {$ne: username}
    }

    res.locals.updates = {
        $pull: { members : username, admin : username},
    }
    next();
}, updateLeague);

router.route("/invite_to_join").post(
    checkLeagueID, verifyRecipientUserExists,
    async (req, res, next) => {
        const username = req.session.username;
        const recipient = req.body.recipient;
        const leagueID = req.body.leagueID;


        const updateLog = await League.updateOne(
            {
                _id : ObjectId(leagueID),
                admin: username,
                pendingRequests: recipient
            },
            {
                $addToSet: { members : recipient},
                $pull: { pendingRequests : recipient},
            }
        )

        if (updateLog.matchedCount == 1) {
            return res.sendStatus(200);
        }

        res.locals.filter = {
            _id : ObjectId(leagueID),
            admin: username,
            members: {$ne: recipient}
        },
        res.locals.updates ={
            $addToSet: { sentRequests : recipient},
        }

        next();
}, updateLeague);

router.route("/user_request_to_join").post(
    checkLeagueID,
    async (req, res, next) => {
        const username = req.session.username;


        const updateLog = await League.updateOne(
            {
                _id : ObjectId(leagueID),
                sentRequests: username
            },
            {
                $addToSet: { members : username},
                $pull: { sentRequests : username},
            }
        )

        if (updateLog.matchedCount == 1) {
            return res.sendStatus(200);
        }

        res.locals.filter = {
            _id : ObjectId(leagueID),
            members: {$ne: username}
        },
        res.locals.updates ={
            $addToSet: { pendingRequests : username},
        }
        next();
}, updateLeague);

router.route("/user_accept_invite").post(
    checkLeagueID,
    async (req, res, next) => {
    const recipient = req.body.recipient;

    res.locals.filter = {
        _id : ObjectId(req.body.leagueID),
        sentRequests: recipient
    }

    res.locals.updates = {
        $addToSet: { members : recipient},
        $pull: { sentRequests : recipient},
    }
    next();
}, updateLeague);


router.route("/user_decline_invite").post(
    checkLeagueID,
    async (req, res, next) => {
    const username = req.session.username

    res.locals.filter = {
        _id : ObjectId(req.body.leagueID),
        sentRequests: username
    }

    res.locals.updates = {
        $pull: { sentRequests : username},
    }
    next();
}, updateLeague);



router.route("/accept_join_request").post(
    checkLeagueID,
    async (req, res, next) => {
    const recipient = req.body.recipient;

    res.locals.filter = {
        _id : ObjectId(req.body.leagueID),
        admin : req.session.username,
        pendingRequests: recipient
    }

    res.locals.updates = {
        $addToSet: { members : recipient},
        $pull: { pendingRequests : recipient},
    }
    next();
}, updateLeague);


router.route("/decline_request").post(
    checkLeagueID,
    async (req, res, next) => {
    const recipient = req.body.recipient;

    res.locals.filter = {
        _id : ObjectId(req.body.leagueID),
        admin : req.session.username,
        pendingRequests: recipient
    }

    res.locals.updates = {
        $pull: { pendingRequests : recipient},
    }
    next();
}, updateLeague);


router.route("/undo_invite").post(
    checkLeagueID,
    async (req, res, next) => {
    const recipient = req.body.recipient;

    res.locals.filter = {
        _id : ObjectId(req.body.leagueID),
        admin : req.session.username,
        sentRequests: recipient
    }

    res.locals.updates = {
        $pull: { sentRequests : recipient},
    }
    next();
}, updateLeague);


router.route("/ban_user").post(
    checkLeagueID, verifyRecipientUserExists,
    async (req, res, next) => {
    const recipient = req.body.recipient;

    res.locals.filter = {
        _id : ObjectId(req.body.leagueID),
        admin : req.session.username,
        owner : {$ne: recipient}
    }

    res.locals.updates = {
        $addToSet: { bannedUsers : recipient},
        $pull: {
            admin: recipient,
            pendingRequests : recipient,
            members : recipient
        },
    }
    next();
}, updateLeague);


router.route("/unban_user").post(
    checkLeagueID, verifyRecipientUserExists,
    async (req, res, next) => {
    const recipient = req.body.recipient;

    res.locals.filter = {
        _id : ObjectId(req.body.leagueID),
        admin : req.session.username,
    }

    res.locals.updates = {
        $pull: {
            bannedUsers: recipient
        },
    }
    next();
}, updateLeague);

async function findLeaguesWhere(filter) {
    return League.find(filter).lean();
}

async function getChallengeCount(filter) {
    return Challenge.countDocuments(filter);
}

async function getAllLeaguesWithChallengeCount(req, res, next) {
    const filter = res.locals.filter;

    // Not sure if order is guaranteed
    const leaguesInfo = await League.find(filter, "_id leagueName leaguePicture members").lean();

    let challengeCount = [];
    leaguesInfo.forEach((league) => {
        challengeCount.push(
            getChallengeCount({
                receivedUser: league._id,
                issuedDate: {
                    $lte: Date.now(),
                },
                dueDate: {
                    $gte: Date.now(),
                }
            })
        )
    })

    challengeCount = await Promise.all(challengeCount);
    const zippedCountAndInfo = leaguesInfo.map((league, index) => ({...league, activeChallenges: challengeCount[index]}));

    return res.status(200).json(zippedCountAndInfo);
}

router.route("/get_leagues").post(
    async (req, res, next) => {
        res.locals.filter = {members: req.session.username}
        next()
}, getAllLeaguesWithChallengeCount);

router.route("/get_admin_leagues_with_challenge_count").post(
    async (req, res, next) => {
        res.locals.filter = {admin: req.session.username}
        next()
}, getAllLeaguesWithChallengeCount);

router.route("/get_requested_leagues").post(
    async (req, res, next) => {
        res.locals.filter = {pendingRequests: req.session.username}
        next()
}, getAllLeaguesWithChallengeCount);

router.route("/get_invited_leagues").post(
    async (req, res, next) => {
        res.locals.filter = {sentRequests: req.session.username}
        next()
}, getAllLeaguesWithChallengeCount);

router.route("/get_owned_leagues").post(
    async (req, res, next) => {
        res.locals.filter = {owner: req.session.username}
        next()
}, getAllLeaguesWithChallengeCount);

router.route("/get_admin_leagues").post(
    async (req, res, next) => {
        const leagues = await findLeaguesWhere(
            {admin: req.session.username},
            '_id leagueName'
        );

        return res.status(200).json(leagues);
});

async function getPropertyOfLeague(leagueID, property) {
    return League.findOne({_id: leagueID }, property).lean();
}

router.route("/get_league_name").post(
    async (req, res, next) => {
        const leagueID = req.body.leagueID;
        const leagueName = await getPropertyOfLeague(leagueID, "leagueName");

        return res.status(200).json(leagueName);
});

router.route("/get_league_description").post(
    async (req, res, next) => {
        const leagueID = req.body.leagueID;
        const leagueDescription = await getPropertyOfLeague(leagueID, "leagueDescription");

        return res.status(200).json(leagueDescription);
});

router.route("/get_league_picture").post(
    async (req, res, next) => {
        const leagueID = req.body.leagueID;
        const leaguePicture = await getPropertyOfLeague(leagueID, "leaguePicture");

        return res.status(200).json(leaguePicture);
});

/// Test this
router.route("/delete_league").post(
    checkLeagueID,
    async (req, res, next) => {
        const leagueID = req.body.leagueID

        const deletedInfo = await League.deleteOne({
            _id : ObjectId(leagueID),
            owner: req.session.username,
        });

        if (deletedInfo.deletedCount == 1) {
            const activeChallenges = await Challenge.find({
                receivedUser : leagueID,
                dueDate : {$gte: Date.now()}
            }).distinct("_id");
            await Promise.all([
                Challenge.deleteMany({
                    receivedUser : leagueID,
                    dueDate : {$gte: Date.now()}
                }).lean(),
                Challenge_progress.deleteMany({
                    challengeID: {$in: activeChallenges}
                }).lean()
            ]);
        } else {
            return res.sendStatus(400);
        }
        return res.sendStatus(200);

});

async function getLeagueActiveChallengeCount(req, res, next) {
    const username = req.session.username;
    const leagueID = req.body.leagueID;

    const challengeCount = await getChallengeCount({
        receivedUser: leagueID,
        participants: username
    });
    return res.status(200).json(challengeCount)
}

router.route('/get_league_active_challenges').post(getLeagueActiveChallengeCount);

// League object must have members, admin, and owner.
function getRole(username, league) {
    if (league.owner === username) {
        return "owner";
    }
    if (league["admin"].includes(username)) {
        return "admin";
    }
    if (league["members"].includes(username)) {
        return "participant";
    }
}


async function getMyRole(req, res, next) {
    const username = req.session.username;
    const leagueID = req.body.leagueID;

    const leagueInfo = await League.findOne({
        _id: leagueID,
        members: username
    }).lean();

    if (leagueInfo === null) {
        return res.sendStatus(404);
    }
    return res.status(200).json(getRole(username, leagueInfo))
}

router.route('/get_role').post(getMyRole);



/// This below should be able to be refactored into 2 functions
async function getMemberList(req, res, next) {
    const username = req.session.username;
    const leagueID = req.body.leagueID;

    const league = await League.findOne({
        _id: leagueID,
        members: username
    }, {members: 1, _id: 0, admin: 1, owner: 1}).lean();


    if (league === null) {
        return res.sendStatus(404);
    }

    const leagueMembers = league.members;
    const memberInfo = await User.find({
        username: {$in: leagueMembers}
    }, {picture: 1, displayName: 1, username: 1, _id: 0}).lean();


    const membersWithRole = memberInfo.map((member) =>({
        ...member, role: getRole(member.username, league)
    }));

    return res.status(200).json(membersWithRole)
}

router.route('/get_member_list').post(getMemberList);


router.route('/get_banned_list').post(async (req, res, next) => {
    const username = req.session.username;
    const leagueID = req.body.leagueID;
    const league = await League.findOne({
        _id: leagueID,
        members: username
    }, {bannedUsers: 1, _id: 0}).lean();


    if (league === null) {
        return res.sendStatus(404);
    }

    const leagueBanned = league.bannedUsers;
    const bannedInfo = await User.find({
        username: {$in: leagueBanned}
    }, {picture: 1, displayName: 1, username: 1, _id: 0}).lean();


    return res.status(200).json(bannedInfo);
});


router.route('/get_pending_request_list').post(async (req, res, next) => {
    const username = req.session.username;
    const leagueID = req.body.leagueID;
    const league = await League.findOne({
        _id: leagueID,
        admin: username
    }, {pendingRequests: 1, _id: 0}).lean();


    if (league === null) {
        return res.sendStatus(404);
    }

    const leaguePending = league.pendingRequests;
    const memberInfo = await User.find({
        username: {$in: leaguePending}
    }, {picture: 1, displayName: 1, username: 1, _id: 0}).lean();

    return res.status(200).json(memberInfo);
});

router.route('/get_sent_invite_list').post(async (req, res, next) => {
    const username = req.session.username;
    const leagueID = req.body.leagueID;
    const league = await League.findOne({
        _id: leagueID,
        admin: username
    }, {sentRequests: 1, _id: 0}).lean();


    if (league === null) {
        return res.sendStatus(404);
    }
    const leagueSent = league.sentRequests;
    const memberInfo = await User.find({
        username: {$in: leagueSent}
    }, {picture: 1, displayName: 1, username: 1, _id: 0}).lean();

    return res.status(200).json(memberInfo);
});


router.route('/get_recommended').post(async (req, res, next) => {

    const returnObj = [
        {"LeagueName": "Justice", "MutualFriends": 6},
        {"LeagueName": "Avengers", "MutualFriends": 7},
        {"LeagueName": "Free Swim", "MutualFriends": 4},
        {"LeagueName": "Weighlifting Bros", "MutualFriends": 8},
        {"LeagueName": "Lifting Weights and Friends", "MutualFriends": 1},
        {"LeagueName": "Pokemon", "MutualFriends": 2},
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