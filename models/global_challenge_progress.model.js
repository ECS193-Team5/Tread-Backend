const mongoose = require("mongoose");
const { isValidUsername } = require("./user.model");
const Schema = mongoose.Schema;

const globalChallengeProgressSchema = new Schema(
  {
    globalChallengID: {
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
        default: 0,
    },
  },
  {
    collection: "global_challenge_progress"
  }
);

const Global_challenge_progress = mongoose.model(
    "Global_challenge_progress", globalChallengeProgressSchema);

module.exports = Global_challenge_progress;