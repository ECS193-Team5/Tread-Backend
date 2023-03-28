const router = require("express").Router();
const User_Devices = require("../models/user_devices.model");

router.route('/registerToken').post(async (req, res) => {
    // need to verify user is in challenge for leaderboard
    const username = req.session.username;
    const registrationToken = req.body.registrationToken;

    // remove tokens from users that are not the same and add entry
    await User_Devices.updateOne({
        registrationToken: registrationToken,
    }, {username: username, expires: Date.now() + 1000*60*24*60}, {upsert: true})

    return res.sendStatus(200);
});



module.exports = router;