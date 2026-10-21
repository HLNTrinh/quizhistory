import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Award, BookOpen, ChevronLeft, ChevronRight,
  Crown, LogOut, Medal, Search, ShieldCheck, Sparkles, Trophy
} from "lucide-react";
import BrandMark from "../../components/BrandMark.jsx";
import { api } from "../../lib/api.js";
import "./StudyHomePage.css";
import "./LeaderboardPage.css";

function getInitials(name = "") {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toLocaleUpperCase("vi-VN") || "S";
}

function formatScore(score) {
  return Number(score || 0).toLocaleString("vi-VN");
}

export default function LeaderboardPage({ user, onLogout, onNavigate }) {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const initial = getInitials(user.name);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: String(page) });
      if (search.trim()) params.set("search", search.trim());
      api(`/leaderboard?${params}`, { signal: controller.signal })
        .then(setData)
        .catch((loadError) => {
          if (loadError.name !== "AbortError") setError(loadError.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, search ? 250 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, search]);

  const podium = useMemo(() => {
    const rankings = data?.podium || [];
    return [rankings[1], rankings[0], rankings[2]].filter(Boolean);
  }, [data]);
  const pageCount = Math.max(1, data?.totalPages || 1);
  const currentRank = data?.currentUser?.rank;
  const currentUserOnPage = data?.entries?.some((entry) => entry.userId === data.currentUser?.userId);

  return <main className="study-shell leaderboard-shell">
    <header className="study-topbar">
      <a className="study-brand" href="/app" onClick={(event) => { event.preventDefault(); onNavigate("/app"); }} aria-label="Sử Ký, trang chủ"><BrandMark small /><span>Sử Ký<small>ÔN TẬP LỊCH SỬ VIỆT NAM</small></span></a>
      <nav className="study-nav" aria-label="Điều hướng trang">
        <a href="/app" onClick={(event) => { event.preventDefault(); onNavigate("/app"); }}>Hành trình</a>
        <a href="/packages" onClick={(event) => { event.preventDefault(); onNavigate("/packages"); }}>Khám phá</a>
        <a className="study-nav-active" href="/leaderboard" onClick={(event) => { event.preventDefault(); onNavigate("/leaderboard"); }}><Trophy size={13} /> Bảng xếp hạng</a>
        <a href="/profile" onClick={(event) => { event.preventDefault(); onNavigate("/profile"); }}>Hồ sơ</a>
      </nav>
      <div className="study-user">
        <div className="study-profile"><span className="study-avatar">{initial}</span><span className="study-profile-copy"><strong>{user.name}</strong><small>Hồ sơ học tập</small></span></div>
        <button onClick={onLogout}><LogOut size={14} /><span>Đăng xuất</span></button>
      </div>
    </header>

    {error && <div className="study-error" role="alert">{error}<button onClick={() => setError("")}>Đóng</button></div>}
    <div className="leaderboard-page">
      <section className="leaderboard-hero">
        <div>
          <span className="leaderboard-kicker"><Sparkles size={11} /> THÀNH TÍCH HỌC TẬP</span>
          <h1>Bảng xếp hạng Sử học</h1>
          <p>Vinh danh những người kiên trì giải mã lịch sử hào hùng, tích lũy điểm kinh nghiệm và chinh phục các chiến dịch vì dân tộc.</p>
        </div>
        <aside className="leaderboard-position">
          <span className="position-icon"><Medal size={18} /></span>
          <span><small>VỊ TRÍ CỦA BẠN</small><strong>{currentRank ? `Hạng #${currentRank}` : "Chưa xếp hạng"}</strong><em>{currentRank ? `Đang đứng thứ ${currentRank} trên bảng xếp hạng` : "Hoàn thành bài ôn tập để ghi tên lên bảng."}</em></span>
        </aside>
      </section>

      <section className="leaderboard-podium-section">
        <div className="leaderboard-section-heading"><span><Award size={16} /> Bục vinh danh Tam Kiệt</span><small>Top 3 thành tích dẫn đầu điểm số mùa hiện tại</small></div>
        {podium.length ? <div className="leaderboard-podium">
          {podium.map((entry) => <article className={`podium-card podium-rank-${entry.rank}`} key={entry.userId}>
            <span className="podium-rank-label">{entry.rank === 1 ? <Crown size={11} /> : <Medal size={11} />} Hạng {entry.rank} · {entry.rank === 1 ? "Quán quân Sử học" : "Á quân Sử học"}</span>
            <span className={`podium-avatar podium-avatar-${entry.rank}`}>{getInitials(entry.name)}{entry.rank === 1 && <i>1</i>}</span>
            <strong className="podium-name">{entry.name}</strong>
            <small className="podium-school">Học viên Sử Ký</small>
            <span className="podium-score">{formatScore(entry.totalScore)} <small>điểm</small></span>
            <span className="podium-stats">Hoàn thành {entry.completedPackages} gói · {entry.completedSets} bộ</span>
            <span className="podium-badge">{entry.rank === 1 ? <Crown size={10} /> : <Trophy size={10} />} Huy hiệu Quán quân</span>
          </article>)}
        </div> : <div className="leaderboard-podium-empty"><Trophy size={18} /> Bảng xếp hạng sẽ xuất hiện khi có học viên hoàn thành bài ôn tập.</div>}
      </section>

      <section className="leaderboard-table-card">
        <div className="leaderboard-table-heading">
          <div><h2>Toàn bộ bảng anh hùng</h2><p>Đang hiển thị <strong>{data?.total || 0} học viên</strong> xuất sắc nhất toàn hệ thống.</p></div>
          <label className="leaderboard-search"><Search size={14} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Tìm kiếm theo tên..." aria-label="Tìm kiếm học viên" /><kbd>/</kbd></label>
        </div>
        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table">
            <thead><tr><th>Thứ hạng</th><th>Danh Sĩ Sử Học</th><th>Trường / Tỉnh thành</th><th>Gói đã hoàn thành</th><th>Bộ đã hoàn thành</th><th>Tổng điểm</th></tr></thead>
            <tbody>
              {data?.entries?.map((entry) => <tr className={entry.userId === user._id ? "leaderboard-own-row" : ""} key={entry.userId}>
                <td><span className={`rank-number ${entry.rank <= 3 ? `rank-number-${entry.rank}` : ""}`}>#{entry.rank}</span></td>
                <td><span className="leaderboard-person"><span className={`leaderboard-avatar avatar-tone-${entry.rank % 5}`}>{getInitials(entry.name)}</span><span><strong>{entry.name}</strong>{entry.userId === user._id && <small>Bạn · Đang học</small>}</span></span></td>
                <td className="leaderboard-school-cell">Học viên Sử Ký</td>
                <td>{entry.completedPackages} gói</td>
                <td>{entry.completedSets} bộ</td>
                <td className="leaderboard-score-cell">{formatScore(entry.totalScore)} điểm</td>
              </tr>)}
              {!loading && !data?.entries?.length && <tr><td colSpan="6" className="leaderboard-no-results"><Search size={18} /> Không tìm thấy học viên phù hợp.</td></tr>}
              {data?.currentUser && !currentUserOnPage && !search.trim() && <tr className="leaderboard-own-row leaderboard-own-detached">
                <td><span className="rank-number">#{data.currentUser.rank}</span></td>
                <td><span className="leaderboard-person"><span className="leaderboard-avatar avatar-own">{initial}</span><span><strong>{user.name}</strong><small>Bạn · Đang học</small></span></span></td>
                <td className="leaderboard-school-cell">Học viên Sử Ký</td>
                <td>{data.currentUser.completedPackages} gói</td>
                <td>{data.currentUser.completedSets} bộ</td>
                <td className="leaderboard-score-cell">{formatScore(data.currentUser.totalScore)} điểm</td>
              </tr>}
            </tbody>
          </table>
          {loading && <div className="leaderboard-loading">Đang tải bảng xếp hạng...</div>}
        </div>
        <div className="leaderboard-table-footer">
          <span><ShieldCheck size={12} /> Điểm số được tính từ kết quả các bài ôn tập đã hoàn thành.</span>
          <div className="leaderboard-pagination"><span>Trang {data?.total ? page : 0} / {data?.totalPages || 0}</span><button aria-label="Trang trước" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading}><ChevronLeft size={14} /></button><button className="pagination-current" aria-current="page">{page}</button><button aria-label="Trang tiếp theo" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page >= pageCount || loading}><ChevronRight size={14} /></button></div>
        </div>
      </section>

      <section className="leaderboard-cta"><div><span><Sparkles size={11} /> THỬ THÁCH MÙA NÀY</span><h2>Sẵn sàng vươn tầm Đại tướng Sử học?</h2><p>Hoàn thành các gói nhiệm vụ Sử học tiếp theo để ghi thêm thành tích của bạn.</p></div><button onClick={() => onNavigate("/packages")}><BookOpen size={13} /> Tiếp tục chinh phục <ArrowRight size={13} /></button></section>
      <footer className="study-footer"><a className="footer-brand" href="/app" onClick={(event) => { event.preventDefault(); onNavigate("/app"); }}>Sử Ký</a><span>© 2026 Sử Ký · Nền tảng học lịch sử Việt Nam tương tác.</span><button onClick={() => onNavigate("/app")}><ArrowLeft size={11} /> Về hành trình</button></footer>
    </div>
  </main>;
}
