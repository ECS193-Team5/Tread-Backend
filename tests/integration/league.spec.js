var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const mongoose = require("mongoose");
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
const googleauth = require('google-auth-library');
var helpers = require("./postRequests");
const chai = require("chai");
const deepEqualInAnyOrder = require('deep-equal-in-any-order');
chai.use(deepEqualInAnyOrder);
const {expect} = chai;

request = request(app);

describe('Testing /league routes', () => {
    let usersInfo = [];
    const users = [{
        "sub": "league1",
        "given_name": "Clark",
        "family_name": "Kent",
    },
    {
        "sub": "league2",
        "given_name": "Bruce",
        "family_name": "Wayne",
    },
    {
        "sub": "league3",
        "given_name": "Diana",
        "family_name": "Prince",
    }, {
        "sub": "league4",
        "given_name": "Charles",
        "family_name": "Xavier",
    }, {
        "sub": "league5",
        "given_name": "Tony",
        "family_name": "Stark",
    }, {
        "sub": "league6",
        "given_name": "Pepper",
        "family_name": "Pots",
    }];

    before(async () => {
        usersInfo = await helpers.createUsers(users, sandbox);
    });

    after(async () => {
        await helpers.deleteUsers(usersInfo);
    });

    describe("Testing creating and deleting leagues", async () => {

        it("Test /create_league", async () => {
            let id;
            let inputData = {
                "leagueName": "name",
                "leagueType": "public",
                "leagueDescription": "description",
                "leaguePicture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png"
            };

            await request.post("/league/create_league")
                .set("Cookie", usersInfo[0].cookie)
                .set("Accept", "application/json")
                .send(inputData)
                .then(res => { })

            await request.post("/league/get_leagues")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .then(res => {
                    id = res._body[0]._id;
                })

            await request
                .post("/league/get_league_name_description_type")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .send({leagueID: id})
                .then(res => {
                    expect(res._body.leagueDescription).to.equal("description");
                    expect(res._body.leagueName).to.equal("name");
                    expect(res._body.leagueType).to.equal("public");
                })

            // clean up
            await helpers.deleteLeague(usersInfo[0].cookie, id);
        });

        it("Test /delete_league", async () => {
            let leagueInfo = await helpers.createLeague(usersInfo[0].cookie, "n", "private", "desc");

            // League is created
            await request.post("/league/delete_league")
                .set("Cookie", usersInfo[0].cookie)
                .set("Accept", "application/json")
                .send({leagueID: leagueInfo.leagueID})
                .expect(200)

            await request
                .post("/league/get_league_name_description_type")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .send({leagueID: leagueInfo.leagueID})
                .then(res =>{
                    expect(res._body).to.equal(null)
                })
        });

        it("Test /_get_league_name_description_type in a private league", async () => {
            let leagueInfo = await helpers.createLeague(usersInfo[0].cookie, "n", "private", "desc");

            await request
                .post("/league/get_league_name_description_type")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .send({leagueID: leagueInfo.leagueID})
                .then(res =>{
                    expect(res._body.leagueType).to.equal("private")
                    expect(res._body.leagueName).to.equal("n")
                    expect(res._body.leagueDescription).to.equal("desc")
                })

            await helpers.deleteLeague(usersInfo[0].cookie, leagueInfo.leagueID)
        });

        it("Test /_get_league_name_description_type in a public league", async () => {
            let leagueInfo = await helpers.createLeague(usersInfo[0].cookie, "n", "public", "desc");

            await request
                .post("/league/get_league_name_description_type")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .send({leagueID: leagueInfo.leagueID})
                .then(res =>{
                    expect(res._body.leagueType).to.equal("public")
                    expect(res._body.leagueName).to.equal("n")
                    expect(res._body.leagueDescription).to.equal("desc")
                })

            await helpers.deleteLeague(usersInfo[0].cookie, leagueInfo.leagueID)
        });

    });

   describe("Testing editting leagues", async () => {
        let leagueInfo = {};
        before(async()=>{
            leagueInfo = await helpers.createLeague(usersInfo[0].cookie, "n", "private", "desc");
        })

        after(async() => {
            await helpers.deleteLeague(usersInfo[0].cookie, leagueInfo.leagueID);
        })

        it("Test /update_name", async () => {
            await request
            .post("/league/update_name")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, leagueName:"newName"})
            .expect(200)
            await request
                .post("/league/get_league_name_description_type")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .send({leagueID: leagueInfo.leagueID})
                .then(res => {
                    expect(res._body.leagueName).to.equal("newName");
                })
        });

        it("Test /update_description", async () => {
            await request
            .post("/league/update_description")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, leagueDescription:"newDescription"})
            .expect(200)

            await request
                .post("/league/get_league_name_description_type")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .send({leagueID: leagueInfo.leagueID})
                .then(res => {
                    expect(res._body.leagueDescription).to.equal("newDescription");
                })
        });

        it("Test /update_picture", async () => {
            await request
            .post("/league/update_picture")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, leaguePicture:"https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png"})
            .expect(200)
        });

        it("Test /update_type", async () => {
            await request
            .post("/league/update_type")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, leagueType:"public"})
            .expect(200)

            await request
                .post("/league/get_league_name_description_type")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .send({leagueID: leagueInfo.leagueID})
                .then(res => {
                    expect(res._body.leagueType).to.equal("public");
                })
        });
    });

    describe("Test user requests to join private league", async () => {
        let leagueInfo = {};
        beforeEach(async()=>{
            // Second User creates league
            leagueInfo = await helpers.createLeague(usersInfo[1].cookie, "n", "private", "desc");
        })

        afterEach(async() => {
            await helpers.deleteLeague(usersInfo[1].cookie, leagueInfo.leagueID);
        })

        it("Test /user_request_to_join", async function(){
            // User requests to join
            await request.post("/league/user_request_to_join")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .expect(200);

            let role = await helpers.getRole(usersInfo[0].cookie, leagueInfo.leagueID);

            // The league is private, so the user should be not in the league
            expect(role).to.equal("none");

            // The league should appear in the user's sent requests
            let leagues = await helpers.getSentLeagues(usersInfo[0].cookie);

            expect(leagues).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: 'n',
                  members: [ usersInfo[1].username ],
                  activeChallenges: 0
                }
              ]);
        });

        it("Test /decline_request", async function(){
            await helpers.joinLeague(usersInfo[0].cookie, leagueInfo.leagueID);

            await request.post("/league/decline_request")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: usersInfo[0].username})
            .expect(200);

            let leagues = await helpers.getSentLeagues(usersInfo[0].cookie);
            expect(leagues.length).to.equal(0);

            leagues = await helpers.getAcceptedLeagues(usersInfo[0].cookie);
            expect(leagues.length).to.equal(0);
        });

        it("Test /accept_join_request", async function(){
            await helpers.joinLeague(usersInfo[0].cookie, leagueInfo.leagueID);

            await request.post("/league/accept_join_request")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: usersInfo[0].username})
            .expect(200);

            let leagues = await helpers.getSentLeagues(usersInfo[0].cookie);
            expect(leagues.length).to.equal(0);

            leagues = await helpers.getAcceptedLeagues(usersInfo[0].cookie);
            expect(leagues.length).to.equal(1);

            expect(leagues).to.deep.equal([
                {
                    _id: leagueInfo.leagueID,
                    leagueName: 'n',
                    members: [ usersInfo[1].username, usersInfo[0].username ],
                    activeChallenges: 0
                  }
              ]);
        });

        it("Test /user_undo_request", async function(){
            await helpers.joinLeague(usersInfo[0].cookie, leagueInfo.leagueID);

            await request.post("/league/user_undo_request")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .expect(200);

            let leagues = await helpers.getSentLeagues(usersInfo[0].cookie);

            expect(leagues.length).to.equal(0);
        });
    });

    describe("Test invite user to join league", async () => {
        let leagueInfo = {};

        beforeEach(async()=>{
            leagueInfo = await helpers.createLeague(usersInfo[1].cookie, "n", "private", "desc");
        })

        afterEach(async() => {
            await helpers.deleteLeague(usersInfo[1].cookie, leagueInfo.leagueID);
        })

        it("Test /invite_to_join", async function(){
            await request.post("/league/invite_to_join")
                .set("Cookie", usersInfo[1].cookie)
                .set('Accept', 'application/json')
                .send({recipient: usersInfo[0].username, leagueID: leagueInfo.leagueID})
                .expect(200);

            // User should see league in their received requests
            let results = await helpers.getInvitedLeagues(usersInfo[0].cookie);

            expect(results.length).to.equal(1);

            expect(results).to.deep.equal([
                {
                    _id: leagueInfo.leagueID,
                    leagueName: 'n',
                    members: [ usersInfo[1].username ],
                    activeChallenges: 0
                  }
              ]);
        });

        it("Test /user_accept_invite", async function(){
            await helpers.inviteLeague(usersInfo[1].cookie, leagueInfo.leagueID, usersInfo[0].username);

            await request.post("/league/user_accept_invite")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .send({leagueID: leagueInfo.leagueID})
                .expect(200);

            let leagues = await helpers.getInvitedLeagues(usersInfo[0].cookie);
            expect(leagues.length).to.equal(0);

            leagues = await helpers.getAcceptedLeagues(usersInfo[0].cookie);
            expect(leagues.length).to.equal(1);

            expect(leagues).to.deep.equal([
                {
                    _id: leagueInfo.leagueID,
                    leagueName: 'n',
                    members: [ usersInfo[1].username, usersInfo[0].username ],
                    activeChallenges: 0
                  }
              ]);
        });

        it("Test /user_decline_invite", async function(){
            await helpers.inviteLeague(usersInfo[1].cookie, leagueInfo.leagueID, usersInfo[0].username);

            await request.post("/league/user_decline_invite")
                .set("Cookie", usersInfo[0].cookie)
                .set('Accept', 'application/json')
                .send({leagueID: leagueInfo.leagueID})
                .expect(200);

            let leagues = await helpers.getInvitedLeagues(usersInfo[0].cookie);
            expect(leagues.length).to.equal(0);

            leagues = await helpers.getAcceptedLeagues(usersInfo[0].cookie);
            expect(leagues.length).to.equal(0);
        });

        it("Test /undo_invite", async function(){
            await helpers.inviteLeague(usersInfo[1].cookie, leagueInfo.leagueID, usersInfo[0].username);

            await request.post("/league/undo_invite")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: usersInfo[0].username})
            .expect(200);

            let leagues = await helpers.getInvitedLeagues(usersInfo[0].cookie);
            expect(leagues.length).to.equal(0);

            leagues = await helpers.getAcceptedLeagues(usersInfo[0].cookie);
            expect(leagues.length).to.equal(0);
        });
    });

    describe("Test user requests to join public league", async () => {
        let leagueInfo = {};

        before(async()=>{
            leagueInfo = await helpers.createLeague(usersInfo[1].cookie, "n", "public", "desc");
        })

        after(async() => {
            await helpers.deleteLeague(usersInfo[1].cookie, leagueInfo.leagueID);
        })

        it("Test /user_request_to_join", async function(){
            await request.post("/league/user_request_to_join")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .expect(200);

            let role = await helpers.getRole(usersInfo[0].cookie, leagueInfo.leagueID);

            // The league is public, so the user should be a participant in the league
            expect(role).to.equal("participant");

            // The league should appear in the user's Accepted requests
            let leagues = await helpers.getAcceptedLeagues(usersInfo[0].cookie);

            expect(leagues).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: 'n',
                  members: [ usersInfo[1].username, usersInfo[0].username ],
                  activeChallenges: 0
                }
              ]);
        });
    });

    describe("Test user role changes in league", async () => {
        let leagueInfo = {};
        beforeEach(async()=>{
            // Second User creates league
            leagueInfo = await helpers.createLeague(usersInfo[1].cookie, "n", "public", "desc");
            await helpers.joinLeague(usersInfo[0].cookie, leagueInfo.leagueID);
        })

        afterEach(async() => {
            await helpers.deleteLeague(usersInfo[1].cookie, leagueInfo.leagueID);
        })

        it("Test /ban_user", async function(){
            await request.post("/league/ban_user")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: usersInfo[0].username})
            .expect(200);

            await request.post("/league/get_member_list")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
                res._body.forEach((val) => expect(val.username).to.not.equal(usersInfo[0].username))
            })

            await request.post("/league/get_banned_list")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
                expect(res._body[0].username).to.equal(usersInfo[0].username);
            })

            await request.post("/league/get_role")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
               expect(res._body).to.equal("none");
            })

        });

        it("Test /unban_user", async function(){
            await request.post("/league/ban_user")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: usersInfo[0].username})
            .expect(200);

            await request.post("/league/unban_user")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: usersInfo[0].username})
            .expect(200);

            await request.post("/league/get_banned_list")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
                expect(res._body).to.not.contain(usersInfo[0].username);
            })
        });

        it("Test /kick_member", async function(){
            await request.post("/league/kick_member")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: usersInfo[0].username})
            .expect(200);

            await request.post("/league/get_member_list")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
                res._body.forEach((val) => expect(val.username).to.not.equal(usersInfo[0].username))
            })

            await request.post("/league/get_banned_list")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
                expect(res._body.length).to.equal(0);
            })
        });

        it("Test /add_admin", async function(){
            await request.post("/league/add_admin")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: usersInfo[0].username})
            .expect(200);

            await request.post("/league/get_role")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
               expect(res._body).to.equal("admin");
            })
        });

        it("Test /remove_admin", async function(){
            await request.post("/league/add_admin")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: usersInfo[0].username})
            .expect(200);

            await request.post("/league/remove_admin")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: usersInfo[0].username})
            .expect(200);

            await request.post("/league/get_role")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
               expect(res._body).to.equal("participant");
            })
        });
    });

   describe("Test member actions in league", async () => {
        let leagueInfo = {};
        beforeEach(async()=>{
            // Second User creates league
            leagueInfo = await helpers.createLeague(usersInfo[1].cookie, "n", "public", "desc");
            await helpers.joinLeague(usersInfo[0].cookie, leagueInfo.leagueID);
        })

        afterEach(async() => {
            await helpers.deleteLeague(usersInfo[1].cookie, leagueInfo.leagueID);
        })

        it("Test /leave_league", async function(){
            await request.post("/league/leave_league")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .expect(200);

            let leagues = await helpers.getAcceptedLeagues(usersInfo[0].cookie);
            expect(leagues.length).to.equal(0);
        });

        it("Test /user_remove_admin", async function(){
            await request.post("/league/add_admin")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: usersInfo[0].username})
            .expect(200);

            await request.post("/league/user_remove_admin")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .expect(200);

            await request.post("/league/get_role")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
               expect(res._body).to.equal("participant");
            })
        });
    });

    describe("Test member roles in league", async () => {
        let leagueInfo = {};

        before(async()=>{
            // User 2 Creates the League
            leagueInfo = await helpers.createLeague(usersInfo[1].cookie, "n", "public", "desc");

            // User 1 is made into an admin
            await helpers.joinLeague(usersInfo[0].cookie, leagueInfo.leagueID);
            await request.post("/league/add_admin")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: usersInfo[0].username})
            .expect(200);

            // User 3 is just a user
            await helpers.joinLeague(usersInfo[2].cookie, leagueInfo.leagueID);

            // User 4 has no relation to the league
        })

        after(async() => {
            await helpers.deleteLeague(usersInfo[1].cookie, leagueInfo.leagueID);
        })

        it("Test /get_role when user is owner", async function(){
            await request.post("/league/get_role")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
               expect(res._body).to.equal("owner");
            })
        });

        it("Test /get_role when user is admin", async function(){
            await request.post("/league/get_role")
            .set("Cookie", usersInfo[0].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
               expect(res._body).to.equal("admin");
            })
        });

        it("Test /get_role when user is participant", async function(){
            await request.post("/league/get_role")
            .set("Cookie", usersInfo[2].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
               expect(res._body).to.equal("participant");
            })
        });

        it("Test /get_role when user has no role", async function(){
            await request.post("/league/get_role")
            .set("Cookie", usersInfo[3].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
               expect(res._body).to.equal("none");
            })
        });

        it("Test /get_member_list", async function(){
            await request.post("/league/get_member_list")
            .set("Cookie", usersInfo[1].cookie)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
                expect(res._body).to.deep.equalInAnyOrder(
                    [
                        { username: usersInfo[2].username, displayName: 'Diana', role: 'participant' },
                        { username: usersInfo[0].username, displayName: 'Clark', role: 'admin' },
                        { username: usersInfo[1].username, displayName: 'Bruce', role: 'owner' }
                    ]
                )
            })
        });
    });

    describe("Test user gets types of leagues", async () => {
        let leagueInfo;
        before(async function (){
            // Owner: Username 1
            leagueInfo = await helpers.createLeague(usersInfo[0].cookie, "n", "private", "desc");

            // Admin: Username 2
            await helpers.inviteLeague(usersInfo[0].cookie, leagueInfo.leagueID, usersInfo[1].username);
            await helpers.acceptLeagueInvite(usersInfo[1].cookie, leagueInfo.leagueID);
            await helpers.addAdmin(usersInfo[0].cookie, leagueInfo.leagueID, usersInfo[1].username);

            // Participant: Username 3
            await helpers.inviteLeague(usersInfo[0].cookie, leagueInfo.leagueID, usersInfo[2].username);
            await helpers.acceptLeagueInvite(usersInfo[2].cookie, leagueInfo.leagueID);

            // Invited: Username 4
            await helpers.inviteLeague(usersInfo[0].cookie, leagueInfo.leagueID, usersInfo[3].username);

            // Pending: Username 5
            await helpers.joinLeague(usersInfo[4].cookie, leagueInfo.leagueID);

            // Banned : Username 6
            await helpers.banUser(usersInfo[0].cookie, leagueInfo.leagueID, usersInfo[5].username)
        });

        after(async function () {
            await helpers.deleteLeague(usersInfo[0].cookie, leagueInfo.leagueID);
        })

        it("Test /get_owned_leagues", async function () {
            let results = await helpers.getOwnedLeagues(usersInfo[0].cookie);
            expect(results).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: leagueInfo.leagueName,
                  members: [ usersInfo[0].username, usersInfo[1].username, usersInfo[2].username ],
                  activeChallenges: 0
                }
            ])

            results = await helpers.getOwnedLeagues(usersInfo[1].cookie);
            expect(results.length).to.equal(0);
        });

        it("Test /get_admin_leagues", async function () {
            let results = await helpers.getAdminLeagues(usersInfo[0].cookie);
            delete results[0].dateCreated;
            expect(results).to.deep.equalInAnyOrder([
                {
                    _id: leagueInfo.leagueID,
                    owner: usersInfo[0].username,
                    leagueDescription: 'desc',
                    leagueName: 'n',
                    leagueType: 'private',
                    pendingRequests: [ usersInfo[4].username ],
                    sentRequests: [ usersInfo[3].username ],
                    bannedUsers: [ usersInfo[5].username ],
                    admin: [ usersInfo[0].username, usersInfo[1].username ],
                    members: [ usersInfo[0].username, usersInfo[1].username, usersInfo[2].username ],
                    __v: 0
                }
            ])

            results = await helpers.getAdminLeagues(usersInfo[1].cookie);
            delete results[0].dateCreated;

            expect(results).to.deep.equal([
                {
                    _id: leagueInfo.leagueID,
                    owner: usersInfo[0].username,
                    leagueDescription: 'desc',
                    leagueName: 'n',
                    leagueType: 'private',
                    pendingRequests: [ usersInfo[4].username ],
                    sentRequests: [ usersInfo[3].username ],
                    bannedUsers: [ usersInfo[5].username ],
                    admin: [ usersInfo[0].username, usersInfo[1].username ],
                    members: [ usersInfo[0].username, usersInfo[1].username, usersInfo[2].username ],
                    __v: 0
                }
            ])

            results = await helpers.getAdminLeagues(usersInfo[2].cookie);
            expect(results.length).to.equal(0);
        });

        it("Test /get_admin_leagues_with_challenge_count",async function () {
            let results = await helpers.getAdminLeaguesCount(usersInfo[0].cookie);
            expect(results).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: leagueInfo.leagueName,
                  members: [ usersInfo[0].username, usersInfo[1].username, usersInfo[2].username ],
                  activeChallenges: 0
                }
            ])

            results = await helpers.getAdminLeaguesCount(usersInfo[1].cookie);
            expect(results).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: leagueInfo.leagueName,
                  members: [ usersInfo[0].username, usersInfo[1].username, usersInfo[2].username ],
                  activeChallenges: 0
                }
            ])

            results = await helpers.getAdminLeaguesCount(usersInfo[2].cookie);
            expect(results.length).to.equal(0);
        });

        it("Test /get_requested_leagues", async function () {
            let results = await helpers.getSentLeagues(usersInfo[0].cookie);
            expect(results.length).to.equal(0);

            results = await helpers.getSentLeagues(usersInfo[4].cookie);
            expect(results).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: leagueInfo.leagueName,
                  members: [ usersInfo[0].username, usersInfo[1].username, usersInfo[2].username ],
                  activeChallenges: 0
                }
            ])
        });

        it("Test /get_invited_leagues", async function () {
            let results = await helpers.getInvitedLeagues(usersInfo[0].cookie);
            expect(results.length).to.equal(0);

            results = await helpers.getInvitedLeagues(usersInfo[3].cookie);
            expect(results).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: leagueInfo.leagueName,
                  members: [ usersInfo[0].username, usersInfo[1].username, usersInfo[2].username ],
                  activeChallenges: 0
                }
            ])
        });

        it("Test /get_leagues", async function () {
            let results = await helpers.getAcceptedLeagues(usersInfo[0].cookie);
            expect(results).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: leagueInfo.leagueName,
                  members: [ usersInfo[0].username, usersInfo[1].username, usersInfo[2].username ],
                  activeChallenges: 0
                }
            ])

            results = await helpers.getAcceptedLeagues(usersInfo[2].cookie);
            expect(results).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: leagueInfo.leagueName,
                  members: [ usersInfo[0].username, usersInfo[1].username, usersInfo[2].username ],
                  activeChallenges: 0
                }
            ])

            results = await helpers.getAcceptedLeagues(usersInfo[3].cookie);
            expect(results.length).to.equal(0);
        });

        it("Test /get_member_list", async function () {
            let members = await helpers.getMemberListLeague(usersInfo[0].cookie, leagueInfo.leagueID);
            expect(members).to.deep.equalInAnyOrder([
                { username: usersInfo[0].username, displayName: users[0].given_name, role: 'owner' },
                { username: usersInfo[1].username, displayName: users[1].given_name, role: 'admin' },
                { username: usersInfo[2].username, displayName: users[2].given_name, role: 'participant' }
            ])
        });

        it("Test /get_banned_list", async function () {
            let members = await helpers.getBannedListLeague(usersInfo[0].cookie, leagueInfo.leagueID);
            expect(members).to.deep.equalInAnyOrder([
                { username: usersInfo[5].username, displayName: users[5].given_name}
            ])
        });

        it("Test /get_sent_invite_list", async function () {
            let members = await helpers.getSentInviteListLeague(usersInfo[0].cookie, leagueInfo.leagueID);
            expect(members).to.deep.equalInAnyOrder([
                { username: usersInfo[3].username, displayName: users[3].given_name}
            ])
        });

        it("Test /get_pending_request_list", async function () {
            let members = await helpers.getReceivedInviteListLeague(usersInfo[0].cookie, leagueInfo.leagueID);
            expect(members).to.deep.equalInAnyOrder([
                { username: usersInfo[4].username, displayName: users[4].given_name}
            ])
        });

        it("Test that a banned user cannot request entry into a league", async function () {
            await helpers.joinLeague(usersInfo[5].cookie, leagueInfo.leagueID);
            let members = await helpers.getReceivedInviteListLeague(usersInfo[0].cookie, leagueInfo.leagueID);
            expect(members.length).to.equal(1);
        });

        it("Test that a user should be unbanned when a league invites them", async function () {
            await helpers.inviteLeague(usersInfo[0].cookie, leagueInfo.leagueID, usersInfo[5].username);

            let members = await helpers.getReceivedInviteListLeague(usersInfo[0].cookie, leagueInfo.leagueID);
            expect(members.length).to.equal(2);

            let bannedMembers = await helpers.getBannedListLeague(usersInfo[0].cookie, leagueInfo.leagueID);
            expect(bannedMembers.length).to.equal(0);
        });
    });

    describe("Test /get_league_active_challenges", async function () {
        let leagueInfo;

        before(async function (){
            leagueInfo = await helpers.createLeague(usersInfo[0].cookie, "n", "private", "desc");
        })

        after(async function(){
            await helpers.deleteLeague(usersInfo[0].cookie, leagueInfo.leagueID);
        });

        it("Test league has no active challenges", async function () {
            let results = await helpers.getActiveChallengesLeague(usersInfo[0].cookie, leagueInfo.leagueID);
            expect(results).to.equal(0);
        });

        it("Test league has multiple active challenges", async function () {
            await helpers.sendLeagueChallenge(usersInfo[0].cookie, leagueInfo.leagueID);
            await helpers.sendLeagueChallenge(usersInfo[0].cookie, leagueInfo.leagueID);
            let results = await helpers.getActiveChallengesLeague(usersInfo[0].cookie, leagueInfo.leagueID);
            expect(results).to.equal(2);
        });
    });

    // Missing League lines
    describe("Test /get_league_leaderboard", async function () {
        let leagueInfo = {};
        before(async()=>{
            leagueInfo = await helpers.createLeague(usersInfo[0].cookie, "n", "private", "desc");
            await helpers.sendLeagueChallenge(usersInfo[0].cookie, leagueInfo.leagueID);
        })

        after(async() => {
            await helpers.deleteLeague(usersInfo[0].cookie, leagueInfo.leagueID);
        })

        it("Test when no member has completed a challenge", async function () {

        });

        it("Test when one member has completed a challenge", async function () {

        });

        it("Test when everyone has completed some challenges", async function () {

        });
    });

    /*describe("Test /get_recent_acivity", async function () {
        it("Test 0 Recent Activities", async function () {

        });

        it("Test 1 Recent Activity", async function () {

        });

        it("Test 5 Recent Activities", async function () {

        });

        it("Test 6 Recent Activites", async function () {

        });
    });*/

    /*describe("Test /get_recommended", async function () {
        it("Test Situation with 0 Recommended Leagues", async function () {

        });

        it("Test Situation with 1 Recommended Leagues", async function () {

        });

        it("Test Situation with 5 Recommended Leagues", async function () {

        });

        it("Test Situation with More than 5 Recommended Leagues", async function () {

        });
    });*/
});

