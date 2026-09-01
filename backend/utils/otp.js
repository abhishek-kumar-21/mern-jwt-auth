const crypto = require('crypto');
const bcrypt = require('bcrypt');

/**
 * Generate a cryptographically secure 6-digit OTP
 */
const generateOtp = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Hash an OTP before storing it in the database
 */
const hashOtp = async (otp) => {
    return await bcrypt.hash(otp, 10);
};

/**
 * Compare a plain OTP against a stored hash
 */
const verifyOtp = async (otp, hashedOtp) => {
    return await bcrypt.compare(otp, hashedOtp);
};

module.exports = { generateOtp, hashOtp, verifyOtp };
