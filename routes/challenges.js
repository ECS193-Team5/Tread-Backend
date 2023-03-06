const router = require("express").Router();
var ObjectId = require('mongoose').Types.ObjectId;
const Challenge = require("../models/challenge.model");
const Challenge_progress = require("../models/challenge_progress.model");
const League = require("../models/league.model");
const {isExistingUser} = require("./user.js");


function addInfoSharedAcrossRequests(req, res, next) {
    const issueDate = req.body.issueDate;
    const dueDate = req.body.dueDate
    res.locals.challenge.issueDate = issueDate;
    res.locals.challenge.dueDate = dueDate;
    // To access theses fields in query: " 'exercise.unit': 5 "
    exercise = {
        unit : req.body.unit,
        amount : req.body.amount,
        exerciseName : req.body.exerciseName
    }

    res.locals.challenge.exercise = exercise;

    // set everything but challengeID
    res.locals.challengeProgress = {
        issueDate: issueDate,
        dueDate: dueDate,
        exercise: exercise,
    }
    next();
}

async function addChallenge(req, res, next) {
    const newChallenge = new Challenge(res.locals.challenge);
    let newChallengeDocument;
    try {
        newChallengeDocument = await newChallenge.save();
    } catch (err) {
        return res.status(500).json("Error: " + err);
    }

    res.locals.challengeProgress.challengeID = newChallengeDocument._id;

    next();
}

function createChallengeProgressDocumentQuery(username, documentTemplate) {
    documentTemplate.username = username;
    return  {
        insertOne: {
          document: {...documentTemplate, username: username}
        }
      }
}

async function addChallengeProgress(req, res, next) {
    const participants = res.locals.challenge.participants;
    const documentTemplate = res.locals.challengeProgress;

    let challengeProgress = []
    participants.forEach((member) =>
    challengeProgress.push(createChallengeProgressDocumentQuery(member, documentTemplate)));
    try {
        await Challenge_progress.bulkWrite(challengeProgress);
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
}, addInfoSharedAcrossRequests, addChallenge, addChallengeProgress);

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
}, addInfoSharedAcrossRequests, addChallenge, addChallengeProgress);

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
}, addInfoSharedAcrossRequests, addChallenge, addChallengeProgress);

router.route('/delete_challenge').post(async (req, res) => {
    const username = req.session.username;
    const challengeID = req.body.challengeID;

    deleteReport = await Challenge.deleteOne({
        challengeID: challengeID,
        sentUser: username,
        status: 'pending'
        }).lean();


    return res.status(200);
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
        sentUser: {$ne: username},
        dueDate: {
            $gte: Date.now()
        },
        }).lean();

    return res.status(200).send(challenges);
});


async function updatePendingChallengeStatusByID(challengeID, username, newStatus) {
    return Challenge.updateOne({
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

    const updateReport = await updatePendingChallengeStatusByID(
        challengeID, username, 'accepted')

    if (updateReport.matchedCount == 0) {
        return res.sendStatus(404);
    }

    return res.sendStatus(200);
});

router.route('/decline_friend_challenge').post(async (req, res) => {
    const username = req.session.username;
    const challengeID = req.body.challengeID;

    const updateReport = await updatePendingChallengeStatusByID(
        challengeID, username, 'declined')

    if (updateReport.matchedCount == 0) {
        return res.sendStatus(404);
    }

    return res.sendStatus(200);
});

module.exports = router;