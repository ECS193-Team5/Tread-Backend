const router = require("express").Router();
const User_data_origin = require("../models/user_data_origin.model");


async function getOriginAnchor(req, res) {
    const username = req.session.username;
    const dataOrigin = req.body.dataOrigin;
    const fieldToReturn = "-_id " + dataOrigin + "Anchor"

    const lastImportDateFromOrigin = await User_data_origin.findOne({
        username: username
    }, fieldToReturn);

    return res.status(200).json(lastImportDateFromOrigin);
}

router.route('/get_origin_anchor').post(getOriginAnchor)

async function touchDataOriginAnchor(username, dataOrigin, anchor) {
    let updateQueryField = {};

    if (dataOrigin === 'healthKit') {
        updateQueryField.healthKitAnchor = anchor;
    } else if (dataOrigin === 'healthConnect') {
        updateQueryField.healthConnectAnchor = anchor;
    }

    await User_data_origin.updateOne({
        username: username
    }, updateQueryField, { upsert: true })
}


module.exports = router;
module.exports.touchDataOriginAnchor = touchDataOriginAnchor;