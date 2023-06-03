var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const mongoose = require("mongoose");
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
request = request(app);
const googleauth = require('google-auth-library');
var helpers = require("./postRequests");
const chai = require("chai");
const deepEqualInAnyOrder = require('deep-equal-in-any-order');
const exercise = require("../../models/exercise.schema");
const Exercise_log = require("../../models/exercise_log.model");
chai.use(deepEqualInAnyOrder);
const {expect} = chai;



describe('Testing /exercise_log routes', () => {
    let users = [{
        "sub": "exercise1",
        "given_name": "Martha",
        "family_name": "Maple",
    },{
        "sub": "exercise2",
        "given_name": "Hercule",
        "family_name": "Poirot",
    }]

    describe("Test /add", async function(){
        describe("Test add simple, single exercise", async function () {
            let usersInfo = [];

            before(async function(){
                usersInfo = await helpers.createGoogleUsers(users, sandbox);
            })

            after(async () => {
                await helpers.deleteUsers(usersInfo);
            });

            it("Test add a single, working exercise", async function () {
                let exerciseExample = {
                    loggedDate: Date.now(),
                    amount: 10,
                    exerciseName: "Basketball",
                    unit: "m",
                    dataOrigin:"web",
                    anchor: ""
                }

                await request.post("/exercise_log/add")
                    .set("Cookie", usersInfo[0].cookie)
                    .set('Accept', 'application/json')
                    .send(exerciseExample)
                    .expect(200);
            })

            it("Test add an exercise that is missing amount", async function () {
                let exerciseExample = {
                    loggedDate: Date.now(),
                    exerciseName: "Basketball",
                    unit: "m",
                    dataOrigin:"web",
                    anchor: ""
                }

                await request.post("/exercise_log/add")
                    .set("Cookie", usersInfo[0].cookie)
                    .set('Accept', 'application/json')
                    .send(exerciseExample)
                    .expect(500);
            })

            it("Test add an exercise that doesn't have a valid unit", async function () {
                let exerciseExample = {
                    loggedDate: Date.now(),
                    exerciseName: "Basketball",
                    unit: "mir",
                    dataOrigin:"web",
                    amount: 10,
                    anchor: ""
                }

                await request.post("/exercise_log/add")
                    .set("Cookie", usersInfo[0].cookie)
                    .set('Accept', 'application/json')
                    .send(exerciseExample)
                    .expect(500);
            })
        });

        describe("Test challenge updates", async function () {
            describe("Test exercise does not effect a challenge", async function(){
                let usersInfo = [];

                before(async function(){
                    usersInfo = await helpers.createGoogleUsers(users, sandbox);
                    let inputData = {
                        unit: "sec",
                        amount:50,
                        exerciseName: "Baseball"
                    }
                    await helpers.sendSelfChallengeWithData(usersInfo[0].cookie, inputData);
                })

                after(async () => {
                    await helpers.deleteUsers(usersInfo);
                });

                it("Test add one exercise that does not effect a challenge because the units do not match", async function () {
                    let exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 10,
                        exerciseName: "Baseball",
                        unit: "m",
                        dataOrigin:"web"
                    }
                    await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);

                    let results = await helpers.getIssuedChallenges(usersInfo[0].cookie);
                    expect(results[0].progress.progress).to.equal(0);
                })

                it("Test add one exercise that does not effect a challenge because the name does not match", async function () {
                    let exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 10,
                        exerciseName: "Basketball",
                        unit: "s",
                        dataOrigin:"web"
                    }
                    await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);

                    let results = await helpers.getIssuedChallenges(usersInfo[0].cookie);
                    expect(results.length).to.equal(1);
                    expect(results[0].progress.progress).to.equal(0);
                })
            })

            describe("Test exercise updates a challenge", async function(){
                let usersInfo = [];
                let inputData = [
                    {
                        unit: "sec",
                        amount:50,
                        exerciseName: "Baseball",
                    },
                    {
                        unit: "sec",
                        amount:50,
                        exerciseName: "Basketball"
                    },
                    {
                        unit: "min",
                        amount:2,
                        exerciseName: "Barre"
                    },
                    {
                        unit: "min",
                        amount:2,
                        exerciseName: "Archery"
                    },
                    {
                        unit: "min",
                        amount:5,
                        exerciseName: "Bocce"
                    },
                    {
                        unit: "min",
                        amount:7,
                        exerciseName: "Skiing"
                    },
                    {
                        unit: "min",
                        amount: 3,
                        exerciseName: "Punt"
                    }
                ]

                before(async function(){
                    usersInfo = await helpers.createGoogleUsers(users, sandbox);
                    await helpers.sendSelfChallengeWithData(usersInfo[0].cookie, inputData[0]);
                    await helpers.sendSelfChallengeWithData(usersInfo[0].cookie, inputData[1]);
                    await helpers.sendSelfChallengeWithData(usersInfo[0].cookie, inputData[2]);
                    await helpers.sendSelfChallengeWithData(usersInfo[0].cookie, inputData[3]);
                    await helpers.sendSelfChallengeWithData(usersInfo[0].cookie, inputData[4]);
                    await helpers.sendSelfChallengeWithData(usersInfo[0].cookie, inputData[5]);
                    await helpers.sendSelfChallengeWithData(usersInfo[0].cookie, inputData[6]);
                })

                after(async () => {
                    await helpers.deleteUsers(usersInfo);
                });

                it("Test add one exercise that updates one challenge with the same exact unit", async function () {
                    let exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 10,
                        exerciseName: "Baseball",
                        unit: "sec",
                        dataOrigin:"web",
                        anchor:""
                    }
                    await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);

                    let results = await helpers.getIssuedChallenges(usersInfo[0].cookie);
                    let challenge = helpers.findMatchingChallenge(results, inputData[0]);
                    expect(challenge[0].progress.progress).to.equal(10/60);
                    expect(challenge[0].progress.completed).to.equal(false);
                    expect(challenge.length).to.equal(1);
                });

                it("Test add one exercise that updates one challenge with the same unit type", async function () {
                    let exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 10,
                        exerciseName: "Basketball",
                        unit: "min",
                        dataOrigin:"web",
                        anchor:""
                    }
                    await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);

                    let results = await helpers.getIssuedChallenges(usersInfo[0].cookie);
                    let challenge = helpers.findMatchingChallenge(results, inputData[1]);
                    expect(challenge[0].progress.progress).to.equal(10);
                    expect(challenge[0].progress.completed).to.equal(true);
                    expect(challenge.length).to.equal(1);
                });

                it("Test add one exercise that completes a challenge exactly", async function () {
                    let exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 2,
                        exerciseName: "Barre",
                        unit: "min",
                        dataOrigin:"web",
                        anchor:""
                    }
                    await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);

                    let results = await helpers.getIssuedChallenges(usersInfo[0].cookie);
                    let challenge = helpers.findMatchingChallenge(results, inputData[2]);

                    expect(challenge[0].progress.progress).to.equal(2);
                    expect(challenge[0].progress.completed).to.equal(true);
                    expect(challenge.length).to.equal(1);
                })

                it("Test add one exercise that completes a challenge over the needed amount", async function () {
                    let exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 3,
                        exerciseName: "Archery",
                        unit: "min",
                        dataOrigin:"web",
                        anchor:""
                    }
                    await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);

                    let results = await helpers.getIssuedChallenges(usersInfo[0].cookie);
                    let challenge = helpers.findMatchingChallenge(results, inputData[3]);

                    expect(challenge[0].progress.progress).to.equal(3);
                    expect(challenge[0].progress.completed).to.equal(true);
                    expect(challenge.length).to.equal(1);
                })

                it("Test adding two exercises that complete the same challenge", async function () {
                    let exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 3,
                        exerciseName: "Bocce",
                        unit: "min",
                        dataOrigin:"web",
                        anchor:""
                    }
                    await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);
                    exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 3,
                        exerciseName: "Bocce",
                        unit: "min",
                        dataOrigin:"web",
                        anchor:""
                    }
                    await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);

                    let results = await helpers.getIssuedChallenges(usersInfo[0].cookie);
                    let challenge = helpers.findMatchingChallenge(results, inputData[4]);
                    expect(challenge[0].progress.progress).to.equal(6);
                    expect(challenge[0].progress.completed).to.equal(true);
                    expect(challenge.length).to.equal(1);
                })

                it("Test adding two exercises that effect the same challenge", async function () {
                    let exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 3,
                        exerciseName: "Skiing",
                        unit: "min",
                        dataOrigin:"web",
                        anchor:""
                    }
                    await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);
                    exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 3,
                        exerciseName: "Skiing",
                        unit: "min",
                        dataOrigin:"web"
                    }
                    await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);

                    let results = await helpers.getIssuedChallenges(usersInfo[0].cookie);
                    let challenge = helpers.findMatchingChallenge(results, inputData[5]);
                    expect(challenge[0].progress.progress).to.equal(6);
                    expect(challenge[0].progress.completed).to.equal(false);
                    expect(challenge.length).to.equal(1);
                })

                it("Test an exercise on an already completed challenge", async function(){
                    let exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 8,
                        exerciseName: "Punt",
                        unit: "min",
                        dataOrigin:"web",
                        anchor:""
                    }
                    await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);
                    exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 3,
                        exerciseName: "Punt",
                        unit: "min",
                        dataOrigin:"web",
                        anchor:""
                    }
                    await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);

                    let results = await helpers.getIssuedChallenges(usersInfo[0].cookie);
                    let challenge = helpers.findMatchingChallenge(results, exerciseExample);
                    expect(challenge[0].progress.progress).to.equal(11);
                    expect(challenge[0].progress.completed).to.equal(true);
                    expect(challenge.length).to.equal(1);
                });
            });

            describe("Test exercise updates multiple challenges", async function (){
                let usersInfo = [];
                let inputData = [
                    {
                        unit: "sec",
                        amount:50,
                        exerciseName: "Baseball"
                    },
                    {
                        unit: "min",
                        amount: 60,
                        exerciseName: "Baseball"
                    }
                ];

                before(async function(){
                    usersInfo = await helpers.createGoogleUsers(users, sandbox);
                    await helpers.sendSelfChallengeWithData(usersInfo[0].cookie, inputData[0]);
                    await helpers.sendSelfChallengeWithData(usersInfo[0].cookie, inputData[1]);
                })

                after(async () => {
                    await helpers.deleteUsers(usersInfo);
                });

                it("Test add one exercise that updates multiple challenges", async function () {
                    let exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 1,
                        exerciseName: "Baseball",
                        unit: "hr",
                        dataOrigin:"web",
                        anchor:""
                    }
                    await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);

                    let results = await helpers.getIssuedChallenges(usersInfo[0].cookie);
                    expect(results.length).to.equal(2);
                    expect(results[0].progress.progress).to.equal(60);
                    expect(results[1].progress.progress).to.equal(60);

                })
            })
        });


        describe("Test global challenges updates", async function(){
            let usersInfo = [];
            let globalChallengeData = [
                {
                    unit: "hr",
                    amount:10,
                    exerciseName: "Swimming"
                },
                {
                    unit: "km",
                    amount:50,
                    exerciseName: "Running"
                },
                {
                    unit: "km",
                    amount:50,
                    exerciseName: "Walking"
                }
            ]

            before(async function(){
                usersInfo = await helpers.createGoogleUsers(users, sandbox);
                await helpers.addGlobalChallenge(usersInfo[0].cookie, globalChallengeData[0]);
                await helpers.addGlobalChallenge(usersInfo[0].cookie, globalChallengeData[1]);
                await helpers.addGlobalChallenge(usersInfo[0].cookie, globalChallengeData[2]);
            })

            after(async () => {
                await helpers.deleteUsers(usersInfo);
                await helpers.clearDatabase();
            });

            it("Test exercise that does not effect the global challenge", async function(){
                let exerciseExample = {
                    loggedDate: Date.now(),
                    amount: 10,
                    exerciseName: "Baseball",
                    unit: "sec",
                    dataOrigin:"web",
                    anchor:""
                }
                await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);

                let results = await helpers.getGlobalChallenges(usersInfo[0].cookie);
                let challenge = helpers.findMatchingChallenge(results, exerciseExample);
                expect(challenge.length).to.equal(0);
            })

            it("Test exercise that does effect the global challenge", async function(){
                let exerciseExample = {
                    loggedDate: Date.now(),
                    amount: 1,
                    exerciseName: "Running",
                    unit: "km",
                    dataOrigin:"web",
                    anchor:""
                }
                await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);

                let results = await helpers.getGlobalChallenges(usersInfo[0].cookie);
                let challenge = helpers.findMatchingChallenge(results, exerciseExample);
                expect(challenge.length).to.equal(1);
                expect(challenge[0].progress).to.equal(1000);
                expect(challenge[0].completed).to.equal(false);
            });

            it("Test exercise two exercises in one global challenge", async function(){
                let exerciseExample = {
                    loggedDate: Date.now(),
                    amount: 1,
                    exerciseName: "Swimming",
                    unit: "hr",
                    dataOrigin:"web",
                    anchor:""
                }
                await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);
                await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);

                let results = await helpers.getGlobalChallenges(usersInfo[0].cookie);
                let challenge = helpers.findMatchingChallenge(results, exerciseExample);
                expect(challenge.length).to.equal(1);
                expect(challenge[0].progress).to.equal(120);
            });

            it("Test exercise completed global challenge", async function(){
                let exerciseExample = {
                    loggedDate: Date.now(),
                    amount: 60,
                    exerciseName: "Walking",
                    unit: "km",
                    dataOrigin:"web",
                    anchor:""
                }
                await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);

                let results = await helpers.getGlobalChallenges(usersInfo[0].cookie);
                let challenge = helpers.findMatchingChallenge(results, exerciseExample);
                expect(challenge.length).to.equal(1);
                expect(challenge[0].progress).to.equal(60*1000);
                expect(challenge[0].completed).to.equal(true);
            });
        });


        describe("Test Add Exercise Effect on Medals", async function(){
            let usersInfo = [];

            before(async function(){
                usersInfo = await helpers.createGoogleUsers(users, sandbox);
            })

            after(async () => {
                await helpers.deleteUsers(usersInfo);
                await helpers.clearDatabase();
            });

            it("Test exercise does not effect medals", async function () {
                let exerciseExample = {
                    loggedDate: Date.now(),
                    amount: 10,
                    exerciseName: "Baseball",
                    unit: "m",
                    dataOrigin:"web",
                    anchor:""
                }
                await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);

                let inProgressMedals = await helpers.getMedalsInProgress(usersInfo[0].cookie);
                let completeMedals = await helpers.getMedalsComplete(usersInfo[0].cookie);

                expect(inProgressMedals.length).to.equal(4);
                expect(completeMedals.length).to.equal(0);
            })

            it("Test exercise has a medal", async function () {
                let exerciseExample = {
                    loggedDate: Date.now(),
                    amount: 30,
                    exerciseName: "Swim",
                    unit: "min",
                    dataOrigin:"web",
                    anchor:""
                }
                await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);

                let inProgressMedals = await helpers.getMedalsInProgress(usersInfo[0].cookie);
                let completeMedals = await helpers.getMedalsComplete(usersInfo[0].cookie);

                expect(inProgressMedals.length).to.equal(4);
                expect(completeMedals.length).to.equal(0);
            })

            it("Test exercise completes a medal", async function () {
                let exerciseExample = {
                    loggedDate: Date.now(),
                    amount: 20,
                    exerciseName: "Running",
                    unit: "km",
                    dataOrigin:"web",
                    anchor:""
                }
                await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);

                let inProgressMedals = await helpers.getMedalsInProgress(usersInfo[0].cookie);
                let completeMedals = await helpers.getMedalsComplete(usersInfo[0].cookie);

                expect(inProgressMedals.length).to.equal(2);
                expect(completeMedals.length).to.equal(2);
            })
        });

    }); 

    describe("Test /add_exercise_list", async function(){

        describe("Test add simple sets of exercises", async function(){
            let usersInfo = [];
            let mainExerciseList = [
                {"exercise":{"exerciseName":"Bocce", "unit":"ct", "amount":10}, "loggedDate":Date.now()},
                {"exercise":{"exerciseName":"Archery", "unit":"hr", "amount":10}, "loggedDate":Date.now()},
                {"exercise":{"exerciseName":"Archery", "unit":"min", "amount":10}, "loggedDate":Date.now()}
            ]
            before(async function(){
                usersInfo = await helpers.createGoogleUsers(users, sandbox);
            })

            after(async () => {
                await helpers.deleteUsers(usersInfo);
            });

            it("Test no exercises in list", async function(){
                let exericseList = [];
                let status = await helpers.sendExerciseList(usersInfo[0].cookie, "healthConnect", Date.now() , exericseList);
                expect(status).to.equal(200);
            });
            it("Test only one exercise in list", async function(){
                let exerciseList = mainExerciseList.slice(0,1)
                let status = await helpers.sendExerciseList(usersInfo[0].cookie, "healthConnect",Date.now(), exerciseList);
                expect(status).to.equal(200);
            });
            it("Test multiple exercises in list", async function(){
                let exerciseList = mainExerciseList.slice(0,2)
                let status = await helpers.sendExerciseList(usersInfo[0].cookie, "healthConnect",Date.now(), exerciseList);
                expect(status).to.equal(200);
            });
            it("Test multiple exercises in list with overlap", async function(){
                let exerciseList = mainExerciseList.slice(0,3)
                let status = await helpers.sendExerciseList(usersInfo[0].cookie, "healthConnect", Date.now(),exerciseList);
                expect(status).to.equal(200);
            });
        });

        describe("Test effect of exercise list on challenges", async function(){
            let usersInfo = [];
            let inputData = [
                { unit: "min", amount: 3, exerciseName: "Baseball"},
                { unit: "min", amount: 4, exerciseName: "Barre"},
                { unit: "min", amount: 5, exerciseName: "Skiing"},
                { unit: "min", amount: 6, exerciseName: "Knitting"},
                { unit: "min", amount: 8, exerciseName: "Archery"},
                { unit: "min", amount: 8, exerciseName: "Bocce"},
                { unit: "min", amount: 7, exerciseName: "Bocce"}
            ]
            let mainExerciseList = [
                {"exercise":{"exerciseName":"Archery", "unit":"min", "amount":10}},
                {"exercise":{"exerciseName":"Archery", "unit":"min", "amount":4}},
                {"exercise":{"exerciseName":"Bocce", "unit":"min", "amount":4}}
            ]

            beforeEach(async function(){
                usersInfo = await helpers.createGoogleUsers(users, sandbox);
            })

            afterEach(async () => {
                await helpers.deleteUsers(usersInfo);
            });

            it("Test no exercises in list", async function(){
                await helpers.sendSelfChallengeWithData(usersInfo[0].cookie, inputData[0]);
                await helpers.sendExerciseList(usersInfo[0].cookie, "healthKit","", []);
                let challenges = await helpers.getIssuedChallenges(usersInfo[0].cookie);

                for(let i = 0; i< challenges.length; i++){
                    expect(challenges[i].progress.progress).to.equal(0);
                }
            });

            it("Test only one challenge is effected", async function(){
                await helpers.sendSelfChallengeWithData(usersInfo[0].cookie, inputData[4]);
            
                let exerciseList = mainExerciseList.slice(0,1);
                exerciseList[0].loggedDate = Date.now()
                await helpers.sendExerciseList(usersInfo[0].cookie, "healthKit","anchorEx", exerciseList);
                let challenges = await helpers.getIssuedChallenges(usersInfo[0].cookie);
                let challenge = helpers.findMatchingChallenge(challenges, inputData[4]);

                expect(challenge.length).to.equal(1);
                expect(challenge[0].progress.progress).to.equal(10);
            });

            it("Test multiple challenges effected by the same exercise", async function(){
                await helpers.sendSelfChallengeWithData(usersInfo[0].cookie, inputData[4]);
                await helpers.sendSelfChallengeWithData(usersInfo[0].cookie, inputData[4]);

                let exerciseList = mainExerciseList.slice(0,1);
                exerciseList[0].loggedDate = Date.now()
                await helpers.sendExerciseList(usersInfo[0].cookie, "healthKit","anchorEx", exerciseList);
                let challenges = await helpers.getIssuedChallenges(usersInfo[0].cookie);
                let challenge = helpers.findMatchingChallenge(challenges, inputData[4]);
                expect(challenge.length).to.equal(2);
                expect(challenge[0].progress.progress).to.equal(10);
                expect(challenge[1].progress.progress).to.equal(10);
            });

            it("Test two exercises complete a challenge exactly", async function(){
                await helpers.sendSelfChallengeWithData(usersInfo[0].cookie, inputData[5]);

                let exerciseList =  [mainExerciseList[2], mainExerciseList[2]];
                exerciseList[0].loggedDate = Date.now()
                exerciseList[1].loggedDate = Date.now()

                await helpers.sendExerciseList(usersInfo[0].cookie, "healthKit","anchorEx", exerciseList);

                let challenges = await helpers.getIssuedChallenges(usersInfo[0].cookie);
                let challenge = helpers.findMatchingChallenge(challenges, inputData[5]);
                expect(challenge.length).to.equal(1);
                expect(challenge[0].progress.progress).to.equal(8);
                expect(challenge[0].progress.completed).to.equal(true);
            });
            it("Test two exercises overcomplete a challenge", async function(){
                await helpers.sendSelfChallengeWithData(usersInfo[0].cookie, inputData[6]);

                 let exerciseList =  [mainExerciseList[2], mainExerciseList[2]];
                exerciseList[0].loggedDate = Date.now()
                exerciseList[1].loggedDate = Date.now()

                await helpers.sendExerciseList(usersInfo[0].cookie, "healthKit","anchorEx", exerciseList);
                let challenges = await helpers.getIssuedChallenges(usersInfo[0].cookie);
                let challenge = helpers.findMatchingChallenge(challenges, inputData[6]);
                expect(challenge.length).to.equal(1);
                expect(challenge[0].progress.progress).to.equal(8);
                expect(challenge[0].progress.completed).to.equal(true);
            });
            it("Test an exercise on an already completed challenge", async function(){
                await helpers.sendSelfChallengeWithData(usersInfo[0].cookie, inputData[6]);
                
                let exerciseList =  [mainExerciseList[2], mainExerciseList[2], mainExerciseList[2]];
                exerciseList[0].loggedDate = Date.now()
                exerciseList[1].loggedDate = Date.now()
                exerciseList[2].loggedDate = Date.now()
                
                await helpers.sendExerciseList(usersInfo[0].cookie, "healthKit","anchorEx", exerciseList);
                let challenges = await helpers.getIssuedChallenges(usersInfo[0].cookie);
                let challenge = helpers.findMatchingChallenge(challenges, inputData[6]);
                expect(challenge.length).to.equal(1);
                expect(challenge[0].progress.progress).to.equal(12);
                expect(challenge[0].progress.completed).to.equal(true);
            });
        });

        
        describe("Test effect of exercise list on global challenges", async function(){
            let usersInfo = [];
            let inputData = [
                { unit: "min", amount: 3, exerciseName: "Baseball"},
                { unit: "min", amount: 4, exerciseName: "Barre"},
                { unit: "min", amount: 5, exerciseName: "Skiing"},
                { unit: "min", amount: 6, exerciseName: "Knitting"},
                { unit: "min", amount: 8, exerciseName: "Archery"},
                { unit: "min", amount: 8, exerciseName: "Bocce"},
                { unit: "min", amount: 7, exerciseName: "Bocce"}
            ]
            let mainExerciseList = [
                {"exercise":{"exerciseName":"Archery", "unit":"min", "amount":10}, "loggedDate":Date.now()},
                {"exercise":{"exerciseName":"Archery", "unit":"min", "amount":4}, "loggedDate":Date.now()},
                {"exercise":{"exerciseName":"Bocce", "unit":"min", "amount":4}, "loggedDate":Date.now()}
            ]

            beforeEach(async function(){
                usersInfo = await helpers.createGoogleUsers(users, sandbox);
            })

            afterEach(async () => {
                await helpers.deleteUsers(usersInfo);
                await helpers.clearDatabase();
            });

            it("Test no exercises in list", async function(){
                await helpers.addGlobalChallenge(usersInfo[0].cookie, inputData[0]);
                await helpers.sendExerciseList(usersInfo[0].cookie, "healthKit", "anchorEx", []);
                let challenges = await helpers.getGlobalChallenges(usersInfo[0].cookie);

                for(let i = 0; i< challenges.length; i++){
                    expect(challenges[i].progress).to.equal(0);
                }
            });

            it("Test only one challenge is effected", async function(){
                await helpers.addGlobalChallenge(usersInfo[0].cookie, inputData[4]);

                let exerciseList = mainExerciseList.slice(0,1);
                exerciseList[0].loggedDate = Date.now();

                await helpers.sendExerciseList(usersInfo[0].cookie, "healthKit", "anchorEx",exerciseList);
                let challenges = await helpers.getGlobalChallenges(usersInfo[0].cookie);
                let challenge = helpers.findMatchingChallenge(challenges, inputData[4]);
                expect(challenge.length).to.equal(1);
                expect(challenge[0].progress).to.equal(10);
            });

            it("Test two exercises complete a challenge exactly", async function(){
                await helpers.addGlobalChallenge(usersInfo[0].cookie, inputData[5]);
                let exerciseList = [mainExerciseList[2], mainExerciseList[2]];
                exerciseList[0].loggedDate = Date.now();
                exerciseList[1].loggedDate = Date.now();

                await helpers.sendExerciseList(usersInfo[0].cookie, "healthKit","anchorEx", exerciseList);
                let challenges = await helpers.getGlobalChallenges(usersInfo[0].cookie);
                let challenge = helpers.findMatchingChallenge(challenges, inputData[5]);
                expect(challenge.length).to.equal(1);
                expect(challenge[0].progress).to.equal(8);
                expect(challenge[0].completed).to.equal(true);
            });

            it("Test two exercises overcomplete a challenge", async function(){
                await helpers.addGlobalChallenge(usersInfo[0].cookie, inputData[6]);

                let exerciseList =  [mainExerciseList[2], mainExerciseList[2]];
                exerciseList[0].loggedDate = Date.now();
                exerciseList[1].loggedDate = Date.now();

                await helpers.sendExerciseList(usersInfo[0].cookie, "healthKit","anchorEx", exerciseList);
                let challenges = await helpers.getGlobalChallenges(usersInfo[0].cookie);
                let challenge = helpers.findMatchingChallenge(challenges, inputData[6]);
                expect(challenge.length).to.equal(1);
                expect(challenge[0].progress).to.equal(8);
                expect(challenge[0].completed).to.equal(true);
            });
            it("Test an exercise on an already completed challenge", async function(){
                await helpers.addGlobalChallenge(usersInfo[0].cookie, inputData[6]);

                let exerciseList =  [mainExerciseList[2], mainExerciseList[2], mainExerciseList[2]];
                exerciseList[0].loggedDate = Date.now();
                exerciseList[1].loggedDate = Date.now();
                exerciseList[2].loggedDate = Date.now();


                await helpers.sendExerciseList(usersInfo[0].cookie, "healthKit", "anchorEx",exerciseList);
                let challenges = await helpers.getGlobalChallenges(usersInfo[0].cookie);
                let challenge = helpers.findMatchingChallenge(challenges, inputData[6]);
                expect(challenge.length).to.equal(1);
                expect(challenge[0].progress).to.equal(12);
                expect(challenge[0].completed).to.equal(true);
            });
        });

        

        describe("Test effect of exercise list on medals", async function(){
            let usersInfo = [];
            let potentialExercises =
            [
                {"exercise":{"exerciseName":"Running", "unit":"km", "amount":6}, "loggedDate":Date.now()},
                {"exercise":{"exerciseName":"Walking", "unit":"hr", "amount":6}, "loggedDate":Date.now()},
                {"exercise":{"exerciseName":"Swim", "unit":"hr", "amount":6}, "loggedDate":Date.now()}
            ];

            beforeEach(async function(){
                usersInfo = await helpers.createGoogleUsers(users, sandbox);
            })

            afterEach(async () => {
                await helpers.deleteUsers(usersInfo);
                await helpers.clearDatabase();
            });

            it("Test no medals are effected", async function(){
                let exerciseList = [potentialExercises[1]];
                await helpers.sendExerciseList(usersInfo[0].cookie, "healthKit","anchorEx", exerciseList);

                let inProgressMedals = await helpers.getMedalsInProgress(usersInfo[0].cookie);
                let completeMedals = await helpers.getMedalsComplete(usersInfo[0].cookie);

                expect(inProgressMedals.length).to.equal(4);
                expect(completeMedals.length).to.equal(0);
            });
            it("Test complete a medal using one exercise", async function(){
                let exerciseList = [potentialExercises[0]];
                await helpers.sendExerciseList(usersInfo[0].cookie, "healthKit","anchorEx", exerciseList);

                let inProgressMedals = await helpers.getMedalsInProgress(usersInfo[0].cookie);
                let completeMedals = await helpers.getMedalsComplete(usersInfo[0].cookie);

                expect(inProgressMedals.length).to.equal(2);
                expect(completeMedals.length).to.equal(2);
            });
            it("Test complete two types of medals", async function(){
                let exerciseList = [potentialExercises[0], potentialExercises[2]];
                await helpers.sendExerciseList(usersInfo[0].cookie, "healthKit","anchorEx", exerciseList);

                let inProgressMedals = await helpers.getMedalsInProgress(usersInfo[0].cookie);
                let completeMedals = await helpers.getMedalsComplete(usersInfo[0].cookie);

                expect(inProgressMedals.length).to.equal(0);
                expect(completeMedals.length).to.equal(4);
            });
        });



        describe("Test failures", async function(){
            let usersInfo = [];
            let potentialExercises =
            [
                {"exercise":{"exerciseName":"Running", "unit":"km", "amount":6}, "loggedDate":Date.now()},
                {"exercise":{"exerciseName":"Walking", "unit":"hr", "amount":6}, "loggedDate":Date.now()},
                {"exercise":{"exerciseName":"Swim", "unit":"hr", "amount":6}, "loggedDate":Date.now()}
            ];

            beforeEach(async function(){
                usersInfo = await helpers.createGoogleUsers(users, sandbox);
            })

            afterEach(async () => {
                await helpers.deleteUsers(usersInfo);
                await helpers.clearDatabase();
            });

            it("Test failure to add multiple exercises", async function(){
                sandbox.stub(Exercise_log, "insertMany").throws("Err - cannot insert");

                let exerciseList = [potentialExercises[0], potentialExercises[2]];
                await request.post("/exercise_log/add_exercise_list")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .send({dataOrigin: "web", exerciseList: exerciseList, uniqueExercises:[]})
                .expect(500)

                sandbox.restore()
            });
        });

        
    });
});