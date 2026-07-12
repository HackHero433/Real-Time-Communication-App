import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: String,
    emailVerified: { type: Boolean, default: true },
    emailVerificationOtpHash: String,
    emailVerificationOtpExpiresAt: Date,
    passwordResetOtpHash: String,
    passwordResetOtpExpiresAt: Date,
    passwordChangedAt: Date
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("User", userSchema);
