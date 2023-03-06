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
        min: Date.now,
        validate: {
            validator: function(dueDate) {
                return (dueDate > this.issueDate);
            },
            message: () => 'dueDate must be before issueDate'
        }
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


challengeSchema.index({participants: 1, status: 1});
challengeSchema.index({sentUser: 1, status: 1});
// remove if index is slowing things down
challengeSchema.index({
    'exercise.exerciseName' : 1, 'exercise.unitType' : 1,
    status : 1, issueDate : 1, dueDate : 1,
});


const Challenge = mongoose.model("Challenges", challengeSchema);

module.exports = Challenge;