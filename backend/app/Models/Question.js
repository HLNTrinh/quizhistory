import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
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
  prompt: { type: String, trim: true, required: function () { return !this.content; } },
  content: { type: String, trim: true, required: function () { return !this.prompt; } },
  options: { type: [String], required: true, validate: (items) => items.length >= 2 },
  answerIndex: { type: Number, required: function () { return this.correctAnswer === undefined; } },
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: function () { return this.answerIndex === undefined; },
    validate: {
      validator(value) {
        return typeof value === "string" || Number.isInteger(value);
      },
      message: "correctAnswer must be an option string or integer index."
    }
  },
  explanation: { type: String, trim: true, required: true },
  difficulty: { type: String, trim: true, default: "medium" },
  score: { type: Number, min: 0, default: 1 },
  order: { type: Number, min: 0, default: 0 }
});

questionSchema.pre("validate", function () {
  if (this.isModified("prompt") && this.prompt) this.content = this.prompt;
  else if (this.isModified("content") && this.content) this.prompt = this.content;
  else if (!this.content && this.prompt) this.content = this.prompt;
  else if (!this.prompt && this.content) this.prompt = this.content;
  if (this.isModified("answerIndex") && this.answerIndex !== undefined) {
    this.correctAnswer = this.answerIndex;
  }
  else if (this.isModified("correctAnswer") && Number.isInteger(this.correctAnswer)) {
    this.answerIndex = this.correctAnswer;
  } else if (this.isModified("correctAnswer") && typeof this.correctAnswer === "string") {
    this.answerIndex = this.options.indexOf(this.correctAnswer);
  } else if (this.correctAnswer === undefined && this.answerIndex !== undefined) {
    this.correctAnswer = this.answerIndex;
  } else if (this.answerIndex === undefined && Number.isInteger(this.correctAnswer)) {
    this.answerIndex = this.correctAnswer;
  } else if (this.answerIndex === undefined && typeof this.correctAnswer === "string") {
    this.answerIndex = this.options.indexOf(this.correctAnswer);
  }
});

questionSchema.index(
  { questionSetId: 1, order: 1 },
  { unique: true, partialFilterExpression: { questionSetId: { $type: "objectId" } } }
);

export default mongoose.model("Question", questionSchema);