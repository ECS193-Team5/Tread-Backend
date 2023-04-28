const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();

describe("Testing helpers", () => {
    let helpers;

    beforeEach(() => {
        auth = rewire("../routes/helpers.js");
    });

    afterEach(() => {
        sandbox.restore();
    })
});