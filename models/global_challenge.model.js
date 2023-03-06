const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const exercise = require("../models/exercise.schema");

const globalChallengeSchema = new Schema(
  {
    issueDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    dueDate: {
        type: Date,
        required: true,
        min: Date.now
    },
    exercise: {
        type: exercise,
        required: true,
    },
  },
  {
    collection: "global_challenges"
  }
);

//look at this when they update excercise and then check global progress

//add indexes

globalChallengeSchema.index({
  'exercise.exerciseName' : 1, 'exercise.unitType' : 1,
  issueDate : 1, dueDate : 1,
});

const Global_challenge = mongoose.model("Global_challenges", globalChallengeSchema);

module.exports = Global_challenge;