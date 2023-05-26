const { expect } = require("chai");
const rewire = require("rewire");
const mongoose = require("mongoose");
var sandbox = require("sinon").createSandbox();

describe('Testing Medals System', () => {
    let medals;
    let req = {};
    let res = {};

    beforeEach(() => {
        medals = rewire("../../routes/medals.js");

        req = {
            body: {}
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

    afterEach(() => {
        sandbox.restore();
    })

    describe("Test addMedal()", () => {
        let addMedal;
        beforeEach(() => {
            req = { "body" :{"unit":"m", "amount": 10, "exerciseName":"Basketball", "level":1}};
            saveStub = sandbox.stub(mongoose.Model.prototype, 'save');
            addMedal = medals.__get__("addMedal");
        });

        it("test addMedal on save success", async function () {
            saveStub.resolves("");
            await addMedal(req, res);
            expect(res.status).to.equal(200);
        });

        it("test addMedal on save failure", async function () {
            // invalid unit: l
            saveStub.rejects("");
            await addMedal(req, res);
            expect(res.status).to.equal(500);
        });
    });

    describe("Test getting medals", () => {
        let medalsList;
        let leanStub;
        let sortStub;
        let findStub;

        beforeEach(() => {
            req = {"session":{"username":"notexist"}};
            medalsList = [{"exercise":{"exerciseName": "Basketball", "amount": 100, "unit":"min"}, "level":1}, {"exercise":{"exerciseName": "Basketball", "amount": 500, "unit":"min"}, "level":2}];
            leanStub = sandbox.stub().resolves(medalsList);
            sortStub = sandbox.stub().returns({lean:leanStub});
            findStub = sandbox.stub(mongoose.Model, "find").returns({sort: sortStub});
        });
        it("test getInProgressMedals() returns medals", async function () {
            let getInProgressMedals = medals.__get__("getInProgressMedals");
            findStub.returns({sort: sortStub});
            await getInProgressMedals(req, res);
            expect(res.status).to.equal(200);
            expect(JSON.parse(res.data)).to.deep.equal(medalsList);
        });

        it("test getEarnedMedals() returns medals", async function () {
            findStub.returns({sort: sortStub});
            let getEarnedMedals = medals.__get__("getEarnedMedals");
            await getEarnedMedals(req, res);
            expect(res.status).to.equal(200);
            expect(JSON.parse(res.data)).to.deep.equal(medalsList);
        });
    });
});
