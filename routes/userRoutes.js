import express from 'express';
import { changePassword, changeView, checkPhoneRegistered, deleteUser, getAllUser, getSingleUser, gLoginUser, gSingupUser, loginUser, loginWithPin, resetWebPin, sendForgotPinOtp, sendLoginOtp, sendSignupOtp, setAppPin, signupAppUser, singupUser, switchPermission, switchRole, updateUser, verifyForgotPinOtp, verifyLoginOtp, verifySignupOtp } from '../controllers/userController.js';

const router = express.Router();


router.post('/send-signup-otp', sendSignupOtp)
router.post('/verify-signup-otp', verifySignupOtp)

router.post('/check-phone', checkPhoneRegistered)
router.post('/send-login-otp', sendLoginOtp)
router.post('/verify-login-otp', verifyLoginOtp)
router.post('/send-forgot-pin-otp', sendForgotPinOtp)
router.post('/verify-forgot-pin-otp', verifyForgotPinOtp)
router.post('/reset-web-pin', resetWebPin)
router.post('/login-pin', loginWithPin)

router.post('/login', loginUser)
router.post('/signup', singupUser)
router.post('/signup-app', signupAppUser)
router.post('/gSignup', gSingupUser)
router.post('/gLogin', gLoginUser)


router.get('/getAllUser', getAllUser);
router.get('/getSingleUser/:id', getSingleUser);

router.patch('/updateUser/:id', updateUser);
router.patch('/changePassword/:id', changePassword);
router.patch('/setAppPin/:id', setAppPin);
router.patch('/switchRole/:id', switchRole);
router.patch('/switchPermission/:id', switchPermission);
router.patch('/changeView/:id', changeView);

router.delete('/:id', deleteUser);

export default router;