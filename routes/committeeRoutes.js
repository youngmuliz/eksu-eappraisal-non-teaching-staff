const express = require('express');
const router = express.Router();
const committeeController = require('../controllers/committeeController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Committee routes
router.get('/appraisals', requireAuth, requireRole('committee'), committeeController.getAppraisalsForReview);
router.get('/appraisals/:id', requireAuth, requireRole('committee'), committeeController.getAppraisalById);
router.post('/review/:id', requireAuth, requireRole('committee'), committeeController.submitReview);

// Personality traits routes for committee
router.get('/personality-traits', requireAuth, requireRole('committee'), committeeController.getPersonalityTraitsEvaluations);
router.get('/personality-traits/:id', requireAuth, requireRole('committee'), committeeController.getPersonalityTraitsEvaluationById);
router.get('/staff/:staffId/personality-traits', requireAuth, requireRole('committee'), committeeController.getStaffPersonalityTraits);
router.post('/appraisals/:id/review', requireAuth, requireRole('committee'), committeeController.submitReview);
router.delete('/appraisals/:id', requireAuth, requireRole('committee'), committeeController.deleteAppraisal);

module.exports = router;
