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
      default: null,
      index: {
        unique: true,
        partialFilterExpression: {username: {$type: "string"}},
      },
    },
    displayName: String,
    profilePhoto: String,
    ifMetric: {
      type: Boolean,
      required: true,
      default : true,
    },
  },
  {
    collection: "user_info"
  }
);

// need to index authSource and authID using multiIndex (schema.index())

const User = mongoose.model("User", userSchema);

module.exports = User;
