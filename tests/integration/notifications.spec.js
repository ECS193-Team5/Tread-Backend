var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
request = request(app);

var {expect} = require("chai");

var helpers = require("./postRequests");


describe('Testing notifications', () => {
    let usersInfo = [];
    let users = [{
        "sub": "notification1",
        "given_name": "Howard",
        "family_name": "Wang",
    },{
        "sub": "notification2",
        "given_name": "Rebekah",
        "family_name": "Grace",
    }]

    before(async () => {
        usersInfo = await helpers.createUsers(users, sandbox);
    });

    after(async () => {
        await helpers.deleteUsers(usersInfo);
    })

    describe("Testing /notifications", () => {
        describe('Testing /get_notifications based on league roles', () => {
            let leagueInfo = "";

            beforeEach(async () => {
                leagueInfo = await helpers.createLeague(usersInfo[1].cookie, "name", "public", "description");
                await helpers.joinLeague(usersInfo[0].cookie, leagueInfo.leagueID)
            });

            afterEach(async () => {
                helpers.deleteLeague(usersInfo[1].cookie, leagueInfo.leagueID);
                sandbox.restore();
            });

            it("Test that kicking out a user sends a notification", async () => {
                await request.post("/league/kick_member")
                .set("Cookie", usersInfo[1].cookie)
                .set('Accept', 'application/json')
                .send({
                    recipient: usersInfo[0].username,
                    leagueID:leagueInfo.leagueID,
                    leagueName:leagueInfo.leagueName})
                .then(res => {})

                await helpers.checkMostRecentNotification(usersInfo[0].cookie, "You have been kicked out of " + leagueInfo.leagueName);
            });

            it("Test that banning a user sends a notification", async () => {
                await request.post("/league/ban_user")
                .set("Cookie", usersInfo[1].cookie)
                .set('Accept', 'application/json')
                .send({
                    recipient: usersInfo[0].username,
                    leagueID:leagueInfo.leagueID,
                    leagueName:leagueInfo.leagueName
                })

                await helpers.checkMostRecentNotification(usersInfo[0].cookie, "You have been banned from " + leagueInfo.leagueName);
            });


            it("Test that elevating a user to admin sends a notification", async () => {
                await request.post("/league/add_admin")
                .set("Cookie", usersInfo[1].cookie)
                .set('Accept', 'application/json')
                .send({
                    recipient: usersInfo[0].username,
                    leagueID:leagueInfo.leagueID,
                    leagueName:leagueInfo.leagueName
                })

                await helpers.checkMostRecentNotification(usersInfo[0].cookie, "You have been elevated to the admin team in " + leagueInfo.leagueName);

            });

            it("Test that removing a user from admin sends a notification", async () => {
                await request.post("/league/add_admin")
                .set("Cookie", usersInfo[1].cookie)
                .set('Accept', 'application/json')
                .send({
                    recipient: usersInfo[0].username,
                    leagueID:leagueInfo.leagueID,
                    leagueName:leagueInfo.leagueName
                })

                await request.post("/league/remove_admin")
                .set("Cookie", usersInfo[1].cookie)
                .set('Accept', 'application/json')
                .send({
                    recipient: usersInfo[0].username,
                    leagueID:leagueInfo.leagueID,
                    leagueName:leagueInfo.leagueName
                })

                await helpers.checkMostRecentNotification(usersInfo[0].cookie, "You have been removed from the admin team in " + leagueInfo.leagueName);

            });

        });

        describe('Testing /get_notifications based on league invites', () => {
            let leagueInfo = {};

            beforeEach(async() => {
                leagueInfo = await helpers.createLeague(usersInfo[1].cookie, "name", "private", "description");
            });

            afterEach(async () =>{
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

                await helpers.revokeFriendRequest(usersInfo[0].cookie, usersInfo[0].username);
            });

            it("Test accepting a friend request sends a notification", async () => {
                await helpers.makeFriend(usersInfo[0].cookie, usersInfo[1].username, usersInfo[1].cookie, usersInfo[0].username);
                await helpers.checkMostRecentNotification(usersInfo[0].cookie, usersInfo[1].username + " accepted your friend request.");

                await helpers.unFriend(usersInfo[0].cookie, usersInfo[1].username);
            });
        });

        describe('Testing /get_notifications based on challenge interactions', () => {
            beforeEach(async () => {
                await helpers.makeFriend(usersInfo[0].cookie, usersInfo[1].username, usersInfo[1].cookie, usersInfo[0].username);
            })

            afterEach(async () => {
                await helpers.unFriend(usersInfo[1].cookie, usersInfo[0].username);
            })

            it("Test receiving a challenge sends a notification", async () => {
                await helpers.sendFriendChallenge(usersInfo[1].cookie, usersInfo[0].username);
                await helpers.checkMostRecentNotification(usersInfo[0].cookie, usersInfo[1].username + " sent you a challenge.");
            });

            it("Test someone accepting a challenge gives a notification", async () => {
                await helpers.sendFriendChallenge(usersInfo[0].cookie, usersInfo[1].username);
                await helpers.acceptChallenge(usersInfo[1].cookie, usersInfo[0].username);
                await helpers.checkMostRecentNotification(usersInfo[0].cookie, usersInfo[1].username + " accepted your challenge.");
            });
        });
    });

    describe("Test /delete_notification", () => {
        it("Test that the user can delete a notification", async () => {
            let results = [];
            helpers.sendFriendRequest(usersInfo[1].cookie, usersInfo[0].username);

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
            .send({notificationID: id})
            .then(res => {})

            await request.post("/notifications/get_notifications")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .then(res => {
                results = res._body;
                expect(results.length).to.equal(lengthResults - 1);
            })
        })
    });

    describe("Test /delete_all_notifications", () => {
        it("Test that the user can delete all notifications", async () => {
            let results = [];

            helpers.sendFriendRequest(usersInfo[1].cookie, usersInfo[0].username);
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
            .then(res => {})

            await request.post("/notifications/get_notifications")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .then(res => {
                results = res._body;
                expect(results.length).to.equal(0);
            })
        })
    });
});