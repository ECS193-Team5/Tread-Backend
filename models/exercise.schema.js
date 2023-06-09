const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TIME_UNITS = ["sec", "min", "hr"];
const DISTANCE_UNITS = ["ft", "yd", "mi", "m", "km"];
const COUNT_UNITS = ["ct"];
const ALLUNITS = TIME_UNITS.concat(DISTANCE_UNITS, COUNT_UNITS);

const UNIT_CONVERSIONS = {
    "ft" : 0.3048,
    "yd" : 0.9144,
    "mi" : 1609.34,
    "m" : 1,
    "km" : 1000,
    "sec" : 1/60,
    "min" : 1,
    "hr" : 60,
    "ct" : 1
}

function convertAmount(distanceUnit, amount) {
    return amount * UNIT_CONVERSIONS[distanceUnit];
}

function getUnitType(unit) {
    if (TIME_UNITS.includes(unit)) {
        return "time";
    }
    else if (DISTANCE_UNITS.includes(unit)) {
        return "distance";
    }
    return "count";
}

const exercise = new Schema(
{
    exerciseName: {
        type: String,
        required: true,
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
            return getUnitType(this.unit)
        }
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    convertedAmount: {
        type: Number,
        required: true,
        default: function() {
            if (this.unitType === "time" || this.unitType == "distance"){
                return convertAmount(this.unit, this.amount);
            }

            return this.amount;
        }
    }
});

module.exports = exercise;
module.exports.getUnitType = getUnitType;
module.exports.convertAmount = convertAmount;