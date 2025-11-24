const path = require('path');

const servePage = (pageName) => {
    return (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'views', pageName));
    };
};

module.exports = {
    serveLogin: servePage('login.html'),
    serveRegister: servePage('register.html'),
    serveStaffDashboard: servePage('staff-dashboard.html'),
    serveStaffForm: servePage('staff-form.html'),
    serveStaffProfile: servePage('staff-profile.html'),
    serveHodDashboard: servePage('hod-dashboard.html'),
    serveHodEvaluation: servePage('hod-evaluation.html'),
    serveHodPersonalityTraits: servePage('hod-personality-traits-dynamic.html'),
    serveHodProfile: servePage('hod-profile.html'),
    serveCommitteeDashboard: servePage('committee-dashboard.html'),
    serveCommitteeReview: servePage('committee-review.html'),
    serveCommitteeProfile: servePage('committee-profile.html'),
    serveFacultyDashboard: servePage('faculty-dashboard.html'),
    serveFacultyProfile: servePage('faculty-profile.html')
};
