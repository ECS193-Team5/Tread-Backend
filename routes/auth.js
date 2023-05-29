const router = require("express").Router();
let User = require("../models/user.model");
const { registerDeviceToken, removeDeviceToken } = require("./notifications.js");
const { OAuth2Client } = require('google-auth-library');
const crypto = require("crypto");
const appleSignin = require("apple-signin-auth");
const CLIENT_ID = process.env.CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);
const APPLE_SERVICE_ID = 'run.tread.applesignin';
const APPLE_BUNDLE_ID = 'run.tread.treadmobile';
const DEFAULT_PROFILE_IMAGE_URL = "https://i.imgur.com/XY9rcVx.png";

async function googleVerify(token) {

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
  const userInfoFromAuth = ticket.getPayload();

  return userInfoFromAuth;
  // If request specified a G Suite domain:
  // const domain = userInfoFromAuth['hd'];
}
async function appleVerify(token, nonce){
  const userInfoFromAuth = await appleSignin.verifyIdToken(token, {
    audience: [APPLE_SERVICE_ID, APPLE_BUNDLE_ID], // client id - can also be an array
    nonce: nonce ? crypto.createHash('sha256').update(nonce).digest('hex') : undefined,
  });

  return userInfoFromAuth;
}

async function verify(authenticationSource, IDToken, nonce) {
  if(authenticationSource === 'google') {
    return await googleVerify(IDToken);
  } else if (authenticationSource === 'apple') {
    return await appleVerify(IDToken, nonce);
  }
}

async function getUserDocFromAuthSub(authenticationSource, authenticationSub) {
  return await User.findOne(
    { authenticationSource: authenticationSource, authenticationID: authenticationSub },
    'username').lean();
}

function isNewUser(userDoc) {
  if (userDoc === null) {
    return true;
  }
  return false;
}

async function createUser(userInfo) {
  const newUser = new User(userInfo);
  await newUser.save()
}

async function createAppleUser(userInfoFromAuth, fullName) {
  let userInfo = {
    authenticationSource: 'apple',
    authenticationID: userInfoFromAuth.sub,
    email: userInfoFromAuth.email,
    picture: DEFAULT_PROFILE_IMAGE_URL,
  }

  if(fullName && fullName.givenName){
    userInfo.displayName =  fullName.givenName
    userInfo.given_name =  fullName.givenName
  }

  if(fullName && fullName.family_name){
    userInfo.family_name = fullName.familyName
  }

  await createUser(userInfo);
}

async function createGoogleUser(userInfoFromAuth) {
  let userInfo = {
    authenticationSource: 'google',
    authenticationID: userInfoFromAuth.sub,
    displayName: userInfoFromAuth.given_name,
    given_name: userInfoFromAuth.given_name,
    family_name: userInfoFromAuth.family_name,
    email: userInfoFromAuth.email,
    picture: userInfoFromAuth.picture,
  }

  await createUser(userInfo);
}

async function createNewUserIfNecessary(authenticationSource, userInfoFromAuth, userDoc, fullName) {
  if(!isNewUser(userDoc)) {
    return
  }

  if (authenticationSource === 'google') {
    await createGoogleUser(userInfoFromAuth);
  } else if (authenticationSource === 'apple') {
    await createAppleUser(userInfoFromAuth, fullName)
  }
}

async function login(authenticationSource, IDToken, nonce, fullName) {

  const userInfoFromAuth = await verify(authenticationSource, IDToken, nonce);
  const userDoc = await getUserDocFromAuthSub(authenticationSource, userInfoFromAuth.sub);
  await createNewUserIfNecessary(authenticationSource, userInfoFromAuth, userDoc, fullName);

  const sessionNeededInfo = {
    sub: userInfoFromAuth.sub,
    userDoc: userDoc,
    authenticationSource: authenticationSource
  }

  return sessionNeededInfo;
}

async function appleLogin(req, res, next) {

  const IDToken = req.headers.authorization;
  const nonce = req.body.nonce;
  const fullName = req.body.fullName;

  // need to add csrf preventions
  try {
    const createSessionInfo = await login('apple', IDToken, nonce, fullName);
    res.locals.sessionNeededInfo = createSessionInfo;
    return next();
  } catch (err) {
    console.log(err);
    return res.status(401).json("Error: " + err);
  }
}


async function googleLogin(req, res, next) {
  const IDToken = req.headers.authorization;
  // need to add csrf preventions

  try {
    const createSessionInfo = await login('google', IDToken);
    res.locals.sessionNeededInfo = createSessionInfo;
    return next()
  } catch (err) {
    console.log(err);
    return res.status(401).json("Error: " + err);
  }
}

function hasUsernameFromDoc(userDoc) {
  if (userDoc === null || userDoc.username === null) {
    return false;
  }
  return true;
}

async function generateLoggedInSession(req, res, next) {

  const userDoc = res.locals.sessionNeededInfo.userDoc;
  const hasUsername = hasUsernameFromDoc(userDoc);
  const authSub = res.locals.sessionNeededInfo.sub;
  const authenticationSource = res.locals.sessionNeededInfo.authenticationSource;
  const deviceToken = req.body.deviceToken;

  req.session.regenerate(async function (err) {
    if (err) return res.status(500).json(err);
    // store user information in session, typically a user id
    req.session.authenticationSource = authenticationSource;
    req.session.authenticationID = authSub;
    if (hasUsername) {
      req.session.username = res.locals.sessionNeededInfo.userDoc.username;
      await registerDeviceToken(req.session.username, deviceToken);
    } else {
      req.session.username = null;
    }

    // save the session before redirection to ensure page
    // load does not happen before session is saved
    req.session.save(function (err) {
      if (err) return res.status(500).json(err);
      return res.status(200).json({ hasUsername: hasUsername });
    })
  })
}



router.route('/login/google').post(googleLogin, generateLoggedInSession);

router.route('/login/apple').post(appleLogin, generateLoggedInSession);


async function logout(req, res) {
  // logout logic

  await removeDeviceToken(req.session.username, req.body.deviceToken);

  // clear the user from the session object and save.
  // this will ensure that re-using the old session id
  // does not have a logged in user
  req.session.authenticationID = null;
  req.session.authenticationSource = null;
  req.session.username = null;
  req.session.save(function (err) {
    if (err) return res.sendStatus(500);

    // regenerate the session, which is good practice to help
    // guard against forms of session fixation
    req.session.regenerate(function (err) {
      if (err) return res.sendStatus(500);
      return res.sendStatus(200);
    })
  })
}

router.route('/logout').post(logout);

module.exports = router;
module.exports.logout = logout;
