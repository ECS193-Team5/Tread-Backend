const router = require("express").Router();
const Exercise_log = require("../models/exercise_log.model");
const Challenge = require("../models/challenge.model");
const Global_challenge = require("../models/global_challenge.model");
const Global_challenge_progress = require("../models/global_challenge_progress.model");
const Challenge_progress = require("../models/challenge_progress.model");

async function addExerciseToLog(req, res, next) {
    const exercise = {
        exerciseName: req.body.exerciseName,
        unit: req.body.unit,
        amount: req.body.amount
    }
    const exerciseLog = {
        username: req.session.username,
        loggedDate: req.body.loggedDate,
        exercise: exercise,
    }

    const newExerciseLog = new Exercise_log(exerciseLog);
    try {
        await newExerciseLog.save();
    } catch (err) {
        console.log(err)
        return res.status(500).json("Error: " + err);
    }

    res.locals.exerciseLog = newExerciseLog;
    next();
}

// Need to test
async function updateChallenges(req, res, next) {
    const loggedDate = req.body.loggedDate;
    const username = req.session.username
    const progress =  res.locals.exerciseLog.exercise.convertedAmount;

    await Challenge_progress.updateMany({
        username: username,
        'exercise.exerciseName': req.body.exerciseName,
        'exercise.unitType' : res.locals.exerciseLog.exercise.unitType,
        issuedDate: {
            $lte: Math.min(Date.now(), loggedDate)
        },
        dueDate: {
            $gte: Math.max(Date.now(), loggedDate)
        },
    },
    {$inc: {progress: progress}});

    next();
}


async function updateGlobalChallenges(req, res, next) {
    const loggedDate = req.body.loggedDate;
    const incrementObj = {
        progress : res.locals.exerciseLog.exercise.convertedAmount
    }
    const needUpdatingGlobalChallenge = await Global_challenge.findOne({
        'exercise.exerciseName' : req.body.exerciseName,
        'exercise.unitType' : res.locals.exerciseLog.exercise.unitType,
        issuedDate: {
            $lte: Math.min(Date.now(), loggedDate)
        },
        dueDate: {
            $gte: Math.max(Date.now(), loggedDate)
        }
    }).lean();

    if (needUpdatingGlobalChallenge == null) {
        return res.sendStatus(200);
    }

    await Global_challenge_progress.updateOne({
        challengeID: needUpdatingGlobalChallenge._id,
        username: req.session.username,
        exercise: needUpdatingGlobalChallenge.exercise,
        dueDate: needUpdatingGlobalChallenge.dueDate,
        issueDate: needUpdatingGlobalChallenge.issueDate
    },
    {$inc: incrementObj}, {upsert: true});

    next();
}

async function checkForChallengeCompletion(req, res, next) {
    const loggedDate = req.body.loggedDate;
    const username = req.session.username
    const challengeCompletionQuery = {
        username: username,
        'exercise.exerciseName': req.body.exerciseName,
        'exercise.unitType' : res.locals.exerciseLog.exercise.unitType,
        completed: false,
        issuedDate: {
            $lte: Math.min(Date.now(), loggedDate)
        },
        dueDate: {
            $gte: Math.max(Date.now(), loggedDate)
        },
        $expr: {$gt: [ "$progress" , "$exercise.convertedAmount" ]}
    }
    // This is very slow
    await Challenge_progress.updateMany(challengeCompletionQuery, {completed: true});
    await Global_challenge_progress.updateMany(challengeCompletionQuery, {completed: true});
    return res.sendStatus(200);
}

router.route('/add').post(addExerciseToLog,
    updateChallenges,
    updateGlobalChallenges,
    checkForChallengeCompletion);



module.exports = router;