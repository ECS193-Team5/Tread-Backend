const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    Rules: email1 -> [email2, email3] adjacency list for each user should be
    kept in the database
    friend_1_email should be alphabetically before friend_2_email
*/
const friendListSchema = new Schema(
  {
    username: String,
    friends: [String],
    blocked: [String],
    blockedBy: [String],
    sentRequests: [String],
    receivedRequests: [String]
  },
  {
    collection: "friend_lists"
  }
);

const Friend_list = mongoose.model("Friend_lists", friendListSchema);

module.exports = Friend_list;
