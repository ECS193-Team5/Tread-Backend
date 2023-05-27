var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
request = request(app);
var helpers = require("./postRequests");
const chai = require("chai");
const {expect, assert} = chai;




describe('Testing /data_orign/get_origin_anchor', async function () {
    let usersInfo = [];
    let users = [{
        "sub": "data1",
        "given_name": "Ash",
        "family_name": "Ketchum",
    }, {
        "sub": "data2",
        "given_name": "Misty",
        "family_name": "Williams",
    }]

    before(async function () {
        usersInfo = await helpers.createGoogleUsers(users, sandbox);
    })

    after(async function () {
        usersInfo = await helpers.deleteUsers(usersInfo);
    })

    describe("Test data origin if the user has never logged in before", async function(){
        it("Test web", async function(){
            let results = await helpers.getDataOriginLastDate(usersInfo[0].cookie, "none");
            expect(results).to.be.a("null");
        })

        it("Test healthConnect", async function(){
            let results = await helpers.getDataOriginLastDate(usersInfo[0].cookie, "healthConnect");
            expect(results).to.be.a("null");
        })

        it("Test healthKit", async function(){
            let results = await helpers.getDataOriginLastDate(usersInfo[0].cookie, "healthKit");
            expect(results).to.be.a("null");
        })
    })

    describe("Test data origin if the user has logged an exercise", async function(){
        it("Test healthConnect", async function(){
            let startTime = Date.now();
            let exerciseExample = {
                loggedDate: Date.now(),

                exercise:{
                    exerciseName: "Baseball",
                    unit: "m",
                    amount: 10,
                    },
                    dataOrigin:"healthConnect"

            }
            await helpers.sendExerciseList(usersInfo[0].cookie,"healthConnect", Date.now(), [exerciseExample] );
            let results = await helpers.getDataOriginLastDate(usersInfo[0].cookie, "healthConnect");
            let endTime = Date.now();
            expect(Date.parse(results.healthConnectAnchor)).to.be.greaterThanOrEqual(startTime);
            expect(Date.parse(results.healthConnectAnchor)).to.be.lessThanOrEqual(endTime);
        })

        it("Test healthKit", async function(){
            let exerciseExample = {
                loggedDate: Date.now(),

                exercise:{
                exerciseName: "Baseball",
                unit: "m",
                amount: 10,
                },
                dataOrigin:"healthKit"
            }
            await helpers.sendExerciseList(usersInfo[0].cookie,"healthKit", "exampleAnchor", [exerciseExample] );
            let results = await helpers.getDataOriginLastDate(usersInfo[0].cookie, "healthKit");
            expect(results.healthKitAnchor).to.equal("exampleAnchor");
        })

        it("Test none", async function(){
            let exerciseExample = {
                loggedDate: Date.now(),
                amount: 10,
                exerciseName: "Baseball",
                unit: "m"
            }
            await helpers.sendExercise(usersInfo[0].cookie, exerciseExample);
            let results = await helpers.getDataOriginLastDate(usersInfo[0].cookie, "");
            expect(results).to.deep.equal({});
        })
    })

});