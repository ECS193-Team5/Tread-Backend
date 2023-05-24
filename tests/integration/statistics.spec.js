var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();

process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
request = request(app);

var helpers = require("./postRequests");
const chai = require("chai");
const deepEqualInAnyOrder = require('deep-equal-in-any-order');
chai.use(deepEqualInAnyOrder);
const { expect } = chai;

describe('Testing /stats routes', async function () {
    let usersInfo = [];
    let exerciseExample = {
        loggedDate: Date.now(),
        amount: 10,
        exerciseName: "Baseball",
        unit: "sec",
        dataOrigin: "web"
    }

    let users = [{
        "sub": "stats1",
        "given_name": "Business",
        "family_name": "Proposal",
    }, {
        "sub": "stats2",
        "given_name": "Under",
        "family_name": "Umbrella",
    }];

    beforeEach(async function () {
        usersInfo = await helpers.createUsers(users, sandbox);

        let inputData = {
            receivedUser: "self",
            issueDate: Date.now() + 1000,
            dueDate: Date.now() + 1001,
            unit: "m",
            amount: 10,
            exerciseName: "Baseball"
        }

        await request.post("/challenges/add_self_challenge")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send(inputData)
            .expect(200);
    })

    afterEach(async function () {
        await helpers.deleteUsers(usersInfo);
    })

    describe("Test /get_exercise_log", async function () {
        it("Test user has no previous exercises", async function () {
            let results = await helpers.getExerciseLog(usersInfo[0].cookie);
            expect(results.length).to.equal(0);
        });

        it("Test user has had multiple previous exercises", async function () {
            await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);
            await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);
            let results = await helpers.getExerciseLog(usersInfo[0].cookie);
            results = helpers.cleanRecentResults(results);
            expect(results).to.deep.equal([
                {
                    username: usersInfo[0].username,
                    exerciseName: 'Baseball',
                    unit: 'sec',
                    amount: 10,
                },
                {
                    username: usersInfo[0].username,
                    exerciseName: 'Baseball',
                    unit: 'sec',
                    amount: 10,
                }]);
            expect(results.length).to.equal(2);
        });
    });

    describe("Test /get_past_challenges", async function () {
        it("Test user has had no past challenges", async function () {
            let results = await helpers.getPastChallenges(usersInfo[0].cookie);
            expect(results.length).to.equal(0);
        });

        it("Test user has had no past challenges but has a current challenge", async function () {
            await helpers.sendSelfChallenge(usersInfo[0].cookie);
            let results = await helpers.getPastChallenges(usersInfo[0].cookie);
            expect(results.length).to.equal(0);
        });

        it("Test user has had a past challenge", async function () {
            await helpers.delay(1001)
            let results = await helpers.getPastChallenges(usersInfo[1].cookie);
            expect(results.length).to.equal(1);

            delete results[0]._id;
            delete results[0].challengeID;
            delete results[0].issueDate;
            delete results[0].dueDate;
            delete results[0].exercise._id;

            expect(results[0]).to.deep.equal(
                {
                    username: usersInfo[1].username,
                    exercise: {
                        exerciseName: 'Baseball',
                        unit: 'm',
                        amount: 10,
                        unitType: 'distance',
                        convertedAmount: 10
                    },
                    progress: 0,
                    completed: false
                }
            );
        });
    });

});