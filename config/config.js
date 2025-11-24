// For a production environment, it is strongly recommended to use environment variables
// for sensitive data like secret keys. For example:
// require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    SESSION_SECRET: process.env.SESSION_SECRET || 'e-appraisal-secret-key',
    // Set to true in production with HTTPS
    COOKIE_SECURE: process.env.NODE_ENV === 'production' ? true : false 
};
