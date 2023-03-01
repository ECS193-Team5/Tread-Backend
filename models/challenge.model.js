const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const exercise = require("../models/exercise.schema");

const challengeTypeToInitialStatusMapping = {
    "self" : "accepted",
    "friend" : "pending",
    "league" : "accepted",
}
// Unique can't won't be enforced by validate()
// Use deleteMany() instead of dropDatabase() when clearing data.
// validate should only work for save() and not update.
// Might not need participant validator
const challengeSchema = new Schema(
  {
    participants: {
        type: [String],
        required: true,
        validate: {
            validator: function(participants) {
                return (participants.length > 0);
            },
            message: () => 'Size must be greater than zero.'
        }

    },
    progress: {
        type: Map,
        of: Number,
        required: true,
        default: function() {
            let progressMap = new Map();
            this.participants.forEach(person => {
                progressMap.set(person, 0);
            });
            return progressMap;
        }

    },
    sentUser: {
        type: String,
        required: true
    },
    // leagueID or username
    receivedUser: {
        type: String,
        required: true
    },
    challengeType: {
        type: String,
        enum: ["self", "friend", "league"],
        required: true
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
    status: {
        type: String,
        enum: ["pending", "declined", "accepted"],
        required: true,
        default: function () {
            return challengeTypeToInitialStatusMapping[this.challengeType];
        }
    },
  },
  {
    collection: "challenges"
  }
);

const Challenge = mongoose.model("Challenges", challengeSchema);

module.exports = Challenge;