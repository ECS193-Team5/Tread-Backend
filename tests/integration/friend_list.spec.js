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
const { EXPORTDECLARATION_TYPES } = require("@babel/types");
const { async } = require("@firebase/util");
const exercise = require("../../models/exercise.schema");


describe('Testing friend_list routes', () => {
    const users = [{
        "sub": "friend1",
        "given_name": "Clark",
        "family_name": "Kent",
    },{
        "sub": "friend2",
        "given_name": "Bruce",
        "family_name": "Wayne",
    },{
        "sub": "friend3",
        "given_name": "Diana",
        "family_name": "Prince",
    },
    {
        "sub": "friend4",
        "given_name": "Diana",
        "family_name": "Prince",
    },
    {
        "sub": "friend5",
        "given_name": "Diana",
        "family_name": "Prince",
    },
    {
        "sub": "friend6",
        "given_name": "Diana",
        "family_name": "Prince",
    },
    {
        "sub": "friend7",
        "given_name": "Diana",
        "family_name": "Prince",
    },
    {
        "sub": "friend8",
        "given_name": "Diana",
        "family_name": "Prince",
    },
    {
        "sub": "friend9",
        "given_name": "Diana",
        "family_name": "Prince",
    }];

    describe("Test making friends", async function () {
        let usersInfo = [];

        before(async function(){
            usersInfo = await helpers.createGoogleUsers(users.slice(0,2), sandbox);
        })

        after(async () => {
            await helpers.deleteUsers(usersInfo);
        });

        beforeEach(async function(){
            await helpers.sendFriendRequest(usersInfo[0].cookie, usersInfo[1].username);
        });

        afterEach(async function(){
            await helpers.revokeFriendRequest(usersInfo[0].cookie, usersInfo[1].username);
            await helpers.revokeFriendRequest(usersInfo[1].cookie, usersInfo[0].username);
            await helpers.unFriend(usersInfo[0].cookie, usersInfo[1].username);
            await helpers.unBlockFriend(usersInfo[0].cookie, usersInfo[1].username);
            await helpers.unBlockFriend(usersInfo[1].cookie, usersInfo[0].username);
        })

        it("Test /send_friend_request", async function () {
            let sentRequests = await helpers.getSentFriendRequests(usersInfo[0].cookie);
            let receivedRequests = await helpers.getReceivedFriendRequests(usersInfo[1].cookie);

            expect(sentRequests[0].username).to.equal(usersInfo[1].username);
            expect(sentRequests.length).to.equal(1);

            expect(receivedRequests[0].username).to.equal(usersInfo[0].username);
            expect(receivedRequests.length).to.equal(1);
        })

        it("Test /accept_received_request", async function () {
            await helpers.acceptFriendRequest(usersInfo[1].cookie, usersInfo[0].username);

            let sentRequests = await helpers.getSentFriendRequests(usersInfo[0].cookie);
            let receivedRequests = await helpers.getReceivedFriendRequests(usersInfo[1].cookie);
            let friendList1 = await helpers.getFriendList(usersInfo[0].cookie);
            let friendList2 = await helpers.getFriendList(usersInfo[1].cookie);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
            expect(friendList1.length).to.equal(1);
            expect(friendList2.length).to.equal(1);
            expect(friendList1[0]).to.equal(usersInfo[1].username);
            expect(friendList2[0]).to.equal(usersInfo[0].username);
        })

        it("Test /remove_received_request", async function () {
            await helpers.declineFriendRequest(usersInfo[1].cookie, usersInfo[0].username);

            let sentRequests = await helpers.getSentFriendRequests(usersInfo[0].cookie);
            let receivedRequests = await helpers.getReceivedFriendRequests(usersInfo[1].cookie);
            let friendList1 = await helpers.getFriendList(usersInfo[0].cookie);
            let friendList2 = await helpers.getFriendList(usersInfo[1].cookie);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
            expect(friendList1.length).to.equal(0);
            expect(friendList2.length).to.equal(0);
        })

        it("Test /remove_sent_request", async function () {
            await helpers.revokeFriendRequest(usersInfo[0].cookie, usersInfo[1].username);

            let sentRequests = await helpers.getSentFriendRequests(usersInfo[0].cookie);
            let receivedRequests = await helpers.getReceivedFriendRequests(usersInfo[1].cookie);
            let friendList1 = await helpers.getFriendList(usersInfo[0].cookie);
            let friendList2 = await helpers.getFriendList(usersInfo[1].cookie);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
            expect(friendList1.length).to.equal(0);
            expect(friendList2.length).to.equal(0);

        })

        it("Test /send_friend_request in both directions (auto-accept)", async function () {
            await helpers.sendFriendRequest(usersInfo[1].cookie, usersInfo[0].username);

            let sentRequests = await helpers.getSentFriendRequests(usersInfo[0].cookie);
            let receivedRequests = await helpers.getReceivedFriendRequests(usersInfo[1].cookie);
            let friendList1 = await helpers.getFriendList(usersInfo[0].cookie);
            let friendList2 = await helpers.getFriendList(usersInfo[1].cookie);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
            expect(friendList1.length).to.equal(1);
            expect(friendList2.length).to.equal(1);
            expect(friendList1[0]).to.equal(usersInfo[1].username);
            expect(friendList2[0]).to.equal(usersInfo[0].username);
        })

        it("Test /block_user, receive a friend request from the blocked user", async function () {
            // User 2 blocked User 1
            await helpers.blockFriend(usersInfo[1].cookie, usersInfo[0].username);

            // User 1 sends a friend request
            await helpers.sendFriendRequest(usersInfo[0].cookie, usersInfo[1].username);

            let sentRequests = await helpers.getSentFriendRequests(usersInfo[0].cookie);
            let receivedRequests = await helpers.getReceivedFriendRequests(usersInfo[1].cookie);
            let friendList1 = await helpers.getFriendList(usersInfo[0].cookie);
            let friendList2 = await helpers.getFriendList(usersInfo[1].cookie);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
            expect(friendList1.length).to.equal(0);
            expect(friendList2.length).to.equal(0);
        })

        it("Test /block_user, send a friend request to the blocked user", async function () {
            // User 1 blocked User 2, then sends a friend request
            await helpers.revokeFriendRequest(usersInfo[0].cookie, usersInfo[1].username);
            await helpers.blockFriend(usersInfo[0].cookie, usersInfo[1].username);
            await helpers.sendFriendRequest(usersInfo[0].cookie, usersInfo[1].username);

            let sentRequests = await helpers.getSentFriendRequests(usersInfo[0].cookie);
            let receivedRequests = await helpers.getReceivedFriendRequests(usersInfo[1].cookie);

            expect(sentRequests[0].username).to.equal(usersInfo[1].username);
            expect(sentRequests.length).to.equal(1);

            expect(receivedRequests[0].username).to.equal(usersInfo[0].username);
            expect(receivedRequests.length).to.equal(1);
        })

        it("Test /remove_friend", async function () {
            await helpers.sendFriendRequest(usersInfo[1].cookie, usersInfo[0].username);
            await helpers.unFriend(usersInfo[0].cookie, usersInfo[1].username);

            let sentRequests = await helpers.getSentFriendRequests(usersInfo[0].cookie);
            let receivedRequests = await helpers.getReceivedFriendRequests(usersInfo[1].cookie);
            let friendList1 = await helpers.getFriendList(usersInfo[0].cookie);
            let friendList2 = await helpers.getFriendList(usersInfo[1].cookie);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
            expect(friendList1.length).to.equal(0);
            expect(friendList2.length).to.equal(0);
        })

        it("Test /remove_friend on a user who is not my friend", async function () {
            await helpers.unFriend(usersInfo[0].cookie, usersInfo[1].username);

            let sentRequests = await helpers.getSentFriendRequests(usersInfo[0].cookie);
            let receivedRequests = await helpers.getReceivedFriendRequests(usersInfo[1].cookie);
            let friendList1 = await helpers.getFriendList(usersInfo[0].cookie);
            let friendList2 = await helpers.getFriendList(usersInfo[1].cookie);

            expect(sentRequests.length).to.equal(1);
            expect(receivedRequests.length).to.equal(1);
            expect(sentRequests[0].username).to.equal(usersInfo[1].username);
            expect(receivedRequests[0].username).to.equal(usersInfo[0].username);
            expect(friendList1.length).to.equal(0);
            expect(friendList2.length).to.equal(0);
        })

        it("Test /block_user revokes the friend request I sent", async function () {
            await helpers.blockFriend(usersInfo[0].cookie, usersInfo[1].username);

            let sentRequests = await helpers.getSentFriendRequests(usersInfo[0].cookie);
            let receivedRequests = await helpers.getReceivedFriendRequests(usersInfo[1].cookie);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
        })

        it("Test /block_user revokes the friend request I recevied", async function () {
            await helpers.blockFriend(usersInfo[1].cookie, usersInfo[0].username);

            let sentRequests = await helpers.getSentFriendRequests(usersInfo[0].cookie);
            let receivedRequests = await helpers.getReceivedFriendRequests(usersInfo[1].cookie);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
        })

        it("Test /unblock_user", async function () {
            await helpers.blockFriend(usersInfo[0].cookie, usersInfo[1].username);
            await helpers.unBlockFriend(usersInfo[0].cookie, usersInfo[1].username);

            let sentRequests = await helpers.getSentFriendRequests(usersInfo[0].cookie);
            let receivedRequests = await helpers.getReceivedFriendRequests(usersInfo[1].cookie);
            let friendList1 = await helpers.getFriendList(usersInfo[0].cookie);
            let friendList2 = await helpers.getFriendList(usersInfo[1].cookie);

            expect(sentRequests.length).to.equal(0);
            expect(receivedRequests.length).to.equal(0);
            expect(friendList1.length).to.equal(0);
            expect(friendList2.length).to.equal(0);
        })
    });

    describe("Test view friends", async function () {
        let usersInfo = [];

        beforeEach(async function(){
            usersInfo = await helpers.createGoogleUsers(users.slice(0,3), sandbox);
        })

        afterEach(async () => {
            await helpers.deleteUsers(usersInfo);
        });

        it("Test view normal friends", async function () {
            // User 1 has friends User 2 and User 3
            await helpers.sendFriendRequest(usersInfo[0].cookie, usersInfo[1].username);
            await helpers.sendFriendRequest(usersInfo[0].cookie, usersInfo[2].username);
            await helpers.acceptFriendRequest(usersInfo[1].cookie, usersInfo[0].username);
            await helpers.acceptFriendRequest(usersInfo[2].cookie, usersInfo[0].username);

            let results = await helpers.getFriendList(usersInfo[0].cookie);
            expect(results).to.deep.equalInAnyOrder([usersInfo[1].username, usersInfo[2].username]);
        })

        it("Test view normal friends with info", async function () {
            await helpers.sendFriendRequest(usersInfo[0].cookie, usersInfo[1].username);
            await helpers.sendFriendRequest(usersInfo[0].cookie, usersInfo[2].username);
            await helpers.acceptFriendRequest(usersInfo[1].cookie, usersInfo[0].username);
            await helpers.acceptFriendRequest(usersInfo[2].cookie, usersInfo[0].username);

            let results = await helpers.getFriendListInfo(usersInfo[0].cookie);
            results = results.map(item => {delete item._id; return item;});
            expect(results).to.deep.equalInAnyOrder([
                {
                  username: usersInfo[1].username,
                  displayName: users[1].given_name
                },                {
                    username: usersInfo[2].username,
                    displayName: users[2].given_name
                }
              ]);
        })

        it("Test view incoming friends", async function () {
            await helpers.sendFriendRequest(usersInfo[1].cookie, usersInfo[0].username);
            await helpers.sendFriendRequest(usersInfo[2].cookie, usersInfo[0].username);

            let results = await helpers.getReceivedFriendRequests(usersInfo[0].cookie);
            results = results.map(item => {delete item._id; return item;});
            expect(results).to.deep.equalInAnyOrder([
                {
                  username: usersInfo[1].username,
                  displayName: users[1].given_name
                },                {
                    username: usersInfo[2].username,
                    displayName: users[2].given_name
                }
              ]);
        })

        it("Test view outgoing friend requests", async function () {
            await helpers.sendFriendRequest(usersInfo[0].cookie, usersInfo[1].username);
            await helpers.sendFriendRequest(usersInfo[0].cookie, usersInfo[2].username);

            let results = await helpers.getSentFriendRequests(usersInfo[0].cookie);
            results = results.map(item => {delete item._id; return item;});
            expect(results).to.deep.equalInAnyOrder([
                {
                  username: usersInfo[1].username,
                  displayName: users[1].given_name
                },
                {
                    username: usersInfo[2].username,
                    displayName: users[2].given_name
                }
              ]);
        })

        it("Test view pending requests - mix incoming and outgoing", async function () {
            await helpers.sendFriendRequest(usersInfo[0].cookie, usersInfo[1].username);
            await helpers.sendFriendRequest(usersInfo[2].cookie, usersInfo[0].username);

            let results = await helpers.getPendingFriendList(usersInfo[0].cookie);
            expect(results.sentRequests).to.deep.equal([usersInfo[1].username]);
            expect(results.receivedRequests).to.deep.equal([usersInfo[2].username]);
        })

        it("Test view pending requests - all outgoing", async function () {
            await helpers.sendFriendRequest(usersInfo[0].cookie, usersInfo[1].username);
            await helpers.sendFriendRequest(usersInfo[0].cookie, usersInfo[2].username);

            let results = await helpers.getPendingFriendList(usersInfo[0].cookie);
            expect(results.sentRequests).to.deep.equalInAnyOrder([usersInfo[1].username, usersInfo[2].username]);
            expect(results.receivedRequests.length).to.equal(0);
        })

        it("Test view pending requests - all incoming", async function () {
            await helpers.sendFriendRequest(usersInfo[1].cookie, usersInfo[0].username);
            await helpers.sendFriendRequest(usersInfo[2].cookie, usersInfo[0].username);

            let results = await helpers.getPendingFriendList(usersInfo[0].cookie);
            expect(results.sentRequests.length).to.equal(0);
            expect(results.receivedRequests).to.deep.equalInAnyOrder([usersInfo[1].username, usersInfo[2].username]);
        })

        it("Test view blocked people", async function () {
            await helpers.blockFriend(usersInfo[0].cookie, usersInfo[1].username);
            await helpers.blockFriend(usersInfo[0].cookie, usersInfo[2].username);

            let results = await helpers.getBlockedFriends(usersInfo[0].cookie);
            results = results.map(item => {delete item._id; return item;});
            expect(results).to.deep.equalInAnyOrder([
                {
                  username: usersInfo[1].username,
                  displayName: users[1].given_name
                },
                {
                    username: usersInfo[2].username,
                    displayName: users[2].given_name
                }
              ]);
        })
    });


    describe("Test Friend Recent Activity", async function () {
        let usersInfo= [];
        let exerciseList = [];

        before(async function(){
            usersInfo = await helpers.createGoogleUsers(users.slice(0, 3), sandbox);

            // User Friend 1 & 2 and 1&3
            await helpers.sendFriendRequest(usersInfo[0].cookie, usersInfo[1].username);
            await helpers.sendFriendRequest(usersInfo[0].cookie, usersInfo[2].username);
            await helpers.acceptFriendRequest(usersInfo[1].cookie, usersInfo[0].username);
            await helpers.acceptFriendRequest(usersInfo[2].cookie, usersInfo[0].username);

            exerciseList =
            [
                {
                    "username": usersInfo[1].username,
                    "exerciseName": "Archery",
                    "amount": 10,
                    "unit": "min"
                },
                {
                    "username": usersInfo[2].username,
                    "exerciseName": "Barre",
                    "amount": 10,
                    "unit": "min"
                },
                {
                    "username": usersInfo[2].username,
                    "exerciseName": "Bocce",
                    "amount": 10,
                    "unit": "min"
                },
                {
                    "username": usersInfo[1].username,
                    "exerciseName": "Soccer",
                    "amount": 10,
                    "unit": "min"
                },
                {
                    "username": usersInfo[1].username,
                    "exerciseName": "Skateboarding",
                    "amount": 10,
                    "unit": "min"
                },
                {
                    "username": usersInfo[1].username,
                    "exerciseName": "Sky Diving",
                    "amount": 10,
                    "unit": "min"
                }
            ]
        });

        after(async () => {
            await helpers.deleteUsers(usersInfo);
        });

        it("0 Recent Activities", async function () {
            let results = await helpers.getRecentActivityFriend(usersInfo[0].cookie);
            expect(results.length).to.equal(0);
        });

        it("1 Recent Activity", async function () {
            // User 2 logs an exercise
            await helpers.sendExercise(usersInfo[1].cookie, exerciseList[0]);

            let results = await helpers.getRecentActivityFriend(usersInfo[0].cookie);
            expect(results.length).to.equal(1);
            results = helpers.cleanRecentResults(results);
            expect(results).to.deep.equalInAnyOrder([exerciseList[0]]);
        });

        it("5 Recent Activities", async function () {
            await helpers.sendExercise(usersInfo[2].cookie, exerciseList[1]);
            await helpers.sendExercise(usersInfo[2].cookie, exerciseList[2]);
            await helpers.sendExercise(usersInfo[1].cookie, exerciseList[3]);
            await helpers.sendExercise(usersInfo[1].cookie, exerciseList[4]);

            let results = await helpers.getRecentActivityFriend(usersInfo[0].cookie);
            expect(results.length).to.equal(5);
            results = helpers.cleanRecentResults(results);
            expect(results).to.deep.equalInAnyOrder(exerciseList.slice(0,5));
        });

        it("6 Recent Activites", async function () {
            await helpers.sendExercise(usersInfo[1].cookie, exerciseList[5]);

            let results = await helpers.getRecentActivityFriend(usersInfo[0].cookie);
            expect(results.length).to.equal(5);
        });
    });


    describe("Test Recommended Friends", async function () {
        let usersInfo = [];

        before(async function(){
            usersInfo = await helpers.createGoogleUsers(users, sandbox);

            // User Friend 1 & 2 and 1&3
            await helpers.sendFriendRequest(usersInfo[0].cookie, usersInfo[1].username);
            await helpers.sendFriendRequest(usersInfo[0].cookie, usersInfo[2].username);
            await helpers.acceptFriendRequest(usersInfo[1].cookie, usersInfo[0].username);
            await helpers.acceptFriendRequest(usersInfo[2].cookie, usersInfo[0].username);
        });

        after(async () => {
            await helpers.deleteUsers(usersInfo);
        });

        it("Test Situation with 0 Recommended Friends", async function () {
            let results = await helpers.getRecommendedFriends(usersInfo[0].cookie);
            expect(results.length).to.equal(0);
        });

        it("Test Situation with 1 Recommended Friends", async function () {
            // Friend user 2 and user 4
            await helpers.makeFriend(usersInfo[1], usersInfo[3]);
            let results = await helpers.getRecommendedFriends(usersInfo[0].cookie);
            expect(results.length).to.equal(1);
        });

        it("Test Situation with 5 Unique Recommended Friends", async function () {
            await helpers.makeFriend(usersInfo[1], usersInfo[4]);
            await helpers.makeFriend(usersInfo[2], usersInfo[5]);
            await helpers.makeFriend(usersInfo[2], usersInfo[6]);
            await helpers.makeFriend(usersInfo[1], usersInfo[7]);
            let results = await helpers.getRecommendedFriends(usersInfo[0].cookie);
            expect(results.length).to.equal(5);
        });

        it("Test Situtaion where my friends have overlapping friends", async function(){
            await helpers.unFriend(usersInfo[1].cookie, usersInfo[7].username);
            await helpers.makeFriend(usersInfo[1], usersInfo[6]);
            let results = await helpers.getRecommendedFriends(usersInfo[0].cookie);
            expect(results.length).to.equal(4);
        });

        it("Test Situation with More than 5 Recommended Friends", async function () {
            await helpers.makeFriend(usersInfo[1], usersInfo[7]);
            await helpers.makeFriend(usersInfo[1], usersInfo[8]);
            let results = await helpers.getRecommendedFriends(usersInfo[0].cookie);
            expect(results.length).to.equal(5);
        });
    });

    describe("Test code exceptions in /send_friend_request", async function(){
        let usersInfo = [];

        before(async function(){
            usersInfo = await helpers.createGoogleUsers(users.slice(0, 2), sandbox);
        });

        after(async () => {
            await helpers.deleteUsers(usersInfo);
        });

        it("Test already sent friend request", async function(){
            await helpers.sendFriendRequest(usersInfo[0].cookie, usersInfo[1].username);
            await request.post("/friend_list/send_friend_request")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({friendName: usersInfo[1].username})
            .then(res => {
                expect(res._body).to.equal("You have already sent "+usersInfo[1].username + " a friend request.");
            })

            await helpers.revokeFriendRequest(usersInfo[0].cookie, usersInfo[1].username);
        })

        it("Test already friends", async function(){
            await helpers.makeFriend(usersInfo[0], usersInfo[1]);
            await request.post("/friend_list/send_friend_request")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({friendName: usersInfo[1].username})
            .then(res => {
                expect(res._body).to.equal("You were already friends with " + usersInfo[1].username + ".");
            })

            await helpers.unFriend(usersInfo[0].cookie, usersInfo[1].username);
        })

        it("Test try to friend a user who does not exist", async function(){
            await request.post("/friend_list/send_friend_request")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({friendName: "fakeUser"})
            .expect(404);
        })

        it("Test try to friend yourself", async function(){
            await request.post("/friend_list/send_friend_request")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({friendName: usersInfo[0].username})
            .expect(404);
        })
    });
});