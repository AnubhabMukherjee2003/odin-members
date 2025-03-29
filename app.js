const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
require("dotenv").config(); // Add this for environment variables

const pool = new Pool({
  connectionString: "postgresql://arch:2003@localhost:5432/top_users",
});

const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middleware to parse request body
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  if (req.user) {
    console.log(req.user.username);
    res.locals.username = req.user.username;
    res.locals.member = req.user.member;
    res.locals.uid = req.user.uid;
  }

  next();
});
app.use(express.static(path.join(__dirname, "public")));

// Authentication middleware for protected routes
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// Member check middleware
function ensureMember(req, res, next) {
  if (req.isAuthenticated() && req.user.member > 0) {
    return next();
  }
  res.redirect("/member");
}

// Admin check middleware
function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.member === 2) {
    return next();
  }
  res.redirect("/");
}

passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
    async (username, password, done) => {
      try {
        const result = await pool.query(
          "SELECT * FROM userspace WHERE username = $1 AND password = $2",
          [username, password]
        );

        if (result.rows.length > 0) {
          return done(null, result.rows[0]);
        } else {
          return done(null, false, { message: "Invalid credentials" });
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);
passport.serializeUser((user, done) => {
  done(null, user.uid);
});
passport.deserializeUser(async (uid, done) => {
  try {
    const result = await pool.query("SELECT * FROM userspace WHERE uid = $1", [
      uid,
    ]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});

app.get("/", async (req, res) => {
  try {
    // Query to get posts with author information
    const result = await pool.query(`
      SELECT p.pid, p.title, p.description, p.time, 
             u.username, u.first_name, u.last_name, u.member
      FROM posts p
      JOIN userspace u ON p.uid = u.uid
      ORDER BY p.time DESC
    `);

    res.render("index", {
      title: "Home",
      posts: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching posts");
  }
});

app.get("/signup", (req, res) => {
  res.render("signup", { title: "Sign Up" });
});

app.post("/signup", async (req, res) => {
  try {
    const {
      username,
      first_name,
      last_name,
      user_mail,
      password,
      confirm_password,
    } = req.body;

    if (!username || !first_name || !last_name || !user_mail || !password) {
      return res.render("signup", {
        title: "Sign Up",
        error: "All fields are required",
      });
    }

    if (password !== confirm_password) {
      return res.render("signup", {
        title: "Sign Up",
        error: "Passwords do not match",
      });
    }

    const userCheck = await pool.query(
      "SELECT * FROM userspace WHERE username = $1",
      [username]
    );

    if (userCheck.rows.length > 0) {
      return res.render("signup", {
        title: "Sign Up",
        error: "Username already exists",
      });
    }

    const emailCheck = await pool.query(
      "SELECT * FROM userspace WHERE user_mail = $1",
      [user_mail]
    );

    if (emailCheck.rows.length > 0) {
      return res.render("signup", {
        title: "Sign Up",
        error: "Email already in use",
      });
    }

    // Insert the new user
    await pool.query(
      `INSERT INTO userspace (username, first_name, last_name, user_mail, password)
         VALUES ($1, $2, $3, $4, $5)`,
      [username, first_name, last_name, user_mail, password]
    );

    // Redirect to login page
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.render("signup", {
      title: "Sign Up",
      error: "Error creating account. Please try again.",
    });
  }
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// Member upgrade page
app.get("/member", ensureAuthenticated, (req, res) => {
  if (req.user.member > 0) {
    return res.redirect("/create-post");
  }
  res.render("member", { title: "Become a Member" });
});

// Process member upgrade
app.post("/member", ensureAuthenticated, async (req, res) => {
  try {
    const { passcode } = req.body;
    const requiredPasscode = "the odin project"; // Use env variable or fallback

    if (passcode !== requiredPasscode) {
      return res.render("member", {
        title: "Become a Member",
        error: "Invalid passcode. Please try again.",
      });
    }

    await pool.query("UPDATE userspace SET member = 1 WHERE uid = $1", [
      req.user.uid,
    ]);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.render("member", {
      title: "Become a Member",
      error: "Error upgrading membership. Please try again.",
    });
  }
});

// Create post page
app.get("/create-post", ensureMember, (req, res) => {
  res.render("create-post", { title: "Create New Post" });
});

// Process post creation
app.post("/create-post", ensureMember, async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.render("create-post", {
        title: "Create New Post",
        error: "Title and description are required",
      });
    }

    await pool.query(
      "INSERT INTO posts (uid, title, description) VALUES ($1, $2, $3)",
      [req.user.uid, title, description]
    );

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.render("create-post", {
      title: "Create New Post",
      error: "Error creating post. Please try again.",
    });
  }
});

// Delete post (admin only)
app.post("/delete-post/:pid", ensureAdmin, async (req, res) => {
  try {
    const { pid } = req.params;
    await pool.query("DELETE FROM posts WHERE pid = $1", [pid]);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting post");
  }
});

// Make user admin (for testing purposes)
// app.get("/make-admin", async (req, res) => {
//   if (!req.user) return res.redirect("/login");

//   try {
//     await pool.query("UPDATE userspace SET member = 2 WHERE uid = $1", [req.user.uid]);
//     res.redirect("/");
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error updating user role");
//   }
// });
app.get("/make-admin", ensureMember, async (req, res) => {
  res.render("make-admin", { title: "Make Admin" });
});
app.post("/make-admin", ensureMember, async (req, res) => {
  const { passcode } = req.body;
  console.log(passcode);
  if (!req.user) return res.redirect("/login");
  const adminPasscode = process.env.ADMIN_PASSCODE || "admin123"; // Add fallback
  if (passcode !== adminPasscode) {
    return res.render("make-admin", {
      title: "Make Admin",
      error: "Invalid passcode. Please try again.",
    });
  }
  try {
    await pool.query("UPDATE userspace SET member = 2 WHERE uid = $1", [
      req.user.uid,
    ]);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating user role");
  }
});
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
