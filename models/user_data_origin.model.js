const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userDataOriginSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        webLastPostedDate: {
            type: Date,
            required: true,
            default: Date.now
        },
        healthKitLastPostedDate: {
            type: Date,
            required: true,
            default: Date.now
        },
        healthConnnectLastPostedDate: {
            type: Date,
            required: true,
            default: Date.now
        }
    },
    {
        collection: "User_data_origin"
    }
);

const UUser_data_origin = mongoose.model("User_data_origin", userDataOriginSchema);

module.exports = UUser_data_origin;
