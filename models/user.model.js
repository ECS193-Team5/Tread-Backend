const mongoose = require("mongoose");
const Schema = mongoose.Schema;

function isValidUsername(username) {
  if (username.length === 0 || username.length > 32) {
    return false;
  }

  if (!(/^[a-z0-9]+$/i.test(username))) {
    return false;
  }
  return true;

}

function isValidDisplayName(displayName) {
  if (displayName.length === 0 || displayName.length > 32) {
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
      enum: ['google', 'apple'],
      required: true,
    },
    authenticationID: {
      type: String,
      required: true,
    },
    givenName: String,
    familyName: String,
    email: String,
    username: {
      type: String,
      default: null,
      index: {
        unique: true,
        partialFilterExpression: {username: {$type: "string"}},
      },
    },

    // might fail if google name too long
    displayName: {
      type: String,
      default: "",
      required: true,
      validate: {
        validator: isValidDisplayName,
        message: () => 'must be valid display name'
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

userSchema.index({authenticationID: 1, authenticationSource: 1}, {unique: true});

const User = mongoose.model("User", userSchema);

module.exports = User;
module.exports.isValidUsername = isValidUsername;

