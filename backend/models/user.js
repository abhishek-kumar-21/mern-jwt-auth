const mongoose = require('mongoose');
const joi = require('joi');

const userSchema = new mongoose.Schema({
    firstName:    { type: String, required: true },
    lastName:     { type: String, required: true },
    username:     { type: String, required: true, unique: true },
    email:        { type: String, required: true, unique: true },
    password:     { type: String, required: true },
    token:        { type: String },

    // Email verification & 2FA
    isVerified:   { type: Boolean, default: false },
    otp:          { type: String },   // bcrypt-hashed OTP
    otpExpiry:    { type: Date },
    otpAttempts:  { type: Number, default: 0 },
    otpType:      { type: String, enum: ['email_verification', 'reset_password'] },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const validateUser = (user) => {
    const schema = joi.object({
        firstName: joi.string().min(1).required(),
        lastName:  joi.string().min(1).required(),
        username:  joi.string().alphanum().min(3).max(30).required(),
        email:     joi.string().email().required(),
        password:  joi.string().min(8).required()
            .messages({ 'string.min': 'Password must be at least 8 characters.' }),
    });
    return schema.validate(user);
};

module.exports = { User, validateUser };