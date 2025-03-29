const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors"); // <-- Import cors

const { ensureAuthenticated, ensureMember, ensureAdmin } = require("./middleware/protect");
const { injectUser } = require("./middleware/user");
const initializePassport = require("./config/passport");
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

// Middleware setup
app.use(express.urlencoded({ extended: false }));
app.use(session({ 
  secret: process.env.SESSION_SECRET || "cats", 
  resave: false, 
  saveUninitialized: false 
}));
app.use(passport.initialize());
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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});