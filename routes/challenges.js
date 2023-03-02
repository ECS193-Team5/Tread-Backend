const router = require("express").Router();
var ObjectId = require('mongoose').Types.ObjectId;
const Challenge = require("../models/challenge.model");
const League = require("../models/league.model");
const {isExistingUser} = require("./user.js");


function addInforSharedAcrossRequests (req, res, next) {
    res.locals.challenge.issueDate = req.body.issueDate;
    res.locals.challenge.dueDate = req.body.dueDate;
    // To access theses fields in query: " 'exercise.unit': 5 "
    exercise = {
        unit : req.body.unit,
        amount : req.body.amount,
        exerciseName : req.body.exerciseName
    }
    res.locals.challenge.exercise = exercise;
    next();
}

async function addChallenge(req, res, next) {
    const newChallenge = new Challenge(res.locals.challenge);
    try {
        await newChallenge.save();
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
    const leagueID = req.body.receivedUser;
    // Issue date can be undefined
    const challengeType = "league"

    //get participants from league.
    const participantsDocument = await League.findOne({
        _id : ObjectId(leagueID),
        admin: sentUser,
    }, 'members');

    if (participantsDocument == null) {
        return res.status(400).json("Not your league");
    }

    res.locals.challenge = {
        participants: participantsDocument.members,
        sentUser: sentUser,
        receivedUser: leagueID,
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
        }).lean();
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