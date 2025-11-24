const express = require('express');
const multer = require('multer');
const path = require('path');
const profileController = require('../controllers/profileController');
const { requireAuth, requireApiAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for profile photo uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile_' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
        }
    }
});

// Profile routes - specific routes must come before parameterized routes
router.post('/update', requireApiAuth, profileController.updateProfile);
router.post('/upload-photo', requireApiAuth, upload.single('profilePhoto'), profileController.uploadProfilePhoto);
router.get('/appraisal-history/:userId?', requireApiAuth, profileController.getAppraisalHistory);
router.get('/download-report/:userId?', requireAuth, profileController.downloadAppraisalReport);
router.get('/:userId?', requireApiAuth, profileController.getUserProfile);

module.exports = router;

