const { User, validateUser } = require('../models/user');
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const { generateOtp, hashOtp, verifyOtp } = require('../utils/otp');
const { sendOtpEmail }                     = require('../utils/email');

const MAX_OTP_ATTEMPTS  = 5;
const OTP_EXPIRY_MS     = 10 * 60 * 1000;   // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;        // 1 minute
const JWT_EXPIRY        = '7d';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Sign a 7-day JWT for the given user */
const issueToken = (user) =>
    jwt.sign(
        { user_id: user._id, email: user.email },
        process.env.TOKEN_SECRET_KEY,
        { expiresIn: JWT_EXPIRY }
    );

/** Safe user object to return to the client (no password/OTP fields) */
const safeUser = (user) => ({
    firstName: user.firstName,
    lastName:  user.lastName,
    username:  user.username,
    email:     user.email,
});

/**
 * Generate, hash, store, and email an OTP.
 * Returns the plain OTP (only for logging in dev — never sent to client).
 */
const dispatchOtp = async (user, type) => {
    const otp       = generateOtp();
    const hashed    = await hashOtp(otp);
    const expiry    = new Date(Date.now() + OTP_EXPIRY_MS);

    user.otp         = hashed;
    user.otpExpiry   = expiry;
    user.otpAttempts = 0;
    user.otpType     = type;
    await user.save();

    await sendOtpEmail({ to: user.email, name: user.firstName, otp, type });
};

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * POST /api/signup
 * Create an unverified account and send email OTP.
 */
exports.signup = async (req, res) => {
    try {
        const { error } = validateUser(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const { firstName, lastName, username, email, password } = req.body;
        const normalizedEmail = email.toLowerCase();

        // Check for duplicates
        const existingEmail    = await User.findOne({ email: normalizedEmail });
        if (existingEmail)    return res.status(409).send('Email already registered. Please login.');

        const existingUsername = await User.findOne({ username });
        if (existingUsername)  return res.status(409).send('Username already taken. Please choose another.');

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            firstName,
            lastName,
            username,
            email: normalizedEmail,
            password: hashedPassword,
        });

        await dispatchOtp(user, 'email_verification');

        res.status(201).json({
            message: 'Account created! Check your email for a 6-digit OTP to verify your account.',
            userId: user._id,
        });
    } catch (err) {
        console.error('[signup]', err);
        res.status(500).send('Internal Server Error');
    }
};

/**
 * POST /api/verify-email
 * Verify the signup OTP → mark account verified → issue 7-day JWT.
 */
exports.verifyEmail = async (req, res) => {
    try {
        const { userId, otp } = req.body;
        if (!userId || !otp) return res.status(400).send('userId and otp are required.');

        const user = await User.findById(userId);
        if (!user)               return res.status(404).send('User not found.');
        if (user.isVerified)     return res.status(400).send('Email already verified. Please login.');
        if (user.otpType !== 'email_verification')
            return res.status(400).send('No pending email verification for this account.');

        // Brute-force guard
        if (user.otpAttempts >= MAX_OTP_ATTEMPTS)
            return res.status(429).send('Too many failed attempts. Please request a new OTP.');

        // Expiry check
        if (!user.otpExpiry || user.otpExpiry < new Date())
            return res.status(400).send('OTP has expired. Please request a new one.');

        // Verify
        const isValid = await verifyOtp(otp, user.otp);
        if (!isValid) {
            user.otpAttempts += 1;
            await user.save();
            const left = MAX_OTP_ATTEMPTS - user.otpAttempts;
            return res.status(400).send(
                left > 0
                    ? `Incorrect OTP. ${left} attempt(s) remaining.`
                    : 'Too many failed attempts. Please request a new OTP.'
            );
        }

        // Activate account
        user.isVerified   = true;
        user.otp          = undefined;
        user.otpExpiry    = undefined;
        user.otpAttempts  = 0;
        user.otpType      = undefined;

        const token = issueToken(user);
        user.token = token;
        await user.save();

        res.status(200).json({
            message: 'Email verified! You are now logged in.',
            token,
            user: safeUser(user),
        });
    } catch (err) {
        console.error('[verifyEmail]', err);
        res.status(500).send('Internal Server Error');
    }
};

/**
 * POST /api/resend-otp
 * Resend an OTP (rate-limited to once per minute).
 */
exports.resendOtp = async (req, res) => {
    try {
        const { email, type } = req.body;
        if (!email || !type) return res.status(400).send('Email and type are required.');
        if (!['email_verification', 'reset_password'].includes(type))
            return res.status(400).send('Invalid OTP type.');

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).send('User not found.');

        if (type === 'email_verification' && user.isVerified)
            return res.status(400).send('Email is already verified.');

        // Rate limit: OTP must be at least 1 minute old before resending
        if (user.otpExpiry) {
            const age = OTP_EXPIRY_MS - (user.otpExpiry.getTime() - Date.now());
            if (age < RESEND_COOLDOWN_MS)
                return res.status(429).send('Please wait 1 minute before requesting another OTP.');
        }

        await dispatchOtp(user, type);

        res.status(200).json({ message: 'A new OTP has been sent to your email.' });
    } catch (err) {
        console.error('[resendOtp]', err);
        res.status(500).send('Internal Server Error');
    }
};

/**
 * POST /api/login
 * Verify password and log in immediately. (2FA removed)
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).send('Email and password are required.');

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(401).send('Invalid email or password.');

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).send('Invalid email or password.');

        // Unverified — nudge them to verify first
        if (!user.isVerified) {
            // Check rate limit for sending verification OTP on login attempt
            let shouldSend = true;
            if (user.otpExpiry) {
                const age = OTP_EXPIRY_MS - (user.otpExpiry.getTime() - Date.now());
                if (age < RESEND_COOLDOWN_MS) shouldSend = false;
            }
            if (shouldSend) await dispatchOtp(user, 'email_verification');

            return res.status(403).json({
                message: 'Your email is not verified. An OTP has been sent — please verify first.',
                userId: user._id,
                email: user.email,
                requiresVerification: true,
            });
        }

        // Clear any old OTP data
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpType = undefined;
        user.otpAttempts = 0;

        const token = issueToken(user);
        user.token = token;
        await user.save();

        res.status(200).json({
            message: 'Login successful!',
            token,
            user: safeUser(user),
        });
    } catch (err) {
        console.error('[login]', err);
        res.status(500).send('Internal Server Error');
    }
};

/**
 * POST /api/forgot-password
 * Send an OTP to reset password
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).send('Email is required.');

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).send('User not found.');

        // Enforce 1-minute rate limit on sending reset OTP
        if (user.otpExpiry && user.otpType === 'reset_password') {
            const age = OTP_EXPIRY_MS - (user.otpExpiry.getTime() - Date.now());
            if (age < RESEND_COOLDOWN_MS)
                return res.status(429).send('Please wait 1 minute before requesting another OTP.');
        }

        await dispatchOtp(user, 'reset_password');
        res.status(200).json({ message: 'Password reset OTP sent to your email.' });
    } catch (err) {
        console.error('[forgotPassword]', err);
        res.status(500).send('Internal Server Error');
    }
};

/**
 * POST /api/reset-password
 * Verify OTP and set new password
 */
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) return res.status(400).send('Email, OTP, and new password are required.');
        if (newPassword.length < 8) return res.status(400).send('Password must be at least 8 characters long.');

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).send('User not found.');
        if (user.otpType !== 'reset_password') return res.status(400).send('No password reset requested.');

        // Brute-force & expiry checks
        if (user.otpAttempts >= MAX_OTP_ATTEMPTS) return res.status(429).send('Too many failed attempts. Please request a new OTP.');
        if (!user.otpExpiry || user.otpExpiry < new Date()) return res.status(400).send('OTP has expired. Please request a new one.');

        // Verify OTP
        const isValid = await verifyOtp(otp, user.otp);
        if (!isValid) {
            user.otpAttempts += 1;
            await user.save();
            const left = MAX_OTP_ATTEMPTS - user.otpAttempts;
            return res.status(400).send(left > 0 ? `Incorrect OTP. ${left} attempt(s) remaining.` : 'Too many failed attempts. Request a new OTP.');
        }

        // Success: update password and clear OTP
        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpAttempts = 0;
        user.otpType = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful! You can now log in.' });
    } catch (err) {
        console.error('[resetPassword]', err);
        res.status(500).send('Internal Server Error');
    }
};

/**
 * GET /api/me  (protected — requires Bearer token)
 * Returns the current user's profile. Used on page load to restore session.
 */
exports.me = async (req, res) => {
    try {
        const user = await User.findById(req.user.user_id);
        if (!user) return res.status(404).send('User not found.');
        res.status(200).json({ user: safeUser(user) });
    } catch (err) {
        console.error('[me]', err);
        res.status(500).send('Internal Server Error');
    }
};