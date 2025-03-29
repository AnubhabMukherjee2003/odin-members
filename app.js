const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const pgSession = require('connect-pg-simple')(session); // Add this

const { ensureAuthenticated, ensureMember, ensureAdmin } = require("./middleware/protect");
const { injectUser } = require("./middleware/user");

const initializePassport = require("./config/passport");
const { pool, testConnection } = require("./db/pool");

const userController = require("./controllers/user");
const powerController = require("./controllers/power");
const postController = require("./controllers/post");

require("dotenv").config();

const app = express();

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// CORS setup (add before other middleware)
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST"],
  credentials: true
}));

// Body parser middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Session middleware
app.use(
  session({
    store: new pgSession({
      pool: pool,                // Use the pool from db/pool.js
      tableName: 'session',      // Use the session table name
      createTableIfMissing: true // Create the session table if it doesn't exist
    }),
    secret: process.env.SESSION_SECRET || "dogs",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);
app.use(passport.session());
app.use(injectUser); // Inject user into response locals
app.use(express.static(path.join(__dirname, "public")));

// Initialize passport with our configuration
initializePassport(passport);

// Home route
app.get("/", userController.getHome);

// Authentication routes
app.get("/signup", userController.getSignup);
app.post("/signup", userController.validateSignup, userController.postSignup);
app.get("/login", userController.getLogin);
app.post("/login", userController.validateLogin, passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/login",
}));
app.get("/logout", userController.logout);

// Member routes
app.get("/member", ensureAuthenticated, powerController.getMember);
app.post("/member", ensureAuthenticated, powerController.validateMember, powerController.postMember);

// Post routes
app.get("/create-post", ensureMember, postController.getCreatePost);
app.post("/create-post", ensureMember, postController.validatePost, postController.postCreatePost);
app.post("/delete-post/:pid", ensureAdmin, postController.deletePost);

// Admin routes
app.get("/make-admin", ensureMember, powerController.getAdmin);
app.post("/make-admin", ensureMember, powerController.validateAdmin, powerController.postAdmin);

// At the end of app.js
// Test the database connection before starting the server
(async () => {
  try {
    await testConnection();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("🚨 Unable to start the server due to database connection error.");
    process.exit(1);
  }
})();

// Export the app for serverless environments like Vercel
module.exports = app;