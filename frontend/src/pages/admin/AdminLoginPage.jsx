import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, ShieldEllipsis } from "lucide-react";
import BrandMark from "../../components/BrandMark.jsx";
import { adminApi, saveAdminToken } from "../../lib/api.js";
import "./AdminPages.css";

export default function AdminLoginPage({ onAuthenticated, onExit }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await adminApi("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      saveAdminToken(result.token, remember);
      onAuthenticated(result.user);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-auth">
      <section className="admin-auth-panel">
        <div className="admin-auth-brand">
          <span className="admin-auth-logo"><BrandMark small /></span>
          <div>
            <strong>Sử Ký</strong>
            <span>Trang quản trị hệ thống</span>
          </div>
        </div>

        <div className="admin-auth-copy">
          <span className="admin-auth-kicker"><ShieldCheck size={13} /> KHU VỰC QUẢN TRỊ</span>
          <h1>Đăng nhập dành cho quản trị viên</h1>
          <p>
            Chỉ tài khoản có vai trò <strong>admin</strong> trong cơ sở dữ liệu mới truy cập được khu vực này.
            Tài khoản học sinh thông thường sẽ bị từ chối ngay cả khi thông tin đăng nhập đúng.
          </p>
          <ul className="admin-auth-notes">
            <li><ShieldEllipsis size={14} /> Phiên quản trị dùng chìa khóa riêng, tách biệt với phiên học tập.</li>
            <li><ShieldEllipsis size={14} /> Phiên tự hết hạn sau vài giờ, cần đăng nhập lại.</li>
            <li><ShieldEllipsis size={14} /> Mọi thao tác đều được kiểm tra quyền ở phía máy chủ.</li>
          </ul>
        </div>

        <button type="button" className="admin-auth-back" onClick={onExit}>
          <ArrowLeft size={14} /> Về cổng học tập
        </button>
      </section>

      <section className="admin-auth-form-wrap">
        <div className="admin-auth-card">
          <h2>Đăng nhập quản trị</h2>
          <p className="admin-auth-sub">Nhập email và mật khẩu của tài khoản quản trị.</p>

          <form onSubmit={submit}>
            <label htmlFor="admin-email">Email quản trị</label>
            <div className="admin-input">
              <Mail size={17} />
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@truong.edu.vn"
                required
              />
            </div>

            <label htmlFor="admin-password">Mật khẩu</label>
            <div className="admin-input">
              <LockKeyhole size={17} />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nhập mật khẩu quản trị"
                required
              />
              <button
                type="button"
                className="admin-eye"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <label className="admin-check">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              Giữ phiên đăng nhập trên thiết bị này
            </label>

            {error && <p className="admin-error" role="alert">{error}</p>}

            <button className="admin-submit" type="submit" disabled={busy}>
              {busy ? "Đang kiểm tra..." : "Đăng nhập quản trị"}
            </button>
          </form>

          <p className="admin-foot-note">
            <ShieldCheck size={13} /> Không chia sẻ đường dẫn này cho học sinh.
          </p>
        </div>
      </section>
    </main>
  );
}
