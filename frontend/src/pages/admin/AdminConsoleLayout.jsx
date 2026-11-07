// src/pages/admin/AdminConsoleLayout.jsx
import { useEffect, useState } from "react";
import {
  BookOpenCheck,
  ChevronRight,
  ClipboardList,
  FileBarChart,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Trophy,
  Users,
  X
} from "lucide-react";
import BrandMark from "../../components/BrandMark.jsx";
import "./AdminConsole.css";

const consoleNav = [
  { path: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { path: "/admin/users", label: "Người dùng", icon: Users },
  { path: "/admin/categories", label: "Chủ đề", icon: FolderTree },
  { path: "/admin/packages", label: "Gói câu hỏi", icon: Package, badge: 24 },
  { path: "/admin/question-sets", label: "Bộ câu hỏi", icon: ClipboardList, badge: 186 },
  { path: "/admin/questions", label: "Ngân hàng câu hỏi", icon: BookOpenCheck },
  { path: "/admin/leaderboard", label: "Bảng xếp hạng", icon: Trophy }
  // { path: "/admin/reports", label: "Thống kê", icon: FileBarChart }
];

const consoleFooterLinks = [
  "Điều khoản sử dụng",
  "Chính sách bảo mật",
  "Liên hệ hỗ trợ",
  "Hệ thống nhiệm vụ",
  "Cộng đồng học tập"
];

export function buildInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AD";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function AdminConsoleLayout({
  admin,
  onLogout,
  onNavigate,
  activePath = "/admin",
  breadcrumb,
  topBar = null,
  actions = null,
  onFooterAction,
  children
}) {
  const [navOpen, setNavOpen] = useState(false);
  const activeItem = consoleNav.find((item) => item.path === activePath) || consoleNav[0];
  const adminName = admin?.name || "Quản trị viên";

  useEffect(() => {
    setNavOpen(false);
  }, [activePath]);

  useEffect(() => {
    if (!navOpen) return undefined;
    function handleKey(event) {
      if (event.key === "Escape") setNavOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [navOpen]);

  return (
    <div className="adm-app">
      {topBar}

      {navOpen ? (
        <div className="adm-backdrop" role="presentation" onClick={() => setNavOpen(false)} />
      ) : null}

      <div className="adm-body">
        <aside className={`adm-sidebar${navOpen ? " is-open" : ""}`} aria-label="Điều hướng quản trị">
          <div className="adm-sidebar-brand">
            <span className="adm-logo"><BrandMark small /></span>
            <span className="adm-brand-text">
              <strong>Sử Ký</strong>
              <small>Cổng quản trị</small>
            </span>
            <button type="button" className="adm-nav-close" onClick={() => setNavOpen(false)} aria-label="Đóng menu">
              <X size={18} />
            </button>
          </div>

          <p className="adm-nav-label">Danh mục quản trị</p>

          <nav className="adm-nav">
            {consoleNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === activePath;
              return (
                <button
                  key={item.path}
                  type="button"
                  className={`adm-nav-link${isActive ? " is-active" : ""}`}
                  onClick={() => onNavigate?.(item.path)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                  {item.badge ? <span className="adm-nav-count">{item.badge}</span> : null}
                </button>
              );
            })}
          </nav>

          <div className="adm-sidebar-foot">
            {/* <div className="adm-server-status">
              <span className="adm-server-dot" aria-hidden="true" />
              <span>Máy chủ ổn định</span>
              <b>v2.4</b>
            </div> */}
            <button type="button" className="adm-logout" onClick={onLogout}>
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        </aside>

        <div className="adm-main">
          <header className="adm-main-top">
            <button
              type="button"
              className="adm-menu-btn"
              onClick={() => setNavOpen(true)}
              aria-label="Mở menu quản trị"
              aria-expanded={navOpen}
            >
              <Menu size={18} />
            </button>
            <div className="adm-breadcrumb">
              <ChevronRight size={14} aria-hidden="true" />
              <span>{breadcrumb || activeItem.label}</span>
            </div>
            <div className="adm-top-actions">{actions}</div>
          </header>

          <div className="adm-content">{children}</div>

          <footer className="adm-footer">
            <span className="adm-footer-brand"><BrandMark small /> Sử Ký</span>
            <p>© 2026 Sử Ký. Nền tảng ôn tập Lịch sử Việt Nam tương tác hàng đầu.</p>
            <div className="adm-footer-links">
              {consoleFooterLinks.map((label) => (
                <button key={label} type="button" onClick={() => onFooterAction?.(label)}>
                  {label}
                </button>
              ))}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
