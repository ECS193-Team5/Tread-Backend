const router = require("express").Router();
const multer = require("multer");
let User = require("../models/user.model");
let User_inbox = require("../models/user_inbox.model");
const Friend_connection = require("../models/friend_connection.model");
const Challenge = require("../models/challenge.model");
const League = require("../models/league.model");
const { uploadImage } = require("./cloudinary.js");
const { logout } = require("./auth.js");

async function isExistingUser(username) {
  return (await User.exists({username: username}).lean() !== null);
}

router.route('/check_username_exist').post(async (req, res) => {
  return res.json(await isExistingUser(req.body.username));
});


async function getPropertyOfUser(username, property) {
  return User.findOne({username: username }, property).lean();
}
// not tested functions
router.route('/get_display_name').post(async (req, res) => {
  return res.json(await getPropertyOfUser(req.session.username, 'displayName'));
});

router.route('/get_profile_photo').post(async (req, res) => {
  return res.json(await getPropertyOfUser(req.session.username, 'picture'));
});

router.route('/get_username').post(async (req, res) => {
  return res.json(req.session.username);
});

async function updateProfileField(username, updates) {
  User.findOneAndUpdate(
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

  if (!displayName) {
    return res.sendStatus(200);
  }

  let update = {
    displayName: displayName
  };

  try {
    await updateProfileField(username, update);
  } catch {
    return res.status(400).json("displayName not valid");
  }

  return res.sendStatus(200);
});

async function createQueryToPullFieldFromMany(filter) {
  return {
    updateMany: {
      filter: filter,
      update: {$pull: filter}
    }
  }
}

async function createQueryToDeleteMany(filter) {
  return {
    deleteMany: {
      filter: filter,
    }
  }
}

async function deleteUserFriendList(username) {
  let userInboxQueries = [];
  let friendConnectionQueries = [];
  userInboxQueries.append(createQueryToPullFieldFromMany({blocked: username}));
  userInboxQueries.append(createQueryToPullFieldFromMany({blockedBy: username}));
  userInboxQueries.append(createQueryToPullFieldFromMany({sentRequests: username}));
  userInboxQueries.append(createQueryToPullFieldFromMany({recievedRequests: username}));
  friendConnectionQueries.append(createQueryToDeleteMany({username: username}));
  friendConnectionQueries.append(createQueryToDeleteMany({friendName: username}));
  Promise.all([
    User_inbox.bulkWrite(userInboxQueries),
    Friend_connection.bulkWrite(friendConnectionQueries),
    User_inbox.findOneAndDelete({username: username}),
  ]);
}

// Need to bulk write this
async function deleteUserChallenges(username) {
  let challengeQueries = [];
  await Challenge.deleteMany({sentUser: username, challengeType: "self"});
  await Challenge.deleteMany({sentUser: username, status: "pending"});
  await Challenge.deleteMany({recievedUser: username, status: "pending"});
  // remove historical challenges
}

// maybe add error handling middleware.
router.delete('/delete_account', async (req, res, next) => {
  const username = req.session.username;
  try {
    await User.findOneAndDelete({username: username});
    await deleteUserFriendList(username);
    await deleteUserChallenges(username);
    // Remove from league

    // Delete/edit exercises.
  } catch (err) {
    console.log(err);
    return res.status(500).json("Could not finish deleting profile.");
  }
  next();
}, logout);

module.exports = router;
module.exports.isExistingUser = isExistingUser;
module.exports.getPropertyOfUser = getPropertyOfUser;
