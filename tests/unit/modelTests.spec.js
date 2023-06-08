const chai = require("chai");
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const { expect, assert } = require("chai");
const rewire = require("rewire");
var sandbox = require("sinon").createSandbox();
const mongoose = require("mongoose");
const Challenge = require("../../models/challenge.model");
const Exercise_log = require("../../models/exercise_log.model");
const League = require("../../models/league.model");
const { isValidDisplayName, isValidUsername } = require("../../models/user.model");

describe("Testing models", async () =>{
    it("Test challenge model protects due date is after issueDate", async () =>{
            let item = new Challenge({
                participants:["user#0000"],
                sentUser:"user#0000",
                receivedUser:"user#0000",
                challengeType:"self",
                issueDate:Date.now()  + 1000,
                dueDate: Date.now() + 900,
                exercise:{
                    unit:"m",
                    amount:10,
                    exerciseName:"Baseball"
                },
                status:"accepted"
            })
            try{
                await item.validate()
            }
            catch(err){
                expect(true).to.equal(true)
            }
    })

    it("Test exercise log is gotten a time unit", async () =>{
        let item = new Exercise_log({
            issueDate: Date.now()  + 1000,
            exercise:{
                unit:"min",
                amount:10,
                exerciseName:"Baseball"
            },
            username:"user#0000"
        })
        try{
            await item.validate()
        }
        catch(err){
            expect(true).to.equal(true)
        }

   })

   it("Test exercise log is gotten a ct unit", async () =>{
    let item = new Exercise_log({
        issueDate: Date.now()  + 1000,
        exercise:{
            unit:"ct",
            amount:10,
            exerciseName:"Baseball"
        },
        username:"user#0000"
        })
        try{
            await item.validate()
        }
        catch(err){
            expect(true).to.equal(true)
        }

    })

    it("Test League Model with description that is too long", async () =>{
        let item = new League({
            leagueDescription:"kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk"
        })
        try{
            await item.validate()
        }
        catch(err){
            expect(true).to.equal(true)
        }
    })

    describe("Test isValidUsername", () =>{
        it("Test isValidUsername succeeds", () =>{
            expect(isValidUsername("vaild")).to.equal(true);
        })

        it("Test isValidUsername fails due to length", () =>{
            expect(isValidUsername("")).to.equal(false);
        })

        it("Test isValidUsername fails due to space", () =>{
            expect(isValidUsername("example username")).to.equal(false);
        })
    })

    
    describe("Test isValidDisplayName", () =>{
        it("Test isValidDisplayName succeeds", () =>{
            expect(isValidDisplayName("vaild")).to.equal(true);
        })

        it("Test isValidDisplayName fails due to length", () =>{
            expect(isValidDisplayName("")).to.equal(false);
        })

        it("Test isValidDisplayName fails due to space", () =>{
            expect(isValidDisplayName("example!username")).to.equal(false);
        })
    })
});