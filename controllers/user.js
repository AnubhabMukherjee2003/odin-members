const { pool } = require("../db/pool"); // Correctly import the pool object
const { body, validationResult } = require("express-validator");

// Validation chains for reuse
const signupValidationRules = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('user_mail').isEmail().withMessage('Must be a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirm_password').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
];

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

      // Pass user information directly to the template
      const userData = req.isAuthenticated() ? {
        username: req.user.username,
        member: req.user.member,
        uid: req.user.uid,
        isAuthenticated: true
      } : {
        isAuthenticated: false
      };

      // Log what we're rendering
      console.log(`🔍 Rendering index with authentication: ${userData.isAuthenticated}`);
      if (userData.isAuthenticated) {
        console.log(`🔍 User in controller: ${userData.username} (${userData.member})`);
      }

      res.render("index", {
        title: "Home",
        posts: result.rows,
        ...userData // Spread user data to the template
      });
    } catch (err) {
      console.error('❌ Error in getHome controller:', err);
      res.status(500).send("Error fetching posts");
    }
  },

  // Display signup form
  getSignup: (req, res) => {
    res.render("signup", { title: "Sign Up" });
  },

  // Validation middleware for signup
  validateSignup: signupValidationRules,

  // Process signup form
  postSignup: async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.render("signup", {
          title: "Sign Up",
          error: errors.array()[0].msg,
          formData: req.body // Pass back the form data to repopulate fields
        });
      }

      const {
        username,
        first_name,
        last_name,
        user_mail,
        password
      } = req.body;

      // Check if username already exists
      const userCheck = await pool.query(
        "SELECT * FROM userspace WHERE username = $1",
        [username]
      );

      if (userCheck.rows.length > 0) {
        return res.render("signup", {
          title: "Sign Up",
          error: "Username already exists",
          formData: req.body
        });
      }

      // Check if email already exists
      const emailCheck = await pool.query(
        "SELECT * FROM userspace WHERE user_mail = $1",
        [user_mail]
      );

      if (emailCheck.rows.length > 0) {
        return res.render("signup", {
          title: "Sign Up",
          error: "Email already in use",
          formData: req.body
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
        formData: req.body
      });
    }
  },

  // Display login form
  getLogin: (req, res) => {
    res.render("login", { title: "Login" });
  },

  // Validate login input
  validateLogin: [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],

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