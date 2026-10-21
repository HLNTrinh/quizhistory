import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: "", trim: true, maxlength: 2000 },
  image: { type: String, default: "", trim: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: false, collection: "categories" });

categorySchema.index({ name: 1 }, { unique: true });

export default mongoose.model("Category", categorySchema);
