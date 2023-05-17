var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const mongoose = require("mongoose");
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
const { loginUser, createUser, getUsername, deleteUser } = require("./helperFunc");
const googleauth = require('google-auth-library');
//var helpers = require("./helperFunc");
const { expect, assert } = require("chai");
let user1 = {
    "sub": "0",
    "given_name": "Clark",
    "family_name": "Kent",
}

let user2 = {
    "sub": "1",
    "given_name": "Bruce",
    "family_name": "Wayne",
}


request = request(app);

describe('Testing authentication', () => {
    let cookieUser1 = "";
    let cookieUser2 = "";
    let username1 = "";
    let username2 = "";

    before(async () => {
        cookieUser1 =  await createUser(user1, sandbox);
        username1 = await getUsername(cookieUser1);
        cookieUser2 =  await createUser(user2, sandbox);
        username2 = await getUsername(cookieUser2);
    });

    after(async () => {
        cookieUser2 = await loginUser(user2, sandbox);
        await deleteUser(cookieUser2);
    });

    it("Test succesful login ", async () => {
        var userVal = {
            sub: user1.sub,
            given_name: user1.given_name,
            family_name: user1.family_name,
            email: "testemail" + user1.sub + "@gmail.com",
            picture: "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png"
        }
        let payloadStub = sandbox.stub().returns(userVal)
        sandbox.stub(googleauth.OAuth2Client.prototype, "verifyIdToken").resolves({ getPayload: payloadStub });

        await request.post("/auth/login/google")
        .set('Accept', 'application/json')
        .expect(200);
        sandbox.restore();
    });

    it("Test login switches successfully ", async () => {
        let cookieUser1 = await loginUser(user1, sandbox);
        let recentUsername1 = await getUsername(cookieUser1);
        let cookieUser2 = await loginUser(user2, sandbox);
        let recentUsername2 = await getUsername(cookieUser2);

        expect(recentUsername1).to.equal(username1);
        expect(recentUsername2).to.equal(username2);
        expect(recentUsername1.split("#")[0]).to.equal(user1.given_name);
        expect(recentUsername2.split("#")[0]).to.equal(user2.given_name);
    });

    it("Test logout works", async () => {
        let cookieUser1 = await loginUser(user1, sandbox);

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
        await deleteUser(cookieUser1);

        sandbox.stub(mongoose.Model.prototype, 'save').throws("error - cannot save");
        var userVal = {
            sub: user1.sub,
            given_name: user1.given_name,
            family_name: user1.family_name,
            email: "testemail" + user1.sub + "@gmail.com",
            picture: "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png"
        }
        let payloadStub = sandbox.stub().returns(userVal)
        sandbox.stub(googleauth.OAuth2Client.prototype, "verifyIdToken").resolves({ getPayload: payloadStub });

        await request.post("/auth/login/google")
        .set('Accept', 'application/json')
        .expect(500);
        sandbox.restore();
    })

});