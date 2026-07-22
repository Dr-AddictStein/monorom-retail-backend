import mongoose from "mongoose";

const signupOtpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const SignupOtp = mongoose.model("SignupOtp", signupOtpSchema);
export default SignupOtp;
