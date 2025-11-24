const express = require('express');
const router = express.Router();
const viewController = require('../controllers/viewController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Public pages
router.get('/', viewController.serveRegister);
router.get('/login.html', viewController.serveLogin);
router.get('/register.html', viewController.serveRegister);

// Staff pages
router.get('/staff-dashboard.html', requireAuth, requireRole('staff'), viewController.serveStaffDashboard);
router.get('/staff-form.html', requireAuth, requireRole('staff'), viewController.serveStaffForm);
router.get('/staff-profile.html', requireAuth, requireRole('staff'), viewController.serveStaffProfile);

// HOD pages
router.get('/hod-dashboard.html', requireAuth, requireRole('hod'), viewController.serveHodDashboard);
router.get('/hod-evaluation.html', requireAuth, requireRole('hod'), viewController.serveHodEvaluation);
router.get('/hod-personality-traits-dynamic.html', requireAuth, requireRole('hod'), viewController.serveHodPersonalityTraits);
router.get('/hod-profile.html', requireAuth, requireRole('hod'), viewController.serveHodProfile);

// Committee pages
router.get('/committee-dashboard.html', requireAuth, requireRole('committee'), viewController.serveCommitteeDashboard);
router.get('/committee-review.html', requireAuth, requireRole(['committee', 'faculty']), viewController.serveCommitteeReview);
router.get('/committee-profile.html', requireAuth, requireRole('committee'), viewController.serveCommitteeProfile);

// Faculty Review Panel pages
router.get('/faculty-dashboard.html', requireAuth, requireRole('faculty'), viewController.serveFacultyDashboard);
router.get('/faculty-profile.html', requireAuth, requireRole('faculty'), viewController.serveFacultyProfile);

module.exports = router;
