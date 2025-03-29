const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");

const { ensureAuthenticated, ensureMember, ensureAdmin } = require("./middleware/protect");
const {injectUser} = require("./middleware/user");
const initializePassport = require("./config/passport");
const userController = require("./controllers/user");
const powerController=require("./controllers/power");
const postController=require("./controllers/post");

require("dotenv").config();

const app = express();

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middleware setup
app.use(express.urlencoded({ extended: false }));
app.use(session({ 
  secret: process.env.SESSION_SECRET || "cats", 
  resave: false, 
  saveUninitialized: false 
}));
app.use(passport.session());
app.use(injectUser); // Inject user into response locals
app.use(express.static(path.join(__dirname, "public")));

// Initialize passport with our configuration
initializePassport(passport);

// Home route
app.get("/", userController.getHome);

// Authentication routes
app.get("/signup", userController.getSignup);
app.post("/signup", userController.postSignup);
app.get("/login", userController.getLogin);
app.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/login",
}));
app.get("/logout", userController.logout);

// Member routes
app.get("/member", ensureAuthenticated, powerController.getMember);
app.post("/member", ensureAuthenticated, powerController.postMember);

// Post routes
app.get("/create-post", ensureMember, postController.getCreatePost);
app.post("/create-post", ensureMember, postController.postCreatePost);
app.post("/delete-post/:pid", ensureAdmin, postController.deletePost);

// Admin routes
app.get("/make-admin", ensureMember, powerController.getAdmin);
app.post("/make-admin", ensureMember, powerController.postAdmin);

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
