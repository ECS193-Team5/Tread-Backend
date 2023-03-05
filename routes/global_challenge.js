const router = require("express").Router();
const Global_challenge_progress = require("../models/global_challenge_progress.model");
const Global_challenge = require("../models/global_challenge.model");


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


async function getGlobalChallengesAndInsertIfDoesntExist(req, res, next) {
    const currentGlobalChallenges = await Global_challenge.find({
        issuedDate: {
            $lte: Date.now(),
        },
        dueDate: {
            $gte: Date.now(),
        }
    }).distinct('_id');

    const userGlobalChallengeProgress = await Global_challenge_progress.find({
        globalChallengeID: {$in : currentGlobalChallenges},
        username: req.session.username,
    }).distinct('globalChallengeID'); // this might not be what i think it is

    let newlyInsertedChallenges = [];
    if (currentGlobalChallenges.length != userGlobalChallengeProgress.length) {
        let missingChallenges = currentGlobalChallenges.filter(
            (objectID1) => !userGlobalChallengeProgress.some((objectID2) => objectID1.equals(objectID2)));

        missingChallenges.forEach((missingChallenge) => {
            newGlobalChallenge = {
                globalChallengeID: missingChallenge,
                username: req.session.username
            }

            newlyInsertedChallenges.push(newGlobalChallenge);
        })
        await Global_challenge_progress.insertMany(newlyInsertedChallenges);
    }

    return res.status(200).json(await Global_challenge_progress.find({
        globalChallengeID: {$in : currentGlobalChallenges},
        username: req.session.username,
    }))
}


router.route('/get_challenges').post(getGlobalChallengesAndInsertIfDoesntExist);






module.exports = router;