var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();

process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
request = request(app);


const chai = require("chai");
const { expect } = chai;

const User = require("../../models/user.model");
var helpers = require("./postRequests");




describe('Testing /sign_up routes', async function () {
    let user = {
        "sub": "signup1",
        "given_name": "Lucifer",
        "family_name": "MorningStar",
    };

    describe("Test /sign_up", async function () {

        describe("Test sign up succeeds", async function () {

            it("Test succesful sign_up", async function () {
                let cookie = await helpers.loginGoogleUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": user.given_name, "displayName": "overwriteDisplay", "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_6380.png" })
                    .expect(200);
                let displayName = await helpers.getDisplayName(cookie);
                let username = await helpers.getUsername(cookie);
                expect(displayName.displayName).to.equal("overwriteDisplay");
                await helpers.deleteUser(cookie);
            })

            it("Test succesful sign_up on the same user after delete user", async function () {
                let cookie = await helpers.loginGoogleUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": user.given_name, "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_6380.png" })
                    .expect(200);
                await helpers.deleteUser(cookie);

                cookie = await helpers.loginGoogleUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": user.given_name, "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_6380.png" })
                    .expect(200);
                await helpers.deleteUser(cookie);

            })
        })

        describe("Test sign_up fails", async function () {
           it("Test sign_up fails because the user already has a username", async function () {
                let cookie = await helpers.loginGoogleUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": user.given_name, "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_6380.png" })
                    .expect(200);

                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": user.given_name, "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_6380.png" })
                    .expect(400);
                await helpers.deleteUser(cookie);
            });

            it("Test sign_up fails because all the usernames are taken", async function () {
                let cookie = await helpers.loginGoogleUser(user, sandbox);
                sandbox.stub(User, 'updateOne').throws("Invalid Username");
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": user.given_name, "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_6380.png" })
                    .expect(500);
                sandbox.restore();
                await helpers.deleteUser(cookie);
            });

            it("Test sign_up fails because the image is invalid", async function () {
                let cookie = await helpers.loginGoogleUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": user.given_name, "displayName": user.given_name, "picture": "invalid photo" })
                    .expect(500);
                await helpers.deleteUser(cookie);
            });

            it("Test sign_up fails because the username is empty", async function () {
                let cookie = await helpers.loginGoogleUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": "", "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_6380.png" })
                    .expect(400);
                await helpers.deleteUser(cookie);
            });

            it("Test sign_up fails because the username is too long", async function () {
                let cookie = await helpers.loginGoogleUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": "Thisisastupidlylonginvalidusernamethatwillfail", "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_6380.png" })
                    .expect(400);
                await helpers.deleteUser(cookie);
            });

            it("Test sign_up fails because the username has an invalid char", async function () {
                let cookie = await helpers.loginGoogleUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": "Has Space", "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_6380.png" })
                    .expect(400);
                await helpers.deleteUser(cookie);
            });

            it("Test sign_up fails because the display name is empty", async function () {
                let cookie = await helpers.loginGoogleUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": "HasSpace", "displayName": "", "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_6380.png" })
                    .expect(400);
                await helpers.deleteUser(cookie);
            });

            it("Test sign_up fails because the display name is too long", async function () {
                let cookie = await helpers.loginGoogleUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": "HasSpace", "displayName": "thisisastupidlylongdisplayamethatshouldfailifIhaveanythingtosay", "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_6380.png" })
                    .expect(400);
                await helpers.deleteUser(cookie);
            });

            it("Test sign_up fails because the display name has an invalid char", async function () {
                let cookie = await helpers.loginGoogleUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": "HasSpace", "displayName": "displa$", "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_6380.png" })
                    .expect(400);
                await helpers.deleteUser(cookie);
            });
        })
    });

    describe("Test /get_profile_photo", async function () {
        it("Test correctly gets the first profile photo", async function () {
            let cookie = await helpers.loginGoogleUser(user, sandbox);
            let photo = "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_6380.png";
            await request.post("/sign_up/sign_up")
                .set('Accept', 'application/json')
                .set('Cookie', cookie)
                .send({ "username": user.given_name, "displayName": user.given_name, "picture": photo })
                .expect(200);

            await request.post("/sign_up/get_profile_photo")
                .set('Accept', 'application/json')
                .set('Cookie', cookie)
                .then((res) => {
                    expect(res._body).to.equal(photo);
                })
            await helpers.deleteUser(cookie);
        });
    })

});