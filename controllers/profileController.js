const UserProfile = require('../models/userProfileModel');
const User = require('../models/userModel');
const Appraisal = require('../models/appraisalModel');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Get user profile by userId
const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId || req.session.userId;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Check if requesting own profile or authorized
        if (req.params.userId && req.params.userId !== req.session.userId.toString()) {
            // Could add admin check here if needed
        }

        let profile = await UserProfile.findOne({ userId }).populate('userId');
        
        // If profile doesn't exist, create one from User data
        if (!profile) {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            profile = new UserProfile({
                userId: user._id,
                fullName: user.fullName,
                phone: user.phone,
                email: user.email,
                role: user.role,
            });
            await profile.save();
        }

        res.json({
            success: true,
            profile: {
                _id: profile._id,
                userId: profile.userId,
                fullName: profile.fullName,
                phone: profile.phone,
                email: profile.email,
                profilePhoto: profile.profilePhoto,
                role: profile.role,
                appraisalHistory: profile.appraisalHistory || [],
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt,
            },
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const userId = req.session.userId;
        const { fullName, phone } = req.body;

        let profile = await UserProfile.findOne({ userId });
        
        // If profile doesn't exist, create one
        if (!profile) {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            profile = new UserProfile({
                userId: user._id,
                fullName: user.fullName,
                phone: user.phone,
                email: user.email,
                role: user.role,
            });
        }

        // Update fields
        if (fullName) profile.fullName = fullName;
        if (phone) profile.phone = phone;

        // Also update User model if phone changed
        if (phone) {
            await User.findByIdAndUpdate(userId, { phone });
        }
        if (fullName) {
            await User.findByIdAndUpdate(userId, { fullName });
        }

        await profile.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: {
                _id: profile._id,
                userId: profile.userId,
                fullName: profile.fullName,
                phone: profile.phone,
                email: profile.email,
                profilePhoto: profile.profilePhoto,
                role: profile.role,
            },
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Upload profile photo
const uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const userId = req.session.userId;
        let profile = await UserProfile.findOne({ userId });

        // If profile doesn't exist, create one
        if (!profile) {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            profile = new UserProfile({
                userId: user._id,
                fullName: user.fullName,
                phone: user.phone,
                email: user.email,
                role: user.role,
            });
        }

        // Delete old profile photo if exists
        if (profile.profilePhoto) {
            const oldPhotoPath = path.join(__dirname, '..', 'public', profile.profilePhoto);
            if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath);
            }
        }

        // Save new photo path (relative to public folder)
        profile.profilePhoto = `/uploads/${req.file.filename}`;
        await profile.save();

        res.json({
            success: true,
            message: 'Profile photo uploaded successfully',
            profilePhoto: profile.profilePhoto,
        });
    } catch (error) {
        console.error('Error uploading profile photo:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get appraisal history for a user
const getAppraisalHistory = async (req, res) => {
    try {
        const userId = req.params.userId || req.session.userId;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        let profile = await UserProfile.findOne({ userId });
        
        if (!profile) {
            // Create profile if doesn't exist
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            profile = new UserProfile({
                userId: user._id,
                fullName: user.fullName,
                phone: user.phone,
                email: user.email,
                role: user.role,
            });
            await profile.save();
        }

        res.json({
            success: true,
            appraisalHistory: profile.appraisalHistory || [],
        });
    } catch (error) {
        console.error('Error fetching appraisal history:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Add appraisal history entry (used internally by other controllers)
const addAppraisalHistoryEntry = async (userId, stage, score, comments, reviewedBy, reviewedById, appraisalId) => {
    try {
        let profile = await UserProfile.findOne({ userId });
        
        if (!profile) {
            const user = await User.findById(userId);
            if (!user) {
                console.error('User not found when adding appraisal history');
                return;
            }

            profile = new UserProfile({
                userId: user._id,
                fullName: user.fullName,
                phone: user.phone,
                email: user.email,
                role: user.role,
            });
        }

        // Add or update history entry for this stage and appraisal
        const existingEntryIndex = profile.appraisalHistory.findIndex(
            entry => entry.stage === stage && entry.appraisalId && entry.appraisalId.toString() === appraisalId.toString()
        );

        const historyEntry = {
            stage,
            score: score !== null && score !== undefined ? score : null,
            comments: comments || '',
            reviewedBy,
            reviewedById,
            date: new Date(),
            appraisalId,
        };

        if (existingEntryIndex >= 0) {
            profile.appraisalHistory[existingEntryIndex] = historyEntry;
        } else {
            profile.appraisalHistory.push(historyEntry);
        }

        await profile.save();
        return true;
    } catch (error) {
        console.error('Error adding appraisal history entry:', error);
        return false;
    }
};

// Download complete appraisal report as PDF
const downloadAppraisalReport = async (req, res) => {
    try {
        const userId = req.params.userId || req.session.userId;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const profile = await UserProfile.findOne({ userId }).populate('userId');
        
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        // Get all appraisals for this user
        const appraisals = await Appraisal.find({ staffId: userId })
            .populate('staffId')
            .sort({ createdAt: -1 });

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        
        // Sanitize filename - ensure only safe ASCII characters for HTTP headers
        const userIdString = profile.userId.toString ? profile.userId.toString() : String(profile.userId);
        // Remove all non-ASCII and problematic characters, replace with underscore
        const sanitizedName = (profile.fullName || 'user')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .substring(0, 30) || 'user';
        
        // Create a simple, safe filename with only safe characters
        const safeFilename = `appraisal-report-${sanitizedName}-${userIdString.substring(0, 8)}.pdf`;
        
        // Validate the filename contains only safe characters for HTTP headers
        let finalFilename;
        if (/^[a-zA-Z0-9._-]+$/.test(safeFilename)) {
            finalFilename = safeFilename;
        } else {
            // Fallback to a completely safe filename
            finalFilename = `appraisal-report-${userIdString.substring(0, 12)}.pdf`;
        }
        
        // Set response headers - use simple format without extra quotes
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${finalFilename}`);
        
        doc.pipe(res);

        // Title
        doc.fontSize(20).text('Complete Appraisal Report', { align: 'center' });
        doc.moveDown();

        // Personal Information Section
        doc.fontSize(16).text('Personal Information', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        doc.text(`Full Name: ${profile.fullName}`);
        doc.text(`Email: ${profile.email}`);
        doc.text(`Phone: ${profile.phone}`);
        doc.text(`Role: ${profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}`);
        doc.moveDown();

        // Appraisal History Section
        if (profile.appraisalHistory && profile.appraisalHistory.length > 0) {
            doc.fontSize(16).text('Appraisal History', { underline: true });
            doc.moveDown(0.5);
            
            // Group by appraisal ID
            const historyByAppraisal = {};
            profile.appraisalHistory.forEach(entry => {
                const appraisalId = entry.appraisalId ? entry.appraisalId.toString() : 'general';
                if (!historyByAppraisal[appraisalId]) {
                    historyByAppraisal[appraisalId] = [];
                }
                historyByAppraisal[appraisalId].push(entry);
            });

            // For each appraisal
            for (const [appraisalId, entries] of Object.entries(historyByAppraisal)) {
                if (appraisalId !== 'general') {
                    const appraisal = appraisals.find(a => a._id.toString() === appraisalId);
                    if (appraisal) {
                        doc.fontSize(14).text(`Appraisal ID: ${appraisalId}`, { underline: true });
                        doc.fontSize(10).text(`Submitted: ${new Date(appraisal.submittedAt).toLocaleDateString()}`);
                        doc.moveDown(0.5);
                    }
                }

                // Table headers
                const tableTop = doc.y;
                const rowHeight = 25;
                const colWidths = { stage: 120, score: 60, reviewedBy: 150, date: 100 };
                let currentY = tableTop;

                // Header row
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text('Stage', 50, currentY, { width: colWidths.stage });
                doc.text('Score', 170, currentY, { width: colWidths.score });
                doc.text('Reviewed By', 230, currentY, { width: colWidths.reviewedBy });
                doc.text('Date', 380, currentY, { width: colWidths.date });
                currentY += rowHeight;

                // Draw header line
                doc.moveTo(50, currentY - 5).lineTo(550, currentY - 5).stroke();

                // Data rows
                doc.font('Helvetica').fontSize(9);
                entries.forEach(entry => {
                    if (currentY > 700) { // New page if needed
                        doc.addPage();
                        currentY = 50;
                    }
                    
                    doc.text(entry.stage, 50, currentY, { width: colWidths.stage });
                    doc.text(entry.score !== null ? entry.score.toString() : 'N/A', 170, currentY, { width: colWidths.score });
                    doc.text(entry.reviewedBy, 230, currentY, { width: colWidths.reviewedBy });
                    doc.text(new Date(entry.date).toLocaleDateString(), 380, currentY, { width: colWidths.date });
                    
                    // Comments if available
                    if (entry.comments) {
                        currentY += rowHeight;
                        doc.fontSize(8).text(`Comments: ${entry.comments}`, 50, currentY, { width: 500 });
                    }
                    
                    currentY += rowHeight + 5;
                    
                    // Draw row separator
                    doc.moveTo(50, currentY - 2).lineTo(550, currentY - 2).stroke();
                });

                doc.moveDown();
            }
        } else {
            doc.fontSize(12).text('No appraisal history available.', { align: 'center' });
        }

        // Finalize PDF
        doc.end();
    } catch (error) {
        console.error('Error generating PDF report:', error);
        res.status(500).json({ success: false, message: 'Error generating PDF report', error: error.message });
    }
};

module.exports = {
    getUserProfile,
    updateProfile,
    uploadProfilePhoto,
    getAppraisalHistory,
    addAppraisalHistoryEntry,
    downloadAppraisalReport,
};

