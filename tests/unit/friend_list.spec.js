const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();
const mongoose = require("mongoose");
const Friend_connection = require("../../models/friend_connection.model");
const Exercise_log = require("../../models/exercise_log.model")

describe("Testing friend_list", () =>{
    let friend_list;
    let req;
    let res;
    let next;

    beforeEach(() => {
        friend_list = rewire("../../routes/friend_list.js");

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

    afterEach(() => {
        sandbox.restore();
    })

    it("Test getPropertyOfFriendList", async function() {
        let getPropertyOfFriendList = friend_list.__get__("getPropertyOfFriendList")
        let leanStub = sandbox.stub().resolves("val");
        let findOneStub = sandbox.stub(mongoose.Model, "findOne").returns({lean:leanStub});

        let res = await getPropertyOfFriendList("user#0000", "property");
        expect(res).to.equal("val");
    });

    it("Test getPendingRequests", async function() {
        let getPendingRequests = friend_list.__get__("getPendingRequests")
        let leanStub = sandbox.stub().resolves("val");
        let findOneStub = sandbox.stub(mongoose.Model, "findOne").returns({lean:leanStub});
        
        await getPendingRequests(req, res);
        expect(res.data).to.equal(JSON.stringify("val"));
    });

    it("Test getFriendList", async function() {
        let getFriendList = friend_list.__get__("getFriendList")
        let distinctStub = sandbox.stub().resolves("val");
        let findStub = sandbox.stub(mongoose.Model, "find").returns({distinct:distinctStub});
        let res = await getFriendList();
        expect(res).to.equal("val");
    });

    it("Test getOnlyUsernamesFriendList", async function() {
        let getOnlyUsernamesFriendList = friend_list.__get__("getOnlyUsernamesFriendList")
        let getFriendListStub = sandbox.stub().resolves("val");
        friend_list.__set__("getFriendList", getFriendListStub);
        await getOnlyUsernamesFriendList(req, res);
        expect(res.data).to.equal(JSON.stringify("val"));
    });

    it("Test getUsernameDisplayName", async function() {
        let getUsernameDisplayName = friend_list.__get__("getUsernameDisplayName")
        let findStub = sandbox.stub(mongoose.Model, "find").resolves("val");
        let res = await getUsernameDisplayName();
        expect(res).to.equal("val");
    });

    it("Test getAllFriendsInfo", async function() {
        let getAllFriendsInfo = friend_list.__get__("getAllFriendsInfo")
        let getFriendListStub = sandbox.stub().resolves("val");
        friend_list.__set__("getFriendList", getFriendListStub);
        let getUsernameDisplayNameStub = sandbox.stub().resolves("val");
        friend_list.__set__("getUsernameDisplayName", getUsernameDisplayNameStub);
        await getAllFriendsInfo(req, res);
        expect(res.data).to.equal(JSON.stringify("val"));
    });

    it("Test getUsernameDisplayNameFromInboxNames", async function() {
        let getUsernameDisplayNameFromInboxNames = friend_list.__get__("getUsernameDisplayNameFromInboxNames")
        let getPropertyOfFriendListStub = sandbox.stub().resolves("val");
        friend_list.__set__("getPropertyOfFriendList", getPropertyOfFriendListStub);
        let getUsernameDisplayNameStub = sandbox.stub().resolves("val");
        friend_list.__set__("getUsernameDisplayName", getUsernameDisplayNameStub);
        let res = await getUsernameDisplayNameFromInboxNames("username", "field");
        expect(res).to.equal("val");
    });

    it("Test getSentRequestList", async function() {
        req.session.username = "user#0000"
        let getSentRequestList = friend_list.__get__("getSentRequestList")
        let getUsernameDisplayNameFromInboxNamesStub = sandbox.stub().resolves("val");
        friend_list.__set__("getUsernameDisplayNameFromInboxNames", getUsernameDisplayNameFromInboxNamesStub);
        await getSentRequestList(req, res);
        expect(res.data).to.equal(JSON.stringify("val"));
    });

    it("Test getReceivedRequestList", async function() {
        req.session.username = "user#0000"
        let getReceivedRequestList = friend_list.__get__("getReceivedRequestList")
        let getUsernameDisplayNameFromInboxNamesStub = sandbox.stub().resolves("val");
        friend_list.__set__("getUsernameDisplayNameFromInboxNames", getUsernameDisplayNameFromInboxNamesStub);
        await getReceivedRequestList(req, res);
        expect(res.data).to.equal(JSON.stringify("val"));
    });

    it("Test getBlockedList", async function() {
        req.session.username = "user#0000"
        let getBlockedList = friend_list.__get__("getBlockedList")
        let getUsernameDisplayNameFromInboxNamesStub = sandbox.stub().resolves("val");
        friend_list.__set__("getUsernameDisplayNameFromInboxNames", getUsernameDisplayNameFromInboxNamesStub);
        await getBlockedList(req, res);
        expect(res.data).to.equal(JSON.stringify("val"));
    });

    it("Test removeFriend", async function() {
        req.session.username = "user#0000"
        let removeFriend = friend_list.__get__("removeFriend")
        let findStub = sandbox.stub(mongoose.Model, "bulkWrite");
        await removeFriend("user#0000", "friend#0000");
    });

    it("Test setUpRemoveFriend", async function() {
        req.session.username = "user#0000"
        req.session.friendName = "friend#0000";
        let setUpRemoveFriend = friend_list.__get__("setUpRemoveFriend")
        let removeFriendStub = sandbox.stub().resolves("val");
        friend_list.__set__("removeFriend", removeFriendStub);
        await setUpRemoveFriend(req, res);
        expect(res.status).to.equal(200);
    });

    it("Test getUserFriendDocument", async function() {
        let getUserFriendDocument = friend_list.__get__("getUserFriendDocument")
        let leanStub = sandbox.stub().resolves("val");
        let findOneStub = sandbox.stub(mongoose.Model, "findOne").returns({lean:leanStub});
        
        let res = await getUserFriendDocument("username");
        expect(res).to.equal("val");
    });

    it("Test isRequestSentAlready", async function() {
        let userFriendDocument = {
            "sentRequests":["friend#0000"],
            "blockedRequests":["friend#0000"]
        }
        let isRequestSentAlready = friend_list.__get__("isRequestSentAlready")
        let res = await isRequestSentAlready(userFriendDocument, "friend#0000");
        expect(res).to.equal(true);
    });

    it("Test isBlocking", async function() {
        let userFriendDocument = {
            "sentRequests":["friend#0000"],
            "blocked":["friend#0000"]
        }
        let isBlocking = friend_list.__get__("isBlocking")
        let res = await isBlocking(userFriendDocument, "friend#0000");
        expect(res).to.equal(true);
    });

    it("Test unblock", async function() {
        let unblock = friend_list.__get__("unblock")
        let leanStub = sandbox.stub().resolves("val");
        let updateOneStub = sandbox.stub(mongoose.Model, "updateOne").returns({lean:leanStub});

        let res = await unblock("user1", "user2");
    });

    it("Test isBlockedBy", async function() {
        let userFriendDocument = {
            "sentRequests":["friend#0000"],
            "blockedBy":["friend#0000"]
        }
        let isBlockedBy = friend_list.__get__("isBlockedBy")
        let res = await isBlockedBy(userFriendDocument, "friend#0000");
        expect(res).to.equal(true);
    });

    it("Test isFriend when users are friends", async function() {
        let isFriend = friend_list.__get__("isFriend")
        let leanStub = sandbox.stub().resolves(true);
        let updateOneStub = sandbox.stub(mongoose.Model, "exists").returns({lean:leanStub});

        let res = await isFriend("user1", "user2");
        expect(res).to.equal(true);
    });

    it("Test isFriend when users are not friends", async function() {
        let isFriend = friend_list.__get__("isFriend")
        let leanStub = sandbox.stub().resolves(null);
        let updateOneStub = sandbox.stub(mongoose.Model, "exists").returns({lean:leanStub});

        let res = await isFriend("user1", "user2");
        expect(res).to.equal(false);
    });

    it("Test isRequestReceived", async function() {
        let userFriendDocument = {
            "receivedRequests":["friend#0000"]
        }
        let isRequestReceived = friend_list.__get__("isRequestReceived")
        let res = await isRequestReceived(userFriendDocument, "friend#0000");
        expect(res).to.equal(true);
    });

    it("Test createFriendConnection", async function() {
        req.session.username = "user#0000"
        let createFriendConnection = friend_list.__get__("createFriendConnection")
        let findStub = sandbox.stub(mongoose.Model, "bulkWrite");
        await createFriendConnection("user#0000", "friend#0000");
    });

    it("Test acceptFriendRequest", async function() {
        let acceptFriendRequest = friend_list.__get__("acceptFriendRequest")
        let removeReceivedRequest= sandbox.stub().resolves("val");
        friend_list.__set__("gremoveReceivedRequest", removeReceivedRequest);
        let createFriendConnection = sandbox.stub().resolves("val");
        friend_list.__set__("createFriendConnection", createFriendConnection);
        await acceptFriendRequest("user#0000", "friend#0000");
    });

    it("Test sendRequest", async function() {
        let sendRequest = friend_list.__get__("sendRequest")
        let leanStub = sandbox.stub().resolves("val");
        let updateOneStub = sandbox.stub(mongoose.Model, "updateOne").returns({lean:leanStub});

        await sendRequest("user#0000", "friend#0000");
    });

    it("Test verifyFriendNameNotUsername when user is not friendName", async function() {
        req.session.username = "user#0000"
        req.body.friendName = "friend#0000";
        let verifyFriendNameNotUsername = friend_list.__get__("verifyFriendNameNotUsername");
        await verifyFriendNameNotUsername(req, res, next);
        expect(next).to.be.called;
    });

    it("Test verifyFriendNameNotUsername when user is friendName", async function() {
        req.session.username = "user#0000"
        req.body.friendName = "user#0000";
        let verifyFriendNameNotUsername = friend_list.__get__("verifyFriendNameNotUsername");
        await verifyFriendNameNotUsername(req, res, next);
        expect(res.status).to.equal(404)
    });

    it("Test verifyFriendExists when friend name does exist", async function() {
        req.body.friendName = "user#0000";
        let existingUserStub = sandbox.stub().resolves(false);
        friend_list.__set__("isExistingUser", existingUserStub);

        let verifyFriendExists = friend_list.__get__("verifyFriendExists");
        await verifyFriendExists(req, res, next);
        expect(res.status).to.equal(404)
    });

    it("Test verifyFriendExists when friend does exist", async function() {
        req.body.friendName = "user#0000";
        let existingUserStub = sandbox.stub().resolves(true);
        friend_list.__set__("isExistingUser", existingUserStub);

        let verifyFriendExists = friend_list.__get__("verifyFriendExists");
        await verifyFriendExists(req, res, next);
        expect(next).to.be.called;
    });

    it("Test notifyFriend() runs successfully", async function(){
        let sendNotificationToUsersStub = sandbox.stub()
        friend_list.__set__("sendNotificationToUsers", sendNotificationToUsersStub);
        let notifyFriend = friend_list.__get__("notifyFriend");
        await notifyFriend("user#0000", "friend#0000", " is friend");
        expect(sendNotificationToUsersStub).to.be.called;
    });

    describe("Test sendFriendRequest", () =>{
        let getUserFriendDocumentStub;
        let isRequestSentAlreadyStub;
        let isBlockingStub;
        let isBlockedByStub;
        let isFriendStub;
        let isRequestReceivedStub;
        let acceptFriendRequestStub;
        let sendRequestStub;
        let notifyFriendStub;
        let sendFriendRequest;

        beforeEach(()=>{
            req.session.username = "user#0000";
            req.body.friendName = "friend#0000";
            getUserFriendDocumentStub = sandbox.stub().returns(true);
            isRequestSentAlreadyStub = sandbox.stub().returns(true);
            isBlockingStub = sandbox.stub().returns(true);
            isBlockedByStub = sandbox.stub().returns(true);
            isFriendStub = sandbox.stub().returns(true);
            isRequestReceivedStub = sandbox.stub().returns(true);
            acceptFriendRequestStub = sandbox.stub().returns(true);
            sendRequestStub = sandbox.stub().returns(true);
            notifyFriendStub = sandbox.stub().returns(true);
            friend_list.__set__("getUserFriendDocument", getUserFriendDocumentStub);
            friend_list.__set__("isRequestSentAlready", isRequestSentAlreadyStub);
            friend_list.__set__("isBlocking", isBlockingStub);
            friend_list.__set__("isBlockedBy", isBlockedByStub);
            friend_list.__set__("isFriend", isFriendStub);
            friend_list.__set__("isRequestReceived", isRequestReceivedStub);
            friend_list.__set__("acceptFriendRequest", acceptFriendRequestStub);
            friend_list.__set__("sendRequest", sendRequestStub);
            friend_list.__set__("notifyFriend", notifyFriendStub);
            sendFriendRequest = friend_list.__get__("sendFriendRequest")
        })

        it("Test request sent already", async () =>{
            isRequestSentAlreadyStub = sandbox.stub().returns(true)
            await sendFriendRequest(req, res);
            expect(JSON.parse(res.data)).to.equal("You have already sent friend#0000 a friend request.")
        })

        it("Test request sent already", async () =>{
            isRequestSentAlreadyStub.returns(false)
            isBlockingStub.returns(true)
            let unblockStub = sandbox.stub();
            friend_list.__set__("unblock", unblockStub);
            await sendFriendRequest(req, res);
            expect(unblockStub).to.be.called;
        })

        it("Test user is blockedBy", async () =>{
            isRequestSentAlreadyStub.returns(false)
            isBlockingStub.returns(false)
            isBlockedByStub.returns(true)
            await sendFriendRequest(req, res);
            expect(JSON.parse(res.data)).to.equal("You are blocked by friend#0000.");
        })

        it("Test user is Friend", async () =>{
            isRequestSentAlreadyStub.returns(false)
            isBlockingStub.returns(false)
            isBlockedByStub.returns(false)
            await sendFriendRequest(req, res);
            expect(JSON.parse(res.data)).to.equal("You were already friends with friend#0000.");
        })

        it("Test user has a received request", async () =>{
            isRequestSentAlreadyStub.returns(false)
            isBlockingStub.returns(false)
            isBlockedByStub.returns(false)
            isFriendStub.returns(false);
            isRequestReceivedStub.returns(true);
            let acceptFriendRequestStub = sandbox.stub();
            friend_list.__set__("acceptFriendRequest", acceptFriendRequestStub);
            await sendFriendRequest(req, res);
            expect(res.status).to.equal(200);
            expect(acceptFriendRequestStub).to.be.called;
            expect(JSON.parse(res.data)).to.equal(
                "You were automatically added as a friend because friend#0000 had already sent you a friend request.");
        })

        it("Test user has a received request", async () =>{
            isRequestSentAlreadyStub.returns(false)
            isBlockingStub.returns(false)
            isBlockedByStub.returns(false)
            isFriendStub.returns(false);
            isRequestReceivedStub.returns(false);
            await sendFriendRequest(req, res);
            expect(res.status).to.equal(200);
            expect(sendRequestStub).to.be.called;
            expect(notifyFriendStub).to.be.called;
            expect(JSON.parse(res.data)).to.equal(
                "Successfully sent friend#0000 a friend request.");
        })
    })

    it("Test acceptReceivedRequest", async function() {
        req.session.username = "user#0000";
        req.body.friendName = "friend#0000";
        let acceptFriendRequestStub = sandbox.stub();
        let notifyFriendStub = sandbox.stub();
        friend_list.__set__("acceptFriendRequest",acceptFriendRequestStub)
        friend_list.__set__("notifyFriend", notifyFriendStub)
        let acceptReceivedRequest = friend_list.__get__("acceptReceivedRequest")
        await acceptReceivedRequest(req, res);
        expect(res.status).to.equal(200);
    });

    it("Test removeRequest", async function() {
        req.session.username = "user#0000"
        let removeRequest = friend_list.__get__("removeRequest")
        let findStub = sandbox.stub(mongoose.Model, "bulkWrite");
        await removeRequest("user#0000", "friend#0000");
    });

    it("Test callRemoveSentRequest", async function() {
        req.session.username = "user#0000";
        req.body.friendName = "friend#0000";
        let callRemoveSentRequest = friend_list.__get__("callRemoveSentRequest")
        let removeSentRequestStub = sandbox.stub();
        friend_list.__set__("removeSentRequest", removeSentRequestStub);
        await callRemoveSentRequest(req, res);
        expect(res.status).to.equal(200);
    });

    it("Test removeSentRequest", async function() {
        let removeSentRequest = friend_list.__get__("removeSentRequest")
        let removeRequestStub = sandbox.stub();
        friend_list.__set__("removeRequest", removeRequestStub);
        await removeSentRequest("user#0000", "user#0001");
        expect(removeRequestStub).to.be.calledWith("user#0000", "user#0001")
    });

    it("Test removeReceivedRequest", async function() {
        let removeReceivedRequest = friend_list.__get__("removeReceivedRequest")
        let removeRequestStub = sandbox.stub();
        friend_list.__set__("removeRequest", removeRequestStub);
        await removeReceivedRequest("user#0000", "user#0001");
        expect(removeRequestStub).to.be.calledWith("user#0001", "user#0000")
    });

    it("Test callRemoveReceivedRequest", async function() {
        req.session.username = "user#0000";
        req.body.friendName = "friend#0000";
        let callRemoveReceivedRequest = friend_list.__get__("callRemoveReceivedRequest")
        let removeReceivedRequestStub = sandbox.stub();
        friend_list.__set__("removeReceivedRequest", removeReceivedRequestStub);
        await callRemoveReceivedRequest(req, res);
        expect(res.status).to.equal(200);
    });

    it("Test callUnblockUser", async function() {
        req.session.username = "user#0000";
        req.body.friendName = "friend#0000";
        let callUnblockUser = friend_list.__get__("callUnblockUser")
        let unblockUserStub = sandbox.stub();
        friend_list.__set__("unblockUser", unblockUserStub);
        await callUnblockUser(req, res);
        expect(res.status).to.equal(200);
    });

    it("Test blockUser", async function() {
        req.session.username = "user#0000"
        let blockUser = friend_list.__get__("blockUser")
        let findStub = sandbox.stub(mongoose.Model, "bulkWrite");
        await blockUser("user#0000", "friend#0000");
    });

    it("Test setUpBlockUser", async function() {
        req.session.username = "user#0000";
        req.body.friendName = "friend#0000";
        let setUpBlockUser = friend_list.__get__("setUpBlockUser")
        let blockUserStub = sandbox.stub();
        friend_list.__set__("blockUser", blockUserStub);
        await setUpBlockUser(req, res);
        expect(res.status).to.equal(200);
    });

    it("Test recommended with fewer than 5 users", async () =>{
        req.session.username = "user#0000"
        let leanStub = sandbox.stub().resolves("val");
        let distinctStub = sandbox.stub().resolves("val");
        let limitStub = sandbox.stub().returns({lean:leanStub});
        let findStub = sandbox.stub(Friend_connection, "find").returns({distinct:distinctStub, limit:limitStub});
        let getSortedFieldFrequency = sandbox.stub().resolves([])
        friend_list.__set__("getSortedFieldFrequency", getSortedFieldFrequency)

        let getRecommended = friend_list.__get__("getRecommended");
        await getRecommended(req, res, next);
        expect(res.status).to.equal(200);
        expect(JSON.parse(res.data)).to.deep.equal([]);
    });

    it("Test recommended with more than 5 users", async () =>{
        req.session.username = "user#0000"
        let leanStub = sandbox.stub().resolves("val");
        let distinctStub = sandbox.stub().resolves("val");
        let limitStub = sandbox.stub().returns({lean:leanStub});
        let findStub = sandbox.stub(Friend_connection, "find").returns({distinct:distinctStub, limit:limitStub});
        let getSortedFieldFrequency = sandbox.stub().resolves(["1","2","3", "4", "5", "6"])
        friend_list.__set__("getSortedFieldFrequency", getSortedFieldFrequency)

        let getRecommended = friend_list.__get__("getRecommended");
        await getRecommended(req, res, next);
        expect(res.status).to.equal(200);
        expect(JSON.parse(res.data)).to.deep.equal(["1","2","3", "4", "5"]);
    });

    it("Test recent activity", async () =>{
        req.session.username = "user#0000"
        let leanStub = sandbox.stub().resolves("val");
        let distinctStub = sandbox.stub().resolves("val");
        let findStub = sandbox.stub(Friend_connection, "find").returns({distinct:distinctStub});
        let limitStub = sandbox.stub().returns({lean:leanStub});
        let sortStub = sandbox.stub().returns({limit:limitStub})
        let findExerciseStub = sandbox.stub(Exercise_log, "find").returns({sort:sortStub});
        let getRecentActivity = friend_list.__get__("getRecentActivity");
        await getRecentActivity(req, res, next);
        expect(res.status).to.equal(200);
        expect(JSON.parse(res.data)).to.equal("val");
    });



});