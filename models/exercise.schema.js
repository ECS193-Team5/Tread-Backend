const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TIME_UNITS = ["sec", "min", "hr"];
const DISTANCE_UNITS = ["ft", "yd", "mile", "m", "km"];
const COUNT_UNITS = ["ct"];
const ALLUNITS = TIME_UNITS.concat(DISTANCE_UNITS, COUNT_UNITS);

const UNIT_CONVERSIONS = {
    "ft" : 0.3048,
    "yd" : 0.9144,
    "mile" : 1609.34,
    "m" : 1,
    "km" : 1000,
    "s" : 1/60,
    "min" : 1,
    "hr" : 60,

}

function convertAmount(distanceUnit, amount) {
    return amount * UNIT_CONVERSIONS[distanceUnit];
}

const exercise = new mongoose.Schema(
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
    amount: {
        type: Number,
        reqired: true,
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