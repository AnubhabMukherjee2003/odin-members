const pool = require("../db/pool");

const powerController = {

  getMember: (req, res) => {
    if (req.user.member > 0) {
      return res.redirect("/create-post");
    }
    res.render("member", { title: "Become a Member" });
  },

  // Process member upgrade
  postMember: async (req, res) => {
    try {
      const { passcode } = req.body;
      const requiredPasscode = process.env.MEMBER_PASSCODE || "the odin project";

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
  },

  // Display admin upgrade form
  getAdmin: (req, res) => {
    res.render("make-admin", { title: "Make Admin" });
  },

  // Process admin upgrade
  postAdmin: async (req, res) => {
    const { passcode } = req.body;
    
    if (!req.user) return res.redirect("/login");
    
    const adminPasscode = process.env.ADMIN_PASSCODE || "admin123";
    
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
  },

};

module.exports = powerController;