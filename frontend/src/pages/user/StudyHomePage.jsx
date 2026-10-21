import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Award, BookOpen, Check, CheckCircle2, Clock3, Compass, Flame,
  LogOut, Map, Medal, Play, Sparkles, Target, Trophy
} from "lucide-react";
import BrandMark from "../../components/BrandMark.jsx";
import { api } from "../../lib/api.js";
import "./StudyHomePage.css";

const packageFilters = [
  { id: "all", label: "Tất cả" },
  { id: "in-progress", label: "Đang học" },
  { id: "completed", label: "Đã xong" },
  { id: "not-started", label: "Chưa bắt đầu" }
];

function getPackageProgress(learningPackage) {
  const sets = learningPackage.questionSets || [];
  const completedSets = sets.filter((questionSet) => questionSet.completed).length;
  return {
    completedSets,
    totalSets: learningPackage.questionSetCount || sets.length,
    percent: sets.length ? Math.round((completedSets / sets.length) * 100) : 0,
    completed: sets.length > 0 && completedSets === sets.length,
    inProgress: completedSets > 0 && completedSets < sets.length
  };
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Vừa hoàn thành";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(date);
}

export default function StudyHomePage({ user, onLogout, onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [packages, setPackages] = useState([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const userInitial = user.name.trim().split(/\s+/).at(-1)?.[0]?.toLocaleUpperCase("vi-VN") || "S";

  async function refresh() {
    const [nextDashboard, nextPackages] = await Promise.all([
      api("/dashboard"),
      api("/packages")
    ]);
    setDashboard(nextDashboard);
    setPackages(nextPackages);
  }

  useEffect(() => {
    refresh().catch((loadError) => setError(loadError.message));
  }, []);

  const packageSummaries = useMemo(() => packages.map((learningPackage) => ({
    ...learningPackage,
    progress: getPackageProgress(learningPackage)
  })), [packages]);
  const totalSets = packageSummaries.reduce((total, item) => total + item.progress.totalSets, 0);
  const completedSets = packageSummaries.reduce((total, item) => total + item.progress.completedSets, 0);
  const completedPackages = packageSummaries.filter((item) => item.progress.completed).length;
  const journeyPercent = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;
  const activePackage = packageSummaries.find((item) => item.progress.inProgress)
    || packageSummaries.find((item) => item.progress.totalSets > 0 && !item.progress.completed);
  const visiblePackages = packageSummaries.filter((item) => {
    if (filter === "in-progress") return item.progress.inProgress;
    if (filter === "completed") return item.progress.completed;
    if (filter === "not-started") return !item.progress.completed && !item.progress.inProgress;
    return true;
  });
  const activeHistory = dashboard?.recentAttempts || [];

  function openPackage(learningPackage) {
    onNavigate(`/packages/${learningPackage._id}`);
  }

  return <main className="study-shell">
    <header className="study-topbar">
      <a className="study-brand" href="/app" onClick={(event) => { event.preventDefault(); onNavigate("/app"); }} aria-label="Sử Ký, trang chủ"><BrandMark small /><span>Sử Ký<small>ÔN TẬP LỊCH SỬ VIỆT NAM</small></span></a>
      <nav className="study-nav" aria-label="Điều hướng trang">
        <a className="study-nav-active" href="/app" onClick={(event) => { event.preventDefault(); onNavigate("/app"); }}><Map size={13} /> Hành trình</a>
        <a href="/packages" onClick={(event) => { event.preventDefault(); onNavigate("/packages"); }}><Compass size={13} /> Khám phá</a>
        <a href="/leaderboard" onClick={(event) => { event.preventDefault(); onNavigate("/leaderboard"); }}><Medal size={13} /> Bảng xếp hạng</a>
        <a href="/profile" onClick={(event) => { event.preventDefault(); onNavigate("/profile"); }}>Hồ sơ</a>
      </nav>
      <div className="study-user">
        <div className="study-profile"><span className="study-avatar">{userInitial}</span><span className="study-profile-copy"><strong>{user.name}</strong><small>Hồ sơ học tập</small></span></div>
        <button onClick={onLogout}><LogOut size={14} /><span>Đăng xuất</span></button>
      </div>
    </header>

    {error && <div className="study-error" role="alert">{error}<button onClick={() => setError("")}>Đóng</button></div>}
    {!dashboard ? <div className="study-loading">Đang tải hành trình học tập...</div> : <div className="study-page">
      <section className="dashboard-welcome">
        <div className="welcome-copy">
          <span className="welcome-kicker"><Sparkles size={12} /> HÔM NAY MÌNH CÙNG HỌC GÌ NHỈ?</span>
          <h1>Chào bạn, {user.name}! <span aria-hidden="true">👋</span></h1>
          <p>Hôm nay là một ngày tuyệt vời để tiếp tục khám phá những trang sử hào hùng của dân tộc. Hãy hoàn thành thử thách tiếp theo nhé!</p>
        </div>
        <div className="streak-card">
          <span className="streak-icon"><Flame size={21} /></span>
          <span><small>HOẠT ĐỘNG HỌC TẬP</small><strong>{dashboard.attempts} lượt ôn tập</strong><em><CheckCircle2 size={11} /> Bắt đầu thêm một chặng mới</em></span>
        </div>
      </section>

      <section className="dashboard-stats" aria-label="Thống kê học tập">
        <article className="dashboard-stat">
          <span className="stat-top"><span>Tổng số câu hỏi</span><i className="stat-icon stat-icon-gold"><BookOpen size={15} /></i></span>
          <strong>{dashboard.questionCount.toLocaleString("vi-VN")}<small> câu</small></strong>
          <span className="stat-note"><Sparkles size={10} /> Sẵn sàng để khám phá</span>
        </article>
        <article className="dashboard-stat">
          <span className="stat-top"><span>Bộ câu hỏi hoàn thành</span><i className="stat-icon stat-icon-violet"><Check size={15} /></i></span>
          <strong>{completedSets}<small> / {totalSets} bộ</small></strong>
          <span className="stat-note"><CheckCircle2 size={10} /> Chinh phục từng chặng</span>
        </article>
        <article className="dashboard-stat">
          <span className="stat-top"><span>Gói chuyên đề hoàn thành</span><i className="stat-icon stat-icon-teal"><Award size={15} /></i></span>
          <strong>{completedPackages}<small> / {packageSummaries.length} gói</small></strong>
          <span className="stat-note"><Trophy size={10} /> Mỗi gói là một dấu mốc</span>
        </article>
        <article className="dashboard-stat">
          <span className="stat-top"><span>Tiến độ toàn lộ trình</span><i className="stat-icon stat-icon-blue"><Target size={15} /></i></span>
          <strong>{journeyPercent}<small>%</small></strong>
          <span className="stat-progress"><i style={{ width: `${journeyPercent}%` }} /></span>
          <span className="stat-note stat-note-end">{journeyPercent ? "Đang tiến bộ!" : "Bắt đầu ngay hôm nay"}</span>
        </article>
      </section>

      {activePackage && <section className="featured-package">
        <span className="featured-ribbon"><Sparkles size={10} /> ĐANG TIẾP DIỄN</span>
        <div className="featured-copy">
          <span className="section-eyebrow"><Compass size={11} /> GÓI CHUYÊN ĐỀ CỦA BẠN</span>
          <h2>{activePackage.name}</h2>
          <p>{activePackage.description || activePackage.category || "Tiếp tục hành trình khám phá lịch sử Việt Nam."}</p>
          <div className="featured-progress-label"><span>Tiến độ gói chuyên đề</span><strong>{activePackage.progress.percent}% ({activePackage.progress.completedSets} / {activePackage.progress.totalSets} bộ)</strong></div>
          <div className="featured-progress"><i style={{ width: `${activePackage.progress.percent}%` }} /></div>
        </div>
        <div className="featured-actions">
          <button className="featured-primary" onClick={() => openPackage(activePackage)}><Play size={13} /> Tiếp tục ngay <ArrowRight size={13} /></button>
          <button className="featured-secondary" onClick={() => openPackage(activePackage)}><Map size={13} /> Xem bản đồ chặng</button>
        </div>
      </section>}

      <section className="dashboard-packages" id="package-list">
        <div className="dashboard-section-heading">
          <div><h2>Các gói câu hỏi của bạn</h2><p>Lộ trình học tập cá nhân hóa được chia theo từng chiến dịch và mốc son lịch sử.</p></div>
          <div className="package-filters" role="group" aria-label="Lọc gói câu hỏi">
            {packageFilters.map(({ id, label }) => {
              const count = id === "all" ? packageSummaries.length
                : id === "completed" ? completedPackages
                  : id === "in-progress" ? packageSummaries.filter((item) => item.progress.inProgress).length
                    : packageSummaries.filter((item) => !item.progress.completed && !item.progress.inProgress).length;
              return <button className={filter === id ? "filter-active" : ""} key={id} onClick={() => setFilter(id)}>{label} <span>{count}</span></button>;
            })}
          </div>
        </div>
        {visiblePackages.length ? <div className="dashboard-package-grid">
          {visiblePackages.map((learningPackage, index) => {
            const { completed, inProgress, completedSets: done, totalSets: total, percent } = learningPackage.progress;
            const status = completed ? "completed" : inProgress ? "in-progress" : "not-started";
            return <article className={`dashboard-package-card ${status}`} key={learningPackage._id}>
              <div className="package-card-top">
                <span className={`package-status status-${status}`}>{completed ? <><CheckCircle2 size={10} /> HOÀN THÀNH</> : inProgress ? <><Sparkles size={10} /> ĐANG HỌC</> : <><Clock3 size={10} /> CHƯA BẮT ĐẦU</>}</span>
                <span className="package-card-count">{done}/{total} bộ</span>
              </div>
              <span className={`package-card-icon package-icon-${index % 4}`}>{index % 2 ? <Award size={17} /> : <Compass size={17} />}</span>
              <span className="package-category">{learningPackage.category || "Lịch sử Việt Nam"}</span>
              <h3>{learningPackage.name}</h3>
              <p>{learningPackage.description || "Khám phá những dấu mốc đáng nhớ và thử thách kiến thức lịch sử của bạn."}</p>
              <div className="package-card-progress">
                <span><small>{completed ? "Kết quả" : "Tiến độ"}</small><strong>{percent}%</strong></span>
                <i><b style={{ width: `${percent}%` }} /></i>
              </div>
              <button className={`package-card-action action-${status}`} onClick={() => openPackage(learningPackage)}>
                {completed ? <><Check size={12} /> Ôn tập lại</> : inProgress ? <><Play size={12} /> Học tiếp</> : <><ArrowRight size={12} /> Bắt đầu học</>}
              </button>
            </article>;
          })}
        </div> : <div className="dashboard-empty"><BookOpen size={20} /><strong>Chưa có gói nào trong mục này</strong><span>Hãy khám phá các gói câu hỏi để bắt đầu hành trình.</span><button onClick={() => onNavigate("/packages")}>Khám phá gói học <ArrowRight size={12} /></button></div>}
      </section>

      <section className="dashboard-lower">
        <article className="progress-panel">
          <div className="panel-heading"><span><Target size={15} /><span><strong>Tiến độ theo gói học</strong><small>Chinh phục các bộ câu hỏi để hoàn thành hành trình.</small></span></span><button onClick={() => onNavigate("/packages")}>Chi tiết <ArrowRight size={11} /></button></div>
          {packageSummaries.length ? <div className="progress-package-list">{packageSummaries.slice(0, 4).map((item) => <button className="progress-package-row" key={item._id} onClick={() => openPackage(item)}>
            <span className="progress-package-title"><i className={item.progress.completed ? "progress-dot done" : item.progress.inProgress ? "progress-dot active" : "progress-dot"} />{item.name}<strong>{item.progress.percent}%</strong></span>
            <span className="progress-package-track"><i className={item.progress.completed ? "track-done" : ""} style={{ width: `${item.progress.percent}%` }} /></span>
          </button>)}</div> : <div className="panel-empty">Các gói học sẽ xuất hiện tại đây.</div>}
          <div className="progress-panel-footer"><Medal size={14} /><span>Mỗi chặng hoàn thành sẽ mở khóa thử thách tiếp theo.</span></div>
        </article>

        <article className="activity-panel">
          <div className="panel-heading"><span><Clock3 size={15} /><span><strong>Hoạt động gần đây</strong><small>Lịch sử bài tập và thử thách gần nhất</small></span></span><a href="/profile" onClick={(event) => { event.preventDefault(); onNavigate("/profile"); }}>Tất cả</a></div>
          {activeHistory.length ? <div className="activity-list">{activeHistory.slice(0, 4).map((attempt, index) => {
            const percent = attempt.totalQuestions ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0;
            return <div className="activity-row" key={attempt._id}>
              <span className={`activity-icon activity-icon-${index % 3}`}>{index === 0 ? <Check size={14} /> : <Trophy size={13} />}</span>
              <span className="activity-copy"><strong>{attempt.questionSetId?.name || attempt.topic?.title || "Bộ câu hỏi lịch sử"}</strong><small>{attempt.score}/{attempt.totalQuestions} câu ({percent}%)</small></span>
              <time>{formatDate(attempt.createdAt)}</time>
            </div>;
          })}</div> : <div className="activity-empty"><span className="activity-icon"><Sparkles size={14} /></span><span><strong>Chưa có hoạt động gần đây</strong><small>Hoàn thành một bộ câu hỏi để xem kết quả ở đây.</small></span></div>}
          <button className="activity-more" onClick={() => onNavigate("/profile")}>Xem lịch sử học tập</button>
        </article>
      </section>

      <section className="dashboard-discover">
        <div className="dashboard-section-heading"><div><h2>Gợi ý khám phá tiếp theo</h2><p>Những gói học phù hợp để tiếp tục hành trình lịch sử của bạn.</p></div><button className="discover-all" onClick={() => onNavigate("/packages")}>Xem tất cả gói <ArrowRight size={12} /></button></div>
        {packageSummaries.length ? <div className="discover-grid">{packageSummaries.filter((item) => !item.progress.completed).slice(0, 3).map((item, index) => <article className="discover-card" key={item._id}>
          <span className={`discover-icon discover-icon-${index}`}><Compass size={17} /></span><span className="discover-meta">{item.progress.totalSets} bộ đề <i>·</i> {item.questionCount} câu hỏi</span>
          <h3>{item.name}</h3><p>{item.description || "Bắt đầu khám phá những dấu mốc quan trọng trong lịch sử Việt Nam."}</p>
          <button onClick={() => openPackage(item)}>Mở lộ trình <ArrowRight size={12} /></button>
        </article>)}</div> : <div className="dashboard-empty"><Trophy size={19} /><strong>Bạn đã hoàn thành tất cả các gói hiện có!</strong><span>Quay lại sau để khám phá những hành trình mới.</span></div>}
      </section>

      <footer className="study-footer"><a className="footer-brand" href="/app" onClick={(event) => { event.preventDefault(); onNavigate("/app"); }}>Sử Ký</a><span>© 2026 Sử Ký · Nền tảng học lịch sử Việt Nam tương tác.</span><span>Học tập mỗi ngày, hiểu thêm lịch sử.</span></footer>
    </div>}
  </main>;
}
