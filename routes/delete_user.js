const router = require("express").Router();
const User = require("../models/user.model");
const User_inbox = require("../models/user_inbox.model");
const Friend_connection = require("../models/friend_connection.model");
const Challenge = require("../models/challenge.model");
const Global_challenge_progress = require("../models/global_challenge_progress.model");
const Medal_progress = require("../models/medal_progress.model");
const User_devices = require("../models/user_devices.model")
const League = require("../models/league.model");
const Exercise_log = require("../models/exercise_log.model")
const { logout } = require("./auth.js");
const { deleteImage } = require("./cloudinary.js")



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
        User_inbox.bulkWrite(userInboxQueries),
        Friend_connection.bulkWrite(friendConnectionQueries),
        User_inbox.findOneAndDelete({ username: username }),
    ]);
}

// Need to bulk write this
async function deleteUserChallenges(username) {
    let challengeQueries = [];
    challengeQueries.push(createQueryToDeleteMany({ sentUser: username, challengeType: "self" }));
    challengeQueries.push(createQueryToDeleteMany({ sentUser: username, status: "pending" }));
    challengeQueries.push(createQueryToDeleteMany({ recievedUser: username, status: "pending" }));
    return Challenge.bulkWrite(challengeQueries);
}

async function removeUserFromLeagues(username) {
    let leagueQueries = [];
    leagueQueries.push(createQueryToDeleteMany({ owner: username }));
    leagueQueries.push(createQueryToPullFieldFromMany({ admin: username }));
    leagueQueries.push(createQueryToPullFieldFromMany({ members: username }));
    leagueQueries.push(createQueryToPullFieldFromMany({ sentRequests: username }));
    leagueQueries.push(createQueryToPullFieldFromMany({ pendingRequests: username }));
    leagueQueries.push(createQueryToPullFieldFromMany({ bannedUsers: username }));
    return League.bulkWrite(leagueQueries);
}
// maybe add error handling middleware.
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
            deleteImage(username.replace('#', '_'))
        ]);
        // Remove from league

        // Delete/edit exercises.
    } catch (err) {
        console.log(err);
        return res.status(500).json("Could not finish deleting profile.");
    }
    next();
}, logout);

module.exports = router;