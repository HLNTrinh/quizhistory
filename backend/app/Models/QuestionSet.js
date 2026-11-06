import mongoose from "mongoose";

const questionSetSchema = new mongoose.Schema({
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: "", trim: true, maxlength: 2000 },
  sequenceOrder: { type: Number, min: 0 },
  order: { type: Number, min: 0 },
  difficulty: { type: String, default: "medium", trim: true },
  score: { type: Number, min: 0, default: 0 },
  timeLimit: { type: Number, min: 0, default: 0 },
  unlockCondition: { type: mongoose.Schema.Types.Mixed, default: null },
  status: { type: String, enum: ["draft", "active", "inactive", "locked"], default: "locked" }
}, { timestamps: true, collection: "questionSets" });

questionSetSchema.pre("validate", function () {
  if (this.sequenceOrder !== undefined && this.order === undefined) {
    this.order = this.sequenceOrder;
  } else if (this.order !== undefined && this.sequenceOrder === undefined) {
    this.sequenceOrder = this.order;
  } else if (this.sequenceOrder === undefined && this.order === undefined) {
    this.sequenceOrder = 0;
    this.order = 0;
  }
});

questionSetSchema.index({ packageId: 1, sequenceOrder: 1 });
questionSetSchema.index({ packageId: 1, order: 1 });
questionSetSchema.index({ packageId: 1, status: 1 });

export default mongoose.model("QuestionSet", questionSetSchema);
