const mongoose = require('mongoose');

const AppraisalHistorySchema = new mongoose.Schema({
    stage: {
        type: String,
        required: true,
        enum: ['HOD Review', 'Committee Review', 'Faculty Review'],
    },
    score: {
        type: Number,
        default: null,
    },
    comments: {
        type: String,
        default: '',
    },
    reviewedBy: {
        type: String,
        required: true,
    },
    reviewedById: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    date: {
        type: Date,
        default: Date.now,
    },
    appraisalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appraisal',
    },
});

const UserProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    profilePhoto: {
        type: String,
        default: null, // File path to uploaded photo
    },
    role: {
        type: String,
        required: true,
        enum: ['staff', 'hod', 'committee', 'faculty'],
    },
    appraisalHistory: {
        type: [AppraisalHistorySchema],
        default: [],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Update the updatedAt field before saving
UserProfileSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const UserProfile = mongoose.model('UserProfile', UserProfileSchema);

module.exports = UserProfile;

