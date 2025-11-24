const Appraisal = require('../models/appraisalModel');
const User = require('../models/userModel');
const PersonalityTraitsEvaluation = require('../models/personalityTraitsEvaluationModel');
const { addAppraisalHistoryEntry } = require('./profileController');

const getAppraisalsForReview = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const reviewer = await User.findById(req.session.userId);
        if (!reviewer) {
            return res.status(404).json({ message: 'Reviewer not found' });
        }

        const isFacultyReviewer = (reviewer.role === 'faculty' || req.session.userRole === 'faculty');
        const statusFilter = isFacultyReviewer
            ? ['pending_faculty_panel']
            : ['pending_committee_review', 'accepted_by_staff'];

        const appraisalsForReview = await Appraisal.find({ 
            faculty: reviewer.faculty,
            status: { $in: statusFilter }
        }).populate('staffId');
        res.json(appraisalsForReview);
    } catch (error) {
        console.error('Error fetching appraisals for review:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAppraisalById = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        if (!req.params.id) {
            return res.status(400).json({ success: false, message: 'Appraisal ID is required' });
        }
        
        const appraisal = await Appraisal.findById(req.params.id).populate('staffId');
        
        if (!appraisal) {
            return res.status(404).json({ success: false, message: 'Appraisal not found' });
        }
        
        // Ensure safe object structure - provide defaults for missing fields
        const safeAppraisal = {
            ...appraisal.toObject(),
            hodEvaluation: appraisal.hodEvaluation || {},
            committeeReview: appraisal.committeeReview || {},
            staffReview: appraisal.staffReview || {},
            data: appraisal.data || {},
            supportingDocuments: appraisal.supportingDocuments || []
        };
        
        // Validate that appraisal has required fields
        if (!safeAppraisal.data || Object.keys(safeAppraisal.data).length === 0) {
            console.warn(`Appraisal ${req.params.id} has no data field`);
        }
        
        res.json(safeAppraisal);
    } catch (error) {
        console.error('Error fetching appraisal by ID:', error);
        
        // Handle invalid ObjectId format
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid appraisal ID format' });
        }
        
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const submitReview = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        if (!req.params.id) {
            return res.status(400).json({ success: false, message: 'Appraisal ID is required' });
        }
        
        const appraisal = await Appraisal.findById(req.params.id);
        if (!appraisal) {
            return res.status(404).json({ success: false, message: 'Appraisal not found' });
        }
        
        // Validate required fields
        if (!req.body.recommendation) {
            return res.status(400).json({ success: false, message: 'Recommendation is required' });
        }
        
        const reviewer = await User.findById(req.session.userId);
        if (!reviewer) {
            return res.status(404).json({ success: false, message: 'Reviewer not found' });
        }

        // Determine stage based on reviewer role
        const isFacultyReviewer = (reviewer.role === 'faculty' || req.session.userRole === 'faculty');
        const stage = isFacultyReviewer ? 'Faculty Review' : 'Committee Review';
        
        // Prepare review data
        const reviewData = {
            ...req.body,
            reviewedBy: req.session.userName || (isFacultyReviewer ? 'Faculty Member' : 'Committee Member'),
            reviewedAt: new Date(),
        };
        
        // Update appraisal with review
        if (isFacultyReviewer) {
            appraisal.facultyReview = reviewData;
            appraisal.status = 'reviewed_by_faculty';
        } else {
            appraisal.committeeReview = reviewData;
            appraisal.status = 'pending_faculty_panel';
        }
        
        await appraisal.save();

        // Save to user profile appraisal history
        const comments = `Recommendation: ${req.body.recommendation}. ${req.body.comments || req.body.committeeComments || ''}`.trim();
        const score = req.body.overallPerformance || req.body.score || null;
        await addAppraisalHistoryEntry(
            appraisal.staffId,
            stage,
            score,
            comments,
            req.session.userName || (isFacultyReviewer ? 'Faculty Member' : 'Committee Member'),
            reviewer._id,
            appraisal._id
        );
        
        console.log(`${stage} submitted for appraisal ${req.params.id} by ${req.session.userName}`);
        
        return res.status(200).json({ 
            success: true, 
            message: isFacultyReviewer 
                ? 'Faculty review submitted successfully.' 
                : 'Review submitted successfully. Appraisal has been forwarded to Faculty Panel.',
            appraisalId: appraisal._id,
            status: appraisal.status
        });
    } catch (error) {
        console.error('Error submitting review:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'Validation error', error: error.message });
        }
        
        // Handle database errors
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid appraisal ID format' });
        }
        
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getPersonalityTraitsEvaluations = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const evaluations = await PersonalityTraitsEvaluation.find().populate('staffId');
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching personality traits evaluations:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getPersonalityTraitsEvaluationById = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const evaluation = await PersonalityTraitsEvaluation.findById(req.params.id).populate('staffId');
        if (evaluation) {
            res.json(evaluation);
        } else {
            res.status(404).send('Evaluation not found');
        }
    } catch (error) {
        console.error('Error fetching personality traits evaluation by ID:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getStaffPersonalityTraits = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const evaluations = await PersonalityTraitsEvaluation.find({ staffId: req.params.staffId }).populate('staffId');
        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching staff personality traits:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteAppraisal = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const appraisal = await Appraisal.findById(req.params.id);

        if (!appraisal) {
            return res.status(404).json({ success: false, message: 'Appraisal not found' });
        }

        // Optional: Add a check to ensure the user is a committee member and has the right permissions
        // For example, check against faculty or a specific role enhancement

        await Appraisal.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Appraisal deleted successfully' });
    } catch (error) {
        console.error('Error deleting appraisal:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getAppraisalsForReview,
    getAppraisalById,
    submitReview,
    getPersonalityTraitsEvaluations,
    getPersonalityTraitsEvaluationById,
    getStaffPersonalityTraits,
    deleteAppraisal
};
