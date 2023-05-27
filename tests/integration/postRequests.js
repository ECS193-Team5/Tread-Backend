var request = require("supertest");
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
request = request(app);
const googleauth = require('google-auth-library');
const appleSignin = require("apple-signin-auth");
const { expect } = require("chai");
const mongoose = require('mongoose');
const Challenge = require("../../models/challenge.model");
const Challenge_progress = require("../../models/challenge_progress.model");
const Global_challenge = require("../../models/global_challenge.model");
const Global_challenge_progress = require("../../models/global_challenge_progress.model");
const uri = process.env.TEST_ATLAS_URI;


/* Mongoose Functions */
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
}
/*
after(async () => {
    const mongoose = require("mongoose");
    await mongoose.disconnect();
    app.close();
})*/


/* Auth Functions */
async function loginAppleUser(user, sandbox) {

    let cookie = "";
    var userVal = {
        fullName: {
            "givenName":user.given_name,
            "familyName":user.family_name
        },
        sub: user.sub,
        deviceToken:"token",
        nonce:"nonce"
    }
    sandbox.restore();
    sandbox.stub(appleSignin, "verifyIdToken").resolves(userVal);

    await request.post("/auth/login/apple")
        .set('Accept', 'application/json')
        .send(userVal)
        .then(res => {
            cookie = res.headers['set-cookie'];
        }
    )
    sandbox.restore();
    return cookie;
}

async function loginGoogleUser(user, sandbox) {

    let cookie = "";
    var userVal = {
        sub: user.sub,
        given_name: user.given_name,
        family_name: user.family_name,
        email: "testemail" + user.sub + "@gmail.com",
        picture: "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png"
    }
    sandbox.restore();
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
/* Challenges Functions */
// get challenge list functions
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

// send challenge functions
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

async function sendLeagueChallengeWithData(cookie, leagueID, data){
    let inputData = {
        receivedUser: leagueID,
        issueDate: getIssueDate(),
        dueDate: getDueDate(),
        unit: data.unit,
        amount: data.amount,
        exerciseName: data.exerciseName
    }
    await request.post("/challenges/add_league_challenge")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send(inputData)
    .then(res => {})
}

// Challenge Interaction functions
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

async function declineAllChallenges(cookie, receivedChallenges){
    receivedChallenges.forEach(async (result) => {
        await request.post("/challenges/decline_friend_challenge")
        .set("Cookie", cookie)
        .set('Accept', 'application/json')
        .send({challengeID : result._id})}
    );
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

/* Data Origin Functions */
async function getDataOriginLastDate(cookie, dataOrigin){
    let results = {};
    await request.post("/data_origin/get_origin_anchor")
        .set("Cookie", cookie)
        .set('Accept', 'application/json')
        .send({dataOrigin:dataOrigin})
        .then(res => {
           results = res._body;
        })
    return results;
}

/* Delete User Functions */
async function deleteUser(cookie) {
    let status = "";
    await request.delete("/delete_user/")
        .set('Cookie', cookie)
        .then(res => {
            status = res.status;
        });

    return status;
}

async function deleteUsers(usersInfo){
    for(let i =0; i< usersInfo.length; i++){
        await deleteUser(usersInfo[i].cookie);
    }
}

/* Exercise Log Functions */
async function sendExercise(cookie, data){
    await request.post("/exercise_log/add")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send(data)
    .then(res => {})
}

const calculateUnitType = (unit) => {
    if (["m", "km", "mi", "yd", "ft"].includes(unit)){
        return "distance";
    }
    else if (["sec", "min", "hr"].includes(unit)){
        return "time";
    }
    return "count";
}

function getUniqueExercises(exerciseList){
    let exercisesUnique = {};
    let uniqueExerciseList = [];
    exerciseList.forEach(element => {
        let exerciseName = element.exercise.exerciseName;
        let unitType = calculateUnitType(element.exercise.unit);

        if (!(exerciseName in exercisesUnique)){
            exercisesUnique[exerciseName] = new Set();
        }
        if(!exercisesUnique[exerciseName].has(unitType)){
            exercisesUnique[exerciseName].add(unitType);
            uniqueExerciseList.push({"exerciseName":exerciseName, "unitType":unitType});
        }
    });
    return uniqueExerciseList;
}
async function sendExerciseList(cookie, dataOrigin, anchor, exerciseList){
    let uniqueExercises = getUniqueExercises(exerciseList);
    let status = "";
    await request.post("/exercise_log/add_exercise_list")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({dataOrigin: dataOrigin, exerciseList: exerciseList, uniqueExercises:uniqueExercises, anchor:anchor})
    .then(res => {status = res.status})
    return status;
}

/* Friend List Functions */
// Friend Interaction Functions
async function unFriend(cookie, friendName){
    await request.post("/friend_list/remove_friend")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({friendName: friendName})
    .then(res => {status = res.status})
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

async function makeFriend(user1, user2){
    await sendFriendRequest(user1.cookie, user2.username);
    await acceptFriendRequest(user2.cookie, user1.username);
}

// Friend List Functions
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

// Friend Recommendation Functions
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

function cleanRecentResults(results){
    results = results.map(
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

async function getRecommendedFriends(cookie){
    let results = "";
    await request.post("/friend_list/get_recommended")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}

/* Global Challenges Functions */
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
    .expect(200);
}

async function getGlobalLeaderboard(cookie, challengeID){
    let results = "";
    await request.post("/global_challenge/get_leaderboard")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({challengeID: challengeID})
    .then(res =>{
        results = res._body
    })
    return results;
}

function expectChallengeValues(challenge, expectedCompleted, expectedProgress){
    expect(challenge.completed).to.equal(expectedCompleted);
    expect(challenge.progress).to.equal(expectedProgress);
}

async function bulkUserSendExercises(usersInfo, data){
    for(let i = 0; i< usersInfo.length; i++){
        data.amount = i + 1;
        await sendExercise(usersInfo[i].cookie,data);
    }
}

/* League Functions */
// Helper functions
function getIssueDate(){
    return Date.now();
}

function getDueDate(){
    // The next day, in ms
    return Date.now() + 24*60*60*1000;
}

// League Life Cycle
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

async function getLeagueLeaderboard(cookie, leagueID){
    let results = "";
    await request.post("/league/get_leaderboard")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({leagueID: leagueID})
    .then(res => {
        results = res._body;
    })
    return results;
}

async function deleteLeague(cookie, leagueID){
    await request.post("/league/delete_league")
        .set("Cookie", cookie)
        .set("Accept", "application/json")
        .send({leagueID: leagueID})
        .then(res => {})
}

async function getRecentActivityLeague(cookie){
    let results = "";
    await request.post("/league/get_recent_activity")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}

async function getRecommendedLeagues(cookie){
    let results = "";
    await request.post("/league/get_recommended")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        results = res._body;
    })
    return results;
}
// League User Joining
async function joinLeague(cookie, leagueID){
    await request.post("/league/user_request_to_join")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({leagueID: leagueID})
    .then(res => {
       return res._body;
    })
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

// League Roles
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


// League List Viewing
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

/* Medals Functions */
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

async function addMedal(cookie, data){
    await request.post("/medals/add_medal")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send(data)
    .expect(200);
}

/* Notifications Functions */
async function checkMostRecentNotification(cookie, message){
    await request.post("/notifications/get_notifications")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .then(res => {
        let result = res._body[0]
        expect(result.message).to.equal(message);
    })
}

/* Sign Up Functions */
async function createGoogleUser(user, sandbox) {
    let cookie = await loginGoogleUser(user, sandbox);

    await request.post("/sign_up/sign_up")
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({"username": user.given_name, "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
        .then(res => {
        })
    return cookie;
}

async function createAppleUser(user, sandbox) {
    let cookie = await loginAppleUser(user, sandbox);
    await request.post("/sign_up/sign_up")
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({"username": user.given_name, "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
        .then(res => {
        })
    return cookie;
}

async function createGoogleUsers(users, sandbox){
    let userInfo = [];
    for(let i = 0; i < users.length; i++){
        let newUser = {};
        newUser.cookie = await createGoogleUser(users[i], sandbox);
        newUser.username = await getUsername(newUser.cookie);
        userInfo.push(newUser);
    }
    return userInfo;
}


/* Stats Functions */
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

/* User Functions */
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


async function delay(milliseconds){
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

module.exports = {    acceptChallenge: acceptChallenge,
    acceptFriendRequest: acceptFriendRequest,
    acceptLeague: acceptLeague,
    acceptLeagueInvite: acceptLeagueInvite,
    addAdmin: addAdmin,
    addGlobalChallenge: addGlobalChallenge,
    addMedal: addMedal,
    banUser: banUser,
    blockFriend: blockFriend,
    bulkUserSendExercises: bulkUserSendExercises,
    checkMostRecentNotification: checkMostRecentNotification,
    checkUserExist: checkUserExist,
    cleanRecentResults: cleanRecentResults,
    clearDatabase: clearDatabase,
    createLeague: createLeague,
    createGoogleUser: createGoogleUser,
    createGoogleUsers: createGoogleUsers,
    createAppleUser: createAppleUser,
    declineAllChallenges: declineAllChallenges,
    declineFriendRequest: declineFriendRequest,
    delay: delay,
    deleteLeague: deleteLeague,
    deleteUser: deleteUser,
    deleteUsers: deleteUsers,
    expectChallengeValues: expectChallengeValues,
    findMatchingChallenge: findMatchingChallenge,
    getAcceptedLeagues: getAcceptedLeagues,
    getActiveChallengesLeague: getActiveChallengesLeague,
    getAdminLeagues: getAdminLeagues,
    getAdminLeaguesCount: getAdminLeaguesCount,
    getBannedListLeague: getBannedListLeague,
    getBlockedFriends: getBlockedFriends,
    getDataOriginLastDate: getDataOriginLastDate,
    getDisplayName: getDisplayName,
    getDueDate: getDueDate,
    getExerciseLog: getExerciseLog,
    getFriendList: getFriendList,
    getFriendListInfo: getFriendListInfo,
    getGlobalChallenges: getGlobalChallenges,
    getGlobalLeaderboard: getGlobalLeaderboard,
    getInvitedLeagues: getInvitedLeagues,
    getIssueDate: getIssueDate,
    getIssuedChallenges: getIssuedChallenges,
    getIssuedChallengesByLeague: getIssuedChallengesByLeague,
    getLeagueLeaderboard: getLeagueLeaderboard,
    getMedalsComplete: getMedalsComplete,
    getMedalsInProgress: getMedalsInProgress,
    getMemberListLeague: getMemberListLeague,
    getOwnedLeagues: getOwnedLeagues,
    getPastChallenges: getPastChallenges,
    getPendingFriendList: getPendingFriendList,
    getReceivedChallenges: getReceivedChallenges,
    getReceivedFriendRequests: getReceivedFriendRequests,
    getReceivedInviteListLeague: getReceivedInviteListLeague,
    getRecentActivityFriend: getRecentActivityFriend,
    getRecentActivityLeague: getRecentActivityLeague,
    getRecommendedFriends: getRecommendedFriends,
    getRecommendedLeagues: getRecommendedLeagues,
    getRole: getRole,
    getSentChallenges: getSentChallenges,
    getSentFriendRequests: getSentFriendRequests,
    getSentInviteListLeague: getSentInviteListLeague,
    getSentLeagues: getSentLeagues,
    getUsername: getUsername,
    inviteLeague: inviteLeague,
    joinLeague: joinLeague,
    loginGoogleUser: loginGoogleUser,
    loginAppleUser: loginAppleUser,
    makeFriend: makeFriend,
    revokeAllChallenges: revokeAllChallenges,
    revokeFriendRequest: revokeFriendRequest,
    sendExercise: sendExercise,
    sendExerciseList: sendExerciseList,
    sendFriendChallenge: sendFriendChallenge,
    sendFriendRequest: sendFriendRequest,
    sendLeagueChallenge: sendLeagueChallenge,
    sendLeagueChallengeWithData: sendLeagueChallengeWithData,
    sendSelfChallenge: sendSelfChallenge,
    sendSelfChallengeWithData: sendSelfChallengeWithData,
    unBlockFriend: unBlockFriend,
    unFriend: unFriend,
    updateDisplayName: updateDisplayName,
    updatePicture: updatePicture,
}