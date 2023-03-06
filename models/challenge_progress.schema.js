const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const exercise = require("./exercise.schema");
const ObjectId = require('mongoose').Types.ObjectId;

const challengeProgress = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    challengeID: {
      type: ObjectId,
      required: true,
    },
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
    progress: {
      type: Number,
      required: true,
      default: 0
    },
    completed: {
      type: Boolean,
      required: true,
      validate: {
        validator: function(status) {
            return (status && this.progress > this.exercise.convertedAmount4);
        },
        message: () => 'Wrong Status'
    }
    }
  }
);

//look at this when they update excercise and then check global progress

//add indexes

challengeProgress.index({
  username: 1, challengeID : 1
}, {unique: true});


module.exports = challengeProgress;