const router = require("express").Router();
var ObjectId = require('mongoose').Types.ObjectId;
const Challenge = require("../models/challenge.model");
const {isExistingUser} = require("./user.js");


function addInforSharedAcrossRequests (req, res, next) {
    res.locals.challenge.issueDate = req.body.issueDate;
    res.locals.challenge.dueDate = req.body.dueDate;
    res.locals.challenge.unit = req.body.unit;
    res.locals.challenge.amount = req.body.amount;
    res.locals.challenge.exercise = req.body.exercise;
    next();
}

async function addChallenge(req, res, next) {
    const newUser = new Challenge(res.locals.challenge);
    try {
        challenge = await newUser.save()
    } catch (err) {
        return res.status(500).json("Error: " + err);
    }

    return res.sendStatus(200);
}

router.route('/add_friend_challenge').post(async (req, res, next) => {
    const sentUser = req.session.username;
    const receivedUser = req.body.receivedUser;
    const challengeType = "friend";
    // Issue date can be undefined
    if (!(await isExistingUser(req.body.receivedUser))) {
        return res.sendStatus(404);
    }

    res.locals.challenge = {
        participants: [sentUser, receivedUser],
        sentUser: sentUser,
        receivedUser: req.body.receivedUser,
        challengeType: challengeType,
    }
    next();
}, addInforSharedAcrossRequests, addChallenge);

router.route('/add_self_challenge').post(async (req, res, next) => {
    const sentUser = req.session.username;
    const challengeType = "self";
    // Issue date can be undefined

    res.locals.challenge = {
        participants: [sentUser],
        sentUser: sentUser,
        receivedUser: sentUser,
        challengeType: challengeType,

    }
    next();
}, addInforSharedAcrossRequests, addChallenge);

router.route('/add_league_challenge').post(async (req, res, next) => {
    const sentUser = req.session.username;
    const receivedUser = req.body.receivedUser;
    // Issue date can be undefined
    const challengeType = "league"

    if (!(await isExistingUser(req.body.receivedUser))) {
        return res.sendStatus(404);
    }

    //get participants from league.
    const participants = [];

    res.locals.challenge = {
        participants: participants,
        sentUser: sentUser,
        receivedUser: receivedUser,
        challengeType: challengeType,
    }
    next();
}, addInforSharedAcrossRequests, addChallenge);

router.route('/accepted_challenges').post(async (req, res) => {
    const username = req.session.username;

    challenges = await Challenge.find({
        participants: username,
        status: 'accepted'
        }).lean();

    return res.status(200).send(challenges);
});

router.route('/sent_challenges').post(async (req, res) => {
    const username = req.session.username;

    challenges = await Challenge.find({
        sentUser: username,
        status: 'pending',
        }).lean();

    return res.status(200).send(challenges);
});

router.route('/received_challenges').post(async (req, res) => {
    const username = req.session.username;

    challenges = await Challenge.find({
        participants: username,
        status: 'pending',
        sentUser: {$ne: username}
        }).lean();

    return res.status(200).send(challenges);
});


async function updatePendingChallengeStatusByID(challengeID, username, newStatus) {
    return Challenge.findOneAndUpdate({
        _id : ObjectId(challengeID),
        receivedUser: username,
        status: 'pending'
        },
        {
        status: newStatus
        });
}

router.route('/accept_friend_challenge').post(async (req, res) => {
    const username = req.session.username;
    const challengeID = req.body.challengeID;

    challenge = await updatePendingChallengeStatusByID(challengeID, username, 'accepted')

    if (challenge === null) {
        return res.sendStatus(404);
    }

    return res.sendStatus(200);
});

router.route('/decline_friend_challenge').post(async (req, res) => {
    const username = req.session.username;
    const challengeID = req.body.challengeID;

    challenge = await updatePendingChallengeStatusByID(challengeID, username, 'declined')

    if (challenge === null) {
        return res.sendStatus(404);
    }

    return res.sendStatus(200);
});

module.exports = router;