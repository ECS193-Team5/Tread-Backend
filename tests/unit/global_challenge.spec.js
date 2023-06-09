const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();
const mongoose = require("mongoose");
const Global_challenge_progress = require("../../models/global_challenge_progress.model");
const Global_challenge = require("../../models/global_challenge.model");


describe("Testing global_challenge", () =>{
    let globalChallenge;

    beforeEach(() => {
        globalChallenge = rewire("../../routes/global_challenge.js");
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("Testing getListOfIDsFromChallenges()", async function(){
        let challenges;
        let getListOfIDsFromChallenges;

        beforeEach(() => {
            getListOfIDsFromChallenges = globalChallenge.__get__("getListOfIDsFromChallenges");
        })
        it("getListOfIDsFromChallenges() should return a list of IDs", () => {
            challenges = [
                {username: "username", _id: "id"},
                {username: "username2", _id: "id2"},
                {username: "username3", _id: "id3"}
            ];

            const IDList = getListOfIDsFromChallenges(challenges);
            expect(IDList).to.deep.equal(["id", "id2", "id3"]);
        });
        it("getListOfIDsFromChallenges() should return a empty list", () => {
            challenges = [];

            const IDList = getListOfIDsFromChallenges(challenges);
            expect(IDList).to.deep.equal([]);
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

        describe("Testing addChallenge()", () => {
            let saveStub;
            let addChallenge;

            beforeEach(() => {
                req.body.unit = "m";
                req.body.amount = "100";
                req.body.exerciseName = "running";
                req.body.issueDate = "1685516400000";
                req.body.dueDate = "1686812400000";
                saveStub = sandbox.stub(mongoose.Model.prototype, "save");
                addChallenge = globalChallenge.__get__("addChallenge");
            });

            it("addChallenge() returns successfully", async function() {
                saveStub.resolves();
                await addChallenge(req, res);
                expect(res.status).to.equal(200);
            });

            it("addChallenge() sends 500 when save() rejects", async function(){
                saveStub.rejects('Error');
                await addChallenge(req, res);
                expect(res.status).to.equal(500);
                expect(JSON.parse(res.data)).to.deep.equal("Error: Error");
            });
        });

        describe("Testing getGlobalChallengesAndInsertIfDoesntExist()", () => {
            let getGlobalChallengesAndInsertIfDoesntExist;
            let getListOfIDsFromChallengesStub;
            let globalChallengeProgressFindStub;
            let globalChallengeFindStub;
            let globalChallengeProgressLeanStub;
            let distinctStub;
            let dateStub;
            let insertManyStub;
            const IDs = [
                new mongoose.Types.ObjectId(),
                new mongoose.Types.ObjectId(),
                new mongoose.Types.ObjectId()
            ]
            const leanStubResult = [
                {
                    username: "username", _id: IDs[0],
                    exercise: {exerciseName: "exerciseName1"},
                    dueDate: "1686812400000",
                    issueDate: "1685516400000"
                },
                {
                    username: "username2", _id: IDs[1],
                    exercise: {exerciseName: "exerciseName2"},
                    dueDate: "1686812400000",
                    issueDate: "1685516400000"
                },
                {
                    username: "username3", _id: IDs[2],
                    exercise: {exerciseName: "exerciseName3"},
                    dueDate: "1686812400000",
                    issueDate: "1685516400000"
                }
            ];
            const distinctStubResult = [
                IDs[0],
                IDs[1],
                IDs[2]
            ];
            let distinctLeanStub;
            let globalChallengeFindLeanStub;

            beforeEach(() => {
                getGlobalChallengesAndInsertIfDoesntExist = globalChallenge.__get__("getGlobalChallengesAndInsertIfDoesntExist");
                distinctLeanStub = sandbox.stub();
                distinctStub = sandbox.stub().returns({lean: distinctLeanStub});
                globalChallengeProgressLeanStub = sandbox.stub();
                globalChallengeFindLeanStub = sandbox.stub();
                globalChallengeProgressFindStub = sandbox.stub(Global_challenge_progress, "find").returns({
                    distinct: distinctStub,
                    lean: globalChallengeProgressLeanStub
                });
                globalChallengeFindStub = sandbox.stub(Global_challenge, "find").returns({
                    lean: globalChallengeFindLeanStub
                });
                req.session.username = "username";
                dateStub = sandbox.stub(Date, "now").returns(1685921422705);
                getListOfIDsFromChallengesStub = sandbox.stub();
                globalChallenge.__set__("getListOfIDsFromChallenges", getListOfIDsFromChallengesStub);
                insertManyStub = sandbox.stub(mongoose.Model, "insertMany");
            });

            it("getGlobalChallengesAndInsertIfDoesntExist() returns successfully when no insert needed", async function() {
                globalChallengeProgressLeanStub.resolves("result");
                globalChallengeFindLeanStub.resolves(leanStubResult);
                distinctLeanStub.resolves(distinctStubResult);
                await getGlobalChallengesAndInsertIfDoesntExist(req, res);
                expect(res.status).to.equal(200);
                expect(JSON.parse(res.data)).to.deep.equal("result");
            });

            it("getGlobalChallengesAndInsertIfDoesntExist() returns successfully when insert needed", async function() {
                insertManyStub.resolves();
                globalChallengeFindLeanStub.resolves(leanStubResult);
                distinctLeanStub.resolves(["id1", "id2"]);
                globalChallengeProgressLeanStub.resolves("result");
                await getGlobalChallengesAndInsertIfDoesntExist(req, res);
                expect(res.status).to.equal(200);
                expect(JSON.parse(res.data)).to.deep.equal("result");
            });

            it("getGlobalChallengesAndInsertIfDoesntExist() to throw when find currentglobalchallenge throws", async function() {
                insertManyStub.resolves();
                globalChallengeFindLeanStub.rejects(leanStubResult);
                distinctLeanStub.resolves(["id1", "id2"]);
                globalChallengeProgressLeanStub.resolves("result");
                try {
                await getGlobalChallengesAndInsertIfDoesntExist(req, res);
                } catch{}
                expect(globalChallengeFindLeanStub).to.have.thrown;
            });
            it("getGlobalChallengesAndInsertIfDoesntExist() to throw when find insertMany throws", async function() {
                insertManyStub.rejects();
                globalChallengeFindLeanStub.resolves(leanStubResult);
                distinctLeanStub.resolves(["id1", "id2"]);
                globalChallengeProgressLeanStub.resolves("result");
                try {
                await getGlobalChallengesAndInsertIfDoesntExist(req, res);
                } catch{}
                expect(insertManyStub).to.have.thrown;
            });

            it("getGlobalChallengesAndInsertIfDoesntExist() to throw when distinctLeanStub() throws", async function() {
                insertManyStub.resolves();
                globalChallengeFindLeanStub.resolves(leanStubResult);
                distinctLeanStub.rejects(["id1", "id2"]);
                globalChallengeProgressLeanStub.resolves("result");
                try {
                await getGlobalChallengesAndInsertIfDoesntExist(req, res);
                } catch{}
                expect(distinctLeanStub).to.have.thrown;
            });

            it("getGlobalChallengesAndInsertIfDoesntExist() to throw when globalProgressLeanStub() throws", async function() {
                insertManyStub.resolves();
                globalChallengeFindLeanStub.resolves(leanStubResult);
                distinctLeanStub.resolves(["id1", "id2"]);
                globalChallengeProgressLeanStub.rejects("result");
                try {
                await getGlobalChallengesAndInsertIfDoesntExist(req, res);
                } catch{}
                expect(globalChallengeFindLeanStub).to.have.thrown;
            });
        });

        describe("Testing getLeaderboard()", () => {
            let getLeaderboard;
            let findStub;
            let sortStub;
            let limitStub;
            let leanStub;
            let findOneStub;
            const leanStubResult = {
                username: "username",
                displayName: "displayName",
                progress: 20
            }

            beforeEach(() => {
                getLeaderboard = globalChallenge.__get__("getLeaderboard");
                leanStub = sandbox.stub();
                limitStub = sandbox.stub().returns({lean: leanStub});
                sortStub = sandbox.stub().returns({limit: limitStub});
                findStub = sandbox.stub(mongoose.Model, "find").returns({
                    sort: sortStub,
                });
                findOneStub = sandbox.stub(mongoose.Model, "findOne").returns({
                    lean: leanStub
                });
                req.session.username = "username";
                req.body.challengeID = "challengeID";
            });

            it("getLeaderboard() returns successfully", async function() {
                leanStub.resolves(leanStubResult);
                await getLeaderboard(req, res);
                expect(findStub).to.have.been.calledWith({
                    challengeID: req.body.challengeID
                },{
                    username: 1, displayName: 1, progress:1
                });
                expect(findOneStub).to.have.been.calledWith({
                    challengeID: req.body.challengeID,
                    username: req.session.username
                },{
                    username: 1, displayName: 1, progress:1
                });
                expect(res.status).to.equal(200);
                expect(JSON.parse(res.data)).to.deep.equal([leanStubResult, leanStubResult]);
            });

            it("getLeaderboard() throws when leanStub() rejects", async function() {
                leanStub.rejects(leanStubResult);
                try {
                    await getLeaderboard(req, res);
                } catch {}
                expect(leanStub).to.have.thrown;
            });
        });
    });

});