import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionSetId: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionSet", required: true },
  content: { type: String, trim: true, required: true },
  prompt: { type: String, trim: true },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (items) => Array.isArray(items) && items.length === 4,
      message: "Mỗi câu hỏi trắc nghiệm phải có đúng 4 đáp án (A, B, C, D)."
    }
  },
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator(value) {
        return typeof value === "string" || Number.isInteger(value);
      },
      message: "correctAnswer phải là nội dung đáp án (string) hoặc vị trí (integer index)."
    }
  },
  answerIndex: { type: Number },
  explanation: { type: String, trim: true, default: "" },
  difficulty: { type: String, trim: true, default: "medium" },
  score: { type: Number, min: 0, default: 1 },
  sequenceOrder: { type: Number, min: 0, default: 0 },
  order: { type: Number, min: 0, default: 0 }
}, { timestamps: true, collection: "questions" });

questionSchema.pre("validate", function () {
  if (this.isModified("content") && this.content) {
    this.prompt = this.content;
  } else if (this.isModified("prompt") && this.prompt) {
    this.content = this.prompt;
  } else if (!this.content && this.prompt) {
    this.content = this.prompt;
  } else if (!this.prompt && this.content) {
    this.prompt = this.content;
  }

  if (this.sequenceOrder !== undefined && this.order === undefined) {
    this.order = this.sequenceOrder;
  } else if (this.order !== undefined && this.sequenceOrder === undefined) {
    this.sequenceOrder = this.order;
  }

  if (this.isModified("answerIndex") && this.answerIndex !== undefined) {
    this.correctAnswer = this.correctAnswer ?? this.answerIndex;
  } else if (this.isModified("correctAnswer") && Number.isInteger(this.correctAnswer)) {
    this.answerIndex = this.correctAnswer;
  } else if (this.isModified("correctAnswer") && typeof this.correctAnswer === "string" && Array.isArray(this.options)) {
    const idx = this.options.indexOf(this.correctAnswer);
    if (idx !== -1) this.answerIndex = idx;
  } else if (this.correctAnswer === undefined && this.answerIndex !== undefined) {
    this.correctAnswer = this.answerIndex;
  } else if (this.answerIndex === undefined && Number.isInteger(this.correctAnswer)) {
    this.answerIndex = this.correctAnswer;
  } else if (this.answerIndex === undefined && typeof this.correctAnswer === "string" && Array.isArray(this.options)) {
    const idx = this.options.indexOf(this.correctAnswer);
    if (idx !== -1) this.answerIndex = idx;
  }
});

questionSchema.index({ questionSetId: 1, sequenceOrder: 1 });
questionSchema.index({ questionSetId: 1, order: 1 });

export default mongoose.model("Question", questionSchema);
