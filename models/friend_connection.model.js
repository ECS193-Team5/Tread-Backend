const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const friendConnectionSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      index: true,
    },
    friendName: {
        type: String,
        required: true,
        index: true,
    }
  },
  {
    collection: "friend_connections"
  }
);

friendConnectionSchema.index({
    username: 1, friendName: 1
  },{unique: true});


const Friend_connection = mongoose.model("Friend_connections", friendConnectionSchema);

module.exports = Friend_connection;
