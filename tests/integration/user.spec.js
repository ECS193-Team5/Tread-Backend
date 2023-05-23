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
    "sub": "user1",
    "given_name": "Pinkie",
    "family_name": "Pie",
}

let user2 = {
    "sub": "user2",
    "given_name": "Rainbow",
    "family_name": "Dash",
}


describe('Testing user routes', async function () {
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

    describe("Test check username", async function(){
        it("Username should not exist", async function(){
            let ifUserExist = await helpers.checkUserExist(cookieUser1, "fakseUser");
            expect(ifUserExist).to.equal(false);
        });

        it("Username does exist and it is myself", async function(){
            let ifUserExist = await helpers.checkUserExist(cookieUser1, username1);
            expect(ifUserExist).to.equal(true);
        });

        it("Username does exist and it is not myself", async function(){
            let ifUserExist = await helpers.checkUserExist(cookieUser1, username2);
            expect(ifUserExist).to.equal(true);
        });
    });

    describe("Get display_name of user", async function(){
        it("Test for user1", async function(){
            let displayName = await helpers.getDisplayName(cookieUser1);
            expect(displayName.displayName).to.equal(user1.given_name);
        })

        it("Test for user2", async function(){
            let displayName = await helpers.getDisplayName(cookieUser2);
            expect(displayName.displayName).to.equal(user2.given_name);
        })
    })

    describe("Get username of user", async function(){
        it("Test for user1", async function(){
            let username = await helpers.getUsername(cookieUser1);
            expect(username).to.equal(username1);
        })

        it("Test for user2", async function(){
            let username = await helpers.getUsername(cookieUser2);
            expect(username).to.equal(username2);
        })
    });

    describe("Test update picture", async function(){
        it("Test give png", async function(){
            let status = await helpers.updatePicture(cookieUser1, "https://i.imgur.com/sXwXq45.png");
            expect(status).to.equal(200);
        })

        it("Test give no photo", async function(){
            let status = await helpers.updatePicture(cookieUser1, "");
            expect(status).to.equal(200);
        })

        it("Stub upload erorr", async function(){
            let status = await helpers.updatePicture(cookieUser1, "image");
            expect(status).to.equal(400);
        })
    })

    describe("Test update display name", async function(){
        it("Test give valid display name", async function(){
            let status = await helpers.updateDisplayName(cookieUser1, "NewCoolName");
            expect(status).to.equal(200);
            let displayName = await helpers.getDisplayName(cookieUser1);
            expect(displayName.displayName).to.equal("NewCoolName");
        })

        it("Test give no display name", async function(){
            let status = await helpers.updateDisplayName(cookieUser2, "");
            expect(status).to.equal(200);
            let displayName = await helpers.getDisplayName(cookieUser2);
            expect(displayName.displayName).to.equal(user2.given_name);
        })

        it("Test give invalid display name", async function(){
            let status = await helpers.updateDisplayName(cookieUser2, "This name is too long for the display name. Too many char.");
            expect(status).to.equal(400);
            let displayName = await helpers.getDisplayName(cookieUser2);
            expect(displayName.displayName).to.equal(user2.given_name);
        })

    })
});