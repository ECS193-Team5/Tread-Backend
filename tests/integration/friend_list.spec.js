var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const mongoose = require("mongoose");
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
const googleauth = require('google-auth-library');
var helpers = require("./helperFunc");
const { expect } = require("chai");

let user1 = {
    "sub": "friend1",
    "given_name": "Clark",
    "family_name": "Kent",
}

let user2 = {
    "sub": "friend2",
    "given_name": "Bruce",
    "family_name": "Wayne",
}

let user3 = {
    "sub": "friend3",
    "given_name": "Diana",
    "family_name": "Prince",
}

let user4 = {
    "sub": "friend4",
    "given_name": "Charles",
    "family_name": "Xavier",
}


describe('Testing friend_list routes', () => {
    let cookieUser1 = "";
    let cookieUser2 = "";
    let cookieUser3 = "";
    let cookieUser4 = "";
    let username1 = "";
    let username2 = "";
    let username3 = "";
    let username4 = "";

    before(async () => {
        cookieUser1 = await helpers.createUser(user1, sandbox);
        username1 = await helpers.getUsername(cookieUser1);
        cookieUser2 = await helpers.createUser(user2, sandbox);
        username2 = await helpers.getUsername(cookieUser2);
        cookieUser3 = await helpers.createUser(user3, sandbox);
        username3 = await helpers.getUsername(cookieUser3);
        cookieUser4 = await helpers.createUser(user4, sandbox);
        username4 = await helpers.getUsername(cookieUser4);
    });

    after(async () => {
        cookieUser1 = await helpers.loginUser(user1, sandbox);
        await helpers.deleteUser(cookieUser1);
        cookieUser2 = await helpers.loginUser(user2, sandbox);
        await helpers.deleteUser(cookieUser2);
    });


    describe("Test make friends", async function () {
        it("Test send friend request", async function () {

        })

        it("Test send friend request and accept", async function () {
            
        })

        it("Test send friend request and decline", async function () {
            
        })

        it("Test send friend request and revoke", async function () {
            
        })

        it("Test send friend requests in both directions (auto-accept)", async function () {
            
        })

        it("Test send friend requests that is blocked", async function () {
            
        })

        it("Test unfriend a friend", async function () {
            
        })

        it("Test unfriend not a friend", async function () {
            
        })
    });

    describe("Test blocking and unblocking", async function () {
        it("Test block", async function () {

        })

        it("Test unblock", async function () {
            
        })

        it("Test friend, block, unblock - should no longer be friend", async function () {
            
        })

        it("Test unblock by friending someone", async function () {
            
        })

        it("Test unblock by friending someone", async function () {
            
        })
    });

    describe("Test view friends", async function () {
        it("Test view normal friends", async function () {

        })

        it("Test view normal friends with info", async function () {

        })

        it("Test view incoming friends", async function () {
            
        })

        it("Test view outgoing friend requests", async function () {
            
        })

        it("Test view pending requests - mix incoming and outgoing", async function () {
            
        })

        it("Test view pending requests - all incoming", async function () {
            
        })

        it("Test view pending requests - all outgoing", async function () {
            
        })

        it("Test view blocked people", async function () {
            
        })
    });

    describe("Test Friend Recent Activity", async function () {
        it("More than 5 Recent Activites", async function () {

        });

        it("0 Recent Activities", async function () {

        });

        it("Exactly 5 Recent Activities", async function () {

        });
    });

    describe("Test Recommended Friends", async function () {
        it("Test Situation with No Recommneded Friends", async function () {

        });

        it("Test Situation with One Recommneded Friends", async function () {

        });

        it("Test Situation with Multiple (<5) Recommended Friends", async function () {

        });

        it("Test Situation with More than 5 Recommended Friends", async function () {

        });
    });
});