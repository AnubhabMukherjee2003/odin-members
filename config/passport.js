const LocalStrategy = require("passport-local").Strategy;
const { pool } = require("../db/pool"); // Correctly import the pool object

function initializePassport(passport) {
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
}

module.exports = initializePassport;