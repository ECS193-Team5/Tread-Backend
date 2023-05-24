var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const googleauth = require('google-auth-library');
const Notifications = require("../../models/notifications.model");

const app = require("../../index");
request = request(app);

var { expect } = require("chai");

const helpers = require("./postRequests");

const VALID_DEVICE_TOKEN = "eiQloXQ5u-Mz13_d0yP3rO:APA91bEtpAy4X8Rpu0p9OHyvGTftTfhgByzTnBA6uaDIDgYn90Hg_eYixhNVNRxNfcJ5Sr1OLaco2bT0uZgCbJnCjpr9zSlQW3B5Jd7o5gCO8LRiJf-lnVTQjLTx_D_6fJTkKxozCqZr";

describe('Testing notifications', () => {
    let usersInfo = [];
    let users = [{
        "sub": "notification1",
        "given_name": "Howard",
        "family_name": "Wang",
    }, {
        "sub": "notification2",
        "given_name": "Rebekah",
        "family_name": "Grace",
    }]

    describe("Testing /get_notifications", () => {
        before(async () => {
            usersInfo = await helpers.createUsers(users, sandbox);
        });

        after(async () => {
            await helpers.deleteUsers(usersInfo);
        })

        describe('Testing /get_notifications based on league roles', () => {
            let leagueInfo = "";

            beforeEach(async () => {
                leagueInfo = await helpers.createLeague(usersInfo[1].cookie, "name", "public", "description");
                await helpers.joinLeague(usersInfo[0].cookie, leagueInfo.leagueID)
            });

            afterEach(async () => {
                await helpers.deleteLeague(usersInfo[1].cookie, leagueInfo.leagueID);
            });

            it("Test that kicking out a user sends a notification", async () => {
                await request.post("/league/kick_member")
                    .set("Cookie", usersInfo[1].cookie)
                    .set('Accept', 'application/json')
                    .send({
                        recipient: usersInfo[0].username,
                        leagueID: leagueInfo.leagueID,
                        leagueName: leagueInfo.leagueName
                    })
                    .then(res => { })

                await helpers.checkMostRecentNotification(usersInfo[0].cookie, "You have been kicked out of " + leagueInfo.leagueName);
            });

            it("Test that banning a user sends a notification", async () => {
                await request.post("/league/ban_user")
                    .set("Cookie", usersInfo[1].cookie)
                    .set('Accept', 'application/json')
                    .send({
                        recipient: usersInfo[0].username,
                        leagueID: leagueInfo.leagueID,
                        leagueName: leagueInfo.leagueName
                    })

                await helpers.checkMostRecentNotification(usersInfo[0].cookie, "You have been banned from " + leagueInfo.leagueName);
            });


            it("Test that elevating a user to admin sends a notification", async () => {
                await request.post("/league/add_admin")
                    .set("Cookie", usersInfo[1].cookie)
                    .set('Accept', 'application/json')
                    .send({
                        recipient: usersInfo[0].username,
                        leagueID: leagueInfo.leagueID,
                        leagueName: leagueInfo.leagueName
                    })

                await helpers.checkMostRecentNotification(usersInfo[0].cookie, "You have been elevated to the admin team in " + leagueInfo.leagueName);

            });

            it("Test that removing a user from admin sends a notification", async () => {
                await request.post("/league/add_admin")
                    .set("Cookie", usersInfo[1].cookie)
                    .set('Accept', 'application/json')
                    .send({
                        recipient: usersInfo[0].username,
                        leagueID: leagueInfo.leagueID,
                        leagueName: leagueInfo.leagueName
                    })

                await request.post("/league/remove_admin")
                    .set("Cookie", usersInfo[1].cookie)
                    .set('Accept', 'application/json')
                    .send({
                        recipient: usersInfo[0].username,
                        leagueID: leagueInfo.leagueID,
                        leagueName: leagueInfo.leagueName
                    })

                await helpers.checkMostRecentNotification(usersInfo[0].cookie, "You have been removed from the admin team in " + leagueInfo.leagueName);

            });

        });

        describe('Testing /get_notifications based on league invites', () => {
            let leagueInfo = {};

            beforeEach(async () => {
                leagueInfo = await helpers.createLeague(usersInfo[1].cookie, "name", "private", "description");
            });

            afterEach(async () => {
                await helpers.deleteLeague(usersInfo[1].cookie, leagueInfo.leagueID);
            })

            it("Test being invited to a league gives a notification", async () => {
                await helpers.inviteLeague(usersInfo[1].cookie, leagueInfo.leagueID, usersInfo[0].username);
                await helpers.checkMostRecentNotification(usersInfo[0].cookie, usersInfo[1].username + " invited you to a league.");
            });

            it("Test being accepted into a league gives a notification", async () => {
                await helpers.joinLeague(usersInfo[0].cookie, leagueInfo.leagueID);
                await helpers.acceptLeague(usersInfo[1].cookie, leagueInfo.leagueID, usersInfo[0].username);
                await helpers.checkMostRecentNotification(usersInfo[0].cookie, usersInfo[1].username + " accepted your league join request.");
            });
        });

        describe('Testing /get_notifications based on friend relationships', () => {
            it("Test sending a friend request sends a notification", async () => {
                await helpers.sendFriendRequest(usersInfo[1].cookie, usersInfo[0].username);
                await helpers.checkMostRecentNotification(usersInfo[0].cookie, usersInfo[1].username + " sent you a friend request.");
                await helpers.revokeFriendRequest(usersInfo[1].cookie, usersInfo[0].username);
            });

            it("Test being accepted as a friend gives a notification", async () => {
                await helpers.makeFriend(usersInfo[0], usersInfo[1]);
                await helpers.checkMostRecentNotification(usersInfo[0].cookie, usersInfo[1].username + " accepted your friend request.");
                await helpers.unFriend(usersInfo[0].cookie, usersInfo[1].username);
            });
        });

        describe('Testing /get_notifications based on challenge interactions', async function () {
            beforeEach(async function () {
                await helpers.makeFriend(usersInfo[0], usersInfo[1]);
            })

            afterEach(async function () {
                await helpers.unFriend(usersInfo[1].cookie, usersInfo[0].username);
            })

            it("Test receiving a challenge sends a notification", async () => {
                await helpers.sendFriendChallenge(usersInfo[1].cookie, usersInfo[0].username);
                await helpers.checkMostRecentNotification(usersInfo[0].cookie, usersInfo[1].username + " sent you a challenge.");
                let received_challenges = await helpers.getReceivedChallenges(usersInfo[0].cookie);
                await helpers.declineAllChallenges(usersInfo[0].cookie, received_challenges);
            });

            it("Test someone accepting a challenge gives a notification", async () => {
                await helpers.sendFriendChallenge(usersInfo[0].cookie, usersInfo[1].username);
                await helpers.acceptChallenge(usersInfo[1].cookie, usersInfo[0].username);
                await helpers.checkMostRecentNotification(usersInfo[0].cookie, usersInfo[1].username + " accepted your challenge.");
            });
        });

        describe('Testing /get_notifications fails', async function () {
            beforeEach(async function () {
                await helpers.makeFriend(usersInfo[0], usersInfo[1]);
            })

            afterEach(async function () {
                await helpers.unFriend(usersInfo[1].cookie, usersInfo[0].username);
            })

            it("Test find error", async () => {
                await helpers.sendFriendChallenge(usersInfo[1].cookie, usersInfo[0].username);
                sandbox.stub(Notifications, "find").throws("Err - cannot find");
                await request.post("/notifications/get_notifications")
                    .set("Cookie", usersInfo[0].cookie)
                    .set('Accept', 'application/json')
                    .expect(500);
                sandbox.restore();

            });

            it("Test fail to insert notifications", async () => {
                sandbox.stub(Notifications, "insertMany").throws("Err - cannot insert");
                let inputData = {
                    receivedUser: usersInfo[0].username,
                    issueDate: helpers.getIssueDate(),
                    dueDate: helpers.getDueDate(),
                    unit: "m",
                    amount: 10,
                    exerciseName: "Badminton"
                }
                await helpers.sendFriendChallenge(usersInfo[1].cookie, usersInfo[0].username);
                await request.post("/challenges/add_friend_challenge")
                    .set("Cookie", usersInfo[1].cookie)
                    .set('Accept', 'application/json')
                    .send(inputData)

                sandbox.restore();

            });

        });
    });

    describe("Test /delete_notification", () => {
        beforeEach(async () => {
            usersInfo = await helpers.createUsers(users, sandbox);
        });

        afterEach(async () => {
            await helpers.deleteUsers(usersInfo);
        })

        it("Test that the user can delete a notification", async () => {
            let results = [];
            await helpers.sendFriendRequest(usersInfo[1].cookie, usersInfo[0].username);

            await request.post("/notifications/get_notifications")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .then(res => {
                    results = res._body;
                })

            let id = results[0]._id;
            let lengthResults = results.length;

            await request.post("/notifications/delete_notification")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .send({ notificationID: id })
                .then(res => { })

            await request.post("/notifications/get_notifications")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .then(res => {
                    results = res._body;
                    expect(results.length).to.equal(lengthResults - 1);
                })

            await helpers.revokeFriendRequest(usersInfo[1].cookie, usersInfo[0].username);
        })

        it("Test that the user delete fails", async () => {
            let results = [];
            await helpers.sendFriendRequest(usersInfo[1].cookie, usersInfo[0].username);

            await request.post("/notifications/get_notifications")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .then(res => {
                    results = res._body;
                })

            let id = results[0]._id;

            sandbox.stub(Notifications, "deleteOne").throws("Err - cannot delete");
            await request.post("/notifications/delete_notification")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .send({ notificationID: id })
                .expect(500);
            sandbox.restore();
        })

    });

    describe("Test /delete_all_notifications", () => {
        beforeEach(async () => {
            usersInfo = await helpers.createUsers(users, sandbox);
        });

        afterEach(async () => {
            await helpers.deleteUsers(usersInfo);
        })

        it("Test that the user can delete all notifications", async () => {
            let results = [];

            await helpers.sendFriendRequest(usersInfo[1].cookie, usersInfo[0].username);
            leagueInfo = await helpers.createLeague(usersInfo[1].cookie, "n", "public", "desc");
            await helpers.inviteLeague(usersInfo[1].cookie, leagueInfo.leagueID, usersInfo[0].username);

            await request.post("/notifications/get_notifications")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .then(res => {
                    results = res._body;
                })

            expect(results.length).to.be.greaterThanOrEqual(2);

            await request.post("/notifications/delete_all_notifications")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .then(res => { })

            await request.post("/notifications/get_notifications")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .then(res => {
                    results = res._body;
                    expect(results.length).to.equal(0);
                })
        })

        it("Test that deleteManyFails", async () => {
            let results = [];

            await helpers.sendFriendRequest(usersInfo[1].cookie, usersInfo[0].username);
            leagueInfo = await helpers.createLeague(usersInfo[1].cookie, "n", "public", "desc");
            await helpers.inviteLeague(usersInfo[1].cookie, leagueInfo.leagueID, usersInfo[0].username);

            await request.post("/notifications/get_notifications")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .then(res => {
                    results = res._body;
                })

            expect(results.length).to.be.greaterThanOrEqual(2);

            sandbox.stub(Notifications, "deleteMany").throws("Err - cannot delete");
            await request.post("/notifications/delete_all_notifications")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .expect(500);
            sandbox.restore();
        })
    });

    describe("Testing device token settings", () => {
        it("Test set valid device token", async () => {
            let user1 = {
                "sub": "notification3",
                "given_name": "Prabhdeep",
                "family_name": "Kainth",
            };

            let user2 = {
                "sub": "notification3",
                "given_name": "Prabhdeep",
                "family_name": "Kainth",
            };

            let cookie1 = await helpers.loginUser(user1, sandbox);
            let username1 = await helpers.getUsername(cookie1);
            let cookie2 = await helpers.createUser(user2, sandbox);
            await request.post("/sign_up/sign_up")
                .set('Accept', 'application/json')
                .set('Cookie', cookie1)
                .send({ "username": user1.given_name, "displayName": user1.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png", deviceToken: VALID_DEVICE_TOKEN })
                .expect(200);

            await helpers.sendFriendRequest(cookie2, username1);
            await helpers.deleteUser(cookie1);
            await helpers.deleteUser(cookie2);

        });

        it("Test give an invalid device token and attempt to use it", async () => {
            let user1 = {
                "sub": "notifications4",
                "given_name": "Prabhdeep",
                "family_name": "Kainth",
            };

            let user2 = {
                "sub": "notifications5",
                "given_name": "Prabhdeep",
                "family_name": "Kainth",
            };

            // Sign in users for the first time
            let cookie1 = await helpers.loginUser(user1, sandbox);

            await request.post("/sign_up/sign_up")
                .set('Accept', 'application/json')
                .set('Cookie', cookie1)
                .send({
                    "username": user1.given_name,
                    "displayName": user1.given_name,
                    "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png",
                    deviceToken: VALID_DEVICE_TOKEN
                })
                .expect(200)
            let username1 = await helpers.getUsername(cookie1);
            let cookie2 = await helpers.createUser(user2, sandbox);

            // Login twice more
            var userVal = {
                sub: user1.sub,
                given_name: user1.given_name,
                family_name: user1.family_name,
                email: "testemail" + user1.sub + "@gmail.com",
                picture: "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png"
            }
            let payloadStub = sandbox.stub().returns(userVal)
            sandbox.stub(googleauth.OAuth2Client.prototype, "verifyIdToken").resolves({ getPayload: payloadStub });
            await request.post("/auth/login/google")
                .set('Accept', 'application/json')
                .send({"deviceToken":"BadToken"})
            sandbox.restore();

            // Send request to trigger notifications
            await helpers.sendFriendRequest(cookie2, username1);

            await helpers.deleteUser(cookie1);
            await helpers.deleteUser(cookie2);
        })

        it("Test give two invalid device token and attempt to use them", async () => {
            let user1 = {
                "sub": "notifications6",
                "given_name": "Prabhdeep",
                "family_name": "Kainth",
            };

            let user2 = {
                "sub": "notifications7",
                "given_name": "Prabhdeep",
                "family_name": "Kainth",
            };

            // Sign in users for the first time
            let cookie1 = await helpers.loginUser(user1, sandbox);
            await request.post("/sign_up/sign_up")
                .set('Accept', 'application/json')
                .set('Cookie', cookie1)
                .send({
                    "username": user1.given_name,
                    "displayName": user1.given_name,
                    "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png",
                    deviceToken: VALID_DEVICE_TOKEN
                })
                .expect(200)
            let username1 = await helpers.getUsername(cookie1);
            let cookie2 = await helpers.createUser(user2, sandbox);

            // Login twice more
            var userVal = {
                sub: user1.sub,
                given_name: user1.given_name,
                family_name: user1.family_name,
                email: "testemail" + user1.sub + "@gmail.com",
                picture: "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png"
            }
            let payloadStub = sandbox.stub().returns(userVal)
            sandbox.stub(googleauth.OAuth2Client.prototype, "verifyIdToken").resolves({ getPayload: payloadStub });
            await request.post("/auth/login/google")
                .set('Accept', 'application/json')
                .send({"deviceToken":"invalid device token1"})
            await request.post("/auth/login/google")
                .set('Accept', 'application/json')
                .send({"deviceToken":"invalid device token2"})
            sandbox.restore();

            // Send request to trigger notifications
            await helpers.sendFriendRequest(cookie2, username1);

            await helpers.deleteUser(cookie1);
            await helpers.deleteUser(cookie2);
        })
    });
});