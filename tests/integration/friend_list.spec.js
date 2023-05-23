var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const mongoose = require("mongoose");
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
const googleauth = require('google-auth-library');
var helpers = require("./helperFunc");
const chai = require("chai");
const deepEqualInAnyOrder = require('deep-equal-in-any-order');
chai.use(deepEqualInAnyOrder);
const {expect} = chai;
const { EXPORTDECLARATION_TYPES } = require("@babel/types");
const { async } = require("@firebase/util");

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
    describe("Test make friends", async function () {
        let cookieUser1 = "";
        let cookieUser2 = "";
        let username1 = "";
        let username2 = "";

        before(async function(){
            cookieUser1 = await helpers.createUser(user1, sandbox);
            username1 = await helpers.getUsername(cookieUser1);
            cookieUser2 = await helpers.createUser(user2, sandbox);
            username2 = await helpers.getUsername(cookieUser2);
        })

        after(async () => {
            await helpers.deleteUser(cookieUser1);
            await helpers.deleteUser(cookieUser2);
        });
        beforeEach(async function(){
            // User 1 sends User 2 a friend Request
            await helpers.sendFriendRequest(cookieUser1, username2);
        });

        afterEach(async function(){
            await helpers.revokeFriendRequest(cookieUser1, username2);
            await helpers.revokeFriendRequest(cookieUser2, username1);
            await helpers.unFriend(cookieUser1, username2);
            await helpers.unBlockFriend(cookieUser1, username2);
            await helpers.unBlockFriend(cookieUser2, username1);
        })

        it("Test send friend request", async function () {
            let sentRequests = await helpers.getSentFriendRequests(cookieUser1);
            let receivedRequests = await helpers.getReceivedFriendRequests(cookieUser2);

            expect(sentRequests[0].username).to.equal(username2);
            expect(sentRequests.length).to.equal(1);

            expect(receivedRequests[0].username).to.equal(username1);
            expect(receivedRequests.length).to.equal(1);
        })

        it("Test send friend request and accept", async function () {
            await helpers.acceptFriendRequest(cookieUser2, username1);

            let sentRequests = await helpers.getSentFriendRequests(cookieUser1);
            let receivedRequests = await helpers.getReceivedFriendRequests(cookieUser2);
            let friendList1 = await helpers.getFriendList(cookieUser1);
            let friendList2 = await helpers.getFriendList(cookieUser2);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
            expect(friendList1.length).to.equal(1);
            expect(friendList2.length).to.equal(1);
            expect(friendList1[0]).to.equal(username2);
            expect(friendList2[0]).to.equal(username1);
        })

        it("Test send friend request and decline", async function () {
            await helpers.declineFriendRequest(cookieUser2, username1);

            let sentRequests = await helpers.getSentFriendRequests(cookieUser1);
            let receivedRequests = await helpers.getReceivedFriendRequests(cookieUser2);
            let friendList1 = await helpers.getFriendList(cookieUser1);
            let friendList2 = await helpers.getFriendList(cookieUser2);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
            expect(friendList1.length).to.equal(0);
            expect(friendList2.length).to.equal(0);
        })

        it("Test send friend request and revoke", async function () {
            await helpers.revokeFriendRequest(cookieUser1, username2);

            let sentRequests = await helpers.getSentFriendRequests(cookieUser1);
            let receivedRequests = await helpers.getReceivedFriendRequests(cookieUser2);
            let friendList1 = await helpers.getFriendList(cookieUser1);
            let friendList2 = await helpers.getFriendList(cookieUser2);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
            expect(friendList1.length).to.equal(0);
            expect(friendList2.length).to.equal(0);

        })

        it("Test send friend requests in both directions (auto-accept)", async function () {
            await helpers.sendFriendRequest(cookieUser2, username1);

            let sentRequests = await helpers.getSentFriendRequests(cookieUser1);
            let receivedRequests = await helpers.getReceivedFriendRequests(cookieUser2);
            let friendList1 = await helpers.getFriendList(cookieUser1);
            let friendList2 = await helpers.getFriendList(cookieUser2);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
            expect(friendList1.length).to.equal(1);
            expect(friendList2.length).to.equal(1);
            expect(friendList1[0]).to.equal(username2);
            expect(friendList2[0]).to.equal(username1);
        })

        it("Test send friend requests that is blocked", async function () {
            // User 2 blocked User 1
            await helpers.blockFriend(cookieUser2, username1);

            // User 1 sends a friend request
            await helpers.sendFriendRequest(cookieUser1, username2);

            let sentRequests = await helpers.getSentFriendRequests(cookieUser1);
            let receivedRequests = await helpers.getReceivedFriendRequests(cookieUser2);
            let friendList1 = await helpers.getFriendList(cookieUser1);
            let friendList2 = await helpers.getFriendList(cookieUser2);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
            expect(friendList1.length).to.equal(0);
            expect(friendList2.length).to.equal(0);
        })

        it("Test send friend requests to user I blocked", async function () {
            // User 1 blocked User 2, then sends a friend request
            await helpers.revokeFriendRequest(cookieUser1, username2);
            await helpers.blockFriend(cookieUser1, username2);
            await helpers.sendFriendRequest(cookieUser1, username2);

            let sentRequests = await helpers.getSentFriendRequests(cookieUser1);
            let receivedRequests = await helpers.getReceivedFriendRequests(cookieUser2);

            expect(sentRequests[0].username).to.equal(username2);
            expect(sentRequests.length).to.equal(1);

            expect(receivedRequests[0].username).to.equal(username1);
            expect(receivedRequests.length).to.equal(1);
        })

        it("Test unfriend a friend", async function () {
            await helpers.sendFriendRequest(cookieUser2, username1);
            await helpers.unFriend(cookieUser1, username2);

            let sentRequests = await helpers.getSentFriendRequests(cookieUser1);
            let receivedRequests = await helpers.getReceivedFriendRequests(cookieUser2);
            let friendList1 = await helpers.getFriendList(cookieUser1);
            let friendList2 = await helpers.getFriendList(cookieUser2);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
            expect(friendList1.length).to.equal(0);
            expect(friendList2.length).to.equal(0);
        })

        it("Test unfriend not a friend", async function () {
            await helpers.unFriend(cookieUser1, username2);

            let sentRequests = await helpers.getSentFriendRequests(cookieUser1);
            let receivedRequests = await helpers.getReceivedFriendRequests(cookieUser2);
            let friendList1 = await helpers.getFriendList(cookieUser1);
            let friendList2 = await helpers.getFriendList(cookieUser2);

            expect(sentRequests.length).to.equal(1);
            expect(receivedRequests.length).to.equal(1);
            expect(sentRequests[0].username).to.equal(username2);
            expect(receivedRequests[0].username).to.equal(username1);
            expect(friendList1.length).to.equal(0);
            expect(friendList2.length).to.equal(0);
        })

        it("Test block revokes the friend request I sent", async function () {
            await helpers.blockFriend(cookieUser1, username2);

            let sentRequests = await helpers.getSentFriendRequests(cookieUser1);
            let receivedRequests = await helpers.getReceivedFriendRequests(cookieUser2);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
        })

        it("Test block revokes the friend request I recevied", async function () {
            await helpers.blockFriend(cookieUser2, username1);

            let sentRequests = await helpers.getSentFriendRequests(cookieUser1);
            let receivedRequests = await helpers.getReceivedFriendRequests(cookieUser2);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
        })

        it("Test unblock", async function () {
            await helpers.blockFriend(cookieUser1, username2);
            await helpers.unBlockFriend(cookieUser1, username2);

            let sentRequests = await helpers.getSentFriendRequests(cookieUser1);
            let receivedRequests = await helpers.getReceivedFriendRequests(cookieUser2);
            let friendList1 = await helpers.getFriendList(cookieUser1);
            let friendList2 = await helpers.getFriendList(cookieUser2);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
            expect(friendList1.length).to.equal(0);
            expect(friendList2.length).to.equal(0);
        })

        it("Test unfriend", async function () {
            await helpers.acceptFriendRequest(cookieUser2, username1);
            await helpers.unFriend(cookieUser1, username2);

            let sentRequests = await helpers.getSentFriendRequests(cookieUser1);
            let receivedRequests = await helpers.getReceivedFriendRequests(cookieUser2);
            let friendList1 = await helpers.getFriendList(cookieUser1);
            let friendList2 = await helpers.getFriendList(cookieUser2);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
            expect(friendList1.length).to.equal(0);
            expect(friendList2.length).to.equal(0);
        })

    });

    describe("Test view friends", async function () {
        let cookieUser1 = "";
        let cookieUser2 = "";
        let cookieUser3 = "";
        let username1 = "";
        let username2 = "";
        let username3 = "";

        beforeEach(async function(){
            cookieUser1 = await helpers.createUser(user1, sandbox);
            username1 = await helpers.getUsername(cookieUser1);
            cookieUser2 = await helpers.createUser(user2, sandbox);
            username2 = await helpers.getUsername(cookieUser2);
            cookieUser3 = await helpers.createUser(user3, sandbox);
            username3 = await helpers.getUsername(cookieUser3);
        });

        afterEach(async () => {
            await helpers.deleteUser(cookieUser1);
            await helpers.deleteUser(cookieUser2);
            await helpers.deleteUser(cookieUser3);
        });

        it("Test view normal friends", async function () {
            // User 1 has friends username2 and username3
            await helpers.sendFriendRequest(cookieUser1, username2);
            await helpers.sendFriendRequest(cookieUser1, username3);
            await helpers.acceptFriendRequest(cookieUser2, username1);
            await helpers.acceptFriendRequest(cookieUser3, username1);

            let results = await helpers.getFriendList(cookieUser1);
            expect(results).to.deep.equalInAnyOrder([username2, username3]);
        })

        it("Test view normal friends with info", async function () {
            await helpers.sendFriendRequest(cookieUser1, username2);
            await helpers.sendFriendRequest(cookieUser1, username3);
            await helpers.acceptFriendRequest(cookieUser2, username1);
            await helpers.acceptFriendRequest(cookieUser3, username1);

            let results = await helpers.getFriendListInfo(cookieUser1);
            results = results.map(item => {delete item._id; return item;});
            expect(results).to.deep.equalInAnyOrder([
                {
                  username: username2,
                  displayName: user2.given_name
                },                {
                    username: username3,
                    displayName: user3.given_name
                }
              ]);
        })

        it("Test view incoming friends", async function () {
            await helpers.sendFriendRequest(cookieUser2, username1);
            await helpers.sendFriendRequest(cookieUser3, username1);

            let results = await helpers.getReceivedFriendRequests(cookieUser1);
            results = results.map(item => {delete item._id; return item;});
            expect(results).to.deep.equalInAnyOrder([
                {
                  username: username2,
                  displayName: user2.given_name
                },                {
                    username: username3,
                    displayName: user3.given_name
                }
              ]);
        })

        it("Test view outgoing friend requests", async function () {
            await helpers.sendFriendRequest(cookieUser1, username2);
            await helpers.sendFriendRequest(cookieUser1, username3);

            let results = await helpers.getSentFriendRequests(cookieUser1);
            results = results.map(item => {delete item._id; return item;});
            expect(results).to.deep.equalInAnyOrder([
                {
                  username: username2,
                  displayName: user2.given_name
                },
                {
                    username: username3,
                    displayName: user3.given_name
                }
              ]);
        })

        it("Test view pending requests - mix incoming and outgoing", async function () {
            await helpers.sendFriendRequest(cookieUser1, username2);
            await helpers.sendFriendRequest(cookieUser3, username1);

            let results = await helpers.getPendingFriendList(cookieUser1);
            expect(results.sentRequests).to.deep.equal([username2]);
            expect(results.receivedRequests).to.deep.equal([username3]);
        })

        it("Test view pending requests - all outgoing", async function () {
            await helpers.sendFriendRequest(cookieUser1, username2);
            await helpers.sendFriendRequest(cookieUser1, username3);

            let results = await helpers.getPendingFriendList(cookieUser1);
            expect(results.sentRequests).to.deep.equalInAnyOrder([username2, username3]);
            expect(results.receivedRequests.length).to.equal(0);
        })

        it("Test view pending requests - all incoming", async function () {
            await helpers.sendFriendRequest(cookieUser2, username1);
            await helpers.sendFriendRequest(cookieUser3, username1);

            let results = await helpers.getPendingFriendList(cookieUser1);
            expect(results.sentRequests.length).to.equal(0);
            expect(results.receivedRequests).to.deep.equalInAnyOrder([username2, username3]);
        })

        it("Test view blocked people", async function () {
            await helpers.blockFriend(cookieUser1, username2);
            await helpers.blockFriend(cookieUser1, username3);

            let results = await helpers.getBlockedFriends(cookieUser1);
            results = results.map(item => {delete item._id; return item;});
            expect(results).to.deep.equalInAnyOrder([
                {
                  username: username2,
                  displayName: user2.given_name
                },
                {
                    username: username3,
                    displayName: user3.given_name
                }
              ]);
        })
    });

    /*describe("Test Friend Recent Activity", async function () {
        it("0 Recent Activities", async function () {

        });

        it("1 Recent Activity", async function () {

        });

        it("5 Recent Activities", async function () {

        });

        it("6 Recent Activites", async function () {

        });
    });*/

    /*describe("Test Recommended Friends", async function () {
        it("Test Situation with 0 Recommneded Friends", async function () {

        });

        it("Test Situation with 1 Recommneded Friends", async function () {

        });

        it("Test Situation with 5 Recommended Friends", async function () {

        });

        it("Test Situation with More than 5 Recommended Friends", async function () {

        });
    });*/
});