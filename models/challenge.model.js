const mongoose = require("mongoose");
const Schema = mongoose.Schema;


// Unique can't won't be enforced by validate()
// Use deleteMany() instead of dropDatabase() when clearing data.
// validate should only work for save() and not update.
const challengeSchema = new Schema(
  {
    participants: {
        type: Array,
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
        validate: {
            validator: function(progress) {
                return (progress.size == this.participants.length);
            },
            message: () => 'Size must be same as number of participants.'
        }
    },
    sentUser: {
        type: String,
        required: true
    },
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
    exerciseList: {
        type: Array,
        required: true,
        validate: {
            validator: function(exerciseList) {
                return (exerciseList.length > 0);
            },
            message: () => 'Size must be greater than zero.'
        }
    },
    status: {
        type: String,
        enum: ["pending", "declined", "accepted"],
        required: true
    },
  },
  {
    collection: "challenges"
  }
);

const Challenge = mongoose.model("Challenges", challengeSchema);

module.exports = Challenge;