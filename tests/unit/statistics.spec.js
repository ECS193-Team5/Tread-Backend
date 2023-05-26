const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();
const mongoose = require("mongoose");

describe("Testing statistics", () => {
    let statistics;

    beforeEach(() => {
        statistics = rewire("../../routes/statistics.js");
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("Testing functions with req, res", () => {
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

        describe("Testing getExerciseLog()", () => {
            let findStub;
            let sortStub;
            let getExerciseLog;
            beforeEach(() => {
                getExerciseLog = statistics.__get__('getExerciseLog');
                sortStub = sandbox.stub();
                findStub = sandbox.stub(mongoose.Model, 'find').returns({sort: sortStub});
                req.session.username = "user#2222";
            });

            it("returns status 200 on correct input", async function() {
                sortStub.resolves({data: "data"});
                await getExerciseLog(req, res);

                expect(res.status).to.equal(200);
                expect(sortStub).to.have.been.calledWith({loggedDate: 1});
                expect(findStub).to.have.been.calledWith({
                    username: "user#2222"
                });
                expect(JSON.parse(res.data)).to.deep.equal({data: "data"});
            });

            it("throws when find() rejects", async function() {
                sortStub.rejects();
                let getExerciseLogSpy = sandbox.spy(getExerciseLog);
                try {
                    await getExerciseLog(req, res);
                } catch {
                }


                expect(sortStub).to.have.been.calledWith({loggedDate: 1});
                expect(findStub).to.have.been.calledWith({
                    username: "user#2222"
                });
                expect(getExerciseLogSpy).to.have.thrown;
            });
        });

        describe("Testing getPastChallenges()", () => {
            let findStub;
            let sortStub;
            let getPastChallenges;
            beforeEach(() => {
                getPastChallenges = statistics.__get__('getPastChallenges');
                sortStub = sandbox.stub();
                findStub = sandbox.stub(mongoose.Model, 'find').returns({sort: sortStub});
                req.session.username = "user#2222";
            });

            it("returns status 200 on correct input", async function() {
                sortStub.resolves({data: "data"});
                await getPastChallenges(req, res);

                expect(res.status).to.equal(200);
                expect(sortStub).to.have.been.calledWith({dueDate: 1});
                expect(findStub).to.have.been.called;
                expect(JSON.parse(res.data)).to.deep.equal({data: "data"});
            });

            it("throws when find() rejects", async function() {
                sortStub.rejects();
                let getPastChallengesSpy = sandbox.spy(getPastChallenges);
                try {
                    await getPastChallenges(req, res);
                } catch {
                }


                expect(sortStub).to.have.been.calledWith({dueDate: 1});
                expect(findStub).to.have.been.called;
                expect(getPastChallengesSpy).to.have.thrown;
            });
        });
    });
});