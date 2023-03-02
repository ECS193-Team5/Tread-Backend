const router = require("express").Router();
const { add } = require("../models/exercise.schema");
const exercise = require("../models/exercise.schema");
const Exercise_log = require("../models/exercise_log.model");


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

    return res.sendStatus(200);
}

router.route('/add').post(addExerciseToLog);



module.exports = router;