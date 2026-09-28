import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, Trophy } from "lucide-react";
import { api } from "../../lib/api.js";

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
            selectedIndex: answers[item._id]
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

  return <section className="study-content">
    <button className="study-back" onClick={onBack}><ArrowLeft size={16} /> Các chủ đề</button>
    {error && <div className="study-error" role="alert">{error}<button onClick={() => setError("")}>Đóng</button></div>}
    {!result ? <>
      <div className="study-title"><span>{quiz.topic.period}</span><h1>{quiz.topic.title}</h1><p>{quiz.topic.summary}</p></div>
      <section className="study-quiz">
        <div className="study-question-meta">CÂU {questionIndex + 1} / {quiz.questions.length}<span><Clock3 size={15} /> Tự chọn nhịp độ</span></div>
        <div className="study-progress"><i style={{ width: `${((questionIndex + 1) / quiz.questions.length) * 100}%` }} /></div>
        <h2>{question?.prompt}</h2>
        <div className="study-options">{question?.options.map((option, index) => <button className={answers[question._id] === index ? "chosen" : ""} key={option} onClick={() => setAnswers((previous) => ({ ...previous, [question._id]: index }))}><b>{String.fromCharCode(65 + index)}</b>{option}{answers[question._id] === index && <Check size={17} />}</button>)}</div>
        <div className="study-quiz-actions">
          <button onClick={() => setQuestionIndex((value) => Math.max(0, value - 1))} disabled={questionIndex === 0}><ArrowLeft size={16} /> Câu trước</button>
          {questionIndex < quiz.questions.length - 1 ? <button className="primary-action" onClick={() => setQuestionIndex((value) => value + 1)}>Câu tiếp <ArrowRight size={16} /></button> : <button className="primary-action" onClick={submitQuiz} disabled={busy || Object.keys(answers).length !== quiz.questions.length}>{busy ? "Đang chấm..." : "Nộp bài"} <ArrowRight size={16} /></button>}
        </div>
      </section>
    </> : <section className="study-result">
      <span className="result-trophy"><Trophy size={28} /></span>
      <span className="study-overline">KẾT QUẢ ÔN TẬP</span>
      <h1>{result.score}/{result.totalQuestions} câu đúng</h1>
      <p>{quiz.topic.title}</p>
      <div className="answer-review">{result.review.map((item, index) => <article key={`${item.prompt}-${index}`}><h3><span>{index + 1}.</span> {item.prompt}</h3><p className="correct-answer"><CheckCircle2 size={16} /> {item.options[item.answerIndex]}</p>{item.selectedIndex !== item.answerIndex && <p className="wrong-answer">Em chọn: {item.options[item.selectedIndex]}</p>}<p className="explanation">{item.explanation}</p></article>)}</div>
      <button className="primary-action" onClick={onBack}>Chọn chủ đề khác <ArrowRight size={16} /></button>
    </section>}
  </section>;
}