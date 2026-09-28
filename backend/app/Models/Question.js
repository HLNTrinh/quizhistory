import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
  prompt: { type: String, required: true },
  options: { type: [String], required: true, validate: (items) => items.length >= 2 },
  answerIndex: { type: Number, required: true },
  explanation: { type: String, required: true },
  order: { type: Number, default: 0 }
});

export default mongoose.model("Question", questionSchema);