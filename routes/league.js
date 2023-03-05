const router = require("express").Router();
const League = require("../models/league.model");
const Challenge = require("../models/challenge.model");
var ObjectId = require('mongoose').Types.ObjectId;
const {isExistingUser, route} = require("./user.js");

async function createLeague(leagueInfo) {
    const newUser = new League(leagueInfo);
    return newUser.save()
}

router.route("/create_league").post(async (req, res) => {
    leagueInfo = {
        owner: req.session.username,
        leagueName: req.body.leagueName,
        leagueType: req.body.leagueType,
        leagueDescription: req.body.leagueDescription
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
        $pull: { members : recipient},
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
        $pull: { members : username},
        $pull: { admin : username},
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

async function findFromLeague(filter) {
    return League.find(filter).lean();
}

async function getActiveChallengeCount(filter) {
    return Challenge.countDocuments(filter);
}

async function getAllLeaguesWithChallengeCount(req, res, next) {
    const filter = res.locals.filter;


    // Not sure if order is guaranteed
    const [leaguesInfo, leaguesIDArray] = await Promise.all([
        League.find(
            filter, "_id leagueName members").lean(),
        League.find(filter).distinct('_id')
    ])

    let challengeCount = [];
    leaguesIDArray.forEach((ID) => {
        challengeCount.push(
            getActiveChallengeCount({receivedUser: ID})
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

router.route("/get_owned_leagues").post(
    async (req, res, next) => {
        res.locals.filter = {owner: req.session.username}
        next()
}, getAllLeaguesWithChallengeCount);

router.route("/get_admin_leagues").post(
    async (req, res, next) => {
        const leagues = await findFromLeague(
            {admin: req.session.username},
            '_id leagueName');

        return res.status(200).json(leagues);
});

router.route("/get_admin_league_info").post(
    async (req, res, next) => {
        const leagues = await findFromLeague({admin: req.session.username});

        return res.status(200).json(leagues);
});

router.route("/get_owned_leagues").post(
    async (req, res, next) => {
        const leagues = await findFromLeague({owner: req.session.username});

        return res.status(200).json(leagues);
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
            await Challenge.deleteMany({
                receivedUser : leagueID,
                dueDate : {$gte: Date.now()}
            });
        } else {
            return res.sendStatus(400);
        }
        return res.sendStatus(200);

});





module.exports = router;