import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  studentName: { type: String, default: "Học sinh", trim: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
  answers: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selectedIndex: { type: Number, required: true }
  }],
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Attempt", attemptSchema);