var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const mongoose = require("mongoose");
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
request = request(app);
const googleauth = require('google-auth-library');
var helpers = require("./helperFunc");
const chai = require("chai");
const deepEqualInAnyOrder = require('deep-equal-in-any-order');
chai.use(deepEqualInAnyOrder);
const {expect} = chai;

let user1 = {
    "sub": "exercise1",
    "given_name": "Martha",
    "family_name": "Maple",
}

let user2 = {
    "sub": "exercise1",
    "given_name": "Hercule",
    "family_name": "Poirot",
}
const LOGGED_TIMESTAMP_EXAMPLE = 1684630800000;

describe('Testing exercise_log_routes', () => {
    describe("Test add one exercise", async function(){
        describe("Test add simple, single exercise", async function () {
            let cookieUser1 = "";
            let username1 = "";

            before(async function(){
                cookieUser1 = await helpers.createUser(user1, sandbox);
                username1 = await helpers.getUsername(cookieUser1);
            })

            after(async () => {
                await helpers.deleteUser(cookieUser1);
            });

            it("Test add a single, working exercise", async function () {
                let exerciseExample = {
                    loggedDate: LOGGED_TIMESTAMP_EXAMPLE,
                    amount: 10,
                    exerciseName: "Basketball",
                    unit: "m",
                    dataOrigin:"web"
                }

                await request.post("/exercise_log/add")
                    .set("Cookie", cookieUser1)
                    .set('Accept', 'application/json')
                    .send(exerciseExample)
                    .expect(200);
            })

            it("Test add an exercise that is missing amount", async function () {
                let exerciseExample = {
                    loggedDate: LOGGED_TIMESTAMP_EXAMPLE,
                    exerciseName: "Basketball",
                    unit: "m",
                    dataOrigin:"web"
                }

                await request.post("/exercise_log/add")
                    .set("Cookie", cookieUser1)
                    .set('Accept', 'application/json')
                    .send(exerciseExample)
                    .expect(500);
            })

            it("Test add an exercise that doesn't have a valid unit", async function () {
                let exerciseExample = {
                    loggedDate: LOGGED_TIMESTAMP_EXAMPLE,
                    exerciseName: "Basketball",
                    unit: "mir",
                    dataOrigin:"web",
                    amount: 10
                }

                await request.post("/exercise_log/add")
                    .set("Cookie", cookieUser1)
                    .set('Accept', 'application/json')
                    .send(exerciseExample)
                    .expect(500);
            })
        });

        describe("Test challenge updates", async function () {
            describe("Test exercise does not effect a challenge", async function(){
                let cookieUser1 = "";
                let username1 = "";

                before(async function(){
                    cookieUser1 = await helpers.createUser(user1, sandbox);
                    username1 = await helpers.getUsername(cookieUser1);
                    let inputData = {
                        unit: "sec",
                        amount:50,
                        exerciseName: "Baseball"
                    }
                    await helpers.sendSelfChallengeWithData(cookieUser1, inputData);
                })

                after(async () => {
                    await helpers.deleteUser(cookieUser1);
                });

                it("Test add one exercise that does not effect a challenge because the units do not match", async function () {
                    let exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 10,
                        exerciseName: "Baseball",
                        unit: "m",
                        dataOrigin:"web"
                    }
                    await helpers.sendExercise(cookieUser1, exerciseExample);

                    let results = await helpers.getIssuedChallenges(cookieUser1);
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
                    await helpers.sendExercise(cookieUser1, exerciseExample);

                    let results = await helpers.getIssuedChallenges(cookieUser1);
                    expect(results.length).to.equal(1);
                    expect(results[0].progress.progress).to.equal(0);
                })
            })

            describe("Test exercise updates a challenge", async function(){
                let cookieUser1 = "";
                let username1 = "";
                let inputData = [
                    {
                        unit: "sec",
                        amount:50,
                        exerciseName: "Baseball"
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
                    }
                ]
                before(async function(){
                    cookieUser1 = await helpers.createUser(user1, sandbox);
                    username1 = await helpers.getUsername(cookieUser1);
                    await helpers.sendSelfChallengeWithData(cookieUser1, inputData[0]);
                    await helpers.sendSelfChallengeWithData(cookieUser1, inputData[1]);
                    await helpers.sendSelfChallengeWithData(cookieUser1, inputData[2]);
                    await helpers.sendSelfChallengeWithData(cookieUser1, inputData[3]);
                    await helpers.sendSelfChallengeWithData(cookieUser1, inputData[4]);
                    await helpers.sendSelfChallengeWithData(cookieUser1, inputData[5]);
                })

                after(async () => {
                    await helpers.deleteUser(cookieUser1);
                });

                it("Test add one exercise that updates one challenge with the same exact unit", async function () {
                    let exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 10,
                        exerciseName: "Baseball",
                        unit: "sec",
                        dataOrigin:"web"
                    }
                    await helpers.sendExercise(cookieUser1, exerciseExample);

                    let results = await helpers.getIssuedChallenges(cookieUser1);
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
                        dataOrigin:"web"
                    }
                    await helpers.sendExercise(cookieUser1, exerciseExample);

                    let results = await helpers.getIssuedChallenges(cookieUser1);
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
                        dataOrigin:"web"
                    }
                    await helpers.sendExercise(cookieUser1, exerciseExample);

                    let results = await helpers.getIssuedChallenges(cookieUser1);
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
                        dataOrigin:"web"
                    }
                    await helpers.sendExercise(cookieUser1, exerciseExample);

                    let results = await helpers.getIssuedChallenges(cookieUser1);
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
                        dataOrigin:"web"
                    }
                    await helpers.sendExercise(cookieUser1, exerciseExample);
                    exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 3,
                        exerciseName: "Bocce",
                        unit: "min",
                        dataOrigin:"web"
                    }
                    await helpers.sendExercise(cookieUser1, exerciseExample);

                    let results = await helpers.getIssuedChallenges(cookieUser1);
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
                        dataOrigin:"web"
                    }
                    await helpers.sendExercise(cookieUser1, exerciseExample);
                    exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 3,
                        exerciseName: "Skiing",
                        unit: "min",
                        dataOrigin:"web"
                    }
                    await helpers.sendExercise(cookieUser1, exerciseExample);

                    let results = await helpers.getIssuedChallenges(cookieUser1);
                    let challenge = helpers.findMatchingChallenge(results, inputData[5]);
                    expect(challenge[0].progress.progress).to.equal(6);
                    expect(challenge[0].progress.completed).to.equal(false);
                    expect(challenge.length).to.equal(1);
                })
                //TODO
                /*it("Test an exercise on an already completed challenge", async function(){});*/
            });

            describe("Test exercise updates multiple challenges", async function (){
                let cookieUser1 = "";
                let username1 = "";
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
                    cookieUser1 = await helpers.createUser(user1, sandbox);
                    username1 = await helpers.getUsername(cookieUser1);
                    await helpers.sendSelfChallengeWithData(cookieUser1, inputData[0]);
                    await helpers.sendSelfChallengeWithData(cookieUser1, inputData[1]);
                })

                after(async () => {
                    await helpers.deleteUser(cookieUser1);
                });

                it("Test add one exercise that updates multiple challenges", async function () {
                    let exerciseExample = {
                        loggedDate: Date.now(),
                        amount: 1,
                        exerciseName: "Baseball",
                        unit: "hr",
                        dataOrigin:"web"
                    }
                    await helpers.sendExercise(cookieUser1, exerciseExample);

                    let results = await helpers.getIssuedChallenges(cookieUser1);
                    expect(results.length).to.equal(2);
                    expect(results[0].progress.progress).to.equal(60);
                    expect(results[1].progress.progress).to.equal(60);

                })
            })
        });

        describe("Test global challenges updates", async function(){
            let cookieUser1 = "";
            let username1 = "";
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
                cookieUser1 = await helpers.createUser(user1, sandbox);
                username1 = await helpers.getUsername(cookieUser1);
                await helpers.addGlobalChallenge(cookieUser1, globalChallengeData[0]);
                await helpers.addGlobalChallenge(cookieUser1, globalChallengeData[1]);
                await helpers.addGlobalChallenge(cookieUser1, globalChallengeData[2]);
            })

            after(async () => {
                await helpers.deleteUser(cookieUser1);
                await helpers.clearDatabase();
            });

            it("Test exercise that does not effect the global challenge", async function(){
                let exerciseExample = {
                    loggedDate: Date.now(),
                    amount: 10,
                    exerciseName: "Baseball",
                    unit: "sec",
                    dataOrigin:"web"
                }
                await helpers.sendExercise(cookieUser1, exerciseExample);

                let results = await helpers.getGlobalChallenges(cookieUser1);
                let challenge = helpers.findMatchingChallenge(results, exerciseExample);
                expect(challenge.length).to.equal(0);
            })

            it("Test exercise that does effect the global challenge", async function(){
                let exerciseExample = {
                    loggedDate: Date.now(),
                    amount: 1,
                    exerciseName: "Running",
                    unit: "km",
                    dataOrigin:"web"
                }
                await helpers.sendExercise(cookieUser1, exerciseExample);

                let results = await helpers.getGlobalChallenges(cookieUser1);
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
                    dataOrigin:"web"
                }
                await helpers.sendExercise(cookieUser1, exerciseExample);
                await helpers.sendExercise(cookieUser1, exerciseExample);

                let results = await helpers.getGlobalChallenges(cookieUser1);
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
                    dataOrigin:"web"
                }
                await helpers.sendExercise(cookieUser1, exerciseExample);

                let results = await helpers.getGlobalChallenges(cookieUser1);
                let challenge = helpers.findMatchingChallenge(results, exerciseExample);
                expect(challenge.length).to.equal(1);
                expect(challenge[0].progress).to.equal(60*1000);
                expect(challenge[0].completed).to.equal(true);
            });
        });

        describe("Test Add Exercise Effect on Medals", async function(){
            let cookieUser1 = "";
            let username1 = "";
            let cookieUser2 = "";
            let username2 = "";

            before(async function(){
                cookieUser1 = await helpers.createUser(user1, sandbox);
                username1 = await helpers.getUsername(cookieUser1);
            })

            after(async () => {
                await helpers.deleteUser(cookieUser1);
                await helpers.clearDatabase();
            });

            it("Test exercise does not effect medals", async function () {
                let exerciseExample = {
                    loggedDate: Date.now(),
                    amount: 10,
                    exerciseName: "Baseball",
                    unit: "m",
                    dataOrigin:"web"
                }
                await helpers.sendExercise(cookieUser1, exerciseExample);

                let inProgressMedals = await helpers.getMedalsInProgress(cookieUser1);
                let completeMedals = await helpers.getMedalsComplete(cookieUser1);

                expect(inProgressMedals.length).to.equal(4);
                expect(completeMedals.length).to.equal(0);
            })

            it("Test exercise has a medal", async function () {
                let exerciseExample = {
                    loggedDate: Date.now(),
                    amount: 30,
                    exerciseName: "Swim",
                    unit: "min",
                    dataOrigin:"web"
                }
                await helpers.sendExercise(cookieUser1, exerciseExample);

                let inProgressMedals = await helpers.getMedalsInProgress(cookieUser1);
                let completeMedals = await helpers.getMedalsComplete(cookieUser1);

                expect(inProgressMedals.length).to.equal(4);
                expect(completeMedals.length).to.equal(0);
            })

            it("Test exercise completes a medal", async function () {
                let exerciseExample = {
                    loggedDate: Date.now(),
                    amount: 20,
                    exerciseName: "Running",
                    unit: "km",
                    dataOrigin:"web"
                }
                await helpers.sendExercise(cookieUser1, exerciseExample);

                let inProgressMedals = await helpers.getMedalsInProgress(cookieUser1);
                let completeMedals = await helpers.getMedalsComplete(cookieUser1);

                expect(inProgressMedals.length).to.equal(2);
                expect(completeMedals.length).to.equal(2);
            })
        });
    });

    /*describe("Test /add_exercise_list", async function(){
        describe("Test add simple sets of exercises", async function(){
            it("Test no exercises in list", async function(){});
            it("Test only one exercise in list", async function(){});
            it("Test multiple exercises in list", async function(){});
            it("Test one failing exercise", async function(){});
            it("Test list includes one failing exercise", async function(){});
        });


        describe("Test effect of exercise list on challenges", async function(){
            it("Test no exercises in list", async function(){});
            it("Test only one challenge is effected", async function(){});
            it("Test multiple challenges effected by the same exercise", async function(){});
            it("Test two exercises affecting the same challenge", async function(){});
            it("Test two exercises complete a challenge exactly", async function(){});
            it("Test two exercises overcomplete a challenge", async function(){});
            it("Test an exercise on an already completed challenge", async function(){});
        });

        describe("Test effect of exercise list on global challenges", async function(){
            it("Test no exercises in list", async function(){});
            it("Test only one challenge is effected", async function(){});
            it("Test multiple challenges effected by the same exercise", async function(){});
            it("Test two exercises affecting the same challenge", async function(){});
            it("Test two exercises complete a challenge exactly", async function(){});
            it("Test two exercises overcomplete a challenge", async function(){});
            it("Test an exercise on an already completed challenge", async function(){});
        });

        describe("Test effect of exercise list on medals", async function(){
            it("Test no medals are effected", async function(){});
            it("Test complete a medal using one exercise", async function(){});
            it("Test complete a medal using two exercises", async function(){});
            it("Test complete more than one type of medal", async function(){});
        });
    });*/
});