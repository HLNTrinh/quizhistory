import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 80 },
  name: { type: String, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false },
  passwordHash: { type: String, select: false },
  avatar: { type: String, trim: true, default: "" },
  role: {
    type: String,
    enum: ["student", "admin"],
    default: "student"
  },
  status: {
    type: String,
    enum: ["active", "locked"],
    default: "active"
  },
  totalScore: { type: Number, min: 0, default: 0 }
}, { timestamps: true, collection: "users" });

userSchema.pre("validate", function () {
  if (this.isModified("fullName") && this.fullName) {
    this.name = this.fullName;
  } else if (this.isModified("name") && this.name) {
    this.fullName = this.name;
  } else if (!this.fullName && this.name) {
    this.fullName = this.name;
  } else if (!this.name && this.fullName) {
    this.name = this.fullName;
  }

  if (this.isModified("password") && this.password && !this.passwordHash) {
    this.passwordHash = this.password;
  } else if (this.isModified("passwordHash") && this.passwordHash && !this.password) {
    this.password = this.passwordHash;
  }
});

export default mongoose.model("User", userSchema);
