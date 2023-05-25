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
const DEFAULT_PROFILE_IMAGE_URL = "";

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
  console.log(userInfoFromAuth)
  return userInfoFromAuth;
}

function hasUsernameFromDoc(usernameDoc) {
  if (usernameDoc === null || usernameDoc.username === null) {
    return false;
  }
  return true;
}

function isNewUser(usernameDoc) {
  if (usernameDoc === null) {
    return true;
  }
  return false;
}

async function createUser(userInfo) {
  const newUser = new User(userInfo);
  await newUser.save()
}

async function appleLogin(req, res, next) {
  const nonce = req.body.rawNonce;
  const idToken = req.headers.authorization;
  const fullName = req.body.fullName;

  // need to add csrf preventions
  let userInfoFromAuth;
  try {
    userInfoFromAuth = await appleVerify(idToken, nonce);
  } catch (err) {
    return res.status(401).json("Error: " + err);
  }

  let usernameDoc = await User.findOne(
    { authenticationSource: 'apple', authenticationID: userInfoFromAuth.sub },
    'username').lean();

  if (isNewUser(usernameDoc)) {
    userInfo = {
      authenticationSource: 'apple',
      authenticationID: userInfoFromAuth.sub,
      displayName: fullName.givenName,
      given_name: fullName.givenName,
      family_name: fullName.familyName,
      email: userInfoFromAuth.email,
      picture: DEFAULT_PROFILE_IMAGE_URL,
    }

    try {
      await createUser(userInfo);
    } catch (err) {
      return res.status(500).json("Error: " + err);
    }

  }

  const hasUsername = hasUsernameFromDoc(res.locals.usernameDoc);
  const deviceToken = req.body.deviceToken;
  const authenticationSource = res.locals.authenticationSource
  req.session.regenerate(async function (err) {
    if (err) return res.status(500).json(err);
    // store user information in session, typically a user id
    req.session.authenticationSource = authenticationSource;
    req.session.authenticationID = userInfoFromAuth.sub;

    if (hasUsername) {
      req.session.username = res.locals.usernameDoc.username;
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

async function verifyUserAndFindUsername(req, res, next) {

  // need to add csrf preventions
  let userInfoFromAuth;
  try {
    userInfoFromAuth = await googleVerify(req.headers.authorization);
  } catch (err) {
    return res.status(401).json("Error: " + err);
  }

  let usernameDoc = await User.findOne(
    { authenticationSource: 'google', authenticationID: userInfoFromAuth.sub },
    'username').lean();

  res.locals.usernameDoc = usernameDoc;
  res.locals.userInfoFromAuth = userInfoFromAuth;
  next();
}

async function createNewUserIfNecessary(req, res, next) {
  const userInfoFromAuth = res.locals.userInfoFromAuth;
  if (isNewUser(res.locals.usernameDoc)) {
    userInfo = {
      authenticationSource: 'google',
      authenticationID: userInfoFromAuth.sub,
      displayName: userInfoFromAuth.given_name,
      given_name: userInfoFromAuth.given_name,
      family_name: userInfoFromAuth.family_name,
      email: userInfoFromAuth.email,
      picture: userInfoFromAuth.picture,
    }

    try {
      await createUser(userInfo);
    } catch (err) {
      return res.status(500).json("Error: " + err);
    }

  }
  next();
}

async function generateLoggedInSession(req, res, next) {
  const hasUsername = hasUsernameFromDoc(res.locals.usernameDoc);
  const userInfoFromAuth = res.locals.userInfoFromAuth;
  const deviceToken = req.body.deviceToken;
  req.session.regenerate(async function (err) {
    if (err) return res.status(500).json(err);
    // store user information in session, typically a user id
    req.session.authenticationSource = 'google';
    req.session.authenticationID = userInfoFromAuth.sub;

    if (hasUsername) {
      req.session.username = res.locals.usernameDoc.username;
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

router.route('/login/google').post(verifyUserAndFindUsername, createNewUserIfNecessary, generateLoggedInSession);

router.route('/login/apple').post(appleLogin);


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
