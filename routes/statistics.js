const router = require("express").Router();
const Exercise_log = require("../models/exercise_log.model");
const Challenge_progress = require("../models/challenge_progress.model");

router.route("/get_exercise_log").post(async (req, res, next) => {
    const username = req.session.username;

    const exerciseLogData = await Exercise_log.find({
        username: username
    }).sort({loggedDate: -1});

    return res.status(200).json(exerciseLogData);
});

router.route("/get_past_challenges").post(async (req, res, next) => {
    const username = req.session.username;

    const exerciseLogData = await Challenge_progress.find({
        username: username,
        duedate: {$lt: Date.now()}
    });

    return res.status(200).json(exerciseLogData);
});