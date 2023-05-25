var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const mongoose = require("mongoose");
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
const { expect} = require("chai");
var helpers = require("./postRequests");




request = request(app);

describe('Testing /challenges', () => {
    let users = [{
        "sub": "challenges1",
        "given_name": "Howard",
        "family_name": "Wang",
    }, {
        "sub": "challenges2",
        "given_name": "Rebekah",
        "family_name": "Grace",
    }, {
        "sub": "challenges3",
        "given_name": "Prabdheep",
        "family_name": "Kainth",
    }];
    let usersInfo = [];

    before(async () => {
        usersInfo = await helpers.createGoogleUsers(users, sandbox);
        await helpers.makeFriend(usersInfo[0], usersInfo[1]);
    });

    after(async () => {
        await helpers.deleteUsers(usersInfo);
    })

    describe("Test adding challenges", async () => {
        it("Test /add_self_challenge", async () => {
            let inputData = {
                receivedUser: usersInfo[0].username,
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_self_challenge")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send(inputData)
            .expect(200);

            let results = await helpers.getIssuedChallenges(usersInfo[0].cookie);

            expect(results.length).to.equal(1);
        });

        it("Test /add_friend_challenge", async () => {
            let inputData = {
                receivedUser: usersInfo[1].username,
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_friend_challenge")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send(inputData)
            .expect(200)

            let results = await helpers.getSentChallenges(usersInfo[0].cookie);
            expect(results.length).to.equal(1);

        });

        it("Test /add_friend_challenge to a non-friend", async () => {
            let originalResults = await helpers.getSentChallenges(usersInfo[0].cookie);

            let inputData = {
                receivedUser: usersInfo[2].username,
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_friend_challenge")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send(inputData)
            .expect(404)

            let results = await helpers.getSentChallenges(usersInfo[0].cookie);
            expect(results.length).to.equal(originalResults.length);

        });

        it("Test /add_league_challenge", async () => {
            let leagueInfo = await helpers.createLeague(usersInfo[0].cookie, "name", "private", "description");

            let inputData = {
                receivedUser: leagueInfo.leagueID,
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_league_challenge")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send(inputData)
            .expect(200)

            await request.post("/league/get_league_active_challenges")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({leagueID:leagueInfo.leagueID})
            .then(res=>{
                expect(res._body).to.equal(1);
            })

            await helpers.deleteLeague(usersInfo[0].cookie, leagueInfo.leagueID);
        });

        it("Test /add_league_challenge for league the user is not an admin of", async () => {
            let leagueInfo = await helpers.createLeague(usersInfo[0].cookie, "name", "private", "description");

            let inputData = {
                receivedUser: leagueInfo.leagueID,
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_league_challenge")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send(inputData)
            .expect(400)

            await helpers.deleteLeague(usersInfo[0].cookie, leagueInfo.leagueID);
        });
    });

    describe("Test friend challenge interactions", async () => {
        beforeEach(async() => {
            let inputData = {
                receivedUser: usersInfo[1].username,
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_friend_challenge")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send(inputData)
        })

        it("Test /delete_friend_challenge", async () => {
            let results = await helpers.getSentChallenges(usersInfo[0].cookie);

            let firstChallengeID = results[0]._id;

            await request.post("/challenges/delete_friend_challenge")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .send({challengeID : firstChallengeID})
                .expect(200);

            let newResults = await helpers.getSentChallenges(usersInfo[0].cookie);
            expect(newResults.length).to.equal(results.length - 1);
        });

        it("Test /accept_friend_challenge", async () => {
            let receivedResults = await helpers.getReceivedChallenges(usersInfo[1].cookie);
            let issuedResults = await helpers.getIssuedChallenges(usersInfo[1].cookie);
            let firstChallengeID = receivedResults[0]._id;

            await request.post("/challenges/accept_friend_challenge")
                .set("Cookie", usersInfo[1].cookie)
                .set('Accept', 'application/json')
                .send({challengeID : firstChallengeID})
                .expect(200);

            let results = await helpers.getReceivedChallenges(usersInfo[1].cookie);
            expect(results.length).to.equal(receivedResults.length - 1);
            results = await helpers.getIssuedChallenges(usersInfo[1].cookie);
            expect(results.length).to.equal(issuedResults.length + 1);
        });

        it("Test /decline_friend_challenge", async () => {
            let receivedResults = await helpers.getReceivedChallenges(usersInfo[1].cookie);

            let firstChallengeID = receivedResults[0]._id;

            await request.post("/challenges/decline_friend_challenge")
                .set("Cookie", usersInfo[1].cookie)
                .set('Accept', 'application/json')
                .send({challengeID : firstChallengeID})
                .expect(200);

            let newReceivedResults = await helpers.getReceivedChallenges(usersInfo[1].cookie);
            expect(newReceivedResults.length).to.equal(receivedResults.length -1);
        });

    });

    describe("Test viewing challenge lists", async () => {
        before(async function (){
            // Make user 3 friends with user1 and user2 so they can send challenges
            await helpers.sendFriendRequest(usersInfo[2].cookie, usersInfo[0].username);
            await helpers.sendFriendRequest(usersInfo[2].cookie, usersInfo[1].username);

            await helpers.acceptFriendRequest(usersInfo[0].cookie, usersInfo[2].username);
            await helpers.acceptFriendRequest(usersInfo[1].cookie, usersInfo[2].username);
        });

        it("Test /sent_challenges", async () => {
            await helpers.sendFriendChallenge(usersInfo[2].cookie, usersInfo[1].username);
            await helpers.sendFriendChallenge(usersInfo[2].cookie, usersInfo[0].username);

            let results = await helpers.getSentChallenges(usersInfo[2].cookie);

            expect(results.length).to.equal(2);

            await helpers.revokeAllChallenges(usersInfo[2].cookie, results);
        });

        it("Test /received_challenges", async () => {
            await helpers.sendFriendChallenge(usersInfo[1].cookie, usersInfo[0].username);
            await helpers.sendFriendChallenge(usersInfo[1].cookie, usersInfo[0].username);
            await helpers.sendFriendChallenge(usersInfo[2].cookie, usersInfo[0].username);

            let results = await helpers.getReceivedChallenges(usersInfo[0].cookie);

            expect(results.length).to.equal(3);

            await helpers.declineAllChallenges(usersInfo[0].cookie, results);
        });

        it("Test /accepted_challenges", async () => {

            let originalResults = await helpers.getIssuedChallenges(usersInfo[2].cookie);
            let originalLength = originalResults.length;

            // Send out challenges
            await helpers.sendSelfChallenge(usersInfo[2].cookie)
            await helpers.sendFriendChallenge(usersInfo[2].cookie, usersInfo[0].username)
            let leagueInfo = await helpers.createLeague(usersInfo[2].cookie, "name", "public", "description")
            await helpers.sendLeagueChallenge(usersInfo[2].cookie, leagueInfo.leagueID)

            // Move to user 1 to accept the challenge
            await helpers.acceptChallenge(usersInfo[0].cookie, usersInfo[2].username);

            // Move back to user 3, should have 3 issued Challenges
            let results = await helpers.getIssuedChallenges(usersInfo[2].cookie);

            expect(results.length).to.equal(originalLength + 3);

            await helpers.deleteLeague(usersInfo[2].cookie, leagueInfo.leagueID);
        });

        it("Test /league_challenges", async () => {
            let leagueInfo = await helpers.createLeague(usersInfo[2].cookie, "name", "public", "description")
            await helpers.sendLeagueChallenge(usersInfo[2].cookie, leagueInfo.leagueID);

            let results = await helpers.getIssuedChallengesByLeague(usersInfo[2].cookie, leagueInfo.leagueID);

            expect(results.length).to.equal(1);

            await helpers.deleteLeague(usersInfo[2].cookie, leagueInfo.leagueID);
        });

    });

    it("Test /get_challenge_leaderboard", async () => {
        let leagueInfo = await helpers.createLeague(usersInfo[2].cookie, "name", "public", "description")
        await helpers.sendLeagueChallenge(usersInfo[2].cookie, leagueInfo.leagueID);

        let challengeID = await helpers.getIssuedChallengesByLeague(usersInfo[2].cookie, leagueInfo.leagueID)

        await request.post("/challenges/get_challenge_leaderboard")
        .set("Cookie", usersInfo[1].cookie)
        .set('Accept', 'application/json')
        .send({challengeID : challengeID})
        .then(res => {
            expect(res._body[0].username).to.equal(usersInfo[2].username);
            expect(res._body[0].progress).to.equal(0);
            }
        )

        await helpers.deleteLeague(usersInfo[2].cookie, leagueInfo.leagueID);
    });

    describe("Test failures due to mongoose", async () => {
        it("Test invalid save", async () => {
            sandbox.stub(mongoose.Model.prototype, 'save').throws("error - cannot save");
            let inputData = {
                receivedUser: usersInfo[1].username,
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_friend_challenge")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send(inputData)
            .expect(500)

            sandbox.restore();
        })

        it("Test invalid bulkWrite", async () => {
            sandbox.stub(mongoose.Model, 'bulkWrite').throws("error - cannot save");

            let inputData = {
                receivedUser: usersInfo[1].username,
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_friend_challenge")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send(inputData)
            .expect(500)

            sandbox.restore();
        });
    });

    describe("Test failures due to user inputs", async () => {
        it("Test receivedUser does not exist", async () => {
            let inputData = {
                receivedUser: "fakeusername#0000",
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_friend_challenge")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send(inputData)
            .expect(404);
        });

        it("Test attempts to send a league challenge to a league they do not own", async () => {
            let leagueInfo = await helpers.createLeague(usersInfo[2].cookie, "name", "public", "description")

            let inputData = {
                receivedUser: leagueInfo.leagueID,
                issueDate: helpers.getIssueDate(),
                dueDate: helpers.getDueDate(),
                unit: "m",
                amount: 10,
                exerciseName: "Badminton"
            }
            await request.post("/challenges/add_league_challenge")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send(inputData)
            .expect(400);
        });

        it("Test user accepts a challenge that does not exist", async () => {
            await request.post("/challenges/accept_friend_challenge")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({challengeID: 0})
            .expect(404);
        });

        it("Test user declines a challenge that does not exist", async () => {
            await request.post("/challenges/decline_friend_challenge")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({challengeID: 0})
            .expect(404);
        });
    });

});