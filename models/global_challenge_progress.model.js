const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const challengeProgress = require("../models/challenge_progress.schema");

const Global_challenge_progress = mongoose.model(
    "Global_challenge_progress", challengeProgress, 'global_challenge_progress');

module.exports = Global_challenge_progress;