const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const challengeTypeToInitialStatusMapping = {
    "self" : "accepted",
    "friend" : "pending",
    "league" : "accepted",
}

const TIME_UNITS = ["sec", "min", "hr"];
const DISTANCE_UNITS = ["ft", "yd", "mile", "m", "km"];
const COUNT_UNITS = ["ct"];
const ALLUNITS = TIME_UNITS.concat(DISTANCE_UNITS, COUNT_UNITS);

function convertMeasurementDistance(distanceUnit, amount) {
    if (distanceUnit === "ft"){
        return amount * 0.3048;
    }
    if (distanceUnit === "yd"){
        return amount * 0.9144;
    }
    if (distanceUnit === "mile"){
        return amount * 1609.34;
    }
    if (distanceUnit === "m"){
        return amount;
    }
    if (distanceUnit === "km"){
        return amount * 1000;
    }

    return amount;
}

function convertMeasurementTime(distanceUnit, amount) {
    if (distanceUnit === "s"){
        return amount/60;
    }
    if (distanceUnit === "min"){
        return amount;
    }
    if (distanceUnit === "hr"){
        return amount * 60;
    }

    return amount;
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
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        reqired: true,
    },
    convertedAmount: {
        type: Number,
        required: true,
        default: function() {
            if (this.unitType === "time"){
                return convertMeasurementTime(this.unitType, this.amount);
            }
            if (this.unitType === "distance"){
                return convertMeasurementDistance(this.unitType, this.amount);
            }

            return this.amount;
        }
    },
    unit: {
        type: String,
        required: true,
        enum: ALLUNITS,
    },
    unitType: {
        type: String,
        required: true,
        default: function() {
            if (TIME_UNITS.includes(this.unit)) {
                return "time";
            }
            if (DISTANCE_UNITS.includes(this.unit)) {
                return "distance";
            }
            if (COUNT_UNITS.includes(this.unit)) {
                return "count";
            }
        }
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