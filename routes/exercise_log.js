const router = require("express").Router();
const { add } = require("../models/exercise.schema");
const exercise = require("../models/exercise.schema");
const Exercise_log = require("../models/exercise_log.model");
const Challenge = require("../models/challenge.model");


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
        return res.status(500).json("Error: " + err);
    }

    res.locals.exerciseLog = newExerciseLog;
    next();
}
// Need to test
async function updateChallenges(req, res, next) {
    const loggedDate = req.body.loggedDate;
    const username = req.session.username
    const fieldToIncrement = 'progress.' + req.session.username;
    const incrementObj = {
        [fieldToIncrement] : res.locals.exerciseLog.exercise.convertedAmount
    }
    await Challenge.updateMany({
        'exercise.exerciseName': req.body.exerciseName,
        'exercise.unitType' : res.locals.exerciseLog.exercise.unitType,
        status: "accepted",
        issuedDate: {
            $lte: Date.now(),
            $lte: loggedDate,
        },
        dueDate: {
            $gte: Date.now(),
            $gte: loggedDate,
        },
        participants: req.session.username,
    },
    {$inc: incrementObj});

    return res.sendStatus(200);
}

router.route('/add').post(addExerciseToLog, updateChallenges);



module.exports = router;