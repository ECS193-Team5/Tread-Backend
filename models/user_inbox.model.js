const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const defaultBlankStringArray = {
  type: [String],
  required: true,
  default: []
}
const friendListSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    blocked: defaultBlankStringArray,
    blockedBy: defaultBlankStringArray,
    sentRequests: defaultBlankStringArray,
    receivedRequests: defaultBlankStringArray,
  },
  {
    collection: "user_inboxes"
  }
);

const User_inbox = mongoose.model("User_inboxes", friendListSchema);

module.exports = User_inbox;
