const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();
const mongoose = require("mongoose");
const { updateOne } = require("../../models/global_challenge_progress.model");
const { isValidUsername } = require("../../models/user.model");
const User = require("../../models/user.model");


describe("Testing global_challenge", () =>{
    let signUp;

    beforeEach(() => {
        signUp = rewire("../../routes/sign_up.js");
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("Testing getRandomIntInclusive()", () => {
        let randomStub;
        let getRandomIntInclusive;
        beforeEach(() => {
            getRandomIntInclusive = signUp.__get__("getRandomIntInclusive");
            randomStub = sandbox.stub(Math, "random");
        });
        it("getRandomIntInclusive() should allow bounds", function() {
            randomStub.returns(0.5);
            let result = getRandomIntInclusive(0,0);
            expect(result).to.equal(0);
            randomStub.returns(.9999);
            result = getRandomIntInclusive(0, 9999);
            expect(result).to.equal(9999);
        });

        it("getRandomIntInclusive() should allow intermediate numbers", function() {
            randomStub.returns(0.5);
            let result = getRandomIntInclusive(0, 9999);
            expect(result).to.equal(5000);
        });
    });

    describe("Testing createUserInbox()", () => {
        let createUserInbox;
        let saveStub;
        const username = "username";

        beforeEach(() => {
            createUserInbox = signUp.__get__("createUserInbox");
            saveStub = sandbox.stub(mongoose.Model.prototype, "save");
        });

        it("createUserInbox() works", async function() {
            await createUserInbox(username);
            expect(saveStub).to.have.been.called;
        });

        it("createUserInbox() throws when save rejects", async function() {
            try {
                await createUserInbox(username);
            } catch {}
            expect(saveStub).to.have.thrown;
        });
    });

    describe("Testing formatDiscriminator()", () => {
        let formatDiscriminator;
        beforeEach(() => {
            formatDiscriminator = signUp.__get__("formatDiscriminator");
        });
        it("formatDiscriminator() should pad 3 zeros to 1 digit number", function() {
            const result = formatDiscriminator(1);
            expect(result).to.equal('0001');
        });
        it("formatDiscriminator() should pad 2 zeros to 2 digit number", function() {
            const result = formatDiscriminator(12);
            expect(result).to.equal('0012');
        });
        it("formatDiscriminator() should pad 1 zero to 3 digit number", function() {
            const result = formatDiscriminator(123);
            expect(result).to.equal('0123');
        });
        it("formatDiscriminator() should pad no zeros to 4 digit number", function() {
            const result = formatDiscriminator(1234);
            expect(result).to.equal('1234');
        });
    });

    describe("Testing setUsernameAndUpdateProfile()", () => {
        let setUsernameAndUpdateProfile;
        let getRandomIntInclusiveStub;
        let formatDiscriminatorStub;
        let updateOneStub;
        const userIdentifiers = {
            authenticationID: "ID",
            authenticationSource: "google"
        };
        const profileInfo = {familyName: "familyName", givenName: "givenName"};
        const displayName = "displayName";
        const chosenUsername = "username";

        beforeEach(() => {
            setUsernameAndUpdateProfile = signUp.__get__("setUsernameAndUpdateProfile");
            updateOneStub = sandbox.stub(mongoose.Model, "updateOne");
            formatDiscriminatorStub = sandbox.stub();
            getRandomIntInclusiveStub = sandbox.stub();
            signUp.__set__("formatDiscriminator", formatDiscriminatorStub);
            signUp.__set__("getRandomIntInculsive", getRandomIntInclusiveStub);
        });


        it("setUsernameAndUpdateProfile() returns valid username", async function() {
            getRandomIntInclusiveStub.returns(500);
            formatDiscriminatorStub.returns("0500");
            updateOneStub.resolves()
            const result = await setUsernameAndUpdateProfile(userIdentifiers,
                profileInfo, displayName, chosenUsername);
            expect(result).to.equal("username#0500");

        });

        it("setUsernameAndUpdateProfile() throws", async function() {
            getRandomIntInclusiveStub.returns(500);
            formatDiscriminatorStub.returns("0500");
            updateOneStub.rejects()
            let setUsernameAndUpdateProfileSpy = sandbox.spy(setUsernameAndUpdateProfile);
            try {
            const result = await setUsernameAndUpdateProfile(userIdentifiers,
                profileInfo, displayName, chosenUsername);
            } catch {}
            expect(setUsernameAndUpdateProfileSpy).to.have.thrown;

        });
    });

    describe("Testing generateUserMedalProgress()", () => {
        const username = "username";
        let generateUserMedalProgress;
        let findStub;
        let bulkWriteStub;
        const medals = [
            {
                level: 1,
                exercise: {exerciseName: "exercise1"}
            },
            {
                level: 2,
                exercise: {exerciseName: "exercise1"}
            },
            {
                level: 1,
                exercise: {exerciseName: "exercise2"}
            },
            {
                level: 3,
                exercise: {exerciseName: "exercise2"}
            }
        ]
        beforeEach(() => {
            generateUserMedalProgress = signUp.__get__("generateUserMedalProgress");
            findStub = sandbox.stub(mongoose.Model, "find");
            bulkWriteStub = sandbox.stub(mongoose.Model, "bulkWrite");
        });


        it("generateUserMedalProgress() returns successfully", async function() {
            findStub.resolves(medals);
            bulkWriteStub.resolves();
            await generateUserMedalProgress(username);
            expect(bulkWriteStub).to.have.been.calledWith([
                {
                    insertOne: {
                        document: {
                            username: username,
                            level: 1,
                            exercise: {exerciseName: "exercise1"}
                        }
                    }
                },
                {
                    insertOne: {
                        document: {
                            username: username,
                            level: 2,
                            exercise: {exerciseName: "exercise1"}
                        }
                    }
                },
                {
                    insertOne: {
                        document: {
                            username: username,
                            level: 1,
                            exercise: {exerciseName: "exercise2"}
                        }
                    }
                },
                {
                    insertOne: {
                        document: {
                            username: username,
                            level: 3,
                            exercise: {exerciseName: "exercise2"}
                        }
                    }
                },
            ])
        });

        it("generateUserMedalProgress() throws when find() rejects", async function() {
            findStub.rejects();
            bulkWriteStub.resolves();
            try {
                await generateUserMedalProgress(username);
            } catch {}
            expect(findStub).to.have.thrown;
        });
        it("generateUserMedalProgress() throws when bulkWrite() rejects", async function() {
            findStub.resolves();
            bulkWriteStub.rejects();
            try {
                await generateUserMedalProgress(username);
            } catch {}
            expect(bulkWriteStub).to.have.thrown;
        });
    });

    describe("Functions that use req, res", () => {
        beforeEach(() => {
            req = {
                body: {},
                session: {}
            }

            res = {
                query: {},
                headers: {},
                data: null,
                status: 0,
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

        describe("Testing getProfilePhoto()", () => {
            let findOneStub;
            let getProfilePhoto;
            let leanStub;

            beforeEach(() => {
                req.session.authenticationID = "ID";
                req.session.authenticationSource= "google";
                leanStub = sandbox.stub();
                findOneStub = sandbox.stub(mongoose.Model, "findOne").returns({lean: leanStub});
                getProfilePhoto = signUp.__get__("getProfilePhoto");
            });

            it("getProfilePhoto() returns successfully", async function(){
                leanStub.resolves({username: "username", picture: "picture"});
                await getProfilePhoto(req, res);
                expect(findOneStub).to.have.been.calledWith({
                    authenticationID: req.session.authenticationID,
                    authenticationSource: req.session.authenticationSource,
                  });
                expect(res.status).to.equal(200);
                expect(JSON.parse(res.data)).to.equal("picture")
            });

            it("getProfilePhoto() throws when findOne() throws", async function(){
                leanStub.rejects();
                try {
                    await getProfilePhoto(req, res);
                } catch {}
                expect(findOneStub).to.have.been.calledWith({
                    authenticationID: req.session.authenticationID,
                    authenticationSource: req.session.authenticationSource,
                });
                expect(findOneStub).to.have.thrown;
            });
        });
        describe("Testing signUp()", () => {
            let signUpStub;
            let isValidUsernameStub;
            let isValidDisplayNameStub;
            let setUsernameAndUpdateProfileStub;
            let createUserInboxStub;
            let generateUserMedalProgressStub;
            let uploadImageStub;
            let registerDeviceTokenStub;

            beforeEach(() => {
                req.body.username = "username";
                req.body.picture = "picture";
                req.body.displayName = "displayName";
                req.session.authenticationSource = "google";
                req.session.authenticationID = "authID";
                req.session.username = null;
                signUpStub = signUp.__get__("signUp");
                isValidUsernameStub = sandbox.stub(User, "isValidUsername");
                isValidDisplayNameStub = sandbox.stub(User, "isValidDisplayName");
                setUsernameAndUpdateProfileStub = sandbox.stub();
                createUserInboxStub = sandbox.stub();
                generateUserMedalProgressStub = sandbox.stub();
                uploadImageStub = sandbox.stub();
                registerDeviceTokenStub = sandbox.stub();
                signUp.__set__("setUsernameAndUpdateProfile", setUsernameAndUpdateProfileStub);
                signUp.__set__("createUserInbox", createUserInboxStub);
                signUp.__set__("generateUserMedalProgress", generateUserMedalProgressStub);
                signUp.__set__("uploadImage", uploadImageStub);
                signUp.__set__("registerDeviceToken", registerDeviceTokenStub);
            });

            it("signUp returns correctly", async function() {
                isValidUsernameStub.returns(true);
                isValidDisplayNameStub.returns(true);
                setUsernameAndUpdateProfileStub.resolves("username#2222");
                createUserInboxStub.resolves();
                generateUserMedalProgressStub.resolves();
                uploadImageStub.resolves();
                registerDeviceTokenStub.resolves();
                await signUpStub(req, res);
                expect(res.status).to.equal(200);
            });

            it("signUp sends status 400 if already username exists", async function() {
                req.session.username = "username";
                isValidUsernameStub.returns(true);
                isValidDisplayNameStub.returns(true);
                setUsernameAndUpdateProfileStub.resolves("username#2222");
                createUserInboxStub.resolves();
                generateUserMedalProgressStub.resolves();
                uploadImageStub.resolves();
                registerDeviceTokenStub.resolves();
                await signUpStub(req, res);
                expect(res.status).to.equal(400);
                expect(JSON.parse(res.data)).to.equal("Error: already has username");
            });

            it("signUp sends status 400 if username is invalid", async function() {
                isValidUsernameStub.returns(false);
                isValidDisplayNameStub.returns(true);
                setUsernameAndUpdateProfileStub.resolves("username#2222");
                createUserInboxStub.resolves();
                generateUserMedalProgressStub.resolves();
                uploadImageStub.resolves();
                registerDeviceTokenStub.resolves();
                await signUpStub(req, res);
                expect(res.status).to.equal(400);
                expect(JSON.parse(res.data)).to.equal("Error: invalid username");
            });

            it("signUp sends status 400 if displayname is invalid", async function() {
                isValidUsernameStub.returns(true);
                isValidDisplayNameStub.returns(false);
                setUsernameAndUpdateProfileStub.resolves("username#2222");
                createUserInboxStub.resolves();
                generateUserMedalProgressStub.resolves();
                uploadImageStub.resolves();
                registerDeviceTokenStub.resolves();
                await signUpStub(req, res);
                expect(res.status).to.equal(400);
                expect(JSON.parse(res.data)).to.equal("Error: invalid displayName");
            });

            it("signUp sends status 500 if setUsernameAndUpdateProfile() throws", async function() {
                isValidUsernameStub.returns(true);
                isValidDisplayNameStub.returns(true);
                setUsernameAndUpdateProfileStub.rejects();
                createUserInboxStub.resolves();
                generateUserMedalProgressStub.resolves();
                uploadImageStub.resolves();
                registerDeviceTokenStub.resolves();
                await signUpStub(req, res);
                expect(res.status).to.equal(500);
                expect(JSON.parse(res.data)).to.equal("Username not available");
            });

            it("signUp sends status 500 if createUserInbox throws", async function() {
                isValidUsernameStub.returns(true);
                isValidDisplayNameStub.returns(true);
                setUsernameAndUpdateProfileStub.resolves("username#2222");
                createUserInboxStub.rejects();
                generateUserMedalProgressStub.resolves();
                uploadImageStub.resolves();
                registerDeviceTokenStub.resolves();
                await signUpStub(req, res);
                expect(res.status).to.equal(500);
            });

            it("signUp sends status 500 if generateUserMedalProgress throws", async function() {
                isValidUsernameStub.returns(true);
                isValidDisplayNameStub.returns(true);
                setUsernameAndUpdateProfileStub.resolves("username#2222");
                createUserInboxStub.resolves();
                generateUserMedalProgressStub.rejects();
                uploadImageStub.resolves();
                registerDeviceTokenStub.resolves();
                await signUpStub(req, res);
                expect(res.status).to.equal(500);
            });

            it("signUp sends status 500 if uploadImage throws", async function() {
                isValidUsernameStub.returns(true);
                isValidDisplayNameStub.returns(true);
                setUsernameAndUpdateProfileStub.resolves("username#2222");
                createUserInboxStub.resolves();
                generateUserMedalProgressStub.resolves();
                uploadImageStub.rejects();
                registerDeviceTokenStub.resolves();
                await signUpStub(req, res);
                expect(res.status).to.equal(500);
            });

            it("signUp sends status 500 if registerDeviceToken throws", async function() {
                isValidUsernameStub.returns(true);
                isValidDisplayNameStub.returns(true);
                setUsernameAndUpdateProfileStub.resolves("username#2222");
                createUserInboxStub.resolves();
                generateUserMedalProgressStub.resolves();
                uploadImageStub.resolves();
                registerDeviceTokenStub.rejects();
                await signUpStub(req, res);
                expect(res.status).to.equal(500);
            });
        });
    });
});
