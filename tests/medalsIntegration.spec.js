var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../index");
const googleauth = require('google-auth-library');
const { doesNotMatch } = require("assert");
const { gracefulify } = require("graceful-fs");



async function createUser(sub, given_name, family_name){
    let cookie = "";
    var userVal = {
        sub: sub,
        given_name: given_name,
        family_name: family_name,
        email:"testemail" + sub + "@gmail.com",
        picture:"https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png"
    }
    let payloadStub = sandbox.stub().returns(userVal)
    sandbox.stub(googleauth.OAuth2Client.prototype, "verifyIdToken").resolves({getPayload : payloadStub});
    await request.post("/auth/login/google")
            .set('Accept', 'application/json')
            .then(res => {
                cookie =  res.headers['set-cookie'];
            }
    )

    await request.post("/sign_up/sign_up")
    .set('Accept', 'application/json')
    .set('Cookie', cookie)
    .send({"username":given_name, "displayName":given_name, "picture":"https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png"})
    .then(res => {
    })
    return cookie;
}
request = request(app);

describe('Testing express app routes', () => {
    before(function () {
       
    })
    describe('Testing /medals route', () => {
        let req = {};
        let res = {};
        let cookie = "";

        before(async ()=> {
            //const auth = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjgyMjgzOGMxYzhiZjllZGNmMWY1MDUwNjYyZTU0YmNiMWFkYjViNWYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2ODQyMjE1OTAsImF1ZCI6IjE3MTU3MTY1Mzg2OS1sczVpcWRsbzFib2U2aXNqN3Ixa29vMnR2aTU3ZzYybS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwMTk3NzE1OTgxODk1NTI5NTk2NiIsImhkIjoidWNkYXZpcy5lZHUiLCJlbWFpbCI6InNpcndhbmdAdWNkYXZpcy5lZHUiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXpwIjoiMTcxNTcxNjUzODY5LWxzNWlxZGxvMWJvZTZpc2o3cjFrb28ydHZpNTdnNjJtLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwibmFtZSI6IkpoYW8gSHVhIFdhbmciLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUdObXl4WmJvem9ncV8yaEdtSEI0Qmdxdi04THdhRDc3VTZXT2lyc3JyVjY9czk2LWMiLCJnaXZlbl9uYW1lIjoiSmhhbyBIdWEiLCJmYW1pbHlfbmFtZSI6IldhbmciLCJpYXQiOjE2ODQyMjE4OTAsImV4cCI6MTY4NDIyNTQ5MCwianRpIjoiMzY0ZjU4MGQ2Njc4ZWExYzQ5N2M5NjM4ZWFmYTM1MDgyMDUzMjAxNSJ9.Of53o477DiwGT-aKQcXHCBMsux3TnwyOLCxmNzKIoyMbQtRxNxxfgLdj6J7VFBrq0CIKrFaK_bnF3qPCZ6zyd4DRB_4XcY33gu5ZbVHvZXwFH7nu2TCFCY0iUycF2Jp16FI5GQaSTJqPbfbbsr9tvfvkSrTjsxuj0iTX7PdHde_dXYBBlKzpo-noPjEQXiWhB9cz5srdd26CtzHPdD9Eia1RX--xV6GjX6Naq-7d7T2B5msUxWJjPxlObbSaCTKr5OjohbRIj4L3MtCIqLUq9oHtqp_EfNhKfm4ppksOIne5K-EuAN9v_T7IR_Q46UTvB-aw1YGBWuOsyHVeomBYYg"
            
        });

        beforeEach(async () => {
            cookie = await createUser("1", "Howard", "Grace")
        });

        afterEach(async () => {
            await request.delete("/delete_user/")
            .set('Cookie', cookie)
            .then(res => {
            });
            sandbox.restore();
            });

        describe('Testing medals/add_medal', async () => {
            it('POST get in progress should return 5 medals for newUser', async () => {
                await request.post("/medals/get_earned")
                    .set("Accept", "application/json")
                    .set("Cookie", cookie).expect('Content-Type', 'application/json; charset=utf-8')
                    .then(res => {;
                })
                return
            })
        });

        describe('Testing medals/get_in_progress', () => {

        });

        describe('Testing /medals/get_earned', () => {

        });
    });
  });