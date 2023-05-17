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
    "sub": "league1",
    "given_name": "Clark",
    "family_name": "Kent",
}

let user2 = {
    "sub": "league2",
    "given_name": "Bruce",
    "family_name": "Wayne",
}


request = request(app);

describe('Testing league routes', () => {
    let cookieUser1 = "";
    let cookieUser2 = "";
    let username1 = "";
    let username2 = "";

    before(async () => {
        cookieUser1 = await helpers.createUser(user1, sandbox);
        username1 = await helpers.getUsername(cookieUser1);
        cookieUser2 = await helpers.createUser(user2, sandbox);
        username2 = await helpers.getUsername(cookieUser2);
    });

    after(async () => {
        cookieUser1 = await helpers.loginUser(user1, sandbox);
        await helpers.deleteUser(cookieUser1);
        cookieUser2 = await helpers.loginUser(user2, sandbox);
        await helpers.deleteUser(cookieUser2);
    });

    /*describe("Testing league formation", async () => {
        before(async () => {
            cookieUser1 = await helpers.createUser(user1, sandbox);
        })
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
            helpers.deleteLeague(cookieUser1, id);
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
    });*/

   /*describe("Testing edit", async () => {
        let leagueInfo = {};
        before(async()=>{
            cookieUser1 = await helpers.createUser(user1, sandbox);
            leagueInfo = await helpers.createLeague(cookieUser1, "n", "private", "desc");
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
        });*/
    })


});