const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    Rules: email1 -> [email2, email3] adjacency list for each user should be
    kept in the database
    friend_1_email should be alphabetically before friend_2_email
*/
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
    friends: defaultBlankStringArray,
    blocked: defaultBlankStringArray,
    blockedBy: defaultBlankStringArray,
    sentRequests: defaultBlankStringArray,
    receivedRequests: defaultBlankStringArray,
  },
  {
    collection: "friend_lists"
  }
);

const Friend_list = mongoose.model("Friend_lists", friendListSchema);

module.exports = Friend_list;
