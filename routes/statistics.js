const router = require("express").Router();
const Exercise_log = require("../models/exercise_log.model");
const Challenge_progress = require("../models/challenge_progress.model");

async function getExerciseLog(req, res) {
    const username = req.session.username;

    const exerciseLogData = await Exercise_log.find({
        username: username
    }).sort({loggedDate: 1});

    return res.status(200).json(exerciseLogData);
}

router.route("/get_exercise_log").post(getExerciseLog);

async function getPastChallenges(req, res) {
    const username = req.session.username;

    const exerciseLogData = await Challenge_progress.find({
        username: username,
        dueDate: {$lt: Date.now()}
    }).sort({dueDate: 1});

    return res.status(200).json(exerciseLogData);
}

router.route("/get_past_challenges").post(getPastChallenges);

module.exports = router;