/*var request = require("supertest");
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
    "sub": "deleteUser1",
    "given_name": "Ash",
    "family_name": "Ketchum",
}

let user2 = {
    "sub": "deleteUser1",
    "given_name": "Misty",
    "family_name": "Williams",
}


describe('Testing /data_origin/', async function () {
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

    after(async function(){
        await helpers.deleteUser(cookieUser1);
        await helpers.deleteUser(cookieUser2);
    })

    it("Test get data origin succeeds on web", async function(){

        let dataOrigin = await helpers.getDataOriginLastDate(cookieUser1, "web");
        console.log(dataOrigin);
    })



});*/