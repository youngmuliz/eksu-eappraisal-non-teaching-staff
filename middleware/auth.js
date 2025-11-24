function requireAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login.html');
    }
}

function requireRole(role) {
    // role can be a string or an array of allowed roles
    return (req, res, next) => {
        const allowed = Array.isArray(role) ? role : [role];
        if (req.session.userRole && allowed.includes(req.session.userRole)) {
            next();
        } else {
            res.status(403).send('Access denied');
        }
    };
}

function requireApiAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
    }
}

module.exports = { requireAuth, requireRole, requireApiAuth };
