const {pool} = require("../db/pool");
const { body, validationResult } = require('express-validator');

const postController = {
  // Display create post form
  getCreatePost: (req, res) => {
    res.render("create-post", { title: "Create New Post" });
  },

  // Validate post content
  validatePost: [
    body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Post content must be at least 10 characters')
  ],

  // Process post creation
  postCreatePost: async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.render("create-post", {
          title: "Create New Post",
          error: errors.array()[0].msg,
          formData: req.body
        });
      }

      const { title, description } = req.body;

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
        formData: req.body
      });
    }
  },

  // Validate post ID for deletion
  validateDeletePost: [
    body('pid').isNumeric().withMessage('Invalid post ID')
  ],

  // Delete a post (admin only)
  deletePost: async (req, res) => {
    try {
      const { pid } = req.params;
      
      // Verify the post exists
      const postCheck = await pool.query("SELECT * FROM posts WHERE pid = $1", [pid]);
      if (postCheck.rows.length === 0) {
        return res.status(404).send("Post not found");
      }
      
      await pool.query("DELETE FROM posts WHERE pid = $1", [pid]);
      res.redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting post");
    }
  }
};

module.exports = postController;