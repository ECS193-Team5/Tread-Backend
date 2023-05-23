var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();

process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
request = request(app);


const chai = require("chai");
const { expect } = chai;

const User = require("../../models/user.model");
var helpers = require("./helperFunc");




describe('Testing /sign_up routes', async function () {
    let user = {
        "sub": "signup1",
        "given_name": "Lucifer",
        "family_name": "MorningStar",
    };

    describe("Test /sign_up", async function () {

        describe("Test sign up succeeds", async function () {

            it("Test succesful sign_up", async function () {
                let cookie = await helpers.loginUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": user.given_name, "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
                    .expect(200);
                await helpers.deleteUser(cookie);
            })

            it("Test succesful sign_up on the same user after delete user", async function () {
                let cookie = await helpers.loginUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": user.given_name, "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
                    .expect(200);
                await helpers.deleteUser(cookie);

                cookie = await helpers.loginUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": user.given_name, "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
                    .expect(200);
                await helpers.deleteUser(cookie);

            })

            it("Test successful sign_up with no display name", async function () {
                let cookie = await helpers.loginUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
                    .expect(200);
                await helpers.deleteUser(cookie);
            })
        })

        describe("Test sign_up fails", async function () {
            it("Test sign_up fails because the user already has a username", async function () {
                let cookie = await helpers.loginUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": user.given_name, "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
                    .expect(200);

                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": user.given_name, "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
                    .expect(400);
                await helpers.deleteUser(cookie);
            });

            it("Test sign_up fails because all the usernames are taken", async function () {
                let cookie = await helpers.loginUser(user, sandbox);
                sandbox.stub(User, 'updateOne').throws("Invalid Username");
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": user.given_name, "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
                    .expect(500);
                sandbox.restore();
                await helpers.deleteUser(cookie);
            });

            it("Test sign_up fails because the image is invalid", async function () {
                let cookie = await helpers.loginUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": user.given_name, "displayName": user.given_name, "picture": "invalid photo" })
                    .expect(500);
                await helpers.deleteUser(cookie);
            });

            it("Test sign_up fails because the username is invalid", async function () {
                let cookie = await helpers.loginUser(user, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookie)
                    .send({ "username": "This is a stupidly long invalid username", "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
                    .expect(400);
                await helpers.deleteUser(cookie);
            });
        })
    });

    describe("Test /get_profile_photo", async function () {
        it("Test correctly gets the first profile photo", async function () {
            let cookie = await helpers.loginUser(user, sandbox);
            let photo = "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png";
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