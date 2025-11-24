const path = require('path');
const fs = require('fs');
const Appraisal = require('../models/appraisalModel');
const User = require('../models/userModel');

const getStaffDetails = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const user = await User.findById(req.session.userId);
        if (user) {
            res.json({
                name: user.fullName,
                role: user.role,
                department: user.department,
                faculty: user.faculty
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching staff details:', error);
        res.status(500).send('Error fetching staff details');
    }
};

const getStaffById = async (req, res) => {
    try {
        const staff = await User.findById(req.params.id).select('-password');
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }
        res.json({
            success: true,
            staff: {
                id: staff._id,
                name: staff.fullName, // Corrected from staff.name to staff.fullName
                department: staff.department,
                role: staff.role,
                faculty: staff.faculty,
                category: staff.category || 'junior'
            }
        });
    } catch (error) {
        console.error('Error fetching staff by ID:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const submitAppraisal = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const staffId = req.session.userId;
        const user = await User.findById(staffId);

        if (!user) {
            return res.status(404).send('Staff not found');
        }

        const appraisalData = {
            personalInfo: {
                employeeName: req.body.employeeName,
                dateOfBirth: req.body.dateOfBirth,
                placeOfBirth: req.body.placeOfBirth,
                maritalStatus: req.body.maritalStatus,
                numberOfChildren: req.body.numberOfChildren,
            },
            employmentDetails: {
                firstAppointment: req.body.firstAppointment,
                confirmationDate: req.body.confirmationDate,
                presentStatus: req.body.presentStatus,
                contissLevel: req.body.contissLevel,
                appointmentType: req.body.appointmentType,
                currentGrade: req.body.currentGrade,
            },
            academicQualifications: req.body['institution[]'] ? req.body['institution[]'].map((item, index) => ({
                institution: item,
                fromYear: req.body['fromYear[]'][index],
                toYear: req.body['toYear[]'][index],
                qualification: req.body['qualification[]'][index],
            })) : [],
            professionalBodies: req.body['professionalBodyName[]'] ? req.body['professionalBodyName[]'].map((item, index) => ({
                professionalBodyName: item,
                membershipDate: req.body['membershipDate[]'][index],
                membershipNumber: req.body['membershipNumber[]'][index],
                membershipStatus: req.body['membershipStatus[]'][index],
            })) : [],
            serviceRecords: req.body['serviceDepartment[]'] ? req.body['serviceDepartment[]'].map((item, index) => ({
                serviceDepartment: item,
                serviceFrom: req.body['serviceFrom[]'][index],
                serviceTo: req.body['serviceTo[]'][index],
                servicePost: req.body['servicePost[]'][index],
                supervisingOfficer: req.body['supervisingOfficer[]'][index],
            })) : [],
            trainingRecords: req.body['trainingDate[]'] ? req.body['trainingDate[]'].map((item, index) => ({
                trainingDate: item,
                courseTitle: req.body['courseTitle[]'][index],
                trainingInstitution: req.body['trainingInstitution[]'][index],
                trainingDuration: req.body['trainingDuration[]'][index],
                trainingAward: req.body['trainingAward[]'][index],
            })) : [],
            jobDescription: {
                jobDescription: req.body.jobDescription,
                difficulties: req.body.difficulties,
                additionalInfo: req.body.additionalInfo,
                majorContributions: req.body.majorContributions,
                publications: req.body.publications,
            },
        };

        const supportingDocuments = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                supportingDocuments.push(file.filename);
            });
        }

        const newAppraisal = new Appraisal({
            staffId: staffId,
            staffName: user.fullName,
            department: user.department,
            faculty: user.faculty,
            staffCategory: req.body.staffCategory,
            data: appraisalData,
            supportingDocuments: supportingDocuments,
            status: 'submitted_by_staff',
        });

        await newAppraisal.save();
        res.json({ success: true, message: 'Appraisal submitted successfully!' });
    } catch (error) {
        console.error('--- SERVER ERROR IN SUBMIT APPRAISAL ---');
        console.error('Error:', error);
        console.error('Error Message:', error.message);
        console.error('Stack Trace:', error.stack);
        console.error('--- END OF SERVER ERROR ---');
        res.status(500).json({ success: false, message: 'An error occurred while submitting the appraisal.', error: error.message });
    }
};

const getAppraisals = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Validate if the user exists before fetching appraisals
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userId = req.session.userId;
        console.log(`[DEBUG] Fetching appraisals for userId: ${userId} (Type: ${typeof userId})`);

        const staffAppraisals = await Appraisal.find({ staffId: userId }).sort({ createdAt: -1 });
        
        console.log(`[DEBUG] Found ${staffAppraisals.length} appraisals.`);
        if(staffAppraisals.length > 0 && staffAppraisals[0].staffId) {
            console.log('[DEBUG] First appraisal staffId:', staffAppraisals[0].staffId.toString(), `(Type: ${typeof staffAppraisals[0].staffId})`);
        }

        // Ensure the response is always a valid JSON array
        res.status(200).json(staffAppraisals || []);

    } catch (error) {
        console.error('FATAL ERROR in getAppraisals:', error);
        res.status(500).json({ success: false, message: 'A critical server error occurred while fetching appraisals.' });
    }
};

const getAppraisalById = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const appraisal = await Appraisal.findById(req.params.id);
        if (appraisal && appraisal.staffId.toString() === req.session.userId.toString()) {
            res.json(appraisal);
        } else {
            res.status(404).json({ success: false, message: 'Appraisal not found' });
        }
    } catch (error) {
        console.error('Error fetching appraisal by ID:', error);
        res.status(500).json({ success: false, message: 'Error fetching appraisal', error: error.message });
    }
};

const acceptEvaluation = async (req, res) => {
    console.log('--- DEBUG: acceptEvaluation ---');
    try {
        if (!req.session.userId) {
            console.log('[DEBUG] No session userId. Unauthorized.');
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        console.log(`[DEBUG] Session userId: ${req.session.userId} (Type: ${typeof req.session.userId})`);

        const appraisal = await Appraisal.findById(req.params.id);

        if (!appraisal) {
            console.log(`[DEBUG] Appraisal not found for id: ${req.params.id}`);
            return res.status(404).send('Appraisal not found');
        }

        console.log(`[DEBUG] Appraisal staffId: ${appraisal.staffId} (Type: ${typeof appraisal.staffId})`);

        const isOwner = appraisal.staffId.toString() === req.session.userId.toString();
        console.log(`[DEBUG] Is owner? ${isOwner}`);

        if (isOwner) {
            appraisal.status = 'pending_committee_review';
            appraisal.staffReview = {
                comments: 'Accepted by staff',
                reviewedAt: new Date(),
                action: 'accepted'
            };
            await appraisal.save();
            console.log('[DEBUG] Evaluation accepted and saved. Appraisal pending committee review.');
            res.json({ success: true, message: 'Evaluation accepted. Appraisal has been forwarded to the Committee for review.' });
        } else {
            console.log('[DEBUG] Mismatch: Appraisal staffId does not match session userId.');
            res.status(403).send('Forbidden: You are not authorized to accept this evaluation.');
        }
    } catch (error) {
        console.error('--- ERROR in acceptEvaluation ---', error);
        res.status(500).send('Error accepting evaluation');
    }
    console.log('--- END DEBUG: acceptEvaluation ---');
};

const rejectEvaluation = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const appraisal = await Appraisal.findById(req.params.id);
        if (appraisal && appraisal.staffId.toString() === req.session.userId.toString()) {
            appraisal.status = 'rejected_by_staff';
            appraisal.staffReview = { 
                ...req.body, 
                reviewedAt: new Date(),
                action: 'rejected'
            }; 
            await appraisal.save();
            res.json({ success: true, message: 'Evaluation rejected successfully.' });
        } else {
            res.status(404).send('Appraisal not found');
        }
    } catch (error) {
        console.error('Error rejecting evaluation:', error);
        res.status(500).send('Error rejecting evaluation');
    }
};

module.exports = {
    getStaffDetails,
    getStaffById,
    submitAppraisal,
    getAppraisals,
    getAppraisalById,
    acceptEvaluation,
    rejectEvaluation
};
