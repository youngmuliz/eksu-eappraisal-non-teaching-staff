const User = require('../models/userModel');

const getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select('-password');
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
        console.error('Error fetching user details:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getStaffById = async (req, res) => {
    try {
        const staffId = req.params.id;
        const staff = await User.findById(staffId).select('-password');

        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        res.json({
            success: true,
            staff: {
                id: staff._id,
                name: staff.fullName,
                department: staff.department,
                role: staff.role,
                faculty: staff.faculty
            }
        });
    } catch (error) {
        console.error('Error fetching staff by ID:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching user data' });
    }
};

module.exports = {
    getUserDetails,
    getStaffById,
    getUser
};
