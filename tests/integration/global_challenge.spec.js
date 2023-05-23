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
chai.use(deepEqualInAnyOrder);
const {expect} = chai;

let user1 = {
    "sub": "globalChallenges1",
    "given_name": "Puri Puri",
    "family_name": "Princess",
}

let user2 = {
    "sub": "globalChallenges2",
    "given_name": "Saitama",
    "family_name": "Sensei",
}



describe('Testing /global_challenge routes', async function () {
    let cookieUser1 = "";
    let cookieUser2 = "";
    let username1 = "";
    let username2 = "";

    before(async function () {
        cookieUser1 = await helpers.createUser(user1, sandbox);
        username1 = await helpers.getUsername(cookieUser1);
        cookieUser2 = await helpers.createUser(user2, sandbox);
        username2 = await helpers.getUsername(cookieUser2);
    })

    after(async function () {
        await helpers.deleteUser(cookieUser1);
        await helpers.deleteUser(cookieUser2);
    })

    describe("Test /add_challenge", async function(){
        it("Test succesful creation of challenge", async function(){});
        it("Test fail to create challenge", async function(){});
    });

    describe("Test /get_challenges", async function(){
        it("Test when user has no exercises on global challenges", async function(){});
        it("Test when user has effected one, but not all global challenges", async function(){});
        it("Test when user has effected multiple global challenges", async function(){});
    });

    describe("Test /get_leaderboard", async function(){
        describe("Test /get_leaderboard when user is not in the leaderboard", async function(){
            it("Test when leaderboard is exactly six people", async function(){});
            it("Test when leaderboard is more than six people", async function(){});
        })

        describe("Test /get_leaderboard when user is in the leaderboard", async function(){
            it("Test when leaderboard is less than five people", async function(){});
            it("Test when leaderboard is exactly five people", async function(){});
            it("Test when leaderboard is more than five people", async function(){});
        })
    });
});