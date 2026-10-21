import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronLeft, ChevronRight,
  Clock3, Compass, Flag, Gem, Landmark, LockKeyhole, LogOut, Medal, Search, Shield,
  Sparkles, Swords, Trophy, X
} from "lucide-react";
import BrandMark from "../../components/BrandMark.jsx";
import { api } from "../../lib/api.js";
import QuestionPage from "../questions/QuestionPage.jsx";
import "./StudyHomePage.css";
import "./PackagesPage.css";

const pageSize = 6;
const artworkIcons = [Landmark, Swords, Shield, Flag, Medal, Compass];

function normalize(value) {
  return value.toLocaleLowerCase("vi-VN").replace(/đ/g, "d").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getDifficultyLabel(difficulty) {
  const labels = { easy: "Cơ bản", medium: "Trung bình", hard: "Thử thách" };
  return labels[difficulty] || difficulty;
}

export default function PackagesPage({ user, onLogout, onNavigate, packageId }) {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("Tất cả thời kỳ");
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const initial = user.name.trim().split(/\s+/).at(-1)?.[0]?.toLocaleUpperCase("vi-VN") || "S";

  async function loadPackages() {
    const result = await api("/packages");
    setPackages(result);
    return result;
  }

  async function refreshPackages() {
    setLoading(true);
    setError("");
    try {
      await loadPackages();
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshPackages();
  }, []);

  useEffect(() => {
    if (!packageId) {
      setSelectedPackage(null);
      setDetailLoading(false);
      return undefined;
    }

    let active = true;
    setSelectedPackage(null);
    setDetailLoading(true);
    setError("");
    api(`/packages/${encodeURIComponent(packageId)}`)
      .then((result) => {
        if (active) setSelectedPackage(result);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });

    return () => { active = false; };
  }, [packageId]);

  async function startQuestionSet(questionSet) {
    setBusy(true);
    setError("");
    try {
      setQuiz(await api(`/question-sets/${encodeURIComponent(questionSet._id)}/quiz`));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setBusy(false);
    }
  }

  const periods = useMemo(() => [...new Set(packages.map((item) => item.category).filter(Boolean))], [packages]);
  const questionTotal = packages.reduce((total, item) => total + (item.questionCount || 0), 0);
  const questionSetTotal = packages.reduce((total, item) => total + (item.questionSetCount || 0), 0);
  const filteredPackages = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    const filtered = packages.filter((item) => {
      const matchesPeriod = period === "Tất cả thời kỳ" || item.category === period;
      const matchesAvailability = availability === "all"
        || (availability === "available" ? item.questionCount > 0 : item.questionCount === 0);
      const searchable = normalize(`${item.name} ${item.category} ${item.description}`);
      return matchesPeriod && matchesAvailability && (!normalizedQuery || searchable.includes(normalizedQuery));
    });

    if (sort === "question-count") return filtered.sort((first, second) => second.questionCount - first.questionCount);
    if (sort === "title") return filtered.sort((first, second) => first.name.localeCompare(second.name, "vi"));
    return filtered;
  }, [availability, packages, period, query, sort]);

  const totalPages = Math.ceil(filteredPackages.length / pageSize);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const visiblePackages = filteredPackages.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const completedSets = selectedPackage?.questionSets.filter((questionSet) => questionSet.completed).length || 0;
  const activeSetIndex = selectedPackage?.questionSets.findIndex((questionSet) => questionSet.unlocked && !questionSet.completed) ?? -1;
  const completionPercent = selectedPackage?.questionSetCount
    ? Math.round((completedSets / selectedPackage.questionSetCount) * 100)
    : 0;

  function updatePeriod(nextPeriod) {
    setPeriod(nextPeriod);
    setPage(1);
  }

  function clearFilters() {
    setQuery("");
    setPeriod("Tất cả thời kỳ");
    setAvailability("all");
    setSort("default");
    setPage(1);
  }

  async function finishQuestionSet() {
    try {
      await loadPackages();
      if (packageId) {
        setSelectedPackage(await api(`/packages/${encodeURIComponent(packageId)}`));
      }
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  const activeFilters = query || period !== "Tất cả thời kỳ" || availability !== "all";
  const detailView = Boolean(packageId);

  return <main className="study-shell packages-shell">
    <header className="study-topbar">
      <a className="study-brand" href="/app" onClick={(event) => { event.preventDefault(); onNavigate("/app"); }} aria-label="Sử Ký, trang chủ"><BrandMark small /><span>Sử Ký<small>ÔN TẬP LỊCH SỬ VIỆT NAM</small></span></a>
      <nav className="study-nav" aria-label="Điều hướng trang">
        <a href="/app" onClick={(event) => { event.preventDefault(); onNavigate("/app"); }}>Trang chủ</a>
        <a className="packages-nav-active" href="/packages" onClick={(event) => { event.preventDefault(); onNavigate("/packages"); }}>Khám phá</a>
        <a href="/profile" onClick={(event) => { event.preventDefault(); onNavigate("/profile"); }}>Hồ sơ</a>
      </nav>
      <div className="study-user">
        <div className="study-profile"><span className="study-avatar">{initial}</span><span className="study-profile-copy"><strong>{user.name}</strong><small>Hồ sơ học tập</small></span></div>
        <button onClick={onLogout}><LogOut size={14} /><span>Đăng xuất</span></button>
      </div>
    </header>

    {error && <div className="study-error" role="alert">{error}<button onClick={() => setError("")}>Đóng</button></div>}
    {quiz ? <QuestionPage key={quiz.questionSet?._id || quiz.topic._id} quiz={quiz} user={user} onBack={() => setQuiz(null)} onAttemptComplete={finishQuestionSet} /> : detailView ? <div className="packages-page package-detail-page" id="package-detail">
      {detailLoading ? <div className="packages-loading">Đang tải nội dung gói câu hỏi...</div> : selectedPackage ? <>
        <div className="journey-breadcrumb"><button onClick={() => onNavigate("/packages")}><ArrowLeft size={13} /> Chi tiết gói</button><span>/</span><a href="/packages" onClick={(event) => { event.preventDefault(); onNavigate("/packages"); }}>Khám phá</a><span>/</span><strong>{selectedPackage.name}</strong><span>/</span><b>Bản đồ hành trình</b></div>
        <section className="journey-overview">
          <div className="journey-overview-copy">
            <span className="journey-package-tag"><Compass size={12} /> {selectedPackage.category} · {selectedPackage.questionSetCount} BỘ THỬ THÁCH</span>
            <h1>Bản đồ hành trình: {selectedPackage.name}</h1>
            <p>{selectedPackage.description || "Vượt qua từng chặng thử thách để khám phá những dấu mốc lịch sử."}</p>
          </div>
          <div className="journey-overview-progress">
            <div><span>Tiến độ hành trình</span><strong>{completedSets} / {selectedPackage.questionSetCount} ({completionPercent}%)</strong></div>
            <div className="journey-overview-track"><i style={{ width: `${completionPercent}%` }} /></div>
            <small><Gem size={12} /> {selectedPackage.questionCount} câu hỏi trong hành trình</small>
          </div>
          <div className="journey-legend"><span>CHÚ GIẢI TRẠNG THÁI:</span><div><i className="legend-complete"><CheckCircle2 size={11} /> Đã hoàn thành</i><i className="legend-active"><Sparkles size={11} /> Đang mở · Tiếp tục</i><i className="legend-locked"><LockKeyhole size={11} /> Đã khóa</i></div></div>
        </section>
        <div className="journey-layout">
          <section className="journey-map-panel">
            <div className="journey-map-heading"><span><Compass size={16} /><span><strong>Hành trình chinh phục</strong><small>Hoàn thành từng chặng để mở khóa chặng kế tiếp.</small></span></span><span className="journey-map-goal"><Trophy size={13} /> Mục tiêu: hoàn thành gói</span></div>
            {selectedPackage.questionSets.length ? <div className="journey-map">
              <span className="journey-route journey-route-complete" style={{ "--route-progress": `${completionPercent}%` }} aria-hidden="true" />
              {selectedPackage.questionSets.map((questionSet, index) => {
                const isActive = index === activeSetIndex;
                const isLocked = !questionSet.unlocked;
                const NodeIcon = questionSet.completed ? Check : isLocked ? LockKeyhole : index === selectedPackage.questionSets.length - 1 ? Trophy : [Flag, Landmark, Shield, Swords][index % 4];
                return <article className={`journey-stop ${index % 2 === 0 ? "stop-left" : "stop-right"} ${questionSet.completed ? "stop-complete" : ""} ${isActive ? "stop-active" : ""} ${isLocked ? "stop-locked" : ""}`} key={questionSet._id}>
                  <button className="journey-node" onClick={() => startQuestionSet(questionSet)} disabled={busy || isLocked || questionSet.questionCount === 0} aria-label={`${questionSet.completed ? "Ôn tập lại" : isLocked ? "Đã khóa" : "Bắt đầu"}: ${questionSet.name}`}>
                    <NodeIcon size={20} />
                    {questionSet.completed && <span className="node-check"><Check size={10} /></span>}
                  </button>
                  <div className="journey-stop-card">
                    <span className="journey-stop-kicker">BỘ {String(index + 1).padStart(2, "0")} · {getDifficultyLabel(questionSet.difficulty).toLocaleUpperCase("vi-VN")}</span>
                    <h3>{questionSet.name}</h3>
                    <p>{questionSet.description || "Ôn tập kiến thức và củng cố các dấu mốc lịch sử."}</p>
                    <div className="journey-stop-meta"><span><BookOpen size={11} /> {questionSet.questionCount} câu</span>{questionSet.timeLimit > 0 && <span><Clock3 size={11} /> {questionSet.timeLimit} phút</span>}</div>
                    <span className="journey-stop-state">{questionSet.completed ? <><CheckCircle2 size={11} /> Đã hoàn thành</> : isActive ? <><Sparkles size={11} /> Chặng hiện tại</> : isLocked ? <><LockKeyhole size={11} /> Hoàn thành chặng trước để mở khóa</> : null}</span>
                    {!isLocked && questionSet.questionCount > 0 && <button className="journey-stop-action" onClick={() => startQuestionSet(questionSet)} disabled={busy}>{busy ? "Đang tải..." : questionSet.completed ? "Ôn tập lại" : "Vào thử thách"} <ArrowRight size={13} /></button>}
                  </div>
                </article>;
              })}
              <div className={`journey-finish ${completedSets === selectedPackage.questionSetCount ? "journey-finish-done" : ""}`}><span><Trophy size={21} /></span><strong>{completedSets === selectedPackage.questionSetCount ? "Hành trình hoàn tất!" : "Đích đến hành trình"}</strong><small>{completedSets === selectedPackage.questionSetCount ? "Em đã chinh phục tất cả các chặng." : "Hoàn thành mọi bộ câu hỏi để chinh phục gói này."}</small></div>
            </div> : <div className="packages-empty"><span className="packages-empty-icon"><BookOpen size={21} /></span><strong>Gói này chưa có bộ câu hỏi</strong><span>Các chặng hành trình sẽ xuất hiện khi có bộ câu hỏi.</span></div>}
          </section>
          <aside className="journey-sidebar">
            <section className="journey-side-panel">
              <div className="journey-side-heading"><h2><CheckCircle2 size={14} /> Tiến độ chiến dịch</h2><span>{completedSets}/{selectedPackage.questionSetCount}</span></div>
              <div className="journey-side-track"><i style={{ width: `${completionPercent}%` }} /></div>
              <p>{completedSets === selectedPackage.questionSetCount && selectedPackage.questionSetCount > 0 ? "Đã hoàn thành toàn bộ hành trình!" : `${selectedPackage.questionSetCount - completedSets} chặng nữa để hoàn thành gói.`}</p>
            </section>
            <section className="journey-side-panel">
              <div className="journey-side-heading"><h2><Medal size={14} /> Dấu mốc của em</h2><span>{completedSets} đã đạt</span></div>
              {selectedPackage.questionSets.filter((questionSet) => questionSet.completed).length ? <ul className="journey-achievement-list">{selectedPackage.questionSets.filter((questionSet) => questionSet.completed).map((questionSet, index) => <li key={questionSet._id}><span><Check size={12} /></span><div><strong>{questionSet.name}</strong><small>Đã hoàn thành · Chặng {index + 1}</small></div></li>)}</ul> : <p>Hoàn thành chặng đầu tiên để mở khóa dấu mốc học tập.</p>}
            </section>
            {selectedPackage.description && <section className="journey-side-panel journey-reference-panel"><div className="journey-side-heading"><h2><BookOpen size={14} /> Tư liệu hành trình</h2></div><span>{selectedPackage.category}</span><p>{selectedPackage.description}</p></section>}
            {packages.filter((item) => item._id !== selectedPackage._id).length > 0 && <section className="journey-side-panel">
              <div className="journey-side-heading"><h2><Flag size={14} /> Khám phá thêm</h2><button onClick={() => onNavigate("/packages")}>Tất cả</button></div>
              <ul className="journey-other-packages">{packages.filter((item) => item._id !== selectedPackage._id).slice(0, 3).map((item) => <li key={item._id}><button onClick={() => onNavigate(`/packages/${encodeURIComponent(item._id)}`)}><span>{item.category}</span><strong>{item.name}</strong><ArrowRight size={12} /></button></li>)}</ul>
            </section>}
          </aside>
        </div>
        <footer className="packages-footer"><a href="/app" onClick={(event) => { event.preventDefault(); onNavigate("/app"); }}>Sử Ký</a><span>© 2026 Sử Ký · Cùng em khám phá lịch sử Việt Nam.</span><a href="/packages" onClick={(event) => { event.preventDefault(); onNavigate("/packages"); }}>Khám phá gói câu hỏi</a></footer>
      </> : <div className="packages-empty"><span className="packages-empty-icon"><Search size={21} /></span><strong>Không tìm thấy gói câu hỏi</strong><span>Gói này có thể đã bị gỡ hoặc chưa được xuất bản.</span><button onClick={() => onNavigate("/packages")}>Về danh sách gói</button></div>}
    </div> : <div className="packages-page">
      <section className="packages-hero">
        <div className="packages-hero-copy">
          <span className="packages-kicker"><Compass size={13} /> HÀNH TRÌNH CHINH PHỤC LỊCH SỬ VIỆT NAM</span>
          <h1>Khám phá gói câu hỏi</h1>
          <p>Chọn gói thử thách theo từng triều đại, chiến dịch và dấu mốc lịch sử. Học sử hào hùng qua những câu hỏi thú vị.</p>
        </div>
        <div className="packages-hero-stats">
          <article><strong>{packages.length}</strong><span>Gói câu hỏi</span></article>
          <article><strong>{questionTotal.toLocaleString("vi-VN")}</strong><span>Câu hỏi ôn tập</span></article>
          <article><strong>{questionSetTotal}</strong><span>Bộ câu hỏi</span></article>
        </div>
      </section>

      <section className="packages-browser" id="packages-list">
        <label className="packages-search">
          <Search size={17} aria-hidden="true" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Tìm kiếm theo tên gói câu hỏi, thời kỳ, nhân vật hoặc chiến dịch lịch sử..." aria-label="Tìm kiếm gói câu hỏi" />
          {query && <button type="button" onClick={() => { setQuery(""); setPage(1); }} aria-label="Xóa nội dung tìm kiếm"><X size={15} /></button>}
        </label>
        <div className="packages-periods" aria-label="Lọc theo thời kỳ">
          <button className={period === "Tất cả thời kỳ" ? "period-chip selected" : "period-chip"} onClick={() => updatePeriod("Tất cả thời kỳ")}>Tất cả thời kỳ</button>
          {periods.map((item) => <button className={period === item ? "period-chip selected" : "period-chip"} key={item} onClick={() => updatePeriod(item)}>{item}</button>)}
        </div>
        <div className="packages-filter-bar">
          <label><span className="sr-only">Lọc tình trạng</span><select value={availability} onChange={(event) => { setAvailability(event.target.value); setPage(1); }}><option value="all">Tất cả gói câu hỏi</option><option value="available">Có câu hỏi</option><option value="empty">Chưa có câu hỏi</option></select></label>
          <label><span className="sr-only">Sắp xếp gói câu hỏi</span><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="default">Sắp xếp: Mặc định</option><option value="question-count">Nhiều câu hỏi nhất</option><option value="title">Tên A–Z</option></select></label>
          <span className="packages-result-count">{loading ? "Đang tải gói câu hỏi..." : `Hiển thị ${filteredPackages.length ? (currentPage - 1) * pageSize + 1 : 0}–${Math.min(currentPage * pageSize, filteredPackages.length)} trong ${filteredPackages.length} gói`}</span>
        </div>

        {loading ? <div className="packages-loading">Đang tải danh sách gói câu hỏi...</div> : error && packages.length === 0 ? <div className="packages-empty"><span className="packages-empty-icon"><Search size={21} /></span><strong>Chưa thể tải danh sách gói câu hỏi</strong><span>{error}</span><button onClick={refreshPackages}>Thử tải lại</button></div> : visiblePackages.length ? <div className="package-grid">{visiblePackages.map((item, index) => {
          const Artwork = artworkIcons[((currentPage - 1) * pageSize + index) % artworkIcons.length];
          return <article className="package-card" key={item._id}>
            <div className={`package-art package-art-${((currentPage - 1) * pageSize + index) % 6}`}>
              <span className="package-art-badge"><Sparkles size={11} /> GÓI ÔN TẬP</span>
              <Artwork size={53} strokeWidth={1.35} aria-hidden="true" />
              <span className="package-art-period">{item.category}</span>
            </div>
            <div className="package-card-content">
              <span className="package-category"><BookOpen size={11} /> {item.category}</span>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <div className="package-meta"><span><BookOpen size={12} /> {item.questionSetCount} bộ · {item.questionCount} câu</span><span><Clock3 size={12} /> {item.estimatedTime ? `${item.estimatedTime} phút` : "Tự chọn"}</span></div>
              <button className="package-action" onClick={() => onNavigate(`/packages/${encodeURIComponent(item._id)}`)}>{item.questionSetCount ? "Xem các bộ câu hỏi" : "Xem chi tiết"} <ArrowRight size={14} /></button>
            </div>
          </article>;
        })}</div> : <div className="packages-empty"><span className="packages-empty-icon"><Search size={21} /></span><strong>Không tìm thấy gói câu hỏi phù hợp</strong><span>Thử đổi từ khóa hoặc bộ lọc để khám phá thêm.</span>{activeFilters && <button onClick={clearFilters}>Xóa bộ lọc</button>}</div>}

        {!loading && filteredPackages.length > 0 && <div className="packages-pagination">
          <span>Trang {currentPage} / {totalPages}</span>
          <div className="pagination-controls">
            <button aria-label="Trang trước" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={15} /></button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button className={currentPage === pageNumber ? "current" : ""} key={pageNumber} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}
            <button aria-label="Trang sau" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight size={15} /></button>
          </div>
          <a href="#packages-list">Về đầu danh sách <ArrowRight size={13} /></a>
        </div>}
      </section>

      <section className="packages-cta">
        <div><span><Medal size={12} /> THỬ THÁCH LỊCH SỬ ĐANG CHỜ EM</span><h2>Sẵn sàng chinh phục gói câu hỏi tiếp theo?</h2><p>Chọn chủ đề yêu thích, rèn luyện kiến thức và lưu lại thành tích của riêng em.</p></div>
        <button onClick={() => onNavigate("/app")}>Về trang cá nhân <ArrowRight size={15} /></button>
      </section>

      <footer className="packages-footer" id="packages-footer"><a href="/app" onClick={(event) => { event.preventDefault(); onNavigate("/app"); }}>Sử Ký</a><span>© 2026 Sử Ký · Cùng em khám phá lịch sử Việt Nam.</span><a href="#packages-list">Khám phá gói câu hỏi</a></footer>
    </div>}
  </main>;
}
