const express = require('express');
const router = express.Router();
const committeeController = require('../controllers/committeeController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Faculty Review Panel routes (reuse committee controller logic)
router.get('/appraisals', requireAuth, requireRole('faculty'), committeeController.getAppraisalsForReview);
router.get('/appraisals/:id', requireAuth, requireRole('faculty'), committeeController.getAppraisalById);
router.post('/review/:id', requireAuth, requireRole('faculty'), committeeController.submitReview);

// Personality traits routes for faculty
router.get('/personality-traits', requireAuth, requireRole('faculty'), committeeController.getPersonalityTraitsEvaluations);
router.get('/personality-traits/:id', requireAuth, requireRole('faculty'), committeeController.getPersonalityTraitsEvaluationById);
router.get('/staff/:staffId/personality-traits', requireAuth, requireRole('faculty'), committeeController.getStaffPersonalityTraits);
router.post('/appraisals/:id/review', requireAuth, requireRole('faculty'), committeeController.submitReview);
router.delete('/appraisals/:id', requireAuth, requireRole('faculty'), committeeController.deleteAppraisal);

module.exports = router;

