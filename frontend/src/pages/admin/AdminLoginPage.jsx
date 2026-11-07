import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Headset,
  KeyRound,
  Loader2,
  LogIn,
  ShieldCheck,
  UserCheck,
  X
} from "lucide-react";
import BrandMark from "../../components/BrandMark.jsx";
import { adminApi, saveAdminToken } from "../../lib/api.js";
import "./AdminLoginPage.css";

export default function AdminLoginPage({ onAuthenticated, onExit }) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");

  // Handle ESC key to dismiss any open accessible dialogs
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        if (isForgotModalOpen) setIsForgotModalOpen(false);
        if (isSupportModalOpen) setIsSupportModalOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isForgotModalOpen, isSupportModalOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!account.trim()) {
      setErrorMessage("Vui lòng nhập email quản trị viên.");
      return;
    }

    if (!password) {
      setErrorMessage("Vui lòng nhập mật khẩu tài khoản quản trị.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await adminApi("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: account.trim(), password })
      });
      saveAdminToken(result.token, rememberMe);
      onAuthenticated(result.user);
    } catch (submitError) {
      setErrorMessage(submitError.message || "Không đăng nhập được. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = (event) => {
    event.preventDefault();
    if (!forgotEmail.trim()) return;

    // TODO(api): backend chưa có endpoint khôi phục mật khẩu quản trị
    setResetSuccessMessage(
      `Đã ghi nhận yêu cầu cho ${forgotEmail.trim()}. Chức năng gửi email khôi phục chưa được bật, vui lòng liên hệ quản trị viên cấp cao để được cấp lại mật khẩu.`
    );
  };

  return (
    <div className="admin-login-wrapper">
      {/* Header / Top Navigation for Admin Gateway */}
      <header className="admin-login-header">
        <div className="admin-login-header-inner">
          {/* Brand & Admin Badge */}
          <div className="admin-login-brand-group">
            <button
              type="button"
              className="admin-login-brand-link"
              onClick={onExit}
              aria-label="Về cổng học tập Sử Ký"
            >
              <div className="admin-login-brand-icon">
                <BrandMark small />
              </div>
              <div className="admin-login-brand-text">
                <span className="admin-login-brand-title">Sử Ký</span>
                <span className="admin-login-brand-sub">TRANG QUẢN TRỊ HỆ THỐNG</span>
              </div>
            </button>

            <div className="admin-login-divider" aria-hidden="true" />

            <div className="admin-login-badge">
              <ShieldCheck size={14} />
              <span>CỔNG QUẢN TRỊ VIÊN</span>
            </div>
          </div>

          {/* Secondary Navigation & Status */}
          <div className="admin-login-header-actions">
            <div className="admin-login-uptime-chip">
              <span className="admin-login-pulse-dot" aria-hidden="true">
                <span className="admin-login-pulse-ring" />
                <span className="admin-login-pulse-center" />
              </span>
              <span>Hệ thống ổn định: <strong>99.98% Uptime</strong></span>
            </div>

            <button
              type="button"
              className="admin-login-support-btn"
              onClick={() => setIsSupportModalOpen(true)}
            >
              <Headset size={16} />
              <span>Hỗ trợ kỹ thuật 24/7</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="admin-login-main">
        <div className="admin-login-card-container">
          <div className="admin-login-card">
            {/* Top decorative gradient bar */}
            <div className="admin-login-card-topline" aria-hidden="true" />

            {/* Header section with icon badge */}
            <div className="admin-login-card-header">
              <div className="admin-login-icon-badge">
                <BrandMark small />
              </div>

              <div className="admin-login-card-kicker">
                <ShieldCheck size={13} />
                <span>CỔNG QUẢN TRỊ VIÊN</span>
              </div>

              <h1 className="admin-login-card-title">Đăng nhập Quản trị viên</h1>
    
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="admin-login-alert" role="alert">
                <div className="admin-login-alert-icon">
                  <X size={16} />
                </div>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form className="admin-login-form" onSubmit={handleSubmit} noValidate>
              <div className="admin-login-field">
                <div className="admin-login-field-header">
                  <label className="admin-login-label" htmlFor="admin-account">
                    Email / Tài khoản quản trị
                    <span className="admin-login-label-req" aria-hidden="true">*</span>
                  </label>
                </div>
                <div className="admin-login-input-wrap">
                  <span className="admin-login-input-icon" aria-hidden="true">
                    <UserCheck size={19} />
                  </span>
                  <input
                    id="admin-account"
                    name="adminAccount"
                    type="text"
                    required
                    autoComplete="username"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    placeholder="admin@truong.edu.vn"
                    className={`admin-login-input ${errorMessage ? "is-invalid" : ""}`}
                  />
                </div>
              </div>

              <div className="admin-login-field">
                <div className="admin-login-field-header">
                  <label className="admin-login-label" htmlFor="admin-password">
                    Mật khẩu
                    <span className="admin-login-label-req" aria-hidden="true">*</span>
                  </label>
                  <button
                    type="button"
                    className="admin-login-forgot-link"
                    onClick={() => {
                      setForgotEmail(account);
                      setResetSuccessMessage("");
                      setIsForgotModalOpen(true);
                    }}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="admin-login-input-wrap">
                  <span className="admin-login-input-icon" aria-hidden="true">
                    <KeyRound size={19} />
                  </span>
                  <input
                    id="admin-password"
                    name="adminPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`admin-login-input has-eye ${errorMessage ? "is-invalid" : ""}`}
                  />
                  <button
                    type="button"
                    className="admin-login-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              <div className="admin-login-options">
                <label className="admin-login-checkbox-label">
                  <input
                    type="checkbox"
                    className="admin-login-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Ghi nhớ đăng nhập trên thiết bị này</span>
                </label>
              </div>

              <button
                type="submit"
                className="admin-login-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="admin-login-spinner" />
                    <span>Đang xác thực thông tin...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Đăng nhập</span>
                  </>
                )}
              </button>
            </form>

            {/* Back to student portal */}
            <div className="admin-login-back-wrap">
              <button
                type="button"
                className="admin-login-back-btn"
                onClick={onExit}
              >
                <ArrowLeft size={15} />
                <span>Quay lại Cổng học tập</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Standard Admin Footer */}
      <footer className="admin-login-footer">
        <div className="admin-login-footer-inner">
          <div className="admin-login-footer-copy">
            <span className="admin-login-footer-dot" aria-hidden="true" />
            <span>
              © 2026 Sử Ký · Nền tảng ôn tập Lịch sử Việt Nam · Cổng quản trị hệ thống.
            </span>
          </div>

          <div className="admin-login-footer-links">
            <button
              type="button"
              className="admin-login-footer-link"
              onClick={() => setIsSupportModalOpen(true)}
            >
              Quy chế bảo mật quản trị
            </button>
            <button
              type="button"
              className="admin-login-footer-link"
              onClick={() => setIsSupportModalOpen(true)}
            >
              Chính sách kiểm toán dữ liệu
            </button>
            <button
              type="button"
              className="admin-login-footer-link"
              onClick={() => setIsSupportModalOpen(true)}
            >
              Hỗ trợ kỹ thuật
            </button>
          </div>
        </div>
      </footer>

      {/* Accessible Forgot Password Modal */}
      {isForgotModalOpen && (
        <div
          className="admin-login-modal-overlay"
          onClick={() => setIsForgotModalOpen(false)}
          role="presentation"
        >
          <div
            className="admin-login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-login-modal-head">
              <h2 id="forgot-modal-title">Khôi phục mật khẩu quản trị</h2>
              <button
                type="button"
                className="admin-login-modal-close"
                onClick={() => setIsForgotModalOpen(false)}
                aria-label="Đóng cửa sổ"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleForgotSubmit}>
              <div className="admin-login-modal-body">
                {resetSuccessMessage ? (
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", color: "#0f9d68" }}>
                    <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <p>{resetSuccessMessage}</p>
                  </div>
                ) : (
                  <>
                    <p style={{ marginBottom: "14px" }}>
                      Nhập địa chỉ email quản trị viên đã được cấp phép. Chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu bảo mật qua hệ thống xác thực 2 lớp.
                    </p>
                    <div className="admin-login-field">
                      <label className="admin-login-label" htmlFor="forgot-email">
                        Email quản trị viên
                      </label>
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="admin@truong.edu.vn"
                        className="admin-login-input"
                        style={{ paddingLeft: "14px" }}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="admin-login-modal-foot">
                <button
                  type="button"
                  className="admin-login-portal-btn"
                  onClick={() => setIsForgotModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                {!resetSuccessMessage && (
                  <button type="submit" className="admin-login-submit-btn" style={{ width: "auto", margin: 0 }}>
                    Gửi yêu cầu khôi phục
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accessible Support Modal */}
      {isSupportModalOpen && (
        <div
          className="admin-login-modal-overlay"
          onClick={() => setIsSupportModalOpen(false)}
          role="presentation"
        >
          <div
            className="admin-login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-login-modal-head">
              <h2 id="support-modal-title">Trung tâm Hỗ trợ Kỹ thuật 24/7</h2>
              <button
                type="button"
                className="admin-login-modal-close"
                onClick={() => setIsSupportModalOpen(false)}
                aria-label="Đóng cửa sổ"
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-login-modal-body">
              <p style={{ marginBottom: "12px" }}>
                Nếu bạn gặp sự cố khi đăng nhập hoặc cần cấp quyền quản trị mới cho cán bộ chuyên môn:
              </p>
              <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li>Hotline kỹ thuật: <strong>1900 8899 (Nhánh 2 - Quản trị)</strong></li>
                <li>Email trực ban: <strong>admin@truong.edu.vn</strong></li>
                <li>Thời gian phản hồi SLA: <strong>Dưới 15 phút</strong> đối với sự cố cổng quản trị</li>
              </ul>
            </div>

            <div className="admin-login-modal-foot">
              <button
                type="button"
                className="admin-login-submit-btn"
                style={{ width: "auto", margin: 0 }}
                onClick={() => setIsSupportModalOpen(false)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
