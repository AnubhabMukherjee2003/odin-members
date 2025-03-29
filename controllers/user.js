const pool = require("../db/pool");

const userController = {
  // Display home page with posts
  getHome: async (req, res) => {
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
  },

  // Display signup form
  getSignup: (req, res) => {
    res.render("signup", { title: "Sign Up" });
  },

  // Process signup form
  postSignup: async (req, res) => {
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
  },

  // Display login form
  getLogin: (req, res) => {
    res.render("login", { title: "Login" });
  },

  // Handle user logout
  logout: (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  },

};

module.exports = userController;