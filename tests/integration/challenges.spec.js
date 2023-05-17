var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const mongoose = require("mongoose");
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
const { expect} = require("chai");
var helpers = require("./helperFunc");

let user1 = {
    "sub": "challenges1",
    "given_name": "Howard",
    "family_name": "Wang",
}

let user2 = {
    "sub": "challenges2",
    "given_name": "Rebekah",
    "family_name": "Grace",
}

let user3 = {
    "sub": "challenges3",
    "given_name": "Prabdheep",
    "family_name": "Kainth",
}


request = request(app);

describe('Testing challenges', () => {
    let cookieUser1 = "";
    let cookieUser2 = "";
    let cookieUser3 = "";
    let username1 = "";
    let username2 = "";
    let username3 = "";

    before(async () => {
        cookieUser1 =  await helpers.createUser(user1, sandbox);
        username1 = await helpers.getUsername(cookieUser1);
        cookieUser2 =  await helpers.createUser(user2, sandbox);
        username2 = await helpers.getUsername(cookieUser2);
        cookieUser3 =  await helpers.createUser(user3, sandbox);
        username3 = await helpers.getUsername(cookieUser3);

    });

    after(async () => {
        cookieUser1 = await helpers.loginUser(user1, sandbox);
        await helpers.deleteUser(cookieUser1);
        cookieUser2 = await helpers.loginUser(user2, sandbox);
        await helpers.deleteUser(cookieUser2);
        cookieUser3 = await helpers.loginUser(user3, sandbox);
        await helpers.deleteUser(cookieUser3);
    })

    describe("Test adding challenges", async () => {
        before(async() => {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
        })

        it("Test adding self challenge", async () => {
            let inputData = {
                receivedUser: username1,
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_self_challenge")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send(inputData)
            .expect(200);
        });

        it("Test adding friend challenge", async () => {
            let inputData = {
                receivedUser: username2,
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_friend_challenge")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send(inputData)
            .expect(200)
        });

        it("Test adding league challenge", async () => {
            let leagueInfo = await helpers.createLeague(cookieUser1, "name", "private", "description");

            let inputData = {
                receivedUser: leagueInfo.leagueID,
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_league_challenge")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send(inputData)
            .expect(200)

            await helpers.deleteLeague(cookieUser1, leagueInfo.leagueID);
        });
    });

    describe("Test challenge interactions", async () => {
        beforeEach(async() => {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            let inputData = {
                receivedUser: username2,
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_friend_challenge")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send(inputData)
        })

        it("Test revoking a sent challenge", async () => {
            let results = await helpers.getSentChallenges(cookieUser1);

            let firstChallengeID = results[0]._id;

            await request.post("/challenges/delete_friend_challenge")
                .set("Cookie", cookieUser1)
                .set('Accept', 'application/json')
                .send({challengeID : firstChallengeID})
                .expect(200);
        });

        it("Test accepting a challenge", async () => {
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            let results = await helpers.getReceivedChallenges(cookieUser2);

            let firstChallengeID = results[0]._id;

            await request.post("/challenges/accept_friend_challenge")
                .set("Cookie", cookieUser2)
                .set('Accept', 'application/json')
                .send({challengeID : firstChallengeID})
                .expect(200);
        });

        it("Test declining a challenge", async () => {
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            let results = await helpers.getReceivedChallenges(cookieUser2);

            let firstChallengeID = results[0]._id;

            await request.post("/challenges/decline_friend_challenge")
                .set("Cookie", cookieUser2)
                .set('Accept', 'application/json')
                .send({challengeID : firstChallengeID})
                .expect(200);
        });

    });

    describe("Test viewing challenges", async () => {
        it("Test viewing sent challenges", async () => {
            cookieUser3 = await helpers.loginUser(user3, sandbox);
            await helpers.sendFriendChallenge(cookieUser3, username2);
            await helpers.sendFriendChallenge(cookieUser3, username1);

            let results = await helpers.getSentChallenges(cookieUser3);

            expect(results.length).to.equal(2);

            await helpers.revokeAllChallenges(cookieUser3, results);
        });

        it("Test viewing received challenges", async () => {
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            await helpers.sendFriendChallenge(cookieUser2, username1);
            await helpers.sendFriendChallenge(cookieUser2, username1);
            cookieUser3 = await helpers.loginUser(user3, sandbox);
            await helpers.sendFriendChallenge(cookieUser3, username1);

            cookieUser1 = await helpers.loginUser(user1, sandbox);
            let results = await helpers.getReceivedChallenges(cookieUser1);

            expect(results.length).to.equal(3);

            await helpers.declineAllChallenges(cookieUser1, results);
        });

        it("Test viewing issued challenges", async () => {
            cookieUser3 = await helpers.loginUser(user3, sandbox);

            let originalResults = await helpers.getIssuedChallenges(cookieUser3);
            let originalLength = originalResults.length;

            // Send out challenges
            await helpers.sendSelfChallenge(cookieUser3)
            await helpers.sendFriendChallenge(cookieUser3, username1)
            let leagueInfo = await helpers.createLeague(cookieUser3, "name", "public", "description")
            await helpers.sendLeagueChallenge(cookieUser3, leagueInfo.leagueID)

            // Move to user 1 to accept the challenge
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            await helpers.acceptChallenge(cookieUser1, username3);

            // Move back to user 3, should have 3 issued Challenges
            cookieUser3 = await helpers.loginUser(user3, sandbox);

            let results = await helpers.getIssuedChallenges(cookieUser3);

            expect(results.length).to.equal(originalLength + 3);

            await helpers.deleteLeague(cookieUser3, leagueInfo.leagueID);
        });

        it("Test viewing issued challenges by league", async () => {
            cookieUser3 = await helpers.loginUser(user3, sandbox);
            let leagueInfo = await helpers.createLeague(cookieUser3, "name", "public", "description")
            await helpers.sendLeagueChallenge(cookieUser3, leagueInfo.leagueID);

            let results = await helpers.getIssuedChallengesByLeague(cookieUser3, leagueInfo.leagueID);

            expect(results.length).to.equal(1);

            await helpers.deleteLeague(cookieUser3, leagueInfo.leagueID);
        });
    });

    describe("Test leaderboard", async () => {
        it("Test viewing leaderboard for league challenge", async () => {
            cookieUser3 = await helpers.loginUser(user3, sandbox);
            let leagueInfo = await helpers.createLeague(cookieUser3, "name", "public", "description")
            await helpers.sendLeagueChallenge(cookieUser3, leagueInfo.leagueID);

            let challengeID = await helpers.getIssuedChallengesByLeague(cookieUser3, leagueInfo.leagueID)

            await request.post("/challenges/get_challenge_leaderboard")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({challengeID : challengeID})
            .then(res => {
                expect(res._body.length).to.equal(1);
                expect(res.status).to.equal(200);}
            )

            await helpers.deleteLeague(cookieUser3, leagueInfo.leagueID);
        });
    })

    describe("Test mongoose fails", async () => {
        it("Test invalid save", async () => {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            sandbox.stub(mongoose.Model.prototype, 'save').throws("error - cannot save");
            let inputData = {
                receivedUser: username2,
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_friend_challenge")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send(inputData)
            .expect(500)

            sandbox.restore();
        })

        it("Test invalid bulkWrite", async () => {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            sandbox.stub(mongoose.Model, 'bulkWrite').throws("error - cannot save");

            let inputData = {
                receivedUser: username2,
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_friend_challenge")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send(inputData)
            .expect(500)

            sandbox.restore();
        });
    });

    describe("Test failed user inputs", async () => {
        it("Test receivedUser does not exist", async () => {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            let inputData = {
                receivedUser: "fakeusername#0000",
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_friend_challenge")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send(inputData)
            .expect(404);
        });

        it("Test User Does not Own league", async () => {
            cookieUser3 = await helpers.loginUser(user3, sandbox);
            let leagueInfo = await helpers.createLeague(cookieUser3, "name", "public", "description")
            cookieUser1 = await helpers.loginUser(user1, sandbox);

            let inputData = {
                receivedUser: leagueInfo.leagueID,
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_league_challenge")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send(inputData)
            .expect(400);
        });

        it("Test User Accept Challenge Does not Exist", async () => {
            cookieUser1 = await helpers.loginUser(user1, sandbox);

            await request.post("/challenges/accept_friend_challenge")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send({challengeID: 0})
            .expect(404);
        });

        it("Test User Decline Challenge Does not Exist", async () => {
            cookieUser1 = await helpers.loginUser(user1, sandbox);

            await request.post("/challenges/decline_friend_challenge")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send({challengeID: 0})
            .expect(404);
        });
    });

});