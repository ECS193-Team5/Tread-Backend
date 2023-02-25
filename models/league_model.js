const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LeagueSchema = new Schema(
  {
    owner : {
        type: String,
        required: true,
    },
    admin : {
        type: [String],
        required: true,
        default : [this.owner]
    },
    dateCreated : {
        type: Date,
        required: true,
        default: Date.now,
    },
    leagueName : {
        type: String,
        required: true,
        unique: true,
    },
    leagueType : {
        type: String,
        required: true,
        enum: ["private", "open"],
    },
    pendingRequests : {
        type: [String],
        default : []
    },
    bannedUsers : {
        type: [String],
        default: [],
    },
  },
  {
    collection: "Leagues"
  }
);

const League = mongoose.model("Leagues", LeagueSchema);

module.exports = League;