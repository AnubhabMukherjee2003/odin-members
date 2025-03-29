function injectUser(req, res, next) {
  if (req.user) {
    res.locals.username = req.user.username;
    res.locals.member = req.user.member;
    res.locals.uid = req.user.uid;
  }
  next();
}

module.exports = {
  injectUser,
};
