import mongoose from "mongoose";

const questionSetSchema = new mongoose.Schema({
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: "", trim: true, maxlength: 2000 },
  order: { type: Number, min: 0, required: true },
  difficulty: { type: String, default: "medium", trim: true },
  score: { type: Number, min: 0, default: 0 },
  timeLimit: { type: Number, min: 0, default: 0 },
  unlockCondition: { type: mongoose.Schema.Types.Mixed, default: null },
  status: { type: String, enum: ["draft", "active", "inactive", "locked"], default: "draft" }
}, { timestamps: true, collection: "questionSets" });

questionSetSchema.index({ packageId: 1, order: 1 }, { unique: true });
questionSetSchema.index({ packageId: 1, status: 1 });

export default mongoose.model("QuestionSet", questionSetSchema);
