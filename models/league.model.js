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
        default: '',
        validate: {
            validator: function(description) {
                return (description.length < 140);
            },
            message: () => 'Size must be less than 140'
        }
    },
    leagueName: {
        type: String,
        required: true,
    },
    leagueType: {
        type: String,
        required: true,
        enum: ["private", "public"],
    },
    pendingRequests: {
        type: [String],
        default : [],
    },
    sentRequests: {
        type: [String],
        default: [],
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