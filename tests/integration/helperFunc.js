var request = require("supertest");
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
request = request(app);
const googleauth = require('google-auth-library');
const { expect } = require("chai");
const mongoose = require('mongoose');
const Challenge = require("../../models/challenge.model");
const Challenge_progress = require("../../models/challenge_progress.model");
const Global_challenge = require("../../models/global_challenge.model");
const Global_challenge_progress = require("../../models/global_challenge_progress.model");
const Medals = require("../../models/medals.model");
const Medals_progress = require("../../models/medal_progress.model");
const { match } = require("assert");
const uri = process.env.TEST_ATLAS_URI;



async function clearDatabase() {
    mongoose.connect(uri);
    const connection = mongoose.connection;
    connection.once("open", () => {
        console.log("MongoDB database connection established successfully");
    });

    await Challenge.deleteMany({});
    await Challenge_progress.deleteMany({});
    await Global_challenge.deleteMany({});
    await Global_challenge_progress.deleteMany({});
    await connection.dropCollection('sessions');
}

async function getDataOriginLastDate(cookie, dataOrigin){
    let results = {};
    await request.post("/medals/get_data_origin_last_import_date")
        .set("Cookie", cookie)
        .set('Accept', 'application/json')
        .send({dataOrigin:dataOrigin})
        .then(res => {
           results = res._body;
        })
    return results;
}

after(async () => {
    const mongoose = require("mongoose");
    await mongoose.disconnect();
    app.close();
})

async function getMedalsInProgress(cookie){
    let results = [];
    await request.post("/medals/get_in_progress")
        .set("Cookie", cookie)
        .set('Accept', 'application/json')
        .then(res => {
           results = res._body;
        })
    return results;
};

async function checkUserExist(cookie, username){
    let result = "none";
    await request.post("/user/check_username_exist")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({username:username})
    .then(res => {
        result = res._body;
    })
    return result;
}

async function getDisplayName(cookie){
    let result = "none";
    await request.post("/user/get_display_name")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        result = res._body;
    })
    return result;
}

async function getUsername(cookie){
    let result = "none";
    await request.post("/user/get_username")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        result = res._body;
    })
    return result;
}

async function updatePicture(cookie, newPicture){
    let result = "none";
    await request.post("/user/update_picture")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({picture: newPicture})
    .then(res => {
        result = res.status;
    })
    return result;
}

async function getExerciseLog(cookie){
    let result = "none";
    await request.post("/stats/get_exercise_log")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        result = res._body;
    })
    return result;
}

async function getPastChallenges(cookie){
    let result = "none";
    await request.post("/stats/get_past_challenges")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        result = res._body;
    })
    return result;
}

async function updateDisplayName(cookie, displayName){
    let result = "";
    await request.post("/user/update_display_name")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({displayName:displayName})
    .then(res => {
        result = res.status;
    })
    return result;
}
async function getUsername(cookie){
    let result = "none";
    await request.post("/user/get_username")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        result = res._body;
    })
    return result;
}
async function getMedalsComplete(cookie){
    let results = [];
    await request.post("/medals/get_earned")
        .set("Cookie", cookie)
        .set('Accept', 'application/json')
        .then(res => {
           results = res._body;
        })
    return results;
};

async function createUser(user, sandbox) {
    let cookie = await loginUser(user, sandbox);
    await request.post("/sign_up/sign_up")
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({"username": user.given_name, "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
        .then(res => {
        })
    return cookie;
}

async function deleteUser(cookie) {
    let status = "";
    await request.delete("/delete_user/")
        .set('Cookie', cookie)
        .then(res => {
            status = res.status;
        });

    return status;
}

async function loginUser(user, sandbox) {
    let cookie = "";
    var userVal = {
        sub: user.sub,
        given_name: user.given_name,
        family_name: user.family_name,
        email: "testemail" + user.sub + "@gmail.com",
        picture: "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png"
    }
    let payloadStub = sandbox.stub().returns(userVal)
    sandbox.stub(googleauth.OAuth2Client.prototype, "verifyIdToken").resolves({ getPayload: payloadStub });
    await request.post("/auth/login/google")
        .set('Accept', 'application/json')
        .then(res => {
            cookie = res.headers['set-cookie'];
        }
        )
    sandbox.restore();
    return cookie;
}

async function getUsername(cookie){
    let username = "";
    await request.post("/user/get_username")
        .set("Cookie", cookie)
        .set('Accept', 'application/json')
        .then(res => {
           username = res._body;
        })
    return username;
}

async function createLeague(cookie, leagueName, leagueType, leagueDescription) {
    let inputData = {"leagueName": leagueName,
     "leagueType": leagueType,
      "leagueDescription": leagueDescription,
      "leaguePicture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png"};
    let info = {};

    await request.post("/league/create_league")
        .set("Cookie", cookie)
        .set("Accept", "application/json")
        .send(inputData)
        .then(res => {})

    await request.post("/league/get_leagues")
        .set("Cookie", cookie)
        .set('Accept', 'application/json')
        .then(res => {
            info =  {
                leagueID: res._body[0]._id,
                leagueName: res._body[0].leagueName
            }
        })
    return info;
}

async function joinLeague(cookie, leagueID){
    await request.post("/league/user_request_to_join")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({leagueID: leagueID})
    .then(res => {
       return res._body;
    })
}

async function getMemberListLeague(cookie, leagueID){
    let results = "";
    await request.post("/league/get_member_list")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({leagueID: leagueID})
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getRecentActivityFriend(cookie){
    let results = "";
    await request.post("/friend_list/get_recent_activity")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getRecommendedFriend(cookie){
    let results = "";
    await request.post("/friend_list/get_recommended")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getBannedListLeague(cookie, leagueID){
    let results = "";
    await request.post("/league/get_banned_list")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({leagueID: leagueID})
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getReceivedInviteListLeague(cookie, leagueID){
    let results = "";
    await request.post("/league/get_pending_request_list")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({leagueID: leagueID})
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getSentInviteListLeague(cookie, leagueID){
    let results = "";
    await request.post("/league/get_sent_invite_list")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({leagueID: leagueID})
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getActiveChallengesLeague(cookie, leagueID){
    let results = "";
    await request.post("/league/get_league_active_challenges")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({leagueID: leagueID})
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getRole(cookie, leagueID){
    let role = "";
    await request.post("/league/get_role")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({leagueID: leagueID})
    .then(res => {
        role = res._body;
    })
    return role;
}
async function deleteLeague(cookie, leagueID){
    await request.post("/league/delete_league")
        .set("Cookie", cookie)
        .set("Accept", "application/json")
        .send({leagueID: leagueID})
        .then(res => {})
}

async function checkMostRecentNotification(cookie, message){
    await request.post("/notifications/get_notifications")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        let result = res._body[0]
        expect(result.message).to.equal(message);
    })
}

async function unFriend(cookie, friendName){
    await request.post("/friend_list/remove_friend")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({friendName: friendName})
    .then(res => {})
}

async function blockFriend(cookie, friendName){
    await request.post("/friend_list/block_user")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({friendName: friendName})
    .then(res => {})
}

async function unBlockFriend(cookie, friendName){
    await request.post("/friend_list/unblock_user")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({friendName: friendName})
    .then(res => {})
}

async function sendFriendRequest(cookie, friendName){
    await request.post("/friend_list/send_friend_request")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({friendName: friendName})
    .then(res => {})
}
async function revokeFriendRequest(cookie, friendName){
    await request.post("/friend_list/remove_sent_request")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({friendName: friendName})
    .then(res => {})
}

async function declineFriendRequest(cookie, friendName){
    await request.post("/friend_list/remove_received_request")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({friendName: friendName})
    .then(res => {})
}
async function acceptFriendRequest(cookie, friendName){
    await request.post("/friend_list/accept_received_request")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({friendName: friendName})
    .then(res => {})
}

async function getSentFriendRequests(cookie){
    let results = [];
    await request.post("/friend_list/sent_request_list")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}
async function getBlockedFriends(cookie){
    let results = [];
    await request.post("/friend_list/blocked_list")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getReceivedFriendRequests(cookie){
    let results = [];
    await request.post("/friend_list/received_request_list")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getFriendList(cookie){
    let results = [];
    await request.post("/friend_list/friend_list")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getPendingFriendList(cookie){
    let results = [];
    await request.post("/friend_list/pending_requests")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}
async function getFriendListInfo(cookie){
    let results = [];
    await request.post("/friend_list/get_all_friends_info")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getSentChallenges(cookie){
    let results = [];
    await request.post("/challenges/sent_challenges")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}


async function getSentLeagues(cookie){
    let results = [];
    await request.post("/league/get_requested_leagues")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getInvitedLeagues(cookie){
    let results = [];
    await request.post("/league/get_invited_leagues")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getAcceptedLeagues(cookie){
    let results = [];
    await request.post("/league/get_leagues")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getOwnedLeagues(cookie){
    let results = [];
    await request.post("/league/get_owned_leagues")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getAdminLeaguesCount(cookie){
    let results = [];
    await request.post("/league/get_admin_leagues_with_challenge_count")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getAdminLeagues(cookie){
    let results = [];
    await request.post("/league/get_admin_leagues")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getReceivedChallenges(cookie){
    let results = [];
    await request.post("/challenges/received_challenges")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}


async function inviteLeague(cookie, leagueID, recipient){
    await request.post("/league/invite_to_join")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({recipient: recipient, leagueID: leagueID})
    .then(res => {})
}

async function acceptLeague(cookie, leagueID, recipient){
    await request.post("/league/accept_join_request")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({recipient: recipient, leagueID: leagueID})
    .then(res => {})
}

async function acceptLeagueInvite(cookie, leagueID){
    await request.post("/league/user_accept_invite")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({leagueID: leagueID})
    .then(res => {})
}

async function addAdmin(cookie, leagueID, recipient){
    await request.post("/league/add_admin")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({recipient: recipient, leagueID: leagueID})
    .then(res => {})
}

async function banUser(cookie, leagueID, recipient){
    await request.post("/league/ban_user")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({recipient: recipient, leagueID: leagueID})
    .then(res => {})
}


function getIssueDate(){
    return Date.now();
}

function getDueDate(){
    // The next day, in ms
    return Date.now() + 24*60*60*1000;
}
async function sendFriendChallenge(cookie, recipient){
    let inputData = {
        receivedUser: recipient,
        issueDate: getIssueDate(),
        dueDate: getDueDate(),
        unit: "m",
        amount: 10,
        exerciseName: "Badminton"
    }
    await request.post("/challenges/add_friend_challenge")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send(inputData)
    .then(res => {})
}

async function acceptChallenge(cookie, sender){
    let challengeID = "";
    await request.post("/challenges/received_challenges")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        let results = res._body;
    
        if (results.length != 1){
            throw "Some test is wrong, not revoking its challenge";
        }

        challengeID = results[0]._id;
    })

    await request.post("/challenges/accept_friend_challenge")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({challengeID:challengeID})
    .then(res => {})
}

async function revokeAllChallenges(cookie, sentChallenges){
    sentChallenges.forEach(async (result) => {
        await request.post("/challenges/delete_friend_challenge")
        .set("Cookie", cookie)
        .set('Accept', 'application/json')
        .send({challengeID : result._id})}
    );
}

async function getIssuedChallenges(cookie){
    let results = [];
    await request.post("/challenges/accepted_challenges")
        .set("Cookie", cookie)
        .set('Accept', 'application/json')
        .then(res =>{
            results = res._body;
        })
        return results;
}

async function getGlobalChallenges(cookie){
    let results = [];
    await request.post("/global_challenge/get_challenges")
        .set("Cookie", cookie)
        .set('Accept', 'application/json')
        .then(res =>{
            results = res._body;
        })
        return results;
}

async function addGlobalChallenge(cookie, data){
    let inputData = {
        issueDate: getIssueDate(),
        dueDate: getDueDate(),
        unit: data.unit,
        amount: data.amount,
        exerciseName: data.exerciseName
    }
    await request.post("/global_challenge/add_challenge")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send(inputData)
    .then(res => {
    })
}

async function getIssuedChallengesByLeague(cookie, leagueID){
    let results = [];
    await request.post("/challenges/league_challenges")
        .set("Cookie", cookie)
        .set('Accept', 'application/json')
        .send({leagueID: leagueID})
        .then(res =>{
            results = res._body;
        })
        return results;
}

async function declineAllChallenges(cookie, receivedChallenges){
    receivedChallenges.forEach(async (result) => {
        await request.post("/challenges/decline_friend_challenge")
        .set("Cookie", cookie)
        .set('Accept', 'application/json')
        .send({challengeID : result._id})}
    );
}

async function sendSelfChallenge(cookie){
    let inputData = {
        receivedUser: "self",
        issueDate: getIssueDate(),
        dueDate: getDueDate(),
        unit: "m",
        amount: 10,
        exerciseName: "Badminton"
    }
    await request.post("/challenges/add_self_challenge")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send(inputData)
    .then(res => {})
}

async function addMedal(cookie, data){
    await request.post("/medals/add_medal")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send(data)
    .expect(200);
}


async function sendSelfChallengeWithData(cookie, data){
    let inputData = {
        receivedUser: "self",
        issueDate: getIssueDate(),
        dueDate: getDueDate(),
        unit: data.unit,
        amount: data.amount,
        exerciseName: data.exerciseName
    }

    await request.post("/challenges/add_self_challenge")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send(inputData)
    .then(res => {})
}

async function sendLeagueChallenge(cookie, leagueID){
    let inputData = {
        receivedUser: leagueID,
        issueDate: getIssueDate(),
        dueDate: getDueDate(),
        unit: "m",
        amount: 10,
        exerciseName: "Badminton"
    }
    await request.post("/challenges/add_league_challenge")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send(inputData)
    .then(res => {})
}

function findMatchingChallenge(challengeList, data){
    let matchingChallenges = [];
    for(let i = 0; i < challengeList.length; i++){
        let exercise = challengeList[i].exercise;
        if(exercise.exerciseName === data.exerciseName && exercise.unit === data.unit){
            matchingChallenges.push(challengeList[i]);
        }
    }
    return matchingChallenges;
}
async function sendExercise(cookie, data){
    await request.post("/exercise_log/add")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send(data)
    .then(res => {})
}

function cleanRecentResults(results){
    let results = results.map(
        (item) => {
            return {
                exerciseName: item.exercise.exerciseName,
                unit: item.exercise.unit,
                amount: item.exercise.amount,
                username: item.username
            };
        }
    )

    return results;
}

async function makeFriend(cookie1, username1, cookie2, username2){
    await helpers.sendFriendRequest(cookie1, username2);
    await helpers.acceptFriendRequest(cookie2, username1);
}

async function createUsers(users, sandbox){
    let userInfo = [];
    for(let i = 0; i < users.length; i++){
        let newUser = {};
        newUser.cookie = await createUser(users[i], sandbox);
        newUser.username = await getUsername(newUser.cookie);
        userInfo.push(newUser);
    }
    return userInfo;
}

async function deleteUsers(usersInfo){
    usersInfo.forEach(async (item)=> {await deleteUser(userInfo.cookie)})
}

module.exports = {
    clearDatabase: clearDatabase,
    createUser: createUser,
    deleteUser: deleteUser,
    loginUser: loginUser,
    getUsername: getUsername,
    createLeague: createLeague,
    getSentChallenges: getSentChallenges,
    getReceivedChallenges: getReceivedChallenges,
    joinLeague: joinLeague,
    deleteLeague: deleteLeague,
    checkMostRecentNotification: checkMostRecentNotification,
    unFriend: unFriend,
    sendFriendRequest: sendFriendRequest,
    revokeFriendRequest: revokeFriendRequest,
    acceptFriendRequest: acceptFriendRequest,
    inviteLeague: inviteLeague,
    acceptLeague: acceptLeague,
    getIssueDate: getIssueDate,
    getDueDate: getDueDate,
    sendFriendChallenge: sendFriendChallenge,
    acceptChallenge: acceptChallenge,
    declineAllChallenges: declineAllChallenges,
    revokeAllChallenges: revokeAllChallenges,
    sendSelfChallenge: sendSelfChallenge,
    sendLeagueChallenge: sendLeagueChallenge,
    getIssuedChallenges: getIssuedChallenges,
    getIssuedChallengesByLeague: getIssuedChallengesByLeague,
    getRole: getRole,
    getSentLeagues: getSentLeagues,
    getInvitedLeagues: getInvitedLeagues,
    getAcceptedLeagues: getAcceptedLeagues,
    getOwnedLeagues: getOwnedLeagues,
    getAdminLeagues: getAdminLeagues,
    getAdminLeaguesCount: getAdminLeaguesCount,
    addAdmin: addAdmin,
    acceptLeagueInvite: acceptLeagueInvite,
    banUser: banUser,
    getBannedListLeague: getBannedListLeague,
    getMemberListLeague: getMemberListLeague,
    getReceivedInviteListLeague: getReceivedInviteListLeague,
    getSentInviteListLeague: getSentInviteListLeague,
    getActiveChallengesLeague: getActiveChallengesLeague,
    getSentFriendRequests: getSentFriendRequests,
    getReceivedFriendRequests: getReceivedFriendRequests,
    getFriendList: getFriendList,
    declineFriendRequest: declineFriendRequest,
    blockFriend: blockFriend,
    unBlockFriend: unBlockFriend,
    getFriendListInfo: getFriendListInfo,
    getPendingFriendList: getPendingFriendList,
    getBlockedFriends: getBlockedFriends,
    sendSelfChallengeWithData: sendSelfChallengeWithData,
    sendExercise: sendExercise,
    findMatchingChallenge: findMatchingChallenge,
    getGlobalChallenges: getGlobalChallenges,
    addGlobalChallenge: addGlobalChallenge,
    addMedal: addMedal,
    getMedalsComplete: getMedalsComplete,
    getMedalsInProgress: getMedalsInProgress,
    checkUserExist: checkUserExist,
    getDisplayName: getDisplayName,
    getUsername: getUsername,
    updatePicture: updatePicture,
    updateDisplayName: updateDisplayName,
    getDataOriginLastDate: getDataOriginLastDate,
    getExerciseLog: getExerciseLog,
    getPastChallenges: getPastChallenges,
    getRecentActivityFriend: getRecentActivityFriend,
    cleanRecentResults: cleanRecentResults,
    getRecommendedFriend: getRecommendedFriend,
    makeFriend: makeFriend,
    createUsers: createUsers,
    deleteUsers: deleteUsers
}