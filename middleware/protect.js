// Authentication middleware for protected routes
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Store intended destination in session for redirect after login
  req.session.returnTo = req.originalUrl;
  req.flash('error', 'Please log in to access this page');
  res.redirect("/login");
}

// Member check middleware
function ensureMember(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user.member > 0) {
      return next();
    }
    req.flash('error', 'You need to be a member to access this page');
    return res.redirect("/member");
  }
  
  req.session.returnTo = req.originalUrl;
  req.flash('error', 'Please log in to access this page');
  res.redirect("/login");
}

// Admin check middleware
function ensureAdmin(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user.member === 2) {
      return next();
    }
    req.flash('error', 'You need administrator privileges to access this page');
    return res.redirect("/");
  }
  
  req.session.returnTo = req.originalUrl;
  req.flash('error', 'Please log in to access this page');
  res.redirect("/login");
}

module.exports = {
  ensureAuthenticated,
  ensureMember,
  ensureAdmin,
};