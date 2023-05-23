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
    "sub": "deleteUser1",
    "given_name": "Ash",
    "family_name": "Ketchum",
}

let user2 = {
    "sub": "deleteUser1",
    "given_name": "Misty",
    "family_name": "Williams",
}


describe('Testing delete user routes', async function () {
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

    it("Test delete user succeeds", async function(){
        let status = await helpers.deleteUser(cookieUser1);
        expect(status).to.equal(200);
    })

    it("Test delete user fails", async function(){
        let status = await helpers.deleteUser("");
        expect(status).to.equal(401);
    });

    it("Test delete user fails by deleting the same user", async function(){
        let status = await helpers.deleteUser(cookieUser1);
        expect(status).to.equal(401);
    });

    it("Test delete user fails by failure of internal func", async function(){
        deleteStub = sandbox.stub(mongoose.Model, "deleteMany").throws("Err - cannot delete");
        let status = await helpers.deleteUser(cookieUser2);
        expect(status).to.equal(500);
        sandbox.restore();
        status = await helpers.deleteUser(cookieUser2);
        expect(status).to.equal(200);
    });


});