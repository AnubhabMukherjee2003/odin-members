const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const pgSession = require('connect-pg-simple')(session);
const flash = require('express-flash'); // Add this package via npm

const { ensureAuthenticated, ensureMember, ensureAdmin } = require("./middleware/protect");
const { injectUser } = require("./middleware/user");
const errorHandler = require("./middleware/errorHandler"); // Import the error handler

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

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Session middleware with error handling
app.use((req, res, next) => {
  session({
    store: new pgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true,
      errorLog: console.error
    }),
    secret: process.env.SESSION_SECRET || "dogs",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
      httpOnly: true // Add this line
    },
  })(req, res, (err) => {
    if (err) {
      console.error("❌ Session error:", err);
      // Fall back to memory session store if database fails
      console.log("⚠️ Falling back to memory session store");
      session({
        secret: process.env.SESSION_SECRET || "dogs",
        resave: false,
        saveUninitialized: false,
        cookie: { 
          secure: process.env.NODE_ENV === "production",
          maxAge: 24 * 60 * 60 * 1000, // 1 day
          sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
          httpOnly: true // Add this line
        }
      })(req, res, next);
    } else {
      next();
    }
  });
});

// Flash messages
app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// User injection middleware
app.use(injectUser);

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Initialize passport with our configuration
initializePassport(passport);

// Pass common data to all views
app.use((req, res, next) => {
  res.locals.isProduction = process.env.NODE_ENV === 'production';
  res.locals.flashMessage = req.flash('message');
  res.locals.flashError = req.flash('error');
  next();
});

// Route handlers with error catching
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Home route
app.get("/", asyncHandler(userController.getHome));

// Authentication routes
app.get("/signup", asyncHandler(userController.getSignup));
app.post("/signup", userController.validateSignup, asyncHandler(userController.postSignup));
app.get("/login", asyncHandler(userController.getLogin));
app.post("/login", 
  userController.validateLogin, 
  (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("❌ Authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        req.flash('error', info.message || 'Login failed');
        return res.redirect('/login');
      }
      
      req.logIn(user, (err) => {
        if (err) {
          console.error("❌ Login error:", err);
          return next(err);
        }
        
        console.log(`✅ User ${user.username} logged in successfully`);
        return res.redirect('/');
      });
    })(req, res, next);
  }
);
app.get("/logout", asyncHandler(userController.logout));

// Member routes
app.get("/member", ensureAuthenticated, asyncHandler(powerController.getMember));
app.post("/member", ensureAuthenticated, powerController.validateMember, asyncHandler(powerController.postMember));

// Post routes
app.get("/create-post", ensureMember, asyncHandler(postController.getCreatePost));
app.post("/create-post", ensureMember, postController.validatePost, asyncHandler(postController.postCreatePost));
app.post("/delete-post/:pid", ensureAdmin, asyncHandler(postController.deletePost));

// Admin routes
app.get("/make-admin", ensureMember, asyncHandler(powerController.getAdmin));
app.post("/make-admin", ensureMember, powerController.validateAdmin, asyncHandler(powerController.postAdmin));

// 404 handler
app.use((req, res, next) => {
  const err = new Error('Page Not Found');
  err.status = 404;
  next(err);
});

// Global error handler
app.use(errorHandler);

// At the end of app.js
// Test the database connection before starting the server
(async () => {
  try {
    await testConnection();
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
    
    // Add error handler for the server
    server.on('error', (err) => {
      console.error('❌ Server error:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error("🚨 Unable to start the server due to database connection error:", error.message);
    
    // If this is in development, start anyway so routes can be tested
    if (process.env.NODE_ENV !== 'production') {
      console.warn("⚠️ Starting server anyway (development mode)");
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`⚠️ Server is running on port ${PORT} (without database connection)`);
      });
    } else {
      process.exit(1);
    }
  }
})();

// Export the app for serverless environments like Vercel
module.exports = app;