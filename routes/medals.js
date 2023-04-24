const router = require("express").Router();
const Medal_progress = require("../models/medal_progress.model");
const Medals = require("../models/medals.model");


async function addMedal(req, res, next) {

    // To access theses fields in query: " 'exercise.unit': 5 "
    const exercise = {
        unit: req.body.unit,
        amount: req.body.amount,
        exerciseName: req.body.exerciseName
    }
    const medal = {
        exercise: exercise,
        level: req.body.level
    }
    const newMedal = new Medals(medal)
    try {
        await newMedal.save();
    } catch (err) {
        return res.status(500).json("Error: " + err);
    }

    return res.sendStatus(200);
}

// Move to protected route.
router.route('/add_medal').post(addMedal);

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