import userModel from "../models/userModel.js";
import SignupOtp from "../models/signupOtpModel.js";
import LoginOtp from "../models/loginOtpModel.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { sendBdBulkSms } from "../services/smsService.js";
import { phoneAsEntered, isUsablePhoneForOtp } from "../utils/phone.js";
import { composeAddress } from "../utils/address.js";

/** Login/session JWT. Default is long-lived so mobile/web stay signed in until logout; override with JWT_EXPIRES_IN (e.g. 90d, 365d). */
const createToken = (_id) => {
  const expiresIn = process.env.JWT_EXPIRES_IN || "730d";
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn });
};

/** Strip secrets; expose whether app PIN is configured (mobile). */
export function authResponse(userDoc, token) {
  const u = userDoc?.toObject ? userDoc.toObject() : { ...userDoc };
  const appPinSet = Boolean(u.appPinHash);
  delete u.password;
  delete u.appPinHash;
  delete u.email;
  return { user: u, token, site: "Monorom", appPinSet };
}

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const createPhoneVerificationToken = (phone) =>
  jwt.sign({ phone, purpose: "signup" }, process.env.SECRET, { expiresIn: "15m" });

const verifyPhoneVerificationToken = (token) => {
  const decoded = jwt.verify(token, process.env.SECRET);
  if (decoded.purpose !== "signup" || typeof decoded.phone !== "string") {
    throw new Error("Invalid verification token");
  }
  return decoded.phone;
};

const createPinResetToken = (phone) =>
  jwt.sign({ phone, purpose: "forgot_pin" }, process.env.SECRET, {
    expiresIn: "15m",
  });

const verifyPinResetToken = (token) => {
  const decoded = jwt.verify(token, process.env.SECRET);
  if (decoded.purpose !== "forgot_pin" || typeof decoded.phone !== "string") {
    throw new Error("Invalid reset token");
  }
  return decoded.phone;
};

export const sendSignupOtp = async (req, res) => {
  try {
    const phone = phoneAsEntered(req.body?.phone ?? "");
    if (!isUsablePhoneForOtp(phone)) {
      return res.status(400).json({
        error: "Enter a valid phone number.",
      });
    }
    const phoneTaken = await userModel.findOne({ phone });
    if (phoneTaken) {
      return res
        .status(400)
        .json({ error: "This phone number is already registered." });
    }

    const existing = await SignupOtp.findOne({ phone });
    if (
      existing &&
      Date.now() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      return res.status(429).json({
        error: "Please wait a minute before requesting another code.",
      });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(code, salt);

    await SignupOtp.findOneAndUpdate(
      { phone },
      {
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        attempts: 0,
        lastSentAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await sendBdBulkSms(phone, `Your Monorom verification code is: ${code}`);

    return res.status(200).json({ message: "Verification code sent." });
  } catch (e) {
    console.error("sendSignupOtp", e);
    return res.status(500).json({
      error: e.message || "Failed to send verification code.",
    });
  }
};

export const verifySignupOtp = async (req, res) => {
  try {
    const phone = phoneAsEntered(req.body?.phone ?? "");
    const code = req.body?.code;

    if (!isUsablePhoneForOtp(phone)) {
      return res.status(400).json({ error: "Invalid phone number." });
    }
    if (!code || !/^\d{6}$/.test(String(code))) {
      return res.status(400).json({ error: "Enter the 6-digit code." });
    }

    const doc = await SignupOtp.findOne({ phone });
    if (!doc) {
      return res.status(400).json({ error: "No code found. Request a new one." });
    }
    if (doc.expiresAt.getTime() < Date.now()) {
      await SignupOtp.deleteOne({ _id: doc._id });
      return res
        .status(400)
        .json({ error: "Code expired. Request a new one." });
    }
    if (doc.attempts >= MAX_OTP_ATTEMPTS) {
      await SignupOtp.deleteOne({ _id: doc._id });
      return res.status(400).json({
        error: "Too many attempts. Request a new code.",
      });
    }

    const match = await bcrypt.compare(String(code), doc.codeHash);
    if (!match) {
      await SignupOtp.updateOne({ _id: doc._id }, { $inc: { attempts: 1 } });
      return res.status(400).json({ error: "Incorrect code." });
    }

    await SignupOtp.deleteOne({ _id: doc._id });
    const phoneVerificationToken = createPhoneVerificationToken(phone);
    return res.status(200).json({ phoneVerificationToken });
  } catch (e) {
    console.error("verifySignupOtp", e);
    return res.status(500).json({ error: e.message || "Verification failed." });
  }
};

export const checkPhoneRegistered = async (req, res) => {
  try {
    const phone = phoneAsEntered(req.body?.phone ?? "");
    if (!isUsablePhoneForOtp(phone)) {
      return res.status(400).json({ error: "Enter a valid phone number." });
    }
    const u = await userModel.findOne({ phone });
    return res.status(200).json({ registered: Boolean(u) });
  } catch (e) {
    console.error("checkPhoneRegistered", e);
    return res.status(500).json({ error: e.message || "Request failed." });
  }
};

export const sendLoginOtp = async (req, res) => {
  try {
    const phone = phoneAsEntered(req.body?.phone ?? "");
    if (!isUsablePhoneForOtp(phone)) {
      return res.status(400).json({
        error: "Enter a valid phone number.",
      });
    }
    const account = await userModel.findOne({ phone });
    if (!account) {
      return res.status(404).json({
        error: "No account found with this phone number.",
      });
    }

    const existing = await LoginOtp.findOne({ phone });
    if (
      existing &&
      Date.now() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      return res.status(429).json({
        error: "Please wait a minute before requesting another code.",
      });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(code, salt);

    await LoginOtp.findOneAndUpdate(
      { phone },
      {
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        attempts: 0,
        lastSentAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await sendBdBulkSms(phone, `Your Monorom login code is: ${code}`);

    return res.status(200).json({ message: "Verification code sent." });
  } catch (e) {
    console.error("sendLoginOtp", e);
    return res.status(500).json({
      error: e.message || "Failed to send verification code.",
    });
  }
};

export const verifyLoginOtp = async (req, res) => {
  try {
    const phone = phoneAsEntered(req.body?.phone ?? "");
    const code = req.body?.code;

    if (!isUsablePhoneForOtp(phone)) {
      return res.status(400).json({ error: "Invalid phone number." });
    }
    if (!code || !/^\d{6}$/.test(String(code))) {
      return res.status(400).json({ error: "Enter the 6-digit code." });
    }

    const doc = await LoginOtp.findOne({ phone });
    if (!doc) {
      return res.status(400).json({ error: "No code found. Request a new one." });
    }
    if (doc.expiresAt.getTime() < Date.now()) {
      await LoginOtp.deleteOne({ _id: doc._id });
      return res.status(400).json({ error: "Code expired. Request a new one." });
    }
    if (doc.attempts >= MAX_OTP_ATTEMPTS) {
      await LoginOtp.deleteOne({ _id: doc._id });
      return res.status(400).json({
        error: "Too many attempts. Request a new code.",
      });
    }

    const match = await bcrypt.compare(String(code), doc.codeHash);
    if (!match) {
      await LoginOtp.updateOne({ _id: doc._id }, { $inc: { attempts: 1 } });
      return res.status(400).json({ error: "Incorrect code." });
    }

    await LoginOtp.deleteOne({ _id: doc._id });

    const user = await userModel.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: "Account not found." });
    }

    const token = createToken(user._id);
    return res.status(200).json(authResponse(user, token));
  } catch (e) {
    console.error("verifyLoginOtp", e);
    return res.status(500).json({ error: e.message || "Verification failed." });
  }
};

/** Same as login OTP send, but dedicated route + SMS copy for forgot-PIN flow. */
export const sendForgotPinOtp = async (req, res) => {
  try {
    const phone = phoneAsEntered(req.body?.phone ?? "");
    if (!isUsablePhoneForOtp(phone)) {
      return res.status(400).json({
        error: "Enter a valid phone number.",
      });
    }
    const account = await userModel.findOne({ phone });
    if (!account) {
      return res.status(404).json({
        error: "No account found with this phone number. Please sign up first.",
      });
    }

    const existing = await LoginOtp.findOne({ phone });
    if (
      existing &&
      Date.now() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      return res.status(429).json({
        error: "Please wait a minute before requesting another code.",
      });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(code, salt);

    await LoginOtp.findOneAndUpdate(
      { phone },
      {
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        attempts: 0,
        lastSentAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await sendBdBulkSms(
      phone,
      `Your Monorom PIN reset code is: ${code}`
    );

    return res.status(200).json({ message: "Verification code sent." });
  } catch (e) {
    console.error("sendForgotPinOtp", e);
    return res.status(500).json({
      error: e.message || "Failed to send verification code.",
    });
  }
};

export const verifyForgotPinOtp = async (req, res) => {
  try {
    const phone = phoneAsEntered(req.body?.phone ?? "");
    const code = req.body?.code;

    if (!isUsablePhoneForOtp(phone)) {
      return res.status(400).json({ error: "Invalid phone number." });
    }
    if (!code || !/^\d{6}$/.test(String(code))) {
      return res.status(400).json({ error: "Enter the 6-digit code." });
    }

    const doc = await LoginOtp.findOne({ phone });
    if (!doc) {
      return res.status(400).json({ error: "No code found. Request a new one." });
    }
    if (doc.expiresAt.getTime() < Date.now()) {
      await LoginOtp.deleteOne({ _id: doc._id });
      return res.status(400).json({ error: "Code expired. Request a new one." });
    }
    if (doc.attempts >= MAX_OTP_ATTEMPTS) {
      await LoginOtp.deleteOne({ _id: doc._id });
      return res.status(400).json({
        error: "Too many attempts. Request a new code.",
      });
    }

    const match = await bcrypt.compare(String(code), doc.codeHash);
    if (!match) {
      await LoginOtp.updateOne({ _id: doc._id }, { $inc: { attempts: 1 } });
      return res.status(400).json({ error: "Incorrect code." });
    }

    await LoginOtp.deleteOne({ _id: doc._id });

    const user = await userModel.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: "Account not found. Please sign up first." });
    }

    const pinResetToken = createPinResetToken(phone);
    return res.status(200).json({ pinResetToken });
  } catch (e) {
    console.error("verifyForgotPinOtp", e);
    return res.status(500).json({ error: e.message || "Verification failed." });
  }
};

/** After forgot-PIN OTP; sets web login PIN (password field) and returns session. */
export const resetWebPin = async (req, res) => {
  try {
    const phone = phoneAsEntered(req.body?.phone ?? "");
    const { pinResetToken, pin, confirmPin } = req.body;

    let verifiedPhone;
    try {
      verifiedPhone = verifyPinResetToken(pinResetToken);
    } catch {
      return res.status(400).json({
        error: "Invalid or expired reset session. Start forgot PIN again.",
      });
    }
    if (!isUsablePhoneForOtp(phone) || phone !== verifiedPhone) {
      return res.status(400).json({ error: "Phone number does not match verification." });
    }

    const p = pin != null ? String(pin) : "";
    const c = confirmPin != null ? String(confirmPin) : "";
    if (!/^\d{4}$/.test(p) || p !== c) {
      return res.status(400).json({
        error: "PIN must be exactly 4 digits and match confirmation.",
      });
    }

    const user = await userModel.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: "Account not found. Please sign up first." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(p, salt);
    await userModel.findOneAndUpdate({ phone }, { password: hash });
    const updated = await userModel.findOne({ phone });

    const token = createToken(updated._id);
    return res.status(200).json(authResponse(updated, token));
  } catch (e) {
    console.error("resetWebPin", e);
    return res.status(500).json({ error: e.message || "Failed to reset PIN." });
  }
};

export const loginWithPin = async (req, res) => {
  try {
    const phone = phoneAsEntered(req.body?.phone ?? "");
    const pin = req.body?.pin;

    if (!isUsablePhoneForOtp(phone)) {
      return res.status(400).json({ error: "Invalid phone number." });
    }
    if (!pin || !/^\d{6}$/.test(String(pin))) {
      return res.status(400).json({ error: "Enter your 6-digit PIN." });
    }

    const user = await userModel.findOne({ phone });
    if (!user) {
      return res.status(400).json({ error: "No account found for this phone." });
    }
    if (!user.appPinHash) {
      return res.status(400).json({
        error: "PIN not set. Log in with a one-time code first.",
      });
    }

    const match = await bcrypt.compare(String(pin), user.appPinHash);
    if (!match) {
      return res.status(400).json({ error: "Incorrect PIN." });
    }

    const token = createToken(user._id);
    return res.status(200).json(authResponse(user, token));
  } catch (e) {
    console.error("loginWithPin", e);
    return res.status(500).json({ error: e.message || "Login failed." });
  }
};

export const setAppPin = async (req, res) => {
  try {
    const raw = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!raw) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    let decoded;
    try {
      decoded = jwt.verify(raw, process.env.SECRET);
    } catch {
      return res.status(401).json({ error: "Invalid or expired session." });
    }

    const { id } = req.params;
    if (String(decoded._id) !== String(id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { pin } = req.body;
    if (!pin || !/^\d{6}$/.test(String(pin))) {
      return res.status(400).json({ error: "PIN must be exactly 6 digits." });
    }

    const salt = await bcrypt.genSalt(10);
    const appPinHash = await bcrypt.hash(String(pin), salt);

    const user = await userModel.findByIdAndUpdate(
      id,
      { appPinHash },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const token = createToken(user._id);
    return res.status(200).json(authResponse(user, token));
  } catch (e) {
    console.error("setAppPin", e);
    return res.status(500).json({ error: e.message || "Failed to save PIN." });
  }
};


export const getAllUser = async (req, res) => {
  const data = await userModel
    .find({})
    .sort({ updatedAt: -1 })
    .select("-password -appPinHash")
    .lean();
  for (const doc of data) {
    delete doc.email;
  }
  return res.status(200).json({ data });
}
export const getSingleUser = async (req, res) => {
  const { id } = req.params;
  const data = await userModel.findById(id);
  if (!data) {
    return res.status(404).json({ error: "Not found" });
  }
  const o = data.toObject();
  delete o.password;
  delete o.appPinHash;
  delete o.email;
  return res.status(200).json({ data: o });
}

export const loginUser = async (req, res) => {
  const raw = req.body?.userName ?? req.body?.phone ?? "";
  const key = phoneAsEntered(raw) || String(raw).trim();
  const { password } = req.body;
  try {
    const user = await userModel.login(key, password);

    const token = createToken(user._id);

    res.status(200).json(authResponse(user, token));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
export const gLoginUser = async (req, res) => {
  const { firstName, lastName, googleId } = req.body;
  if (!googleId || !String(googleId).trim()) {
    return res.status(400).json({ error: "Missing Google account id." });
  }
  try {
    const user = await userModel.gLogin(firstName, lastName, googleId);

    const token = createToken(user._id);

    res.status(200).json(authResponse(user, token));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const singupUser = async (req, res) => {
  const {
    userName,
    firstName,
    lastName,
    phone: phoneRaw,
    pin,
    city,
    shippingAddress,
    homeAddress,
    thana,
    district,
    companyName,
    dob,
    phoneVerificationToken,
  } = req.body;

  const pinStr = pin != null ? String(pin) : "";
  if (!/^\d{4}$/.test(pinStr)) {
    return res.status(400).json({
      error: "PIN must be exactly 4 digits.",
    });
  }

  let verifiedPhone;
  try {
    verifiedPhone = verifyPhoneVerificationToken(phoneVerificationToken);
  } catch {
    return res.status(400).json({
      error: "Invalid or expired phone verification. Verify your number again.",
    });
  }

  const phone = phoneAsEntered(phoneRaw ?? "");
  if (!isUsablePhoneForOtp(phone) || phone !== verifiedPhone) {
    return res.status(400).json({
      error: "Phone number does not match verification.",
    });
  }

  const role = "user";
  try {
    const user = await userModel.signup(
      userName,
      firstName,
      lastName,
      role,
      phone,
      pinStr,
      city,
      shippingAddress,
      companyName,
      dob,
      homeAddress,
      thana,
      district
    );

    const token = createToken(user._id);

    res.status(200).json(authResponse(user, token));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
export const gSingupUser = async (req, res) => {
  const {
    firstName,
    lastName,
    googleId,
    phone: phoneRaw,
    phoneVerificationToken,
  } = req.body;

  if (!googleId || !String(googleId).trim()) {
    return res.status(400).json({ error: "Missing Google account id." });
  }

  let verifiedPhone;
  try {
    verifiedPhone = verifyPhoneVerificationToken(phoneVerificationToken);
  } catch {
    return res.status(400).json({
      error: "Invalid or expired phone verification. Verify your number again.",
    });
  }

  const phone = phoneAsEntered(phoneRaw ?? "");
  if (!isUsablePhoneForOtp(phone) || phone !== verifiedPhone) {
    return res.status(400).json({
      error: "Phone number does not match verification.",
    });
  }

  const role = "user";
  try {
    const user = await userModel.gSignup(firstName, lastName, googleId, role, phone);

    const token = createToken(user._id);

    res.status(200).json(authResponse(user, token));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/** Mobile app: first/last/userName/phone + OTP + password. */
export const signupAppUser = async (req, res) => {
  const {
    firstName,
    lastName,
    userName,
    phone: phoneRaw,
    password,
    phoneVerificationToken,
  } = req.body;

  let verifiedPhone;
  try {
    verifiedPhone = verifyPhoneVerificationToken(phoneVerificationToken);
  } catch {
    return res.status(400).json({
      error: "Invalid or expired phone verification. Verify your number again.",
    });
  }

  const phone = phoneAsEntered(phoneRaw ?? "");
  if (!isUsablePhoneForOtp(phone) || phone !== verifiedPhone) {
    return res.status(400).json({
      error: "Phone number does not match verification.",
    });
  }

  if (!password || String(password).length < 6) {
    return res.status(400).json({
      error: "Password must be at least 6 characters.",
    });
  }

  if (!userName || !String(userName).trim()) {
    return res.status(400).json({
      error: "Username is required.",
    });
  }

  const role = "user";
  try {
    const user = await userModel.signup(
      String(userName).trim(),
      firstName,
      lastName,
      role,
      phone,
      password,
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    );

    const token = createToken(user._id);

    res.status(200).json(authResponse(user, token));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  console.log("AAAA", req.body)
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }
  const existU = await userModel.findOne({ userName: req.body.userName });
  if (existU && existU._id != id) {
    return res.status(400).json({ error: "Username already Taken.!." });
  }
  const body = { ...req.body };
  delete body.email;
  delete body.appPinHash;
  delete body.password;

  if (body.homeAddress != null || body.thana != null || body.district != null) {
    body.shippingAddress = composeAddress(
      body.homeAddress,
      body.thana,
      body.district
    );
  }

  const user = await userModel.findOneAndUpdate({ _id: id }, { ...body });

  if (user) {
    const toSend = await userModel.findById(id);
    const o = toSend.toObject();
    delete o.password;
    delete o.appPinHash;
    delete o.email;
    res.status(200).json(o);
  } else {
    return res.status(400).json({ error: "No Such Exam Found.!." });
  }
}

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  console.log("AAAA", req.body)
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }
  const user = await userModel.findOneAndDelete({ _id: id });

  if (user) {
    res.status(200).json(user);
  } else {
    return res.status(400).json({ error: "No Such Exam Found.!." });
  }
}


export const changePassword = async (req, res) => {
  const { id } = req.params;
  console.log("AAAA", req.body)
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid ID.!." });
  }

  const user = await userModel.findById(id);

  if (!user.password) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(req.body.newPassword, salt);
    await userModel.findOneAndUpdate({ _id: id }, { password: hash });
    return res.status(200).json({ message: "Password has been set successfully.!." });
  }
  else {
    const match = await bcrypt.compare(req.body.oldPassword, user.password);

    if (!match) {
      return res.status(400).json({ error: "Previous Password is not Correct.!." });
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(req.body.newPassword, salt);
    await userModel.findOneAndUpdate({ _id: id }, { password: hash });
    return res.status(200).json({ message: "Password has been changed successfully.!." });
  }
}


export const switchRole = async (req, res) => {
  const { id } = req.params;
  const user = await userModel.findById(id);
  const newRole = (user.role === 'admin') ? 'user' : 'admin';
  const toSend = await userModel.findByIdAndUpdate({ _id: id }, { role: newRole });

  return res.status(200).json(toSend);
}


export const switchPermission = async (req, res) => {
  const { id } = req.params;
  const user = await userModel.findById(id);
  const newPermission = (user.permission === null || !user.permission) ? true : false;
  const toSend = await userModel.findByIdAndUpdate({ _id: id }, { permission: newPermission });

  return res.status(200).json(toSend);
}

export const changeView = async (req, res) => {
  const { id } = req.params;
  const user = await userModel.findById(id);

  const toSend = await userModel.findByIdAndUpdate({ _id: id }, { userView: req.body.view });

  return res.status(200).json(toSend);
}