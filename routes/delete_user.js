const router = require("express").Router();
const User = require("../models/user.model");
const User_inbox = require("../models/user_inbox.model");
const Friend_connection = require("../models/friend_connection.model");
const Challenge = require("../models/challenge.model");
const Global_challenge_progress = require("../models/global_challenge_progress.model");
const Medal_progress = require("../models/medal_progress.model");
const User_devices = require("../models/user_devices.model")
const League = require("../models/league.model");
const Exercise_log = require("../models/exercise_log.model");
const User_data_origin = require("../models/user_data_origin.model");
const Notifications = require("../models/notifications.model");
const { logout } = require("./auth.js");
const { deleteImage } = require("./cloudinary.js")
const { deleteLeagueAndInformation } = require("./league.js")



function createQueryToPullFieldFromMany(filter) {
    return {
        updateMany: {
            filter: filter,
            update: { $pull: filter }
        }
    }
}

function createQueryToDeleteMany(filter) {
    return {
        deleteMany: {
            filter: filter,
        }
    }
}

async function deleteUserFriendList(username) {
    let userInboxQueries = [];
    let friendConnectionQueries = [];
    userInboxQueries.push(createQueryToPullFieldFromMany({ blocked: username }));
    userInboxQueries.push(createQueryToPullFieldFromMany({ blockedBy: username }));
    userInboxQueries.push(createQueryToPullFieldFromMany({ sentRequests: username }));
    userInboxQueries.push(createQueryToPullFieldFromMany({ receivedRequests: username }));
    friendConnectionQueries.push(createQueryToDeleteMany({ username: username }));
    friendConnectionQueries.push(createQueryToDeleteMany({ friendName: username }));
    return Promise.all([
        User_inbox.bulkWrite(userInboxQueries, {ordered: false}),
        Friend_connection.bulkWrite(friendConnectionQueries, {ordered: false}),
        User_inbox.findOneAndDelete({ username: username }),
    ]);
}

// Need to bulk write this
async function deleteUserChallenges(username) {
    let challengeQueries = [];
    challengeQueries.push(createQueryToDeleteMany({ sentUser: username, challengeType: "self" }));
    challengeQueries.push(createQueryToDeleteMany({ sentUser: username, status: "pending" }));
    challengeQueries.push(createQueryToDeleteMany({ recievedUser: username, status: "pending" }));
    return Challenge.bulkWrite(challengeQueries, {ordered: false});
}

async function removeUserFromLeagues(username) {
    let leagueQueries = [];

    const ownedLeagueIDs = await League.find({ owner: username }, { "_id" : 1 });
    const deleteLeaguePromises = ownedLeagueIDs.map( leagueIDDoc =>
        deleteLeagueAndInformation(username, leagueIDDoc._id.toString())
    );
    await Promise.all(deleteLeaguePromises);
    leagueQueries.push(createQueryToPullFieldFromMany({ admin: username }));
    leagueQueries.push(createQueryToPullFieldFromMany({ members: username }));
    leagueQueries.push(createQueryToPullFieldFromMany({ sentRequests: username }));
    leagueQueries.push(createQueryToPullFieldFromMany({ pendingRequests: username }));
    leagueQueries.push(createQueryToPullFieldFromMany({ bannedUsers: username }));
    return League.bulkWrite(leagueQueries, {ordered: false});
}

router.delete('/', async (req, res, next) => {
    const username = req.session.username;
    try {
        await Promise.all([
            User.findOneAndDelete({ username: username }),
            deleteUserFriendList(username),
            deleteUserChallenges(username),
            Global_challenge_progress.deleteMany({ username: username }),
            removeUserFromLeagues(username),
            Medal_progress.deleteMany({ username: username }),
            User_devices.deleteMany({ username: username }),
            Exercise_log.deleteMany({ username: username }),
            deleteImage(username.replace('#', '_'), 'profilePictures'),
            User_data_origin.deleteOne({ username: username }),
            Notifications.deleteMany({ username: username })
        ]);
    } catch (err) {
        console.log(err);
        return res.status(500).json("Could not finish deleting profile.");
    }
    next();
}, logout);

module.exports = router;