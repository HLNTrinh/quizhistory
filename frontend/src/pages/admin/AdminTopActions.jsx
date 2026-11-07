// src/pages/admin/AdminTopActions.jsx
// Thanh tác vụ trên cùng của console quản trị: ô tìm kiếm + nút phụ + chuông + avatar/menu tài khoản.
// Dùng chung cho mọi trang admin để giao diện đồng nhất.
import { useEffect, useRef, useState } from "react";
import { Bell, LogOut, Search } from "lucide-react";
import { buildInitials } from "./AdminConsoleLayout.jsx";

export default function AdminTopActions({
  admin,
  onLogout,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Tìm người dùng, gói, bộ đề...",
  searchLabel = "Tìm kiếm trong trang quản trị",
  unreadCount = 0,
  onBellClick,
  extraAction = null
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const searchRef = useRef(null);
  const accountRef = useRef(null);

  useEffect(() => {
    if (!accountOpen) return undefined;
    function handleOutside(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false);
    }
    window.addEventListener("mousedown", handleOutside);
    return () => window.removeEventListener("mousedown", handleOutside);
  }, [accountOpen]);

  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") setAccountOpen(false);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <label className="adm-search">
        <Search size={15} aria-hidden="true" />
        <input
          ref={searchRef}
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchLabel}
        />
        <kbd>Ctrl K</kbd>
      </label>

      {extraAction}

      <button
        type="button"
        className="adm-icon-btn"
        onClick={onBellClick}
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo, đã đọc hết"}
      >
        <Bell size={17} />
        {unreadCount > 0 ? <span className="adm-icon-badge">{unreadCount}</span> : null}
      </button>

      <div className="adm-account" ref={accountRef}>
        <button
          type="button"
          className="adm-account-btn"
          onClick={() => setAccountOpen((current) => !current)}
          aria-haspopup="menu"
          aria-expanded={accountOpen}
          aria-label="Mở menu tài khoản quản trị"
        >
          <span className="adm-user-avatar" aria-hidden="true">{buildInitials(admin?.name)}</span>
        </button>

        {accountOpen ? (
          <div className="adm-account-menu" role="menu">
            <div className="adm-account-head">
              <span className="adm-user-avatar" aria-hidden="true">{buildInitials(admin?.name)}</span>
              <span className="adm-account-info">
                <strong>{admin?.name || "Quản trị viên"}</strong>
                <small>{admin?.email || "admin@truong.edu.vn"}</small>
              </span>
            </div>
            <button
              type="button"
              className="adm-account-logout"
              role="menuitem"
              onClick={() => {
                setAccountOpen(false);
                onLogout?.();
              }}
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
