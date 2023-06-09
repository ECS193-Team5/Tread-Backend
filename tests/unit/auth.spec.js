const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
const mongoose = require("mongoose");
const { OAuth2Client,   LoginTicket } = require('google-auth-library');
const crypto = require("crypto");
const appleSignin = require("apple-signin-auth");
var sandbox = require("sinon").createSandbox();

describe('Testing authentication', () => {
    let auth;

    beforeEach(() => {
        auth = rewire("../../routes/auth.js");
    });

    afterEach(() => {
        sandbox.restore();
    })

    describe("Testing verify()", () => {
        let authenticationSource;
        let verify;
        let googleVerifyStub;
        let appleVerifyStub;
        const IDToken = "token";
        const nonce = "nonce";
        const userInfoFromAuth = {sub: "sub", email: "test@gmail.com"};

        beforeEach(() => {
            googleVerifyStub = sandbox.stub();
            appleVerifyStub = sandbox.stub();
            verify = auth.__get__("verify", verify);
            auth.__set__("googleVerify", googleVerifyStub);
            auth.__set__("appleVerify", appleVerifyStub)
        });

        it("verify() returns with Google as source", async function() {
            googleVerifyStub.resolves(userInfoFromAuth);
            authenticationSource = 'google';
            let result = await verify(authenticationSource, IDToken);
            expect(result).to.deep.equal(userInfoFromAuth);
            expect(googleVerifyStub).to.have.been.calledWith(IDToken);
            expect(appleVerifyStub).to.not.have.been.called;
        });

        it("verify() throws when googleVerify() rejects", async function() {
            googleVerifyStub.rejects();
            authenticationSource = 'google';
            try {
            await verify(authenticationSource, IDToken);
            } catch {}
            expect(googleVerifyStub).to.have.been.calledWith(IDToken);
            expect(googleVerifyStub).to.have.thrown;
            expect(appleVerifyStub).to.not.have.been.called;
        });

        it("verify() returns with Apple as source", async function() {
            appleVerifyStub.resolves(userInfoFromAuth);
            authenticationSource = 'apple';
            let result = await verify(authenticationSource, IDToken, nonce);
            expect(result).to.deep.equal(userInfoFromAuth);
            expect(appleVerifyStub).to.have.been.calledWith(IDToken, nonce);
            expect(googleVerifyStub).to.not.have.been.called;
        });

        it("verify() throws when appleVerify() rejects", async function() {
            appleVerifyStub.rejects();
            authenticationSource = 'apple';
            try {
            await verify(authenticationSource, IDToken, nonce);
            } catch {}
            expect(appleVerifyStub).to.have.been.calledWith(IDToken, nonce);
            expect(appleVerifyStub).to.have.thrown;
            expect(googleVerifyStub).to.not.have.been.called;
        });
    });

    describe("Testing getUserDocFromAuthSub()", () => {
        let findOneStub;
        let getUserDocFromAuthSub;
        let leanStub;
        const authenticationSource = "source";
        const authenticationSub = "sub";

        beforeEach(() => {
            leanStub = sandbox.stub();
            findOneStub = sandbox.stub(mongoose.Model, "findOne").returns({lean: leanStub});
            getUserDocFromAuthSub = auth.__get__("getUserDocFromAuthSub");
        });

        it("getUserDocFromAuthSub() runs successfully", async function(){
            await getUserDocFromAuthSub(authenticationSource, authenticationSub);
            expect(findOneStub).to.have.been.calledWith({
                authenticationSource: authenticationSource,
                authenticationID: authenticationSub },
                'username');
        });

        it("getUserDocFromAuthSub() throws if findOne() fails.", async function(){
            findOneStub.rejects();
            try {
                await getUserDocFromAuthSub(authenticationSource, authenticationSub);
            } catch {}
            expect(findOneStub).to.have.been.calledWith({
                authenticationSource: authenticationSource,
                authenticationID: authenticationSub },
                'username');
            expect(findOneStub).to.have.thrown;
        });


    });

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
        let saveStub;
        let createUser;
        const userDoc = {
            username: "user"
        }

        beforeEach(() => {
            saveStub = sandbox.stub(mongoose.Model.prototype, "save");
            createUser = auth.__get__("createUser");
        });

        it("createUser() runs successfully", async function(){
            await createUser(userDoc);
            expect(saveStub).to.have.been.called;
        });

        it("createUser() throws if save fails.", async function(){
            saveStub.rejects();
            try {
                await createUser(userDoc);
            } catch {}
            expect(saveStub).to.have.thrown;
        });


    });

    describe("Testing createGoogleUser()", () => {
        let createGoogleUser;
        let createUserStub;
        let userInfo =  {
            authenticationSource: 'google',
            authenticationID: "authID",
            displayName: "Howard",
            givenName: "Howard",
            familyName: "Wang",
            email: "sirwang@ucdavis.edu",
            picture: "photo",
        };
        let userInfoFromAuth = {
            sub: "authID",
            given_name: "Howard",
            family_name: "Wang",
            email: "sirwang@ucdavis.edu",
            picture: "photo",
        }

        beforeEach(() => {
            createGoogleUser = auth.__get__("createGoogleUser");
            createUserStub = sandbox.stub();
            auth.__set__("createUser", createUserStub)
        });

        it("createGoogleUser should succesfully make an object given clean data", async function (){
            createUserStub.resolves("");
            let ret = await createGoogleUser(userInfoFromAuth);
            expect(createUserStub).to.have.been.calledWith(userInfo);
        });

        it("createGoogleUser should throw an error when the document cannot save", async function (){
            createUserStub.rejects("err");
            let createGoogleUserSpy = sandbox.spy(createGoogleUser);
            try{
                await createGoogleUser(userInfoFromAuth);
            }
            catch(err){}
            expect(createGoogleUserSpy).to.have.thrown;
            expect(createUserStub).to.have.been.calledWith(userInfo);
        });
    });

    describe("Testing createAppleUser()", () => {
        let createAppleUser;
        let createUserStub;
        const userInfo =  {
            authenticationSource: 'apple',
            authenticationID: "authID",
            displayName: "Howard",
            givenName: "Howard",
            familyName: "Wang",
            email: "sirwang@ucdavis.edu",
            picture: "https://i.imgur.com/XY9rcVx.png",
        }
        const userInfoFromAuth =  {
            sub: "authID",
            email: "sirwang@ucdavis.edu",
        }
        let fullName;

        beforeEach(() => {
            fullName = {};
            createAppleUser = auth.__get__("createAppleUser");
            createUserStub = sandbox.stub();
            auth.__set__("createUser", createUserStub);
        });

        it("createAppleUser should succesfully make an object given clean data", async function (){
            fullName.givenName = "Howard";
            fullName.familyName = "Wang";
            createUserStub.resolves("");
            let ret = await createAppleUser(userInfoFromAuth, fullName);
            expect(createUserStub).to.have.been.calledWith(userInfo);
        });

        it("createAppleUser should succesfully make an object no familyName", async function (){
            fullName.givenName = "Howard";
            let changedInfo = {
                authenticationSource: 'apple',
                authenticationID: "authID",
                displayName: "Howard",
                givenName: "Howard",
                email: "sirwang@ucdavis.edu",
                picture: "https://i.imgur.com/XY9rcVx.png",
            }
            createUserStub.resolves("");
            let ret = await createAppleUser(userInfoFromAuth, fullName);
            expect(createUserStub).to.have.been.calledWith(changedInfo);
        });

        it("createAppleUser should succesfully make an object given no givenName", async function (){
            fullName.familyName = "Wang";

            let changedInfo = {
                authenticationSource: 'apple',
                authenticationID: "authID",
                familyName: "Wang",
                email: "sirwang@ucdavis.edu",
                picture: "https://i.imgur.com/XY9rcVx.png",
            }
            createUserStub.resolves("");
            let ret = await createAppleUser(userInfoFromAuth, fullName);
            expect(createUserStub).to.have.been.calledWith(changedInfo);
        });

        it("createAppleUser should succesfully make an object given no fullName", async function (){
            let changedInfo = {
                authenticationSource: 'apple',
                authenticationID: "authID",
                email: "sirwang@ucdavis.edu",
                picture: "https://i.imgur.com/XY9rcVx.png",
            }
            createUserStub.resolves("");
            let ret = await createAppleUser(userInfoFromAuth);
            expect(createUserStub).to.have.been.calledWith(changedInfo);
        });

        it("createAppleUser should throw an error when the document cannot save", async function (){
            fullName.givenName = "Howard";
            fullName.familyName = "Wang";
            createUserStub.rejects("err");
            let createAppleUserSpy = sandbox.spy(createAppleUser);
            try{
                await createAppleUser(userInfoFromAuth, fullName);
            }
            catch(err){}
            expect(createAppleUserSpy).to.have.thrown;
            expect(createUserStub).to.have.been.calledWith(userInfo);
        });
    });

    describe("Testing googleVerify()", () => {
        const token = 'token';
        const IDInfo = {"iss":"https://accounts.google.com","nbf":1682032534,"aud":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","sub":"108876580734941179924","email":"howardw117@gmail.com","email_verified":true,"azp":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","name":"Howard Wang","picture":"https://lh3.googleusercontent.com/a/AGNmyxbjdCdenNt_rsh6wKGKFqHIsnmWR3qrc4oFecg8kw=s96-c","given_name":"Howard","family_name":"Wang","iat":1682032834,"exp":1682036434,"jti":"f75ecd240a5c906b362599b9a4ee0416b47d5e12"};
        const ticket = new LoginTicket();
        let googleVerify;
        let OAuthStub;

        beforeEach(() => {
            googleVerify = auth.__get__("googleVerify");
            sandbox.stub(LoginTicket.prototype, "getPayload").resolves(IDInfo);
            OAuthStub = sandbox.stub(OAuth2Client.prototype, "verifyIdToken")
        });

        it("verify should return the proper information", async function() {
            OAuthStub.resolves(ticket);
            const result = await googleVerify(token);
            expect(result).to.deep.equal(IDInfo);
        });

        it("verify should throw correctly", async function() {
            OAuthStub.rejects(ticket);
            let verifySpy = sandbox.spy(googleVerify);
            try {
                await googleVerify(token);
            } catch {}
            expect(verifySpy).to.have.thrown;
        });

    });

    describe("Testing appleVerify()", () => {
        const token = 'token';
        const IDInfo = {
            "iss": "https://appleid.apple.com",
            "aud": "run.tread.treadmobile",
            "exp": 1685061766,
            "iat": 1684975366,
            "sub": "001728.c8c64b151d4e4cc5af3c3e193dcd0a80.2044",
            "nonce": "8ee67ef6184c0fa2273264bcbc9dcff886eba620770d46d0d4d162c61da8d7da",
            "c_hash": "C9BZX97Q0seXMPu7PQLpLw",
            "email": "test@gmail.com",
            "email_verified": "true",
            "auth_time": 1684975366,
            "nonce_supported": true
          };
        let appleVerify;
        let OAuthStub;
        const nonce = 'nonce'
        const APPLE_SERVICE_ID = 'run.tread.applesignin';
        const APPLE_BUNDLE_ID = 'run.tread.treadmobile';
        let cryptoStub;
        let updateStub;
        let digestStub;

        beforeEach(() => {
            digestStub = sandbox.stub();
            updateStub = sandbox.stub().returns({digest: digestStub});
            cryptoStub = sandbox.stub(crypto, "createHash").returns({update:updateStub});
            appleVerify = auth.__get__("appleVerify");
            OAuthStub = sandbox.stub(appleSignin, "verifyIdToken");
        });

        it("verify should return the proper information", async function() {
            OAuthStub.resolves(IDInfo);
            digestStub.returns("encryptedNonce");
            const result = await appleVerify(token, nonce);
            expect(result).to.deep.equal(IDInfo);
            expect(OAuthStub).to.have.been.calledWith(token, {
                audience: [APPLE_SERVICE_ID, APPLE_BUNDLE_ID],
                nonce: "encryptedNonce"
            });
            expect(updateStub).to.have.been.calledWith(nonce)
        });

        it("verify should throw correctly", async function() {
            OAuthStub.rejects("");
            digestStub.returns("encryptedNonce");
            let verifySpy = sandbox.spy(appleVerify);
            try {
                await appleVerify(token, nonce);
            } catch {}
            expect(verifySpy).to.have.thrown;
            expect(OAuthStub).to.have.been.calledWith(token, {
                audience: [APPLE_SERVICE_ID, APPLE_BUNDLE_ID],
                nonce: "encryptedNonce"
            });
        });

        it("verify can pass falsy nonce", async function() {
            OAuthStub.rejects("");
            let verifySpy = sandbox.spy(appleVerify);
            try {
                await appleVerify(token, false);
            } catch {}
            expect(verifySpy).to.have.thrown;
            expect(OAuthStub).to.have.been.calledWith(token, {
                audience: [APPLE_SERVICE_ID, APPLE_BUNDLE_ID],
                nonce: undefined
            });
        });


    });

    describe("Testing login()", () => {
        let login;
        let verifyStub;
        let getUserDocFromAuthSubStub;
        let createNewUserIfNecessaryStub;
        const authenticationSource = "google";
        const nonce = "nonce";
        const fullName = {givenName: "first", familyName: "last"};
        const IDToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk2OTcxODA4Nzk2ODI5YTk3MmU3OWE5ZDFhOWZmZjExY2Q2MWIxZTMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2ODIwMzI1MzQsImF1ZCI6IjE3MTU3MTY1Mzg2OS1sczVpcWRsbzFib2U2aXNqN3Ixa29vMnR2aTU3ZzYybS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwODg3NjU4MDczNDk0MTE3OTkyNCIsImVtYWlsIjoiaG93YXJkdzExN0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXpwIjoiMTcxNTcxNjUzODY5LWxzNWlxZGxvMWJvZTZpc2o3cjFrb28ydHZpNTdnNjJtLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwibmFtZSI6Ikhvd2FyZCBXYW5nIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FHTm15eGJqZENkZW5OdF9yc2g2d0tHS0ZxSElzbm1XUjNxcmM0b0ZlY2c4a3c9czk2LWMiLCJnaXZlbl9uYW1lIjoiSG93YXJkIiwiZmFtaWx5X25hbWUiOiJXYW5nIiwiaWF0IjoxNjgyMDMyODM0LCJleHAiOjE2ODIwMzY0MzQsImp0aSI6ImY3NWVjZDI0MGE1YzkwNmIzNjI1OTliOWE0ZWUwNDE2YjQ3ZDVlMTIifQ.qeFtF3_9zlCbexLZzr6iEGz4RXWU2aCSCl9MDddTYzR0hfXMc4S_bpEH1FtFXELhB3zozzMKH-ox3xBU7lLzwFj29jPPkHZOhU-V6GldSwZbVl7iSpm2Sfek9Xw_NW012wEi9CpKSKDlpFIxmGEyGDUBa5lpdowRAbdwVX43Pq_mo_H-tSqfwzI3Gb55CinbABqRHO1yRV_KReKQ0fsi28kuNhMdEtszYJq79XfvdAKpyi7lcghYfU5l-Vsz58VfB9X1AnRDj-Rfn8nGBrLangRfKfYgFTWNTtetXzLlugcif8UseK1AgrhIcIb3f4h2MAXvVXjV8N2b1GUVmyzy6A';
        const userInfoFromAuth = {"iss":"https://accounts.google.com","nbf":1682032534,"aud":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","sub":"108876580734941179924","email":"howardw117@gmail.com","email_verified":true,"azp":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","name":"Howard Wang","picture":"https://lh3.googleusercontent.com/a/AGNmyxbjdCdenNt_rsh6wKGKFqHIsnmWR3qrc4oFecg8kw=s96-c","given_name":"Howard","family_name":"Wang","iat":1682032834,"exp":1682036434,"jti":"f75ecd240a5c906b362599b9a4ee0416b47d5e12"};

        beforeEach(() => {
            login = auth.__get__("login");
            verifyStub = sandbox.stub();
            getUserDocFromAuthSubStub = sandbox.stub();
            createNewUserIfNecessaryStub = sandbox.stub();
            auth.__set__('verify', verifyStub);
            auth.__set__('getUserDocFromAuthSub', getUserDocFromAuthSubStub);
            auth.__set__('createNewUserIfNecessary', createNewUserIfNecessaryStub);
        });

        it("login() should throw verify() rejects", async function() {
            verifyStub.rejects('test error');
            getUserDocFromAuthSubStub.resolves('should not appear');
            createNewUserIfNecessaryStub.resolves('');
            try {
                await login(authenticationSource, IDToken, nonce, fullName);
            } catch {}
            expect(verifyStub).to.have.thrown;
            expect(getUserDocFromAuthSubStub).to.not.have.been.called;
            expect(createNewUserIfNecessaryStub).to.not.have.been.called;
        });

        it("login() should throw getUserDocFromAuthSub() rejects", async function() {
            verifyStub.resolves(userInfoFromAuth);
            getUserDocFromAuthSubStub.rejects();
            createNewUserIfNecessaryStub.resolves('');
            try {
                await login(authenticationSource, IDToken, nonce, fullName);
            } catch {}
            expect(verifyStub).to.have.been.calledWith(authenticationSource, IDToken, nonce);
            expect(getUserDocFromAuthSubStub).to.have.thrown;
            expect(createNewUserIfNecessaryStub).to.not.have.been.called;
        });

        it("login() should throw createNewUserIfNecessaryStub() rejects", async function() {
            verifyStub.resolves(userInfoFromAuth);
            getUserDocFromAuthSubStub.resolves({username: "test#2222"});
            createNewUserIfNecessaryStub.rejects('');
            try {
                await login(authenticationSource, IDToken, nonce, fullName);
            } catch {}
            expect(verifyStub).to.have.been.calledWith(authenticationSource, IDToken, nonce);
            expect(getUserDocFromAuthSubStub).to.have.been.calledWith(
                authenticationSource
            );
            expect(createNewUserIfNecessaryStub).to.have.thrown;
        });

        it("login() returns correctly", async function() {
            verifyStub.resolves(userInfoFromAuth);
            getUserDocFromAuthSubStub.resolves({username: "test#2222"});
            const infoNeededForSession = await login(authenticationSource, IDToken,
                nonce, fullName);
            expect(verifyStub).to.have.been.calledWith(authenticationSource, IDToken, nonce);
            expect(infoNeededForSession).to.deep.equal({
                authenticationSource: "google",
                userDoc: {username: "test#2222"},
                sub: "108876580734941179924",
            });
        });
    });

    describe("Testing createNewUserIfNecessary", () => {
        let createNewUserIfNecessary;
        let isNewUserStub;
        let createGoogleUserStub;
        let createAppleUserStub;
        let authenticationSource;
        let userDoc;
        let userInfoFromAuth = {"iss":"https://accounts.google.com","nbf":1682032534,"aud":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","sub":"108876580734941179924","email":"howardw117@gmail.com","email_verified":true,"azp":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","name":"Howard Wang","picture":"https://lh3.googleusercontent.com/a/AGNmyxbjdCdenNt_rsh6wKGKFqHIsnmWR3qrc4oFecg8kw=s96-c","given_name":"Howard","family_name":"Wang","iat":1682032834,"exp":1682036434,"jti":"f75ecd240a5c906b362599b9a4ee0416b47d5e12"};
        let fullName;


        beforeEach(() => {
            createNewUserIfNecessary = auth.__get__("createNewUserIfNecessary");
            isNewUserStub = sandbox.stub();
            createGoogleUserStub = sandbox.stub();
            createAppleUserStub = sandbox.stub();
            auth.__set__('isNewUser', isNewUserStub);
            auth.__set__('createGoogleUser', createGoogleUserStub);
            auth.__set__('createAppleUser', createAppleUserStub);
        });

        it("createNewUserIfNecessary() skips creating new user if isNewUser() returns false", async function() {
            isNewUserStub.returns(false);
            createGoogleUserStub.rejects();
            createAppleUserStub.rejects();
            await createNewUserIfNecessary(authenticationSource, userInfoFromAuth, userDoc);
            expect(createGoogleUserStub).to.not.have.been.called;
            expect(isNewUserStub).to.have.been.called;
        });

        describe("createGoogleUser() branch", () => {
            beforeEach(() => {
                authenticationSource = "google";
            })
            it("createNewUserIfNecessary() throws if createGoogleUser() rejects", async function() {
                isNewUserStub.returns(true);
                createGoogleUserStub.rejects("error");
                try {
                    await createNewUserIfNecessary(authenticationSource, userInfoFromAuth, userDoc);
                } catch {}
                expect(createGoogleUserStub).to.have.thrown;
                expect(isNewUserStub).to.have.been.called;
            });

            it("CreateNewUserIftNecessary() returns successfully", async function() {
                isNewUserStub.returns(true);
                createGoogleUserStub.resolves();
                await createNewUserIfNecessary(authenticationSource, userInfoFromAuth, userDoc);
                expect(createGoogleUserStub).to.have.been.called;
                expect(isNewUserStub).to.have.been.called;
            });
        });

        describe("createAppleUser() branch", () => {
            beforeEach(() => {
                authenticationSource = "apple";
                fullName = { givenName: "John", familyName: "Doe" };
            })
            it("createNewUserIfNecessary() throws if createAppleUser() rejects", async function() {
                isNewUserStub.returns(true);
                createAppleUserStub.rejects("error");
                try {
                    await createNewUserIfNecessary(authenticationSource,
                        userInfoFromAuth, userDoc, fullName
                    );
                } catch {}
                expect(createAppleUserStub).to.have.thrown;
                expect(isNewUserStub).to.have.been.called;
            });

            it("CreateNewUserIftNecessary() returns successfully", async function() {
                isNewUserStub.returns(true);
                createAppleUserStub.resolves();
                await createNewUserIfNecessary(authenticationSource,
                    userInfoFromAuth, userDoc, fullName
                );
                expect(createAppleUserStub).to.have.been.called;
                expect(isNewUserStub).to.have.been.called;
            });
        });
    });

    describe('Tests with requests and responses', () => {
        let req;
        let res;
        let next;

        beforeEach(() => {
            req = {
                body: {},
                headers: {},
                session: {},
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

            next = sandbox.stub();
        });

        describe("Testing appleLogin()", () => {
            let loginStub;
            let appleLogin;

            beforeEach(() => {
                req.headers.authorization = "token";
                req.body.nonce = "nonce";
                req.body.fullName = { givenName: "John", familyName: "Doe" };
                loginStub = sandbox.stub();
                auth.__set__("login", loginStub);
                appleLogin = auth.__get__("appleLogin");
            });

            it("appleLogin() returns successfully", async function() {
                const infoNeededForSession = {userDoc : {username: "joe"}, sub: "sub"}
                loginStub.resolves(infoNeededForSession);
                await appleLogin(req, res, next);
                expect(next).to.have.been.called;
                expect(loginStub).to.have.been.calledWith(
                    'apple', req.headers.authorization, req.body.nonce,
                    req.body.fullName
                );
                res.locals.infoNeededForSession = infoNeededForSession;
            });

            it("appleLogin() returns 401 when login rejects", async function() {
                const infoNeededForSession = {userDoc : {username: "joe"}, sub: "sub"}
                loginStub.rejects();
                await appleLogin(req, res, next);
                expect(next).to.not.have.been.called;
                expect(loginStub).to.have.been.calledWith(
                    'apple', req.headers.authorization, req.body.nonce,
                    req.body.fullName
                );
                expect(loginStub).to.have.thrown;
                expect(res.status).to.equal(401);
            });
        });

        describe("Testing googleLogin()", () => {
            let loginStub;
            let googleLogin;

            beforeEach(() => {
                req.headers.authorization = "token";
                req.body.nonce = "nonce";
                req.body.fullName = { givenName: "John", familyName: "Doe" };
                loginStub = sandbox.stub();
                auth.__set__("login", loginStub);
                googleLogin = auth.__get__("googleLogin");
            });

            it("googleLogin() returns successfully", async function() {
                const infoNeededForSession = {userDoc : {username: "joe"}, sub: "sub"}
                loginStub.resolves(infoNeededForSession);
                await googleLogin(req, res, next);
                expect(next).to.have.been.called;
                expect(loginStub).to.have.been.calledWith(
                    'google', req.headers.authorization
                );
                res.locals.infoNeededForSession = infoNeededForSession;
            });

            it("googleLogin() returns 401 when login rejects", async function() {
                const infoNeededForSession = {userDoc : {username: "joe"}, sub: "sub"}
                loginStub.rejects();
                await googleLogin(req, res, next);
                expect(next).to.not.have.been.called;
                expect(loginStub).to.have.been.calledWith(
                    'google', req.headers.authorization
                );
                expect(loginStub).to.have.thrown;
                expect(res.status).to.equal(401);
            });
        });

        describe("Testing generateLoggedInSession()", () => {
            let generateLoggedInSession;
            let hasUsernameFromDocStub;
            let registerDeviceTokenStub;

            beforeEach(() => {
                generateLoggedInSession = auth.__get__("generateLoggedInSession");
                hasUsernameFromDocStub = sandbox.stub();
                registerDeviceTokenStub = sandbox.stub();
                auth.__set__('hasUsernameFromDoc', hasUsernameFromDocStub);
                auth.__set__('registerDeviceToken', registerDeviceTokenStub);
                res.locals.infoNeededForSession = {
                    authenticationSource: "google",
                    userDoc: {username: "User#2222"},
                    sub: "108876580734941179924"
                }
                req.body.deviceToken = "cIn_pQAWKDe7-_qUzYcF1I:APA91bGBrIU-Ldd0Le9aDPeYJXT2AaUoI3El7FImQacGJMSRsfvJOr3jBWtYVMpmfDEopu42NbGD4ZJGGqJg4cM1ODt04SPyqkjrlCWz-uvaqvf-5_dGH1QHMGi_3ClrFn6Xr_UlP83Y";
            });

            it("generateLoggedInSession() returns successfully", async function() {
                req.session.regenerate = async function(inputFunction) {
                    await inputFunction();
                };
                req.session.save = async function(inputFunction) {
                    await inputFunction();
                };
                hasUsernameFromDocStub.returns(false);
                await generateLoggedInSession(req, res, next);
                expect(hasUsernameFromDocStub).to.have.been.called;
                expect(registerDeviceTokenStub).to.have.not.been.called;
                expect(req.session.username).to.equal(null);
            });

            it("generateLoggedInSession() returns status 500 if regenerate() fails",
                async function () {
                    req.session.regenerate = async function (inputFunction) {
                        await inputFunction("error");
                    };
                    req.session.save = async function (inputFunction) {
                        await inputFunction();
                    };
                    hasUsernameFromDocStub.returns(false);
                    await generateLoggedInSession(req, res, next);
                    expect(hasUsernameFromDocStub).to.have.been.called;
                    expect(registerDeviceTokenStub).to.have.not.been.called;
                    expect(res.status).to.equal(500);
                    expect(JSON.parse(res.data)).to.deep.equal("error");
            });

            it("generateLoggedInSession() returns status 500 if save() fails",
                async function () {
                    req.session.regenerate = async function (inputFunction) {
                        await inputFunction();
                    };
                    req.session.save = async function (inputFunction) {
                        await inputFunction("error");
                    };
                    hasUsernameFromDocStub.returns(false);
                    await generateLoggedInSession(req, res, next);
                    expect(hasUsernameFromDocStub).to.have.been.called;
                    expect(registerDeviceTokenStub).to.have.not.been.called;
                    expect(res.status).to.equal(500);
                    expect(JSON.parse(res.data)).to.deep.equal("error");
            });

            it("generateLoggedInSession() returns status 500 if save() fails",
            async function () {
                req.session.regenerate = async function (inputFunction) {
                    await inputFunction();
                };
                req.session.save = async function (inputFunction) {
                    await inputFunction("error");
                };
                hasUsernameFromDocStub.returns(true);
                await generateLoggedInSession(req, res, next);
                expect(hasUsernameFromDocStub).to.have.been.called;
                expect(registerDeviceTokenStub).to.have.been.called;
                expect(res.status).to.equal(500);
                expect(JSON.parse(res.data)).to.deep.equal("error");
            });

            it("generateLoggedInSession() returns correctly with username",
                async function () {
                    req.session.regenerate = async function (inputFunction) {
                        await inputFunction();
                    };
                    req.session.save = async function (inputFunction) {
                        await inputFunction();
                    };
                    hasUsernameFromDocStub.returns(true);
                    await generateLoggedInSession(req, res, next);
                    expect(hasUsernameFromDocStub).to.have.been.called;
                    expect(registerDeviceTokenStub).to.have.been.called;
                    expect(req.session.username).to.equal("User#2222");
                    expect(req.session.authenticationSource).to.equal('google');
                    expect(req.session.authenticationID).to.equal("108876580734941179924");
                    expect(res.status).to.equal(200);
                    expect(JSON.parse(res.data)).to.deep.equal({
                        hasUsername: true
                    });
            });

            it("generateLoggedInSession() returns correctly with no username",
                async function () {
                    req.session.regenerate = async function (inputFunction) {
                        await inputFunction();
                    };
                    req.session.save = async function (inputFunction) {
                        await inputFunction();
                    };
                    hasUsernameFromDocStub.returns(false);
                    await generateLoggedInSession(req, res, next);
                    expect(hasUsernameFromDocStub).to.have.been.called;
                    expect(registerDeviceTokenStub).to.not.have.been.called;
                    expect(req.session.username).to.equal(null);
                    expect(res.status).to.equal(200);
                    expect(req.session.authenticationSource).to.equal('google');
                    expect(req.session.authenticationID).to.equal("108876580734941179924");
                    expect(JSON.parse(res.data)).to.deep.equal({
                        hasUsername: false
                    });
            });
        });

        describe("Testing logout()", () => {
            let removeDeviceTokenStub;
            let logout;

            beforeEach(() => {
                logout = auth.__get__("logout");
                removeDeviceTokenStub = sandbox.stub();
                auth.__set__("removeDeviceToken", removeDeviceTokenStub)
                req.session.username = "user#2222";
                req.session.deviceToken = "cIn_pQAWKDe7-_qUzYcF1I:APA91bGBrIU-Ldd0Le9aDPeYJXT2AaUoI3El7FImQacGJMSRsfvJOr3jBWtYVMpmfDEopu42NbGD4ZJGGqJg4cM1ODt04SPyqkjrlCWz-uvaqvf-5_dGH1QHMGi_3ClrFn6Xr_UlP83Y";
            });

            it("res.status returns 500 if save() errors", async function() {
                req.session.save = async function(inputFunction) {
                    await inputFunction("error");
                };

                req.session.regenerate = async function(inputFunction) {
                    await inputFunction();
                };

                removeDeviceTokenStub.resolves();
                await logout(req, res);
                expect(res.status).to.equal(500);
            });

            it("throws when removeDeviceToken() rejects", async function() {
                req.session.save = async function(inputFunction) {
                    await inputFunction("error");
                };

                req.session.regenerate = async function(inputFunction) {
                    await inputFunction();
                };

                let logoutSpy = sandbox.spy(logout);

                removeDeviceTokenStub.rejects();
                try {
                    await logout(req, res);
                } catch {
                    expect(logoutSpy).to.have.thrown;
                    return
                }
                expect(5).to.equal(4);
            });


            it("res.status returns 500 if regenerate() errors", async function() {
                req.session.save = async function(inputFunction) {
                    await inputFunction();
                };

                req.session.regenerate = async function(inputFunction) {
                    await inputFunction("error");
                };

                removeDeviceTokenStub.resolves();
                await logout(req, res);
                expect(res.status).to.equal(500);
            });

            it("Outputs are null and res.status is 200 on success",
                async function() {
                    req.session.save = async function(inputFunction) {
                        await inputFunction();
                    };

                    req.session.regenerate = async function(inputFunction) {
                        await inputFunction();
                    };

                    removeDeviceTokenStub.resolves();
                    await logout(req, res);
                    expect(req.session.username).to.equal(null);
                    expect(req.session.authenticationSource).to.equal(null);
                    expect(req.session.authenticationID).to.equal(null);
                    expect(res.status).to.equal(200);
            });
        });

    });
})