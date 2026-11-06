import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },
  completedSets: [{ type: mongoose.Schema.Types.ObjectId, ref: "QuestionSet" }],
  currentSetId: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionSet", default: null },
  currentSet: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionSet", default: null },
  unlockedSets: [{ type: mongoose.Schema.Types.ObjectId, ref: "QuestionSet" }],
  completedSetsCount: { type: Number, min: 0, default: 0 },
  totalSets: { type: Number, min: 0, default: 0 },
  totalScore: { type: Number, min: 0, default: 0 },
  completionPercent: { type: Number, min: 0, max: 100, default: 0 },
  status: {
    type: String,
    enum: ["not_started", "in_progress", "completed"],
    default: "in_progress"
  }
}, { timestamps: true, collection: "progress" });

progressSchema.pre("validate", function () {
  if (this.isModified("currentSetId") && this.currentSetId) {
    this.currentSet = this.currentSetId;
  } else if (this.isModified("currentSet") && this.currentSet) {
    this.currentSetId = this.currentSet;
  } else if (!this.currentSetId && this.currentSet) {
    this.currentSetId = this.currentSet;
  } else if (!this.currentSet && this.currentSetId) {
    this.currentSet = this.currentSetId;
  }
});

progressSchema.index({ userId: 1, packageId: 1 }, { unique: true });

export default mongoose.model("Progress", progressSchema);
