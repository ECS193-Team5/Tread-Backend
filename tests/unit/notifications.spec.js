const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();
const mongoose = require("mongoose");
const firebase = require("firebase-admin");

describe("Testing notifications", () => {
    let notifications;

    beforeEach(() => {
        notifications = rewire("../../routes/notifications.js");
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("Testing registerDeviceToken()", () => {
        let registerDeviceToken;
        let updateStub;
        let dateStub;
        const twoMonthsInMiliSeconds = 1000*60*60*24*60;4444;
        const badUsername = "";
        const badDeviceToken = "";
        const username = 'user#2222';
        const deviceToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk2OTcxODA4Nzk2ODI5YTk3MmU3OWE5ZDFhOWZmZjExY2Q2MWIxZTMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2ODIwMzI1MzQsImF1ZCI6IjE3MTU3MTY1Mzg2OS1sczVpcWRsbzFib2U2aXNqN3Ixa29vMnR2aTU3ZzYybS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwODg3NjU4MDczNDk0MTE3OTkyNCIsImVtYWlsIjoiaG93YXJkdzExN0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXpwIjoiMTcxNTcxNjUzODY5LWxzNWlxZGxvMWJvZTZpc2o3cjFrb28ydHZpNTdnNjJtLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwibmFtZSI6Ikhvd2FyZCBXYW5nIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FHTm15eGJqZENkZW5OdF9yc2g2d0tHS0ZxSElzbm1XUjNxcmM0b0ZlY2c4a3c9czk2LWMiLCJnaXZlbl9uYW1lIjoiSG93YXJkIiwiZmFtaWx5X25hbWUiOiJXYW5nIiwiaWF0IjoxNjgyMDMyODM0LCJleHAiOjE2ODIwMzY0MzQsImp0aSI6ImY3NWVjZDI0MGE1YzkwNmIzNjI1OTliOWE0ZWUwNDE2YjQ3ZDVlMTIifQ.qeFtF3_9zlCbexLZzr6iEGz4RXWU2aCSCl9MDddTYzR0hfXMc4S_bpEH1FtFXELhB3zozzMKH-ox3xBU7lLzwFj29jPPkHZOhU-V6GldSwZbVl7iSpm2Sfek9Xw_NW012wEi9CpKSKDlpFIxmGEyGDUBa5lpdowRAbdwVX43Pq_mo_H-tSqfwzI3Gb55CinbABqRHO1yRV_KReKQ0fsi28kuNhMdEtszYJq79XfvdAKpyi7lcghYfU5l-Vsz58VfB9X1AnRDj-Rfn8nGBrLangRfKfYgFTWNTtetXzLlugcif8UseK1AgrhIcIb3f4h2MAXvVXjV8N2b1GUVmyzy6A'
        beforeEach(() => {
            registerDeviceToken = notifications.__get__("registerDeviceToken");
            updateStub = sandbox.stub(mongoose.Model, "updateOne");
            dateStub = sandbox.stub(Date, "now").returns(1);
        });

        it("calls updateOne()", async function() {
            await registerDeviceToken(username, deviceToken);
            expect(updateStub).to.have.been.calledWith({
                deviceToken: deviceToken,
            }, {username: username, expires: 1 + twoMonthsInMiliSeconds},
            {upsert: true});
        });

        it("returns if token not vaild not vaild", async function() {
            await registerDeviceToken(username, badDeviceToken);
            expect(updateStub).to.not.have.been.called;
        });

        it("returns if token not vaild not vaild", async function() {
            await registerDeviceToken(badUsername, deviceToken);
            expect(updateStub).to.not.have.been.called;
        });

        it("throws when updateOne rejects", async function() {
            updateStub.rejects();
            let registerDeviceTokenSpy = sandbox.spy(registerDeviceToken);
            try {
                await registerDeviceToken(username, deviceToken);
            } catch {
            }
            expect(registerDeviceTokenSpy).to.have.been.thrown;
            expect(updateStub).to.have.been.calledWith({
                deviceToken: deviceToken,
            }, {username: username, expires: 1 + twoMonthsInMiliSeconds},
            {upsert: true});
        });
    });

    describe("Testing removeDeviceToken()", () => {
        let removeDeviceToken;
        let deleteStub;
        const username = 'user#2222';
        const deviceToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk2OTcxODA4Nzk2ODI5YTk3MmU3OWE5ZDFhOWZmZjExY2Q2MWIxZTMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2ODIwMzI1MzQsImF1ZCI6IjE3MTU3MTY1Mzg2OS1sczVpcWRsbzFib2U2aXNqN3Ixa29vMnR2aTU3ZzYybS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwODg3NjU4MDczNDk0MTE3OTkyNCIsImVtYWlsIjoiaG93YXJkdzExN0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXpwIjoiMTcxNTcxNjUzODY5LWxzNWlxZGxvMWJvZTZpc2o3cjFrb28ydHZpNTdnNjJtLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwibmFtZSI6Ikhvd2FyZCBXYW5nIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FHTm15eGJqZENkZW5OdF9yc2g2d0tHS0ZxSElzbm1XUjNxcmM0b0ZlY2c4a3c9czk2LWMiLCJnaXZlbl9uYW1lIjoiSG93YXJkIiwiZmFtaWx5X25hbWUiOiJXYW5nIiwiaWF0IjoxNjgyMDMyODM0LCJleHAiOjE2ODIwMzY0MzQsImp0aSI6ImY3NWVjZDI0MGE1YzkwNmIzNjI1OTliOWE0ZWUwNDE2YjQ3ZDVlMTIifQ.qeFtF3_9zlCbexLZzr6iEGz4RXWU2aCSCl9MDddTYzR0hfXMc4S_bpEH1FtFXELhB3zozzMKH-ox3xBU7lLzwFj29jPPkHZOhU-V6GldSwZbVl7iSpm2Sfek9Xw_NW012wEi9CpKSKDlpFIxmGEyGDUBa5lpdowRAbdwVX43Pq_mo_H-tSqfwzI3Gb55CinbABqRHO1yRV_KReKQ0fsi28kuNhMdEtszYJq79XfvdAKpyi7lcghYfU5l-Vsz58VfB9X1AnRDj-Rfn8nGBrLangRfKfYgFTWNTtetXzLlugcif8UseK1AgrhIcIb3f4h2MAXvVXjV8N2b1GUVmyzy6A'
        beforeEach(() => {
            removeDeviceToken = notifications.__get__("removeDeviceToken");
            deleteStub = sandbox.stub(mongoose.Model, "deleteOne");
        });

        it("calls deleteOne()", async function() {
            await removeDeviceToken(username, deviceToken);
            expect(deleteStub).to.have.been.calledWith({username: username, deviceToken: deviceToken});
        });

        it("throws when deleteOne() rejects", async function() {
            deleteStub.rejects();
            let removeDeviceTokenSpy = sandbox.spy(removeDeviceToken);
            try {
                await removeDeviceToken(username, deviceToken);
            } catch {
            }
            expect(removeDeviceTokenSpy).to.have.been.thrown;
            expect(deleteStub).to.have.been.calledWith({username: username, deviceToken: deviceToken});
        });
    });

    describe("Testing removeMultipleDeviceTokens()", () => {
        let removeMultipleDeviceTokens;
        let deleteStub;
        const deviceTokens = ['eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk2OTcxODA4Nzk2ODI5YTk3MmU3OWE5ZDFhOWZmZjExY2Q2MWIxZTMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2ODIwMzI1MzQsImF1ZCI6IjE3MTU3MTY1Mzg2OS1sczVpcWRsbzFib2U2aXNqN3Ixa29vMnR2aTU3ZzYybS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwODg3NjU4MDczNDk0MTE3OTkyNCIsImVtYWlsIjoiaG93YXJkdzExN0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXpwIjoiMTcxNTcxNjUzODY5LWxzNWlxZGxvMWJvZTZpc2o3cjFrb28ydHZpNTdnNjJtLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwibmFtZSI6Ikhvd2FyZCBXYW5nIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FHTm15eGJqZENkZW5OdF9yc2g2d0tHS0ZxSElzbm1XUjNxcmM0b0ZlY2c4a3c9czk2LWMiLCJnaXZlbl9uYW1lIjoiSG93YXJkIiwiZmFtaWx5X25hbWUiOiJXYW5nIiwiaWF0IjoxNjgyMDMyODM0LCJleHAiOjE2ODIwMzY0MzQsImp0aSI6ImY3NWVjZDI0MGE1YzkwNmIzNjI1OTliOWE0ZWUwNDE2YjQ3ZDVlMTIifQ.qeFtF3_9zlCbexLZzr6iEGz4RXWU2aCSCl9MDddTYzR0hfXMc4S_bpEH1FtFXELhB3zozzMKH-ox3xBU7lLzwFj29jPPkHZOhU-V6GldSwZbVl7iSpm2Sfek9Xw_NW012wEi9CpKSKDlpFIxmGEyGDUBa5lpdowRAbdwVX43Pq_mo_H-tSqfwzI3Gb55CinbABqRHO1yRV_KReKQ0fsi28kuNhMdEtszYJq79XfvdAKpyi7lcghYfU5l-Vsz58VfB9X1AnRDj-Rfn8nGBrLangRfKfYgFTWNTtetXzLlugcif8UseK1AgrhIcIb3f4h2MAXvVXjV8N2b1GUVmyzy6A']
        beforeEach(() => {
            removeMultipleDeviceTokens = notifications.__get__("removeMultipleDeviceTokens");
            deleteStub = sandbox.stub(mongoose.Model, "deleteMany");
        });

        it("calls deleteMany()", async function() {
            await removeMultipleDeviceTokens(deviceTokens);
            expect(deleteStub).to.have.been.calledWith({deviceToken: {$in: deviceTokens}});
        });

        it("throws when deleteMany() rejects", async function() {
            deleteStub.rejects();
            let removeDeviceTokenSpy = sandbox.spy(removeMultipleDeviceTokens);
            try {
                await removeMultipleDeviceTokens(deviceTokens);
            } catch {
            }
            expect(removeDeviceTokenSpy).to.have.been.thrown;
            expect(deleteStub).to.have.been.calledWith({deviceToken: {$in: deviceTokens}});
        });
    });

    describe("Testing getDeviceTokens()", () => {
        let getDeviceTokens;
        let findStub;
        let distinctStub;
        const usernames = ['user#2222', 'user#1111'];
        beforeEach(() => {
            getDeviceTokens = notifications.__get__("getDeviceTokens");
            distinctStub = sandbox.stub();
            findStub = sandbox.stub(mongoose.Model, "find").returns({distinct: distinctStub});
        });

        it("calls find()", async function() {
            await getDeviceTokens(usernames);
            expect(findStub).to.have.been.calledWith({username: {$in: usernames}});
            expect(distinctStub).to.have.been.calledWith('deviceToken');
        });

        it("throws when find() rejects", async function() {
            distinctStub.rejects();
            let getDeviceTokensSpy = sandbox.spy(getDeviceTokens);
            try {
                await getDeviceTokens(usernames);
            } catch {
            }
            expect(getDeviceTokensSpy).to.have.been.thrown;
            expect(distinctStub).to.have.been.calledWith('deviceToken');
            expect(findStub).to.have.been.calledWith({username: {$in: usernames}});
        });
    });

    describe("Testing sendMessageToDevices()", () => {
        let sendMessageToDevices;
        let messageStub;
        let sendMulticastStub;
        let removeMultipleDeviceTokensStub;
        const message = {
            tokens: ['token1', 'token2'],
            notification:{
                title: 'title',
                body: ""
            },
            data: {
                page: 'thisPage'
            }
        }

        beforeEach(() => {
            sendMessageToDevices = notifications.__get__('sendMessageToDevices');
            sendMulticastStub = sandbox.stub();
            messageFunctionStub = sandbox.stub().returns({sendMulticast: sendMulticastStub});
            messageStub = sandbox.stub(firebase, 'messaging').get(() => {return messageFunctionStub});
            removeMultipleDeviceTokensStub = sandbox.stub();
            notifications.__set__('removeMultipleDeviceTokens', removeMultipleDeviceTokensStub);
        });

        it("calls correctly with failureCount of 0", async function() {
            sendMulticastStub.resolves({
                failureCount: 0,
                responses: [
                    {success: true},
                    {success: true}
                ]
            });

            await sendMessageToDevices(message);
            expect(messageFunctionStub).to.have.been.called;
            expect(sendMulticastStub).to.have.been.calledWith(message);
            expect(removeMultipleDeviceTokensStub).to.not.have.been.called;
        });

        it("calls correctly with failureCount of 1 invalid-argument", async function() {
            sendMulticastStub.resolves({
                failureCount: 1,
                responses: [
                    {success: true},
                    {success: false, error: {code: "messaging/invalid-argument"}}
                ]
            });

            await sendMessageToDevices(message);
            expect(messageFunctionStub).to.have.been.called;
            expect(sendMulticastStub).to.have.been.calledWith(message);
            expect(removeMultipleDeviceTokensStub).to.have.been.calledWith(['token2']);
        });

        it("calls correctly with failureCount of 1 unregistered", async function() {
            sendMulticastStub.resolves({
                failureCount: 1,
                responses: [
                    {success: true},
                    {success: false, error: {code: "messaging/unregistered"}}
                ]
            });

            await sendMessageToDevices(message);
            expect(messageFunctionStub).to.have.been.called;
            expect(sendMulticastStub).to.have.been.calledWith(message);
            expect(removeMultipleDeviceTokensStub).to.have.been.calledWith(['token2']);
        });
        it("calls correctly with failureCount of 1 other errors", async function() {
            sendMulticastStub.resolves({
                failureCount: 1,
                responses: [
                    {success: true},
                    {success: false, error: {code: "messaging/other"}}
                ]
            });

            await sendMessageToDevices(message);
            expect(messageFunctionStub).to.have.been.called;
            expect(sendMulticastStub).to.have.been.calledWith(message);
            expect(removeMultipleDeviceTokensStub).to.have.been.calledWith([]);
        });

        it("calls correctly with failureCount of 1 other errors", async function() {
            sendMulticastStub.rejects();
            let sendMessageToDevicesStub = sandbox.spy(sendMessageToDevices);
            try {
                await sendMessageToDevices(message);
            } catch {}
            expect(messageFunctionStub).to.have.been.called;
            expect(sendMulticastStub).to.have.been.calledWith(message);
            expect(removeMultipleDeviceTokensStub).to.not.have.been.called;
            expect(sendMessageToDevicesStub).to.have.thrown;
        });

        it("calls correctly with failureCount of 1 other errors", async function() {
            sendMulticastStub.resolves({
                failureCount: 1,
                responses: [
                    {success: true},
                    {success: false, error: {code: "messaging/other"}}
                ]
            });
            removeMultipleDeviceTokensStub.rejects();
            let sendMessageToDevicesStub = sandbox.spy(sendMessageToDevices);
            try {
                await sendMessageToDevices(message);
            } catch {}
            expect(messageFunctionStub).to.have.been.called;
            expect(sendMulticastStub).to.have.been.calledWith(message);
            expect(removeMultipleDeviceTokensStub).to.have.been.calledWith([]);
            expect(sendMessageToDevicesStub).to.have.thrown;
        });
    });

    describe("Testing sendPushNotificationToUsers()", () => {
        let usernames = ['user1', 'user2'];
        let messageBody = 'notification body';
        let page = 'page';
        let getDeviceTokensStub;
        let sendMessageToDevices;
        let sendPushNotificationToUsers

        beforeEach(() => {
            getDeviceTokensStub = sandbox.stub();
            sendMessageToDevices = sandbox.stub();
            sendPushNotificationToUsers = notifications.__get__('sendPushNotificationToUsers');
            notifications.__set__('getDeviceTokens', getDeviceTokensStub);
            notifications.__set__('sendMessageToDevices', sendMessageToDevices);
        });

        it("sendPushNotificationToUsers() returns successfully", async function() {
            getDeviceTokensStub.resolves(["token1", "token2"]);
            sendMessageToDevices.resolves();
            await sendPushNotificationToUsers(usernames, messageBody, page);
            expect(getDeviceTokensStub).to.have.been.calledWith(['user1', 'user2']);
            expect(sendMessageToDevices).to.have.been.calledWith({
                tokens: ["token1", "token2"],
                notification:{
                    title: "Tread",
                    body: 'notification body'
                },
                data: {
                    page: 'page'
                }
            });
        });

        it("sendPushNotificationToUsers() returns if no tokens", async function() {
            getDeviceTokensStub.resolves([]);
            sendMessageToDevices.resolves();
            await sendPushNotificationToUsers(usernames, messageBody, page);
            expect(sendMessageToDevices).to.not.have.been.called;
        });

        it("sendPushNotificationToUsers() throws if getDeviceTokens throws", async function() {
            getDeviceTokensStub.rejects([]);
            sendMessageToDevices.resolves();
            try {
                await sendPushNotificationToUsers(usernames, messageBody, page);
            } catch {}
            expect(getDeviceTokensStub).to.have.thrown;
            expect(sendMessageToDevices).to.not.have.been.called;
        });

        it("sendPushNotificationToUsers() throws if sendMessageToDevices throws", async function() {
            getDeviceTokensStub.resolves(['token']);
            sendMessageToDevices.resolves();
            try {
                await sendPushNotificationToUsers(usernames, messageBody, page);
            } catch {}
            expect(getDeviceTokensStub).to.have.been.called;
            expect(sendMessageToDevices).to.have.thrown;
        });
    });

    describe("Testing updateNotificationLog()", () => {
        let usernames;
        let message;
        let insertManyStub;
        let updateNotificationLog;

        beforeEach(() => {
            updateNotificationLog = notifications.__get__("updateNotificationLog");
            insertManyStub = sandbox.stub(mongoose.Model, "insertMany");
        });

        it("updateNotificationLog() inserts notifications correctly", async function() {
            usernames = ["user1", "user2"];
            message = "message";
            insertManyStub.resolves();
            await updateNotificationLog(usernames, message);
            expect(insertManyStub).to.have.been.calledWith([
                { username: "user1", message: "message" },
                { username: "user2", message: "message" }
            ], {ordered: false});
        });

        it("updateNotificationLog() throws when insertMany() rejects", async function() {
            usernames = ["user1", "user2"];
            message = "message";
            insertManyStub.rejects();
            try {
                await updateNotificationLog(usernames, message);
            } catch { }
            expect(insertManyStub).to.have.been.calledWith([
                { username: "user1", message: "message" },
                { username: "user2", message: "message" }
            ], {ordered: false});
            expect(insertManyStub).to.have.thrown;
        });
    });

    describe("Testing sendNotificationToUsers", () => {
        let sendNotificationToUsers;
        const usernames = ["user1", "user2"];
        const message = "message";
        const page = "page";
        let sendPushNotificationToUsersStub;
        let updateNotificationLogStub;

        beforeEach(() => {
            sendNotificationToUsers = notifications.__get__("sendNotificationToUsers");
            sendPushNotificationToUsersStub = sandbox.stub();
            updateNotificationLogStub = sandbox.stub();
            notifications.__set__("sendPushNotificationToUsers", sendPushNotificationToUsersStub);
            notifications.__set__("updateNotificationLog", updateNotificationLogStub);
        });

        it("sendNotificationToUsers() runs correctly", async function() {
            await sendNotificationToUsers(usernames, message, page);
            expect(sendPushNotificationToUsersStub).to.have.been.calledWith(
                usernames, message, page
            );
            expect(updateNotificationLogStub).to.have.been.calledWith(
                usernames, message
            );
        });

        it("sendNotificationToUsers() throws when sendPushNotificationToUsers throws", async function() {
            sendPushNotificationToUsersStub.rejects();
            updateNotificationLogStub.resolves();
            await sendNotificationToUsers(usernames, message, page);
            expect(sendPushNotificationToUsersStub).to.have.been.calledWith(
                usernames, message, page
            );
            expect(updateNotificationLogStub).to.have.been.calledWith(
                usernames, message
            );
            expect(sendPushNotificationToUsersStub).to.have.thrown;
        });

        it("sendNotificationToUsers() throws when updateNotificationLog throws", async function() {
            sendPushNotificationToUsersStub.rejects();
            updateNotificationLogStub.resolves();
            await sendNotificationToUsers(usernames, message, page);
            expect(sendPushNotificationToUsersStub).to.have.been.calledWith(
                usernames, message, page
            );
            expect(updateNotificationLogStub).to.have.been.calledWith(
                usernames, message
            );
            expect(updateNotificationLogStub).to.have.thrown;
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

        describe("Testing getNotifications()", () => {
            let findStub;
            let sortStub;
            let leanStub;
            let getNotifications;

            beforeEach(() => {
                req.session.username = "user";
                getNotifications = notifications.__get__("getNotifications")
                leanStub = sandbox.stub();
                sortStub = sandbox.stub().returns({lean: leanStub});
                findStub = sandbox.stub(mongoose.Model, "find").returns({sort: sortStub});
            });

            it("getNotifications() returns correctly", async function() {
                leanStub.resolves("data");
                await getNotifications(req, res);
                expect(findStub).to.have.been.calledWith({username: req.session.username});
                expect(res.status).to.equal(200);
                expect(JSON.parse(res.data)).to.deep.equal("data");
            });
            it("getNotifications() returns 500 on error", async function() {
                leanStub.rejects();
                await getNotifications(req, res);
                expect(findStub).to.have.been.calledWith({username: req.session.username});
                expect(res.status).to.equal(500);
            });
        });

        describe("Testing deleteNotification()", () => {
            let deleteOneStub;
            let leanStub;
            let deleteNotification;

            beforeEach(() => {
                req.session.username = "user";
                req.body.notificationID = "a12345";
                deleteNotification = notifications.__get__("deleteNotification")
                leanStub = sandbox.stub();
                deleteOneStub = sandbox.stub(mongoose.Model, "deleteOne").returns({lean: leanStub});
            });

            it("deleteNotification() returns correctly", async function() {
                leanStub.resolves("data");
                await deleteNotification(req, res);
                expect(deleteOneStub).to.have.been.calledWith({
                    _id: req.body.notificationID,
                    username: req.session.username
                });
                expect(res.status).to.equal(200);
            });
            it("deleteNotification() returns 500 on error", async function() {
                leanStub.rejects();
                await deleteNotification(req, res);
                expect(deleteOneStub).to.have.been.calledWith({
                    _id: req.body.notificationID,
                    username: req.session.username
                });
                expect(res.status).to.equal(500);
            });
        });

        describe("Testing deleteAllNotifications()", () => {
            let deleteOneStub;
            let leanStub;
            let deleteAllNotifications;

            beforeEach(() => {
                req.session.username = "user";
                req.body.notificationID = "a12345";
                deleteAllNotifications = notifications.__get__("deleteAllNotifications")
                leanStub = sandbox.stub();
                deleteOneStub = sandbox.stub(mongoose.Model, "deleteMany").returns({lean: leanStub});
            });

            it("deleteAllNotifications() returns correctly", async function() {
                leanStub.resolves("data");
                await deleteAllNotifications(req, res);
                expect(deleteOneStub).to.have.been.calledWith({
                    username: req.session.username
                });
                expect(res.status).to.equal(200);
            });
            it("deleteAllNotifications() returns 500 on error", async function() {
                leanStub.rejects();
                await deleteAllNotifications(req, res);
                expect(deleteOneStub).to.have.been.calledWith({
                    username: req.session.username
                });
                expect(res.status).to.equal(500);
            });
        });
    });
});