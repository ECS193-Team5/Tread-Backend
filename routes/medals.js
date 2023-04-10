const router = require("express").Router();
const Medal_progress = require("../models/medal_progress.model");
const Medals = require("../models/medals.model");


// Move to protected route.
router.route('/add_medal').post(async (req, res, next) => {

     // To access theses fields in query: " 'exercise.unit': 5 "
    const exercise = {
        unit : req.body.unit,
        amount : req.body.amount,
        exerciseName : req.body.exerciseName
    }
    const medal = {
        exercise: exercise
    }
    const newMedal = new Medals(medal)
    try {
        await newMedal.save();
    } catch (err) {
        return res.status(500).json("Error: " + err);
    }

    return res.sendStatus(200);
});


router.route('/get_in_progress').post(async (req, res, next) => {

    const returnObj = [
        {"description": "Run 100 Miles", "done": 79, "total": 100},
        {"description": "Try 5 types of exercise", "done": 3, "total": 5},
        {"description": "Make a friend", "done": 0, "total": 1},
        {"description": "Swim 5 days in one week", "done": 3, "total": 5},
        {"description": "Join a leauge", "done": 0, "total": 1},
    ];
    return res.status(200).json(returnObj);
});

router.route('/get_earned').post(async (req, res, next) => {

    const returnObj = [
        {"description": "Complete a Challenge", "date": "09-04-2022"},
        {"description": "Add a sensor", "date": "10-05-2022"},
        {"description": "Try Weighlifting!", "date": "01-12-2022"},
        {"description": "Jog 5 times", "date": "10-31-2022"},
        {"description": "Swim 100 km", "date": "01-26-2022"},
    ];
    return res.status(200).json(returnObj);
});


router.route('/get_recently_earned').post(async (req, res, next) => {

    const returnObj = [
        {"Name":"Run 100 miles"},
        {"Name":"Swim 100 miles"},
        {"Name":"Walk 100 miles"},
        {"Name":"Run 250 miles"},
        {"Name":"100 burpees"},
        {"Name":"Try a new sport!"},
    ];
    return res.status(200).json(returnObj);
});

module.exports = router;