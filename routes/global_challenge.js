const router = require("express").Router();
const Global_challenge_progress = require("../models/global_challenge_progress.model");
const Global_challenge = require("../models/global_challenge.model");

// protect this route
async function addChallenge(req, res) {
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
}

router.route('/add_challenge').post(addChallenge);

function getListOfIDsFromChallenges(challenges) {
    let challengeIDs = [];
    challenges.forEach((challenge) => {
        challengeIDs.push(challenge._id);
    })

    return challengeIDs;
}

async function getGlobalChallengesAndInsertIfDoesntExist(req, res, next) {
    const username = req.session.username;
    const currentGlobalChallenges = await Global_challenge.find({
        issueDate: {
            $lte: Date.now(),
        },
        dueDate: {
            $gte: Date.now(),
        }
    }).lean();

    const globalChallengeIDs = getListOfIDsFromChallenges(currentGlobalChallenges)

    const userGlobalChallengeProgress = await Global_challenge_progress.find({
        globalChallengeID: {$in : globalChallengeIDs},
        username: username,
    }).distinct("challengeID").lean();

    let newlyInsertedChallenges = [];
    if (currentGlobalChallenges.length != userGlobalChallengeProgress.length) {
        const missingChallenges = currentGlobalChallenges.filter(
            (objectID1) => !userGlobalChallengeProgress.some((objectID2) => objectID1["_id"].equals(objectID2)));

        missingChallenges.forEach((missingChallenge) => {
            let newGlobalChallenge = {
                challengeID: missingChallenge._id,
                username: username,
                exercise: missingChallenge.exercise,
                dueDate: missingChallenge.dueDate,
                issueDate: missingChallenge.issueDate
            }

            newlyInsertedChallenges.push(newGlobalChallenge);
        })
        await Global_challenge_progress.insertMany(newlyInsertedChallenges);
    }

    const allCurrentUserGlobalChallenge = await Global_challenge_progress.find({
        globalChallengeID: {$in : globalChallengeIDs},
        username: username,
    }).lean();


    return res.status(200).json(allCurrentUserGlobalChallenge)
}


router.route('/get_challenges').post(getGlobalChallengesAndInsertIfDoesntExist);

async function getLeaderboard(req, res, next) {

    const username = req.session.username;
    const globalChallengeID = req.body.challengeID;
    const [topFiveUsers, userRank] = await Promise.all([
        Global_challenge_progress.find({
            challengeID: globalChallengeID
        },{
            username: 1, displayName: 1, progress:1
        }).sort({progress: -1}).limit(5).lean(),

        Global_challenge_progress.findOne({
            challengeID: globalChallengeID,
            username: username
        },{
            username: 1, displayName: 1, progress:1
        }).lean()
    ]);

    const topFiveAndUser = [topFiveUsers, userRank];
    return res.status(200).json(topFiveAndUser)

}

router.route('/get_leaderboard').post(getLeaderboard);





module.exports = router;