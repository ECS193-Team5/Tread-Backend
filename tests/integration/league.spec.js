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

let user1 = {
    "sub": "league1",
    "given_name": "Clark",
    "family_name": "Kent",
}

let user2 = {
    "sub": "league2",
    "given_name": "Bruce",
    "family_name": "Wayne",
}

let user3 = {
    "sub": "league3",
    "given_name": "Diana",
    "family_name": "Prince",
}

let user4 = {
    "sub": "league4",
    "given_name": "Charles",
    "family_name": "Xavier",
}

let user5 = {
    "sub": "league5",
    "given_name": "Tony",
    "family_name": "Stark",
}

let user6 = {
    "sub": "league6",
    "given_name": "Pepper",
    "family_name": "Pots",
}

request = request(app);

describe('Testing league routes', () => {
    let cookieUser1 = "";
    let cookieUser2 = "";
    let cookieUser3 = "";
    let cookieUser4 = "";
    let cookieUser5 = "";
    let cookieUser6 = "";
    let username1 = "";
    let username2 = "";
    let username3 = "";
    let username4 = "";
    let username5 = "";
    let username6 = "";

    before(async () => {
        cookieUser1 = await helpers.createUser(user1, sandbox);
        username1 = await helpers.getUsername(cookieUser1);
        cookieUser2 = await helpers.createUser(user2, sandbox);
        username2 = await helpers.getUsername(cookieUser2);
        cookieUser3 = await helpers.createUser(user3, sandbox);
        username3 = await helpers.getUsername(cookieUser3);
        cookieUser4 = await helpers.createUser(user4, sandbox);
        username4 = await helpers.getUsername(cookieUser4);
        cookieUser5 = await helpers.createUser(user5, sandbox);
        username5 = await helpers.getUsername(cookieUser5);
        cookieUser6 = await helpers.createUser(user6, sandbox);
        username6 = await helpers.getUsername(cookieUser6);
    });

    after(async () => {
        cookieUser1 = await helpers.loginUser(user1, sandbox);
        await helpers.deleteUser(cookieUser1);
        cookieUser2 = await helpers.loginUser(user2, sandbox);
        await helpers.deleteUser(cookieUser2);
        cookieUser3 = await helpers.loginUser(user3, sandbox);
        await helpers.deleteUser(cookieUser3);
        cookieUser4 = await helpers.loginUser(user4, sandbox);
        await helpers.deleteUser(cookieUser4);
        cookieUser5 = await helpers.loginUser(user5, sandbox);
        await helpers.deleteUser(cookieUser5);
        cookieUser6 = await helpers.loginUser(user6, sandbox);
        await helpers.deleteUser(cookieUser6);
    });

    describe("Testing league formation", async () => {

        it("Test create league", async () => {
            let id;
            let inputData = {
                "leagueName": "name",
                "leagueType": "public",
                "leagueDescription": "description",
                "leaguePicture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png"
            };

            await request.post("/league/create_league")
                .set("Cookie", cookieUser1)
                .set("Accept", "application/json")
                .send(inputData)
                .then(res => { })

            await request.post("/league/get_leagues")
                .set("Cookie", cookieUser1)
                .set('Accept', 'application/json')
                .then(res => {
                    id = res._body[0]._id;
                })

            await request
                .post("/league/get_league_name_description_type")
                .set("Cookie", cookieUser1)
                .set('Accept', 'application/json')
                .send({leagueID: id})
                .then(res => {
                    expect(res._body.leagueDescription).to.equal("description");
                    expect(res._body.leagueName).to.equal("name");
                    expect(res._body.leagueType).to.equal("public");
                })

            // clean up
            await helpers.deleteLeague(cookieUser1, id);
        });

        it("Test delete league", async () => {
            let leagueInfo = await helpers.createLeague(cookieUser1, "n", "private", "desc");

            // League is created
            await request.post("/league/delete_league")
                .set("Cookie", cookieUser1)
                .set("Accept", "application/json")
                .send({leagueID: leagueInfo.leagueID})
                .expect(200)

            await request
                .post("/league/get_league_name_description_type")
                .set("Cookie", cookieUser1)
                .set('Accept', 'application/json')
                .send({leagueID: leagueInfo.leagueID})
                .then(res =>{
                    expect(res._body).to.equal(null)
                })
        });

        it("Test leauge info read private", async () => {
            let leagueInfo = await helpers.createLeague(cookieUser1, "n", "private", "desc");

            await request
                .post("/league/get_league_name_description_type")
                .set("Cookie", cookieUser1)
                .set('Accept', 'application/json')
                .send({leagueID: leagueInfo.leagueID})
                .then(res =>{
                    expect(res._body.leagueType).to.equal("private")
                    expect(res._body.leagueName).to.equal("n")
                    expect(res._body.leagueDescription).to.equal("desc")
                })

            await helpers.deleteLeague(cookieUser1, leagueInfo.leagueID)
        });

        it("Test leauge info read public", async () => {
            let leagueInfo = await helpers.createLeague(cookieUser1, "n", "public", "desc");

            await request
                .post("/league/get_league_name_description_type")
                .set("Cookie", cookieUser1)
                .set('Accept', 'application/json')
                .send({leagueID: leagueInfo.leagueID})
                .then(res =>{
                    expect(res._body.leagueType).to.equal("public")
                    expect(res._body.leagueName).to.equal("n")
                    expect(res._body.leagueDescription).to.equal("desc")
                })

            await helpers.deleteLeague(cookieUser1, leagueInfo.leagueID)
        });

    });

   describe("Testing edit", async () => {
        let leagueInfo = {};
        before(async()=>{
            leagueInfo = await helpers.createLeague(cookieUser1, "n", "private", "desc");
        })

        after(async() => {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            await helpers.deleteLeague(cookieUser1, leagueInfo.leagueID);
        })

        it("Test edit league name", async () => {
            await request
            .post("/league/update_name")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, leagueName:"newName"})
            .expect(200)
            await request
                .post("/league/get_league_name_description_type")
                .set("Cookie", cookieUser1)
                .set('Accept', 'application/json')
                .send({leagueID: leagueInfo.leagueID})
                .then(res => {
                    expect(res._body.leagueName).to.equal("newName");
                })
        });

        it("Test edit league description", async () => {
            await request
            .post("/league/update_description")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, leagueDescription:"newDescription"})
            .expect(200)

            await request
                .post("/league/get_league_name_description_type")
                .set("Cookie", cookieUser1)
                .set('Accept', 'application/json')
                .send({leagueID: leagueInfo.leagueID})
                .then(res => {
                    expect(res._body.leagueDescription).to.equal("newDescription");
                })
        });

        it("Test edit league picture", async () => {
            await request
            .post("/league/update_picture")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, leaguePicture:"https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png"})
            .expect(200)
        });

        it("Test edit league type", async () => {
            await request
            .post("/league/update_type")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, leagueType:"public"})
            .expect(200)

            await request
                .post("/league/get_league_name_description_type")
                .set("Cookie", cookieUser1)
                .set('Accept', 'application/json')
                .send({leagueID: leagueInfo.leagueID})
                .then(res => {
                    expect(res._body.leagueType).to.equal("public");
                })
        });
    });

    describe("Test user entry into private leagues when the user requests to join", async () => {
        let leagueInfo = {};
        beforeEach(async()=>{
            // Second User creates league
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            leagueInfo = await helpers.createLeague(cookieUser2, "n", "private", "desc");
            cookieUser1 = await helpers.loginUser(user1, sandbox);
        })

        afterEach(async() => {
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            await helpers.deleteLeague(cookieUser2, leagueInfo.leagueID);
        })

        it("User requests to join", async function(){
            // User requests to join
            await request.post("/league/user_request_to_join")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .expect(200);

            let role = await helpers.getRole(cookieUser1, leagueInfo.leagueID);

            // The league is private, so the user should be not in the league
            expect(role).to.equal("none");

            // The league should appear in the user's sent requests
            let leagues = await helpers.getSentLeagues(cookieUser1);

            expect(leagues).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: 'n',
                  members: [ username2 ],
                  activeChallenges: 0
                }
              ]);
        });

        it("User requests to join and is refused", async function(){
            await helpers.joinLeague(cookieUser1, leagueInfo.leagueID);
            cookieUser2 = await helpers.loginUser(user2, sandbox);

            await request.post("/league/decline_request")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: username1})
            .expect(200);

            cookieUser1 = await helpers.loginUser(user1, sandbox);
            let leagues = await helpers.getSentLeagues(cookieUser1);
            expect(leagues.length).to.equal(0);

            leagues = await helpers.getAcceptedLeagues(cookieUser1);
            expect(leagues.length).to.equal(0);
        });

        it("User requests to join and is accepted", async function(){
            await helpers.joinLeague(cookieUser1, leagueInfo.leagueID);
            cookieUser2 = await helpers.loginUser(user2, sandbox);

            await request.post("/league/accept_join_request")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: username1})
            .expect(200);

            cookieUser1 = await helpers.loginUser(user1, sandbox);
            let leagues = await helpers.getSentLeagues(cookieUser1);
            expect(leagues.length).to.equal(0);

            leagues = await helpers.getAcceptedLeagues(cookieUser1);
            expect(leagues.length).to.equal(1);

            expect(leagues).to.deep.equal([
                {
                    _id: leagueInfo.leagueID,
                    leagueName: 'n',
                    members: [ username2, username1 ],
                    activeChallenges: 0
                  }
              ]);
        });

        it("User requests to join and revokes the request", async function(){
            await helpers.joinLeague(cookieUser1, leagueInfo.leagueID);

            await request.post("/league/user_undo_request")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .expect(200);

            let leagues = await helpers.getSentLeagues(cookieUser1);

            expect(leagues.length).to.equal(0);
        });
    });

    describe("Test user entry into league when the user is invited to join", async () => {
        let leagueInfo = {};
        beforeEach(async()=>{
            // Second User creates league
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            leagueInfo = await helpers.createLeague(cookieUser2, "n", "private", "desc");
        })

        afterEach(async() => {
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            await helpers.deleteLeague(cookieUser2, leagueInfo.leagueID);
        })

        it("User is invited to join", async function(){
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            await request.post("/league/invite_to_join")
                .set("Cookie", cookieUser2)
                .set('Accept', 'application/json')
                .send({recipient: username1, leagueID: leagueInfo.leagueID})
                .expect(200);

            // User should see league in their received requests
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            let results = await helpers.getInvitedLeagues(cookieUser1);

            expect(results.length).to.equal(1);

            expect(results).to.deep.equal([
                {
                    _id: leagueInfo.leagueID,
                    leagueName: 'n',
                    members: [ username2 ],
                    activeChallenges: 0
                  }
              ]);
        });

        it("User is invited to join and accepts", async function(){
            await helpers.inviteLeague(cookieUser2, leagueInfo.leagueID, username1);

            cookieUser1 = await helpers.loginUser(user1, sandbox);
            await request.post("/league/user_accept_invite")
                .set("Cookie", cookieUser1)
                .set('Accept', 'application/json')
                .send({leagueID: leagueInfo.leagueID})
                .expect(200);

            let leagues = await helpers.getInvitedLeagues(cookieUser1);
            expect(leagues.length).to.equal(0);

            leagues = await helpers.getAcceptedLeagues(cookieUser1);
            expect(leagues.length).to.equal(1);

            expect(leagues).to.deep.equal([
                {
                    _id: leagueInfo.leagueID,
                    leagueName: 'n',
                    members: [ username2, username1 ],
                    activeChallenges: 0
                  }
              ]);
        });

        it("User is invited to join and refuses", async function(){
            await helpers.inviteLeague(cookieUser2, leagueInfo.leagueID, username1);

            cookieUser1 = await helpers.loginUser(user1, sandbox);
            await request.post("/league/user_decline_invite")
                .set("Cookie", cookieUser1)
                .set('Accept', 'application/json')
                .send({leagueID: leagueInfo.leagueID})
                .expect(200);

            let leagues = await helpers.getInvitedLeagues(cookieUser1);
            expect(leagues.length).to.equal(0);

            leagues = await helpers.getAcceptedLeagues(cookieUser1);
            expect(leagues.length).to.equal(0);
        });

        it("User is invited to join and it is revoked", async function(){
            await helpers.inviteLeague(cookieUser2, leagueInfo.leagueID, username1);

            await request.post("/league/undo_invite")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: username1})
            .expect(200);

            cookieUser1 = await helpers.loginUser(user1, sandbox);

            let leagues = await helpers.getInvitedLeagues(cookieUser1);
            expect(leagues.length).to.equal(0);

            leagues = await helpers.getAcceptedLeagues(cookieUser1);
            expect(leagues.length).to.equal(0);

        });
    });

    describe("Test user entry into public league when user requests to join", async () => {
        let leagueInfo = {};
        before(async()=>{
            // Second User creates league
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            leagueInfo = await helpers.createLeague(cookieUser2, "n", "public", "desc");
        })

        after(async() => {
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            await helpers.deleteLeague(cookieUser2, leagueInfo.leagueID);
        })

        it("User requests to join", async function(){
            await request.post("/league/user_request_to_join")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .expect(200);

            let role = await helpers.getRole(cookieUser1, leagueInfo.leagueID);

            // The league is public, so the user should be a participant in the league
            expect(role).to.equal("participant");

            // The league should appear in the user's Accepted requests
            let leagues = await helpers.getAcceptedLeagues(cookieUser1);

            expect(leagues).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: 'n',
                  members: [ username2, username1 ],
                  activeChallenges: 0
                }
              ]);
        });
    });

    describe("Test owner interacts with user role in league", async () => {
        let leagueInfo = {};
        beforeEach(async()=>{
            // Second User creates league
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            leagueInfo = await helpers.createLeague(cookieUser2, "n", "public", "desc");
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            helpers.joinLeague(cookieUser1, leagueInfo.leagueID);
            cookieUser2 = await helpers.loginUser(user2, sandbox);
        })

        afterEach(async() => {
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            await helpers.deleteLeague(cookieUser2, leagueInfo.leagueID);
        })

        it("Test ban user", async function(){
            await request.post("/league/ban_user")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: username1})
            .expect(200);

            await request.post("/league/get_member_list")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
                res._body.forEach((val) => expect(val.username).to.not.equal(username1))
            })

            await request.post("/league/get_banned_list")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
                expect(res._body[0].username).to.equal(username1);
            })

            cookieUser1 = await helpers.loginUser(user1, sandbox);
            await request.post("/league/get_role")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
               expect(res._body).to.equal("none");
            })

        });

        it("Test unban user", async function(){
            await request.post("/league/ban_user")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: username1})
            .expect(200);

            await request.post("/league/unban_user")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: username1})
            .expect(200);

            await request.post("/league/get_banned_list")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
                expect(res._body).to.not.contain(username1);
            })
        });

        it("Test kick out user", async function(){
            await request.post("/league/kick_member")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: username1})
            .expect(200);

            await request.post("/league/get_member_list")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
                res._body.forEach((val) => expect(val.username).to.not.equal(username1))
            })

            await request.post("/league/get_banned_list")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
                expect(res._body.length).to.equal(0);
            })
        });

        it("Test add user to admin", async function(){
            await request.post("/league/add_admin")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: username1})
            .expect(200);

            cookieUser1 = await helpers.loginUser(user1, sandbox);
            await request.post("/league/get_role")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
               expect(res._body).to.equal("admin");
            })
        });

        it("Test remove user from admin", async function(){
            await request.post("/league/add_admin")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: username1})
            .expect(200);

            await request.post("/league/remove_admin")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: username1})
            .expect(200);

            cookieUser1 = await helpers.loginUser(user1, sandbox);
            await request.post("/league/get_role")
            .set("Cookie", cookieUser1)
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
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            leagueInfo = await helpers.createLeague(cookieUser2, "n", "public", "desc");
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            await helpers.joinLeague(cookieUser1, leagueInfo.leagueID);
        })

        afterEach(async() => {
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            await helpers.deleteLeague(cookieUser2, leagueInfo.leagueID);
        })

        it("Test leave league", async function(){
            await request.post("/league/leave_league")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .expect(200);

            let leagues = await helpers.getAcceptedLeagues(cookieUser1);
            expect(leagues.length).to.equal(0);
        });

        it("Test remove self as admin", async function(){
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            await request.post("/league/add_admin")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: username1})
            .expect(200);

            cookieUser1 = await helpers.loginUser(user1, sandbox);
            await request.post("/league/user_remove_admin")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .expect(200);

            await request.post("/league/get_role")
            .set("Cookie", cookieUser1)
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
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            leagueInfo = await helpers.createLeague(cookieUser2, "n", "public", "desc");

            // User 1 is made into an admin
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            await helpers.joinLeague(cookieUser1, leagueInfo.leagueID);
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            await request.post("/league/add_admin")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID, recipient: username1})
            .expect(200);

            // User 3 is just a user
            cookieUser3 = await helpers.loginUser(user3, sandbox);
            await helpers.joinLeague(cookieUser3, leagueInfo.leagueID);

            // User 4 has no relation to the league
        })

        after(async() => {
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            await helpers.deleteLeague(cookieUser2, leagueInfo.leagueID);
        })

        it("Test member is owner", async function(){
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            await request.post("/league/get_role")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
               expect(res._body).to.equal("owner");
            })
        });

        it("Test member is admin", async function(){
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            await request.post("/league/get_role")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
               expect(res._body).to.equal("admin");
            })
        });

        it("Test member is participant", async function(){
            cookieUser3 = await helpers.loginUser(user3, sandbox);
            await request.post("/league/get_role")
            .set("Cookie", cookieUser3)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
               expect(res._body).to.equal("participant");
            })
        });

        it("Test member is no one", async function(){
            cookieUser4 = await helpers.loginUser(user4, sandbox);
            await request.post("/league/get_role")
            .set("Cookie", cookieUser4)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
               expect(res._body).to.equal("none");
            })
        });

        it("Test member list", async function(){
            await request.post("/league/get_member_list")
            .set("Cookie", cookieUser2)
            .set('Accept', 'application/json')
            .send({leagueID: leagueInfo.leagueID})
            .then(res=>{
                expect(res._body).to.deep.equalInAnyOrder(
                    [
                        { username: username3, displayName: 'Diana', role: 'participant' },
                        { username: username1, displayName: 'Clark', role: 'admin' },
                        { username: username2, displayName: 'Bruce', role: 'owner' }
                    ]
                )
            })
        });
    });

    describe("Test get sections of leagues", async () => {
        let leagueInfo;
        before(async function (){
            // Owner: Username 1
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            leagueInfo = await helpers.createLeague(cookieUser1, "n", "private", "desc");

            // Admin: Username 2
            await helpers.inviteLeague(cookieUser1, leagueInfo.leagueID, username2);
            cookieUser2 = await helpers.loginUser(user2, sandbox);
            await helpers.acceptLeagueInvite(cookieUser2, leagueInfo.leagueID);
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            await helpers.addAdmin(cookieUser1, leagueInfo.leagueID, username2);

            // Participant: Username 3
            await helpers.inviteLeague(cookieUser1, leagueInfo.leagueID, username3);
            cookieUser3 = await helpers.loginUser(user3, sandbox);
            await helpers.acceptLeagueInvite(cookieUser3, leagueInfo.leagueID);

            // Invited: Username 4
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            await helpers.inviteLeague(cookieUser1, leagueInfo.leagueID, username4);

            // Pending: Username 5
            cookieUser5 = await helpers.loginUser(user5, sandbox);
            await helpers.joinLeague(cookieUser5, leagueInfo.leagueID);

            // Banned : Username 6
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            await helpers.banUser(cookieUser1, leagueInfo.leagueID, username6)
        });

        after(async function () {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            await helpers.deleteLeague(cookieUser1, leagueInfo.leagueID);
        })

        it("Test owner list of leagues", async function () {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            let results = await helpers.getOwnedLeagues(cookieUser1);
            expect(results).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: leagueInfo.leagueName,
                  members: [ username1, username2, username3 ],
                  activeChallenges: 0
                }
            ])

            cookieUser2 = await helpers.loginUser(user2, sandbox);
            results = await helpers.getOwnedLeagues(cookieUser2);
            expect(results.length).to.equal(0);
        });

        it("Test admin list of leagues", async function () {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            let results = await helpers.getAdminLeagues(cookieUser1);
            delete results[0].dateCreated;
            expect(results).to.deep.equalInAnyOrder([
                {
                    _id: leagueInfo.leagueID,
                    owner: username1,
                    leagueDescription: 'desc',
                    leagueName: 'n',
                    leagueType: 'private',
                    pendingRequests: [ username5 ],
                    sentRequests: [ username4 ],
                    bannedUsers: [ username6 ],
                    admin: [ username1, username2 ],
                    members: [ username1, username2, username3 ],
                    __v: 0
                }
            ])

            cookieUser2 = await helpers.loginUser(user2, sandbox);
            results = await helpers.getAdminLeagues(cookieUser2);
            delete results[0].dateCreated;

            expect(results).to.deep.equal([
                {
                    _id: leagueInfo.leagueID,
                    owner: username1,
                    leagueDescription: 'desc',
                    leagueName: 'n',
                    leagueType: 'private',
                    pendingRequests: [ username5 ],
                    sentRequests: [ username4 ],
                    bannedUsers: [],
                    admin: [ username1, username2 ],
                    members: [ username1, username2, username3 ],
                    __v: 0
                }
            ])

            cookieUser3 = await helpers.loginUser(user3, sandbox);
            results = await helpers.getAdminLeagues(cookieUser3);
            expect(results.length).to.equal(0);
        });

        it("Test admin list of leagues with counts",async function () {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            let results = await helpers.getAdminLeaguesCount(cookieUser1);
            expect(results).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: leagueInfo.leagueName,
                  members: [ username1, username2, username3 ],
                  activeChallenges: 0
                }
            ])

            cookieUser2 = await helpers.loginUser(user2, sandbox);
            results = await helpers.getAdminLeaguesCount(cookieUser2);
            expect(results).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: leagueInfo.leagueName,
                  members: [ username1, username2, username3 ],
                  activeChallenges: 0
                }
            ])

            cookieUser3 = await helpers.loginUser(user3, sandbox);
            results = await helpers.getAdminLeaguesCount(cookieUser3);
            expect(results.length).to.equal(0);
        });

        it("Test sent list of leagues", async function () {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            let results = await helpers.getSentLeagues(cookieUser1);
            expect(results.length).to.equal(0);

            cookieUser5 = await helpers.loginUser(user5, sandbox);
            results = await helpers.getSentLeagues(cookieUser5);
            expect(results).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: leagueInfo.leagueName,
                  members: [ username1, username2, username3 ],
                  activeChallenges: 0
                }
            ])
        });

        it("Test invited list of leagues", async function () {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            let results = await helpers.getInvitedLeagues(cookieUser1);
            expect(results.length).to.equal(0);

            cookieUser4 = await helpers.loginUser(user4, sandbox);
            results = await helpers.getInvitedLeagues(cookieUser4);
            expect(results).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: leagueInfo.leagueName,
                  members: [ username1, username2, username3 ],
                  activeChallenges: 0
                }
            ])
        });

        it("Test joined leagues", async function () {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            let results = await helpers.getAcceptedLeagues(cookieUser1);
            expect(results).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: leagueInfo.leagueName,
                  members: [ username1, username2, username3 ],
                  activeChallenges: 0
                }
            ])

            cookieUser3= await helpers.loginUser(user3, sandbox);
            results = await helpers.getAcceptedLeagues(cookieUser3);
            expect(results).to.deep.equal([
                {
                  _id: leagueInfo.leagueID,
                  leagueName: leagueInfo.leagueName,
                  members: [ username1, username2, username3 ],
                  activeChallenges: 0
                }
            ])

            cookieUser4 = await helpers.loginUser(user4, sandbox);
            results = await helpers.getAcceptedLeagues(cookieUser4);
            expect(results.length).to.equal(0);
        });

        it("Test get all members", async function () {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            let members = await helpers.getMemberListLeague(cookieUser1, leagueInfo.leagueID);
            expect(members).to.deep.equalInAnyOrder([
                { username: username1, displayName: user1.given_name, role: 'owner' },
                { username: username2, displayName: user2.given_name, role: 'admin' },
                { username: username3, displayName: user3.given_name, role: 'participant' }
            ])
        });

        it("Test get banned list", async function () {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            let members = await helpers.getBannedListLeague(cookieUser1, leagueInfo.leagueID);
            expect(members).to.deep.equalInAnyOrder([
                { username: username6, displayName: user6.given_name}
            ])
        });

        it("Test get invited lists", async function () {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            let members = await helpers.getSentInviteListLeague(cookieUser1, leagueInfo.leagueID);
            expect(members).to.deep.equalInAnyOrder([
                { username: username4, displayName: user4.given_name}
            ])
        });

        it("Test get sent lists", async function () {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            let members = await helpers.getReceivedInviteListLeague(cookieUser1, leagueInfo.leagueID);
            expect(members).to.deep.equalInAnyOrder([
                { username: username5, displayName: user5.given_name}
            ])
        });

        it("Test banned user cannot appear in invite list", async function () {
            cookieUser6 = await helpers.loginUser(user6, sandbox);
            await helpers.joinLeague(cookieUser6, leagueInfo.leagueID);
            let members = await helpers.getReceivedInviteListLeague(cookieUser1, leagueInfo.leagueID);
            expect(members.length).to.equal(1);
        });

        it("Test unban user when send invite", async function () {
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            await helpers.inviteLeague(cookieUser1, leagueInfo.leagueID, username6);

            let members = await helpers.getReceivedInviteListLeague(cookieUser1, leagueInfo.leagueID);
            expect(members.length).to.equal(2);

            let bannedMembers = await helpers.getBannedListLeague(cookieUser1, leagueInfo.leagueID);
            expect(bannedMembers.length).to.equal(0);
        });
    });

    describe("Test get league active challenges", async function () {
        let leagueInfo;

        before(async function (){
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            leagueInfo = await helpers.createLeague(cookieUser1, "n", "private", "desc");
        })

        after(async function(){
            cookieUser1 = await helpers.loginUser(user1, sandbox);
            await helpers.deleteLeague(cookieUser1, leagueInfo.leagueID);
        })
        it("Test no active challenges", async function () {
            let results = await helpers.getActiveChallengesLeague(cookieUser1, leagueInfo.leagueID);
            expect(results).to.equal(0);
        });

        it("Test multiple active challenges", async function () {
            await helpers.sendLeagueChallenge(cookieUser1, leagueInfo.leagueID);
            await helpers.sendLeagueChallenge(cookieUser1, leagueInfo.leagueID);
            let results = await helpers.getActiveChallengesLeague(cookieUser1, leagueInfo.leagueID);
            expect(results).to.equal(2);
        });
    });

    /*describe("Test get league leaderboard", async function () {
        it("Test no completed challenges", async function () {

        });

        it("Test one completed challenges", async function () {

        });

        it("Test everyone completed challenges", async function () {

        });
    });*/

    /*describe("Test League Recent Activity", async function () {
        it("More than 5 Recent Activites", async function () {

        });

        it("0 Recent Activities", async function () {

        });

        it("Exactly 5 Recent Activities", async function () {

        });
    });*/

    /*describe("Test Recommended Leagues", async function () {
        it("Test Situation with No Recommneded Leagues", async function () {

        });

        it("Test Situation with One Recommneded Leagues", async function () {

        });

        it("Test Situation with Multiple (<5) Recommneded Leagues", async function () {

        });

        it("Test Situation with More than 5 Recommneded Leagues", async function () {

        });
    });*/
});

