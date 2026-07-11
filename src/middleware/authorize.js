function authorize(allowedRoles) {
  return function authorizeMiddleware(req, res, next) {
    const userRole = req.user && req.user.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
}

module.exports = { authorize };
