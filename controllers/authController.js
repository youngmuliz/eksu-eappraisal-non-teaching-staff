const { findUserByEmailAndRole } = require('../services/userService');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
    const { fullName, email, phone, role, faculty, department, password, staffId } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const newUser = {
            fullName,
            email,
            phone,
            role,
            faculty,
            department,
            password,
        };

        if (role === 'hod' || role === 'committee' || role === 'faculty') {
            if (!staffId) {
                return res.status(400).json({ success: false, message: 'Staff ID is required for HOD/Committee/Faculty roles.' });
            }
            newUser.staffId = staffId;
        }

        user = new User(newUser);

        await user.save();

        res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        console.error('Register error:', error.message);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        res.status(500).json({ 
            success: false, 
            message: 'Server error during registration.',
            error: error.message 
        });
    }
};

const login = async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const user = await findUserByEmailAndRole(email, role);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        req.session.userId = user._id;
        req.session.userRole = user.role;
        req.session.userName = user.fullName;
        req.session.department = user.department;
        req.session.faculty = user.faculty; 

        let redirectUrl;
        switch (role) {
            case 'staff':
                redirectUrl = '/staff-dashboard.html';
                break;
            case 'hod':
                redirectUrl = '/hod-dashboard.html';
                break;
            case 'committee':
                redirectUrl = '/committee-dashboard.html';
                break;
            case 'faculty':
                redirectUrl = '/faculty-dashboard.html';
                break;
            default:
                redirectUrl = '/login.html';
        }

        res.json({
            success: true,
            redirect: redirectUrl,
            user: {
                name: user.fullName,
                role: user.role,
                department: user.department,
                faculty: user.faculty,
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to logout' });
        }
        res.clearCookie('connect.sid'); // Example cookie name, adjust if needed
        res.json({ success: true, message: 'Logged out successfully' });
    });
};

module.exports = {
    register,
    login,
    logout
};
