const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const challengeProgress = require("../models/challenge_progress.schema");

const Challenge_progress = mongoose.model(
    "Challenge_progress", challengeProgress, 'challenge_progress');

module.exports = Challenge_progress;