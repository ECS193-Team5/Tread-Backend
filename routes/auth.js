const router = require("express").Router();
let User = require("../models/user.model");
let Friend_lists = require("../models/friend_list.model");
const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = '1076047412250-apdkut808sf29i8ju8k0lt1jp4gh8n8s.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);
const crypto = require("crypto");

async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    return payload;
    // If request specified a G Suite domain:
    // const domain = payload['hd'];
}

async function createUser(user_info) {
  const newUser = new User(user_info);
  await newUser.save()
}

async function createFriendList(username) {
  const blankFriendList = {
    username: username,
    friends: [],
    blocked: [],
    sentRequests: [],
    receivedRequests: [],
  }
  const newFriendList = new Friend_lists(blankFriendList)
  await newFriendList.save()
}

function isValidUsername(username) {
  if (username.length == 0 || username.len > 32) {
    return false;
  }

  if (!(/^[a-z0-9]+$/i.test(username))) {
    return false;
  }
  return true;

}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

function formatDiscriminator(discriminator) {
  return discriminator.toString().padStart(4 , '0')
}

router.route('/sign_up').post(async (req, res,) => {
  if (req.session.username) {
    return res.status(400).json("Error: already has username");
  }
  const chosenUsername = req.body.username;
  const profilePhotoURL = req.body.photo;
  const displayName = req.body.displayName;

  if (!isValidUsername(chosenUsername)) {
    return res.status(400).json("Error: invalid username")
  }

  let discriminator = getRandomIntInclusive(0, 9999);
  let end = discriminator;
  let completeUsername = chosenUsername + '#' + formatDiscriminator(discriminator);
  if (await User.exists({username: completeUsername}).lean() !== null) {
    do {
      discriminator = (discriminator + 1) % 10000;
      completeUsername = chosenUsername + '#' + formatDiscriminator(discriminator);
    } while (await User.exists({username: completeUsername}).lean() !== null || discriminator == end);
  }
  console.log(completeUsername);

  req.session.username = completeUsername;
  await User.findOneAndUpdate({
    authenticationSource : req.session.authenticationSource,
    authenticationID : req.session.authenticationID}, {
    username : completeUsername,
    profilePhoto: profilePhotoURL,
    displayName: displayName
  });


  // Init necessary models
  try {
    await createFriendList(completeUsername);
  } catch {
    return res.status(500);
  }
  return res.sendStatus(200);

});

router.route('/login/google').post(async (req, res) => {

  // need to add csrf preventions
  let payload;
  try {
    payload = await verify(req.headers.authorization);
  } catch (err) {
    return res.status(401).json("Error: " + err);
  }

  let isNewUser = false;
  let usernameDoc = await User.findOne(
    {authenticationSource: 'google', authenticationID: payload.sub},
    'username');
  if (usernameDoc === null) {
    isNewUser = true;
    user_info = {
      authenticationSource: 'google',
      authenticationID: payload.sub,
      given_name: payload.given_name,
      family_name: payload.family_name,
      email: payload.email,
      picture: payload.picture,
      username: '',
      ifMetric: true,
    }

    try {
      await createUser(user_info);
    } catch (err) {
      return res.status(500).json("Error: " + err);
    }

  }

  req.session.regenerate(function (err) {
    if (err) return res.sendStatus(500);

    // store user information in session, typically a user id
    req.session.authenticationSource = 'google';
    req.session.authenticationID = payload.sub;
    if (!isNewUser) {
      req.session.username = usernameDoc.username;
    }

    // save the session before redirection to ensure page
    // load does not happen before session is saved
    req.session.save(function (err) {
    if (err) return res.sendStatus(500);
    return res.status(200).send({isNewUser: isNewUser});
    })
  })

});

router.route('/logout').post(async (req, res) => {
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
});

module.exports = router;