const router = require("express").Router();
const Global_challenge_progress = require("../models/global_challenge_progress.model");
const Global_challenge = require("../models/global_challenge.model");
const User = require("../models/user.model");


router.route('/add_challenge').post(async (req, res) => {
    // To access theses fields in query: " 'exercise.unit': 5 "
    const exercise = {
        unit : req.body.unit,
        amount : req.body.amount,
        exerciseName : req.body.exerciseName
    }
    const globalChallenge = {
        issueDate: req.body.issueDate,
        dueDate: req.body.dueDate,
        exercise: exercise
    }
    const newGlobalChallenge = new Global_challenge(globalChallenge)
    try {
        await newGlobalChallenge.save();
    } catch (err) {
        return res.status(500).json("Error: " + err);
    }

    return res.sendStatus(200);
});


function getListOfIDsFromChallenges(challenges) {
    let challengeIDs = [];
    challenges.forEach((challenge) => {
        challengeIDs.push(challenge._id);
    })

    return challengeIDs;
}

// incomplete
async function getGlobalChallengesAndInsertIfDoesntExist(req, res, next) {
    const currentGlobalChallenges = await Global_challenge.find({
        issuedDate: {
            $lte: Date.now(),
        },
        dueDate: {
            $gte: Date.now(),
        }
    });

    const globalChallengeIDs = getListOfIDsFromChallenges(currentGlobalChallenges)

    const userGlobalChallengeProgress = await Global_challenge_progress.find({
        globalChallengeID: {$in : globalChallengeIDs},
        username: req.session.username,
    }).distinct("challengeID");

    let newlyInsertedChallenges = [];
    if (currentGlobalChallenges.length != userGlobalChallengeProgress.length) {
        const missingChallenges = currentGlobalChallenges.filter(
            (objectID1) => !userGlobalChallengeProgress.some((objectID2) => objectID1["_id"].equals(objectID2)));

        missingChallenges.forEach((missingChallenge) => {
            newGlobalChallenge = {
                challengeID: missingChallenge._id,
                username: req.session.username,
                exercise: missingChallenge.exercise,
                dueDate: missingChallenge.dueDate,
                issuedate: missingChallenge.issueDate
            }

            newlyInsertedChallenges.push(newGlobalChallenge);
        })
        await Global_challenge_progress.insertMany(newlyInsertedChallenges);
    }

    const allCurrentUserGlobalChallenge = await Global_challenge_progress.find({
        globalChallengeID: {$in : globalChallengeIDs},
        username: req.session.username,
    }).lean();


    return res.status(200).json(allCurrentUserGlobalChallenge)
}


router.route('/get_challenges').post(getGlobalChallengesAndInsertIfDoesntExist);


async function getLeaderboard(req, res, next) {
    const globalChallengeID = req.body.challengeID;
    const topFiveUsers = await Global_challenge_progress.find()
}






module.exports = router;