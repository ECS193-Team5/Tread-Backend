const mongoose = require("mongoose");
const Schema = mongoose.Schema;

function isValidUsername(username) {
  if (username.length == 0 || username.length > 32) {
    return false;
  }

  if (!(/^[a-z0-9]+$/i.test(username))) {
    return false;
  }
  return true;

}

function isValidDisplayName(displayName) {
  if (displayName.length == 0 || displayName.lenght > 32) {
    return false;
  }

  if (!(/^[a-z0-9 ]+$/i.test(displayName))) {
    return false;
  }
  return true;

}

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
    displayName: {
      type: String,
      default: "",
      index: true,
      required: true,
      validate: {
        validator: isValidDisplayName,
        message: () => 'Size must be greater than zero.'
      }
    },
    picture: {
      type: String,
      required: true,
    },
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

userSchema.index({authenticationID: 1, authenticationSource: 1});

const User = mongoose.model("User", userSchema);

module.exports = User;
module.exports.isValidUsername = isValidUsername;

