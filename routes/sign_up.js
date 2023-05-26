const router = require("express").Router();
const multer = require("multer");
let User = require("../models/user.model");
let User_inbox = require("../models/user_inbox.model");
const Medals = require("../models/medals.model");
const Medal_progress = require("../models/medal_progress.model");
const { registerDeviceToken } = require("./notifications.js");
const {uploadImage} = require('./cloudinary.js');

router.route('/get_profile_photo').post(
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
        if (discriminator === end) {
          throw new Error("Username not available")
        }
      }
    } while(!validUsername)

    return profileInfo.username;
  }

  async function generateUserMedalProgress(username) {

    const medals = await Medals.find({});
    const medalsProgress = medals.map(medal => {
      return {insertOne: {
        document: {
          username: username,
          level: medal["level"],
          exercise: medal["exercise"]
        }
      }}
    });

    await Medal_progress.bulkWrite(medalsProgress, {ordered: false});
  }

  router.route('/sign_up').post(multer().array(), async (req, res,) => {
    if (req.session.username !== null) {
      console.log("Sign up fails because", req.session.username);
      return res.status(400).json("Error: already has username");
    }
    const chosenUsername = req.body.username;
    const picture = req.body.picture;
    const displayName = req.body.displayName;

    if (!User.isValidUsername(chosenUsername)) {
      return res.status(400).json("Error: invalid username")
    }

    if (!User.isValidDisplayName(displayName)) {
      return res.status(400).json("Error: invalid displayName")
    }

    const userIdentifiers = {
      authenticationSource : req.session.authenticationSource,
      authenticationID : req.session.authenticationID
    }

    let profileInfo = {};

    let completeUsername = null;
    try {
      completeUsername = await setUsernameAndUpdateProfile(userIdentifiers, profileInfo, chosenUsername)
    } catch (e){
      console.log("Sign up fails because no username available");
      return res.status(500).json("Username not available");
    }

    req.session.username = completeUsername;

    // Init necessary models
    try {
      await Promise.all([
        createUserInbox(completeUsername),
        generateUserMedalProgress(completeUsername),
        uploadImage(picture, 'profilePictures', completeUsername.replace('#', '_')),
        registerDeviceToken(req.session.username, req.body.deviceToken)
      ]);
    } catch (err){
      console.log(err)
      return res.sendStatus(500);
    }

    return res.sendStatus(200);
  });

module.exports = router;