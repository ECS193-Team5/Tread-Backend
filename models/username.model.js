const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    Rules: usernames and emails should both be unique in the database
*/
const userSchema = new Schema(
  {
    name: String,
    email: String,
    username: String
  },
  {
    collection: "username_info"
  }
);

const User = mongoose.model("Username", userSchema);

module.exports = User;
