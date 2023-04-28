const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
const mongoose = require("mongoose");
const { OAuth2Client,   LoginTicket } = require('google-auth-library');
var sandbox = require("sinon").createSandbox();

describe('Testing authentication', () => {
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
            let createUserSpy = sandbox.spy(createUser);
            try{
                await createUser(userInfo);
            }
            catch(err){
                expect(createUserSpy).to.have.thrown;
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
            let verifySpy = sandbox.spy(verify);
            try {
                await verify(token);
            } catch {
                expect(verifySpy).to.have.thrown;
                return;
            }
            expect(4).to.equal(5);
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

        describe("Testing verifyUserAndFindUsername()", () => {
            let verifyStub;
            let findOneStub;
            let verifyUserAndFindUsername;
            let leanStub;

            beforeEach(() => {
                req.headers.authorization = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk2OTcxODA4Nzk2ODI5YTk3MmU3OWE5ZDFhOWZmZjExY2Q2MWIxZTMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2ODIwMzI1MzQsImF1ZCI6IjE3MTU3MTY1Mzg2OS1sczVpcWRsbzFib2U2aXNqN3Ixa29vMnR2aTU3ZzYybS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwODg3NjU4MDczNDk0MTE3OTkyNCIsImVtYWlsIjoiaG93YXJkdzExN0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXpwIjoiMTcxNTcxNjUzODY5LWxzNWlxZGxvMWJvZTZpc2o3cjFrb28ydHZpNTdnNjJtLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwibmFtZSI6Ikhvd2FyZCBXYW5nIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FHTm15eGJqZENkZW5OdF9yc2g2d0tHS0ZxSElzbm1XUjNxcmM0b0ZlY2c4a3c9czk2LWMiLCJnaXZlbl9uYW1lIjoiSG93YXJkIiwiZmFtaWx5X25hbWUiOiJXYW5nIiwiaWF0IjoxNjgyMDMyODM0LCJleHAiOjE2ODIwMzY0MzQsImp0aSI6ImY3NWVjZDI0MGE1YzkwNmIzNjI1OTliOWE0ZWUwNDE2YjQ3ZDVlMTIifQ.qeFtF3_9zlCbexLZzr6iEGz4RXWU2aCSCl9MDddTYzR0hfXMc4S_bpEH1FtFXELhB3zozzMKH-ox3xBU7lLzwFj29jPPkHZOhU-V6GldSwZbVl7iSpm2Sfek9Xw_NW012wEi9CpKSKDlpFIxmGEyGDUBa5lpdowRAbdwVX43Pq_mo_H-tSqfwzI3Gb55CinbABqRHO1yRV_KReKQ0fsi28kuNhMdEtszYJq79XfvdAKpyi7lcghYfU5l-Vsz58VfB9X1AnRDj-Rfn8nGBrLangRfKfYgFTWNTtetXzLlugcif8UseK1AgrhIcIb3f4h2MAXvVXjV8N2b1GUVmyzy6A';
                verifyUserAndFindUsername = auth.__get__("verifyUserAndFindUsername");
                verifyStub = sandbox.stub();
                auth.__set__('verify', verifyStub);
                leanStub = sandbox.stub();
                findOneStub = sandbox.stub(mongoose.Model, "findOne").returns({lean: leanStub});
            });
            it("verifyUserAndFindUsername should return 401 if verify() fails", async function() {
                verifyStub.rejects('test error');
                leanStub.resolves('should not appear');
                await verifyUserAndFindUsername(req, res, next);
                expect(res.status).to.equal(401);
                expect(JSON.parse(res.data)).to.equal('Error: test error')
                expect(res.locals.usernameDoc).to.not.equal('should not appear')
            });
            it("verifyUserAndFindUsername returns correctly", async function() {
                verifyStub.resolves({"iss":"https://accounts.google.com","nbf":1682032534,"aud":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","sub":"108876580734941179924","email":"howardw117@gmail.com","email_verified":true,"azp":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","name":"Howard Wang","picture":"https://lh3.googleusercontent.com/a/AGNmyxbjdCdenNt_rsh6wKGKFqHIsnmWR3qrc4oFecg8kw=s96-c","given_name":"Howard","family_name":"Wang","iat":1682032834,"exp":1682036434,"jti":"f75ecd240a5c906b362599b9a4ee0416b47d5e12"});
                leanStub.resolves({username: "test#2222"});
                await verifyUserAndFindUsername(req, res, next);
                expect(res.locals.userInfoFromAuth).to.deep.equal({"iss":"https://accounts.google.com","nbf":1682032534,"aud":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","sub":"108876580734941179924","email":"howardw117@gmail.com","email_verified":true,"azp":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","name":"Howard Wang","picture":"https://lh3.googleusercontent.com/a/AGNmyxbjdCdenNt_rsh6wKGKFqHIsnmWR3qrc4oFecg8kw=s96-c","given_name":"Howard","family_name":"Wang","iat":1682032834,"exp":1682036434,"jti":"f75ecd240a5c906b362599b9a4ee0416b47d5e12"})
                expect(res.locals.usernameDoc).to.deep.equal({username: 'test#2222'});
            });
        });

        describe("Testing createNewUserIfNecessary", () => {
            let createNewUserIfNecessary;
            let isNewUserStub;
            let createUserStub;

            beforeEach(() => {
                createNewUserIfNecessary = auth.__get__("createNewUserIfNecessary");
                isNewUserStub = sandbox.stub();
                createUserStub = sandbox.stub();
                auth.__set__('isNewUser', isNewUserStub);
                auth.__set__('createUser', createUserStub);
                res.locals.userInfoFromAuth = {"iss":"https://accounts.google.com","nbf":1682032534,"aud":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","sub":"108876580734941179924","email":"howardw117@gmail.com","email_verified":true,"azp":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","name":"Howard Wang","picture":"https://lh3.googleusercontent.com/a/AGNmyxbjdCdenNt_rsh6wKGKFqHIsnmWR3qrc4oFecg8kw=s96-c","given_name":"Howard","family_name":"Wang","iat":1682032834,"exp":1682036434,"jti":"f75ecd240a5c906b362599b9a4ee0416b47d5e12"};
            });

            it("Skips createUser() if isNewUser() returns false", async function() {
                isNewUserStub.returns(false);
                createUserStub.rejects();
                await createNewUserIfNecessary(req, res, next);
                expect(createUserStub).to.not.have.been.called;
                expect(isNewUserStub).to.have.been.called;
                expect(next).to.have.been.called;
            });

            it("Returns status 500 if createUser() rejects", async function() {
                isNewUserStub.returns(true);
                createUserStub.rejects("error");
                await createNewUserIfNecessary(req, res, next);
                expect(createUserStub).to.have.been.called;
                expect(isNewUserStub).to.have.been.called;
                expect(next).to.not.have.been.called;
                expect(res.status).to.equal(500);
                expect(JSON.parse(res.data)).to.deep.equal("Error: error");
            });

            it("CreateNewUserIftNecessary() returns successfully", async function() {
                isNewUserStub.returns(true);
                createUserStub.resolves();
                await createNewUserIfNecessary(req, res, next);
                expect(createUserStub).to.have.been.called;
                expect(isNewUserStub).to.have.been.called;
                expect(next).to.have.been.called;
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
                res.locals.usernameDoc = {username: "User#2222"};
                res.locals.userInfoFromAuth = {"iss":"https://accounts.google.com","nbf":1682032534,"aud":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","sub":"108876580734941179924","email":"howardw117@gmail.com","email_verified":true,"azp":"171571653869-ls5iqdlo1boe6isj7r1koo2tvi57g62m.apps.googleusercontent.com","name":"Howard Wang","picture":"https://lh3.googleusercontent.com/a/AGNmyxbjdCdenNt_rsh6wKGKFqHIsnmWR3qrc4oFecg8kw=s96-c","given_name":"Howard","family_name":"Wang","iat":1682032834,"exp":1682036434,"jti":"f75ecd240a5c906b362599b9a4ee0416b47d5e12"};
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

        /* logout */
    });
})