var sandbox = require("sinon").createSandbox();
require('dotenv').config();
process.env.ATLAS_URI = process.env.TEST_ATLAS_URI

const chai = require("chai");
const { expect } = chai;

var helpers = require("./postRequests");

describe('Testing /user routes', async function () {
    let usersInfo = [];
    const users = [{
        "sub": "user1",
        "given_name": "Pinkie",
        "family_name": "Pie",
    }, {
        "sub": "user2",
        "given_name": "Rainbow",
        "family_name": "Dash",
    }]

    before(async function () {
        usersInfo = await createUsers(users, sandbox);
    })

    after(async function () {
        await helpers.deleteUsers(usersInfo);
    })

    describe("Test /check_username_exists", async function () {
        it("Test username that does not exist", async function () {
            let ifUserExist = await helpers.checkUserExist(usersInfo[0].cookie, "fakseUser");
            expect(ifUserExist).to.equal(false);
        });

        it("Test username does exist (my own username)", async function () {
            let ifUserExist = await helpers.checkUserExist(usersInfo[0].cookie, usersInfo[0].username);
            expect(ifUserExist).to.equal(true);
        });

        it("Test username does exist (not my username)", async function () {
            let ifUserExist = await helpers.checkUserExist(usersInfo[0].cookie, usersInfo[1].username);
            expect(ifUserExist).to.equal(true);
        });
    });

    describe("Test /get_display_name", async function () {
        it("Test for users[0]", async function () {
            let displayName = await helpers.getDisplayName(usersInfo[0].cookie);
            expect(displayName.displayName).to.equal(users[0].given_name);
        })

        it("Test for users[1]", async function () {
            let displayName = await helpers.getDisplayName(usersInfo[1].cookie);
            expect(displayName.displayName).to.equal(users[1].given_name);
        })
    })

    describe("Test /get_username", async function () {
        it("Test for users[0]", async function () {
            let username = await helpers.getUsername(usersInfo[0].cookie);
            expect(username).to.equal(usersInfo[0].username);
        })

        it("Test for users[1]", async function () {
            let username = await helpers.getUsername(usersInfo[1].cookie);
            expect(username).to.equal(usersInfo[1].username);
        })
    });

    describe("Test /update_picture", async function () {
        it("Test give a valid photo", async function () {
            let status = await helpers.updatePicture(usersInfo[0].cookie, "https://i.imgur.com/sXwXq45.png");
            expect(status).to.equal(200);
        })

        it("Test give no photo", async function () {
            let status = await helpers.updatePicture(usersInfo[0].cookie, "");
            expect(status).to.equal(200);
        })

        it("Test invalid photo", async function () {
            let status = await helpers.updatePicture(usersInfo[0].cookie, "image");
            expect(status).to.equal(400);
        })
    })

    describe("Test /update_display_name", async function () {
        it("Test give valid display name", async function () {
            let status = await helpers.updateDisplayName(usersInfo[0].cookie, "NewCoolName");
            expect(status).to.equal(200);
            let displayName = await helpers.getDisplayName(usersInfo[0].cookie);
            expect(displayName.displayName).to.equal("NewCoolName");
        })

        it("Test give no display name", async function () {
            let status = await helpers.updateDisplayName(usersInfo[1].cookie, "");
            expect(status).to.equal(200);
            let displayName = await helpers.getDisplayName(usersInfo[1].cookie);
            expect(displayName.displayName).to.equal(users[1].given_name);
        })

        it("Test give invalid display name", async function () {
            let status = await helpers.updateDisplayName(usersInfo[1].cookie, "This name is too long for the display name. Too many char.");
            expect(status).to.equal(400);
            let displayName = await helpers.getDisplayName(usersInfo[1].cookie);
            expect(displayName.displayName).to.equal(users[1].given_name);
        })
    })
});