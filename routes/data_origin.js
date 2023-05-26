const router = require("express").Router();
const User_data_origin = require("../models/user_data_origin.model");


async function getOriginLastImportDate(req, res) {
    const username = req.session.username;
    const dataOrigin = req.body.dataOrigin;
    const fieldToReturn = "-_id " + dataOrigin + "LastPostedDate"

    const lastImportDateFromOrigin = await User_data_origin.findOne({
        username: username
    }, fieldToReturn);

    return res.status(200).json(lastImportDateFromOrigin);
}

router.route('/get_origin_last_import_date').post(getOriginLastImportDate)

async function touchDataOriginDate(username, dataOrigin) {
    let updateQueryField = {};
    if (dataOrigin === 'web') {
        updateQueryField.webLastPostedDate = Date.now();
    } else if (dataOrigin === 'healthKit') {
        updateQueryField.healthKitLastPostedDate = Date.now();
    } else if (dataOrigin === 'healthConnect') {
        updateQueryField.healthConnectLastPostedDate = Date.now();
    }

    await User_data_origin.updateOne({
        username: username
    }, updateQueryField, { upsert: true })
}


module.exports = router;
module.exports.touchDataOriginDate = touchDataOriginDate;