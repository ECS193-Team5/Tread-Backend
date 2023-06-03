const router = require("express").Router();
const multer = require("multer");
let User = require("../models/user.model");
const { uploadImage } = require("./cloudinary.js");

async function isExistingUser(username) {
  return (await User.exists({username: username}).lean() !== null);
}

async function checkUsernameExist(req, res) {
  return res.json(await isExistingUser(req.body.username));
}

router.route('/check_username_exist').post(checkUsernameExist);


async function getPropertyOfUser(username, property) {
  return User.findOne({username: username }, property).lean();
}

async function getDisplayName(req, res) {
  return res.json(await getPropertyOfUser(req.session.username, 'displayName'));
}

router.route('/get_display_name').post(getDisplayName);

async function getUsername(req, res) {
  return res.json(req.session.username);
}

router.route('/get_username').post(getUsername);

async function updateProfileField(username, updates) {
  return User.updateOne(
    {username: username},
    updates, {runValidators: true}
  ).lean();
}

async function updatePicture(req, res) {
  const picture = req.body.picture;
  const username = req.session.username;

  if (!picture) {
    return res.sendStatus(200);
  }

  try {
    await uploadImage(picture, 'profilePictures', username.replace('#', '_'));
  } catch (err) {
    console.log(err);
    return res.status(400).json("picture upload error");
  }
  return res.sendStatus(200);
}

router.route('/update_picture').post(multer().array(), updatePicture);

async function updateDisplayName(req, res) {
  const displayName = req.body.displayName;
  const username = req.session.username;

  if (!User.isValidDisplayName(displayName)) {
    return res.sendStatus(400);
  }

  let update = {
    displayName: displayName
  };

  await updateProfileField(username, update);

  return res.sendStatus(200);
}

router.route('/update_display_name').post(updateDisplayName);

module.exports = router;
module.exports.isExistingUser = isExistingUser;
module.exports.getPropertyOfUser = getPropertyOfUser;
