const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();
const mongoose = require("mongoose");
const Challenge = require("../../models/challenge.model");
describe("Testing models", async () =>{
   it("Test challenge model protects due date is after issueDate", () =>{
        let item = new Challenge({
            participants:["user#0000"],
            sentUser:"user#0000",
            receivedUser:"user#0000",
            challengeType:"self",
            issueDate:Date.now(),
            dueDate: Date.now() -100,
            exercise:{},
            status:"accepted"
        })
        await Challenge.save()

   })

});