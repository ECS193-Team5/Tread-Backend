require('dotenv').config();
const firebase = require("firebase-admin");

// Best practice: Get the credential file and db url from environment varible
const accountCred = process.env.ACCOUNT_CREDENTIAL_PATH
const serviceAccount = require(accountCred);
// not sure if we need
const dbUrl = "https://<Your DB>.firebaseio.com"; //You’ll get the DB Url from Firebase Console

module.exports = () => {
  firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: dbUrl,
  });
  console.info("Initialized Firebase SDK");
};