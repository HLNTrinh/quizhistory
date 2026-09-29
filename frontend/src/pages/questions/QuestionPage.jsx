import { useState } from "react";
import { api } from "../../lib/api.js";
import BrandMark from "../../components/BrandMark.jsx";

export default function QuestionPage({ quiz, user, onBack, onAttemptComplete }) {
  const [answers, setAnswers] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const question = quiz.questions[questionIndex];

  async function submitQuiz() {
    setBusy(true);
    setError("");
    try {
      const review = await api("/attempts", {
        method: "POST",
        body: JSON.stringify({
          topicId: quiz.topic._id,
          studentName: user.name,
          answers: quiz.questions.map((item) => ({
            questionId: item._id,
            selectedIndex: answers[item._id] ?? -1
          }))
        })
      });
      setResult(review);
      await onAttemptComplete();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body-md">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-surface-container-high shadow-sm">
        <div className="w-full px-4 md:px-8 max-w-7xl mx-auto flex items-center justify-between h-16">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-primary font-label-md text-label-md rounded-lg border border-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Trở về danh sách</span>
          </button>
          <div className="flex items-center gap-2">
            <BrandMark small />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-error-container/40 border border-error text-error rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="font-bold underline">Đóng</button>
          </div>
        )}

        {!result ? (
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-6 md:p-8 shadow-sm">
            {/* Topic Info & Meta */}
            <div className="mb-6 pb-6 border-b border-surface-container-high">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-label-sm font-label-sm uppercase tracking-wider bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full font-bold">
                  {quiz.topic.period}
                </span>
                <span className="text-label-md font-label-md text-on-surface-variant flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  Câu {questionIndex + 1} / {quiz.questions.length}
                </span>
              </div>
              <h1 className="text-headline-md font-headline-md text-primary font-extrabold">
                {quiz.topic.title}
              </h1>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-gradient-to-r from-primary-container to-secondary-container rounded-full transition-all duration-300"
                style={{ width: `${((questionIndex + 1) / quiz.questions.length) * 100}%` }}
              ></div>
            </div>

            {/* Question Prompt */}
            <div className="mb-8">
              <h2 className="text-headline-sm font-headline-sm text-on-surface font-bold leading-snug">
                {question?.prompt}
              </h2>
            </div>

            {/* Options List */}
            <div className="space-y-3 mb-8">
              {question?.options.map((option, index) => {
                const isSelected = answers[question._id] === index;
                return (
                  <button
                    key={option}
                    onClick={() => setAnswers((prev) => ({ ...prev, [question._id]: index }))}
                    className={`w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary-container/10 ring-2 ring-primary/20"
                        : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low hover:border-outline"
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 text-sm ${
                        isSelected
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-body-md font-body-md text-on-surface flex-grow font-medium">
                      {option}
                    </span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-primary text-xl font-bold">
                        check_circle
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Pagination / Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-surface-container-high">
              <button
                onClick={() => setQuestionIndex((idx) => Math.max(0, idx - 1))}
                disabled={questionIndex === 0}
                className={`px-4 py-2.5 rounded-xl font-label-md text-label-md font-bold flex items-center gap-2 border transition-all ${
                  questionIndex === 0
                    ? "opacity-50 cursor-not-allowed bg-surface-container-low text-outline"
                    : "bg-surface-container-lowest hover:bg-surface-container-low text-on-surface border-outline-variant"
                }`}
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Câu trước</span>
              </button>

              {questionIndex < quiz.questions.length - 1 ? (
                <button
                  onClick={() => setQuestionIndex((idx) => idx + 1)}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-md text-label-md font-bold flex items-center gap-2 btn-tactile-primary transition-all cursor-pointer"
                >
                  <span>Câu tiếp</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              ) : (
                <button
                  onClick={submitQuiz}
                  disabled={busy || Object.keys(answers).length !== quiz.questions.length}
                  className={`px-6 py-2.5 rounded-xl font-label-md text-label-md font-bold flex items-center gap-2 btn-tactile-gold transition-all cursor-pointer ${
                    Object.keys(answers).length !== quiz.questions.length
                      ? "bg-secondary-container/60 text-on-secondary-container/60 cursor-not-allowed"
                      : "bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary-container"
                  }`}
                >
                  <span>{busy ? "Đang chấm bài..." : "Nộp bài thi"}</span>
                  <span className="material-symbols-outlined text-sm">verified</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Result Review Screen */
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-6 md:p-8 shadow-sm text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary-container/20 text-secondary border border-secondary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl">military_tech</span>
            </div>

            <span className="text-label-sm font-label-sm uppercase tracking-wider bg-secondary-fixed text-on-secondary-fixed px-3 py-1 rounded-full font-extrabold">
              Kết quả bài thi
            </span>

            <h1 className="text-display-hero-mobile md:text-display-hero text-primary font-extrabold mt-3 mb-1">
              {result.score} / {result.totalQuestions} câu đúng
            </h1>
            <p className="text-body-md font-body-md text-on-surface-variant mb-8">
              Chủ đề: <strong className="text-on-surface">{quiz.topic.title}</strong>
            </p>

            {/* Detailed Answers Review */}
            <div className="text-left space-y-4 mb-8">
              <h3 className="text-title-md font-title-md font-bold text-primary border-b border-surface-container-high pb-2">
                Chi tiết đáp án & lời giải:
              </h3>
              {result.review.map((item, idx) => {
                const isCorrect = item.selectedIndex === item.answerIndex;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${
                      isCorrect ? "border-tertiary-container/30 bg-tertiary-container/5" : "border-error/30 bg-error-container/10"
                    }`}
                  >
                    <h4 className="font-bold text-body-md text-on-surface mb-2">
                      <span className="text-secondary font-extrabold mr-1.5">{idx + 1}.</span>
                      {item.prompt}
                    </h4>

                    <div className="space-y-1.5 text-body-sm pl-4">
                      <p className="text-tertiary-container font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Đáp án đúng: {item.options[item.answerIndex]}
                      </p>
                      {!isCorrect && (
                        <p className="text-error font-semibold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base">cancel</span>
                          Lựa chọn của bạn: {item.selectedIndex >= 0 ? item.options[item.selectedIndex] : "Chưa trả lời"}
                        </p>
                      )}
                      <p className="text-on-surface-variant mt-2 italic bg-surface-container-low p-2.5 rounded-lg border border-surface-container-high">
                        💡 {item.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={onBack}
              className="px-6 py-3 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-md text-label-md font-bold flex items-center gap-2 mx-auto btn-tactile-primary transition-all cursor-pointer"
            >
              <span>Trở về danh sách bài thi</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}