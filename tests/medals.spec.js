const { expect } = require("chai");
const rewire = require("rewire");
const mongoose = require("mongoose");
var sandbox = require("sinon").createSandbox();

describe('Testing Medals System', () => {
    let medals;
    let req = {};
    let res = {};

    beforeEach(() => {
        medals = rewire("../routes/medals.js");

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

    it("test addMedal on save success", async function () {
        req = { "body" :{"unit":"m", "amount": 10, "exerciseName":"Basketball", "level":1}};
        sandbox.stub(mongoose.Model.prototype, 'save').resolves("");
        let addMedal = medals.__get__("addMedal");
        await addMedal(req, res);
        expect(res.status).to.equal(200);

    });

    it("test addMedal on save failure", async function () {
        // invalid unit: l
        req = { "body" :{"unit":"l", "amount": 10, "exerciseName":"Basketball", "level":1}};
        sandbox.stub(mongoose.Model.prototype, 'save').rejects("");
        let addMedal = medals.__get__("addMedal");
        await addMedal(req, res);
        expect(res.status).to.equal(500);

    });

    it("test getInProgressMedals returns medals", async function () {
        let req = {"session":{"username":"notexist"}};
        let medalsList = [{"exercise":{"exerciseName": "Basketball", "amount": 100, "unit":"min"}, "level":1}, {"exercise":{"exerciseName": "Basketball", "amount": 500, "unit":"min"}, "level":2}];
        let getInProgressMedals = medals.__get__("getInProgressMedals");
        let leanStub = sandbox.stub().resolves(medalsList)
        let sortStub = sandbox.stub().returns({lean:leanStub})
        sandbox.stub(mongoose.Model, "find").returns({sort: sortStub});
        await getInProgressMedals(req, res);
        expect(res.status).to.equal(200);
        expect(JSON.parse(res.data)).to.deep.equal(medalsList);
    });

    it("test getCompletedMedals returns medals", async function () {
        let req = {"session":{"username":"notexist"}}
        let getCompletedMedals = medals.__get__("getEarnedMedals");
        let medalsList = [{"exercise":{"exerciseName": "Basketball", "amount": 100, "unit":"min"}, "level":1}, {"exercise":{"exerciseName": "Basketball", "amount": 500, "unit":"min"}, "level":2}];
        let leanStub = sandbox.stub().resolves(medalsList)
        let sortStub = sandbox.stub().returns({lean:leanStub})
        sandbox.stub(mongoose.Model, "find").returns({sort: sortStub});
        await getCompletedMedals(req, res);
        expect(res.status).to.equal(200);
        expect(JSON.parse(res.data)).to.deep.equal(medalsList);
    });
});
