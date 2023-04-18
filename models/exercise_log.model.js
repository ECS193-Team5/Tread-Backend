const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const exercise = require("../models/exercise.schema");


const exerciseLogSchema = new Schema(
{
    username: {
        type: String,
        required: true
    },
    postedDate: {
        type: Date,
        reqired: true,
        default: Date.now
    },
    loggedDate: {
        type: Date,
        required: true,
        max: Date.now, // Logged date is set after posted date
        default: function() { return [this.postedDate]}
    },
    exercise: {
        type: exercise,
        required: true,
    },
},
{
  collection: "exercise_log"
});

exerciseSchema.index({
    username: 1, loggedDate: 1
});

const Exercise_log = mongoose.model("Exercise_log", exerciseLogSchema);

module.exports = Exercise_log;