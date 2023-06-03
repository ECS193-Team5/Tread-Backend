var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const mongoose = require("mongoose");
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
const { loginGoogleUser, createGoogleUser, getUsername, deleteUser, loginAppleUser, createAppleUser } = require("./postRequests");
const googleauth = require('google-auth-library');
const appleSignin = require("apple-signin-auth");
//var helpers = require("./helperFunc");
const { expect} = require("chai");

let user1 = {
    "sub": "auth1",
    "given_name": "Clark",
    "family_name": "Kent",
}

let user2 = {
    "sub": "auth2",
    "given_name": "Bruce",
    "family_name": "Wayne",
}


request = request(app);

describe('Testing authentication routes', () => {
    let cookieUser1 = "";
    let cookieUser2 = "";
    let username1 = "";
    let username2 = "";

    describe("Test /login/google", async () => {
        before(async () => {
            cookieUser1 =  await createGoogleUser(user1, sandbox);
            username1 = await getUsername(cookieUser1);
            cookieUser2 =  await createGoogleUser(user2, sandbox);
            username2 = await getUsername(cookieUser2);
        });

        after(async () => {
            await deleteUser(cookieUser1);
            await deleteUser(cookieUser2);
        });

        it("Test succesful login ", async () => {
            var userVal = {
                sub: user1.sub,
                given_name: user1.given_name,
                family_name: user1.family_name,
                email: "testemail" + user1.sub + "@gmail.com",
                picture: "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_6380.png"
            }
            let payloadStub = sandbox.stub().returns(userVal)
            sandbox.stub(googleauth.OAuth2Client.prototype, "verifyIdToken").resolves({ getPayload: payloadStub });

            await request.post("/auth/login/google")
            .set('Accept', 'application/json')
            .expect(200);
            sandbox.restore();
        });

        it("Test login switches successfully ", async () => {
            let recentUsername1 = await getUsername(cookieUser1);
            let recentUsername2 = await getUsername(cookieUser2);

            expect(recentUsername1).to.equal(username1);
            expect(recentUsername2).to.equal(username2);
            expect(recentUsername1.split("#")[0]).to.equal(user1.given_name);
            expect(recentUsername2.split("#")[0]).to.equal(user2.given_name);
        });

        it("Test logout works", async () => {
            await request.post("/auth/logout")
            .set('Accept', 'application/json')
            .set('Cookie', cookieUser1)
            .expect(200);

            // Expect not signed in error
            await request.post("/user/get_username")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .expect(401);
        });

        it("Test invalid verification", async () => {
            sandbox.stub(googleauth.OAuth2Client.prototype, "verifyIdToken").throws("Verify token fails");

            await request.post("/auth/login/google")
            .set('Accept', 'application/json')
            .expect(401);
            sandbox.restore();
        })

        it("Test invalid save", async () => {
            let cookieUser1 = await loginGoogleUser(user1, sandbox);
            await deleteUser(cookieUser1);

            sandbox.restore();
            var userVal = {
                sub: user1.sub,
                given_name: user1.given_name,
                family_name: user1.family_name,
                email: "testemail" + user1.sub + "@gmail.com",
                picture: "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_6380.png"
            }
            let payloadStub = sandbox.stub().returns(userVal)
            sandbox.stub(googleauth.OAuth2Client.prototype, "verifyIdToken").resolves({ getPayload: payloadStub });
            sandbox.stub(mongoose.Model.prototype, 'save').throws("error - cannot save");
            await request.post("/auth/login/google")
                .set('Accept', 'application/json')
                .expect(401);
            sandbox.restore();
        })
    })

    describe("Test /login/apple", async () => {
        before(async () => {
            cookieUser1 =  await createAppleUser(user1, sandbox);
            username1 = await getUsername(cookieUser1);
            cookieUser2 =  await createAppleUser(user2, sandbox);
            username2 = await getUsername(cookieUser2);
        });

        after(async () => {
            await deleteUser(cookieUser1);
            await deleteUser(cookieUser2);
        });

        it("Test succesful login ", async () => {

            var userVal = {
                fullName: {
                    "givenName":user1.given_name,
                    "familyName":user1.family_name
                },
                sub: user1.sub,
                deviceToken:"token",
                nonce:"nonce"
            }
            sandbox.restore();
            sandbox.stub(appleSignin, "verifyIdToken").resolves(userVal);

            await request.post("/auth/login/apple")
                .set('Accept', 'application/json')
                .send(userVal)
                .expect(200);
        });

        it("Test login switches successfully ", async () => {
            let recentUsername1 = await getUsername(cookieUser1);
            let recentUsername2 = await getUsername(cookieUser2);

            expect(recentUsername1).to.equal(username1);
            expect(recentUsername2).to.equal(username2);
            expect(recentUsername1.split("#")[0]).to.equal(user1.given_name);
            expect(recentUsername2.split("#")[0]).to.equal(user2.given_name);
        });

        it("Test logout works", async () => {
            await request.post("/auth/logout")
            .set('Accept', 'application/json')
            .set('Cookie', cookieUser1)
            .expect(200);

            // Expect not signed in error
            await request.post("/user/get_username")
            .set("Cookie", cookieUser1)
            .set('Accept', 'application/json')
            .expect(401);
        });

        it("Test invalid verification", async () => {
            sandbox.restore();
            sandbox.stub(appleSignin, "verifyIdToken").throws("Verify token fails");
            await request.post("/auth/login/apple")
            .set('Accept', 'application/json')
            .expect(401);
            sandbox.restore();
        })

        it("Test invalid save", async () => {
            let cookieUser1 = await loginAppleUser(user1, sandbox);
            await deleteUser(cookieUser1);

            sandbox.restore();
            var userVal = {
                fullName: {
                    "givenName":user1.given_name,
                    "familyName":user1.family_name
                },
                sub: user1.sub,
                deviceToken:"token",
                nonce:"nonce"
            }
            sandbox.restore();
            sandbox.stub(appleSignin, "verifyIdToken").resolves(userVal);
            sandbox.stub(mongoose.Model.prototype, 'save').throws("error - cannot save");
            await request.post("/auth/login/apple")
                .set('Accept', 'application/json')
                .expect(401);
            sandbox.restore();
        })
    })


});