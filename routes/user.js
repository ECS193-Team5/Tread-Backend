const router = require("express").Router();
const multer = require("multer");
let User = require("../models/user.model");
const { uploadImage } = require("./cloudinary.js");

async function isExistingUser(username) {
  return (await User.exists({username: username}).lean() !== null);
}

router.route('/check_username_exist').post(async (req, res) => {
  return res.json(await isExistingUser(req.body.username));
});


async function getPropertyOfUser(username, property) {
  return User.findOne({username: username }, property).lean();
}

router.route('/get_display_name').post(async (req, res) => {
  return res.json(await getPropertyOfUser(req.session.username, 'displayName'));
});

router.route('/get_username').post(async (req, res) => {
  return res.json(req.session.username);
});

async function updateProfileField(username, updates) {
  return User.findOneAndUpdate(
    {username: username},
    updates, {runValidators: true}
  );
}

router.route('/update_picture').post(multer().array(), async (req, res) => {
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
})

router.route('/update_display_name').post(async (req, res) => {
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
});

module.exports = router;
module.exports.isExistingUser = isExistingUser;
module.exports.getPropertyOfUser = getPropertyOfUser;
