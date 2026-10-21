import { useState } from "react";
import {
  ArrowRight, BookOpen, Check, CheckCircle2, Eye, EyeOff, Flame, GraduationCap,
  LockKeyhole, Mail, Medal, ShieldCheck, Sparkles, Star, Swords, TrendingUp, UserRound
} from "lucide-react";
import BrandMark from "../../components/BrandMark.jsx";
import { api } from "../../lib/api.js";
import "./LoginPage.css";

const milestones = [
  { year: "1930", label: "Đảng ra đời" },
  { year: "1945", label: "Cách mạng tháng Tám" },
  { year: "1954", label: "Điện Biên Phủ" },
  { year: "1975", label: "Đại thắng mùa Xuân" }
];

export default function LoginPage({ onLogin, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [activeYear, setActiveYear] = useState("1975");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const payload = mode === "register" ? { name, email, password } : { email, password };
      const result = await api(endpoint, { method: "POST", body: JSON.stringify(payload) });
      const storage = remember ? localStorage : sessionStorage;
      const otherStorage = remember ? sessionStorage : localStorage;
      otherStorage.removeItem("quizhistory-token");
      storage.setItem("quizhistory-token", result.token);
      onLogin(result.user);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  const isRegister = mode === "register";
  const activeMilestone = milestones.find((milestone) => milestone.year === activeYear);

  return (
    <main className={`hq ${isRegister ? "hq-register" : ""}`}>
      <section className="hq-left" aria-label="Giới thiệu Sử Ký">
        <div className="hq-brand">
          <div className="hq-logo"><BrandMark small /></div>
          <div><h1>Sử Ký <span className="hq-season">HỌC SỬ MỖI NGÀY</span></h1><p>Chạm vào dòng chảy lịch sử Việt Nam</p></div>
        </div>
        <div className="hq-pill"><Flame size={18} /> Ôn tập Lịch sử Việt Nam theo dấu mốc</div>
        <h2 className="hq-title">Khám phá ngàn năm<br /><span>hào khí Việt</span> qua từng câu hỏi.</h2>
        <p className="hq-desc">Ôn lại sự kiện, nhân vật và bước ngoặt lịch sử; luyện tập theo từng chủ đề và xem giải thích sau mỗi bài.</p>
        <div className="hq-section-label"><TrendingUp size={15} /> CHIẾN DỊCH KHAI PHÁ THỜI GIAN</div>
        <div className="hq-timeline" aria-label="Các dấu mốc lịch sử">
          {milestones.map((milestone) => <button key={milestone.year} type="button" className={`hq-milestone ${activeYear === milestone.year ? "is-active" : ""}`} aria-pressed={activeYear === milestone.year} onClick={() => setActiveYear(milestone.year)}><b>{milestone.year}</b><span>{milestone.label}</span></button>)}
        </div>
        <p className="hq-milestone-note"><Sparkles size={14} /> Đang xem: <strong>{activeMilestone.year} · {activeMilestone.label}</strong></p>
        <div className="hq-features">
          <article className="hq-card"><span className="hq-card-icon gold"><Medal size={21} /></span><div><h3>Ôn tập theo chủ đề</h3><p>Đi qua từng giai đoạn với câu hỏi ngắn gọn, rõ ràng.</p></div></article>
          <article className="hq-card"><span className="hq-card-icon"><Swords size={21} /></span><div><h3>Luyện tập chủ động</h3><p>Xem kết quả và lời giải sau mỗi bài làm.</p></div></article>
        </div>
        <div className="hq-testimonial">
          <div className="hq-avatar"><GraduationCap size={24} /><i><Check size={12} /></i></div>
          <div className="who"><strong>Mỗi bài làm là một bước tiến.</strong><br />Lịch sử ôn tập được lưu riêng theo tài khoản.</div>
          <div className="hq-score"><Star size={20} /></div>
        </div>
      </section>
      <section className="hq-right" aria-label="Tài khoản">
        <div className="hq-form-card">
          <div className="hq-form-head"><div className="hq-form-logo"><BrandMark /></div><span className="hq-portal"><ShieldCheck size={16} /> CỔNG HỌC TẬP</span></div>
          <h4>{isRegister ? "Tạo tài khoản" : "Chào mừng bạn trở lại"}</h4>
          <p className="hq-sub">{isRegister ? "Bắt đầu hành trình khám phá lịch sử Việt Nam." : "Đăng nhập để tiếp tục hành trình khám phá lịch sử."}</p>
          <form onSubmit={submit}>
            {isRegister && <div className="hq-field"><label htmlFor="full-name">Họ và tên</label><div className="hq-input"><UserRound size={19} /><input id="full-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nguyễn Minh Anh" minLength={2} maxLength={80} required /></div></div>}
            <div className="hq-field"><div className="hq-label-row"><label htmlFor="email">Email</label>{!isRegister && <button type="button" className="hq-link hq-link-button" onClick={() => setNotice("Vui lòng liên hệ giáo viên để được hỗ trợ đặt lại mật khẩu.")}>Quên mật khẩu?</button>}</div><div className="hq-input"><Mail size={19} /><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ten@email.com" required /></div></div>
            <div className="hq-field"><label htmlFor="password">Mật khẩu</label><div className="hq-input"><LockKeyhole size={19} /><input id="password" type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isRegister ? "Ít nhất 8 ký tự" : "Nhập mật khẩu"} minLength={isRegister ? 8 : undefined} required /><button className="hq-eye" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
            {!isRegister && <div className="hq-remember"><label className="hq-check"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Ghi nhớ đăng nhập</label><span className="hq-ssl"><ShieldCheck size={15} /> Bảo mật</span></div>}
            {error && <p className="hq-error" role="alert">{error}</p>}
            {notice && <p className="hq-notice" role="status">{notice}</p>}
            <button className="hq-submit" type="submit" disabled={busy}>{busy ? "Đang xử lý..." : isRegister ? "Tạo tài khoản" : "Đăng nhập"}<ArrowRight size={19} /></button>
          </form>
          <div className="hq-foot">{isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"} <button className="hq-link hq-link-button" onClick={() => changeMode(isRegister ? "login" : "register")}>{isRegister ? "Đăng nhập" : "Tạo tài khoản"}</button></div>
          <div className="hq-legal"><ShieldCheck size={14} /> Thông tin tài khoản được bảo vệ an toàn.</div>
        </div>
      </section>
    </main>
  );
}