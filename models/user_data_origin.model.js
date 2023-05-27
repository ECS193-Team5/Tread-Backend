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
        healthKitAnchor: {
            type: String,
            required: true,
            default: ""
        },
        healthConnectAnchor: {
            type: Date,
            required: true,
            default: Date.now
        }
    },
    {
        collection: "user_data_origin"
    }
);

const User_data_origin = mongoose.model("User_data_origin", userDataOriginSchema);

module.exports = User_data_origin;
