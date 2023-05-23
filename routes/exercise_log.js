const router = require("express").Router();
const Exercise_log = require("../models/exercise_log.model");
const Medal_progress = require("../models/medal_progress.model");
const Global_challenge = require("../models/global_challenge.model");
const Global_challenge_progress = require("../models/global_challenge_progress.model");
const Challenge_progress = require("../models/challenge_progress.model");
const { touchDataOriginDate } = require("./data_origin.js");
const { getUnitType, convertAmount } = require("../models/exercise.schema");

async function checkForChallengeCompletion(username, exerciseLog, model) {
    const challengeCompletionQuery = {
        username: username,
        'exercise.exerciseName': exerciseLog.exercise.exerciseName,
        'exercise.unitType' : exerciseLog.exercise.unitType,
        completed: false,
        issuedDate: {
            $lte: Math.min(Date.now(), exerciseLog.loggedDate)
        },
        dueDate: {
            $gte: Math.max(Date.now(), exerciseLog.loggedDate)
        },
        $expr: {$gte: [ "$progress" , "$exercise.convertedAmount" ]}
    }

    await model.updateMany(challengeCompletionQuery, {completed: true});
}

async function updateChallenges(username, exerciseLog) {
    const progress =  exerciseLog.exercise.convertedAmount;

    const updateResult = await Challenge_progress.updateMany({
        username: username,
        'exercise.exerciseName': exerciseLog.exercise.exerciseName,
        'exercise.unitType' : exerciseLog.exercise.unitType,
        issuedDate: {
            $lte: Math.min(Date.now(), exerciseLog.loggedDate)
        },
        dueDate: {
            $gte: Math.max(Date.now(), exerciseLog.loggedDate)
        },
    },
    {$inc: {progress: progress}});

    if (updateResult.matchedCount === 0) {
       return
    }
    await checkForChallengeCompletion(username, exerciseLog, Challenge_progress);
}

async function updateGlobalChallenges(username, exerciseLog) {
    const incrementObj = {
        progress : exerciseLog.exercise.convertedAmount
    }
    const needUpdatingGlobalChallenge = await Global_challenge.findOne({
        'exercise.exerciseName' : exerciseLog.exercise.exerciseName,
        'exercise.unitType' : exerciseLog.exercise.unitType,
        issuedDate: {
            $lte: Math.min(Date.now(), exerciseLog.loggedDate)
        },
        dueDate: {
            $gte: Math.max(Date.now(), exerciseLog.loggedDate)
        }
    }).lean();

    if (needUpdatingGlobalChallenge === null) {
        return
    }

    await Global_challenge_progress.updateOne({
        challengeID: needUpdatingGlobalChallenge._id,
        username: username,
        exercise: needUpdatingGlobalChallenge.exercise,
        dueDate: needUpdatingGlobalChallenge.dueDate,
        issueDate: needUpdatingGlobalChallenge.issueDate
    },    {$inc: incrementObj}, {upsert: true});

    await checkForChallengeCompletion(username, exerciseLog, Global_challenge_progress);
}

async function checkMedalCompletion(username, exercise) {
    const medalCompletionQuery = {
        username: username,
        'exercise.exerciseName': exercise.exerciseName,
        'exercise.unitType' : exercise.unitType,
        completed: false,
        $expr: {$gte: [ "$progress" , "$exercise.convertedAmount" ]},
    }

    await Medal_progress.updateMany(medalCompletionQuery, {
        completed: true
    });
}

async function updateMedalsWithExercise(username, exercise) {
    const incrementObj = {
        progress : exercise.convertedAmount
    }
    const medalProgressQuery = {
        username: username,
        'exercise.exerciseName': exercise.exerciseName,
        'exercise.unitType' : exercise.unitType,
        completed: false,
    }

    const updateResult = await Medal_progress.updateMany(medalProgressQuery , {$inc: incrementObj});

    if(updateResult.matchedCount === 0) {
        return
    }
    await checkMedalCompletion(username, exercise);
 }

// Updating one vs many exercises use different functions to reduce latency
// and number of database calls.
async function addExerciseToLog(req, res, next) {
    const username = req.session.username;
    const dataOrigin = req.body.dataOrigin;
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
        await Promise.all([
            newExerciseLog.save(),
            updateChallenges(username,  newExerciseLog),
            updateGlobalChallenges(username, newExerciseLog),
            updateMedalsWithExercise(username, newExerciseLog.exercise),
            touchDataOriginDate(username, dataOrigin)
        ]);
    } catch (err) {
        return res.status(500).json("Error: " + err);
    }

    return res.sendStatus(200);
}

router.route('/add').post(addExerciseToLog);


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
    const updateResults = await Challenge_progress.bulkWrite(updateChallengeQuery, {ordered: false});
    if(updateResults.modifiedCount === 0){
        return
    }
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


function getQueryForInsertingGlobalChallengesIfMissing(username, missingGlobalChallenges) {
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

async function updateManyGlobalChallengesAndCompletion(username, uniqueExercises, updateGlobalChallengeQuery, challengeCompletionQuery) {
    const needUpdatingGlobalChallengePromises = getQueryForGlobalChallengesMatchingExercises(username, uniqueExercises);
    const globalChallengesThatMatchExercises = await Promise.all(needUpdatingGlobalChallengePromises);
    const insertGlobalChallengeQuery = getQueryForInsertingGlobalChallengesIfMissing(username, globalChallengesThatMatchExercises);

    if (insertGlobalChallengeQuery.length === 0) {
        return;
    }
    await Global_challenge_progress.bulkWrite(insertGlobalChallengeQuery, {ordered: false});
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
    const updateResult = await Medal_progress.bulkWrite(updateMedalProgressQuery, {ordered: false});

    if(updateResult.modifiedCount === 0) {
        return
    }

    const medalCompletionQuery = getManyMedalCompletionQuery(username, uniqueExercises);
    await Medal_progress.bulkWrite(medalCompletionQuery, {ordered: false});
}

async function updateDatabaseWithExerciseList(req, res, next) {
    const dataOrigin = req.body.dataOrigin;
    const exerciseList = req.body.exerciseList;
    const uniqueExercises = req.body.uniqueExercises;
    const username = req.session.username;

    try {
        await Promise.all([
            addExerciseListToExerciseLog(username, exerciseList),
            updateManyChallengeProgress(username, exerciseList, uniqueExercises),
            updateManyMedalProgress(username, uniqueExercises, exerciseList),
            touchDataOriginDate(username, dataOrigin)
        ])
    } catch (err) {
        console.log(err)
        return res.status(500).json("Error: " + err);
    }

    return res.sendStatus(200);
}

router.route('/add_exercise_list').post(updateDatabaseWithExerciseList)

module.exports = router;