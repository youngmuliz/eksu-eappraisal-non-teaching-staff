const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
    },
    phone: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        enum: ['staff', 'hod', 'committee', 'faculty'],
    },
    staffId: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple documents to have a null value for staffId
    },
    faculty: {
        type: String,
        required: true,
        enum: ['Science', 'Social Science', 'Art', 'Engineering', 'Education', 'Law', 'Medicine', 'Business', 'Agriculture', 'Environmental Studies', 'Pharmacy'],
    },
    department: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
