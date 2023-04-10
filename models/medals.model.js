const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const exercise = require("../models/exercise.schema");

const medalSchema = new Schema(
  {
    exercise: {
        type: exercise,
        required: true,
    },
  },
  {
    collection: "medals"
  }
);

//add indexes

medalSchema.index({
  'exercise.exerciseName' : 1, 'exercise.unitType' : 1,
});

const Medals = mongoose.model("Medals", medalSchema);

module.exports = Medals;