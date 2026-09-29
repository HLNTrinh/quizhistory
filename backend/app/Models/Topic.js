import mongoose from "mongoose";

const topicSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  period: { type: String, required: true },
  summary: { type: String, required: true },
  accent: { type: String, default: "#00236f" },
  grade: { type: String, default: "Khối 12" },
  difficulty: { type: String, default: "Trọng tâm THPT" },
  timeMinutes: { type: Number, default: 45 },
  xpReward: { type: Number, default: 450 },
  badgeName: { type: String, default: "Huy chương Lịch sử" },
  thumbnail: { type: String, default: "" },
  order: { type: Number, default: 0 }
});

export default mongoose.model("Topic", topicSchema);