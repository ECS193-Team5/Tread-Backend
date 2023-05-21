var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
var {expect} = require("chai");
var helpers = require("./helperFunc");
let user1 = {
    "sub": "notification1",
    "given_name": "Howard",
    "family_name": "Wang",
}

let user2 = {
    "sub": "notification2",
    "given_name": "Rebekah",
    "family_name": "Grace",
}

request = request(app);

describe('Testing notifications', () => {
    let cookieUser1 = "";
    let cookieUser2 = "";
    let username1 = "";
    let username2 = "";

    before(async () => {
        cookieUser1 =  await helpers.createUser(user1, sandbox);
        username1 = await helpers.getUsername(cookieUser1);
        cookieUser2 =  await helpers.createUser(user2, sandbox);
        username2 = await helpers.getUsername(cookieUser2);

    });

    after(async () => {
        cookieUser1 = await helpers.loginUser(user1, sandbox);
        await helpers.deleteUser(cookieUser1);
        cookieUser2 = await helpers.loginUser(user2, sandbox);
        await helpers.deleteUser(cookieUser2);
    })

    describe("Testing notifications sent based on a one event", () => {
        describe('Testing notifications based on league role', () => {
            let leagueInfo = "";

            beforeEach(async () => {
                cookieUser2 = await helpers.loginUser(user2, sandbox);
                leagueInfo = await helpers.createLeague(cookieUser2, "name", "public", "description");

                cookieUser1 = await helpers.loginUser(user1, sandbox);
                await helpers.joinLeague(cookieUser1, leagueInfo.leagueID)

                cookieUser2 = await helpers.loginUser(user2, sandbox);
            });

            afterEach(async () => {
                cookieUser2 = helpers.loginUser(user2, sandbox);
                helpers.deleteLeague(cookieUser2, leagueInfo.leagueID);
                sandbox.restore();
            });

            it("Test that kicking out a user sends a notification", async () => {
                await request.post("/league/kick_member")
                .set("Cookie", cookieUser2)
                .set('Accept', 'application/json')
                .send({
                    recipient: username1,
                    leagueID:leagueInfo.leagueID,
                    leagueName:leagueInfo.leagueName})
                .then(res => {})

                cookieUser1 = await helpers.loginUser(user1, sandbox);
                await helpers.checkMostRecentNotification(cookieUser1, "You have been kicked out of " + leagueInfo.leagueName);
            });

            it("Test that banning a user sends a notification", async () => {
                await request.post("/league/ban_user")
                .set("Cookie", cookieUser2)
                .set('Accept', 'application/json')
                .send({
                    recipient: username1,
                    leagueID:leagueInfo.leagueID,
                    leagueName:leagueInfo.leagueName
                })

                cookieUser1 = await helpers.loginUser(user1, sandbox);
                await helpers.checkMostRecentNotification(cookieUser1, "You have been banned from " + leagueInfo.leagueName);
            });


            it("Test that elevating a user to admin sends a notification", async () => {
                await request.post("/league/add_admin")
                .set("Cookie", cookieUser2)
                .set('Accept', 'application/json')
                .send({
                    recipient: username1,
                    leagueID:leagueInfo.leagueID,
                    leagueName:leagueInfo.leagueName
                })

                cookieUser1 = await helpers.loginUser(user1, sandbox);
                await helpers.checkMostRecentNotification(cookieUser1, "You have been elevated to the admin team in " + leagueInfo.leagueName);

            });

            it("Test that removing a user from admin sends a notification", async () => {
                await request.post("/league/add_admin")
                .set("Cookie", cookieUser2)
                .set('Accept', 'application/json')
                .send({
                    recipient: username1,
                    leagueID:leagueInfo.leagueID,
                    leagueName:leagueInfo.leagueName
                })

                await request.post("/league/remove_admin")
                .set("Cookie", cookieUser2)
                .set('Accept', 'application/json')
                .send({
                    recipient: username1,
                    leagueID:leagueInfo.leagueID,
                    leagueName:leagueInfo.leagueName
                })

                cookieUser1 = await helpers.loginUser(user1, sandbox);
                await helpers.checkMostRecentNotification(cookieUser1, "You have been removed from the admin team in " + leagueInfo.leagueName);

            });

        });

        describe('Testing notifications based on making friends', () => {
            it("Test sending a friend request sends a notification", async () => {
                cookieUser2 = await helpers.loginUser(user2, sandbox);
                await helpers.sendFriendRequest(cookieUser2, username1);
                cookieUser1 = await helpers.loginUser(user1, sandbox);
                await helpers.checkMostRecentNotification(cookieUser1, username2 + " sent you a friend request.");

                cookieUser2 = await helpers.loginUser(user2, sandbox);
                await helpers.revokeFriendRequest(cookieUser1, username1);
            });

            it("Test accepting a friend request sends a notification", async () => {
                cookieUser1 = await helpers.loginUser(user1, sandbox);
                await helpers.sendFriendRequest(cookieUser1, username2);
                cookieUser2 = await helpers.loginUser(user2, sandbox);
                await helpers.acceptFriendRequest(cookieUser2, username1);

                cookieUser1 = await helpers.loginUser(user1, sandbox);
                await helpers.checkMostRecentNotification(cookieUser1, username2 + " accepted your friend request.");

                await helpers.unFriend(cookieUser1, username2);
            });
        });

        describe('Testing notifications based on league invites', () => {
            let leagueInfo = {};

            beforeEach(async() => {
                cookieUser2 = await helpers.loginUser(user2, sandbox);
                leagueInfo = await helpers.createLeague(cookieUser2, "name", "private", "description");
            });

            afterEach(async () =>{
                cookieUser2 = await helpers.loginUser(user2, sandbox);
                await helpers.deleteLeague(cookieUser2, leagueInfo.leagueID);
            })

            it("Test being invited to a league gives a notification", async () => {
                await helpers.inviteLeague(cookieUser2, leagueInfo.leagueID, username1);
                cookieUser1 = await helpers.loginUser(user1, sandbox);
                await helpers.checkMostRecentNotification(cookieUser1, username2 + " invited you to a league.");
            });

            it("Test being accepted into a league gives a notification", async () => {
                cookieUser1 = await helpers.loginUser(user1, sandbox);
                await helpers.joinLeague(cookieUser1, leagueInfo.leagueID);
                cookieUser2 = await helpers.loginUser(user2, sandbox);
                await helpers.acceptLeague(cookieUser2, leagueInfo.leagueID, username1)
                cookieUser1 = await helpers.loginUser(user1, sandbox);
                await helpers.checkMostRecentNotification(cookieUser1, username2 + " accepted your league join request.");
            });

        });

        describe('Testing notifications based on sending challenges', () => {
            beforeEach(async () => {
                cookieUser1 = await helpers.loginUser(user1, sandbox);
                await helpers.sendFriendRequest(cookieUser1, username2);
                cookieUser2 = await helpers.loginUser(user2, sandbox);
                await helpers.acceptFriendRequest(cookieUser2, username1);
            })

            afterEach(async () => {
                cookieUser2 = await helpers.loginUser(user2, sandbox);
                await helpers.unFriend(cookieUser2, username1);
            })

            it("Test receiving a challenge sends a notification", async () => {
                cookieUser2 = await  helpers.loginUser(user2, sandbox);
                await helpers.sendFriendChallenge(cookieUser2, username1);
                cookieUser1 = await helpers.loginUser(user1, sandbox);
                await helpers.checkMostRecentNotification(cookieUser1, username2 + " sent you a challenge.");
            });

            it("Test someone accepting a challenge gives a notification", async () => {
                cookieUser1 = await helpers.loginUser(user1, sandbox);
                await helpers.sendFriendChallenge(cookieUser1, username2);
                cookieUser2 = await helpers.loginUser(user2, sandbox);
                await helpers.acceptChallenge(cookieUser2, username1);
                cookieUser1 = await helpers.loginUser(user1, sandbox);
                await helpers.checkMostRecentNotification(cookieUser1, username2 + " accepted your challenge.");
            });

        });
    });

    describe("Test delete notification", () => {
        it("Test that the user can delete a notification", async () => {
            let results = [];

            cookieUser2 = await helpers.loginUser(user2, sandbox);
            helpers.sendFriendRequest(cookieUser2, username1);
            cookieUser1 = await helpers.loginUser(user1, sandbox);

            await request.post("/notifications/get_notifications")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .then(res => {
                results = res._body;
            })

            let id = results[0]._id;
            let lengthResults = results.length;

            await request.post("/notifications/delete_notification")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send({notificationID: id})
            .then(res => {})

            await request.post("/notifications/get_notifications")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .then(res => {
                results = res._body;
                expect(results.length).to.equal(lengthResults - 1);
            })
        })
    });
    describe("Test delete notification", () => {
        it("Test that the user can delete all notifications", async () => {
            let results = [];

            cookieUser2 = await helpers.loginUser(user2, sandbox);
            helpers.sendFriendRequest(cookieUser2, username1);
            leagueInfo = await helpers.createLeague(cookieUser2, "n", "public", "desc");
            await helpers.inviteLeague(cookieUser2, leagueInfo.leagueID, username1);
            cookieUser1 = await helpers.loginUser(user1, sandbox);

            await request.post("/notifications/get_notifications")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .then(res => {
                results = res._body;
            })


            expect(results.length).to.be.greaterThanOrEqual(2);

            await request.post("/notifications/delete_all_notifications")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .then(res => {})

            await request.post("/notifications/get_notifications")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .then(res => {
                results = res._body;
                expect(results.length).to.equal(0);
            })
        })
    });
});