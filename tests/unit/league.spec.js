const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();
const mongoose = require("mongoose");
const { uploadImage, deleteImage } = require("../../routes/cloudinary");
const Exercise_log = require("../../models/exercise_log.model");
const League = require("../../models/league.model");
const Challenge = require("../../models/challenge.model");
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

    describe("Test notifyMember", () =>{
        let notifyMember;
        let sendNotificationToUsersStub;

        beforeEach(() => {
            sendNotificationToUsersStub = sandbox.stub()
            leagueFile.__set__("sendNotificationToUsers", sendNotificationToUsersStub);
            notifyMember = leagueFile.__get__("notifyMember");
        });

        it("notifyMember() runs successfully", async function(){
            let actionMessage = "actionMessage";
            let exampleMember = "exampleMember";
            let leagueID = "leagueID";
            await notifyMember(exampleMember, actionMessage,leagueID);
            expect(sendNotificationToUsersStub).to.be.calledWith([exampleMember], actionMessage, "leagueMemberPage?="+leagueID);
        });
    })

    describe("Test findLeaguesWhere", () =>{
        let findLeaguesWhere;
        let findStub;
        let leanStub;

        beforeEach(() => {
            leanStub = sandbox.stub().resolves("me");
            findStub = sandbox.stub(mongoose.Model, "find").returns({lean:leanStub});
            findLeaguesWhere = leagueFile.__get__("findLeaguesWhere");
        });

        it("findLeaguesWhere() runs successfully", async function(){
            let val = await findLeaguesWhere({});
            expect(val).to.equal("me")
        });
    })

    describe("Test getChallengeCount", () =>{
        let getChallengeCount;
        let countDocumentsStub;

        beforeEach(() => {
            countDocumentsStub = sandbox.stub(mongoose.Model, "countDocuments").resolves("val");
            getChallengeCount = leagueFile.__get__("getChallengeCount");
        });

        it("getChallengeCount() runs successfully", async function(){
            let val = await getChallengeCount({});
            expect(val).to.equal("val")
            expect(countDocumentsStub).to.be.called;
        });
    })

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
                },
                send(x){
                    this.data = JSON.stringify(x);
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

        describe("Test checkLeagueID", () => {
            let checkLeagueID;

            beforeEach(() => {
                checkLeagueID = leagueFile.__get__("checkLeagueID");
            });

            it("Test updateLeague receives a league ID", async () => {
                req.body.leagueID = "league";
                await checkLeagueID(req, res, next);
                expect(next).to.have.been.called;
            });

            it("Test checkLeagueID does not receive a leagueID", async () => {
                req.body.leaugeID = null;
                await checkLeagueID(req, res, next);
                expect(res.status).to.equal(400);
            });

        });

        describe("Test setUpAddUserToAdmin", () => {
            let setUpAddUserToAdmin;
            let notificationsStub;

            beforeEach(() => {
                setUpAddUserToAdmin = leagueFile.__get__("setUpAddUserToAdmin");
                notificationsStub = sandbox.stub()

                leagueFile.__set__("notifyMember", notificationsStub);
                req.body.recipient = "recipient#0000";
                req.body.leagueName = "leagueExampleName";
                req.body.leagueID = "63fb66a1971b753d7edf9c48";
                req.session.username = "user#0000";
            });

            it("Test setUpUserAdmin succesful", async () => {
                await setUpAddUserToAdmin(req, res, next);
                expect(notificationsStub).to.have.been.calledWith(req.body.recipient,
                     "You have been elevated to the admin team in "+req.body.leagueName,
                     req.body.leagueID)

                expect(next).to.have.been.called;
                let newFilter = res.locals.filter;
                delete newFilter["_id"];
                expect(newFilter).to.deep.equal({
                    admin: "user#0000",
                    members: "recipient#0000"
                })

                expect(res.locals.updates).to.deep.equal({
                    $addToSet:{admin:"recipient#0000"}
                })
            });
        });

        describe("Test setUpRemoveUserFromAdmin", () => {
            let setUpRemoveUserFromAdmin;
            let notificationsStub;

            beforeEach(() => {
                setUpRemoveUserFromAdmin = leagueFile.__get__("setUpRemoveUserFromAdmin");
                notificationsStub = sandbox.stub()
                leagueFile.__set__("notifyMember", notificationsStub);
                req.body.recipient = "recipient#0000";
                req.body.leagueName = "leagueExampleName";
                req.body.leagueID = "63fb66a1971b753d7edf9c48";
                req.session.username = "user#0000";
            });

            it("Test setUpRemoveUserFromAdmin succesful", async () => {
                await setUpRemoveUserFromAdmin(req, res, next);
                expect(notificationsStub).to.have.been.calledWith(req.body.recipient,
                     "You have been removed from the admin team in "+req.body.leagueName,
                     req.body.leagueID)
                expect(next).to.have.been.called;
                let newFilter = res.locals.filter;
                delete newFilter["_id"];
                expect(newFilter).to.deep.equal({
                    admin: "user#0000",
                    owner: { '$ne': "recipient#0000" }
                })

                expect(res.locals.updates).to.deep.equal({
                    $pull:{admin:"recipient#0000"}
                })
            });
        });

        describe("Test setUpRemoveSelfFromAdmin", () => {
            let setUpRemoveSelfFromAdmin;

            beforeEach(() => {
                setUpRemoveSelfFromAdmin = leagueFile.__get__("setUpRemoveSelfFromAdmin");
                req.session.username = "user#0000";
                req.body.recipient = "recipient#0000";
                req.body.leagueName = "leagueExampleName";
                req.body.leagueID = "63fb66a1971b753d7edf9c48";
            });

            it("Test setUpRemoveSelfFromAdmin succesful", async () => {
                await setUpRemoveSelfFromAdmin(req, res, next);
                expect(next).to.have.been.called;
                let newFilter = res.locals.filter;
                delete newFilter["_id"];
                expect(newFilter).to.deep.equal({
                    admin: "user#0000",
                    owner: { '$ne': "user#0000" }
                })

                expect(res.locals.updates).to.deep.equal({
                    $pull:{admin:"user#0000"}
                })
            });
        });

        describe("Test verifyRecipientUserExists", () => {
            let verifyRecipientUserExists;
            let isExistingUserStub;
            let userFile;

            beforeEach(() => {
                verifyRecipientUserExists = leagueFile.__get__("verifyRecipientUserExists");
                isExistingUserStub = sandbox.stub()
                userFile = rewire("../../routes/user");
                leagueFile.__set__("isExistingUser", isExistingUserStub);
                req.body.recipient = "recipient#0000";
            });

            it("Test user does exist", async () => {
                isExistingUserStub.resolves(true);
                await verifyRecipientUserExists(req, res, next);
                expect(next).to.be.called;
            });

            it("Test user does not exist", async () => {
                isExistingUserStub.resolves(false);
                await verifyRecipientUserExists(req, res, next);
                expect(next).not.to.be.called;
                expect(res.status).to.equal(400);
            });
        });

        describe("Test setUpKickMember", () => {
            let setUpKickMember;
            let notificationsStub;

            beforeEach(() => {
                setUpKickMember = leagueFile.__get__("setUpKickMember");
                notificationsStub = sandbox.stub()
                leagueFile.__set__("notifyMember", notificationsStub);
                req.session.username = "user#0000";
                req.body.recipient = "recipient#0000";
                req.body.leagueName = "leagueExampleName";
                req.body.leagueID = "63fb66a1971b753d7edf9c48";
            });

            it("Test setUpKickMember succesful", async () => {
                await setUpKickMember(req, res, next);
                expect(next).to.have.been.called;
                let newFilter = res.locals.filter;
                delete newFilter["_id"];

                expect(notificationsStub).to.have.been.calledWith(req.body.recipient,
                    "You have been kicked out of "+req.body.leagueName,
                    req.body.leagueID)
                expect(next).to.have.been.called;

                expect(newFilter).to.deep.equal({
                    admin: "user#0000",
                    members: "recipient#0000",
                    owner: { '$ne': "recipient#0000" }
                })

                expect(res.locals.updates).to.deep.equal({
                    $pull:{members:"recipient#0000", admin:"recipient#0000"}
                })
            });
        });

        describe("Test setUpLeaveLeague", () => {
            let setUpLeaveLeague;

            beforeEach(() => {
                setUpLeaveLeague = leagueFile.__get__("setUpLeaveLeague");
                req.session.username = "user#0000";
                req.body.recipient = "recipient#0000";
                req.body.leagueName = "leagueExampleName";
                req.body.leagueID = "63fb66a1971b753d7edf9c48";
            });

            it("Test setUpLeaveLeague succesful", async () => {
                await setUpLeaveLeague(req, res, next);
                expect(next).to.have.been.called;
                let newFilter = res.locals.filter;
                delete newFilter["_id"];

                expect(next).to.have.been.called;

                expect(newFilter).to.deep.equal({
                    members: "user#0000",
                    owner: { '$ne': "user#0000" }
                })

                expect(res.locals.updates).to.deep.equal({
                    $pull:{members:"user#0000", admin:"user#0000"}
                })
            });
        });

        describe("Test setUpInviteUserToLeague", () => {
            let setUpInviteUserToLeague;
            let updateOneStub;
            let notificationsStub;

            beforeEach(() => {
                setUpInviteUserToLeague = leagueFile.__get__("setUpInviteUserToLeague");
                req.session.username = "user#0000";
                req.body.recipient = "recipient#0000";
                req.body.leagueID = "63fb66a1971b753d7edf9c48";
                updateOneStub = sandbox.stub(mongoose.Model, "updateOne");
                notificationsStub = sandbox.stub()
                leagueFile.__set__("notifyMember", notificationsStub);
                req.body.recipient = "recipient#0000";

            });

            it("Test setUpInviteUserToLeague with one match", async () => {
                updateOneStub.resolves({matchedCount:1});
                await setUpInviteUserToLeague(req, res, next);
                expect(notificationsStub).to.be.calledWith("recipient#0000", "user#0000 accepted your league join request.","63fb66a1971b753d7edf9c48")
                expect(res.status).to.equal(200);
                expect(next).not.to.be.called;
            });

            it("Test setUpInviteUserToLeague with no matches", async () => {
                updateOneStub.resolves({matchedCount:0});
                await setUpInviteUserToLeague(req, res, next);
                expect(notificationsStub).to.be.calledWith("recipient#0000", "user#0000 invited you to a league.", "63fb66a1971b753d7edf9c48");
                expect(next).to.be.called;
            });
        });

        describe("Test setUpUserRequestToJoin", () => {
            let setUpUserRequestToJoin;
            let updateOneStub;
            let findOneStub;
            let notificationsStub;

            beforeEach(() => {
                setUpUserRequestToJoin = leagueFile.__get__("setUpUserRequestToJoin");
                req.session.username = "user#0000";
                req.body.recipient = "recipient#0000";
                req.body.leagueID = "63fb66a1971b753d7edf9c48";
                updateOneStub = sandbox.stub(mongoose.Model, "updateOne");
                findOneStub = sandbox.stub(mongoose.Model, "findOne");
                notificationsStub = sandbox.stub()
                leagueFile.__set__("notifyMember", notificationsStub);
                req.body.recipient = "recipient#0000";

            });

            it("Test setUpUserRequestToJoin with one match", async () => {
                updateOneStub.resolves({matchedCount:1});
                await setUpUserRequestToJoin(req, res, next);
                expect(res.status).to.equal(200);
                expect(next).not.to.be.called;
            });

            it("Test setUpUserRequestToJoin with no matches and public league", async () => {
                updateOneStub.resolves({matchedCount:0});
                findOneStub.resolves({leagueType:"public"});
                await setUpUserRequestToJoin(req, res, next);
                expect(next).to.be.called;
                delete res.locals.filter._id;
                expect(res.locals).to.deep.equal(
                    {
                        updates: { '$addToSet': { members: req.session.username } },
                        filter: {
                          members: { '$ne': req.session.username },
                          bannedUsers: { '$ne': req.session.username }
                        }
                    }
                )
            });

            it("Test setUpUserRequestToJoin with no matches and private league", async () => {
                updateOneStub.resolves({matchedCount:0});
                findOneStub.resolves({leagueType:"private"});
                await setUpUserRequestToJoin(req, res, next);
                expect(next).to.be.called;
                delete res.locals.filter._id;
                expect(res.locals).to.deep.equal(
                    {
                        updates: { '$addToSet': { pendingRequests: req.session.username } },
                        filter: {
                          members: { '$ne': req.session.username },
                          bannedUsers: { '$ne': req.session.username }
                        }
                    }
                )
            });

            it("Test setUpUserRequestToJoin fails", async () => {
                findOneStub.throws();
                await setUpUserRequestToJoin(req, res, next);
                expect(res.status).to.equal(500);
            });
        });

        describe("Test setUpUserAcceptInvite", () => {
            let setUpUserAcceptInvite;

            beforeEach(() => {
                setUpUserAcceptInvite = leagueFile.__get__("setUpUserAcceptInvite");
                req.session.username = "user#0000";
                req.body.leagueID = "63fb66a1971b753d7edf9c48";

            });

            it("Test setUpUserAcceptInvite succeeds", async () => {
                await setUpUserAcceptInvite(req, res, next);
                expect(next).to.be.called;
                delete res.locals.filter._id;
                expect(res.locals).to.deep.equal(
                    {
                        filter: { sentRequests: req.session.username },
                        updates: {
                          '$addToSet': { members: req.session.username },
                          '$pull': { sentRequests: req.session.username }
                        }
                    }
                )
            });
        });

        describe("Test setUpUserDeclineInvite", () => {
            let setUpUserDeclineInvite;

            beforeEach(() => {
                setUpUserDeclineInvite = leagueFile.__get__("setUpUserDeclineInvite");
                req.session.username = "user#0000";
                req.body.leagueID = "63fb66a1971b753d7edf9c48";

            });

            it("Test setUpUserDeclineInvite succeeds", async () => {
                await setUpUserDeclineInvite(req, res, next);
                expect(next).to.be.called;
                delete res.locals.filter._id;
                expect(res.locals).to.deep.equal(
                    {
                        filter: { sentRequests: req.session.username },
                        updates: {
                          '$pull': { sentRequests: req.session.username }
                        }
                    }
                )
            });
        });

        describe("Test setUpUserUndoRequest", () => {
            let setUpUserUndoRequest;

            beforeEach(() => {
                setUpUserUndoRequest = leagueFile.__get__("setUpUserUndoRequest");
                req.session.username = "user#0000";
                req.body.leagueID = "63fb66a1971b753d7edf9c48";

            });

            it("Test setUpUserUndoRequest succeeds", async () => {
                await setUpUserUndoRequest(req, res, next);
                expect(next).to.be.called;
                delete res.locals.filter._id;
                expect(res.locals).to.deep.equal(
                    {
                        filter: { pendingRequests: req.session.username },
                        updates: {
                          '$pull': { pendingRequests: req.session.username }
                        }
                    }
                )
            });
        });

        describe("Test setUpAcceptJoinRequest", () => {
            let setUpAcceptJoinRequest;
            let notificationsStub;

            beforeEach(() => {
                setUpAcceptJoinRequest = leagueFile.__get__("setUpAcceptJoinRequest");
                notificationsStub = sandbox.stub()

                leagueFile.__set__("notifyMember", notificationsStub);
                req.body.recipient = "recipient#0000";
                req.body.leagueID = "63fb66a1971b753d7edf9c48";
                req.session.username = "user#0000";
            });

            it("Test setUpAcceptJoinRequest succesful", async () => {
                await setUpAcceptJoinRequest(req, res, next);
                expect(notificationsStub).to.have.been.calledWith(req.body.recipient,
                     req.session.username + " accepted your league join request.",
                     req.body.leagueID)

                expect(next).to.have.been.called;
                let newFilter = res.locals.filter;
                delete newFilter["_id"];
                expect(newFilter).to.deep.equal({
                    admin: "user#0000",
                    pendingRequests: "recipient#0000"
                })

                expect(res.locals.updates).to.deep.equal({
                    $addToSet:{members:"recipient#0000"},
                    $pull: { pendingRequests: "recipient#0000"}
                })
            });
        });

        describe("Test setUpDeclineRequest", () => {
            let setUpDeclineRequest;

            beforeEach(() => {
                setUpDeclineRequest = leagueFile.__get__("setUpDeclineRequest");
                req.session.username = "user#0000";
                req.body.recipient = "recipient#0000";
                req.body.leagueID = "63fb66a1971b753d7edf9c48";
            });

            it("Test setUpDeclineRequest succeeds", async () => {
                await setUpDeclineRequest(req, res, next);
                expect(next).to.be.called;
                delete res.locals.filter._id;
                expect(res.locals).to.deep.equal(
                    {
                        filter: {
                            admin: req.session.username,
                            pendingRequests: "recipient#0000"
                        },
                        updates: {
                          '$pull': { pendingRequests: "recipient#0000" }
                        }
                    }
                )
            });
        });

        describe("Test setUpUndoInvite", () => {
            let setUpUndoInvite;

            beforeEach(() => {
                setUpUndoInvite = leagueFile.__get__("setUpUndoInvite");
                req.session.username = "user#0000";
                req.body.recipient = "recipient#0000";
                req.body.leagueID = "63fb66a1971b753d7edf9c48";
            });

            it("Test setUpUndoInvite succeeds", async () => {
                await setUpUndoInvite(req, res, next);
                expect(next).to.be.called;
                delete res.locals.filter._id;
                expect(res.locals).to.deep.equal(
                    {
                        filter: {
                            admin: req.session.username,
                            sentRequests: "recipient#0000"
                        },
                        updates: {
                          '$pull': { sentRequests: "recipient#0000" }
                        }
                    }
                )
            });
        });

        describe("Test setUpBanUser", () => {
            let setUpBanUser;
            let notificationsStub;

            beforeEach(() => {
                setUpBanUser = leagueFile.__get__("setUpBanUser");
                req.session.username = "user#0000";
                req.body.recipient = "recipient#0000";
                req.body.leagueID = "63fb66a1971b753d7edf9c48";
                req.body.leagueName = "exampleLeague";
                notificationsStub = sandbox.stub()
                leagueFile.__set__("notifyMember", notificationsStub);
            });

            it("Test setUpBanUser with one match", async () => {
                await setUpBanUser(req, res, next);
                expect(notificationsStub).to.be.calledWith("recipient#0000", "You have been banned from exampleLeague","63fb66a1971b753d7edf9c48")
                expect(next).to.be.called;
                delete res.locals.filter._id;
                expect(res.locals).to.deep.equal(
                    {
                        filter: {
                            admin: "user#0000",
                            owner: { $ne: "recipient#0000" }
                        },
                        updates: {
                            $addToSet: { bannedUsers: "recipient#0000" },
                            $pull: {
                                admin: "recipient#0000",
                                pendingRequests: "recipient#0000",
                                members: "recipient#0000"
                            },
                        }
                    }
                )
            });
        });

        describe("Test setUpUnbanUser", () => {
            let setUpUnbanUser;

            beforeEach(() => {
                setUpUnbanUser = leagueFile.__get__("setUpUnbanUser");
                req.session.username = "user#0000";
                req.body.recipient = "recipient#0000";
                req.body.leagueID = "63fb66a1971b753d7edf9c48";
            });

            it("Test setUpUnbanUser succeeds", async () => {
                await setUpUnbanUser(req, res, next);
                expect(next).to.be.called;
                delete res.locals.filter._id;
                expect(res.locals).to.deep.equal(
                    {
                        filter: {
                            admin: req.session.username
                        },
                        updates: {
                          '$pull': { bannedUsers: "recipient#0000" }
                        }
                    }
                )
            });
        });

        describe("Test getAllLeaguesWithChallengeCount", () => {
            let getAllLeaguesWithChallengeCount;
            let findStub;
            let leanStub;

            beforeEach(() => {
                getAllLeaguesWithChallengeCount = leagueFile.__get__("getAllLeaguesWithChallengeCount");
                req.session.username = "user#0000";
                req.body.recipient = "recipient#0000";
                req.body.leagueID = "63fb66a1971b753d7edf9c48";
                leanStub = sandbox.stub().resolves([])
                findStub = sandbox.stub(mongoose.Model, "find").returns({lean:leanStub});
            });

            it("Test getAllLeaguesWithChallengeCount with empty list", async () => {
                await getAllLeaguesWithChallengeCount(req, res, next);
                expect(res.status).to.equal(200);
            });

            it("Test getAllLeaguesWithChallengeCount with example league", async () => {
                let getChallengeCountStub = sandbox.stub().resolves(4);
                leanStub.resolves([{_id:"id"}])
                leagueFile.__set__("getChallengeCount", getChallengeCountStub);
                await getAllLeaguesWithChallengeCount(req, res, next);
                expect(res.status).to.equal(200);
                expect(res.data).to.deep.equal(JSON.stringify([{_id:"id", "activeChallenges":4}]));
            });
        });

        describe("Test filterAllLeagues", () => {
            let filterAllLeagues;

            beforeEach(() => {
                filterAllLeagues = leagueFile.__get__("filterAllLeagues");
                req.session.username = "user#0000";
            });

            it("Test filterAllLeagues", async () => {
                await filterAllLeagues(req, res, next);
                expect(res.locals.filter).to.deep.equal({
                    members:"user#0000"
                });
            });
        });

        describe("Test filterAdminLeagues", () => {
            let filterAdminLeagues;

            beforeEach(() => {
                filterAdminLeagues = leagueFile.__get__("filterAdminLeagues");
                req.session.username = "user#0000";
            });

            it("Test filterAdminLeagues", async () => {
                await filterAdminLeagues(req, res, next);
                expect(res.locals.filter).to.deep.equal({
                    admin:"user#0000"
                });
            });
        });

        describe("Test filterRequestLeagues", () => {
            let filterRequestLeagues;

            beforeEach(() => {
                filterRequestLeagues = leagueFile.__get__("filterRequestLeagues");
                req.session.username = "user#0000";
            });

            it("Test filterRequestLeagues", async () => {
                await filterRequestLeagues(req, res, next);
                expect(res.locals.filter).to.deep.equal({
                    pendingRequests:"user#0000"
                });
            });
        });

        describe("Test filterInviteLeagues", () => {
            let filterInviteLeagues;

            beforeEach(() => {
                filterInviteLeagues = leagueFile.__get__("filterInviteLeagues");
                req.session.username = "user#0000";
            });

            it("Test filterInviteLeagues", async () => {
                await filterInviteLeagues(req, res, next);
                expect(res.locals.filter).to.deep.equal({
                    sentRequests:"user#0000"
                });
            });
        });

        describe("Test filterOwnedLeagues", () => {
            let filterOwnedLeagues;

            beforeEach(() => {
                filterOwnedLeagues = leagueFile.__get__("filterOwnedLeagues");
                req.session.username = "user#0000";
            });

            it("Test filterOwnedLeagues ", async () => {
                await filterOwnedLeagues(req, res, next);
                expect(res.locals.filter).to.deep.equal({
                    owner:"user#0000"
                });
            });
        });

        describe("Test getAdminLeagues", () => {
            let getAdminLeagues;
            let findLeaguesWhereStub;

            beforeEach(() => {
                getAdminLeagues = leagueFile.__get__("getAdminLeagues");
                findLeaguesWhereStub = sandbox.stub().resolves({"data":{_id:"4"}});
                leagueFile.__set__("findLeaguesWhere", findLeaguesWhereStub);
                req.session.username = "user#0000";
            });

            it("Test getAdminLeagues ", async () => {
                await getAdminLeagues(req, res, next);
                expect(res.status).to.equal(200);
                expect(res.data).to.equal(JSON.stringify({"data":{_id:"4"}}))
            });
        });

        describe("Test getLeagueNameDescriptionType", () => {
            let getLeagueNameDescriptionType;
            let leanStub;
            let findStub;

            beforeEach(() => {
                getLeagueNameDescriptionType = leagueFile.__get__("getLeagueNameDescriptionType");
                req.session.username = "user#0000";
                req.body.leagueID = "id";
                leanStub = sandbox.stub().resolves({"id":4, "leagueName":"leagueName", "leagueDescription":"description", "leagueType":"private"});
                findStub = sandbox.stub(mongoose.Model, "findOne").returns({lean:leanStub});
            });

            it("Test getLeagueNameDescriptionType ", async () => {
                await getLeagueNameDescriptionType(req, res, next);
                expect(res.status).to.equal(200);
                expect(res.data).to.equal(JSON.stringify({"id":4, "leagueName":"leagueName", "leagueDescription":"description", "leagueType":"private"}))
            });
        });

        describe("Test getLeagueActiveChallengeCount", () => {
            let getLeagueActiveChallengeCount;
            let getChallengeCountStub;

            beforeEach(() => {
                getLeagueActiveChallengeCount = leagueFile.__get__("getLeagueActiveChallengeCount");
                req.session.username = "user#0000";
                req.body.leagueID = "id";
                getChallengeCountStub = sandbox.stub().resolves(4);
                leagueFile.__set__("getChallengeCount", getChallengeCountStub);
                
            });

            it("Test getLeagueActiveChallengeCount ", async () => {
                await getLeagueActiveChallengeCount(req, res, next);
                expect(res.status).to.equal(200);
                expect(res.data).to.equal(JSON.stringify(4))
            });
        });

        describe("Test getMyRole", () => {
            let getMyRole;
            let findOneStub;
            let leanStub;

            beforeEach(() => {
                getMyRole = leagueFile.__get__("getMyRole");
                req.session.username = "user#0000";
                req.body.leagueID = "id";
                leanStub = sandbox.stub()
                findOneStub = sandbox.stub(mongoose.Model, "findOne").returns({lean:leanStub});
            });

            it("Test getMyRole with no role", async () => {
                leanStub.resolves(null);
                await getMyRole(req, res, next);
                expect(res.status).to.equal(200);
                expect(res.data).to.equal(JSON.stringify("none"))
            });

            it("Test getMyRole as owner", async () => {
                leanStub.resolves({"owner":"user#0000", "admin":["user#0000"]});
                await getMyRole(req, res, next);
                expect(res.status).to.equal(200);
                expect(res.data).to.equal(JSON.stringify("owner"))
            });

            it("Test getMyRole as admin", async () => {
                leanStub.resolves({"owner":"userOther#0000", "admin":["userOther#0000", "user#0000"]});
                await getMyRole(req, res, next);
                expect(res.status).to.equal(200);
                expect(res.data).to.equal(JSON.stringify("admin"))
            });

            it("Test getMyRole as participant", async () => {
                leanStub.resolves({"owner":"userOther#0000", "admin":["userOther#0000"]});
                await getMyRole(req, res, next);
                expect(res.status).to.equal(200);
                expect(res.data).to.equal(JSON.stringify("participant"))
            });
        });

        describe("Test getMemberList", () => {
            let getMemberList;
            let findOneStub;
            let leagueLeanStub;
            let findStub;
            let userLeanStub;

            beforeEach(() => {
                getMemberList = leagueFile.__get__("getMemberList");
                req.session.username = "user#0000";
                req.body.leagueID = "id";
                leagueLeanStub = sandbox.stub();
                findOneStub = sandbox.stub(mongoose.Model, "findOne").returns({lean:leagueLeanStub});
                userLeanStub = sandbox.stub();
                findStub = sandbox.stub(mongoose.Model, "find").returns({lean:userLeanStub});
            });

            it("Test getMemberList when the league exists", async () => {
                leagueLeanStub.resolves(null);
                await getMemberList(req, res, next);
                expect(findStub).not.be.called;
                expect(res.status).to.equal(404);
            });

            it("Test getMemberList when the league does not exist", async () => {
                leagueLeanStub.resolves({members:["user#0000"]});
                userLeanStub.resolves(["user#0000"])
                await getMemberList(req, res, next);
                expect(findStub).be.called;
                expect(res.status).to.equal(200);
            });
        });

        describe("Test getBannedList", () => {
            let getBannedList;
            let findOneStub;
            let leagueLeanStub;
            let findStub;
            let userLeanStub;

            beforeEach(() => {
                getBannedList = leagueFile.__get__("getBannedList");
                req.session.username = "user#0000";
                req.body.leagueID = "id";
                leagueLeanStub = sandbox.stub();
                findOneStub = sandbox.stub(mongoose.Model, "findOne").returns({lean:leagueLeanStub});
                userLeanStub = sandbox.stub();
                findStub = sandbox.stub(mongoose.Model, "find").returns({lean:userLeanStub});
            });

            it("Test getBannedList when the league exists", async () => {
                leagueLeanStub.resolves(null);
                await getBannedList(req, res, next);
                expect(findStub).not.be.called;
                expect(res.status).to.equal(404);
            });

            it("Test getBannedList when the league does not exist", async () => {
                leagueLeanStub.resolves({members:["user#0000"]});
                userLeanStub.resolves(["user#0000"])
                await getBannedList(req, res, next);
                expect(findStub).be.called;
                expect(res.status).to.equal(200);
            });
        });

        describe("Test getPendingRequestList", () => {
            let getPendingRequestList;
            let findOneStub;
            let leagueLeanStub;
            let findStub;
            let userLeanStub;

            beforeEach(() => {
                getPendingRequestList = leagueFile.__get__("getPendingRequestList");
                req.session.username = "user#0000";
                req.body.leagueID = "id";
                leagueLeanStub = sandbox.stub();
                findOneStub = sandbox.stub(mongoose.Model, "findOne").returns({lean:leagueLeanStub});
                userLeanStub = sandbox.stub();
                findStub = sandbox.stub(mongoose.Model, "find").returns({lean:userLeanStub});
            });

            it("Test getPendingRequestList when the league exists", async () => {
                leagueLeanStub.resolves(null);
                await getPendingRequestList(req, res, next);
                expect(findStub).not.be.called;
                expect(res.status).to.equal(404);
            });

            it("Test getPendingRequestList when the league does not exist", async () => {
                leagueLeanStub.resolves({members:["user#0000"]});
                userLeanStub.resolves(["user#0000"])
                await getPendingRequestList(req, res, next);
                expect(findStub).be.called;
                expect(res.status).to.equal(200);
            });
        });

        describe("Test getSentInviteList", () => {
            let getSentInviteList;
            let findOneStub;
            let leagueLeanStub;
            let findStub;
            let userLeanStub;

            beforeEach(() => {
                getSentInviteList = leagueFile.__get__("getSentInviteList");
                req.session.username = "user#0000";
                req.body.leagueID = "id";
                leagueLeanStub = sandbox.stub();
                findOneStub = sandbox.stub(mongoose.Model, "findOne").returns({lean:leagueLeanStub});
                userLeanStub = sandbox.stub();
                findStub = sandbox.stub(mongoose.Model, "find").returns({lean:userLeanStub});
            });

            it("Test getSentInviteList when the league exists", async () => {
                leagueLeanStub.resolves(null);
                await getSentInviteList(req, res, next);
                expect(findStub).not.be.called;
                expect(res.status).to.equal(404);
            });

            it("Test getSentInviteList when the league does not exist", async () => {
                leagueLeanStub.resolves({members:["user#0000"]});
                userLeanStub.resolves(["user#0000"])
                await getSentInviteList(req, res, next);
                expect(findStub).be.called;
                expect(res.status).to.equal(200);
            });
        });

        it("Test getLeaderboard", async () =>{
            let distinctStub = sandbox.stub();
            let leanStub = sandbox.stub();
            let getSortedFieldFrequencyStub = sandbox.stub().resolves("val");
            sandbox.stub(mongoose.Model, "find").returns({distinct:distinctStub, lean:leanStub});
            leagueFile.__set__("getSortedFieldFrequency", getSortedFieldFrequencyStub);
            let getLeaderboard = leagueFile.__get__("getLeaderboard");
            await getLeaderboard(req, res, next);
            expect(res.status).to.equal(200);

        })

        it("Test getRecommended",async () => {
            req.session.username = "user#0000";
            let leagueLeanStub = sandbox.stub().resolves("val")
            let distinctStub = sandbox.stub().resolves([{}]);
            let limitLeagueStub = sandbox.stub().returns({lean:leagueLeanStub})
            let leagueFindStub = sandbox.stub(League, "find").returns({distinct:distinctStub, limit:limitLeagueStub});
            let exerciseLeanStub = sandbox.stub().resolves([{exercise:{exerciseName:"Baseball"}}]);
            let limitStub = sandbox.stub().returns({lean:exerciseLeanStub});
            let sortStub = sandbox.stub().returns({limit:limitStub});
            let exerciseLogFindStub = sandbox.stub(Exercise_log, "find").returns({sort:sortStub})
            let leanChallengeStub = sandbox.stub().resolves([{}]);
            let distinctChallengeStub = sandbox.stub().returns({lean:leanChallengeStub});
            let challengeFindStub = sandbox.stub(Challenge, "find").returns({distinct:distinctChallengeStub})
            let getRecommended = leagueFile.__get__("getRecommended");
            await getRecommended(req, res, next);
            expect(res.status).to.equal(200);
        })

        describe("Test getRecentActivity", () =>{
            let getRecentActivity;
            let existsStub;
            let leanStub;
            let distinctStub;
            let leagueFindStub;
            let leanExerciseStub;
            let limitStub;
            let sortStub;
            let exerciseFindStub;

            before(()=>{
                req.session.username = "user#0000";
                leanStub = sandbox.stub();
                distinctStub = sandbox.stub().returns({lean:leanStub});
                leagueFindStub = sandbox.stub(League, "find").returns({distinct:distinctStub});
                leanExerciseStub = sandbox.stub();
                limitStub = sandbox.stub().returns({lean:leanExerciseStub});
                sortStub = sandbox.stub().returns({limit:limitStub});
                exerciseFindStub = sandbox.stub(Exercise_log, "find").returns({sort:sortStub});
                getRecentActivity = leagueFile.__get__("getRecentActivity");
            })

            it("Test getRecentActivity when there are no members in the users leagues", async () =>{
                leanStub.resolves([]);
                await getRecentActivity(req, res, next);
                expect(exerciseFindStub).to.not.be.called;
                expect(res.status).to.equal(200);
            })

            it("Test getRecentActivity when there are members in the users leagues", async () =>{
                leanStub.resolves([{}]);
                leanExerciseStub.resolves("val")
                distinctStub = sandbox.stub().returns({lean:leanStub});
                leagueFindStub = sandbox.stub(League, "find").returns({distinct:distinctStub});
                limitStub = sandbox.stub().returns({lean:leanExerciseStub});
                sortStub = sandbox.stub().returns({limit:limitStub});
                exerciseFindStub = sandbox.stub(Exercise_log, "find").returns({sort:sortStub});
                await getRecentActivity(req, res, next);
                expect(exerciseFindStub).to.be.called;
                expect(res.status).to.equal(200);
            })
        })

        describe("Test checkUserLeagueAdmin", () =>{
            let checkUserLeagueAdmin;
            let existsStub;
            let leanStub;

            before(()=>{
                req.body.leagueID = "3";
                req.session.username = "user#0000"
                checkUserLeagueAdmin = leagueFile.__get__("checkUserLeagueAdmin");
                leanStub = sandbox.stub();
                existsStub = sandbox.stub(mongoose.Model, "exists").returns({lean:leanStub});
            })

            it("Test checkUserLeagueAdmin when user is admin", async () =>{
                leanStub.resolves({});
                await checkUserLeagueAdmin(req, res, next);
                expect(next).to.be.called;
            })

            it("Test checkUserLeagueAdmin when user is not admin", async () =>{
                leanStub.resolves(null);
                existsStub = sandbox.stub(mongoose.Model, "exists").returns({lean:leanStub})
                await checkUserLeagueAdmin(req, res, next);
                expect(res.status).to.equal(401);
            })
        })

        describe("Test updatePicture", () =>{
            let updatePicture;
            let updateImageStub;

            before(()=>{
                req.body.leagueName = "private";
                req.body.leagueID = "3";
                req.session.username = "user#0000"
                updatePicture = leagueFile.__get__("updatePicture");
                updateImageStub = sandbox.stub();
                leagueFile.__set__("uploadImage", updateImageStub);
            })

            it("Test updatePicture fails", async () =>{
                updateImageStub.throws("Err")
                await updatePicture(req, res, next);
                expect(res.status).to.equal(400);
            })

            it("Test updatePicture succeeds", async () =>{
                updateImageStub.resolves(true)
                await updatePicture(req, res, next);
                expect(res.status).to.equal(200);
            })
        })

        describe("Test updateName", () =>{
            let updateName;

            before(()=>{
                req.body.leagueName = "private";
                req.body.leagueID = "3";
                req.session.username = "user#0000"
                updateName = leagueFile.__get__("updateName");
            })

            it("Test updateName fails", async () =>{
                updateOneStub = sandbox.stub(mongoose.Model, "updateOne").throws();
                await updateName(req, res, next);
                expect(res.status).to.equal(400);
            })

            it("Test updateName succeeds", async () =>{
                updateOneStub = sandbox.stub(mongoose.Model, "updateOne");
                await updateName(req, res, next);
                expect(res.status).to.equal(200);
            })
        })

        describe("Test updateDescription", () =>{
            it("Test updateDescription succeeds", async () =>{
                req.body.leagueDescription = "private";
                req.body.leagueID = "3";
                req.session.username = "user#0000"
                updateOneStub = sandbox.stub(mongoose.Model, "updateOne");
                let updateDescription = leagueFile.__get__("updateDescription");
                await updateDescription(req, res, next);
                expect(res.status).to.equal(200);
            })
        })

        describe("Test updateType", () =>{
            it("Test updateType succeeds", async () =>{
                req.body.leagueType = "private";
                req.body.leagueID = "3";
                req.session.username = "user#0000"
                updateOneStub = sandbox.stub(mongoose.Model, "updateOne");
                let updateType = leagueFile.__get__("updateType");
                await updateType(req, res, next);
                expect(res.status).to.equal(200);
            })
        })
    });
});