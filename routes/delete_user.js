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



async function createQueryToPullFieldFromMany(filter) {
    return {
        updateMany: {
            filter: filter,
            update: { $pull: filter }
        }
    }
}

async function createQueryToDeleteMany(filter) {
    return {
        deleteMany: {
            filter: filter,
        }
    }
}

async function deleteUserFriendList(username) {
    let userInboxQueries = [];
    let friendConnectionQueries = [];
    userInboxQueries.append(createQueryToPullFieldFromMany({ blocked: username }));
    userInboxQueries.append(createQueryToPullFieldFromMany({ blockedBy: username }));
    userInboxQueries.append(createQueryToPullFieldFromMany({ sentRequests: username }));
    userInboxQueries.append(createQueryToPullFieldFromMany({ recievedRequests: username }));
    friendConnectionQueries.append(createQueryToDeleteMany({ username: username }));
    friendConnectionQueries.append(createQueryToDeleteMany({ friendName: username }));
    return Promise.all([
        User_inbox.bulkWrite(userInboxQueries),
        Friend_connection.bulkWrite(friendConnectionQueries),
        User_inbox.findOneAndDelete({ username: username }),
    ]);
}

// Need to bulk write this
async function deleteUserChallenges(username) {
    let challengeQueries = [];
    challengeQueries.append(createQueryToDeleteMany({ sentUser: username, challengeType: "self" }));
    challengeQueries.append(createQueryToDeleteMany({ sentUser: username, status: "pending" }));
    challengeQueries.append(createQueryToDeleteMany({ recievedUser: username, status: "pending" }));
    return Challenge.bulkWrite(challengeQueries);
}

async function removeUserFromLeagues(username) {
    let leagueQueries = [];
    leagueQueries.append(createQueryToDeleteMany({ owner: username }));
    leagueQueries.append(createQueryToPullFieldFromMany({ admin: username }));
    leagueQueries.append(createQueryToPullFieldFromMany({ members: username }));
    leagueQueries.append(createQueryToPullFieldFromMany({ sentRequests: username }));
    leagueQueries.append(createQueryToPullFieldFromMany({ pendingRequests: username }));
    leagueQueries.append(createQueryToPullFieldFromMany({ bannedUsers: username }));
    return League.bulkWrite(challengeQueries);
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
            deleteImage(completeUsername.replace('#', '_'))
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