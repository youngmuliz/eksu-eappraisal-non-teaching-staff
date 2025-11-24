const express = require('express');
const router = express.Router();
const hodController = require('../controllers/hodController');
const { requireAuth, requireRole, requireApiAuth } = require('../middleware/auth');

// HOD routes
router.get('/appraisals', requireApiAuth, requireRole('hod'), hodController.getAppraisalsForHOD);
router.get('/appraisals/department', requireAuth, requireRole('hod'), hodController.getDepartmentAppraisals);
router.get('/appraisals/:id', requireAuth, requireRole('hod'), hodController.getAppraisalById);
router.post('/appraisals/:id/evaluate', requireAuth, requireRole('hod'), hodController.submitEvaluation);
router.get('/staff/:staffId', requireAuth, requireRole('hod'), hodController.getStaffMemberDetails);
router.post('/personality-traits', requireAuth, requireRole('hod'), hodController.submitPersonalityTraits);
router.get('/staff/:staffId/category', requireAuth, requireRole('hod'), hodController.getStaffCategory);

module.exports = router;
