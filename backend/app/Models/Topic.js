import mongoose from "mongoose";

const topicSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  period: { type: String, required: true },
  summary: { type: String, required: true },
  accent: { type: String, default: "#c65d3a" },
  order: { type: Number, default: 0 }
});

export default mongoose.model("Topic", topicSchema);