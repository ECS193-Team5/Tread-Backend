const express = require('express');
const mongoose = require('mongoose');
var session = require('express-session');
const MongoStore = require('connect-mongo');
const initializeFirebaseSDK = require("./firebase_startup");
const initializeCloudinarySDK = require("./cloudinary_startup");
const {isAuthenticated, hasUsername} = require("./auth-middleware");

const cors = require("cors");
require('dotenv').config();

const app = express();

app.use(cors({
  credentials: true,
  //methods: ['POST'],
  origin: process.env.FRONTEND_DOMAIN ///for dev only
  //allowedHeaders: ['Content-Type', 'Authorization', 'Connection']
}));


//app.use(cors())

app.use(express.json());

const uri = process.env.ATLAS_URI;
// Will be set to false by default in mongoose 7
//mongoose.set('strictQuery', true);
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
    //maxAge: 300000,
  }
}

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
  sess.cookie.sameSite = 'none'
  sess.cookie.httpOnly = true
}

app.use(session(sess))

initializeCloudinarySDK();
initializeFirebaseSDK();

const authRouter = require("./routes/auth");
const signUpRouter = require("./routes/sign_up")
const userRouter = require("./routes/user");
const friendRouter = require("./routes/friend_list");
const challengeRouter= require("./routes/challenges");
const leagueRouter= require("./routes/league");
const exerciseLogRouter= require("./routes/exercise_log");
const globalChallengeRouter = require("./routes/global_challenge");
const medalsRouter = require("./routes/medals");
const statisticsRouter = require("./routes/statistics");
const deleteUserRouter = require("./routes/delete_user.js");
const dataOriginRouter = require("./routes/data_origin");
const notificationsRouter = require("./routes/notifications");

app.use("/auth", authRouter);
app.use("/sign_up", isAuthenticated, signUpRouter)
app.use("/user", isAuthenticated, hasUsername, userRouter);
app.use("/friend_list", isAuthenticated, hasUsername, friendRouter);
app.use("/challenges", isAuthenticated, hasUsername, challengeRouter);
app.use("/league", isAuthenticated, hasUsername, leagueRouter);
app.use("/exercise_log", isAuthenticated, hasUsername, exerciseLogRouter);
app.use("/medals", isAuthenticated, hasUsername, medalsRouter);
app.use("/stats", isAuthenticated, hasUsername, statisticsRouter);
app.use("/delete_user", isAuthenticated, hasUsername, deleteUserRouter);
app.use("/data_origin", isAuthenticated,  hasUsername, dataOriginRouter);
app.use("/notifications", isAuthenticated,  hasUsername, notificationsRouter);
app.use("/global_challenge", isAuthenticated, hasUsername, globalChallengeRouter);

const port = parseInt(process.env.PORT) || 8080;
const server = app.listen(port, () => {
  console.log(`Server Started at ${port}`)
});

async function gracefulExit(){
  await mongoose.disconnect();
  console.log("Connection to MongoDB is disconnected through app termination.")
  process.exit(0);
}

process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);
module.exports = server;