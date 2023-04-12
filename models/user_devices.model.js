const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userDeviceSchema = new Schema(
    {
      username: {
        type: String,
        requried: true,
        index: true
      },
      deviceToken: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },
      // Test this
      expires: {
        type: Date,
        default: Date.now
      }

    },
    {
      collection: "user_devices"
    }
  );

  // change this afterwared
  userDeviceSchema.index({expires: 1}, {expireAfterSeconds: 60*60*24*60});

  const User_Devices = mongoose.model("User_devices", userDeviceSchema);

  module.exports = User_Devices;

