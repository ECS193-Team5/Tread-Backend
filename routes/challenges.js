const router = require("express").Router();
var ObjectId = require('mongoose').Types.ObjectId;
const Challenge = require("../models/challenge.model");

function setStatusFromChallengeType(challengeType) {
    const mapping = {
        "self" : "accepted",
        "friend" : "pending",
        "league" : "accepted",
    }
    return mapping[challengeType];
}

router.route('/add_challenge').post(async (req, res) => {
    const participants = req.body.participants;
    const progress = req.body.progress;
    const sentUser = req.session.username;
    const receivedUser = req.body.receivedUser;
    const challengeType = req.body.challengeType;
    // Issue date can be undefined
    const issueDate = req.body.issueDate;
    const dueDate = req.body.dueDate;
    const exerciseList = req.body.exerciseList;
    const status = setStatusFromChallengeType(req.body.challengeType)

    // add the sentUser to participants
    participants.push(sentUser);
    progress[sentUser] =  0

    challenge = {
        participants: participants,
        progress: progress,
        sentUser: sentUser,
        receivedUser: receivedUser,
        challengeType: challengeType,
        issueDate: issueDate,
        dueDate: dueDate,
        exerciseList: exerciseList,
        status: status,
    }

    // verify participant and progress users exist
    // verify sentUser and receivedUser exist.


    const newUser = new Challenge(challenge);
    try {
        challenge = await newUser.save()
        console.log(challenge)
    } catch (err) {
        return res.status(500).json("Error: " + err);
    }

    return res.status(200).send(challenge);
});

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


router.route('/accept_friend_challenge').post(async (req, res) => {
    const username = req.session.username;
    const challengeID = req.body.challengeID;

    challenge = await Challenge.findOneAndUpdate({
        _id : ObjectId(challengeID),
        receivedUser: username,
        status: 'pending'
        },
        {
        status: 'accepted'
        });

    if (challenge === null) {
        return res.sendStatus(404);
    }

    return res.sendStatus(200);
});

router.route('/decline_friend_challenge').post(async (req, res) => {
    const username = req.session.username;
    const challengeID = req.body.challengeID;

    challenge = await Challenge.findOneAndDelete({
        _id : ObjectId(challengeID),
        receivedUser: username,
        status: 'pending'
        });

    if (challenge === null) {
        return res.sendStatus(404);
    }

    return res.sendStatus(200);
});

module.exports = router;