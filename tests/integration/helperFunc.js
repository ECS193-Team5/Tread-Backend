var request = require("supertest");
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI
const app = require("../../index");
request = request(app);
const googleauth = require('google-auth-library');

async function createUser(user, sandbox) {
    let cookie = await loginUser(user, sandbox);
    await request.post("/sign_up/sign_up")
        .set('Accept', 'application/json')
        .set('Cookie', cookie)
        .send({ "username": user.given_name, "displayName": user.given_name, "picture": "https://res.cloudinary.com/dtsw9d8om/image/upload/profilePictures/batman_9320.png" })
        .then(res => {
        })
    return cookie;
}

async function deleteUser(cookie) {
    await request.delete("/delete_user/")
        .set('Cookie', cookie)
        .then(res => {
        });
    return;
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
        expect(result.message).toBe(message);
    })
}

async function unFriend(cookie, friendName){
    await request.post("/friend_list/remove_friend")
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
async function acceptFriendRequest(cookie, friendName){
    await request.post("/friend_list/accept_received_request")
    .set("Cookie", cookie)
    .set('Accept', 'application/json')
    .send({friendName: friendName})
    .then(res => {})
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


module.exports = {
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
    getIssuedChallengesByLeague: getIssuedChallengesByLeague

}