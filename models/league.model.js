const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LeagueSchema = new Schema(
  {
    owner: {
        type: String,
        required: true,
    },
    admin: {
        type: [String],
        required: true,
        index: true,
        default : function() { return [this.owner]}
    },
    dateCreated: {
        type: Date,
        required: true,
        default: Date.now,
    },
    leagueDescription: {
        type: String,
        required: true,
        default: ''

    },
    leagueName: {
        type: String,
        required: true,
    },
    leagueType: {
        type: String,
        required: true,
        enum: ["private", "open"],
    },
    pendingRequests: {
        type: [String],
        default : [],
    },
    bannedUsers: {
        type: [String],
        default: [],
    },
    members: {
        type: [String],
        index: true,
        default : function() { return [this.owner]},
    }
  },
  {
    collection: "leagues"
  }
);

const League = mongoose.model("Leagues", LeagueSchema);

module.exports = League;