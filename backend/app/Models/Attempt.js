import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questionSetId: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionSet", required: true },
  studentName: { type: String, default: "Học sinh", trim: true },
  answers: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selectedIndex: { type: Number, required: true }
  }],
  score: { type: Number, min: 0, default: 0 },
  correctAnswers: { type: Number, min: 0, default: 0 },
  wrongAnswers: { type: Number, min: 0, default: 0 },
  totalQuestions: { type: Number, min: 0, default: 0 },
  accuracy: { type: Number, min: 0, max: 100, default: 0 },
  timeSpent: { type: Number, min: 0, default: 0 },
  completedAt: { type: Date, default: null },
  status: {
    type: String,
    enum: ["in_progress", "completed", "abandoned"],
    default: "in_progress"
  }
}, { timestamps: true, collection: "attempts" });

attemptSchema.pre("validate", function () {
  const totalQuestions = Number.isFinite(this.totalQuestions) ? this.totalQuestions : 0;
  const score = Number.isFinite(this.score) ? this.score : 0;
  const correctAnswers = this.correctAnswers > 0 ? this.correctAnswers : score;

  this.correctAnswers = correctAnswers;
  this.wrongAnswers = Math.max(0, totalQuestions - correctAnswers);
  this.accuracy = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  if (!this.timeSpent) this.timeSpent = 0;
  if (!this.completedAt && this.status === "completed") this.completedAt = new Date();
});

attemptSchema.index({ userId: 1, questionSetId: 1, completedAt: -1 });
attemptSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Attempt", attemptSchema);
