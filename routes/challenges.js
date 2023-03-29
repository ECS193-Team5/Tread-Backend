const router = require("express").Router();
var ObjectId = require('mongoose').Types.ObjectId;
const Challenge = require("../models/challenge.model");
const Challenge_progress = require("../models/challenge_progress.model");
const League = require("../models/league.model");
const User = require("../models/user.model");
const { getDeviceTokens, sendMessageToDevices } = require("./user_devices.js")
const {isExistingUser, getPropertyOfUser} = require("./user.js");
const firebase = require("firebase-admin");


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

    next();

}

async function notifyNewChallenge(req, res, next) {
    const participants = res.locals.challenge.participants;
    const sentUser = req.session.username;
    // remove self from notification list
    const index = participants.indexOf(sentUser);
    if (index > -1) { // only splice array when item is found
        participants.splice(index, 1); // 2nd parameter means remove one item only
    }

    deviceTokens = await getDeviceTokens(participants);
    if (deviceTokens.lenght > 0) {
        const message = {
            tokens: deviceTokens,
            notification:{
                title: "New challenge from " + sentUser,
                body: ""
            }
        }
        await sendMessageToDevices(message);
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
}, addInfoSharedAcrossRequests, addChallenge, addChallengeProgress, notifyNewChallenge);

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
}, addInfoSharedAcrossRequests, addChallenge, addChallengeProgress, notifyNewChallenge);

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
}, addInfoSharedAcrossRequests, addChallenge, addChallengeProgress, notifyNewChallenge);

router.route('/delete_friend_challenge').post(async (req, res) => {
    const username = req.session.username;
    const challengeID = req.body.challengeID;

    await Promise.all([
        Challenge.deleteOne({
            _id: challengeID,
            sentUser: username,
            status: 'pending'
        }).lean(),

        Challenge_progress.deleteMany({
            challengeID: challengeID
        }).lean()
    ]);


    return res.sendStatus(200);
});


async function getPicturesOfPeople(people) {
    return User.find({
        username: {$in: people}
    }, {_id: 0, picture: 1}).lean();
}

async function getProgressOfChallenge(challenge, username) {
    return Challenge_progress.findOne({
        challengeID: challenge._id,
        username: username
    }).lean();
}


async function getPicturesForListOfChallenges(challenges) {
    let profilePicturesForEachChallenge = [];
    challenges.forEach((challenge) => {
        profilePicturesForEachChallenge.push(getPicturesOfPeople(challenge.participants));
    });

    return  Promise.all(profilePicturesForEachChallenge);
}

async function getProgressForListOfChallenges(challenges, username) {
    let progressOfChallenges = [];
    challenges.forEach((challenge) => {
        progressOfChallenges.push(getProgressOfChallenge(challenge, username));
    });

    return Promise.all(progressOfChallenges);
}

async function getChallengesZippedWithPictures(challenges) {
    const pictures = await getPicturesForListOfChallenges(challenges);
    const zippedChallenges = challenges.map((challenge, index) => ({
        ...challenge,
        pictures: pictures[index],
    }));

    return zippedChallenges;
}

async function getCompleteChallengeToProgressInfo(challenges, username) {
    const [progress, pictures] = await Promise.all([
        getProgressForListOfChallenges(challenges, username),
        getPicturesForListOfChallenges(challenges)
    ]);

    const zippedCompleteChallengeInfo = challenges.map((challenge, index) => ({
        ...challenge,
        pictures: pictures[index],
        progress: progress[index]
    }));

    return zippedCompleteChallengeInfo;
}


router.route('/accepted_challenges').post(async (req, res) => {
    const username = req.session.username;

    const challenges = await Challenge.find({
        participants: username,
        status: 'accepted'
        }).lean();

    const completeInformation = await getCompleteChallengeToProgressInfo(challenges, username);
    return res.status(200).send(completeInformation);
});

router.route('/sent_challenges').post(async (req, res) => {
    const username = req.session.username;

    const challenges = await Challenge.find({
        sentUser: username,
        status: 'pending',
        dueDate: {
            $gte: Date.now()
        },
    }).lean();

    const completeInformation = await getChallengesZippedWithPictures(challenges);
    res.status(200).send(completeInformation);

    try {
        response = await firebase.messaging().send(notificationData.message);
        notificationData.sent = true;
      } catch (error) {
        notificationData.error = error.message;
    }
});

router.route('/league_challenges').post(async (req, res) => {
    const username = req.session.username;
    const leagueID = req.body.leagueID;

    const challenges = await Challenge.find({
        receivedUser: leagueID,
        participants: username,
        challengeType: "league",
        status: 'accepted',
        dueDate: {
            $gte: Date.now()
        },
    }).lean();

    const completeInformation = await getCompleteChallengeToProgressInfo(challenges, username);
    return res.status(200).send(completeInformation);
});

router.route('/received_challenges').post(async (req, res) => {
    const username = req.session.username;

    const challenges = await Challenge.find({
        participants: username,
        status: 'pending',
        sentUser: {$ne: username},
        dueDate: {
            $gte: Date.now()
        },
    }).lean();

    const completeInformation = await getChallengesZippedWithPictures(challenges);
    return res.status(200).send(completeInformation);
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

async function getPicturesForListOfProgress(participantProgress){
    // Might have a better way to query this
    let profilePicturesForEachProgress = [];
    participantProgress.forEach((progressObj) => {
        profilePicturesForEachProgress.push(
            getPropertyOfUser(progressObj.username, {displayName: 1, picture: 1}));
    });

    return Promise.all(profilePicturesForEachProgress);

}

async function getProgressWithPicturesAndDisplayName(participantProgress) {
    const profileInfoForParticipant = await getPicturesForListOfProgress(participantProgress);
    const zippedProgress = participantProgress.map((progress, index) => ({
        ...progress,
        pictures: profileInfoForParticipant[index].picture,
        displayName: profileInfoForParticipant[index].displayName,
    }));

    return zippedProgress
}

router.route('/get_challenge_leaderboard').post(async (req, res) => {
    // need to verify user is in challenge for leaderboard
    const username = req.session.username;
    const challengeID = req.body.challengeID;

    const participantProgress = await Challenge_progress.find({
        challengeID: challengeID,
    }, {username: 1, progress: 1}).sort({progress: -1}).lean();

    const completeInformation = await getProgressWithPicturesAndDisplayName(participantProgress);
    return res.status(200).send(completeInformation);
});

module.exports = router;
module.exports.getProgressWithPicturesAndDisplayName = getProgressWithPicturesAndDisplayName;