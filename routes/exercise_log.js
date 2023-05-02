const router = require("express").Router();
const Exercise_log = require("../models/exercise_log.model");
const Medal_progress = require("../models/medal_progress.model");
const Global_challenge = require("../models/global_challenge.model");
const Global_challenge_progress = require("../models/global_challenge_progress.model");
const Challenge_progress = require("../models/challenge_progress.model");
const { getUnitType, convertAmount } = require("../models/exercise.schema");

// Updating one vs many exercises use different functions to reduce latency
// and number of database calls.
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

    if (needUpdatingGlobalChallenge === null) {
        return next();
    }

    await Global_challenge_progress.updateOne({
        challengeID: needUpdatingGlobalChallenge._id,
        username: req.session.username,
        exercise: needUpdatingGlobalChallenge.exercise,
        dueDate: needUpdatingGlobalChallenge.dueDate,
        issueDate: needUpdatingGlobalChallenge.issueDate
    },    {$inc: incrementObj}, {upsert: true});

    next();
}

async function checkForChallengeCompletion(req, res, next) {
    const loggedDate = req.body.loggedDate;
    const username = req.session.username;
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
        $expr: {$gte: [ "$progress" , "$exercise.convertedAmount" ]}
    }
    // This is very slow
    await Promise.all([
        Challenge_progress.updateMany(challengeCompletionQuery, {completed: true}),
        Global_challenge_progress.updateMany(challengeCompletionQuery, {completed: true})
    ]);
    next();
}

async function updateMedalProgress(req, res, next) {
    const username = req.session.username
    const incrementObj = {
        progress : res.locals.exerciseLog.exercise.convertedAmount
    }
    const medalProgressQuery = {
        username: username,
        'exercise.exerciseName': req.body.exerciseName,
        'exercise.unitType' : res.locals.exerciseLog.exercise.unitType,
        completed: false,
    }

    await Medal_progress.updateMany(medalProgressQuery , {$inc: incrementObj});

    next();
 }


async function checkMedalCompletion(req, res, next) {
    const username = req.session.username
    const medalCompletionQuery = {
        username: username,
        'exercise.exerciseName': req.body.exerciseName,
        'exercise.unitType' : res.locals.exerciseLog.exercise.unitType,
        completed: false,
        $expr: {$gte: [ "$progress" , "$exercise.convertedAmount" ]},
    }

    await Medal_progress.updateMany(medalCompletionQuery, {
        completed: true
    });

    return res.sendStatus(200);
}

router.route('/add').post(addExerciseToLog,
    updateChallenges,
    updateGlobalChallenges,
    checkForChallengeCompletion,
    updateMedalProgress,
    checkMedalCompletion);


// Expects an array of exerciseLogs without the username field.
async function addExerciseListToExerciseLog(username, exerciseList) {
    const exerciseListWithUsername = exerciseList.map(exerciseLog =>
        ({ ...exerciseLog, username: username })
    );
    await Exercise_log.insertMany(exerciseListWithUsername);
}

function getManyUpdateChallengeQuery(username, exerciseList) {
    return exerciseList.map(exerciseLog => ({
        updateMany: {
            filter: {
                username: username,
                'exercise.exerciseName': exerciseLog.exercise.exerciseName,
                'exercise.unitType': getUnitType(exerciseLog.exercise.unit),
                issuedDate: {
                    $lte: Math.min(Date.now(), exerciseLog.loggedDate)
                },
                dueDate: {
                    $gte: Math.max(Date.now(), exerciseLog.loggedDate)
                },
            },
            update: { $inc: { progress: convertAmount(exerciseLog.exercise.unit, exerciseLog.exercise.amount) } }
        }
    }));
}

function getManyChallengeCompletionQuery(username, uniqueExercises) {
    return uniqueExercises.map((exercise) => ({
        updateMany: {
            filter: {
                username: username,
                'exercise.exerciseName': exercise.exerciseName,
                'exercise.unitType' : exercise.unitType,
                issuedDate: {
                    $lte: Date.now()
                },
                dueDate: {
                    $gte: Date.now()
                },
                $expr: {$gte: [ "$progress" , "$exercise.convertedAmount" ]}
            },
            update: {completed: true}
        }
    }));
}

async function updateManyChallengesAndCompletion(updateChallengeQuery, challengeCompletionQuery) {
    await Challenge_progress.bulkWrite(updateChallengeQuery, {ordered: false});
    await Challenge_progress.bulkWrite(challengeCompletionQuery, {ordered: false});
}

function getQueryForGlobalChallengesMatchingExercises(username, uniqueExercises) {
    return uniqueExercises.map((exercise) =>
        Global_challenge.findOne({
            username: username,
            'exercise.exerciseName': exercise.exerciseName,
            'exercise.unitType': exercise.unitType,
            issuedDate: {
                $lte: Date.now()
            },
            dueDate: {
                $gte: Date.now()
            },
        }).lean()
    );
}


function getUpdateManyGlobalChallengeProgressQuery(username, missingGlobalChallenges) {
    let insertGlobalChallengeQuery = [];
    missingGlobalChallenges.forEach(challenge => {
        if (!challenge) {
            return
        }
        insertGlobalChallengeQuery.push({
            updateOne: {
                filter: {
                    challengeID: challenge._id,
                    username: username,
                    exercise: challenge.exercise,
                    dueDate: challenge.dueDate,
                    issueDate: challenge.issueDate
                },
                update: {
                    challengeID: challenge._id,
                    username: username,
                    exercise: challenge.exercise,
                    dueDate: challenge.dueDate,
                    issueDate: challenge.issueDate
                },
                upsert: true
            },
        })
    });
    return insertGlobalChallengeQuery;
}

async function insertManyMissingGlobalChallenges(username, uniqueExercises) {
    const needUpdatingGlobalChallengesPromises = getQueryForGlobalChallengesMatchingExercises(username, uniqueExercises);
    const needUpdatingGlobalChallenges = await Promise.all(needUpdatingGlobalChallengesPromises);
    const insertGlobalChallengeQuery = getUpdateManyGlobalChallengeProgressQuery(username, needUpdatingGlobalChallenges);
    if (insertGlobalChallengeQuery.length === 0) {
        return;
    }
    await Global_challenge_progress.bulkWrite(insertGlobalChallengeQuery, {ordered: false});
}

async function updateManyGlobalChallengesAndCompletion(username, uniqueExercises, updateGlobalChallengeQuery, challengeCompletionQuery) {
    await insertManyMissingGlobalChallenges(username, uniqueExercises);
    await Global_challenge_progress.bulkWrite(updateGlobalChallengeQuery, {ordered: false});
    await Global_challenge_progress.bulkWrite(challengeCompletionQuery, {ordered: false});
}

async function updateManyChallengeProgress(username, exerciseList, uniqueExercises) {
    const updateChallengeQuery = getManyUpdateChallengeQuery(username, exerciseList);
    const challengeCompletionQuery = getManyChallengeCompletionQuery(username, uniqueExercises);

    await Promise.all([
        updateManyChallengesAndCompletion(updateChallengeQuery, challengeCompletionQuery),
        updateManyGlobalChallengesAndCompletion(username, uniqueExercises, updateChallengeQuery, challengeCompletionQuery)
    ]);
}

function getManyUpdateMedalProgressQuery(username, exerciseList) {
    return exerciseList.map(exerciseLog => ({
        updateMany: {
            filter: {
                username: username,
                'exercise.exerciseName': exerciseLog.exercise.exerciseName,
                'exercise.unitType' : getUnitType(exerciseLog.exercise.unit),
                completed: false,
            },
            update: {$inc: {progress: convertAmount(exerciseLog.exercise.unit, exerciseLog.exercise.amount)}}
        }
    }));
}

function getManyMedalCompletionQuery(username, uniqueExercises) {
    return uniqueExercises.map((exercise) => ({
        updateMany: {
            filter: {
                username: username,
                'exercise.exerciseName': exercise.exerciseName,
                'exercise.unitType' : exercise.unitType,
                completed: false,
                $expr: {$gte: [ "$progress" , "$exercise.convertedAmount" ]},
            },
            update: {completed: true}
        }
    }));
}

async function updateManyMedalProgress(username, uniqueExercises, exerciseList) {
    const updateMedalProgressQuery = getManyUpdateMedalProgressQuery(username, exerciseList);
    await Medal_progress.bulkWrite(updateMedalProgressQuery, {ordered: false});

    const medalCompletionQuery = getManyMedalCompletionQuery(username, uniqueExercises);
    await Medal_progress.bulkWrite(medalCompletionQuery, {ordered: false});
}

async function updateDatabaseWithExerciseList(req, res, next) {
    const exerciseList = req.body.exerciseList;
    const uniqueExercises = req.body.uniqueExercises;
    const username = req.session.username;

    try {
        await Promise.all([
            addExerciseListToExerciseLog(username, exerciseList),
            updateManyChallengeProgress(username, exerciseList, uniqueExercises),
            updateManyMedalProgress(username, uniqueExercises, exerciseList)
        ])
    } catch (err) {
        console.log(err)
        return res.status(500).json("Error: " + err);
    }

    return res.sendStatus(200);
}

router.route('/add_exercise_list').post(updateDatabaseWithExerciseList)

module.exports = router;