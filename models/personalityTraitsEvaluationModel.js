const mongoose = require('mongoose');

const PersonalityTraitsEvaluationSchema = new mongoose.Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    appraisalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appraisal',
        required: true,
    },
    staffType: {
        type: String,
        required: true,
        enum: ['junior', 'senior'],
    },
    traits: {
        type: Map,
        of: Number,
    },
    comments: {
        type: Map,
        of: String,
    },
    overallComments: {
        type: String,
    },
    totalScore: {
        type: Number,
        required: true,
    },
    maxScore: {
        type: Number,
        required: true,
    },
    percentage: {
        type: Number,
        required: true,
    },
    performanceRating: {
        type: String,
        required: true,
    },
    evaluatedBy: {
        type: String, // HOD's name from session
        required: true,
    },
    evaluatedAt: {
        type: Date,
        default: Date.now,
    },
    department: {
        type: String,
        required: true,
    },
});

const PersonalityTraitsEvaluation = mongoose.model('PersonalityTraitsEvaluation', PersonalityTraitsEvaluationSchema);

module.exports = PersonalityTraitsEvaluation;
