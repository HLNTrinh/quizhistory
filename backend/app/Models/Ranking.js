import mongoose from "mongoose";

const rankingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  totalScore: { type: Number, min: 0, default: 0 },
  completedPackages: { type: Number, min: 0, default: 0 },
  completedSets: { type: Number, min: 0, default: 0 },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: { createdAt: false, updatedAt: true }, collection: "rankings" });

rankingSchema.index({ totalScore: -1, updatedAt: 1 });

export default mongoose.model("Ranking", rankingSchema);
