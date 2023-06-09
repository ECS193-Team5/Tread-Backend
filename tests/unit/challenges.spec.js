const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();
const mongoose = require("mongoose");

describe("Testing challenges", () =>{
    let challenges;
    let req;
    let res;
    let next;

    beforeEach(() => {
        challenges = rewire("../../routes/challenges.js");

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
            send(y){
                this.data = JSON.stringify(y);
                return this;
            }
        }

        next = sandbox.stub();
    });

    afterEach(() => {
        sandbox.restore();
    })

    it("Testing addInfoSharedAcrossRequests", async () => {
        let addInfoSharedAcrossRequests = challenges.__get__("addInfoSharedAcrossRequests")
        req.body.issueDate = Date.now()
        req.body.dueDate = Date.now() + 1;
        res.locals.challenge = {}
        let exercise = {
            unit:"m",
            amount:10,
            exerciseName:"Baseball"
        }
        req.body.unit = exercise.unit;
        req.body.amount = exercise.amount;
        req.body.exerciseName = exercise.exerciseName;

        await addInfoSharedAcrossRequests(req, res, next);
        expect(next).to.be.called;
        expect(res.locals.challenge.issueDate).to.equal(req.body.issueDate);
        expect(res.locals.challenge.dueDate).to.equal(req.body.dueDate);
        expect(res.locals.challenge.exercise).to.deep.equal(exercise);
        expect(res.locals.challengeProgress).to.deep.equal(
            {
                issueDate:req.body.issueDate,
                dueDate: req.body.dueDate,
                exercise: exercise
            }
        )
    });

    it("Testing createChallengeProgressDocumentQuery", async () => {
        let createChallengeProgressDocumentQuery = challenges.__get__("createChallengeProgressDocumentQuery")

        let result = await createChallengeProgressDocumentQuery("user#0000", {"info":"infoValue"});

        expect(result).to.deep.equal(
            {
                "insertOne": {
                    "document": {
                    "info": "infoValue",
                    "username": "user#0000"
                    }
                }
            }
        );
    });

    it("Testing notifyNewChallenge", async () => {
        let notifyNewChallenge = challenges.__get__("notifyNewChallenge")
        let sendNotificationToUsersStub;
        sendNotificationToUsersStub = sandbox.stub()
        challenges.__set__("sendNotificationToUsers", sendNotificationToUsersStub);
        res.locals.challenge = {}
        res.locals.challenge.participants = ["user#0001", "user#0000", "user#0002"];
        req.session.username = "user#0000";

        await notifyNewChallenge(req, res, next);

        expect(sendNotificationToUsersStub).to.be.calledWith(
            ["user#0001", "user#0002"],
            "user#0000 sent you a challenge.",
            "currentChallengePage"
        )
        expect(res.status).to.equal(200)
    });

    describe("Testing addChallenge", async () => {
        let addChallenge;
        let saveStub;

        beforeEach(()=>{
            addChallenge = challenges.__get__("addChallenge")
            res.locals.challengeProgress = {}
            res.locals.challenge = {
                issueDate: Date.now(),
                dueDate: Date.now()+1,
                exercise: exercise
            }
            saveStub = sandbox.stub(mongoose.Model.prototype, "save");
        })

        it("Test addChallenge succeeds", async () =>{
            saveStub.resolves({_id:"4"})
            await addChallenge(req, res, next);
            expect(next).to.be.called;
            expect(res.locals.challengeProgress.challengeID).to.equal("4");
        });

        it("Test addChallenge fails", async () =>{
            saveStub.throws("Err")
            await addChallenge(req, res, next);
            expect(res.status).to.equal(500);
            expect(res.data).to.equal(JSON.stringify("Error: Err"))
            expect(next).not.to.be.called;
        })
    });

    describe("Testing addChallengeProgress", async () => {
        let addChallengeProgress;
        let bulkWriteStub;

        beforeEach(()=>{
            addChallengeProgress = challenges.__get__("addChallengeProgress")
            res.locals.challengeProgress = {}
            res.locals.challenge = {}
            res.locals.challenge.participants = ["user#0001", "user#0002"]
            bulkWriteStub = sandbox.stub(mongoose.Model, "bulkWrite");
        })

        it("Test addChallengeProgress succeeds", async () =>{
            bulkWriteStub.resolves({_id:"4"})
            await addChallengeProgress(req, res, next);
            expect(next).to.be.called;
        });

        it("Test addChallengeProgress fails", async () =>{
            bulkWriteStub.throws("Err")
            await addChallengeProgress(req, res, next);
            expect(res.status).to.equal(500);
            expect(res.data).to.equal(JSON.stringify("Error: Err"))
            expect(next).not.to.be.called;
        })
    });

    describe("Testing setUpAddFriendChallenge", async () => {
        let setUpAddFriendChallenge;
        let isFriendStub;

        beforeEach(()=>{
            setUpAddFriendChallenge = challenges.__get__("setUpAddFriendChallenge")
            req.session.username = "user#0000";
            req.body.receivedUser = "rec#0000";
            isFriendStub = sandbox.stub();
            challenges.__set__("isFriend", isFriendStub);
        })

        it("Test setUpAddFriendChallenge is not friend", async () =>{
            isFriendStub.resolves(false);
            await setUpAddFriendChallenge(req, res, next);
            expect(res.status).to.equal(404)
        });

        it("Test setUpAddFriendChallenge is friend", async () =>{
            isFriendStub.resolves(true);
            await setUpAddFriendChallenge(req, res, next);
            expect(next).to.be.called;
            expect(res.locals.challenge).to.deep.equal({
                participants: ["user#0000", "rec#0000"],
                sentUser:"user#0000",
                receivedUser:"rec#0000",
                challengeType:"friend"
            });
        })
    });

    it("Testing setUpAddSelfChallenge", async () => {
        let setUpAddSelfChallenge = challenges.__get__("setUpAddSelfChallenge")
        res.locals.challenge = {}
        req.session.username = "user#0000"

        await setUpAddSelfChallenge(req, res, next);

        expect(next).to.be.called;
        expect(res.locals.challenge).to.deep.equal({
            participants: ["user#0000"],
            sentUser:"user#0000",
            receivedUser:"user#0000",
            challengeType:"self"
        })
    });

    describe("Testing setUpAddLeagueChallenge", async () => {
        let setUpAddLeagueChallenge;
        let findOneStub;

        beforeEach(()=>{
            setUpAddLeagueChallenge = challenges.__get__("setUpAddLeagueChallenge")
            req.session.username = "user#0000";
            req.body.receivedUser = "63fb66a1971b753d7edf9c48";
            findOneStub = sandbox.stub(mongoose.Model, "findOne");
        })

        it("Test setUpAddLeagueChallenge sent by a not admin", async () =>{
            findOneStub.resolves(null);
            await setUpAddLeagueChallenge(req, res, next);
            expect(res.status).to.equal(400)
            expect(res.data).to.equal(JSON.stringify("Not your league"));
        });

        it("Test setUpAddLeagueChallenge sent by admin", async () =>{
            findOneStub.resolves({"members":["list"]});
            await setUpAddLeagueChallenge(req, res, next);
            expect(next).to.be.called;
            expect(res.locals.challenge).to.deep.equal({
                participants: ["list"],
                sentUser:"user#0000",
                receivedUser:"63fb66a1971b753d7edf9c48",
                challengeType:"league"
            });
        })
    });

    it("Testing deleteFriendChallenge", async () => {
        let deleteFriendChallenge = challenges.__get__("deleteFriendChallenge")
        let leanStub = sandbox.stub();
        let deleteOneStub = sandbox.stub(mongoose.Model, "deleteOne").returns({lean:leanStub});
        let deleteManyStub = sandbox.stub(mongoose.Model, "deleteMany").returns({lean:leanStub});

        req.body.challengeID = "id";
        req.session.username = "user#0000";

        await deleteFriendChallenge(req, res, next);

        expect(res.status).to.equal(200);
    });

    it("Testing getProgressOfChallenge", async () => {
        let getProgressOfChallenge = challenges.__get__("getProgressOfChallenge")
        let leanStub = sandbox.stub();
        let findOneStub = sandbox.stub(mongoose.Model, "findOne").returns({lean:leanStub});

        let challenge = {"_id":"id"}
        let username = "user#0000";

        await getProgressOfChallenge(challenge, username);

        expect(findOneStub).to.be.calledOnce;
        expect(leanStub).to.be.calledOnce;
    });

    it("Testing getProgressForListOfChallenges", async () => {
        let getProgressForListOfChallenges = challenges.__get__("getProgressForListOfChallenges")
        let getProgressStub = sandbox.stub().resolves(true);
        challenges.__set__("getProgressOfChallenge", getProgressStub);

        let challenge = [{"_id":"id"}, {"_id":"id2"}];
        let username = "user#0000";
        await getProgressForListOfChallenges(challenge, username);

        expect(getProgressStub).to.be.calledTwice;
    });

    it("Testing getCompleteChallengeToProgressInfo", async () => {
        let getCompleteChallengeToProgressInfo = challenges.__get__("getCompleteChallengeToProgressInfo")
        let getProgressForListOfChallengesStub = sandbox.stub().resolves(true);
        challenges.__set__("getProgressForListOfChallenges", getProgressForListOfChallengesStub);

        let challenge = [{"_id":"id"}, {"_id":"id2"}];
        let username = "user#0000";
        let res = await getCompleteChallengeToProgressInfo(challenge, username);

        expect(getProgressForListOfChallengesStub).to.be.calledOnce;
    });

    it("Testing getAcceptedChallenges", async () => {
        req.session.username = "user#0000"
        let getAcceptedChallenges = challenges.__get__("getAcceptedChallenges")
        let getCompleteChallengeToProgressInfoStub = sandbox.stub().resolves(true);
        challenges.__set__("getCompleteChallengeToProgressInfo", getCompleteChallengeToProgressInfoStub);
        let leanStub = sandbox.stub().resolves([{}, {}]);
        let findStub = sandbox.stub(mongoose.Model, "find").returns({lean:leanStub});

        await getAcceptedChallenges(req, res);

        expect(res.status).to.equal(200);
        expect(JSON.parse(res.data)).to.equal(true);
    });

    it("Testing getSentChallenges", async () => {
        req.session.username = "user#0000"
        let getSentChallenges = challenges.__get__("getSentChallenges")
        let getCompleteChallengeToProgressInfoStub = sandbox.stub().resolves(true);
        challenges.__set__("getCompleteChallengeToProgressInfo", getCompleteChallengeToProgressInfoStub);
        let leanStub = sandbox.stub().resolves([{}, {}]);
        let findStub = sandbox.stub(mongoose.Model, "find").returns({lean:leanStub});

        await getSentChallenges(req, res);

        expect(res.status).to.equal(200);
        expect(JSON.parse(res.data)).to.deep.equal([{}, {}]);
    });

    it("Testing getLeagueChallenges", async () => {
        req.session.username = "user#0000"
        let getLeagueChallenges = challenges.__get__("getLeagueChallenges")
        let getCompleteChallengeToProgressInfoStub = sandbox.stub().resolves(true);
        challenges.__set__("getCompleteChallengeToProgressInfo", getCompleteChallengeToProgressInfoStub);
        let leanStub = sandbox.stub().resolves([{}, {}]);
        let findStub = sandbox.stub(mongoose.Model, "find").returns({lean:leanStub});

        await getLeagueChallenges(req, res);

        expect(res.status).to.equal(200);
        expect(JSON.parse(res.data)).to.equal(true);
    });

    it("Testing getReceivedChallenges", async () => {
        req.session.username = "user#0000"
        let getReceivedChallenges = challenges.__get__("getReceivedChallenges")
        let getCompleteChallengeToProgressInfoStub = sandbox.stub().resolves(true);
        challenges.__set__("getCompleteChallengeToProgressInfo", getCompleteChallengeToProgressInfoStub);
        let leanStub = sandbox.stub().resolves([{}, {}]);
        let findStub = sandbox.stub(mongoose.Model, "find").returns({lean:leanStub});

        await getReceivedChallenges(req, res);

        expect(res.status).to.equal(200);
        expect(JSON.parse(res.data)).to.deep.equal([{}, {}]);
    });

    it("Testing updatePendingChallengeStatusByID", async () => {
        let updatePendingChallengeStatusByID = challenges.__get__("updatePendingChallengeStatusByID")
        let leanStub = sandbox.stub().resolves("val");
        let findOneAndUpdateStub = sandbox.stub(mongoose.Model, "findOneAndUpdate").returns({lean:leanStub});

        let res = await updatePendingChallengeStatusByID("63fb66a1971b753d7edf9c48",
            "user#0000",
            "accepted");

        expect(res).to.deep.equal("val");
    });

    it("Testing notifyAcceptedChallenge", async () => {
        let notifyAcceptedChallenge = challenges.__get__("notifyAcceptedChallenge")
        let sendNotificationToUsersStub;
        sendNotificationToUsersStub = sandbox.stub()
        challenges.__set__("sendNotificationToUsers", sendNotificationToUsersStub);
        
        await notifyAcceptedChallenge("challenger#0000", "user#0000");

        expect(sendNotificationToUsersStub).to.be.calledWith(
            ["challenger#0000" ],
            "user#0000 accepted your challenge.",
            "currentChallengePage"
        )
    });
    
    describe("Testing acceptFriendChallenge", async () => {
        let acceptFriendChallenge;
        let updatePendingChallengeStatusByIDStub;
        let notifyAcceptedChallengeStub;
        

        beforeEach(()=>{
            acceptFriendChallenge = challenges.__get__("acceptFriendChallenge")
            req.session.username = "user#0000";
            req.body.challengeID = "id";
            updatePendingChallengeStatusByIDStub = sandbox.stub();
            challenges.__set__("updatePendingChallengeStatusByID", updatePendingChallengeStatusByIDStub);
            notifyAcceptedChallengeStub = sandbox.stub();
            challenges.__set__("notifyAcceptedChallenge", notifyAcceptedChallengeStub);
        })

        it("Test acceptFriendChallenge, but challenge does not exist", async () =>{
            updatePendingChallengeStatusByIDStub.resolves(null);
            await acceptFriendChallenge(req, res, next);
            expect(res.status).to.equal(404)
        });

        it("Test acceptFriendChallenge, challenge does exist", async () =>{
            updatePendingChallengeStatusByIDStub.resolves({sentUser:"friend#0000"});
            await acceptFriendChallenge(req, res, next);
            expect(res.status).to.equal(200);
        })
    });

    describe("Testing declineFriendChallenge", async () => {
        let declineFriendChallenge;
        let updatePendingChallengeStatusByIDStub;
        let notifyAcceptedChallengeStub;
        beforeEach(()=>{
            declineFriendChallenge = challenges.__get__("declineFriendChallenge")
            req.session.username = "user#0000";
            req.body.challengeID = "id";
            updatePendingChallengeStatusByIDStub = sandbox.stub();
            challenges.__set__("updatePendingChallengeStatusByID", updatePendingChallengeStatusByIDStub);
            
        })

        it("Test declineFriendChallenge, but challenge does not exist", async () =>{
            updatePendingChallengeStatusByIDStub.resolves(null);
            await declineFriendChallenge(req, res, next);
            expect(res.status).to.equal(404)
        });

        it("Test declineFriendChallenge, challenge does exist", async () =>{
            updatePendingChallengeStatusByIDStub.resolves({sentUser:"friend#0000"});
            await declineFriendChallenge(req, res, next);
            expect(res.status).to.equal(200);
        })
    });

    it("Testing getChallengeLeaderboard", async () => {
        req.session.username ="user#0000";
        req.body.challengeID = "id";
        let getChallengeLeaderboard = challenges.__get__("getChallengeLeaderboard")
        let leanStub = sandbox.stub().resolves("val");
        let sortStub = sandbox.stub().returns({lean:leanStub})
        let findStub = sandbox.stub(mongoose.Model, "find").returns({sort:sortStub});
        
        await getChallengeLeaderboard(req, res);

        expect(res.status).to.equal(200);
        expect(res.data).to.equal(JSON.stringify("val"));
    });
});