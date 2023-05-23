var request = require("supertest");
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const mongoose = require("mongoose");
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
request = request(app);
const googleauth = require('google-auth-library');
var helpers = require("./helperFunc");
const chai = require("chai");
const deepEqualInAnyOrder = require('deep-equal-in-any-order');
chai.use(deepEqualInAnyOrder);
const User = require("../../models/user.model");
const {expect} = chai;

let user1 = {
    "sub": "signup1",
    "given_name": "Lucifer",
    "family_name": "MorningStar",
}

let user2 = {
    "sub": "signup2",
    "given_name": "Chloe",
    "family_name": "Decker",
}


describe('Testing /sign_up/', async function () {


    describe("Test /sign_up", async function(){

        describe("Test /sign_up succeeds", async function(){
            it("Test succesful sign_up", async function(){
                let cookieUser1 = await helpers.loginUser(user1, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookieUser1)
                    .send({"username": user1.given_name, "displayName": user1.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
                    .expect(200);
                let status = await helpers.deleteUser(cookieUser1);
            })

            it("Test succesful sign_up on the same user after delete user", async function(){
                let cookieUser2 = await helpers.loginUser(user2, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookieUser2)
                    .send({"username": user2.given_name, "displayName": user2.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
                    .expect(200);
                let status = await helpers.deleteUser(cookieUser2);
                cookieUser2 = await helpers.loginUser(user2, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookieUser2)
                    .send({"username": user2.given_name, "displayName": user2.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
                    .expect(200);
                status = await helpers.deleteUser(cookieUser2);

            })

            it("Test successful sign_up with no display name", async function(){
                let cookieUser2 = await helpers.loginUser(user2, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookieUser2)
                    .send({"username": user2.given_name,  "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
                    .expect(200);
                let status = await helpers.deleteUser(cookieUser2);
            })
        })

        describe("Test /sign_up fails", async function(){
            it("Test /sign_up fails because the user already has a username", async function(){
                let cookieUser1 = await helpers.loginUser(user1, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookieUser1)
                    .send({"username": user1.given_name, "displayName": user1.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
                    .expect(200);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookieUser1)
                    .send({"username": user1.given_name, "displayName": user1.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
                    .expect(400);
                let status = await helpers.deleteUser(cookieUser1);
            });
            it("Test /sign_up fails because all the username are taken", async function(){
                let cookieUser1 = await helpers.loginUser(user1, sandbox);
                sandbox.stub(User, 'updateOne').throws("Invalid Username");
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookieUser1)
                    .send({"username": user1.given_name, "displayName": user1.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
                    .expect(500);
                let status = await helpers.deleteUser(cookieUser1);
            });
            it("Test /sign_up fails because the image is invalid", async function(){
                let cookieUser1 = await helpers.loginUser(user1, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookieUser1)
                    .send({"username": user1.given_name, "displayName": user1.given_name, "picture": "invalid photo"})
                    .expect(500);
                let status = await helpers.deleteUser(cookieUser1);
            });
            it("Test /sign_up fails because the username is invalid", async function(){
                let cookieUser1 = await helpers.loginUser(user1, sandbox);
                await request.post("/sign_up/sign_up")
                    .set('Accept', 'application/json')
                    .set('Cookie', cookieUser1)
                    .send({"username": "This is a stupidly long invalid username", "displayName": user1.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
                    .expect(400);
                let status = await helpers.deleteUser(cookieUser1);
            });
        })
    });

    describe("Test /get_profile_photo", async function(){
        it("Test correctly gets original profile photo", async function(){
            let cookieUser1 = await helpers.loginUser(user1, sandbox);
            let photo = "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png";
            await request.post("/sign_up/sign_up")
                .set('Accept', 'application/json')
                .set('Cookie', cookieUser1)
                .send({"username": user1.given_name, "displayName": user1.given_name, "picture": photo })
                .expect(200);

            await request.post("/sign_up/get_profile_photo")
                .set('Accept', 'application/json')
                .set('Cookie', cookieUser1)
                .then((res)=>{
                    expect(res._body).to.equal(photo);
                })
            await helpers.deleteUser(cookieUser1);

        })
    })

});