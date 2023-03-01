const router = require("express").Router();
const League = require("../models/league.model");
const Challenge = require("../models/challenge.model");
var ObjectId = require('mongoose').Types.ObjectId;
const {isExistingUser} = require("./user.js");

async function createLeague(leagueInfo) {
    const newUser = new League(leagueInfo);
    return newUser.save()
}

router.route("/create_league").post(async (req, res) => {
    leagueInfo = {
        owner: req.session.username,
        leagueName: req.body.leagueName,
        leagueType: req.body.leagueType,
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
        if (await League.findOneAndUpdate(res.locals.filter, res.locals.updates).lean() === null) {
            return res.sendStatus(404);
        }
    } catch (err) {
        // Try to catch with middleware later
        return res.sendStatus(500);
    }
    return res.sendStatus(200);
}

async function checkLeagueID(req, res, next) {
    if (!req.body.leagueID){
        return res.sendStatus(400);
    }
    next()
}

router.route("/add_admin").post(
    checkLeagueID,
    async (req, res, next) => {
    const recipient = req.body.recipient;

    res.locals.filter = {
        _id : ObjectId(req.body.leagueID),
        admin : req.session.username,
        member : recipient,
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
        admin : recipient,
        owner : {$ne: recipient}
    }

    res.locals.updates = {
        $pull: { admin : recipient},
    }
    next();
}, updateLeague);

router.post("/add_member", checkLeagueID,
    async (req, res, next) => {
    if(await isExistingUser(req.body.recipient)) {
        next()
    }
    return res.sendStatus(404);
}, async (req, res) => {
    const recipient = req.body.recipient;

    res.locals.filter = {
        _id : ObjectId(req.body.leagueID),
        admin : req.session.username,
    }

    res.locals.updates = {
        $addToSet: { member : recipient},
    }
    next();
}, updateLeague);

router.post("/kick_member", checkLeagueID,
    async (req, res) => {
    const recipient = req.body.recipient;

    res.locals.filter = {
        _id : ObjectId(req.body.leagueID),
        admin : req.session.username,
        owner : {$ne: recipient}
    }

    res.locals.updates = {
        $pull: { member : recipient},
    }
    next();
}, updateLeague);

router.route("/accept_request").post(
    checkLeagueID,
    async (req, res, next) => {
    const recipient = req.body.recipient;

    res.locals.filter = {
        _id : ObjectId(req.body.leagueID),
        admin : req.session.username,
    }

    res.locals.updates = {
        $addToSet: { member : recipient},
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
    }

    res.locals.updates = {
        $pull: { pendingRequests : recipient},
    }
    next();
}, updateLeague);


router.route("/ban_user").post(
    async (req, res, next) => {
        if(await isExistingUser(req.body.recipient)) {
            next()
        }
        return res.sendStatus(404);
},
    checkLeagueID,
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
            pendingRequests : recipient,
            member : recipient
        },
    }
    next();
}, updateLeague);

router.route("/get_leagues").post(
    async (req, res, next) => {
        const leagues = await League.find({members: req.session.username});

        return res.status(200).json(leagues);
});

router.route("/get_admin_leagues").post(
    async (req, res, next) => {
        const leagues = await League.find({admin: req.session.username});

        return res.status(200).json(leagues);
});

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
                sentUser : leagueID,
            });
        } else {
            return res.sendStatus(400);
        }
        return res.sendStatus(200);

});





module.exports = router;