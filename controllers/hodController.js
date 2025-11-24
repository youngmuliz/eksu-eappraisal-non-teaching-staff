const Appraisal = require('../models/appraisalModel');
const User = require('../models/userModel');
const PersonalityTraitsEvaluation = require('../models/personalityTraitsEvaluationModel');
const { addAppraisalHistoryEntry } = require('./profileController');

const getDepartmentAppraisals = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const hod = await User.findById(req.session.userId);
        if (!hod) {
            return res.status(404).json({ success: false, message: 'HOD not found' });
        }
        const departmentAppraisals = await Appraisal.find({ 
            faculty: hod.faculty, 
            status: { $in: ['submitted_by_staff', 'rejected_by_staff', 'pending_committee_review', 'accepted_by_staff'] } 
        }).populate('staffId');
        res.json(departmentAppraisals);
    } catch (error) {
        res.status(500).send('Error fetching appraisals');
    }
};

const getAppraisalById = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const hod = await User.findById(req.session.userId);
        const appraisal = await Appraisal.findById(req.params.id).populate('staffId');
        if (appraisal && appraisal.faculty === hod.faculty) {
            res.json(appraisal);
        } else {
            res.status(404).send('Appraisal not found');
        }
    } catch (error) {
        console.error('Error fetching appraisal by ID:', error);
        res.status(500).send('Error fetching appraisal');
    }
};

const submitEvaluation = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const hod = await User.findById(req.session.userId);
        const appraisal = await Appraisal.findById(req.params.id);

        if (!hod) {
            return res.status(404).json({ success: false, message: 'HOD record not found' });
        }

        if (!appraisal || appraisal.faculty !== hod.faculty) {
            return res.status(404).json({ success: false, message: 'Appraisal not found' });
        }

        const evaluationEntries = Object.entries(req.body || {}).filter(([key]) => key.startsWith('item_'));
        const scores = evaluationEntries.map(([, value]) => Number(value) || 0);
        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        const maxScore = evaluationEntries.length * 5;
        const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

        let performanceRating = 'unsatisfactory';
        if (percentage >= 80) performanceRating = 'outstanding';
        else if (percentage >= 70) performanceRating = 'very_good';
        else if (percentage >= 60) performanceRating = 'good';
        else if (percentage >= 50) performanceRating = 'fair';

        appraisal.hodEvaluation = {
            ...req.body,
            totalScore,
            maxScore,
            percentage,
            performanceRating,
            evaluatedBy: hod.fullName || hod.name || 'Head of Department',
            evaluatedById: hod._id,
            evaluatedAt: new Date(),
        };

        appraisal.status = 'evaluated_by_hod';
        await appraisal.save();

        // Save to user profile appraisal history
        const comments = `Total Score: ${totalScore}/${maxScore} (${percentage}%). Performance Rating: ${performanceRating}`;
        await addAppraisalHistoryEntry(
            appraisal.staffId,
            'HOD Review',
            percentage, // Use percentage as score
            comments,
            hod.fullName || hod.name || 'Head of Department',
            hod._id,
            appraisal._id
        );

        return res.json({
            success: true,
            message: 'Evaluation submitted successfully',
            data: {
                totalScore,
                maxScore,
                percentage,
                performanceRating,
            },
        });
    } catch (error) {
        console.error('Error submitting evaluation:', error);
        return res.status(500).json({
            success: false,
            message: 'Error submitting evaluation. Please try again later.',
        });
    }
};

const getStaffMemberDetails = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const hod = await User.findById(req.session.userId);
        const user = await User.findById(req.params.staffId);
        if (user && user.faculty === hod.faculty) {
            res.json(user);
        } else {
            res.status(404).send('User not found in this faculty');
        }
    } catch (error) {
        console.error('Error fetching staff member details:', error);
        res.status(500).send('Error fetching staff member details');
    }
};

const submitPersonalityTraits = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { staffId, staffType, overallComments, traits } = req.body;

        if (!staffId || !staffType || !overallComments) {
            return res.status(400).json({ success: false, message: 'Missing required fields for personality traits evaluation.' });
        }

        if (!traits || Object.keys(traits).length === 0) {
            return res.status(400).json({ success: false, message: 'At least one personality trait rating is required.' });
        }

        const hod = await User.findById(req.session.userId);
        if (!hod) {
            return res.status(404).json({ success: false, message: 'HOD record not found.' });
        }

        const appraisal = await Appraisal.findOne({ staffId: staffId }).sort({ createdAt: -1 });
        if (!appraisal) {
            return res.status(404).json({ success: false, message: 'No appraisal found for this staff member.' });
        }

        const traitRatings = {};
        const traitComments = {};
        let totalScore = 0;

        Object.entries(traits).forEach(([traitId, traitData]) => {
            const ratingValue = Number(traitData?.rating || 0);
            traitRatings[traitId] = ratingValue;
            traitComments[traitId] = traitData?.comment || '';
            totalScore += ratingValue;
        });

        const maxScore = Object.keys(traitRatings).length * 5;
        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

        let performanceRating = 'Unsatisfactory';
        if (percentage >= 80) performanceRating = 'Outstanding';
        else if (percentage >= 70) performanceRating = 'Very Good';
        else if (percentage >= 60) performanceRating = 'Good';
        else if (percentage >= 50) performanceRating = 'Fair';

        const evaluatedBy = hod.fullName || hod.name || 'Head of Department';

        const evaluation = new PersonalityTraitsEvaluation({
            staffId,
            appraisalId: appraisal._id,
            staffType,
            traits: traitRatings,
            comments: traitComments,
            overallComments,
            totalScore,
            maxScore,
            percentage,
            performanceRating,
            evaluatedBy,
            department: hod.department,
        });

        await evaluation.save();

        appraisal.personalityTraitsEvaluation = evaluation._id;
        const lockedStatuses = [
            'evaluated_by_hod',
            'reviewed_by_committee',
            'accepted_by_staff',
            'rejected_by_staff',
            'pending_committee_review',
            'pending_faculty_panel'
        ];
        if (!lockedStatuses.includes(appraisal.status)) {
            appraisal.status = 'pending_committee_review';
        }
        await appraisal.save();

        return res.json({
            success: true,
            message: 'Personality traits submitted successfully',
            data: {
                evaluationId: evaluation._id,
                status: appraisal.status,
                totalScore,
                maxScore,
                percentage,
                performanceRating,
            },
        });
    } catch (error) {
        console.error('Error submitting personality traits:', error);
        return res.status(500).json({ success: false, message: 'Error submitting personality traits' });
    }
};

const getStaffCategory = async (req, res) => {
    try {
        const staff = await User.findById(req.params.staffId);
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }
        res.json({ success: true, category: staff.category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching staff category' });
    }
};

const getAppraisalsForHOD = async (req, res) => {
    try {
        if (!req.session.userId || req.session.userRole !== 'hod') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'HOD not found' });
        }

        const appraisals = await Appraisal.find({
            department: user.department,
            status: { $in: ['submitted_by_staff', 'rejected_by_staff'] }
        }).populate('staffId', 'name category').sort({ createdAt: -1 });

        res.status(200).json(appraisals);

    } catch (error) {
        console.error('Error fetching appraisals for HOD:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching appraisals.' });
    }
};

module.exports = {
    getAppraisalsForHOD,
    getDepartmentAppraisals,
    getAppraisalById,
    submitEvaluation,
    getStaffMemberDetails,
    submitPersonalityTraits,
    getStaffCategory
};
