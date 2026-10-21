import { useEffect, useState } from "react";
import {
  Award, BookOpen, Check, CheckCircle2, Clock3, Eye, EyeOff, Flag,
  History, KeyRound, LogOut, Medal, Pencil, ShieldCheck, Sparkles, Trophy, UserRound
} from "lucide-react";
import BrandMark from "../../components/BrandMark.jsx";
import { api } from "../../lib/api.js";
import "./StudyHomePage.css";
import "./ProfilePage.css";

function formatDate(value, options = { day: "numeric", month: "long", year: "numeric" }) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", options).format(new Date(value));
}

function getInitials(name) {
  return name.trim().split(/\s+/).at(-1)?.[0]?.toLocaleUpperCase("vi-VN") || "S";
}

export default function ProfilePage({ user, onUpdateUser, onLogout, onNavigate }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [name, setName] = useState(user.name);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showAllAttempts, setShowAllAttempts] = useState(false);

  useEffect(() => {
    api("/auth/profile")
      .then((result) => {
        setProfile(result);
        setName(result.user.name);
      })
      .catch((loadError) => setPageError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");
    setSavingProfile(true);
    try {
      const result = await api("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name })
      });
      setName(result.user.name);
      onUpdateUser(result.user, result.token);
      setProfile((previous) => previous ? { ...previous, user: result.user } : previous);
      setProfileMessage("Thông tin hồ sơ đã được cập nhật.");
    } catch (saveError) {
      setProfileError(saveError.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    setSavingPassword(true);
    try {
      const result = await api("/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword })
      });
      setPasswordMessage(result.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (saveError) {
      setPasswordError(saveError.message);
    } finally {
      setSavingPassword(false);
    }
  }

  const visibleAttempts = showAllAttempts ? profile?.recentAttempts : profile?.recentAttempts.slice(0, 4);

  return <main className="study-shell profile-shell">
    <header className="study-topbar">
      <a className="study-brand" href="/app" onClick={(event) => { event.preventDefault(); onNavigate("/app"); }} aria-label="Sử Ký, trang chủ"><BrandMark small /><span>Sử Ký<small>ÔN TẬP LỊCH SỬ VIỆT NAM</small></span></a>
      <nav className="study-nav" aria-label="Điều hướng trang">
        <a href="/app" onClick={(event) => { event.preventDefault(); onNavigate("/app"); }}>Trang chủ</a>
        <a href="/packages" onClick={(event) => { event.preventDefault(); onNavigate("/packages"); }}>Khám phá</a>
        <a className="profile-nav-active" href="/profile">Hồ sơ</a>
      </nav>
      <div className="study-user">
        <div className="study-profile"><span className="study-avatar">{getInitials(profile?.user.name || user.name)}</span><span className="study-profile-copy"><strong>{profile?.user.name || user.name}</strong><small>Hồ sơ học tập</small></span></div>
        <button onClick={onLogout}><LogOut size={14} /><span>Đăng xuất</span></button>
      </div>
    </header>

    {pageError && <div className="study-error" role="alert">{pageError}<button onClick={() => setPageError("")}>Đóng</button></div>}
    {loading ? <div className="study-loading">Đang tải hồ sơ học tập...</div> : profile && <div className="profile-page">
      <div className="profile-breadcrumb"><a href="/app" onClick={(event) => { event.preventDefault(); onNavigate("/app"); }}>Trang chủ</a><span>›</span><span>Tài khoản học viên</span><span>›</span><strong>Hồ sơ cá nhân</strong></div>
      <section className="profile-page-heading"><div><span className="study-overline">TÀI KHOẢN HỌC VIÊN</span><h1>Hồ sơ cá nhân</h1><p>Quản lý thông tin tài khoản và theo dõi hành trình học tập lịch sử của em.</p></div><span className="profile-secure-status"><i /> Hồ sơ được bảo mật</span></section>

      <section className="profile-identity-card">
        <div className="profile-portrait">{getInitials(profile.user.name)}<span><ShieldCheck size={12} /></span></div>
        <div className="profile-identity-copy"><h2>{profile.user.name}</h2><span className="profile-role"><Sparkles size={11} /> Học viên Sử Ký</span><p><UserRound size={13} /> {profile.user.email}</p><p><Clock3 size={13} /> Tham gia từ {formatDate(profile.createdAt)}</p></div>
        <a className="identity-action" href="#profile-settings"><Pencil size={13} /> Chỉnh sửa hồ sơ</a>
      </section>

      <section className="profile-stat-grid" aria-label="Thống kê học tập">
        <article className="profile-stat-card"><span className="profile-stat-icon stat-purple"><Sparkles size={17} /></span><span>Tổng câu trả lời đúng</span><strong>{profile.stats.totalScore.toLocaleString("vi-VN")}</strong><small><CheckCircle2 size={11} /> Trên {profile.stats.answeredQuestions.toLocaleString("vi-VN")} câu đã làm</small></article>
        <article className="profile-stat-card"><span className="profile-stat-icon stat-mint"><Flag size={17} /></span><span>Bài ôn tập hoàn thành</span><strong>{profile.stats.completedQuizzes}</strong><small><CheckCircle2 size={11} /> Lượt làm bài đã ghi nhận</small></article>
        <article className="profile-stat-card"><span className="profile-stat-icon stat-blue"><Trophy size={17} /></span><span>Bộ câu hỏi đã hoàn thành</span><strong>{profile.stats.completedSets}<small> / {profile.stats.totalSets}</small></strong><small><Medal size={11} /> Theo tiến độ từng bộ</small></article>
        <article className="profile-stat-card"><span className="profile-stat-icon stat-green"><CheckCircle2 size={17} /></span><span>Tỷ lệ chính xác</span><strong className="accuracy-stat">{profile.stats.accuracy}%</strong><small><BookOpen size={11} /> Dựa trên câu hỏi đã trả lời</small></article>
      </section>

      <div className="profile-dashboard-grid">
        <div className="profile-main-column">
          <section className="profile-panel progress-panel">
            <div className="profile-panel-heading"><div><h2><span><Sparkles size={15} /></span> Tiến trình theo gói học</h2><p>Theo dõi những chặng đường em đang chinh phục.</p></div><span className="panel-count">{profile.packageProgress.length} gói</span></div>
            {profile.packageProgress.length ? <div className="package-progress-list">{profile.packageProgress.map((item, index) => <article className="package-progress-item" key={item.id}>
              <div className="progress-item-top"><div><span>{item.category}</span><strong>{item.name}</strong></div><b>{item.percent}%</b></div>
              <div className="progress-track"><i className={`progress-fill progress-color-${index % 4}`} style={{ width: `${item.percent}%` }} /></div>
              <small>{item.completedSets} / {item.totalSets} bộ câu hỏi hoàn thành</small>
            </article>)}</div> : <div className="profile-no-progress"><BookOpen size={20} /><span>Tiến trình các gói học sẽ xuất hiện sau khi em bắt đầu ôn tập.</span><button onClick={() => onNavigate("/packages")}>Khám phá gói câu hỏi</button></div>}
            {profile.packageProgress.length > 0 && <div className="profile-achievements"><h3><Award size={14} /> Dấu mốc học tập</h3><div className="achievement-grid">{profile.packageProgress.filter((item) => item.percent === 100).slice(0, 3).map((item) => <article key={item.id}><span><Medal size={17} /></span><strong>{item.name}</strong><small>Đã hoàn thành</small></article>)}{!profile.packageProgress.some((item) => item.percent === 100) && <p>Hoàn thành trọn vẹn một gói câu hỏi để mở khóa dấu mốc đầu tiên.</p>}</div></div>}
          </section>

          <section className="profile-panel profile-history-panel">
            <div className="profile-panel-heading"><div><h2><span><History size={15} /></span> Lịch sử làm bài gần đây</h2><p>Xem lại các lần ôn tập của em.</p></div>{profile.recentAttempts.length > 4 && <button className="profile-text-action" onClick={() => setShowAllAttempts((value) => !value)}>{showAllAttempts ? "Thu gọn" : `Xem tất cả (${profile.recentAttempts.length})`}</button>}</div>
            {visibleAttempts?.length ? <div className="profile-attempt-list">{visibleAttempts.map((attempt) => <article className="profile-attempt-row" key={attempt.id}><span className="attempt-check"><Check size={14} /></span><div className="attempt-info"><strong>{attempt.title}</strong><span>{attempt.period} · {formatDate(attempt.completedAt, { day: "2-digit", month: "short" })}</span></div><span className="attempt-score">{attempt.score}<small>/{attempt.totalQuestions}</small></span><span className="attempt-percent">{attempt.totalQuestions ? Math.round(attempt.score / attempt.totalQuestions * 100) : 0}%</span></article>)}</div> : <div className="profile-history-empty"><History size={20} /><span>Chưa có bài làm nào. Bắt đầu một gói câu hỏi để lưu lịch sử tại đây.</span></div>}
          </section>
        </div>

        <aside className="profile-side-column">
          <section className="profile-panel profile-edit-panel" id="profile-settings">
            <div className="profile-panel-heading"><div><h2><span><UserRound size={15} /></span> Thông tin cá nhân</h2><p>Cập nhật tên hiển thị trên hồ sơ.</p></div><span className="privacy-pill"><ShieldCheck size={11} /> Bảo mật</span></div>
            <form className="profile-form" onSubmit={saveProfile}>
              <label htmlFor="profile-name">Họ và tên <span>Bắt buộc</span></label>
              <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required />
              <label htmlFor="profile-email">Địa chỉ Email</label>
              <input id="profile-email" type="email" value={profile.user.email} readOnly />
              <small className="field-note">Email được dùng để đăng nhập và hiện chưa thể thay đổi.</small>
              <label>Vai trò</label>
              <div className="profile-readonly-field">{profile.user.role === "student" ? "Học viên" : profile.user.role === "teacher" ? "Giáo viên" : "Phụ huynh"}</div>
              {profileError && <p className="form-feedback form-error" role="alert">{profileError}</p>}
              {profileMessage && <p className="form-feedback form-success" role="status">{profileMessage}</p>}
              <button className="profile-save-button" type="submit" disabled={savingProfile || name.trim() === profile.user.name}>{savingProfile ? "Đang lưu..." : <><Check size={14} /> Lưu thay đổi</>}</button>
            </form>
          </section>

          <section className="profile-panel password-panel">
            <div className="profile-panel-heading"><div><h2><span><KeyRound size={15} /></span> Đổi mật khẩu an toàn</h2><p>Giữ tài khoản học tập luôn được bảo vệ.</p></div><span className="password-security-pill">Mã hóa an toàn</span></div>
            <form className="profile-form" onSubmit={savePassword}>
              <label htmlFor="current-password">Mật khẩu hiện tại</label>
              <div className="password-input-wrap"><input id="current-password" type={showPasswords ? "text" : "password"} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required /><button type="button" onClick={() => setShowPasswords((value) => !value)} aria-label={showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}</button></div>
              <label htmlFor="new-password">Mật khẩu mới</label>
              <div className="password-input-wrap"><input id="new-password" type={showPasswords ? "text" : "password"} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} maxLength={128} autoComplete="new-password" placeholder="Ít nhất 8 ký tự" required /><button type="button" onClick={() => setShowPasswords((value) => !value)} aria-label={showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}</button></div>
              <div className="password-strength"><i className={newPassword.length >= 8 ? "strength-active" : ""} /><i className={newPassword.length >= 12 ? "strength-active" : ""} /><i className={newPassword.length >= 16 ? "strength-active" : ""} /><span>{newPassword.length >= 16 ? "Mật khẩu mạnh" : newPassword.length >= 8 ? "Đạt yêu cầu" : "Tối thiểu 8 ký tự"}</span></div>
              <label htmlFor="confirm-password">Xác nhận mật khẩu mới</label>
              <div className="password-input-wrap"><input id="confirm-password" type={showPasswords ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required /><button type="button" onClick={() => setShowPasswords((value) => !value)} aria-label={showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}</button></div>
              {passwordError && <p className="form-feedback form-error" role="alert">{passwordError}</p>}
              {passwordMessage && <p className="form-feedback form-success" role="status">{passwordMessage}</p>}
              <button className="profile-save-button password-save-button" type="submit" disabled={savingPassword}>{savingPassword ? "Đang cập nhật..." : <><KeyRound size={14} /> Cập nhật mật khẩu</>}</button>
              <p className="password-note"><ShieldCheck size={13} /> Mật khẩu được mã hóa an toàn. Không chia sẻ mật khẩu với người khác.</p>
            </form>
          </section>
        </aside>
      </div>
      <footer className="profile-footer"><a href="/app" onClick={(event) => { event.preventDefault(); onNavigate("/app"); }}>Sử Ký</a><span>© 2026 Sử Ký · Cùng em khám phá lịch sử Việt Nam.</span><a href="/packages" onClick={(event) => { event.preventDefault(); onNavigate("/packages"); }}>Khám phá gói học</a></footer>
    </div>}
  </main>;
}
