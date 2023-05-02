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
      index: true
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
      default: false,
      validate: {
        validator: function(completed) {
          if (this.progress < this.exercise.convertedAmount && !completed) {
            return true
          }

          if (this.progress > this.exercise.convertedAmount && completed) {
            return true
          }

          return false;
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

challengeProgress.index({
  progress: -1, challengeID : 1
});

challengeProgress.index({
  username: 1,
  'exercise.exerciseName': 1,
  'exercise.unitType' : 1,
  issuedDate: -1,
  dueDate: -1
});


module.exports = challengeProgress;