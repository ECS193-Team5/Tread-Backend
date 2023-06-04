const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();
const mongoose = require("mongoose");

describe("Testing delete_user", () =>{
    let deleteUser;

    beforeEach(() => {
        deleteUser = rewire("../../routes/delete_user.js");
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("Testing createQueryToPullFieldFromMany()", () => {
        let createQueryToPullFieldFromMany;
        const filter = "filter";
        const expectedDocument = {
            updateMany: {
                filter: filter,
                update: { $pull: filter }
            }
        }
        beforeEach(() => {
            createQueryToPullFieldFromMany = deleteUser.__get__("createQueryToPullFieldFromMany");
        });
        it("createQueryToPullFieldFromMany() returns the right document", () => {
            const resultDocument = createQueryToPullFieldFromMany(filter);
            expect(resultDocument).to.deep.equal(expectedDocument);
        });
    });

    describe("Testing createQueryToDeleteMany()", () => {
        let createQueryToDeleteMany;
        const filter = "filter";
        const expectedDocument = {
            deleteMany: {
                filter: filter,
            }
        }
        beforeEach(() => {
            createQueryToDeleteMany = deleteUser.__get__("createQueryToDeleteMany");
        });
        it("createQueryToDeleteMany() returns the right document", () => {
            const resultDocument = createQueryToDeleteMany(filter);
            expect(resultDocument).to.deep.equal(expectedDocument);
        });
    });


    describe("Tests that rely on deleteUserChallenges() and removeUserFromLeagues()", () => {
        let createQueryToPullFieldFromManyStub;
        let createQueryToDeleteManyStub;
        let deleteOneStub;
        let bulkWriteStub;

        beforeEach(() => {
            createQueryToPullFieldFromManyStub = sandbox.stub();
            createQueryToDeleteManyStub = sandbox.stub();
            deleteUser.__set__("createQueryToPullFieldFromMany", createQueryToPullFieldFromManyStub);
            deleteUser.__set__("createQueryToDeleteMany", createQueryToDeleteManyStub);
            bulkWriteStub = sandbox.stub(mongoose.Model, "bulkWrite");
            deleteOneStub = sandbox.stub(mongoose.Model, "deleteOne")
        });

        describe("Testing deleteUserFriendList()", () => {
            let deleteUserFriendList;
            let deleteUserFriendListSpy;
            const username = "username"
            beforeEach(() => {
                deleteUserFriendList = deleteUser.__get__("deleteUserFriendList");
                deleteUserFriendListSpy = sandbox.spy(deleteUserFriendList);
            });
            it("deleteUserFriendList() returns the right document", async function() {
                const bulkWriteResult = "bulkWrite";
                const deleteOneResult = " deleteOne";
                bulkWriteStub.resolves(bulkWriteResult);
                deleteOneStub.resolves(deleteOneResult);
                const promises = await deleteUserFriendList(username);
                expect(promises).to.deep.equal([bulkWriteResult, bulkWriteResult, deleteOneResult]);
            });

            it("deleteUserFriendList() throws when bulkwrite rejects", async function() {
                const bulkWriteResult = "bulkWrite";
                const deleteOneResult = " deleteOne";
                bulkWriteStub.rejects(bulkWriteResult);
                deleteOneStub.resolves(deleteOneResult);
                let promises;
                try {
                    promises = await deleteUserFriendList(username);
                } catch {}
                expect(bulkWriteStub).to.have.thrown;
                expect(deleteUserFriendListSpy).to.have.thrown;
            });

            it("deleteUserFriendList() throws when deleteOne rejects", async function() {
                const bulkWriteResult = "bulkWrite";
                const deleteOneResult = " deleteOne";
                bulkWriteStub.resolves(bulkWriteResult);
                deleteOneStub.rejects(deleteOneResult);
                let promises;
                try {
                    promises = await deleteUserFriendList(username);
                } catch {}
                expect(deleteOneStub).to.have.thrown;
                expect(deleteUserFriendListSpy).to.not.have.thrown;
            });
        });

        describe("Testing deleteUserChallenges()", () => {
            let deleteUserChallenges;
            const username = "username"
            const deleteQueryReturn = {
                deleteMany: {
                    filter: { sentUser: username, challengeType: "type" },
                }
            }

            beforeEach(() => {
                deleteUserChallenges = deleteUser.__get__("deleteUserChallenges");
                createQueryToDeleteManyStub.returns(deleteQueryReturn);
            });
            it("deleteUserChallenges() returns the right document", async function() {
                const challengeQueries = [
                    deleteQueryReturn, deleteQueryReturn, deleteQueryReturn
                ]
                const bulkWriteResult = "bulkWrite";
                bulkWriteStub.resolves(bulkWriteResult);
                const promise = await deleteUserChallenges(username);
                expect(bulkWriteStub).to.be.calledWith(challengeQueries, {ordered: false})
                expect(promise).to.deep.equal(bulkWriteResult);
            });

            it("deleteUserChallenges() throws when bulkwrite rejects", async function() {
                const challengeQueries = [
                    deleteQueryReturn, deleteQueryReturn, deleteQueryReturn
                ]
                const bulkWriteResult = "bulkWrite";
                bulkWriteStub.rejects(bulkWriteResult);
                const deleteUserChallengesSpy = sandbox.spy(deleteUserChallenges);
                try {
                    await deleteUserChallenges(username);
                } catch {}
                expect(bulkWriteStub).to.be.calledWith(challengeQueries, {ordered: false})
                expect(bulkWriteStub).to.have.thrown;
                expect(deleteUserChallengesSpy).to.have.thrown;
            });
        });

        describe("Testing removeUserFromLeagues()", () => {
            let removeUserFromLeagues;
            let removeUserFromLeaguesSpy;
            let findStub;
            let deleteLeagueAndInformationStub;
            const username = "username"
            const pullQueryResults = {
                updateMany: {
                    filter: { admin: username },
                    update: { $pull: { admin: username } }
                }
            }
            const leagueQueries = [
                pullQueryResults, pullQueryResults, pullQueryResults,
                pullQueryResults, pullQueryResults
            ];
            beforeEach(() => {
                createQueryToPullFieldFromManyStub.returns(pullQueryResults);
                removeUserFromLeagues = deleteUser.__get__("removeUserFromLeagues");
                removeUserFromLeaguesSpy = sandbox.spy(removeUserFromLeagues);
                findStub = sandbox.stub(mongoose.Model, "find");
                deleteLeagueAndInformationStub = sandbox.stub();
                deleteUser.__set__("deleteLeagueAndInformation", deleteLeagueAndInformationStub);
            });

            it("removeUserFromLeagues() returns successfully", async function() {
                findStub.resolves([{_id: "leagueID"}, {_id:  "leagueID"}]);
                const bulkWrite = "bulkWrite";
                bulkWriteStub.resolves(bulkWrite);
                const result = await removeUserFromLeagues(username);
                expect(bulkWriteStub).to.have.been.calledWith(leagueQueries, {ordered: false});
                expect(bulkWrite).to.equal(result);
            });

            it("removeUserFromLeagues() throws when bulkWrite() rejects", async function() {
                findStub.resolves([{_id: "leagueID"}, {_id:  "leagueID"}]);
                bulkWriteStub.rejects();
                try {
                    await removeUserFromLeagues(username);
                } catch {}
                expect(bulkWriteStub).to.have.been.calledWith(leagueQueries, {ordered: false});
                expect(removeUserFromLeaguesSpy).to.have.thrown;
            });

            it("removeUserFromLeagues() throws when find() rejects", async function() {
                findStub.rejects();
                bulkWriteStub.resolves();
                try {
                    await removeUserFromLeagues(username);
                } catch {}
                expect(bulkWriteStub).to.not.have.been.called;
                expect(removeUserFromLeaguesSpy).to.have.thrown;
            });
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

        describe("Testing deleteUserFromDatabase()", () => {
            let deleteOneStub;
            let deleteUserFriendListStub;
            let deleteUserChallengesStub;
            let deleteManyStub;
            let removeUserFromLeaguesStub;
            let deleteImageStub;
            let deleteUserFromDatabase;
            const username = "username";

            beforeEach(() => {
                req.session.username = username;
                deleteOneStub = sandbox.stub(mongoose.Model, "deleteOne");
                deleteManyStub = sandbox.stub(mongoose.Model, "deleteMany");
                deleteUserFriendListStub = sandbox.stub();
                deleteUserChallengesStub = sandbox.stub();
                removeUserFromLeaguesStub = sandbox.stub();
                deleteImageStub = sandbox.stub();
                deleteUser.__set__("deleteUserFriendList", deleteUserFriendListStub);
                deleteUser.__set__("deleteUserChallenges", deleteUserChallengesStub);
                deleteUser.__set__("removeUserFromLeagues", removeUserFromLeaguesStub);
                deleteUser.__set__("deleteImage", deleteImageStub);
                deleteUserFromDatabase = deleteUser.__get__("deleteUserFromDatabase");
            });

            it("deleteUserFromDatabase() runs successfully", async function() {
                await deleteUserFromDatabase(req, res, next);
                expect(deleteOneStub).to.have.been.calledWith({ username: username });
                expect(deleteManyStub).to.have.been.calledWith({ username: username });
                expect(deleteImageStub).to.have.been.calledWith(username.replace('#', '_'), 'profilePictures');
                expect(removeUserFromLeaguesStub).to.have.been.calledWith(username);
                expect(deleteUserFriendListStub).to.have.been.calledWith(username);
                expect(deleteUserChallengesStub).to.have.been.calledWith(username);
            });

            it("deleteUserFromDatabase() returns 500 when deleteOne() rejects", async function() {
                deleteOneStub.rejects();
                try {
                    await deleteUserFromDatabase(req, res, next);
                } catch {}
                expect(deleteOneStub).to.have.been.calledWith({ username: username });
                expect(deleteManyStub).to.have.been.calledWith({ username: username });
                expect(deleteImageStub).to.have.been.calledWith(username.replace('#', '_'), 'profilePictures');
                expect(removeUserFromLeaguesStub).to.have.been.calledWith(username);
                expect(deleteUserFriendListStub).to.have.been.calledWith(username);
                expect(deleteUserChallengesStub).to.have.been.calledWith(username);
                expect(res.status).to.equal(500);
                expect(JSON.parse(res.data)).to.deep.equal("Could not finish deleting profile.");
            });

            it("deleteUserFromDatabase() returns 500 when deleteMany() rejects", async function() {
                deleteManyStub.rejects();
                try {
                    await deleteUserFromDatabase(req, res, next);
                } catch {}
                expect(deleteOneStub).to.have.been.calledWith({ username: username });
                expect(deleteManyStub).to.have.been.calledWith({ username: username });
                expect(deleteImageStub).to.have.been.calledWith(username.replace('#', '_'), 'profilePictures');
                expect(removeUserFromLeaguesStub).to.have.been.calledWith(username);
                expect(deleteUserFriendListStub).to.have.been.calledWith(username);
                expect(deleteUserChallengesStub).to.have.been.calledWith(username);
                expect(res.status).to.equal(500);
                expect(JSON.parse(res.data)).to.deep.equal("Could not finish deleting profile.");
            });

            it("deleteUserFromDatabase() returns 500 when removeUserFromLeagues() rejects", async function() {
                removeUserFromLeaguesStub.rejects();
                try {
                    await deleteUserFromDatabase(req, res, next);
                } catch {}
                expect(deleteOneStub).to.have.been.calledWith({ username: username });
                expect(deleteManyStub).to.have.been.calledWith({ username: username });
                expect(deleteImageStub).to.have.been.calledWith(username.replace('#', '_'), 'profilePictures');
                expect(removeUserFromLeaguesStub).to.have.been.calledWith(username);
                expect(deleteUserFriendListStub).to.have.been.calledWith(username);
                expect(deleteUserChallengesStub).to.have.been.calledWith(username);
                expect(res.status).to.equal(500);
                expect(JSON.parse(res.data)).to.deep.equal("Could not finish deleting profile.");
            });

            it("deleteUserFromDatabase() returns 500 when deleteUserFriendList() rejects", async function() {
                deleteUserFriendListStub.rejects();
                try {
                    await deleteUserFromDatabase(req, res, next);
                } catch {}
                expect(deleteOneStub).to.have.been.calledWith({ username: username });
                expect(deleteManyStub).to.have.been.calledWith({ username: username });
                expect(deleteImageStub).to.have.been.calledWith(username.replace('#', '_'), 'profilePictures');
                expect(removeUserFromLeaguesStub).to.have.been.calledWith(username);
                expect(deleteUserFriendListStub).to.have.been.calledWith(username);
                expect(deleteUserChallengesStub).to.have.been.calledWith(username);
                expect(res.status).to.equal(500);
                expect(JSON.parse(res.data)).to.deep.equal("Could not finish deleting profile.");
            });

            it("deleteUserFromDatabase() returns 500 when deleteUserChallenges() rejects", async function() {
                deleteUserChallengesStub.rejects();
                try {
                    await deleteUserFromDatabase(req, res, next);
                } catch {}
                expect(deleteOneStub).to.have.been.calledWith({ username: username });
                expect(deleteManyStub).to.have.been.calledWith({ username: username });
                expect(deleteImageStub).to.have.been.calledWith(username.replace('#', '_'), 'profilePictures');
                expect(removeUserFromLeaguesStub).to.have.been.calledWith(username);
                expect(deleteUserFriendListStub).to.have.been.calledWith(username);
                expect(deleteUserChallengesStub).to.have.been.calledWith(username);
                expect(res.status).to.equal(500);
                expect(JSON.parse(res.data)).to.deep.equal("Could not finish deleting profile.");
            });

            it("deleteUserFromDatabase() returns 500 when deleteImage() rejects", async function() {
                deleteImageStub.rejects();
                try {
                    await deleteUserFromDatabase(req, res, next);
                } catch {}
                expect(deleteOneStub).to.have.been.calledWith({ username: username });
                expect(deleteManyStub).to.have.been.calledWith({ username: username });
                expect(deleteImageStub).to.have.been.calledWith(username.replace('#', '_'), 'profilePictures');
                expect(removeUserFromLeaguesStub).to.have.been.calledWith(username);
                expect(deleteUserFriendListStub).to.have.been.calledWith(username);
                expect(deleteUserChallengesStub).to.have.been.calledWith(username);
                expect(res.status).to.equal(500);
                expect(JSON.parse(res.data)).to.deep.equal("Could not finish deleting profile.");
            });


        });
    });
});