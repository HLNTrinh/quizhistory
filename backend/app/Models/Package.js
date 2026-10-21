import mongoose from "mongoose";

const packageSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: "", trim: true, maxlength: 2000 },
  image: { type: String, default: "", trim: true },
  difficulty: { type: String, default: "medium", trim: true },
  totalScore: { type: Number, min: 0, default: 0 },
  estimatedTime: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ["draft", "active", "inactive"], default: "draft" }
}, { timestamps: true, collection: "packages" });

packageSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Package", packageSchema);
