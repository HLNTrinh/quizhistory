import React, { useState } from 'react';
import './AdminLogin.css';
import { saveAdminSession } from '../../lib/adminSession.js';
import { 
  FiAtSign, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiLogIn, 
  FiArrowLeft, 
  FiLifeBuoy, 
  FiCheckCircle 
} from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa6';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';

function AdminLogin({ onSuccess, onBackToStudent }) {
  // Mock data as required
  const mockData = [
    {
      defaultEmail: 'admin@historyquest.edu.vn',
      systemName: 'History Quest',
      platformSub: 'Platform Core',
      portalTitle: 'CỔNG QUẢN TRỊ VIÊN',
      uptimeRate: '99.98% Uptime'
    }
  ];

  const [email, setEmail] = useState(mockData[0].defaultEmail);
  const [password, setPassword] = useState('••••••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setIsSuccess(false);
      setStatusMessage('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    saveAdminSession(
      {
        email,
        name: 'Quản trị viên',
        role: 'admin',
        loggedInAt: new Date().toISOString(),
      },
      rememberMe
    );

    setIsSuccess(true);
    setStatusMessage('Đăng nhập thành công! Đang chuyển hướng vào hệ thống...');

    window.setTimeout(() => {
      onSuccess?.();
    }, 600);
  };

  const goToStudentPortal = (event) => {
    event.preventDefault();
    onBackToStudent?.();
  };

  return (
    <div className="admin-login-wrapper">
      {/* Top Header Navigation */}
      <header className="admin-header">
        <div className="admin-header-left">
          {/* Brand Logo */}
          <a href="/" className="admin-brand-link" onClick={goToStudentPortal}>
            <div className="admin-brand-icon-box">
              <FaGraduationCap />
            </div>
            <div className="admin-brand-info">
              <span className="admin-brand-title">{mockData[0].systemName}</span>
              <span className="admin-brand-badge">{mockData[0].platformSub}</span>
            </div>
          </a>

          {/* Gateway Badge */}
          <div className="admin-gateway-badge">
            <span className="admin-pulse-dot"></span>
            {mockData[0].portalTitle}
          </div>
        </div>

        {/* Right Utility Status */}
        <div className="admin-header-right">
          <div className="admin-system-uptime">
            <span className="admin-uptime-dot"></span>
            <span>
              Hệ thống ổn định: <strong className="admin-uptime-bold">{mockData[0].uptimeRate}</strong>
            </span>
          </div>

          <div className="admin-support-info">
            <FiLifeBuoy />
            <span>Hỗ trợ kỹ thuật 24/7</span>
          </div>

          <a href="/" className="admin-student-portal-btn" onClick={goToStudentPortal}>
            <FiArrowLeft />
            <span>Cổng học viên</span>
          </a>
        </div>
      </header>

      {/* Main Centered Login Section */}
      <main className="admin-main-content">
        {/* Subtle Ambient Background Glow */}
        <div className="admin-ambient-glow"></div>

        {/* Login Card */}
        <div className="admin-login-card">
          {/* Decorative Top Highlight Bar */}
          <div className="admin-card-top-accent"></div>

          {/* Icon & Title Header */}
          <div className="admin-card-header">
            <div className="admin-card-icon-wrapper">
              <HiOutlineBuildingOffice2 />
            </div>

            <div className="admin-card-pill-tag">
              <span className="admin-pill-text">• {mockData[0].portalTitle} •</span>
            </div>

            <h1 className="admin-card-title">Đăng nhập Quản trị viên</h1>
            <p className="admin-card-desc">Hệ thống quản trị nội dung {mockData[0].systemName}</p>
          </div>

          {/* Feedback Message */}
          {statusMessage && (
            <div className={`admin-feedback-msg ${isSuccess ? 'success' : 'error'}`}>
              <FiCheckCircle />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="admin-form" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="admin-email-input">
                Email / Tài khoản quản trị <span className="admin-required">*</span>
              </label>
              <div className="admin-input-wrapper">
                <span className="admin-input-icon-left">
                  <FiAtSign />
                </span>
                <input
                  id="admin-email-input"
                  type="email"
                  className="admin-input-field"
                  placeholder="Nhập email tài khoản"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="admin-form-group">
              <div className="admin-label-row">
                <label className="admin-label" htmlFor="admin-password-input">
                  Mật khẩu <span className="admin-required">*</span>
                </label>
                <a href="#forgot-password" className="admin-forgot-password-link">
                  Quên mật khẩu?
                </a>
              </div>
              <div className="admin-input-wrapper">
                <span className="admin-input-icon-left">
                  <FiLock />
                </span>
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  className="admin-input-field has-eye"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="admin-eye-toggle-btn"
                  onClick={handleTogglePassword}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="admin-checkbox-row">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  className="admin-checkbox-input"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Ghi nhớ đăng nhập (8 giờ)</span>
              </label>
            </div>

            {/* Submit Button */}
            <button type="submit" className="admin-submit-btn">
              <FiLogIn className="admin-submit-icon" />
              <span>Đăng nhập</span>
            </button>
          </form>

          {/* Card Footer / Back Link */}
          <div className="admin-card-footer">
            <a href="/" className="admin-back-link" onClick={goToStudentPortal}>
              <FiArrowLeft />
              <span>Quay lại Cổng học viên</span>
            </a>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="admin-footer">
        © 2026 History Quest. Nền tảng học Lịch sử Việt Nam tương tác hàng đầu.
      </footer>
    </div>
  );
}

export default AdminLogin;
