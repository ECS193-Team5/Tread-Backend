const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();
const mongoose = require("mongoose");
const { uploadImage, deleteImage } = require("../../routes/cloudinary");

describe("Testing league", () =>{
    let leagueFile;

    beforeEach(() => {
        leagueFile = rewire("../../routes/league.js");
    });

    afterEach(() => {
        sandbox.restore();
    })

    describe("Testing createLeagueDocument()", () => {
        let saveStub;
        let createLeagueDocument;
        const leagueDoc = {
            owner: "owner#4444",
            leagueName:"exampleName",
            leagueType:"exampleType",
            leagueDescription:"exampleDescription"
        }

        beforeEach(() => {
            saveStub = sandbox.stub(mongoose.Model.prototype, "save");
            createLeagueDocument = leagueFile.__get__("createLeagueDocument");
        });

        it("createUser() runs successfully", async function(){
            await createLeagueDocument(leagueDoc);
            expect(saveStub).to.have.been.called;
        });

        it("createUser() throws if save fails.", async function(){
            saveStub.rejects();
            try {
                await createLeagueDocument(leagueDoc);
            } catch {}
            expect(saveStub).to.have.thrown;
        });
    });

    describe("Testing deleteLeagueAndInformation", () => {
        let deleteLeagueAndInformation;
        let distinctStub;
        let findStub;
        let deleteOneStub;
        let deleteManyStub;
        let deleteImageStub;
        let leagueID;
        let username;
        let leanStub;

        beforeEach(() => {
            distinctStub = sandbox.stub().resolves([]);
            leanStub = sandbox.stub().resolves("")
            findStub = sandbox.stub(mongoose.Model, "find").returns({distinct:distinctStub});
            deleteOneStub = sandbox.stub(mongoose.Model, "deleteOne").returns({lean:leanStub});
            deleteManyStub = sandbox.stub(mongoose.Model, "deleteMany").returns({lean:leanStub});;
            deleteImageStub = sandbox.stub()
            leagueFile.__set__("deleteImage", deleteImageStub);
            leagueID = 44;
            username = "Example#4444";
            deleteLeagueAndInformation = leagueFile.__get__("deleteLeagueAndInformation");
        });

        it("deleteLeagueAndInformation() runs successfully", async function(){
            await deleteLeagueAndInformation(username, leagueID);
            expect(findStub).to.have.been.called;
            expect(deleteOneStub).to.have.been.called;
            expect(deleteManyStub).to.have.been.called;
            expect(leanStub).to.have.been.calledTwice;
            expect(deleteImageStub).to.have.been.called;
        });

        it("deleteLeagueAndInformation() throws if it fails", async function(){
            deleteOneStub.rejects();
            try {
                await deleteLeagueAndInformation(leagueDoc);
            } catch {}
            expect(deleteOneStub).to.have.thrown;
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

        describe("Test createLeague", () => {
            let createLeagueDocumentStub;
            let uploadImageStub;
            let createLeague;

            beforeEach(() => {
                req.session.username = "user";
                req.body.leagueName = "ExampleLeagueName";
                req.body.leagueType = "private";
                req.body.leagueDescription = "exampleDescription";
                req.body.leaguePicture = "i.png"
                createLeagueDocumentStub = sandbox.stub();
                uploadImageStub = sandbox.stub();
                leagueFile.__set__("uploadImage", uploadImageStub);
                leagueFile.__set__("createLeagueDocument", createLeagueDocumentStub);
                createLeague = leagueFile.__get__("createLeague");
            });

            it("Test createLeagueDocument Succeeds", async () => {
                const returnDocument = {"_id":"4"}
                createLeagueDocumentStub.resolves(returnDocument);
                await createLeague(req, res, next);
                expect(createLeagueDocumentStub).to.have.been.calledWith(
                    {owner:"user", leagueName:"ExampleLeagueName", leagueType:"private", leagueDescription:"exampleDescription"}
                )
                expect(uploadImageStub).to.have.been.calledWith(
                    "i.png", "leaguePicture", "4"
                )
                expect(res.status).to.equal(200);
            });

            it("Test createLeagueDocument Fails", async () => {
                createLeagueDocumentStub.rejects();
                await createLeague(req, res, next);
                expect(createLeagueDocumentStub).to.have.been.calledWith(
                    {owner:"user", leagueName:"ExampleLeagueName", leagueType:"private", leagueDescription:"exampleDescription"}
                )
                expect(uploadImageStub).to.not.have.been.called;
                expect(res.status).to.equal(500);
                expect(res.data).to.equal(JSON.stringify("Server error or name invalid"));
            });

        });

        describe("Test deleteLeagueIfPossible", () => {
            let deleteLeagueAndInformationStub;
            let deleteLeagueIfPossible;

            beforeEach(() => {
                req.session.username = "user";
                req.body.leagueID = "4"
                deleteLeagueAndInformationStub = sandbox.stub();
                leagueFile.__set__("deleteLeagueAndInformation", deleteLeagueAndInformationStub);
                deleteLeagueIfPossible = leagueFile.__get__("deleteLeagueIfPossible");
            });

            it("Test deleteLeagueAndInformation Succeeds", async () => {
                await deleteLeagueIfPossible(req, res, next);
                expect(deleteLeagueAndInformationStub).to.have.been.calledWith(
                    "user", "4"
                )
                expect(res.status).to.equal(200);
            });

            it("Test createLeagueDocument Fails", async () => {
                deleteLeagueAndInformationStub.rejects();
                await deleteLeagueIfPossible(req, res, next);
                expect(deleteLeagueAndInformationStub).to.have.been.calledWith(
                    "user", "4"
                )
                expect(res.status).to.equal(400);
            });

        });

        describe("Test updateLeague", () => {
            let updateOneStub;
            let updateLeague;
            let leanStub;

            beforeEach(() => {
                res.locals.filter = "filter";
                res.locals.updates = "updates";
                leanStub = sandbox.stub()
                updateOneStub = sandbox.stub(mongoose.Model, "updateOne").returns({lean:leanStub});;
                updateLeague = leagueFile.__get__("updateLeague");
            });

            it("Test updateLeague Succeeds", async () => {
                await updateLeague(req, res, next);
                expect(updateOneStub).to.have.been.calledWith(
                    "filter", "updates"
                )
                expect(updateOneStub).to.have.been.called;
                expect(leanStub).to.have.been.called;
                expect(res.status).to.equal(200);
            });

            it("Test updateLeague Fails", async () => {
                try {
                    await updateLeague(req,res,next);
                } catch {}
                expect(updateOneStub).to.have.thrown;
            });

        });

        // STILL DOING
        describe("Test checkLeagueID", () => {
            let checkLeagueID;

            beforeEach(() => {
                checkLeagueID = leagueFile.__get__("checkLeagueID");
            });

            it("Test updateLeague receives a league ID", async () => {
                await updateLeague(req, res, next);
                expect(updateOneStub).to.have.been.calledWith(
                    "filter", "updates"
                )
                expect(updateOneStub).to.have.been.called;
                expect(leanStub).to.have.been.called;
                expect(res.status).to.equal(200);
            });

            it("Test checkLeagueID does not receive a leagueID", async () => {
                try {
                    await updateLeague(req,res,next);
                } catch {}
                expect(updateOneStub).to.have.thrown;
            });

        });
    });
});