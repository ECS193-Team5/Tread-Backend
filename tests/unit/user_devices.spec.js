const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();
const mongoose = require("mongoose");
const firebase = require("firebase-admin");

describe("Testing user_devices", () => {
    let user_devices;

    beforeEach(() => {
        user_devices = rewire("../../routes/user_devices.js");
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("Testing registerDeviceToken()", () => {
        let registerDeviceToken;
        let updateStub;
        const twoMonthsInMiliSeconds = 1000*60*60*24*60;4444;
        const username = 'user#2222';
        const deviceToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk2OTcxODA4Nzk2ODI5YTk3MmU3OWE5ZDFhOWZmZjExY2Q2MWIxZTMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2ODIwMzI1MzQsImF1ZCI6IjE3MTU3MTY1Mzg2OS1sczVpcWRsbzFib2U2aXNqN3Ixa29vMnR2aTU3ZzYybS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwODg3NjU4MDczNDk0MTE3OTkyNCIsImVtYWlsIjoiaG93YXJkdzExN0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXpwIjoiMTcxNTcxNjUzODY5LWxzNWlxZGxvMWJvZTZpc2o3cjFrb28ydHZpNTdnNjJtLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwibmFtZSI6Ikhvd2FyZCBXYW5nIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FHTm15eGJqZENkZW5OdF9yc2g2d0tHS0ZxSElzbm1XUjNxcmM0b0ZlY2c4a3c9czk2LWMiLCJnaXZlbl9uYW1lIjoiSG93YXJkIiwiZmFtaWx5X25hbWUiOiJXYW5nIiwiaWF0IjoxNjgyMDMyODM0LCJleHAiOjE2ODIwMzY0MzQsImp0aSI6ImY3NWVjZDI0MGE1YzkwNmIzNjI1OTliOWE0ZWUwNDE2YjQ3ZDVlMTIifQ.qeFtF3_9zlCbexLZzr6iEGz4RXWU2aCSCl9MDddTYzR0hfXMc4S_bpEH1FtFXELhB3zozzMKH-ox3xBU7lLzwFj29jPPkHZOhU-V6GldSwZbVl7iSpm2Sfek9Xw_NW012wEi9CpKSKDlpFIxmGEyGDUBa5lpdowRAbdwVX43Pq_mo_H-tSqfwzI3Gb55CinbABqRHO1yRV_KReKQ0fsi28kuNhMdEtszYJq79XfvdAKpyi7lcghYfU5l-Vsz58VfB9X1AnRDj-Rfn8nGBrLangRfKfYgFTWNTtetXzLlugcif8UseK1AgrhIcIb3f4h2MAXvVXjV8N2b1GUVmyzy6A'
        beforeEach(() => {
            registerDeviceToken = user_devices.__get__("registerDeviceToken");
            updateStub = sandbox.stub(mongoose.Model, "updateOne");
        });

        it("calls updateOne()", async function() {
            await registerDeviceToken(username, deviceToken);
            expect(updateStub).to.have.been.calledWith({
                deviceToken: deviceToken,
            }, {username: username, expires: Date.now() + twoMonthsInMiliSeconds},
            {upsert: true});
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
            }, {username: username, expires: Date.now() + twoMonthsInMiliSeconds},
            {upsert: true});
        });
    });

    describe("Testing removeDeviceToken()", () => {
        let removeDeviceToken;
        let deleteStub;
        const username = 'user#2222';
        const deviceToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk2OTcxODA4Nzk2ODI5YTk3MmU3OWE5ZDFhOWZmZjExY2Q2MWIxZTMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2ODIwMzI1MzQsImF1ZCI6IjE3MTU3MTY1Mzg2OS1sczVpcWRsbzFib2U2aXNqN3Ixa29vMnR2aTU3ZzYybS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwODg3NjU4MDczNDk0MTE3OTkyNCIsImVtYWlsIjoiaG93YXJkdzExN0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXpwIjoiMTcxNTcxNjUzODY5LWxzNWlxZGxvMWJvZTZpc2o3cjFrb28ydHZpNTdnNjJtLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwibmFtZSI6Ikhvd2FyZCBXYW5nIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FHTm15eGJqZENkZW5OdF9yc2g2d0tHS0ZxSElzbm1XUjNxcmM0b0ZlY2c4a3c9czk2LWMiLCJnaXZlbl9uYW1lIjoiSG93YXJkIiwiZmFtaWx5X25hbWUiOiJXYW5nIiwiaWF0IjoxNjgyMDMyODM0LCJleHAiOjE2ODIwMzY0MzQsImp0aSI6ImY3NWVjZDI0MGE1YzkwNmIzNjI1OTliOWE0ZWUwNDE2YjQ3ZDVlMTIifQ.qeFtF3_9zlCbexLZzr6iEGz4RXWU2aCSCl9MDddTYzR0hfXMc4S_bpEH1FtFXELhB3zozzMKH-ox3xBU7lLzwFj29jPPkHZOhU-V6GldSwZbVl7iSpm2Sfek9Xw_NW012wEi9CpKSKDlpFIxmGEyGDUBa5lpdowRAbdwVX43Pq_mo_H-tSqfwzI3Gb55CinbABqRHO1yRV_KReKQ0fsi28kuNhMdEtszYJq79XfvdAKpyi7lcghYfU5l-Vsz58VfB9X1AnRDj-Rfn8nGBrLangRfKfYgFTWNTtetXzLlugcif8UseK1AgrhIcIb3f4h2MAXvVXjV8N2b1GUVmyzy6A'
        beforeEach(() => {
            removeDeviceToken = user_devices.__get__("removeDeviceToken");
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
            removeMultipleDeviceTokens = user_devices.__get__("removeMultipleDeviceTokens");
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
            getDeviceTokens = user_devices.__get__("getDeviceTokens");
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
        let firebaseStub;
        beforeEach(() => {
            sendMessageToDevices = user_devices.__get__('sendMessageToDevices');
            sendMulticastStub = sandbox.stub();
            messageFunctionStub = sandbox.stub().returns({sendMulticast: sendMulticastStub});
            messageStub = sandbox.stub(firebase, 'messaging').get(() => {return messageFunctionStub});
            removeMultipleDeviceTokensStub = sandbox.stub();
            user_devices.__set__('removeMultipleDeviceTokens', removeMultipleDeviceTokensStub);
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
});