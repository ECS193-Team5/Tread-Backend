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
    "sub": "stats1",
    "given_name": "Business",
    "family_name": "Proposal",
}

let user2 = {
    "sub": "stats2",
    "given_name": "Under",
    "family_name": "Umbrella",
}

describe('Testing /stats routes', async function () {
    let cookieUser1 = "";
    let cookieUser2 = "";
    let username1 = "";
    let username2 = "";
    let exerciseExample = {
        loggedDate: Date.now(),
        amount: 10,
        exerciseName: "Baseball",
        unit: "sec",
        dataOrigin:"web"
    }

    before(async function () {
        cookieUser1 = await helpers.createUser(user1, sandbox);
        username1 = await helpers.getUsername(cookieUser1);
        cookieUser2 = await helpers.createUser(user2, sandbox);
        username2 = await helpers.getUsername(cookieUser2);

        let inputData = {
            receivedUser: "self",
            issueDate: Date.now() + 1000,
            dueDate: Date.now() + 1001,
            unit: "m",
            amount: 10,
            exerciseName: "Baseball"
        }

        await request.post("/challenges/add_self_challenge")
        .set("Cookie", cookieUser2)
        .set('Accept', 'application/json')
        .send(inputData)
        .expect(200);
    })

    after(async function () {
        await helpers.deleteUser(cookieUser1);
        await helpers.deleteUser(cookieUser2);
    })

    describe("Test /get_exercise_log", async function(){
        it("Test user has no previous exercises", async function(){
            let results = await helpers.getExerciseLog(cookieUser1);
            expect(results.length).to.equal(0);
        });
        it("Test user has multiple exercises", async function(){
            await helpers.sendExercise(cookieUser1, exerciseExample);
            await helpers.sendExercise(cookieUser1, exerciseExample);
            let results = await helpers.getExerciseLog(cookieUser1);
            expect(results.length).to.equal(2);
        });
    });

    describe("Test /get_past_challenges", async function(){
        it("Test user has no past challenges", async function(){
            let results = await helpers.getPastChallenges(cookieUser1);
            expect(results.length).to.equal(0);
        });
        it("Test user has no past challenges but has a current challenge", async function(){
            await helpers.sendSelfChallenge(cookieUser1);
            let results = await helpers.getPastChallenges(cookieUser1);
            expect(results.length).to.equal(0);
        });
        it("Test user has past challenge", async function(){
            await helpers.sendSelfChallenge(cookieUser2);
            let results = await helpers.getPastChallenges(cookieUser2);
            expect(results.length).to.equal(1);

            delete results[0]._id;
            delete results[0].challengeID;
            delete results[0].issueDate;
            delete results[0].dueDate;
            delete results[0].exercise._id;

            expect(results[0]).to.deep.equal(
            {
                username: username2,
                exercise: {
                  exerciseName: 'Baseball',
                  unit: 'm',
                  amount: 10,
                  unitType: 'distance',
                  convertedAmount: 10
                },
                progress: 0,
                completed: false
            });

        });
    });

});