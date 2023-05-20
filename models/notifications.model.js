const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    username: {
        type: String,
        required: true,
    },
    message: {
      type: String,
      required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    }
  },
  {
    collection: "notifications"
  }
);

notificationSchema.index({
  username: 1, date: -1,
});

const Notifications = mongoose.model("Notifications", notificationSchema);

module.exports = Notifications;