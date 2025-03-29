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

module.exports = {
  ensureAuthenticated,
  ensureMember,
  ensureAdmin,
};