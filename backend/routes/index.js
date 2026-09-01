const router     = require('express').Router();
const userCtrl   = require('../controllers/user');
const auth       = require('../middleware/auth');

router.post('/signup',        userCtrl.signup);
router.post('/verify-email',  userCtrl.verifyEmail);
router.post('/resend-otp',    userCtrl.resendOtp);
router.post('/login',         userCtrl.login);
router.post('/forgot-password', userCtrl.forgotPassword);
router.post('/reset-password',  userCtrl.resetPassword);

// Protected routes — require valid JWT
router.get('/me', auth, userCtrl.me);

module.exports = router;