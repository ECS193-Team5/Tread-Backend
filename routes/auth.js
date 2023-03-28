const router = require("express").Router();
let User = require("../models/user.model");
let User_inbox = require("../models/user_inbox.model");
const { registerDeviceToken } = require("./user_devices.js");
const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = process.env.CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

function verifyLoggedIn(req, res, next) {
  if (!req.session.authenticationID || !req.session.authenticationSource) {
    return res.status(400).json("haven't logged in yet")
  }
  next();
}


router.route('/get_profile_photo').post(
  verifyLoggedIn,
  async (req, res) => {
  const authenticationID = req.session.authenticationID;
  const authenticationSource = req.session.authenticationSource;

  const photoDoc = await User.findOne({
    authenticationID: authenticationID,
    authenticationSource: authenticationSource,
  }).lean();
  return res.status(200).json(photoDoc.picture);
});

async function createUserInbox(username) {
  const blankUserInbox = {
    username: username,
  }
  const newUserInbox = new User_inbox(blankUserInbox)
  await newUserInbox.save()
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

function formatDiscriminator(discriminator) {
  return discriminator.toString().padStart(4 , '0')
}

async function setUsernameAndUpdateProfile(userIdentifiers, profileInfo, chosenUsername) {
  let discriminator = getRandomIntInclusive(0, 9999);
  const end = discriminator;
  profileInfo.username = chosenUsername + '#' + formatDiscriminator(discriminator);

  let validUsername = false;
  do{
    try {
      await User.updateOne(userIdentifiers, profileInfo, {runValidators: true});
      // gets here if update succeeds
      validUsername = true;
    } catch (err){ //try with different discriminator
      discriminator = (discriminator + 1) % 10000;
      profileInfo.username = chosenUsername + '#' + formatDiscriminator(discriminator);
      if (discriminator == end) {
        throw new Error("Username not available")
      }
    }
  } while(!validUsername)

  return profileInfo.username;
}

router.route('/sign_up').post(async (req, res,) => {
  if (req.session.username !== null) {
    return res.status(400).json("Error: already has username");
  }
  const chosenUsername = req.body.username;
  const picture = req.body.picture;
  const displayName = req.body.displayName;

  if (!User.isValidUsername(chosenUsername)) {
    return res.status(400).json("Error: invalid username")
  }

  const userIdentifiers = {
    authenticationSource : req.session.authenticationSource,
    authenticationID : req.session.authenticationID
  }

  let profileInfo = {};
  if (picture) profileInfo.picture = picture;
  if (displayName) profileInfo.displayName = displayName

  let completeUsername = null;
  try {
    completeUsername = await setUsernameAndUpdateProfile(userIdentifiers, profileInfo, chosenUsername)
  } catch (e){
    return res.status(500).json("Username not available");
  }

  req.session.username = completeUsername;

  // Init necessary models
  try {
    await createUserInbox(completeUsername);
  } catch {
    return res.sendStatus(500);
  }

  // Add device token
  await registerDeviceToken(req.session.username, req.body.deviceToken)
  return res.sendStatus(200);

});

async function verify(token) {
  const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
  const userInfoFromAuth = ticket.getPayload();
  const userid = userInfoFromAuth['sub'];
  return userInfoFromAuth;
  // If request specified a G Suite domain:
  // const domain = userInfoFromAuth['hd'];
}

function hasUsernameFromDoc(usernameDoc) {
  if (usernameDoc === null || usernameDoc.username === null) {
    return false;
  }
  return true;
}

function isNewUser(usernameDoc) {
  if (usernameDoc == null) {
    return true;
  }
  return false;
}

async function createUser(userInfo) {
const newUser = new User(userInfo);
await newUser.save()
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
    return res.status(200).json({hasUsername: hasUsername});
    })
  })
}

router.route('/login/google').post(async (req, res, next) => {

  // need to add csrf preventions
  let userInfoFromAuth;
  try {
    userInfoFromAuth = await verify(req.headers.authorization);
  } catch (err) {
    return res.status(401).json("Error: " + err);
  }

  let usernameDoc = await User.findOne(
    {authenticationSource: 'google', authenticationID: userInfoFromAuth.sub},
    'username').lean();

  res.locals.usernameDoc = usernameDoc;
  res.locals.userInfoFromAuth = userInfoFromAuth;
  next();

}, createNewUserIfNecessary, generateLoggedInSession);


function logout(req, res) {
  // logout logic

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
      if (err) res.sendStatus(500);
      return res.sendStatus(200);
    })
  })
}

router.route('/logout').post(logout);

module.exports = router;
module.exports.logout = logout;
