const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();
const mongoose = require("mongoose");


describe("Testing global_challenge", () =>{
    let globalChallenge;

    beforeEach(() => {
        globalChallenge = rewire("../../routes/global_challenge.js");
    });

    afterEach(() => {
        sandbox.restore();
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

            next = sandbox.stub();
        });
    });

});