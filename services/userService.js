const User = require('../models/userModel');

/**
 * Finds a user by their ID.
 * @param {string} userId - The ID of the user to find.
 * @returns {object | null} The user object or null if not found.
 */
async function findUserById(userId) {
    try {
        return await User.findById(userId);
    } catch (error) {
        console.error('Error finding user by ID:', error);
        return null;
    }
}

/**
 * Finds a user by their email and role.
 * @param {string} email - The user's email.
 * @param {string} role - The user's role.
 * @returns {object | null} The user object or null if not found.
 */
async function findUserByEmailAndRole(email, role) {
    try {
        return await User.findOne({ email, role });
    } catch (error) {
        console.error('Error finding user by email and role:', error);
        return null;
    }
}

module.exports = {
    findUserById,
    findUserByEmailAndRole
};
