const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();
const mongoose = require("mongoose");
const exercise = require("../../models/exercise.schema");
const Challenge_progress = require("../../models/challenge_progress.model");
const { update } = require("../../models/exercise_log.model");

describe("Testing exercise_log", () =>{
    let exercise_log;
    let req;
    let res;
    let next;

    beforeEach(() => {
        exercise_log = rewire("../../routes/exercise_log.js");

        req = {
            body: {},
            headers: {},
            session: {},
        }

        res = {
            query: {},
            headers: {},
            data: null,
            status: 0,
            locals: {},
            json(payload) {
                this.data = JSON.stringify(payload)
                return this
            },
            cookie(name, value, options) {
                this.headers[name] = value
            },
            sendStatus(x) {
                this.status = x
            },
            status(x) {
                this.status = x
                return this
            },
            send(x){
                this.data = JSON.stringify(x)
                return this
            }
        }

        next = sandbox.stub();
    });

    afterEach(() => {
        sandbox.restore();
    })

    it("Test checkForChallengeCompletion", async function() {
        let username = "user#0000";
        let exerciseLog = {
            exercise:{
                exerciseName:"Baseball",
                unitType:"distance",
                loggedDate:1
            }
        }
        sandbox.stub(mongoose.Model, "updateMany").resolves(true);

        let checkForChallengeCompletion = exercise_log.__get__("checkForChallengeCompletion");
        await checkForChallengeCompletion(username, exerciseLog, Challenge_progress);
    });

    describe("Test updateGlobalChallenges", () =>{
        let username;
        let exerciseLog;
        let checkForChallengeCompletionStub;
        let updateGlobalChallenges;
        let leanStub;
        let updateMany;
        let updateOne;

        beforeEach(()=>{
            username = "user#0000";
            exerciseLog = {
                exercise:{
                    exerciseName:"Baseball",
                    unitType:"distance",
                    loggedDate: 1,
                    convertedAmount: 0
                }
            }
            checkForChallengeCompletionStub = sandbox.stub();
            exercise_log.__set__(
                "checkForChallengeCompletion", checkForChallengeCompletionStub
            )
            updateGlobalChallenges = exercise_log.__get__("updateGlobalChallenges");
            leanStub = sandbox.stub();
            updateMany = sandbox.stub(mongoose.Model, "findOne").returns({lean:leanStub});
            updateOne = sandbox.stub(mongoose.Model, "updateOne");
        })

        it("Test updateGlobalChallenges that does not need updating", async function() {
            leanStub.resolves(null)
            await updateGlobalChallenges(username, exerciseLog);
            expect(updateOne).not.to.be.called;
        });

        it("Test updateGlobalChallenges with matched Progress", async function() {
            leanStub.resolves(true)
            await updateGlobalChallenges(username, exerciseLog);
            expect(updateOne).to.be.called;
            expect(checkForChallengeCompletionStub).to.be.called;
        });
    })

    describe("Test updateChallenges", () =>{
        let username;
        let exerciseLog;
        let checkForChallengeCompletionStub;
        let updateChallenges;
        beforeEach(()=>{
            username = "user#0000";
            exerciseLog = {
                exercise:{
                    exerciseName:"Baseball",
                    unitType:"distance",
                    loggedDate:1
                }
            }
            checkForChallengeCompletionStub = sandbox.stub();
            exercise_log.__set__(
                "checkForChallengeCompletion", checkForChallengeCompletionStub
            )
            updateChallenges = exercise_log.__get__("updateChallenges");
        })

        it("Test updateChallenges with no matchedCount", async function() {
            sandbox.stub(mongoose.Model, "updateMany").resolves({matchedCount:0});
            await updateChallenges(username, exerciseLog, Challenge_progress);
            expect(checkForChallengeCompletionStub).not.to.be.called;
        });

        it("Test updateChallenges with matched Progress", async function() {
            sandbox.stub(mongoose.Model, "updateMany").resolves({matchedCount:1});
            await updateChallenges(username, exerciseLog, Challenge_progress);
            expect(checkForChallengeCompletionStub).to.be.called;
        });
    })

    it("Test checkMedalCompletion", async function() {
        let username = "user#0000";
        let exerciseLog = {
            exercise:{
                exerciseName:"Baseball",
                unitType:"distance",
                loggedDate:1
            }
        }
        let updateManyStub = sandbox.stub(mongoose.Model, "updateMany").resolves(true);

        let checkMedalCompletion = exercise_log.__get__("checkMedalCompletion");
        await checkMedalCompletion(username, exerciseLog.exercise);
        expect(updateManyStub).to.be.calledWith(
            {
                username: 'user#0000',
                'exercise.exerciseName': "Baseball",
                'exercise.unitType': "distance",
                completed: false,
                '$expr': { '$gte': [ '$progress', '$exercise.convertedAmount' ] }
            },
            {completed:true}
        );
    });

    describe("Test updateMedalsWithExercise", () =>{
        let username;
        let exerciseLog;
        let checkMedalCompletionStub;
        let updateMedalsWithExercise;
        beforeEach(()=>{
            username = "user#0000";
            exerciseLog = {
                exercise:{
                    exerciseName:"Baseball",
                    unitType:"distance",
                    loggedDate:1
                }
            }
            checkMedalCompletionStub = sandbox.stub();
            exercise_log.__set__(
                "checkMedalCompletion", checkMedalCompletionStub
            )
            updateMedalsWithExercise = exercise_log.__get__("updateMedalsWithExercise");
        })

        it("Test updateMedalsWithExercise with no matchedCount", async function() {
            sandbox.stub(mongoose.Model, "updateMany").resolves({matchedCount:0});
            await updateMedalsWithExercise(username, exerciseLog, Challenge_progress);
            expect(checkMedalCompletionStub).not.to.be.called;
        });

        it("Test updateMedalsWithExercise with matched Progress", async function() {
            sandbox.stub(mongoose.Model, "updateMany").resolves({matchedCount:1});
            await updateMedalsWithExercise(username, exerciseLog, Challenge_progress);
            expect(checkMedalCompletionStub).to.be.called;
        });
    })

    describe("Test addExerciseToLog", () =>{
        let addExerciseToLog;
        let updateChallengesStub;
        let updateGlobalChallengesStub;
        let updateMedalsWithExerciseStub;

        beforeEach(()=>{
            req.session.username = "user#0000";
            req.body.exerciseName = "Baseball";
            req.body.unit = "m";
            req.body.amount = 10;
            req.body.loggedDate = 4;
            updateChallengesStub = sandbox.stub().resolves(true);
            exercise_log.__set__("updateChallenges", updateChallengesStub);
            updateGlobalChallengesStub = sandbox.stub().resolves(true);
            exercise_log.__set__("updateGlobalChallenges", updateGlobalChallengesStub);
            updateMedalsWithExerciseStub = sandbox.stub().resolves(true);
            exercise_log.__set__("updateMedalsWithExercise", updateMedalsWithExerciseStub);
            addExerciseToLog = exercise_log.__get__("addExerciseToLog")
            saveStub = sandbox.stub(mongoose.Model.prototype, "save");
        })

        it("Test addExerciseToLog that succeeds", async function() {
            await addExerciseToLog(req, res, next);
            expect(res.status).to.equal(200);
        });

        it("Test addExerciseToLog that fails", async function() {
            updateGlobalChallengesStub.throws();
            await addExerciseToLog(req, res, next);
            expect(res.status).to.equal(500);
        });
    })

    it("Test addExerciseListToExerciseLog", async function() {
        let username = "user#0000";
        let exerciseList = [{}];
        let insertManyStub = sandbox.stub(mongoose.Model, "insertMany");
        let addExerciseListToExerciseLog = exercise_log.__get__("addExerciseListToExerciseLog");
        await addExerciseListToExerciseLog(username, exerciseList);
        expect(insertManyStub).to.be.called;
    });

    it("Test getManyUpdateChallengeQuery", async function() {
        let username = "user#0000";
        let exerciseList = [{exercise:{exerciseName:"Swim", unitType:"distance", unit:"m", amount:0}}];
        let getManyUpdateChallengeQuery = exercise_log.__get__("getManyUpdateChallengeQuery");
        await getManyUpdateChallengeQuery(username, exerciseList);
    });

    it("Test getManyChallengeCompletionQuery", async function() {
        let username = "user#0000";
        let exerciseList = [{exercise:{exerciseName:"Swim", unitType:"distance", unit:"m", amount:0}}];
        let getManyChallengeCompletionQuery = exercise_log.__get__("getManyChallengeCompletionQuery");
        await getManyChallengeCompletionQuery(username, exerciseList);
    });

    describe("Test updateManyChallengesAndCompletion", () =>{
        let updateChallengeQuery;
        let challengeCompletionQuery;
        let bulkWriteStub;
        let updateManyChallengesAndCompletion;

        beforeEach(()=>{
            updateChallengeQuery={};
            challengeCompletionQuery={};
            bulkWriteStub = sandbox.stub(mongoose.Model, "bulkWrite");
            updateManyChallengesAndCompletion = exercise_log.__get__("updateManyChallengesAndCompletion");
        })

        it("Test updateManyChallengesAndCompletion that does not need updating", async function() {
            bulkWriteStub.resolves({modifiedCount:0})
            await updateManyChallengesAndCompletion(updateChallengeQuery, challengeCompletionQuery);
            expect(bulkWriteStub).to.be.calledOnce;
        });

        it("Test updateManyChallengesAndCompletion with matched Progress", async function() {
            bulkWriteStub.resolves({modifiedCount:1})
            await updateManyChallengesAndCompletion(updateChallengeQuery, challengeCompletionQuery);
            expect(bulkWriteStub).to.be.calledTwice;
        });
    })

    it("Test getQueryForGlobalChallengesMatchingExercises", async function() {
        let username = "user#0000";
        let uniqueExercises = [{exerciseName:"Swim", unitType:"time"}];
        let leanStub = sandbox.stub().resolves(true);
        let findOneStub = sandbox.stub(mongoose.Model,"findOne").returns({lean:leanStub})
        let getQueryForGlobalChallengesMatchingExercises = exercise_log.__get__("getQueryForGlobalChallengesMatchingExercises");
        let res = await getQueryForGlobalChallengesMatchingExercises(username, uniqueExercises);
    });

    it("Test getQueryForInsertingGlobalChallengesIfMissing", async function() {
        let username = "user#0000";
        let missingGlobalChallenges = [null, {
            _id:"4",
            exercise:{},
            dueDate:3,
            issueDate:4
        }]
        
        let getQueryForInsertingGlobalChallengesIfMissing = exercise_log.__get__("getQueryForInsertingGlobalChallengesIfMissing");
        let res = getQueryForInsertingGlobalChallengesIfMissing(username, missingGlobalChallenges);
        expect(res).to.deep.equal([
            {
                updateOne: {
                    filter: {
                        challengeID: "4",
                        username: "user#0000",
                        exercise: {},
                        dueDate: 3,
                        issueDate: 4
                    },
                    update: {
                        challengeID: "4",
                        username: "user#0000",
                        exercise: {},
                        dueDate: 3,
                        issueDate: 4
                    },
                    upsert: true
                }
            }])
    });

    describe("Test updateManyGlobalChallengesAndCompletion", () =>{
        let username, uniqueExercises, updateGlobalChallengeQuery, challengeCompletionQuery;
        let updateManyGlobalChallengesAndCompletion;
        let bulkWriteStub;
        let getQueryForGlobalChallengesMatchingExercisesStub;
        let getQueryForInsertingGlobalChallengesIfMissingStub;

        beforeEach(()=>{
            username = "user#0000";
            uniqueExercises = [{exerciseName:"Swim", unitType:"time"}];
            updateGlobalChallengeQuery= {};
            challengeCompletionQuery = {};
            updateManyGlobalChallengesAndCompletion = exercise_log.__get__("updateManyGlobalChallengesAndCompletion");
            getQueryForGlobalChallengesMatchingExercisesStub = sandbox.stub().returns([]);
            exercise_log.__set__(" getQueryForGlobalChallengesMatchingExercises", getQueryForGlobalChallengesMatchingExercisesStub);
            getQueryForInsertingGlobalChallengesIfMissingStub = sandbox.stub();
            exercise_log.__set__(" getQueryForInsertingGlobalChallengesIfMissing", getQueryForInsertingGlobalChallengesIfMissingStub);
            bulkWriteStub = sandbox.stub(mongoose.Model, "bulkWrite");
        })

        it("Test updateManyGlobalChallengesAndCompletion with no matched Progress", async function() {
            getQueryForInsertingGlobalChallengesIfMissingStub.returns([]);
            await updateManyGlobalChallengesAndCompletion(username, uniqueExercises, updateGlobalChallengeQuery, challengeCompletionQuery);
            expect(bulkWriteStub).not.to.be.called;
        });

        it("Test updateManyGlobalChallengesAndCompletion with matched Progress", async function() {
            getQueryForInsertingGlobalChallengesIfMissingStub.returns([{}]);
            await updateManyGlobalChallengesAndCompletion(username, uniqueExercises, updateGlobalChallengeQuery, challengeCompletionQuery);
            expect(bulkWriteStub).to.be.called;
        });
    })

    it("Test updateManyChallengeProgress", async function() {
        let updateManyChallengeProgress = exercise_log.__get__("updateManyChallengeProgress");
        let getManyUpdateChallengeQueryStub = sandbox.stub();
        exercise_log.__set__(" getManyUpdateChallengeQuery", getManyUpdateChallengeQueryStub);
        let getManyChallengeCompletionQueryStub = sandbox.stub();
        exercise_log.__set__(" getManyChallengeCompletionQuery", getManyChallengeCompletionQueryStub);
        let updateManyChallengesAndCompletionStub = sandbox.stub();
        exercise_log.__set__(" updateManyChallengesAndCompletion", updateManyChallengesAndCompletionStub);
        let updateManyGlobalChallengesAndCompletionStub = sandbox.stub();
        exercise_log.__set__(" updateManyGlobalChallengesAndCompletion", updateManyGlobalChallengesAndCompletionStub);

        await updateManyChallengeProgress("user#0000", [], []);

        expect(getManyUpdateChallengeQueryStub).to.be.called
        expect(getManyChallengeCompletionQueryStub).to.be.called
        expect(updateManyChallengesAndCompletionStub).to.be.called
        expect(updateManyGlobalChallengesAndCompletionStub).to.be.called
    });

    it("Test getManyUpdateMedalProgressQuery", async function() {
        let username = "user#0000";
        let exerciseList = [{exercise:{exerciseName:"Swim", unitType:"distance", unit:"m", amount:0}}];

        let getManyUpdateMedalProgressQuery = exercise_log.__get__("getManyUpdateMedalProgressQuery");
        let res = await getManyUpdateMedalProgressQuery(username, exerciseList);
        
        expect(res).to.deep.equal(
            [
                {
                    updateMany:{
                        filter:{
                            username:"user#0000",
                            'exercise.exerciseName':"Swim",
                            'exercise.unitType': "distance",
                            completed:false,
                        },
                        update: {$inc: {progress: 0}}
                    }
                }
            ]
        )
    });

    it("Test getManyMedalCompletionQuery", async function() {
        let username = "user#0000";
        let uniqueExercises = [{exerciseName:"Swim", unitType:"distance"},
                        {exerciseName:"Run", unitType:"time"}];

        let getManyMedalCompletionQuery = exercise_log.__get__("getManyMedalCompletionQuery");
        let res = await getManyMedalCompletionQuery(username, uniqueExercises);
        
        expect(res).to.deep.equal([
            {
                updateMany:{
                    filter:{
                        username: "user#0000",
                        'exercise.exerciseName':"Swim",
                        'exercise.unitType': "distance",
                        completed:false,
                        $expr: {$gte: [ "$progress" , "$exercise.convertedAmount" ]},
                    },
                    update: {completed: true}
                }
            },
            {
                updateMany:{
                    filter:{
                        username: "user#0000",
                        'exercise.exerciseName':"Run",
                        'exercise.unitType': "time",
                        completed:false,
                        $expr: {$gte: [ "$progress" , "$exercise.convertedAmount" ]},
                        },
                        update: {completed: true}
                    }
            }])
    });

    describe("Test updateManyMedalProgress", () =>{
        let username;
        let uniqueExercises;
        let exerciseList;
        let getManyUpdateMedalProgressQueryStub;
        let getManyMedalCompletionQueryStub;
        let bulkWriteStub;
        let updateManyMedalProgress;

        beforeEach(()=>{
            getManyUpdateMedalProgressQueryStub = sandbox.stub();
            exercise_log.__set__(" getManyUpdateMedalProgressQuery", getManyUpdateMedalProgressQueryStub);
            getManyMedalCompletionQueryStub = sandbox.stub();
            exercise_log.__set__(" getManyMedalCompletionQuery", getManyMedalCompletionQueryStub);
            bulkWriteStub = sandbox.stub(mongoose.Model, "bulkWrite");
            updateManyMedalProgress= exercise_log.__get__("updateManyMedalProgress")
        })

        it("Test updateManyMedalProgress that has matching medals", async function() {
            bulkWriteStub.resolves({modifiedCount:1});
            await updateManyMedalProgress(username, uniqueExercises, exerciseList);
            expect(getManyMedalCompletionQueryStub).to.be.called;
        });

        it("Test updateManyMedalProgress that has no matching medals", async function() {
            bulkWriteStub.resolves({modifiedCount:0});
            await updateManyMedalProgress(username, uniqueExercises, exerciseList);
            expect(getManyMedalCompletionQueryStub).not.to.be.called;
        });
    })

    describe("Test updateDatabaseWithExerciseList", () =>{
        let dataOrigin;
        let username;
        let exerciseLog;
        let checkForChallengeCompletionStub;
        let updateDatabaseWithExerciseList;
        let addExerciseListToExerciseLogStub;
        let updateManyChallengeProgressStub;
        let updateManyMedalProgressStub;
        let touchDataOriginAnchorStub;

        beforeEach(()=>{
            req.body.dataOrigin = "healthKit";
            req.body.exerciseList = [];
            req.body.uniqueExercises = [];
            req.body.anchor = "anchor";
            req.session.username = "user#0000";
            addExerciseListToExerciseLogStub = sandbox.stub().resolves(true);
            updateManyChallengeProgressStub = sandbox.stub().resolves(true);
            updateManyMedalProgressStub = sandbox.stub().resolves(true);
            touchDataOriginAnchorStub = sandbox.stub().resolves(true);
            exercise_log.__set__("addExerciseListToExerciseLog", addExerciseListToExerciseLogStub)
            exercise_log.__set__("updateManyChallengeProgress", updateManyChallengeProgressStub)
            exercise_log.__set__("updateManyMedalProgress", updateManyMedalProgressStub)
            exercise_log.__set__("touchDataOriginAnchor", touchDataOriginAnchorStub)
            updateDatabaseWithExerciseList = exercise_log.__get__("updateDatabaseWithExerciseList")
        })

        it("Test updateDatabaseWithExerciseList that succeeds", async function() {
            req.body.exerciseList = [{}]
            await updateDatabaseWithExerciseList(req, res, next);
            expect(res.status).to.equal(200);
        });

        it("Test updateDatabaseWithExerciseList with empty list", async function() {
            req.body.exerciseList = []
            addExerciseListToExerciseLogStub.throws();
            await updateDatabaseWithExerciseList(req, res, next);
            expect(res.status).to.equal(200);
        });

        it("Test updateDatabaseWithExerciseList that fails", async function() {
            req.body.exerciseList = [{}]
            addExerciseListToExerciseLogStub.throws();
            await updateDatabaseWithExerciseList(req, res, next);
            expect(res.status).to.equal(500);
        });
    })

});