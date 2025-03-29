const pool = require("../db/pool");

const postController = {

  // Display create post form
  getCreatePost: (req, res) => {
    res.render("create-post", { title: "Create New Post" });
  },

  // Process post creation
  postCreatePost: async (req, res) => {
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
  },

  // Delete a post (admin only)
  deletePost: async (req, res) => {
    try {
      const { pid } = req.params;
      await pool.query("DELETE FROM posts WHERE pid = $1", [pid]);
      res.redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting post");
    }
  }
};

module.exports = postController;