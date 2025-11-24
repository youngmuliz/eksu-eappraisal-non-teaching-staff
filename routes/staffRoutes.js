const express = require('express');
const multer = require('multer');
const staffController = require('../controllers/staffController');
const { requireAuth, requireRole, requireApiAuth } = require('../middleware/auth');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '_' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Staff routes
router.get('/details', requireApiAuth, requireRole('staff'), staffController.getStaffDetails);
router.get('/appraisals', requireApiAuth, staffController.getAppraisals);
router.get('/:id', requireApiAuth, staffController.getStaffById);
router.post('/appraisal', requireApiAuth, requireRole('staff'), upload.array('supportingDocuments[]'), staffController.submitAppraisal);
router.get('/appraisals/:id', requireApiAuth, requireRole('staff'), staffController.getAppraisalById);
router.post('/appraisals/:id/accept', requireApiAuth, requireRole('staff'), staffController.acceptEvaluation);
router.post('/appraisals/:id/reject', requireApiAuth, requireRole('staff'), staffController.rejectEvaluation);

module.exports = router;
