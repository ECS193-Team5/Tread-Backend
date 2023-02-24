const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema(
  {
    authenticationSource: {
      type: String,
      enum: ['google'],
      requried: true,
    },
    authenticationID: {
      type: String,
      requried: true,
    },
    givenName: String,
    familyName: String,
    picture: String,
    email: String,
    username: {
      type: String,
      requried: true,
    },
    displayName: String,
    profilePhoto: String,
    ifMetric: Boolean,
  },
  {
    collection: "user_info"
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
