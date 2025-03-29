function injectUser(req, res, next) {
  // Debug logging
  console.log('🔍 injectUser middleware:', req.isAuthenticated() ? 'Authenticated' : 'Not authenticated');
  
  if (req.isAuthenticated() && req.user) {
    console.log(`🔍 User data available: ${req.user.username} (${req.user.member})`);
    // Add user data to res.locals for template access
    res.locals.username = req.user.username;
    res.locals.member = req.user.member;
    res.locals.uid = req.user.uid;
    res.locals.isAuthenticated = true;
    res.locals.user = req.user; // Add complete user object
  } else {
    // Make sure these are undefined if not logged in
    res.locals.username = undefined;
    res.locals.member = undefined;
    res.locals.uid = undefined;
    res.locals.isAuthenticated = false;
    res.locals.user = undefined;
  }
  next();
}

module.exports = {
  injectUser,
};
