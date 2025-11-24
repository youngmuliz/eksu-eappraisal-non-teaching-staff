const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // IMPORTANT: Replace the line below with your actual MongoDB connection string
        const mongoURI = process.env.MONGO_URI || 'mongodb+srv://hertzdigital223:David16464@cluster0.7v3qayw.mongodb.net/e-appraisal-system?retryWrites=true&w=majority&appName=Cluster0';
        
        await mongoose.connect(mongoURI);

        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;
