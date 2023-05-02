const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
const { getSortedFieldFrequency } = require("../routes/helpers");
var sandbox = require("sinon").createSandbox();

describe("Testing helpers", () => {
    let helpers;

    beforeEach(() => {
        helpers = rewire("../routes/helpers.js");
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("Testing getFieldFrequency()", () => {
        let getFieldFrequency;
        const searchField = "username";
        const arrayOfObjects = [
            { username: 'batman#6380' },
            { username: 'batman#6380' },
            { username: 'user#2222' },
            { username: 'batman#6380' },
            { username: 'user#2222' }
        ];
        const result = { 'batman#6380': 3, 'user#2222': 2 };
        beforeEach(() => {
            getFieldFrequency = helpers.__get__("getFieldFrequency");
        });

        it("returns the correct frequency as an array of objects", async function() {
            let map = getFieldFrequency(searchField, arrayOfObjects);
            expect(map).to.deep.equal(result);
        });
    });

    describe("Testing getSortedFieldFrequency()", () => {
        let getSortedFieldFrequency;
        let getFieldFrequencyStub;
        const fieldName = "username";
        const arrayOfObjects = [
            { username: 'batman#6380' },
            { username: 'batman#6380' },
            { username: 'user#2222' },
            { username: 'batman#6380' },
            { username: 'user#2222' }
        ];
        const expectedResult = [
            [
                "batman#6380",
                3
            ],
            [
                "user#2222",
                2
            ],
        ];
        const fieldFrequencyResult = { 'batman#6380': 3, 'user#2222': 2 };
        beforeEach(() => {
            getSortedFieldFrequency = helpers.__get__("getSortedFieldFrequency");
            getFieldFrequencyStub = sandbox.stub().returns(fieldFrequencyResult);
            helpers.__set__("getFieldFrequency", getFieldFrequencyStub);
        });

        it("returns a sorted list", async function() {
            let frequencyResult = await getSortedFieldFrequency(fieldName, arrayOfObjects);
            expect(getFieldFrequencyStub).to.have.been.calledWith(fieldName, arrayOfObjects);
            expect(frequencyResult).to.deep.equal(expectedResult);
        });
    });
});