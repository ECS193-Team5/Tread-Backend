var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();

process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const mongoose = require('mongoose');
const app = require("../../index");
request = request(app);

var helpers = require("./postRequests");

const chai = require("chai");
const {expect} = chai;

describe('Testing /global_challenge routes', async function () {
    let usersInfo = [];
    const users = [{
        "sub": "globalChallenges1",
        "given_name": "PuriPuri",
        "family_name": "Princess",
    }, {
        "sub": "globalChallenges2",
        "given_name": "Saitama",
        "family_name": "Sensei",
    },
    {
        "sub": "globalChallenges3",
        "given_name": "Teenage",
        "family_name": "Cyborg",
    },
    {
        "sub": "globalChallenges4",
        "given_name": "Fubiki",
        "family_name": "Blizzard",
    },
    {
        "sub": "globalChallenges5",
        "given_name": "Metal",
        "family_name": "Knight",
    },
    {
        "sub": "globalChallenges6",
        "given_name": "Atomic",
        "family_name": "Samurai",
    },
    {
        "sub": "globalChallenges7",
        "given_name": "Snake",
        "family_name": "Fist",
    }];

    let globalChallengeExercise = [
    {
        unit: "km",
        amount: 5,
        exerciseName: "Running"
    },
    {
        unit: "hr",
        amount: 5,
        exerciseName: "Swimming"
    },
    ]

    before(async function () {
        usersInfo = await helpers.createUsers(users, sandbox);
    })

    afterEach(async function () {
        await helpers.clearDatabase();
    })

    after(async function (){
        await helpers.deleteUsers(usersInfo);
    })

    describe("Test /add_challenge", async function(){
        it("Test succesful creation of challenge", async function(){
            await helpers.addGlobalChallenge(usersInfo[0].cookie, globalChallengeExercise[0])
        });

        it("Test fail to create challenge", async function(){
            sandbox.stub(mongoose.Model.prototype, 'save').throws("error - cannot save");

            await request.post("/global_challenge/add_challenge")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send(globalChallengeExercise[0])
            .expect(500);

            sandbox.restore();
        });
    });

    describe("Test /get_challenges", async function(){
        beforeEach(async function(){
            await helpers.addGlobalChallenge(usersInfo[0].cookie, globalChallengeExercise[0]);
            await helpers.addGlobalChallenge(usersInfo[0].cookie, globalChallengeExercise[1]);
        })

        it("Test when user has no exercises on global challenges", async function(){
            exercise = {
                exerciseName: "Walking",
                amount: 5,
                unit:"m"
            };
            await helpers.sendExercise(usersInfo[0].cookie, );
            await helpers.sendExercise(usersInfo[0].cookie, exercise);
            let results = await helpers.getGlobalChallenges(usersInfo[0].cookie);
            expect(results.length).to.equal(2);
            helpers.expectChallengeValues(results[0], false, 0);
            helpers.expectChallengeValues(results[1], false, 0);
        });

        it("Test when user has effected one, but not all global challenges", async function(){
            let exercise = {
                exerciseName: "Running",
                amount: 5,
                unit:"m"
            };
            await helpers.sendExercise(usersInfo[0].cookie, exercise);
            let results = await helpers.getGlobalChallenges(usersInfo[0].cookie);
            expect(results.length).to.equal(2);

            let challenge = helpers.findMatchingChallenge(results, globalChallengeExercise[0]);
            helpers.expectChallengeValues(challenge[0], false, 5);
            challenge = helpers.findMatchingChallenge(results, globalChallengeExercise[1]);
            helpers.expectChallengeValues(challenge[0], false, 0);
        });

        it("Test when user has effected multiple global challenges", async function(){
            let exercises = [
                {
                    exerciseName: "Running",
                    amount: 5,
                    unit:"m"
                },
                {
                    exerciseName: "Swimming",
                    amount: 6,
                    unit:"min"
                }
            ]
            await helpers.sendExercise(usersInfo[0].cookie, exercises[0]);
            await helpers.sendExercise(usersInfo[0].cookie, exercises[1]);
            let results = await helpers.getGlobalChallenges(usersInfo[0].cookie);
            let challenge = helpers.findMatchingChallenge(results, globalChallengeExercise[0]);
            helpers.expectChallengeValues(challenge[0], false, 5);
            challenge = helpers.findMatchingChallenge(results, globalChallengeExercise[1]);
            helpers.expectChallengeValues(challenge[0], false, 6);
        });

        it("Test user completes a global challenge", async function(){
            let exercise = {
                exerciseName: "Swimming",
                amount: 10,
                unit:"hr"
            };
            await helpers.sendExercise(usersInfo[0].cookie, exercise);
            let results = await helpers.getGlobalChallenges(usersInfo[0].cookie);

            let challenge = helpers.findMatchingChallenge(results, globalChallengeExercise[0]);
            helpers.expectChallengeValues(challenge[0], false, 0);
            challenge = helpers.findMatchingChallenge(results, globalChallengeExercise[1]);
            helpers.expectChallengeValues(challenge[0], true, 600);
        });
    });

    describe("Test /get_leaderboard", async function(){
        let challenge = "";
        beforeEach(async function(){
            await helpers.addGlobalChallenge(usersInfo[0].cookie, globalChallengeExercise[0]);
            challenge = await helpers.getGlobalChallenges(usersInfo[0].cookie);
        })

        describe("Test /get_leaderboard when user is not in the leaderboard", async function(){
            it("Test /get_leaderboard when user has made an exercise before", async function(){
                await helpers.bulkUserSendExercises(usersInfo.slice(0,6), globalChallengeExercise[0]);
                let results = await helpers.getGlobalLeaderboard(usersInfo[0].cookie, challenge[0].challengeID);

                expect(results.length).to.equal(2);
                results[0].forEach((item) => {expect(item.username).to.not.equal(usersInfo[0].username)})
                expect(results[1].username).to.equal(usersInfo[0].username);
                expect(results[1].progress).to.equal(1000);
            })

            it("Test /get_leaderboard when user has not done a relevant exercise", async function(){
                await helpers.bulkUserSendExercises(usersInfo.slice(1,6), globalChallengeExercise[0]);
                let results = await helpers.getGlobalLeaderboard(usersInfo[0].cookie, challenge[0].challengeID);

                expect(results.length).to.equal(2);
                results[0].forEach((item) => {expect(item.username).to.not.equal(usersInfo[0].username)})
                expect(results[1].username).to.equal(usersInfo[0].username);
                expect(results[1].progress).to.equal(0);
            })

        })

        describe("Test /get_leaderboard when user is in the leaderboard", async function(){
            it("Test when leaderboard is less than five people", async function(){
                await helpers.bulkUserSendExercises(usersInfo.slice(0,4), globalChallengeExercise[0]);
                let results = await helpers.getGlobalLeaderboard(usersInfo[0].cookie, challenge[0].challengeID);

                expect(results.length).to.equal(2);
                expect(results[0][3].username).to.equal(usersInfo[0].username);
                expect(results[1].username).to.equal(usersInfo[0].username);
                expect(results[1].progress).to.equal(1000);
            });
            it("Test when leaderboard is exactly five people and user is fifth", async function(){
                await helpers.bulkUserSendExercises(usersInfo.slice(0,5), globalChallengeExercise[0]);
                let results = await helpers.getGlobalLeaderboard(usersInfo[0].cookie, challenge[0].challengeID);

                expect(results.length).to.equal(2);
                expect(results[0][4].username).to.equal(usersInfo[0].username);
                expect(results[1].username).to.equal(usersInfo[0].username);
                expect(results[1].progress).to.equal(1000);
            });
            it("Test when leaderboard is more than five people", async function(){
                await helpers.sendExercise(usersInfo[0].cookie,     {
                    unit: "km",
                    amount: 30,
                    exerciseName: "Running"
                });
                await helpers.bulkUserSendExercises(usersInfo.slice(1,7), globalChallengeExercise[0]);
                let results = await helpers.getGlobalLeaderboard(usersInfo[0].cookie, challenge[0].challengeID);

                expect(results.length).to.equal(2);
                expect(results[0][0].username).to.equal(usersInfo[0].username);
                expect(results[1].username).to.equal(usersInfo[0].username);
                expect(results[1].progress).to.equal(30000);
            });
        })
    });
});