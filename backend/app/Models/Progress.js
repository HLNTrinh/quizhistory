import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },
  completedSets: [{ type: mongoose.Schema.Types.ObjectId, ref: "QuestionSet" }],
  currentSet: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionSet", default: null },
  unlockedSets: [{ type: mongoose.Schema.Types.ObjectId, ref: "QuestionSet" }],
  completedSetsCount: { type: Number, min: 0, default: 0 },
  totalSets: { type: Number, min: 0, default: 0 },
  totalScore: { type: Number, min: 0, default: 0 },
  completionPercent: { type: Number, min: 0, max: 100, default: 0 },
  status: { type: String, enum: ["not_started", "in_progress", "completed"], default: "not_started" }
}, { timestamps: { createdAt: false, updatedAt: true }, collection: "progress" });

progressSchema.index({ userId: 1, packageId: 1 }, { unique: true });

export default mongoose.model("Progress", progressSchema);
