const router = require("express").Router();
let User = require("../models/user.model");
let Friend_lists = require("../models/friend_list.model");
const Challenge = require("../models/challenge.model");
const { logout } = require("./auth.js");

router.route("/create_user").post((req, res) => {
  const req_name = req.body.name;
  const req_email = req.body.email;
  const req_username = req.body.username;

  // console.log(req.body)

  const newUser = new User({
    name: req_name,
    email: req_email,
    username: req_username
  });

  newUser
    .save()
    .then(() => res.json("new User added"))
    .catch((err) => res.status(400).json("Error: " + err));
});

async function isExistingUser(username) {
  return (await User.exists({username: username}).lean() !== null);
}

router.route('/check_username_exist').post(async (req, res) => {
  return res.json(await isExistingUser(req.body.username));
});


async function getPropertyOfUser(username, property) {
  return Friend_lists.findOne({username: username }, property);
}
// not tested functions
router.route('/get_display_name').post(async (req, res) => {
  return res.json(await getPropertyOfUser(req.session.username, 'displayName'));
});

router.route('/get_profile_photo').post(async (req, res) => {
  return res.json(await getPropertyOfUser(req.session.username, 'picture'));
});

router.route('/update_profile_info').post(async (req, res) => {
});

async function removeUserFromFriendField(field){
  await Friend_lists.updateMany(field, {$pull: field});
}

async function deleteUserFriendList(username) {
  await Friend_lists.findOneAndDelete({username: username});
  await removeUserFromFriendField({friends: username});
  await removeUserFromFriendField({blocked: username});
  await removeUserFromFriendField({blockedBy: username});
  await removeUserFromFriendField({sentRequests: username});
  await removeUserFromFriendField({recievedRequests: username});
}

async function deleteUserChallenges(username) {
  await Challenge.deleteMany({sentUser: username, challengeType: "self"});
  await Challenge.deleteMany({sentUser: username, status: "pending"});
  await Challenge.deleteMany({recievedUser: username, status: "pending"});
  // remove historical challenges
}

router.delete('/delete_account', async (req, res, next) => {
  const username = req.session.username;
  try {
    await User.findOneAndDelete({username: username});
    await deleteUserFriendList(username);
    await deleteUserChallenges(username);
    // Remove from league
  } catch (err) {
    console.log(err);
    return res.status(500).json("Could not finish deleting profile.");
  }
  next();
}, logout);




module.exports = router;
module.exports.isExistingUser = isExistingUser;
