const mongoose = require('mongoose');

const AppraisalSchema = new mongoose.Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    staffName: {
        type: String,
        required: true,
    },
    faculty: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    staffCategory: {
        type: String,
        required: true,
    },
    data: {
        type: mongoose.Schema.Types.Mixed, 
        required: true,
    },
    supportingDocuments: {
        type: [String],
        default: [],
    },
    status: {
        type: String,
        default: 'submitted_by_staff',
        enum: [
            'submitted_by_staff',
            'evaluated_by_hod',
            'pending_committee_review',
            'accepted_by_staff',
            'rejected_by_staff',
            'reviewed_by_committee',
            'pending_faculty_panel',
            'reviewed_by_faculty',
        ],
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    hodEvaluation: {
        type: Object,
    },
    staffReview: {
        type: Object,
    },
    committeeReview: {
        type: Object,
    },
    facultyReview: {
        type: Object,
    },
    personalityTraitsEvaluation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PersonalityTraitsEvaluation',
    },
});

const Appraisal = mongoose.model('Appraisal', AppraisalSchema);

module.exports = Appraisal;
