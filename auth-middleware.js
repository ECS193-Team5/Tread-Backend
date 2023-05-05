function isAuthenticated(req, res, next) {
    if (req.session.authenticationSource && req.session.authenticationID) next();
    // Needs to be changed to the prod login page.
    else res.status(401).json("Not signed in");
}

function hasUsername(req, res, next) {
    if (req.session.username && req.session.username !== null) next();
    else res.status(401).json("No username set");
}

module.exports.isAuthenticated = isAuthenticated;
module.exports.hasUsername = hasUsername;