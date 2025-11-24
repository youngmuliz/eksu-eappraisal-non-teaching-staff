const User = require('../models/userModel');

/**
 * Safe, idempotent startup migration tasks.
 * - Rename legacy 'committee' users to new 'faculty' role once,
 *   only when there are no existing 'faculty' users (prevents re-writing
 *   future Committee users).
 */
async function runStartupMigrations() {
    try {
        const facultyCount = await User.countDocuments({ role: 'faculty' });
        const legacyCommitteeCount = await User.countDocuments({ role: 'committee' });

        if (facultyCount === 0 && legacyCommitteeCount > 0) {
            await User.updateMany({ role: 'committee' }, { $set: { role: 'faculty' } });
            console.log(`[migrations] Renamed ${legacyCommitteeCount} legacy 'committee' users to 'faculty'.`);
        } else {
            console.log('[migrations] No role rename needed.');
        }
    } catch (err) {
        console.error('[migrations] Error running startup migrations:', err);
    }
}

module.exports = { runStartupMigrations };

