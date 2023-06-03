const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();
const mongoose = require("mongoose");

describe("Testing data_origin", () =>{
    let dataOrigin;

    beforeEach(() => {
        dataOrigin = rewire("../../routes/data_origin.js");
    });

    afterEach(() => {
        sandbox.restore();
    })

    describe("Testing touchDataOriginAnchor()", () => {
        let updateOneStub;
        let touchDataOriginAnchor;
        const username = "username";
        const anchor = 55555555;
        let dataOriginParameter;

        beforeEach(() => {
            dataOriginParameter = "";
            touchDataOriginAnchor = dataOrigin.__get__("touchDataOriginAnchor");
            updateOneStub = sandbox.stub(mongoose.Model, "updateOne");
        });

        it("touchDataOriginAnchor() returns successfully from healthKit", async function() {
            dataOriginParameter = "healthKit";
            await touchDataOriginAnchor(username, dataOriginParameter, anchor);
            expect(updateOneStub).to.have.been.calledWith(
                { username: username },
                {healthKitAnchor: anchor},
                { upsert: true }
            );
        });

        it("touchDataOriginAnchor() returns successfully from healthConnect", async function() {
            dataOriginParameter = "healthConnect";
            updateOneStub.resolves();
            await touchDataOriginAnchor(username, dataOriginParameter, anchor);
            expect(updateOneStub).to.have.been.calledWith(
                { username: username },
                {healthConnectAnchor: anchor},
                { upsert: true }
            );
        });

        it("touchDataOriginAnchor() returns successfully when not either", async function() {
            dataOriginParameter = "other";
            await touchDataOriginAnchor(username, dataOriginParameter, anchor);
            expect(updateOneStub).to.not.have.been.called;
        });

        it("touchDataOriginAnchor() throws when updateOne() rejects", async function() {
            dataOriginParameter = "healthKit";
            updateOneStub.rejects();
            try {
                await touchDataOriginAnchor(username, dataOriginParameter, anchor);
            } catch {}
            expect(updateOneStub).to.have.been.calledWith(
                { username: username },
                { healthKitAnchor: anchor },
                { upsert: true }
            );
            expect(updateOneStub).to.have.thrown;
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

        describe("Testing getOriginAnchor()", () => {
            let getOriginAnchor;
            let findOneStub;
            let leanStub;
            const getOriginAnchorResult = {originAnchor: 45544566};

            beforeEach(() => {
                req.session.username = "username";
                req.body.dataOrigin = "origin";
                getOriginAnchor = dataOrigin.__get__("getOriginAnchor");
                leanStub = sandbox.stub();
                findOneStub = sandbox.stub(mongoose.Model, "findOne").returns({lean: leanStub});
            });

            it("getOriginAnchor() returns successfully", async function() {
                leanStub.resolves(getOriginAnchorResult);
                await getOriginAnchor(req, res);
                expect(findOneStub).to.have.been.calledWith(
                    { username: "username" },
                    "-_id originAnchor"
                );
                expect(res.status).to.equal(200);
                expect(JSON.parse(res.data)).to.deep.equal(getOriginAnchorResult);
            });

            it("getOriginAnchor() throws on error", async function() {
                leanStub.rejects(getOriginAnchorResult);
                try {
                    await getOriginAnchor(req, res);
                } catch {}
                expect(findOneStub).to.have.been.calledWith(
                    { username: "username" },
                    "-_id originAnchor"
                );
                expect(findOneStub).to.have.thrown;
            });
        });
    });

});