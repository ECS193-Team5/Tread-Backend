const router = require("express").Router();
const multer = require("multer");
const { uploadImage, deleteImage } = require('./cloudinary.js');
const League = require("../models/league.model");
const Challenge = require("../models/challenge.model");
const Challenge_progress = require("../models/challenge_progress.model");
const User = require("../models/user.model");
const Exercise_log = require("../models/exercise_log.model");
var ObjectId = require('mongoose').Types.ObjectId;
const { isExistingUser } = require("./user.js");
const { sendNotificationToUsers } = require("./notifications.js");
const { getSortedFieldFrequency } = require("./helpers.js");

async function createLeague(leagueInfo) {
    const newUser = new League(leagueInfo);
    return newUser.save()
}

router.route("/create_league").post(multer().array(), async (req, res) => {
    const leaguePicture = req.body.leaguePicture;
    leagueInfo = {
        owner: req.session.username,
        leagueName: req.body.leagueName,
        leagueType: req.body.leagueType,
        leagueDescription: req.body.leagueDescription,
    }

    try {
        leagueDocument = await createLeague(leagueInfo);
        await uploadImage(leaguePicture, "leaguePicture", leagueDocument["_id"]);
    } catch (err) {
        console.log(err)
        return res.status(500).json("Server error or name invalid");
    }

    return res.sendStatus(200);
});

async function deleteLeagueAndInformation(username, leagueID) {
    const activeChallenges = await Challenge.find({
        receivedUser: leagueID,
        dueDate: { $gte: Date.now() }
    }).distinct("_id");
    await Promise.all([
        League.deleteOne({
            _id: ObjectId(leagueID),
            owner: username,
        }),
        Challenge.deleteMany({
            receivedUser: leagueID,
            dueDate: { $gte: Date.now() }
        }).lean(),
        Challenge_progress.deleteMany({
            challengeID: { $in: activeChallenges }
        }).lean(),
        deleteImage(leagueID, 'leaguePicture')
    ]);
}

router.route("/delete_league").post(
    checkLeagueID,
    async (req, res, next) => {
        const leagueID = req.body.leagueID
        const username = req.session.username;

        try {
            await deleteLeagueAndInformation(username, leagueID);
        }
        catch (err) {
            console.log(err);
            return res.sendStatus(400);
        }

        return res.sendStatus(200);

    });

async function updateLeague(req, res, next) {
    await League.updateOne(res.locals.filter, res.locals.updates).lean();
    return res.sendStatus(200);
}

function checkLeagueID(req, res, next) {
    if (!req.body.leagueID) {
        return res.sendStatus(400);
    }
    next();
}

router.route("/add_admin").post(
    checkLeagueID,
    async (req, res, next) => {
        const recipient = req.body.recipient;
        const leagueName = req.body.leagueName;

        res.locals.filter = {
            _id: ObjectId(req.body.leagueID),
            admin: req.session.username,
            members: recipient,
        }
        res.locals.updates = {
            $addToSet: { admin: recipient },
        }

        await notifyMember(
            recipient,
            "You have been elevated to the admin team in " + leagueName
        );
        next();
    }, updateLeague);

router.route("/remove_admin").post(
    checkLeagueID,
    async (req, res, next) => {
        const recipient = req.body.recipient;
        const leagueName = req.body.leagueName;

        res.locals.filter = {
            _id: ObjectId(req.body.leagueID),
            admin: req.session.username,
            owner: { $ne: recipient }
        }

        res.locals.updates = {
            $pull: { admin: recipient },
        }

        await notifyMember(
            recipient,
            "You have been removed from the admin team in " + leagueName
        );
        next();
    }, updateLeague);

router.route("/user_remove_admin").post(
    checkLeagueID,
    async (req, res, next) => {
        const username = req.session.username;

        res.locals.filter = {
            _id: ObjectId(req.body.leagueID),
            admin: req.session.username,
            owner: { $ne: username }
        }

        res.locals.updates = {
            $pull: { admin: username },
        }
        next();
    }, updateLeague);


async function verifyRecipientUserExists(req, res, next) {
    if (await isExistingUser(req.body.recipient)) {
        next();
    } else {
        return res.status(400).json("Recipent does not exist");
    }
}

router.post("/kick_member", checkLeagueID,
    async (req, res, next) => {
        const recipient = req.body.recipient;
        const leagueName = req.body.leagueName;

        res.locals.filter = {
            _id: ObjectId(req.body.leagueID),
            admin: req.session.username,
            members: recipient,
            owner: { $ne: recipient }
        }

        res.locals.updates = {
            $pull: { members: recipient, admin: recipient },
        }

        await notifyMember(
            recipient,
            "You have been kicked out of " + leagueName
        );
        next();
    }, updateLeague);


router.post("/leave_league", checkLeagueID,
    async (req, res, next) => {
        const username = req.session.username;
        res.locals.filter = {
            _id: ObjectId(req.body.leagueID),
            members: username,
            owner: { $ne: username }
        }

        res.locals.updates = {
            $pull: { members: username, admin: username },
        }
        next();
    }, updateLeague);

async function notifyMember(memberName, actionMessage) {
    sendNotificationToUsers([memberName], actionMessage, "leagueMemberPage");
}

router.route("/invite_to_join").post(
    checkLeagueID, verifyRecipientUserExists,
    async (req, res, next) => {

        const username = req.session.username;
        const recipient = req.body.recipient;
        const leagueID = req.body.leagueID;

        const updateLog = await League.updateOne(
            {
                _id: ObjectId(leagueID),
                admin: username,
                pendingRequests: recipient
            },
            {
                $addToSet: { members: recipient },
                $pull: { pendingRequests: recipient },
            }
        )

        if (updateLog.matchedCount == 1) {
            await notifyMember(recipient, username + " accepted your league join request.");
            return res.sendStatus(200);
        }

        res.locals.filter = {
            _id: ObjectId(leagueID),
            admin: username,
            members: { $ne: recipient }
        },
            res.locals.updates = {
                $addToSet: { sentRequests: recipient },
                $pull: { bannedUsers: recipient }
            }

        await notifyMember(recipient, username + " invited you to a league.");
        next();
    }, updateLeague);

router.route("/user_request_to_join").post(
    checkLeagueID,
    async (req, res, next) => {
        const username = req.session.username;
        const leagueID = req.body.leagueID;

        try {
            const updateLog = await League.updateOne(
                {
                    _id: ObjectId(leagueID),
                    sentRequests: username
                },
                {
                    $addToSet: { members: username },
                    $pull: { sentRequests: username },
                }
            )

            if (updateLog.matchedCount == 1) {
                return res.sendStatus(200);
            }

            const leagueType = await League.findOne(
                {
                    _id: ObjectId(leagueID),
                }, { "_id": 0, "leagueType": 1 }
            )

            if (leagueType.leagueType === "public") {
                res.locals.updates = {
                    $addToSet: { members: username }
                }
            } else {
                res.locals.updates = {
                    $addToSet: { pendingRequests: username },
                }
            }
        }
        catch (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.locals.filter = {
            _id: ObjectId(leagueID),
            members: { $ne: username },
            bannedUsers: { $ne: username }
        },

            next();
    }, updateLeague);

router.route("/user_accept_invite").post(
    checkLeagueID,
    async (req, res, next) => {
        const username = req.session.username;

        res.locals.filter = {
            _id: ObjectId(req.body.leagueID),
            sentRequests: username
        }

        res.locals.updates = {
            $addToSet: { members: username },
            $pull: { sentRequests: username },
        }
        next();
    }, updateLeague);


router.route("/user_decline_invite").post(
    checkLeagueID,
    async (req, res, next) => {
        const username = req.session.username;

        res.locals.filter = {
            _id: ObjectId(req.body.leagueID),
            sentRequests: username
        }

        res.locals.updates = {
            $pull: { sentRequests: username },
        }
        next();
    }, updateLeague);


router.route("/user_undo_request").post(
    checkLeagueID,
    async (req, res, next) => {
        const username = req.session.username;

        res.locals.filter = {
            _id: ObjectId(req.body.leagueID),
            pendingRequests: username
        }

        res.locals.updates = {
            $pull: { pendingRequests: username },
        }
        next();
    }, updateLeague);



router.route("/accept_join_request").post(
    checkLeagueID,
    async (req, res, next) => {
        const username = req.session.username;
        const recipient = req.body.recipient;

        res.locals.filter = {
            _id: ObjectId(req.body.leagueID),
            admin: username,
            pendingRequests: recipient
        }

        res.locals.updates = {
            $addToSet: { members: recipient },
            $pull: { pendingRequests: recipient },
        }
        await notifyMember(recipient, username + " accepted your league join request.");

        next();
    }, updateLeague);


router.route("/decline_request").post(
    checkLeagueID,
    async (req, res, next) => {
        const recipient = req.body.recipient;

        res.locals.filter = {
            _id: ObjectId(req.body.leagueID),
            admin: req.session.username,
            pendingRequests: recipient
        }

        res.locals.updates = {
            $pull: { pendingRequests: recipient },
        }
        next();
    }, updateLeague);


router.route("/undo_invite").post(
    checkLeagueID,
    async (req, res, next) => {
        const recipient = req.body.recipient;

        res.locals.filter = {
            _id: ObjectId(req.body.leagueID),
            admin: req.session.username,
            sentRequests: recipient
        }

        res.locals.updates = {
            $pull: { sentRequests: recipient },
        }
        next();
    }, updateLeague);


router.route("/ban_user").post(
    checkLeagueID, verifyRecipientUserExists,
    async (req, res, next) => {
        const recipient = req.body.recipient;
        const leagueName = req.body.leagueName;

        res.locals.filter = {
            _id: ObjectId(req.body.leagueID),
            admin: req.session.username,
            owner: { $ne: recipient }
        }

        res.locals.updates = {
            $addToSet: { bannedUsers: recipient },
            $pull: {
                admin: recipient,
                pendingRequests: recipient,
                members: recipient
            },
        }


        await notifyMember(
            recipient,
            "You have been banned from " + leagueName
        );
        next();
    }, updateLeague);


router.route("/unban_user").post(
    checkLeagueID, verifyRecipientUserExists,
    async (req, res, next) => {
        const recipient = req.body.recipient;

        res.locals.filter = {
            _id: ObjectId(req.body.leagueID),
            admin: req.session.username,
        }

        res.locals.updates = {
            $pull: {
                bannedUsers: recipient
            },
        }
        next();
    }, updateLeague);

async function findLeaguesWhere(filter) {
    return League.find(filter).lean();
}

async function getChallengeCount(filter) {
    return await Challenge.countDocuments(filter);
}

async function getAllLeaguesWithChallengeCount(req, res, next) {
    const filter = res.locals.filter;

    const leaguesInfo = await League.find(filter, "_id leagueName members").lean();

    let challengeCount = [];
    leaguesInfo.forEach((league) => {
        challengeCount.push(
            getChallengeCount({
                receivedUser: league._id.toString(),
                issueDate: {
                    $lte: Date.now(),
                },
                dueDate: {
                    $gte: Date.now(),
                }
            })
        )
    })

    challengeCount = await Promise.all(challengeCount);
    const zippedCountAndInfo = leaguesInfo.map((league, index) => ({ ...league, activeChallenges: challengeCount[index] }));

    return res.status(200).json(zippedCountAndInfo);
}

router.route("/get_leagues").post(
    async (req, res, next) => {
        res.locals.filter = { members: req.session.username }
        next()
    }, getAllLeaguesWithChallengeCount);

router.route("/get_admin_leagues_with_challenge_count").post(
    async (req, res, next) => {
        res.locals.filter = { admin: req.session.username }
        next()
    }, getAllLeaguesWithChallengeCount);

router.route("/get_requested_leagues").post(
    async (req, res, next) => {
        res.locals.filter = { pendingRequests: req.session.username }
        next()
    }, getAllLeaguesWithChallengeCount);

router.route("/get_invited_leagues").post(
    async (req, res, next) => {
        res.locals.filter = { sentRequests: req.session.username }
        next()
    }, getAllLeaguesWithChallengeCount);

router.route("/get_owned_leagues").post(
    async (req, res, next) => {
        res.locals.filter = { owner: req.session.username }
        next()
    }, getAllLeaguesWithChallengeCount);

router.route("/get_admin_leagues").post(
    async (req, res, next) => {
        const leagues = await findLeaguesWhere(
            { admin: req.session.username },
            '_id leagueName'
        );

        return res.status(200).json(leagues);
    });

async function getLeagueNameDescriptionType(req, res, next) {
    const leagueID = req.body.leagueID;
    const leagueDescription = await League.findOne(
        { _id: leagueID },
        { "_id": 0, "leagueName": 1, "leagueDescription": 1, "leagueType": 1 }).lean();

    return res.status(200).json(leagueDescription);
};
router.route("/get_league_name_description_type").post(checkLeagueID, getLeagueNameDescriptionType);

async function getLeagueActiveChallengeCount(req, res, next) {
    const username = req.session.username;
    const leagueID = req.body.leagueID;

    const challengeCount = await getChallengeCount({
        receivedUser: leagueID,
        participants: username,
        issueDate: {
            $lte: Date.now(),
        },
        dueDate: {
            $gte: Date.now(),
        }
    });
    return res.status(200).json(challengeCount)
}

router.route('/get_league_active_challenges').post(checkLeagueID, getLeagueActiveChallengeCount);

// League object must have members, admin, and owner.
function getRole(username, league) {
    if (league.owner === username) {
        return "owner";
    }
    if (league["admin"].includes(username)) {
        return "admin";
    }
    else {
        return "participant";
    }
}


async function getMyRole(req, res, next) {
    const username = req.session.username;
    const leagueID = req.body.leagueID;

    const leagueInfo = await League.findOne({
        _id: leagueID,
        members: username
    }).lean();

    if (leagueInfo === null) {
        return res.status(200).json("none");
    }
    return res.status(200).json(getRole(username, leagueInfo))
}

router.route('/get_role').post(checkLeagueID, getMyRole);



/// This below should be able to be refactored into 2 functions
async function getMemberList(req, res, next) {
    const username = req.session.username;
    const leagueID = req.body.leagueID;

    const league = await League.findOne({
        _id: leagueID,
        members: username
    }, { members: 1, _id: 0, admin: 1, owner: 1 }).lean();

    if (league === null) {
        return res.sendStatus(404);
    }

    const leagueMembers = league.members;
    const memberInfo = await User.find({
        username: { $in: leagueMembers }
    }, { displayName: 1, username: 1, _id: 0 }).lean();


    const membersWithRole = memberInfo.map((member) => ({
        ...member, role: getRole(member.username, league)
    }));

    return res.status(200).json(membersWithRole);
}

router.route('/get_member_list').post(checkLeagueID, getMemberList);


router.route('/get_banned_list').post(
    checkLeagueID,
    async (req, res, next) => {
        const username = req.session.username;
        const leagueID = req.body.leagueID;
        const league = await League.findOne({
            _id: leagueID,
            members: username
        }, { bannedUsers: 1, _id: 0 }).lean();


        if (league === null) {
            return res.sendStatus(404);
        }

        const leagueBanned = league.bannedUsers;
        const bannedInfo = await User.find({
            username: { $in: leagueBanned }
        }, { displayName: 1, username: 1, _id: 0 }).lean();


        return res.status(200).json(bannedInfo);
    });


router.route('/get_pending_request_list').post(
    checkLeagueID,
    async (req, res, next) => {
        const username = req.session.username;
        const leagueID = req.body.leagueID;
        const league = await League.findOne({
            _id: leagueID,
            admin: username
        }, { pendingRequests: 1, _id: 0 }).lean();


        if (league === null) {
            return res.sendStatus(404);
        }

        const leaguePending = league.pendingRequests;
        const memberInfo = await User.find({
            username: { $in: leaguePending }
        }, { displayName: 1, username: 1, _id: 0 }).lean();

        return res.status(200).json(memberInfo);
    });

router.route('/get_sent_invite_list').post(
    checkLeagueID,
    async (req, res, next) => {
        const username = req.session.username;
        const leagueID = req.body.leagueID;
        const league = await League.findOne({
            _id: leagueID,
            admin: username
        }, { sentRequests: 1, _id: 0 }).lean();


        if (league === null) {
            return res.sendStatus(404);
        }
        const leagueSent = league.sentRequests;
        const memberInfo = await User.find({
            username: { $in: leagueSent }
        }, { displayName: 1, username: 1, _id: 0 }).lean();

        return res.status(200).json(memberInfo);
    });


router.route('/get_leaderboard').post(checkLeagueID,
    async (req, res, next) => {
        const leagueChallenges = await Challenge.find({ receivedUser: req.body.leagueID }).distinct("_id");
        const completedChallenges = await Challenge_progress.find({
            challengeID: { $in: leagueChallenges },
            completed: true,
        }, {
            _id: 0, username: 1
        }).lean()
        const sortedResult = await getSortedFieldFrequency("username", completedChallenges);

        return res.status(200).send(sortedResult);

    });

router.route('/get_recommended').post(async (req, res, next) => {
    // find 10 recent exercises logged
    // find all league challenges in the last x time with recent exercises
    // find at most 6 leagues that are public from that list
    const NUMBER_OF_RECENT_EXERCISES = 10;
    const WEEK_IN_MILISECONDS = 604800000;
    const LIMIT_NUMBER_LEAGUES_RETURNED = 5;
    const CHALLENGE_QUERY_TIME_LIMIT = Date.now() - WEEK_IN_MILISECONDS;
    const username = req.session.username;

    const leaguesUserIsIn = League.find({
        members: username
    }).distinct("_id");
    const recentExercises = await Exercise_log.find({
        username: username
    }, { "_id": 0, "exercise": 1 }).sort({ "loggedDate": -1 }).limit(NUMBER_OF_RECENT_EXERCISES).lean();

    const uniqueRecentExercises = [...new Set(recentExercises.map(item => item.exercise.exerciseName))];

    const relatedLeagueChallenges = await Challenge.find({
        challengeType: "league",
        issueDate: { $gt: CHALLENGE_QUERY_TIME_LIMIT },
        receivedUser: { $nin: await leaguesUserIsIn },
        "exercise.exerciseName": { $in: uniqueRecentExercises }
    }, { "_id": 0, "receivedUser": 1 }).distinct("receivedUser").lean();

    const publicRelatedLeagues = await League.find({
        _id: { $in: relatedLeagueChallenges },
        leagueType: "public"
    }, { "leagueName": 1 }).limit(LIMIT_NUMBER_LEAGUES_RETURNED).lean();

    return res.status(200).json(publicRelatedLeagues);
});

router.route('/get_recent_activity').post(async (req, res, next) => {
    // Get league participants from all leagues
    // Get active league challenges and find their exerciseName/unitType
    // Find exercise_logs that match exerciseName and type that are logged by participants
    // attach profile information.
    const username = req.session.username;
    const NUMBER_OF_EXERCISES_TO_RETURN = 5;

    const allMembersFromAllLeagues = await League.find({
        members: username
    }, { "_id": 0, "members": 1 }).distinct("members").lean();

    if (allMembersFromAllLeagues.length === 0) {
        return res.status(200).json([]);
    }

    const otherMembersFromLeagues = allMembersFromAllLeagues.filter(memberName => memberName !== username);

    const recentExercises = await Exercise_log.find({
        username: { $in: otherMembersFromLeagues }
    }).sort({ "loggedDate": -1 }).limit(NUMBER_OF_EXERCISES_TO_RETURN).lean();

    return res.status(200).json(recentExercises);
});

async function checkUserLeagueAdmin(req, res, next) {
    const leagueID = req.body.leagueID;
    const username = req.session.username;
    const isUserLeagueAdmin = await League.exists({
        _id: leagueID, admin: username
    }).lean();

    if (isUserLeagueAdmin === null) {
        return res.sendStatus(401);
    }
    return next();
}
async function updatePicture(req, res) {
    const leaguePicture = req.body.leaguePicture;
    const leagueID = req.body.leagueID;
    try {
        await uploadImage(leaguePicture, "leaguePicture", leagueID);
    }
    catch (err) {
        console.log(err);
        return res.status(400).json("picture upload error");
    }
    return res.sendStatus(200);
}
router.route('/update_picture').post(multer().array(), checkLeagueID, checkUserLeagueAdmin, updatePicture);

async function updateName(req, res) {
    const leagueName = req.body.leagueName;
    const leagueID = req.body.leagueID;
    const username = req.session.username;

    try {
        await League.updateOne({
            _id: leagueID,
            admin: username
        }, {
            leagueName: leagueName
        });
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(400);
    }

    return res.sendStatus(200);
}
router.route('/update_name').post(checkLeagueID, updateName);

async function updateDescription(req, res) {
    const leagueDescription = req.body.leagueDescription;
    const leagueID = req.body.leagueID;
    const username = req.session.username;

    await League.updateOne({
        _id: leagueID,
        admin: username
    }, {
        leagueDescription: leagueDescription
    });

    return res.sendStatus(200);
}
router.route('/update_description').post(checkLeagueID, updateDescription);

async function updateType(req, res) {
    const leagueType = req.body.leagueType;
    const leagueID = req.body.leagueID;
    const username = req.session.username;

    await League.updateOne({
        _id: leagueID,
        admin: username
    }, {
        leagueType: leagueType,
        $set: { pendingRequests: [] }
    }, { runValidators: true });

    return res.sendStatus(200);
}
router.route('/update_type').post(checkLeagueID, updateType);

module.exports = router;
module.exports.deleteLeagueAndInformation = deleteLeagueAndInformation;