const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();
const mongoose = require("mongoose");
const User = require("../../models/user.model");
const { isExistingUser } = require("../../routes/user");

describe("Testing data_origin", () =>{
    let user;

    beforeEach(() => {
        user = rewire("../../routes/user.js");
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("Testing isExistingUser()", () => {
        let isExistingUser;
        let leanStub;
        let existsStub;
        const username = "username";
        let isExistingUserSpy;

        beforeEach(() => {
            isExistingUser = user.__get__("isExistingUser");
            isExistingUserSpy = sandbox.spy(isExistingUser);
            leanStub = sandbox.stub();
            existsStub = sandbox.stub(mongoose.Model, "exists").returns({lean: leanStub});
        });

        it("isExistingUser() returns successfully", async function() {
            let stubResult = true;
            leanStub.resolves(stubResult);
            const results = await isExistingUser(username);
            expect(existsStub).to.have.been.calledWith({username: username});
            expect(results).to.equal(stubResult);
        });

        it("isExistingUser() throws when exists() rejects", async function() {
            leanStub.rejects();
            try {
                await isExistingUser(username);
            } catch {}
            expect(existsStub).to.have.been.calledWith({username: username});
            expect(isExistingUserSpy).to.have.thrown;
        });
    });

    describe("Testing getPropertyOfUser()", () => {
        let getPropertyOfUser;
        let getPropertyOfUserSpy;
        let leanStub;
        let findOneStub;
        const username = "username";
        const property = "property";

        beforeEach(() => {
            getPropertyOfUser = user.__get__("getPropertyOfUser");
            getPropertyOfUserSpy = sandbox.spy(getPropertyOfUser);
            leanStub = sandbox.stub();
            findOneStub = sandbox.stub(mongoose.Model, "findOne").returns({lean: leanStub});
        });

        it("getPropertyOfUser() returns successfully", async function() {
            let stubResult = {property: "propertyValue"};
            leanStub.resolves(stubResult);
            const results = await getPropertyOfUser(username, property);
            expect(findOneStub).to.have.been.calledWith({username: username}, property);
            expect(results).to.equal(stubResult);
        });

        it("getPropertyOfUser() throws when exists() rejects", async function() {
            leanStub.rejects();
            try {
                await getPropertyOfUser(username, property);
            } catch {}
            expect(findOneStub).to.have.been.calledWith({username: username}, property);
            expect(getPropertyOfUserSpy).to.have.thrown;
        });

    });

    describe("Testing updateProfileField()", () => {
        let updateProfileField;
        let updateProfileFieldSpy;
        let leanStub;
        let updateOneStub;
        const username = "username";
        const updates = "updates";

        beforeEach(() => {
            updateProfileField = user.__get__("updateProfileField");
            updateProfileFieldSpy = sandbox.spy(updateProfileField);
            leanStub = sandbox.stub();
            updateOneStub = sandbox.stub(mongoose.Model, "updateOne").returns({lean: leanStub});
        });

        it("updateProfileField() returns successfully", async function() {
            let stubResult = {result: "result"};
            leanStub.resolves(stubResult);
            const results = await updateProfileField(username, updates);
            expect(updateOneStub).to.have.been.calledWith(
                {username: username}, updates, {runValidators: true}
            );
            expect(results).to.equal(stubResult);
        });

        it("updateProfileField() throws when exists() rejects", async function() {
            leanStub.rejects();
            try {
                await updateProfileField(username, updates);
            } catch {}
            expect(updateOneStub).to.have.been.calledWith(
                {username: username}, updates, {runValidators: true}
            );
            expect(updateProfileFieldSpy).to.have.thrown;
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
        });

        describe("Testing checkUsernameExist()", () => {
            let checkUsernameExist;
            let checkUsernameExistSpy;
            let isExistingUserStub;

            beforeEach(() => {
                req.body.username = "username"
                checkUsernameExist = user.__get__("checkUsernameExist");
                checkUsernameExistSpy = sandbox.spy(checkUsernameExist);
                isExistingUserStub = sandbox.stub();
                user.__set__("isExistingUser", isExistingUserStub);
            });

            it("isExistingUser() returns successfully", async function() {
                const stubResult = true;
                isExistingUserStub.resolves(stubResult);
                await checkUsernameExist(req, res);
                expect(isExistingUserStub).to.have.been.calledWith(req.body.username);
                expect(JSON.parse(res.data)).to.deep.equal(stubResult);
            });

            it("isExistingUser() throws when exists() rejects", async function() {
                isExistingUserStub.rejects();
                try {
                    await checkUsernameExist(req, res);
                } catch {}
                expect(isExistingUserStub).to.have.been.calledWith(req.body.username);
                expect(checkUsernameExistSpy).to.have.thrown;
            });
        });

        describe("Testing getDisplayName()", () => {
            let getDisplayName;
            let getDisplayNameSpy;
            let getPropertyOfUserStub;

            beforeEach(() => {
                req.session.username = "username"
                getDisplayName = user.__get__("getDisplayName");
                getDisplayNameSpy = sandbox.spy(getDisplayName);
                getPropertyOfUserStub = sandbox.stub();
                user.__set__("getPropertyOfUser", getPropertyOfUserStub);
            });

            it("getDisplayName() returns successfully", async function() {
                const stubResult = {displayName: "displayName"};
                getPropertyOfUserStub.resolves(stubResult);
                await getDisplayName(req, res);
                expect(getPropertyOfUserStub).to.have.been.calledWith(req.session.username, 'displayName');
                expect(JSON.parse(res.data)).to.deep.equal(stubResult);
            });

            it("getDisplayName() throws when exists() rejects", async function() {
                getPropertyOfUserStub.rejects();
                try {
                    await getDisplayName(req, res);
                } catch {}
                expect(getPropertyOfUserStub).to.have.been.calledWith(req.session.username, 'displayName');
                expect(getDisplayNameSpy).to.have.thrown;
            });
        });

        describe("Testing getUserName()", () => {
            let getUsername;
            let getUsernameSpy;

            beforeEach(() => {
                req.session.username = "username"
                getUsername = user.__get__("getUsername");
                getUsernameSpy = sandbox.spy(getUsername);
            });

            it("getUsername() returns successfully", async function() {
                await getUsername(req, res);
                expect(JSON.parse(res.data)).to.deep.equal("username");
            });
        });

        describe("Testing updatePicture()", () => {
            let updatePicture;
            let uploadImageStub;

            beforeEach(() => {
                updatePicture = user.__get__("updatePicture");
                uploadImageStub = sandbox.stub();
                user.__set__("uploadImage", uploadImageStub);
            });

            it("updatePicture() returns successfully with falsy picture", async function() {
                req.session.username = "username";
                req.body.picture = undefined;
                uploadImageStub.rejects();
                await updatePicture(req, res);
                expect(uploadImageStub).to.not.have.been.called;
                expect(res.status).to.equal(200);
            });


            describe("Tests with valid picture", () => {
                beforeEach(() => {
                    req.session.username = "username";
                    req.body.picture = "picture";
                });
                it("updatePicture() returns successfully", async function() {
                    uploadImageStub.resolves();
                    await updatePicture(req, res);
                    expect(uploadImageStub).to.have.been.calledWith(
                        req.body.picture, 'profilePictures',
                        req.session.username.replace('#', '_')
                    );
                    expect(res.status).to.equal(200);
                });

                it("updatePicture() throws when exists() rejects", async function() {
                    uploadImageStub.rejects();
                    try {
                        await updatePicture(req, res);
                    } catch {}
                    expect(uploadImageStub).to.have.been.calledWith(
                        req.body.picture, 'profilePictures',
                        req.session.username.replace('#', '_')
                    );
                    expect(uploadImageStub).to.have.thrown;
                    expect(res.status).to.equal(400);
                    expect(JSON.parse(res.data)).to.deep.equal("picture upload error");
                });
            });
        });

        describe("Testing updateDisplayName()", () => {
            let updateDisplayName;
            let updateProfileFieldStub;
            let isValidDisplayNameStub;

            beforeEach(() => {
                updateDisplayName = user.__get__("updateDisplayName");
                updateProfileFieldStub = sandbox.stub();
                isValidDisplayNameStub = sandbox.stub(User, "isValidDisplayName");
                user.__set__("updateProfileField", updateProfileFieldStub);
            });

            it("updateDisplayName() returns 500 when isVaildDisplayName returns false", async function() {
                req.session.username = "username";
                req.body.displayName = undefined;
                isValidDisplayNameStub.returns(false);
                await updateDisplayName(req, res);
                expect(updateProfileFieldStub).to.not.have.been.called;
                expect(res.status).to.equal(400);
            });


            describe("Tests with valid displayName", () => {
                beforeEach(() => {
                    req.session.username = "username";
                    req.body.displayName = "displayName";
                    isValidDisplayNameStub.returns(true);
                });
                it("updateDisplayName() returns successfully", async function() {
                    updateProfileFieldStub.resolves();
                    await updateDisplayName(req, res);
                    expect(updateProfileFieldStub).to.have.been.calledWith(
                        req.session.username,
                        { displayName: req.body.displayName }
                    );
                    expect(res.status).to.equal(200);
                });

                it("updateDisplayName() throws when exists() rejects", async function() {
                    updateProfileFieldStub.rejects();
                    try {
                        await updateDisplayName(req, res);
                    } catch {}
                    expect(updateProfileFieldStub).to.have.been.calledWith(
                        req.session.username,
                        { displayName: req.body.displayName }
                    );
                    expect(updateProfileFieldStub).to.have.thrown;
                });
            });
        });
    });
});