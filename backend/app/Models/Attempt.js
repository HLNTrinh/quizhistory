import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () { return !this.userId; }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () { return !this.user; }
  },
  studentName: { type: String, default: "Học sinh", trim: true },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Topic",
    required: function () { return !this.questionSetId; }
  },
  questionSetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuestionSet",
    required: function () { return !this.topic; }
  },
  answers: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selectedIndex: { type: Number, required: true }
  }],
  score: { type: Number, required: true },
  correctAnswers: { type: Number, min: 0, required: true },
  wrongAnswers: { type: Number, min: 0, required: true },
  totalQuestions: { type: Number, required: true },
  accuracy: { type: Number, min: 0, max: 100, required: true },
  timeSpent: { type: Number, min: 0, required: true },
  completedAt: { type: Date, default: null },
  status: { type: String, enum: ["in_progress", "completed", "abandoned"], default: "completed" }
}, { timestamps: true });

attemptSchema.pre("validate", function () {
  if (this.isModified("user") && this.user) this.userId = this.user;
  else if (this.isModified("userId") && this.userId) this.user = this.userId;
  else if (!this.userId && this.user) this.userId = this.user;
  else if (!this.user && this.userId) this.user = this.userId;

  if (this.correctAnswers === undefined && this.score !== undefined) this.correctAnswers = this.score;
  if (this.wrongAnswers === undefined && this.totalQuestions !== undefined && this.correctAnswers !== undefined) {
    this.wrongAnswers = Math.max(0, this.totalQuestions - this.correctAnswers);
  }
  if (this.accuracy === undefined && this.totalQuestions > 0 && this.correctAnswers !== undefined) {
    this.accuracy = Math.round((this.correctAnswers / this.totalQuestions) * 100);
  }
  if (this.timeSpent === undefined) this.timeSpent = 0;
  if (!this.completedAt && this.status === "completed") this.completedAt = new Date();
});

attemptSchema.index({ user: 1, topic: 1, createdAt: -1 });
attemptSchema.index({ userId: 1, questionSetId: 1, completedAt: -1 });

export default mongoose.model("Attempt", attemptSchema);