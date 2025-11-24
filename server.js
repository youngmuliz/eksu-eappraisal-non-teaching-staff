const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'e-appraisal-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// In-memory data storage
let users = {
    staff: [
        { id: 1, username: 'staff1', password: bcrypt.hashSync('staff123', 10), name: 'Isharufe Timothy', role: 'staff', department: 'Computer Science' },
        { id: 2, username: 'staff2', password: bcrypt.hashSync('staff123', 10), name: 'Isharufe Timothy', role: 'staff', department: 'Mathematics' }
    ],
    hod: [
        { id: 1, username: 'hod1', password: bcrypt.hashSync('hod123', 10), name: 'Isharufe Timothy', role: 'hod', department: 'Computer Science' },
        { id: 2, username: 'hod2', password: bcrypt.hashSync('hod123', 10), name: 'Isharufe Timothy', role: 'hod', department: 'Mathematics' }
    ],
    committee: [
        { id: 1, username: 'committee1', password: bcrypt.hashSync('committee123', 10), name: 'Prof. Isharufe Timothy', role: 'committee' }
    ]
};

let appraisals = [];
let evaluations = [];
let committeeReviews = [];

// Helper functions
function requireAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login.html');
    }
}

function requireRole(role) {
    return (req, res, next) => {
        if (req.session.userRole === role) {
            next();
        } else {
            res.status(403).send('Access denied');
        }
    };
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Authentication routes
app.post('/api/login', async (req, res) => {
    const { username, password, role } = req.body;
    
    const roleUsers = users[role];
    if (!roleUsers) {
        return res.json({ success: false, message: 'Invalid role' });
    }
    
    const user = roleUsers.find(u => u.username === username);
    if (!user) {
        return res.json({ success: false, message: 'User not found' });
    }
    
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
        return res.json({ success: false, message: 'Invalid password' });
    }
    
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.userRole = user.role;
    req.session.userName = user.name;
    req.session.department = user.department;
    
    res.json({ 
        success: true, 
        redirect: `/${role}-dashboard.html`,
        user: {
            name: user.name,
            role: user.role,
            department: user.department
        }
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Staff routes
app.get('/staff-dashboard.html', requireAuth, requireRole('staff'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'staff-dashboard.html'));
});

app.get('/staff-form.html', requireAuth, requireRole('staff'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'staff-form.html'));
});

// HOD routes
app.get('/hod-dashboard.html', requireAuth, requireRole('hod'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'hod-dashboard.html'));
});

app.get('/hod-evaluation.html', requireAuth, requireRole('hod'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'hod-evaluation.html'));
});

// Committee routes
app.get('/committee-dashboard.html', requireAuth, requireRole('committee'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'committee-dashboard.html'));
});

app.get('/committee-review.html', requireAuth, requireRole('committee'), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'committee-review.html'));
});

// API routes
app.get('/api/user', requireAuth, (req, res) => {
    res.json({
        name: req.session.userName,
        role: req.session.userRole,
        department: req.session.department
    });
});

// Staff API routes
app.post('/api/staff/appraisal', requireAuth, requireRole('staff'), upload.single('supportingDocument'), (req, res) => {
    const appraisal = {
        id: Date.now(),
        staffId: req.session.userId,
        staffName: req.session.userName,
        department: req.session.department,
        data: req.body,
        supportingDocument: req.file ? req.file.filename : null,
        status: 'submitted',
        submittedAt: new Date(),
        hodEvaluation: null,
        committeeReview: null
    };
    
    appraisals.push(appraisal);
    res.json({ success: true, message: 'Appraisal submitted successfully' });
});

app.get('/api/staff/appraisals', requireAuth, requireRole('staff'), (req, res) => {
    const staffAppraisals = appraisals.filter(a => a.staffId === req.session.userId);
    res.json(staffAppraisals);
});

// HOD API routes
app.get('/api/hod/appraisals', requireAuth, requireRole('hod'), (req, res) => {
    const departmentAppraisals = appraisals.filter(a => a.department === req.session.department);
    res.json(departmentAppraisals);
});

// NEW: Get detailed staff assessment for HOD
app.get('/api/hod/staff-assessment/:id', requireAuth, requireRole('hod'), (req, res) => {
    const appraisalId = parseInt(req.params.id);
    const appraisal = appraisals.find(a => a.id === appraisalId && a.department === req.session.department);
    
    if (!appraisal) {
        return res.status(404).json({ success: false, message: 'Appraisal not found' });
    }
    
    // Return complete staff assessment details
    const staffAssessment = {
        id: appraisal.id,
        staffId: appraisal.staffId,
        staffName: appraisal.staffName,
        department: appraisal.department,
        submittedAt: appraisal.submittedAt,
        status: appraisal.status,
        
        // Personal Information
        personalInfo: {
            employeeName: appraisal.data.employeeName || '',
            dateOfBirth: appraisal.data.dateOfBirth || '',
            placeOfBirth: appraisal.data.placeOfBirth || '',
            maritalStatus: appraisal.data.maritalStatus || '',
            numberOfChildren: appraisal.data.numberOfChildren || ''
        },
        
        // Employment Details
        employmentDetails: {
            firstAppointment: appraisal.data.firstAppointment || '',
            confirmationDate: appraisal.data.confirmationDate || '',
            presentStatus: appraisal.data.presentStatus || '',
            contissLevel: appraisal.data.contissLevel || '',
            appointmentType: appraisal.data.appointmentType || '',
            currentGrade: appraisal.data.currentGrade || ''
        },
        
        // Academic Qualifications
        academicQualifications: extractArrayData(appraisal.data, ['institution', 'fromYear', 'toYear', 'qualification']),
        
        // Professional Bodies
        professionalBodies: {
            professionalBody: appraisal.data.professionalBody || '',
            membershipDate: appraisal.data.membershipDate || ''
        },
        
        // Service Records
        serviceRecords: extractArrayData(appraisal.data, ['serviceDepartment', 'serviceFrom', 'serviceTo', 'servicePost', 'supervisingOfficer']),
        
        // Training Records
        trainingRecords: extractArrayData(appraisal.data, ['trainingDate', 'courseTitle', 'trainingInstitution', 'trainingDuration', 'trainingAward']),
        
        // Job Description and Performance
        jobDescription: {
            jobDescription: appraisal.data.jobDescription || '',
            difficulties: appraisal.data.difficulties || '',
            additionalInfo: appraisal.data.additionalInfo || '',
            majorContributions: appraisal.data.majorContributions || '',
            publications: appraisal.data.publications || ''
        },
        
        // Supporting Documents
        supportingDocument: appraisal.supportingDocument,
        
        // HOD Evaluation (if exists)
        hodEvaluation: appraisal.hodEvaluation,
        
        // Committee Review (if exists)
        committeeReview: appraisal.committeeReview
    };
    
    res.json(staffAssessment);
});

app.post('/api/hod/evaluate/:id', requireAuth, requireRole('hod'), (req, res) => {
    const appraisalId = parseInt(req.params.id);
    const evaluation = req.body;
    
    const appraisal = appraisals.find(a => a.id === appraisalId);
    if (!appraisal) {
        return res.json({ success: false, message: 'Appraisal not found' });
    }
    
    appraisal.hodEvaluation = {
        ...evaluation,
        evaluatedBy: req.session.userName,
        evaluatedAt: new Date()
    };
    appraisal.status = 'hod_evaluated';
    
    res.json({ success: true, message: 'Evaluation completed successfully' });
});

// Committee API routes
app.get('/api/committee/appraisals', requireAuth, requireRole('committee'), (req, res) => {
    const evaluatedAppraisals = appraisals.filter(a => a.status === 'hod_evaluated' || a.status === 'completed');
    res.json(evaluatedAppraisals);
});

// NEW: Get complete staff assessment for Committee
app.get('/api/committee/staff-assessment/:id', requireAuth, requireRole('committee'), (req, res) => {
    const appraisalId = parseInt(req.params.id);
    const appraisal = appraisals.find(a => a.id === appraisalId && (a.status === 'hod_evaluated' || a.status === 'completed'));
    
    if (!appraisal) {
        return res.status(404).json({ success: false, message: 'Appraisal not found' });
    }
    
    // Return complete staff assessment details for committee
    const staffAssessment = {
        id: appraisal.id,
        staffId: appraisal.staffId,
        staffName: appraisal.staffName,
        department: appraisal.department,
        submittedAt: appraisal.submittedAt,
        status: appraisal.status,
        
        // Personal Information
        personalInfo: {
            employeeName: appraisal.data.employeeName || '',
            dateOfBirth: appraisal.data.dateOfBirth || '',
            placeOfBirth: appraisal.data.placeOfBirth || '',
            maritalStatus: appraisal.data.maritalStatus || '',
            numberOfChildren: appraisal.data.numberOfChildren || ''
        },
        
        // Employment Details
        employmentDetails: {
            firstAppointment: appraisal.data.firstAppointment || '',
            confirmationDate: appraisal.data.confirmationDate || '',
            presentStatus: appraisal.data.presentStatus || '',
            contissLevel: appraisal.data.contissLevel || '',
            appointmentType: appraisal.data.appointmentType || '',
            currentGrade: appraisal.data.currentGrade || ''
        },
        
        // Academic Qualifications
        academicQualifications: extractArrayData(appraisal.data, ['institution', 'fromYear', 'toYear', 'qualification']),
        
        // Professional Bodies
        professionalBodies: {
            professionalBody: appraisal.data.professionalBody || '',
            membershipDate: appraisal.data.membershipDate || ''
        },
        
        // Service Records
        serviceRecords: extractArrayData(appraisal.data, ['serviceDepartment', 'serviceFrom', 'serviceTo', 'servicePost', 'supervisingOfficer']),
        
        // Training Records
        trainingRecords: extractArrayData(appraisal.data, ['trainingDate', 'courseTitle', 'trainingInstitution', 'trainingDuration', 'trainingAward']),
        
        // Job Description and Performance
        jobDescription: {
            jobDescription: appraisal.data.jobDescription || '',
            difficulties: appraisal.data.difficulties || '',
            additionalInfo: appraisal.data.additionalInfo || '',
            majorContributions: appraisal.data.majorContributions || '',
            publications: appraisal.data.publications || ''
        },
        
        // Supporting Documents
        supportingDocument: appraisal.supportingDocument,
        
        // HOD Evaluation
        hodEvaluation: appraisal.hodEvaluation,
        
        // Committee Review (if exists)
        committeeReview: appraisal.committeeReview
    };
    
    res.json(staffAssessment);
});

// NEW: Get all staff assessments overview for Committee
app.get('/api/committee/all-staff-assessments', requireAuth, requireRole('committee'), (req, res) => {
    const allAppraisals = appraisals.map(appraisal => ({
        id: appraisal.id,
        staffId: appraisal.staffId,
        staffName: appraisal.staffName,
        department: appraisal.department,
        submittedAt: appraisal.submittedAt,
        status: appraisal.status,
        
        // Key information for overview
        personalInfo: {
            employeeName: appraisal.data.employeeName || '',
            dateOfBirth: appraisal.data.dateOfBirth || '',
            maritalStatus: appraisal.data.maritalStatus || ''
        },
        
        employmentDetails: {
            firstAppointment: appraisal.data.firstAppointment || '',
            presentStatus: appraisal.data.presentStatus || '',
            contissLevel: appraisal.data.contissLevel || '',
            currentGrade: appraisal.data.currentGrade || ''
        },
        
        // Latest qualifications
        latestQualification: getLatestQualification(appraisal.data),
        
        hodEvaluation: appraisal.hodEvaluation,
        committeeReview: appraisal.committeeReview
    }));
    
    res.json(allAppraisals);
});

app.post('/api/committee/review/:id', requireAuth, requireRole('committee'), (req, res) => {
    const appraisalId = parseInt(req.params.id);
    const review = req.body;
    
    const appraisal = appraisals.find(a => a.id === appraisalId);
    if (!appraisal) {
        return res.json({ success: false, message: 'Appraisal not found' });
    }
    
    appraisal.committeeReview = {
        ...review,
        reviewedBy: req.session.userName,
        reviewedAt: new Date()
    };
    appraisal.status = 'completed';
    
    res.json({ success: true, message: 'Review completed successfully' });
});

// File download route
app.get('/api/download/:filename', requireAuth, (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'public', 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

// Helper function to extract array data from form
function extractArrayData(data, fieldNames) {
    const result = [];
    const length = Math.max(...fieldNames.map(field => 
        Array.isArray(data[field]) ? data[field].length : (data[field] ? 1 : 0)
    ));
    
    for (let i = 0; i < length; i++) {
        const item = {};
        fieldNames.forEach(field => {
            if (Array.isArray(data[field]) && data[field][i]) {
                item[field.replace(/\[\]$/, '')] = data[field][i];
            } else if (!Array.isArray(data[field]) && data[field] && i === 0) {
                item[field.replace(/\[\]$/, '')] = data[field];
            }
        });
        
        // Only add item if it has at least one non-empty field
        if (Object.values(item).some(value => value && value.toString().trim() !== '')) {
            result.push(item);
        }
    }
    
    return result;
}

// Helper function to get latest qualification
function getLatestQualification(data) {
    const qualifications = extractArrayData(data, ['institution', 'fromYear', 'toYear', 'qualification']);
    if (qualifications.length === 0) return null;
    
    return qualifications.reduce((latest, current) => {
        const currentYear = parseInt(current.toYear) || 0;
        const latestYear = parseInt(latest.toYear) || 0;
        return currentYear > latestYear ? current : latest;
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Default login credentials:');
    console.log('Staff: staff1/staff123');
    console.log('HOD: hod1/hod123');
    console.log('Committee: committee1/committee123');
});