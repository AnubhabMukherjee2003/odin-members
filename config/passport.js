const LocalStrategy = require("passport-local").Strategy;
const { pool } = require("../db/pool");

function initializePassport(passport) {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true, // Pass request to callback for flash messages
      },
      async (req, username, password, done) => {
        try {
          console.log(`🔐 Attempting authentication for user: ${username}`);
          
          if (!username || !password) {
            return done(null, false, { message: "Username and password are required" });
          }
          
          const result = await pool.query(
            "SELECT * FROM userspace WHERE username = $1",
            [username]
          );

          if (result.rows.length === 0) {
            console.log(`❌ Authentication failed: User ${username} not found`);
            return done(null, false, { message: "Invalid username or password" });
          }
          
          const user = result.rows[0];
          
          // In a real app, you should use bcrypt.compare here instead of direct comparison
          if (user.password !== password) {
            console.log(`❌ Authentication failed: Invalid password for ${username}`);
            return done(null, false, { message: "Invalid username or password" });
          }
          
          console.log(`✅ Authentication successful for ${username}`);
          return done(null, user);
        } catch (err) {
          console.error("❌ Authentication error:", err.message);
          return done(err, false, { message: "An error occurred during authentication" });
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    try {
      done(null, user.uid);
    } catch (err) {
      done(err);
    }
  });

  passport.deserializeUser(async (uid, done) => {
    try {
      const result = await pool.query("SELECT * FROM userspace WHERE uid = $1", [
        uid,
      ]);
      
      if (result.rows.length === 0) {
        return done(null, false);
      }
      
      done(null, result.rows[0]);
    } catch (err) {
      console.error("❌ Session deserialization error:", err.message);
      done(err);
    }
  });
}

module.exports = initializePassport;