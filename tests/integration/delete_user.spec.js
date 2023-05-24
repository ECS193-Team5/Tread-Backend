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




describe('Testing /delete_user routes', async function () {
    let usersInfo = [];
    let users = [{
        "sub": "deleteUser1",
        "given_name": "Ash",
        "family_name": "Ketchum",
    }, {
        "sub": "deleteUser1",
        "given_name": "Misty",
        "family_name": "Williams",
    }]

    before(async function () {
        usersInfo = await helpers.createUsers(users, sandbox);
    })

    it("Test delete user succeeds", async function(){
        let status = await helpers.deleteUser(usersInfo[0].cookie);
        expect(status).to.equal(200);
    })

    it("Test delete user fails", async function(){
        let status = await helpers.deleteUser("");
        expect(status).to.equal(401);
    });

    it("Test delete user fails by deleting the same user", async function(){
        let status = await helpers.deleteUser(usersInfo[0].cookie);
        expect(status).to.equal(401);
    });

    it("Test delete user fails by failure of deleteMany", async function(){
        deleteStub = sandbox.stub(mongoose.Model, "deleteMany").throws("Err - cannot delete");
        let status = await helpers.deleteUser(usersInfo[1].cookie);
        expect(status).to.equal(500);
        sandbox.restore();
        status = await helpers.deleteUser(usersInfo[1].cookie);
        expect(status).to.equal(200);
    });
});