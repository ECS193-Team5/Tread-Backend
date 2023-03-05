const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var ObjectId = require('mongoose').Types.ObjectId;

const globalChallengeProgressSchema = new Schema(
  {
    globalChallengeID: {
        type: ObjectId,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    progress: {
        type: Number,
        required: true,
        index: true,
        default: 0,
    },
  },
  {
    collection: "global_challenge_progress"
  }
);

globalChallengeProgressSchema.index({
  username: 1, globalChallengeID : 1
}, {unique: true});

const Global_challenge_progress = mongoose.model(
    "Global_challenge_progress", globalChallengeProgressSchema);

module.exports = Global_challenge_progress;