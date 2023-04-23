const { expect, assert } = require("chai");
const rewire = require("rewire");
const mongoose = require("mongoose");
const { OAuth2Client,   LoginTicket } = require('google-auth-library');
var sandbox = require("sinon").createSandbox();

describe('Testing authentication', () =>{
    let auth;

    beforeEach(() => {
        auth = rewire("../routes/auth.js");
    });

    afterEach(() => {
        sandbox.restore();
    })

    /* Test verify */

    describe("Testing hasUsernameFromDoc()", () => {
        let hasUsernameFromDoc;

        beforeEach(() => {
            hasUsernameFromDoc = auth.__get__("hasUsernameFromDoc");
        });

        it("hasUsernameFromDoc should return false when given an no document", () => {
            let ret = hasUsernameFromDoc(null);
            expect(ret).to.equal(false);
        });

        it("hasUsernameFromDoc should return false when given an no username", () => {
            let ret = hasUsernameFromDoc({"username":null});
            expect(ret).to.equal(false);
        });

        it("hasUsernameFromDoc should return true when given valid username", () => {
            let ret = hasUsernameFromDoc({"username":"batman#9360"});
            expect(ret).to.equal(true);
        });
    });

    describe("Testing isNewUser()", () => {
        let isNewUser;

        beforeEach(() => {
            isNewUser = auth.__get__("isNewUser");
        });

        it("isNewUser should return true when given an invalid username doc", () => {
            let ret = isNewUser(null);
            expect(ret).to.equal(true);
        });

        it("isNewUser should return false when given a valid username doc", () => {
            let ret = isNewUser({"username":"peter#4567"});
            expect(ret).to.equal(false);
        });
    });

    describe("Testing createUser()", () => {
        let createUser;
        let saveStub;
        let userInfo =  {
            authenticationSource: 'google',
            authenticationID: "authID",
            displayName: "Howard",
            given_name: "Howard",
            family_name: "Wang",
            email: "sirwang@ucdavis.edu",
            picture: "photo",
        }

        beforeEach(() => {
            createUser = auth.__get__("createUser");
            saveStub = sandbox.stub(mongoose.Model.prototype, 'save')
        });

        it("createUser should succesfully make an object given clean data", async function (){
            saveStub.resolves("");
            let ret = await createUser(userInfo);
        });

        it("createUser should throw an error when the document cannot save", async function (){
            saveStub.rejects("err");
            try{
                await createUser(userInfo);
            }
            catch(err){
                return;
            }
            expect(4).to.equal(5);
        });
    });

    describe("Testing verify()", () => {
        const token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk2OTcxODA4Nzk2ODI5YTk3MmU3OWE5ZDFhOWZmZjExY2Q2MWIxZTMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2ODIwMzI1MzQsImF1ZCI6IjE3MTU3MTY1Mzg2OS1sczVpcWRsbzFib2U2aXNqN3Ixa29vMnR2aTU3ZzYybS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwODg3NjU4MDczNDk0MTE3OTkyNCIsImVtYWlsIjoiaG93YXJkdzExN0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXpwIjoiMTcxNTcxNjUzODY5LWxzNWlxZGxvMWJvZTZpc2o3cjFrb28ydHZpNTdnNjJtLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwibmFtZSI6Ikhvd2FyZCBXYW5nIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FHTm15eGJqZENkZW5OdF9yc2g2d0tHS0ZxSElzbm1XUjNxcmM0b0ZlY2c4a3c9czk2LWMiLCJnaXZlbl9uYW1lIjoiSG93YXJkIiwiZmFtaWx5X25hbWUiOiJXYW5nIiwiaWF0IjoxNjgyMDMyODM0LCJleHAiOjE2ODIwMzY0MzQsImp0aSI6ImY3NWVjZDI0MGE1YzkwNmIzNjI1OTliOWE0ZWUwNDE2YjQ3ZDVlMTIifQ.qeFtF3_9zlCbexLZzr6iEGz4RXWU2aCSCl9MDddTYzR0hfXMc4S_bpEH1FtFXELhB3zozzMKH-ox3xBU7lLzwFj29jPPkHZOhU-V6GldSwZbVl7iSpm2Sfek9Xw_NW012wEi9CpKSKDlpFIxmGEyGDUBa5lpdowRAbdwVX43Pq_mo_H-tSqfwzI3Gb55CinbABqRHO1yRV_KReKQ0fsi28kuNhMdEtszYJq79XfvdAKpyi7lcghYfU5l-Vsz58VfB9X1AnRDj-Rfn8nGBrLangRfKfYgFTWNTtetXzLlugcif8UseK1AgrhIcIb3f4h2MAXvVXjV8N2b1GUVmyzy6A';
        const IDInfo = {"iss":"https://accounts.google.com","nbf":1682032534,"aud":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","sub":"108876580734941179924","email":"howardw117@gmail.com","email_verified":true,"azp":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","name":"Howard Wang","picture":"https://lh3.googleusercontent.com/a/AGNmyxbjdCdenNt_rsh6wKGKFqHIsnmWR3qrc4oFecg8kw=s96-c","given_name":"Howard","family_name":"Wang","iat":1682032834,"exp":1682036434,"jti":"f75ecd240a5c906b362599b9a4ee0416b47d5e12"};
        const ticket = new LoginTicket();
        let verify;
        let OAuthStub;

        beforeEach(() => {
            verify = auth.__get__("verify");
            sandbox.stub(LoginTicket.prototype, "getPayload").resolves(IDInfo);
            OAuthStub = sandbox.stub(OAuth2Client.prototype, "verifyIdToken")
        });

        it("verify should return the proper information", async function() {
            OAuthStub.resolves(ticket);
            const result = await verify(token);
            expect(result).to.deep.equal({"iss":"https://accounts.google.com","nbf":1682032534,"aud":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","sub":"108876580734941179924","email":"howardw117@gmail.com","email_verified":true,"azp":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","name":"Howard Wang","picture":"https://lh3.googleusercontent.com/a/AGNmyxbjdCdenNt_rsh6wKGKFqHIsnmWR3qrc4oFecg8kw=s96-c","given_name":"Howard","family_name":"Wang","iat":1682032834,"exp":1682036434,"jti":"f75ecd240a5c906b362599b9a4ee0416b47d5e12"})
        });

        it("verify should throw correctly", async function() {
            OAuthStub.rejects(ticket);
            try {
                await verify(token);
            } catch {
                return;
            }
            expect(4).to.equal(5);
        });

    });

    describe('Tests with requests and responses', () => {
        let req;
        let res;

        beforeEach(() => {
            req = {
                body: {},
                headers: {}
            }

            res = {
                query: {},
                headers: {},
                data: null,
                status: 0,
                locals: {},
                json(payload) {
                    this.data = JSON.stringify(payload)
                    return this
                },
                cookie(name, value, options) {
                    this.headers[name] = value
                },
                sendStatus(x) {
                    this.status = x
                },
                status(x) {
                    this.status = x
                    return this
                }
            }
        });

        describe("Testing verifyUserAndFindUsername", () => {
            let verifyStub;
            let findOneStub;
            let verifyUserAndFindUsername;

            before(() => {
                verifyUserAndFindUsername = auth.__get__("verifyUserAndFindUsername");
                verifyStub = sandbox.stub();
                auth.__set__('verify', verifyStub);
                findOneStub = sandbox.stub(mongoose.Model, "findOne");
            });
            it("verifyUserAndFindUsername should return 401 if verify() fails", async function() {
                req.headers.authorization = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk2OTcxODA4Nzk2ODI5YTk3MmU3OWE5ZDFhOWZmZjExY2Q2MWIxZTMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2ODIwMzI1MzQsImF1ZCI6IjE3MTU3MTY1Mzg2OS1sczVpcWRsbzFib2U2aXNqN3Ixa29vMnR2aTU3ZzYybS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwODg3NjU4MDczNDk0MTE3OTkyNCIsImVtYWlsIjoiaG93YXJkdzExN0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXpwIjoiMTcxNTcxNjUzODY5LWxzNWlxZGxvMWJvZTZpc2o3cjFrb28ydHZpNTdnNjJtLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwibmFtZSI6Ikhvd2FyZCBXYW5nIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FHTm15eGJqZENkZW5OdF9yc2g2d0tHS0ZxSElzbm1XUjNxcmM0b0ZlY2c4a3c9czk2LWMiLCJnaXZlbl9uYW1lIjoiSG93YXJkIiwiZmFtaWx5X25hbWUiOiJXYW5nIiwiaWF0IjoxNjgyMDMyODM0LCJleHAiOjE2ODIwMzY0MzQsImp0aSI6ImY3NWVjZDI0MGE1YzkwNmIzNjI1OTliOWE0ZWUwNDE2YjQ3ZDVlMTIifQ.qeFtF3_9zlCbexLZzr6iEGz4RXWU2aCSCl9MDddTYzR0hfXMc4S_bpEH1FtFXELhB3zozzMKH-ox3xBU7lLzwFj29jPPkHZOhU-V6GldSwZbVl7iSpm2Sfek9Xw_NW012wEi9CpKSKDlpFIxmGEyGDUBa5lpdowRAbdwVX43Pq_mo_H-tSqfwzI3Gb55CinbABqRHO1yRV_KReKQ0fsi28kuNhMdEtszYJq79XfvdAKpyi7lcghYfU5l-Vsz58VfB9X1AnRDj-Rfn8nGBrLangRfKfYgFTWNTtetXzLlugcif8UseK1AgrhIcIb3f4h2MAXvVXjV8N2b1GUVmyzy6A';
                verifyStub.rejects('test error');
                findOneStub.resolves('should not appear');
                await verifyUserAndFindUsername(req, res);
                expect(res.status).to.equal(401);
                expect(JSON.parse(res.data)).to.equal('Error: test error')
                expect(res.locals.usernameDoc).to.not.equal('should not appear')
            });
        });

        /* test createNewUserIfNecessary*/
        /* generateLoggedInSession */
        /* logout */
    });
})