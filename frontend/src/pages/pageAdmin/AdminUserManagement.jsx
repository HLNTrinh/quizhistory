import React, { useState, useMemo } from 'react';
import './AdminUserManagement.css';

// React Icons imports
import {
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiPlus,
  FiEye,
  FiEdit2,
  FiSlash,
  FiUnlock,
  FiTrash2,
  FiBell,
  FiLogOut,
  FiChevronRight,
  FiChevronLeft,
  FiChevronDown,
  FiCheck,
  FiX,
  FiMenu,
  FiAward,
  FiFileText,
  FiLock,
  FiAlertTriangle,
  FiInfo,
  FiSliders,
  FiUsers,
  FiCheckCircle,
} from 'react-icons/fi';
import {
  MdOutlineShield,
  MdDashboard,
  MdOutlineInventory2,
  MdQuiz,
  MdOutlineLeaderboard,
  MdOutlineInsights,
  MdSecurity,
  MdLocalLibrary,
} from 'react-icons/md';
import { FaDatabase, FaCoins } from 'react-icons/fa';

function AdminUserManagement({ onNavigate, onLogout, admin }) {
  // Mock data declared directly in the component
  const mockData = [
    {
      id: 1,
      name: 'Nguyễn Minh Quân',
      badge: 'Top 1 Quán quân Sử Việt',
      badgeType: 'trophy',
      email: 'nguyenminhquan@gmail.com',
      role: 'student',
      roleLabel: 'Học viên dũng sĩ',
      completedPacks: 18,
      xp: '12.450 XP',
      progressPercentClass: 'aum-p-w-85',
      progressColorClass: 'aum-progress-fill-teal',
      joinedDate: '15/09/2025',
      status: 'active',
      statusLabel: 'Hoạt động',
      avatarText: 'MQ',
      avatarColorClass: 'aum-avatar-purple',
    },
    {
      id: 2,
      name: 'Lê Hùng Vương',
      badge: 'Cấp 14 Đại tướng Sử học',
      badgeType: 'rank',
      email: 'lehungvuong.history@gmail.com',
      role: 'student',
      roleLabel: 'Học viên dũng sĩ',
      completedPacks: 8,
      xp: '5.250 XP',
      progressPercentClass: 'aum-p-w-45',
      progressColorClass: 'aum-progress-fill-primary',
      joinedDate: '10/01/2026',
      status: 'active',
      statusLabel: 'Hoạt động',
      avatarText: 'HV',
      avatarColorClass: 'aum-avatar-teal',
    },
    {
      id: 3,
      name: 'Trần Thùy Linh',
      badge: 'Chuyên cần 45 ngày',
      badgeType: 'streak',
      email: 'thpthan_linh@gmail.com',
      role: 'student',
      roleLabel: 'Học viên dũng sĩ',
      completedPacks: 16,
      xp: '11.820 XP',
      progressPercentClass: 'aum-p-w-78',
      progressColorClass: 'aum-progress-fill-teal',
      joinedDate: '02/10/2025',
      status: 'active',
      statusLabel: 'Hoạt động',
      avatarText: 'TL',
      avatarColorClass: 'aum-avatar-blue',
    },
    {
      id: 4,
      name: 'Đỗ Hải Đăng',
      badge: 'Thử thách ngàn năm',
      badgeType: 'achievement',
      email: 'haidang.history@outlook.com',
      role: 'student',
      roleLabel: 'Học viên dũng sĩ',
      completedPacks: 14,
      xp: '9.850 XP',
      progressPercentClass: 'aum-p-w-65',
      progressColorClass: 'aum-progress-fill-teal',
      joinedDate: '12/11/2025',
      status: 'active',
      statusLabel: 'Hoạt động',
      avatarText: 'HĐ',
      avatarColorClass: 'aum-avatar-slate',
    },
    {
      id: 5,
      name: 'Chu Anh Tuấn',
      badge: 'Viện Lịch sử Quân sự',
      badgeType: 'editor',
      email: 'anhtuan.edu@gmail.com',
      role: 'editor',
      roleLabel: 'Biên tập viên sử học',
      completedPacks: '26 Bộ thẩm định',
      xp: '100% Phê duyệt',
      progressPercentClass: 'aum-p-w-100',
      progressColorClass: 'aum-progress-fill-amber',
      joinedDate: '18/08/2025',
      status: 'active',
      statusLabel: 'Hoạt động',
      avatarText: 'AT',
      avatarColorClass: 'aum-avatar-amber',
    },
    {
      id: 6,
      name: 'Vũ Tuấn Kiệt',
      badge: 'Lý do: Spam phòng thi đấu',
      badgeType: 'locked',
      email: 'tuankiet.spam@tempmail.com',
      role: 'student',
      roleLabel: 'Học viên dũng sĩ',
      completedPacks: 0,
      xp: '0 XP',
      progressPercentClass: 'aum-p-w-0',
      progressColorClass: 'aum-progress-fill-gray',
      joinedDate: '14/02/2026',
      status: 'blocked',
      statusLabel: 'Đang tạm khóa',
      avatarText: 'TK',
      avatarColorClass: 'aum-avatar-red',
    },
  ];

  // Component States
  const [userList, setUserList] = useState(mockData);
  const [viewState, setViewState] = useState('default'); // 'default' | 'skeleton' | 'empty'
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [targetLockUser, setTargetLockUser] = useState(null);

  // User Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    status: 'active',
    school: '',
    note: '',
  });

  // Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Filter and search logic
  const filteredUsers = useMemo(() => {
    return userList.filter((user) => {
      const matchSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter ? user.role === roleFilter : true;
      const matchStatus = statusFilter ? user.status === statusFilter : true;
      return matchSearch && matchRole && matchStatus;
    });
  }, [userList, searchTerm, roleFilter, statusFilter]);

  // Handle open add / edit user modal
  const handleOpenUserModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        school: 'THPT Chuyên Hà Nội - Amsterdam / Hà Nội',
        note: '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'student',
        status: 'active',
        school: '',
        note: '',
      });
    }
    setIsUserModalOpen(true);
  };

  // Handle save user
  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    if (editingUser) {
      setUserList((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: formData.name,
                email: formData.email,
                role: formData.role,
                roleLabel:
                  formData.role === 'admin'
                    ? 'Quản trị viên'
                    : formData.role === 'editor'
                    ? 'Biên tập viên sử học'
                    : 'Học viên dũng sĩ',
                status: formData.status,
                statusLabel:
                  formData.status === 'active'
                    ? 'Hoạt động'
                    : formData.status === 'blocked'
                    ? 'Đang tạm khóa'
                    : 'Chờ kích hoạt',
              }
            : u
        )
      );
      showToast(`Đã cập nhật thông tin học viên "${formData.name}" thành công!`);
    } else {
      const initials = formData.name
        .split(' ')
        .map((w) => w[0])
        .slice(-2)
        .join('')
        .toUpperCase();
      const newUser = {
        id: Date.now(),
        name: formData.name,
        badge: 'Học viên mới gia nhập',
        badgeType: 'new',
        email: formData.email,
        role: formData.role,
        roleLabel:
          formData.role === 'admin'
            ? 'Quản trị viên'
            : formData.role === 'editor'
            ? 'Biên tập viên sử học'
            : 'Học viên dũng sĩ',
        completedPacks: 0,
        xp: '0 XP',
        progressPercentClass: 'aum-p-w-0',
        progressColorClass: 'aum-progress-fill-gray',
        joinedDate: new Date().toLocaleDateString('vi-VN'),
        status: formData.status,
        statusLabel:
          formData.status === 'active'
            ? 'Hoạt động'
            : formData.status === 'blocked'
            ? 'Đang tạm khóa'
            : 'Chờ kích hoạt',
        avatarText: initials || 'HV',
        avatarColorClass: 'aum-avatar-purple',
      };
      setUserList((prev) => [newUser, ...prev]);
      showToast(`Đã thêm thành công học viên "${formData.name}" vào History Quest!`);
    }

    setIsUserModalOpen(false);
  };

  // Handle open confirm lock modal
  const handleOpenLockModal = (user) => {
    setTargetLockUser(user || userList.find((u) => u.status === 'active') || userList[0]);
    setIsConfirmModalOpen(true);
  };

  // Confirm lock/unlock action
  const handleConfirmLock = () => {
    if (!targetLockUser) return;
    setUserList((prev) =>
      prev.map((u) => {
        if (u.id === targetLockUser.id) {
          const isCurrentlyBlocked = u.status === 'blocked';
          return {
            ...u,
            status: isCurrentlyBlocked ? 'active' : 'blocked',
            statusLabel: isCurrentlyBlocked ? 'Hoạt động' : 'Đang tạm khóa',
            badge: isCurrentlyBlocked ? 'Đã mở khóa an toàn' : 'Lý do: Vi phạm quy chế thi đấu',
            badgeType: isCurrentlyBlocked ? 'rank' : 'locked',
            avatarColorClass: isCurrentlyBlocked ? 'aum-avatar-purple' : 'aum-avatar-red',
          };
        }
        return u;
      })
    );

    const isCurrentlyBlocked = targetLockUser.status === 'blocked';
    showToast(
      isCurrentlyBlocked
        ? `Tài khoản ${targetLockUser.name} đã được mở khóa hoạt động!`
        : `Đã tạm đình chỉ tài khoản ${targetLockUser.name}. Ghi nhật ký bảo mật thành công!`
    );
    setIsConfirmModalOpen(false);
  };

  // Delete user action
  const handleDeleteUser = (id, name) => {
    setUserList((prev) => prev.filter((u) => u.id !== id));
    showToast(`Đã xóa tài khoản học viên "${name}" khỏi cơ sở dữ liệu!`);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setViewState('default');
    showToast('Đã đặt lại bộ lọc người dùng về mặc định!');
  };

  // Quick export mock CSV
  const handleExportCSV = () => {
    showToast('Đang tạo và tải xuống danh sách người dùng (HistoryQuest_Users.csv)...');
  };

  return (
    <div className="aum-root">
      {/* ==================== 1. DEMO STATE SIMULATOR BAR ==================== */}
      <header className="aum-sim-bar">
        <div className="aum-sim-bar-inner">
          <div className="aum-sim-label">
            <span className="aum-sim-icon-badge">
              <FiSliders />
            </span>
            <span>Demo State Simulator:</span>
          </div>

          <div className="aum-sim-btn-group">
            <button
              type="button"
              className={`aum-sim-btn ${viewState === 'default' ? 'active' : ''}`}
              onClick={() => setViewState('default')}
            >
              Mặc định (Live)
            </button>
            <button
              type="button"
              className={`aum-sim-btn ${viewState === 'skeleton' ? 'active' : ''}`}
              onClick={() => setViewState('skeleton')}
            >
              Đang tải (Skeleton)
            </button>
            <button
              type="button"
              className={`aum-sim-btn ${viewState === 'empty' ? 'active' : ''}`}
              onClick={() => setViewState('empty')}
            >
              Không có kết quả
            </button>
            <button
              type="button"
              className="aum-sim-btn aum-sim-btn-purple"
              onClick={() => handleOpenUserModal(null)}
            >
              <FiPlus />
              Modal Thêm người dùng
            </button>
            <button
              type="button"
              className="aum-sim-btn aum-sim-btn-danger"
              onClick={() => handleOpenLockModal(null)}
            >
              <FiSlash />
              Modal Khóa Tài khoản
            </button>
          </div>
        </div>
      </header>

      {/* ==================== 2. MAIN LAYOUT ==================== */}
      <div className="aum-layout">
        {/* SIDEBAR NAVIGATION */}
        <aside className={`aum-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
          <div>
            {/* Brand Logo & Title */}
            <div className="aum-brand-header">
              <div className="aum-brand-logo">
                <MdOutlineShield />
              </div>
              <div>
                <div className="aum-brand-title">HISTORY QUEST</div>
                <span className="aum-brand-badge">ADMIN PORTAL</span>
              </div>
            </div>

            {/* Nav Menu Items */}
            <nav className="aum-nav-list">
              <button
                type="button"
                className="aum-nav-item"
                onClick={() => onNavigate?.('/admin')}
              >
                <span className="aum-nav-item-left">
                  <span className="aum-nav-icon"><MdDashboard /></span>
                  <span>Tổng quan</span>
                </span>
              </button>

              {/* Active Tab: Người dùng */}
              <button type="button" className="aum-nav-item active" aria-current="page">
                <span className="aum-nav-item-left">
                  <span className="aum-nav-icon"><FiUsers /></span>
                  <span>Người dùng</span>
                </span>
                <span className="aum-nav-dot" />
              </button>

              <button
                type="button"
                className="aum-nav-item"
                onClick={() => onNavigate?.('/admin/packages')}
              >
                <span className="aum-nav-item-left">
                  <span className="aum-nav-icon"><MdOutlineInventory2 /></span>
                  <span>Gói câu hỏi</span>
                </span>
                <span className="aum-nav-counter">24</span>
              </button>

              <button
                type="button"
                className="aum-nav-item"
                onClick={() => onNavigate?.('/admin/sets')}
              >
                <span className="aum-nav-item-left">
                  <span className="aum-nav-icon"><MdQuiz /></span>
                  <span>Bộ câu hỏi</span>
                </span>
              </button>

              <button
                type="button"
                className="aum-nav-item"
                onClick={() => onNavigate?.('/admin/bank')}
              >
                <span className="aum-nav-item-left">
                  <span className="aum-nav-icon"><FaDatabase /></span>
                  <span>Ngân hàng câu hỏi</span>
                </span>
              </button>

              <button
                type="button"
                className="aum-nav-item"
                onClick={() => onNavigate?.('/admin/leaderboard')}
              >
                <span className="aum-nav-item-left">
                  <span className="aum-nav-icon"><MdOutlineLeaderboard /></span>
                  <span>Bảng xếp hạng</span>
                </span>
              </button>

              <button
                type="button"
                className="aum-nav-item"
                onClick={() => onNavigate?.('/admin/stats')}
              >
                <span className="aum-nav-item-left">
                  <span className="aum-nav-icon"><MdOutlineInsights /></span>
                  <span>Thống kê</span>
                </span>
              </button>
            </nav>
          </div>

          {/* Bottom Sidebar Info */}
          <div className="aum-sidebar-footer">
            <div className="aum-version-row">
              <span>Phiên bản hệ thống</span>
              <span className="aum-version-tag">v2.4 LTS</span>
            </div>
            <button
              type="button"
              className="aum-logout-btn"
              onClick={() => {
                if (onLogout) {
                  onLogout();
                  return;
                }
                showToast('Đã đăng xuất phiên làm việc của Quản trị viên an toàn.');
              }}
            >
              <FiLogOut />
              <span>Đăng xuất an toàn</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT VIEW */}
        <main className="aum-main">
          {/* TOP HEADER & PROFILE ROW */}
          <div className="aum-top-row">
            <div>
              {/* Breadcrumb */}
              <div className="aum-breadcrumb">
                <button
                  type="button"
                  className="aum-mobile-menu-btn"
                  onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                  aria-label="Toggle menu"
                >
                  <FiMenu />
                </button>
                <span>Quản trị hệ thống</span>
                <FiChevronRight />
                <span className="aum-breadcrumb-current">Quản lý người dùng</span>
              </div>

              {/* Title & Subtitle */}
              <h1 className="aum-page-title">Quản lý người dùng</h1>
              <p className="aum-page-desc">
                Theo dõi, phân quyền vai trò và quản lý trạng thái tài khoản học viên và quản trị
                viên trên toàn hệ thống History Quest.
              </p>
            </div>

            {/* Header Right Actions */}
            <div className="aum-top-actions">
              {/* Notification Bell */}
              <button
                type="button"
                className="aum-icon-btn"
                aria-label="Thông báo hệ thống"
                onClick={() => showToast('Không có thông báo vi phạm mới trong 15 phút qua.')}
              >
                <FiBell />
                <span className="aum-notify-badge" />
              </button>

              {/* Admin Profile Pill */}
              <div className="aum-admin-pill">
                <div className="aum-admin-avatar">AD</div>
                <div className="aum-admin-info">
                  <span className="aum-admin-name">{admin?.name || admin?.email || 'Nguyễn Quốc Toản'}</span>
                  <span className="aum-admin-role">Quản trị viên trưởng</span>
                </div>
              </div>

              {/* Main CTA: Add User */}
              <button
                type="button"
                className="aum-btn-tactile"
                onClick={() => handleOpenUserModal(null)}
              >
                <FiPlus />
                <span>+ Thêm người dùng mới</span>
              </button>
            </div>
          </div>

          {/* 4 KPI STATS CARDS */}
          <section className="aum-stats-grid">
            {/* Stat 1 */}
            <div className="aum-stat-card">
              <div className="aum-stat-header">
                <span className="aum-stat-title">Tổng người học &amp; QTV</span>
                <div className="aum-stat-icon-box aum-stat-icon-purple">
                  <FiUsers />
                </div>
              </div>
              <div className="aum-stat-body">
                <h3 className="aum-stat-value">42.850</h3>
                <div className="aum-stat-meta">
                  <span className="aum-badge-pill aum-badge-teal">+1.240</span>
                  <span className="aum-stat-subtext">đăng ký mới tuần này</span>
                </div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="aum-stat-card">
              <div className="aum-stat-header">
                <span className="aum-stat-title">Đang hoạt động</span>
                <div className="aum-stat-icon-box aum-stat-icon-teal">
                  <FiCheckCircle />
                </div>
              </div>
              <div className="aum-stat-body">
                <h3 className="aum-stat-value">41.620</h3>
                <div className="aum-stat-meta">
                  <span className="aum-badge-pill aum-badge-teal">97.1%</span>
                  <span className="aum-stat-subtext">tỷ lệ hoạt động lành mạnh</span>
                </div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="aum-stat-card">
              <div className="aum-stat-header">
                <span className="aum-stat-title">Đang tạm khóa</span>
                <div className="aum-stat-icon-box aum-stat-icon-red">
                  <FiSlash />
                </div>
              </div>
              <div className="aum-stat-body">
                <h3 className="aum-stat-value danger">180</h3>
                <div className="aum-stat-meta">
                  <span className="aum-badge-pill aum-badge-red">Cần xử lý</span>
                  <span className="aum-stat-subtext">vi phạm quy chế ôn luyện</span>
                </div>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="aum-stat-card">
              <div className="aum-stat-header">
                <span className="aum-stat-title">Ban Quản trị &amp; BTV</span>
                <div className="aum-stat-icon-box aum-stat-icon-amber">
                  <MdSecurity />
                </div>
              </div>
              <div className="aum-stat-body">
                <h3 className="aum-stat-value">15</h3>
                <div className="aum-stat-meta">
                  <span className="aum-badge-pill aum-badge-amber">100% 2FA</span>
                  <span className="aum-stat-subtext">phân quyền kiểm duyệt nội dung</span>
                </div>
              </div>
            </div>
          </section>

          {/* SEARCH, FILTERS & ACTION BAR */}
          <section className="aum-filter-card">
            <div className="aum-search-wrapper">
              <span className="aum-search-icon">
                <FiSearch />
              </span>
              <input
                type="text"
                className="aum-search-input"
                placeholder="Tìm kiếm theo họ tên, email học viên hoặc ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="aum-filter-controls">
              {/* Role filter */}
              <div className="aum-select-wrapper">
                <select
                  className="aum-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="student">Học viên dũng sĩ</option>
                  <option value="editor">Biên tập viên nội dung</option>
                  <option value="admin">Quản trị viên</option>
                </select>
                <span className="aum-select-arrow"><FiChevronDown /></span>
              </div>

              {/* Status filter */}
              <div className="aum-select-wrapper">
                <select
                  className="aum-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="blocked">Đang tạm khóa</option>
                  <option value="pending">Chờ kích hoạt</option>
                </select>
                <span className="aum-select-arrow"><FiChevronDown /></span>
              </div>

              {/* Reset filter button */}
              <button
                type="button"
                className="aum-btn-secondary"
                onClick={handleResetFilters}
              >
                <FiRefreshCw />
                <span>Đặt lại bộ lọc</span>
              </button>

              {/* Export CSV button */}
              <button
                type="button"
                className="aum-btn-secondary aum-btn-export"
                onClick={handleExportCSV}
              >
                <FiDownload />
                <span>Xuất CSV</span>
              </button>
            </div>
          </section>

          {/* DATA VIEW AREA (DEFAULT TABLE, SKELETON, OR EMPTY) */}
          <section className="aum-table-card">
            {/* VIEW 1: SKELETON LOADING STATE */}
            {viewState === 'skeleton' && (
              <div className="aum-skeleton-container">
                <div className="aum-skeleton-bar aum-skeleton-header" />
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="aum-skeleton-row">
                    <div className="aum-skeleton-bar aum-skeleton-avatar" />
                    <div className="aum-skeleton-text-group">
                      <div className="aum-skeleton-bar aum-skeleton-text-long" />
                      <div className="aum-skeleton-bar aum-skeleton-text-short" />
                    </div>
                    <div className="aum-skeleton-bar aum-skeleton-chip" />
                  </div>
                ))}
              </div>
            )}

            {/* VIEW 2: EMPTY STATE */}
            {(viewState === 'empty' || (viewState === 'default' && filteredUsers.length === 0)) && (
              <div className="aum-empty-state">
                <div className="aum-empty-icon-box">
                  <FiSearch />
                </div>
                <h3 className="aum-empty-title">Không tìm thấy người dùng</h3>
                <p className="aum-empty-desc">
                  Không có người dùng nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại. Vui
                  lòng kiểm tra lại chính tả hoặc đặt lại bộ lọc.
                </p>
                <button
                  type="button"
                  className="aum-btn-tactile"
                  onClick={handleResetFilters}
                >
                  Xóa bộ lọc &amp; Tải lại
                </button>
              </div>
            )}

            {/* VIEW 3: LIVE DATA TABLE */}
            {viewState === 'default' && filteredUsers.length > 0 && (
              <div className="aum-table-scroll">
                <table className="aum-table">
                  <thead>
                    <tr>
                      <th>Thành viên</th>
                      <th>Email liên kết</th>
                      <th>Vai trò</th>
                      <th>Tiến độ học tập</th>
                      <th>Ngày tham gia</th>
                      <th>Trạng thái</th>
                      <th className="align-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={user.status === 'blocked' ? 'row-locked' : ''}
                      >
                        {/* Member */}
                        <td>
                          <div className="aum-member-cell">
                            <div className={`aum-avatar-initials ${user.avatarColorClass}`}>
                              {user.avatarText}
                            </div>
                            <div>
                              <div className="aum-member-name-row">
                                <span className="aum-member-name">{user.name}</span>
                                {user.badgeType === 'trophy' && (
                                  <FiAward title="Quán quân tuần" />
                                )}
                                {user.badgeType === 'editor' && (
                                  <FiFileText title="Biên tập viên chính" />
                                )}
                                {user.badgeType === 'locked' && (
                                  <FiLock title="Tài khoản bị khóa" />
                                )}
                              </div>
                              <div
                                className={`aum-member-sub ${
                                  user.status === 'blocked' ? 'danger' : ''
                                }`}
                              >
                                {user.badge}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="aum-email-cell">{user.email}</td>

                        {/* Role */}
                        <td>
                          <span
                            className={`aum-chip-role ${
                              user.role === 'admin'
                                ? 'aum-chip-admin'
                                : user.role === 'editor'
                                ? 'aum-chip-editor'
                                : 'aum-chip-student'
                            }`}
                          >
                            {user.roleLabel}
                          </span>
                        </td>

                        {/* Learning Progress */}
                        <td>
                          <div className="aum-progress-cell">
                            <div className="aum-progress-meta">
                              <span className="aum-progress-count">
                                {typeof user.completedPacks === 'number'
                                  ? `${user.completedPacks} Gói hoàn thành`
                                  : user.completedPacks}
                              </span>
                              <span className="aum-progress-dot">•</span>
                              <span className="aum-xp-pill">
                                <FaCoins />
                                <span>{user.xp}</span>
                              </span>
                            </div>
                            <div className="aum-progress-track">
                              <div
                                className={`aum-progress-fill ${user.progressColorClass} ${user.progressPercentClass}`}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Join Date */}
                        <td className="aum-date-cell">{user.joinedDate}</td>

                        {/* Status */}
                        <td>
                          <span
                            className={`aum-chip-status ${
                              user.status === 'active'
                                ? 'aum-status-active'
                                : user.status === 'blocked'
                                ? 'aum-status-locked'
                                : 'aum-status-pending'
                            }`}
                          >
                            <span
                              className={
                                user.status === 'active'
                                  ? 'aum-status-dot-active'
                                  : user.status === 'blocked'
                                  ? 'aum-status-dot-locked'
                                  : 'aum-status-dot-pending'
                              }
                            />
                            <span>{user.statusLabel}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="align-right">
                          <div className="aum-action-group">
                            <button
                              type="button"
                              className="aum-btn-action"
                              title="Xem chi tiết"
                              onClick={() =>
                                showToast(`Xem chi tiết hồ sơ học viên: ${user.name}`)
                              }
                            >
                              <FiEye />
                            </button>
                            <button
                              type="button"
                              className="aum-btn-action"
                              title="Chỉnh sửa người dùng"
                              onClick={() => handleOpenUserModal(user)}
                            >
                              <FiEdit2 />
                            </button>
                            {user.status === 'blocked' ? (
                              <button
                                type="button"
                                className="aum-btn-action action-unlock"
                                title="Mở khóa tài khoản"
                                onClick={() => handleOpenLockModal(user)}
                              >
                                <FiUnlock />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="aum-btn-action"
                                title="Khóa tài khoản"
                                onClick={() => handleOpenLockModal(user)}
                              >
                                <FiSlash />
                              </button>
                            )}
                            <button
                              type="button"
                              className="aum-btn-action action-danger"
                              title="Xóa tài khoản"
                              onClick={() => handleDeleteUser(user.id, user.name)}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PAGINATION BAR */}
            {viewState === 'default' && filteredUsers.length > 0 && (
              <div className="aum-pagination">
                <div className="aum-pagination-info">
                  Hiển thị <strong>1 - {filteredUsers.length}</strong> trong tổng số{' '}
                  <strong>42.850</strong> tài khoản
                </div>
                <div className="aum-pagination-nav">
                  <button type="button" className="aum-page-btn" disabled>
                    <FiChevronLeft />
                  </button>
                  <button type="button" className="aum-page-btn active">
                    1
                  </button>
                  <button type="button" className="aum-page-btn">
                    2
                  </button>
                  <button type="button" className="aum-page-btn">
                    3
                  </button>
                  <span className="aum-page-ellipsis">...</span>
                  <button type="button" className="aum-page-btn">
                    4.285
                  </button>
                  <button type="button" className="aum-page-btn">
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* SECURITY & PRIVACY NOTICE BANNER */}
          <div className="aum-security-banner">
            <span className="aum-security-icon">
              <MdSecurity />
            </span>
            <div className="aum-security-text">
              <strong>Quy chuẩn Bảo mật &amp; Phân quyền Admin:</strong> Mọi thao tác cấp quyền
              hoặc khóa tài khoản học viên đều được ghi nhật ký hệ thống (Audit Trail) v2.4. Mật khẩu
              và mã thông báo xác thực được băm đa tầng và bảo mật tuyệt đối, tuân thủ tiêu chuẩn an
              toàn dữ liệu ngành giáo dục số.
            </div>
          </div>
        </main>
      </div>

      {/* ==================== 3. SHARED FOOTER ==================== */}
      <footer className="aum-footer">
        <div className="aum-footer-inner">
          <div className="aum-footer-brand">
            <div className="aum-footer-logo">
              <MdLocalLibrary />
            </div>
            <div>
              <span className="aum-footer-name">History Quest</span>
              <p className="aum-footer-copy">
                © 2026 History Quest. Nền tảng học Lịch sử Việt Nam tương tác hàng đầu.
              </p>
            </div>
          </div>

          <div className="aum-footer-links">
            <a href="#dieukhoan" className="aum-footer-link" onClick={(e) => e.preventDefault()}>
              Điều khoản sử dụng
            </a>
            <a href="#chinhsach" className="aum-footer-link" onClick={(e) => e.preventDefault()}>
              Chính sách bảo mật
            </a>
            <a href="#hotro" className="aum-footer-link" onClick={(e) => e.preventDefault()}>
              Liên hệ hỗ trợ
            </a>
            <a href="#nhiemvu" className="aum-footer-link" onClick={(e) => e.preventDefault()}>
              Hệ thống nhiệm vụ
            </a>
            <a href="#congdong" className="aum-footer-link" onClick={(e) => e.preventDefault()}>
              Cộng đồng học tập
            </a>
          </div>
        </div>
      </footer>

      {/* ==================== 4. MODAL: ADD / EDIT USER ==================== */}
      {isUserModalOpen && (
        <div className="aum-modal-backdrop" onClick={() => setIsUserModalOpen(false)}>
          <div className="aum-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="aum-modal-header">
              <div className="aum-modal-header-left">
                <div className="aum-modal-icon-badge">
                  <FiPlus />
                </div>
                <div>
                  <h3 className="aum-modal-title">
                    {editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
                  </h3>
                  <p className="aum-modal-subtitle">
                    Cập nhật quyền hạn và hồ sơ trong hệ thống History Quest
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="aum-modal-close-btn"
                onClick={() => setIsUserModalOpen(false)}
              >
                <FiX />
              </button>
            </div>

            <form className="aum-form" onSubmit={handleSaveUser}>
              {/* Họ tên & Email */}
              <div className="aum-form-row-2">
                <div className="aum-form-group">
                  <label className="aum-form-label">
                    Họ và tên <span className="aum-form-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="aum-form-input"
                    required
                    placeholder="Ví dụ: Lê Thái Tổ"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="aum-form-group">
                  <label className="aum-form-label">
                    Email liên kết <span className="aum-form-required">*</span>
                  </label>
                  <input
                    type="email"
                    className="aum-form-input"
                    required
                    placeholder="student@historyquest.vn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Vai trò & Trạng thái */}
              <div className="aum-form-row-2">
                <div className="aum-form-group">
                  <label className="aum-form-label">Vai trò hệ thống</label>
                  <select
                    className="aum-form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="student">Học viên dũng sĩ</option>
                    <option value="editor">Biên tập viên sử học</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>

                <div className="aum-form-group">
                  <label className="aum-form-label">Trạng thái tài khoản</label>
                  <select
                    className="aum-form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="pending">Chờ xác thực kích hoạt</option>
                    <option value="blocked">Tạm khóa tài khoản</option>
                  </select>
                </div>
              </div>

              {/* Trường học / Tỉnh thành */}
              <div className="aum-form-group">
                <label className="aum-form-label">Trường học / Tỉnh thành</label>
                <input
                  type="text"
                  className="aum-form-input"
                  placeholder="THPT Chuyên Hà Nội - Amsterdam / Hà Nội"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                />
              </div>

              {/* Ghi chú quản trị */}
              <div className="aum-form-group">
                <label className="aum-form-label">Ghi chú quản trị</label>
                <textarea
                  className="aum-form-textarea"
                  rows={2}
                  placeholder="Ghi chú thêm về thành tích thi đấu hoặc lý do cấp quyền..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>

              {/* Action buttons */}
              <div className="aum-modal-actions">
                <button
                  type="button"
                  className="aum-btn-secondary"
                  onClick={() => setIsUserModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="aum-btn-tactile">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 5. MODAL: CONFIRM LOCK / UNLOCK ==================== */}
      {isConfirmModalOpen && targetLockUser && (
        <div className="aum-modal-backdrop" onClick={() => setIsConfirmModalOpen(false)}>
          <div
            className="aum-modal-card aum-confirm-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aum-confirm-icon-box">
              <FiAlertTriangle />
            </div>
            <h3 className="aum-confirm-title">
              {targetLockUser.status === 'blocked'
                ? 'Xác nhận mở khóa tài khoản?'
                : 'Xác nhận khóa tài khoản?'}
            </h3>
            <p className="aum-confirm-body">
              {targetLockUser.status === 'blocked' ? (
                <>
                  Bạn đang yêu cầu kích hoạt lại tài khoản học viên{' '}
                  <strong>{targetLockUser.name}</strong>. Học viên sẽ có thể tiếp tục tham gia các
                  phòng thi đấu và nộp bài ôn luyện lịch sử.
                </>
              ) : (
                <>
                  Bạn đang yêu cầu tạm đình chỉ tài khoản học viên{' '}
                  <strong>{targetLockUser.name}</strong>. Người dùng này sẽ ngay lập tức bị đăng
                  xuất khỏi tất cả phòng thi đấu và không thể nộp bài tập.
                </>
              )}
            </p>

            <div className="aum-confirm-note">
              <FiInfo />
              <span>Hành động này được lưu lại trong nhật ký bảo mật của Quản trị viên.</span>
            </div>

            <div className="aum-confirm-actions">
              <button
                type="button"
                className="aum-btn-secondary"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className={`aum-btn-tactile ${
                  targetLockUser.status === 'blocked' ? '' : 'aum-btn-tactile-danger'
                }`}
                onClick={handleConfirmLock}
              >
                {targetLockUser.status === 'blocked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 6. TOAST NOTIFICATION ==================== */}
      {toastMessage && (
        <div className="aum-toast">
          <FiCheck className="aum-toast-icon" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default AdminUserManagement;
