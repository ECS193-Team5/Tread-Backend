const express = require('express');
const mongoose = require('mongoose');
var session = require('express-session');
const MongoStore = require('connect-mongo');


//const https = require("https");
//const fs = require('fs');
const cors = require("cors");
require('dotenv').config();

const app = express();

// We should make a explicit whitelist for cors request
app.use(cors());
app.use(express.json());

const uri = process.env.ATLAS_URI
mongoose.connect(uri);
const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});

var mongoStoreOptions = {
  mongoUrl: uri,
  crypto: {
    secret: process.env.MONGOSTORE_SECRET
  }
}

var sess = {
  store: MongoStore.create(mongoStoreOptions),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  // enable when we have HTTPS connection
  // secure: true,
  cookie: {
    maxAge: 300000,
  }
}

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
}

app.use(session(sess))

function isAuthenticated(req, res, next) {
  if (req.session.authenticationSource && req.session.authenticationID) next();
      // Needs to be changed to the prod login page.
  else res.sendStatus(401).json("Not signed in");
}

function hasUsername(req, res, next) {
  if (req.session.username && req.session.username != '') next();
  else res.status(401).json("No username set");
}

const userRouter = require("./routes/user");
const friendRouter = require("./routes/friend_list")
const authRouter = require("./routes/auth")

app.use("/auth", authRouter);
app.use("/user", isAuthenticated, hasUsername, userRouter);
app.use("/friend_list", isAuthenticated, hasUsername, friendRouter);


app.listen(5000, () => {
  console.log(`Server Started at ${5000}`)
});
/*
https.createServer({
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
},
app
).listen(5000, () => {
  console.log(`Server Started at ${5000}`)
});*/