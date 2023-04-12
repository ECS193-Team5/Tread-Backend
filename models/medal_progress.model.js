const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const exercise = require("./exercise.schema");
const ObjectId = require('mongoose').Types.ObjectId;

const medalProgressSchema =  new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
    exercise: {
        type: exercise,
        required: true,
    },
    progress: {
      type: Number,
      required: true,
      default: 0
    },
    completed: {
      type: Boolean,
      required: true,
      default: false,
    }
  }
);

//look at this when they update excercise and then check global progress

//add indexes

medalProgressSchema.index({
  username: 1, exercise: 1, level : 1
}, {unique: true});

const Medal_progress = mongoose.model(
    "Medal_progresss", medalProgressSchema, 'medal_progress');

module.exports = Medal_progress;