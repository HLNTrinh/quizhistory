import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 80, required: function () { return !this.fullName; } },
  fullName: { type: String, trim: true, maxlength: 80, required: function () { return !this.name; } },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  avatar: { type: String, trim: true, default: "" },
  role: { type: String, enum: ["student", "teacher", "parent"], default: "student" },
  totalScore: { type: Number, min: 0, default: 0 }
}, { timestamps: true });

userSchema.pre("validate", function () {
  if (this.isModified("name") && this.name) this.fullName = this.name;
  else if (this.isModified("fullName") && this.fullName) this.name = this.fullName;
  else if (!this.fullName && this.name) this.fullName = this.name;
  else if (!this.name && this.fullName) this.name = this.fullName;
});

export default mongoose.model("User", userSchema);