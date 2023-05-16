var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../index");
const googleauth = require('google-auth-library');

async function createUser(sub, given_name, family_name) {
    let cookie = await loginUser(sub, given_name, family_name)
    await request.post("/sign_up/sign_up")
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({ "username": given_name, "displayName": given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
        .then(res => {
        })
    return cookie;
}

async function deleteUser(cookie) {
    await request.delete("/delete_user/")
        .set('Cookie', cookie)
        .then(res => {
        });
    return;
}

async function loginUser(sub, given_name, family_name) {
    let cookie = "";
    var userVal = {
        sub: sub,
        given_name: given_name,
        family_name: family_name,
        email: "testemail" + sub + "@gmail.com",
        picture: "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png"
    }
    let payloadStub = sandbox.stub().returns(userVal)
    sandbox.stub(googleauth.OAuth2Client.prototype, "verifyIdToken").resolves({ getPayload: payloadStub });
    await request.post("/auth/login/google")
        .set('Accept', 'application/json')
        .then(res => {
            cookie = res.headers['set-cookie'];
        }
        )
    return cookie;
}

async function createLeague(cookie){
    let formData = new FormData();
    formData.append("leagueName", "Testing League");
    formData.append("leagueType", "open");
    formData.append("leagueDescription", "This is a league");
    formData.append("leaguePicture", "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png");
   
    await request.post("/league/create_league")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .attach(formData)
    .then(res => {
        console.log(res.status);
    })
}

async function createLeagueAndAddUser(){

}

request = request(app);

describe('Testing express app routes', () => {
    before(function () {

    })
    describe('Testing /leauge notifications', () => {
        let req = {};
        let res = {};
        let cookie = "";

        before(async () => {
            cookie = await createUser("1", "Howard", "Grace")
            createLeague(cookie);
        });

        beforeEach(async () => {

        });

        afterEach(async () => {

            sandbox.restore();
        });

        describe('Testing that sucessing create league', async () => {
            it('POST get in progress should return 5 medals for newUser', async () => {
               createLeagueAndAddUser(cookie);
               
                return
            })
        });

        describe('Testing medals/get_in_progress', () => {

        });

        describe('Testing /medals/get_earned', () => {

        });
    });
});