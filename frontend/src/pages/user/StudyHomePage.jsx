import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import BrandMark from "../../components/BrandMark.jsx";
import { api } from "../../lib/api.js";
import QuestionPage from "../questions/QuestionPage.jsx";

export default function StudyHomePage({ user, onLogout }) {
  const [dashboard, setDashboard] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const userInitial = user.name.trim().split(/\s+/).at(-1)?.[0]?.toLocaleUpperCase("vi-VN") || "S";

  async function refresh() {
    setDashboard(await api("/dashboard"));
  }

  useEffect(() => {
    refresh().catch((loadError) => setError(loadError.message));
  }, []);

  async function startQuiz(topic) {
    setBusy(true);
    setError("");
    try {
      setQuiz(await api(`/quizzes/${topic._id}`));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setBusy(false);
    }
  }

  return <main className="study-shell">
    <header className="study-topbar"><a className="study-brand" href="/"><BrandMark small /> Sử Ký</a><div className="study-user"><div className="study-profile"><span className="study-avatar">{userInitial}</span><span className="study-profile-copy"><strong>{user.name}</strong><small>Hồ sơ học tập</small></span></div><button onClick={onLogout}>Đăng xuất</button></div></header>
    {error && <div className="study-error" role="alert">{error}<button onClick={() => setError("")}>Đóng</button></div>}
    {!dashboard ? <div className="study-loading">Đang tải hành trình học tập...</div> : quiz ? <QuestionPage key={quiz.topic._id} quiz={quiz} user={user} onBack={() => setQuiz(null)} onAttemptComplete={refresh} /> : <section className="study-content">
      <div className="study-title"><span>KHÔNG GIAN HỌC TẬP</span><h1>Chào {user.name},<br />mình cùng ôn sử nhé.</h1><p>Mỗi câu hỏi là một chuyến đi ngắn qua những dấu mốc đáng nhớ.</p></div>
      <div className="study-stats"><div><span>CHỦ ĐỀ</span><strong>{dashboard.topics.length}</strong></div><div><span>CÂU HỎI</span><strong>{dashboard.questionCount}</strong></div><div><span>LƯỢT ÔN TẬP CỦA EM</span><strong>{dashboard.attempts}</strong></div><div><span>ĐỘ CHÍNH XÁC CỦA EM</span><strong>{dashboard.accuracy}%</strong></div></div>
      <div className="study-section-head"><div><span className="study-overline">BẢN ĐỒ KIẾN THỨC</span><h2>Chọn một chặng đường</h2></div><span className="study-total">{dashboard.topics.length} CHỦ ĐỀ</span></div>
      <div className="study-topics">{dashboard.topics.map((topic, index) => <button className="study-topic" key={topic._id} onClick={() => startQuiz(topic)}><span className="topic-count">0{index + 1}<ArrowRight size={16} /></span><span className="topic-period">{topic.period}</span><strong>{topic.title}</strong><span className="topic-description">{topic.summary}</span><span className="topic-questions"><BookOpen size={15} /> {topic.questionCount} câu hỏi <ArrowRight size={15} /></span></button>)}</div>
      <section className="study-history"><div className="history-heading"><div><span className="study-overline">HỒ SƠ CỦA {user.name.toLocaleUpperCase("vi-VN")}</span><h2>Lịch sử ôn tập</h2></div><span>{dashboard.recentAttempts.length} bài gần đây</span></div>{dashboard.recentAttempts.length ? dashboard.recentAttempts.map((attempt) => <article className="history-row" key={attempt._id}><span className="history-check"><CheckCircle2 size={17} /></span><span className="history-topic"><strong>{attempt.topic?.title || "Chủ đề lịch sử"}</strong><small>{new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(attempt.createdAt))}</small></span><strong className="history-score">{attempt.score}<small>/{attempt.totalQuestions}</small></strong></article>) : <p className="history-empty">Bài ôn tập đầu tiên của em sẽ được lưu tại đây.</p>}</section>
      {busy && <p className="study-loading">Đang chuẩn bị câu hỏi...</p>}
    </section>}
  </main>;
}