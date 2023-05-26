const router = require("express").Router();
const Medal_progress = require("../models/medal_progress.model");

async function getInProgressMedals(req, res, next) {

    const userMedals = Medal_progress.find({
        username: req.session.username,
        completed: false
    }, { "_id": 0 }).sort({ exercise: 1, level: 1 }).lean();

    return res.status(200).json(await userMedals);
}

router.route('/get_in_progress').post(getInProgressMedals);

async function getEarnedMedals(req, res, next) {

    const userMedals = Medal_progress.find({
        username: req.session.username,
        completed: true
    }, { "_id": 0 }).sort({ exercise: 1, level: 1 }).lean();

    return res.status(200).json(await userMedals);
}

router.route('/get_earned').post(getEarnedMedals);

module.exports = router;