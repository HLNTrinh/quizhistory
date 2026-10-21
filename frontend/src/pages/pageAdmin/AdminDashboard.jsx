import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import AdminSectionPage from './AdminSections.jsx';
import {
  FiShield,
  FiCheckCircle,
  FiClock,
  FiFolderMinus,
  FiAlertCircle,
  FiLayers,
  FiHelpCircle,
  FiAward,
  FiTrendingUp,
  FiLogOut,
  FiMenu,
  FiChevronRight,
  FiSearch,
  FiPlusCircle,
  FiBell,
  FiUsers,
  FiFolder,
  FiCheckSquare,
  FiDatabase,
  FiEye,
  FiRefreshCw,
  FiUploadCloud,
  FiWifiOff,
  FiArrowRight,
  FiSliders,
  FiBookOpen,
  FiCheck,
  FiPlus,
  FiBarChart2
} from 'react-icons/fi';

const NAV_PATHS = {
  overview: '/admin',
  users: '/admin/users',
  packages: '/admin/packages',
  sets: '/admin/sets',
  bank: '/admin/bank',
  leaderboard: '/admin/leaderboard',
  stats: '/admin/stats',
};

const NAV_META = {
  overview: {
    breadcrumb: 'Bảng điều khiển',
    title: 'Tổng quan hệ thống',
    placeholder: 'Tìm kiếm người dùng, gói câu hỏi, ID bộ đề...',
    cta: '+ Tạo gói câu hỏi mới',
  },
  packages: {
    breadcrumb: 'Gói câu hỏi',
    title: 'Quản lý gói câu hỏi',
    placeholder: 'Tìm kiếm gói câu hỏi theo tên hoặc mã...',
    cta: '+ Tạo gói câu hỏi mới',
  },
  sets: {
    breadcrumb: 'Bộ câu hỏi',
    title: 'Quản lý bộ câu hỏi',
    placeholder: 'Tìm kiếm bộ câu hỏi theo tên hoặc gói...',
    cta: '+ Tạo bộ câu hỏi mới',
  },
  bank: {
    breadcrumb: 'Ngân hàng câu hỏi',
    title: 'Ngân hàng câu hỏi',
    placeholder: 'Tìm kiếm câu hỏi theo nội dung hoặc mã...',
    cta: '+ Thêm câu hỏi mới',
  },
  leaderboard: {
    breadcrumb: 'Bảng xếp hạng',
    title: 'Bảng xếp hạng học viên',
    placeholder: 'Tìm kiếm học viên theo tên hoặc email...',
    cta: '+ Xuất báo cáo xếp hạng',
  },
  stats: {
    breadcrumb: 'Thống kê',
    title: 'Thống kê & Phân tích',
    placeholder: 'Tìm kiếm chỉ số, chủ đề hoặc gói dữ liệu...',
    cta: '+ Xuất báo cáo thống kê',
  },
};

const AdminDashboard = ({ initialNav = 'overview', onNavigate, onLogout, admin }) => {
  // Demo switchable states: 'default' | 'loading' | 'empty' | 'error'
  const [dashboardState, setDashboardState] = useState('default');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState(initialNav);
  const [timeRange, setTimeRange] = useState('7days');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    setActiveNav(initialNav);
  }, [initialNav]);

  const goToNav = (navKey) => {
    setActiveNav(navKey);
    setIsSidebarOpen(false);
    onNavigate?.(NAV_PATHS[navKey] || '/admin');
  };

  // Stat card dùng id 'questions' nhưng route tương ứng là ngân hàng câu hỏi
  const openSection = (navKey) => {
    goToNav(navKey === 'questions' ? 'bank' : navKey);
  };

  const navMeta = NAV_META[activeNav] || NAV_META.overview;

  // Mock data declared directly inside component per requirements
  const mockStats = [
    {
      id: 'users',
      title: 'Tổng người dùng',
      value: '42.850',
      badge: '+8.4%',
      badgeType: 'trend',
      subtext: '+1.240 học viên tuần này',
      iconType: 'users',
    },
    {
      id: 'packages',
      title: 'Tổng gói câu hỏi',
      value: '24 Gói',
      badge: '+ 4 gói',
      badgeType: 'teal',
      subtext: 'đang xuất bản mới',
      iconType: 'folder',
    },
    {
      id: 'sets',
      title: 'Tổng bộ câu hỏi',
      value: '186 Bộ',
      badge: '98.5%',
      badgeType: 'amber',
      subtext: 'tỷ lệ hoàn thành tốt',
      iconType: 'sets',
    },
    {
      id: 'questions',
      title: 'Tổng câu hỏi trắc nghiệm',
      value: '2.450 Câu',
      badge: '+150 câu',
      badgeType: 'purple',
      subtext: 'vừa thẩm định lịch sử',
      iconType: 'database',
    },
  ];

  const mockPackages = [
    {
      id: 'pkg-1',
      title: 'Chiến dịch Điện Biên Phủ 1954',
      updatedAt: 'Cập nhật: 10 phút trước',
      sets: '8 bộ',
      questions: '80 câu',
      status: 'active',
      passRate: '92%',
    },
    {
      id: 'pkg-2',
      title: 'Chiến dịch Hồ Chí Minh 1975',
      updatedAt: 'Cập nhật: Hôm qua',
      sets: '10 bộ',
      questions: '100 câu',
      status: 'active',
      passRate: '88%',
    },
    {
      id: 'pkg-3',
      title: 'Ba lần đại thắng Nguyên Mông',
      updatedAt: 'Cập nhật: 2 ngày trước',
      sets: '6 bộ',
      questions: '60 câu',
      status: 'draft',
      passRate: '--',
    },
    {
      id: 'pkg-4',
      title: 'Thời kỳ Hùng Vương & Văn Lang',
      updatedAt: 'Cập nhật: 3 ngày trước',
      sets: '4 bộ',
      questions: '40 câu',
      status: 'active',
      passRate: '95%',
    },
  ];

  const mockActivities = [
    {
      id: 'act-1',
      type: 'publish',
      prefix: 'Admin Nguyễn Quốc Toản vừa xuất bản',
      target: 'Bộ 08 Gói Điện Biên Phủ',
      targetColor: 'primary',
      timeMeta: '10 phút trước • Thao tác quản trị',
    },
    {
      id: 'act-2',
      type: 'achievement',
      prefix: 'Hệ thống ghi nhận',
      target: '1.500 lượt thi đua mở khóa huy hiệu mới',
      targetColor: 'amber',
      timeMeta: '35 phút trước • Thành tích người học',
    },
    {
      id: 'act-3',
      type: 'update',
      prefix: 'Cập nhật ngân hàng',
      target: '20 câu hỏi tư liệu trận Bạch Đằng Giang',
      targetColor: 'teal',
      timeMeta: '2 giờ trước • Thẩm định dữ liệu',
    },
    {
      id: 'act-4',
      type: 'report',
      prefix: 'Kiểm tra báo cáo câu hỏi',
      target: '#1042 đã được xử lý và phản hồi',
      targetColor: 'text',
      timeMeta: '4 giờ trước • Góp ý người dùng',
    },
  ];

  const filteredPackages = mockPackages.filter((pkg) =>
    pkg.title.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const simulateReload = () => {
    setDashboardState('loading');
    setTimeout(() => {
      setDashboardState('default');
    }, 750);
  };

  // Keyboard shortcut listener (Ctrl+K to focus search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('hq-global-search');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="hq-admin-shell">
      {/* 1. DEMO STATE SWITCHER BAR (chỉ dành cho trang Tổng quan) */}
      {activeNav === 'overview' && (
      <header className="hq-state-switcher-bar">
        <div className="hq-switcher-info">
          <div className="hq-switcher-badge-icon">
            <FiSliders />
          </div>
          <span className="hq-switcher-title">Demo State Switcher:</span>
          <span className="hq-switcher-subtitle">Chuyển trạng thái xem Dashboard</span>
        </div>

        <div className="hq-switcher-pill-group">
          <button
            type="button"
            className={`hq-switcher-pill ${dashboardState === 'default' ? 'active' : ''}`}
            onClick={() => setDashboardState('default')}
          >
            <FiCheckCircle />
            <span>Mặc định (Live)</span>
          </button>
          <button
            type="button"
            className={`hq-switcher-pill ${dashboardState === 'loading' ? 'active' : ''}`}
            onClick={() => setDashboardState('loading')}
          >
            <FiClock />
            <span>Đang tải (Skeleton)</span>
          </button>
          <button
            type="button"
            className={`hq-switcher-pill ${dashboardState === 'empty' ? 'active' : ''}`}
            onClick={() => setDashboardState('empty')}
          >
            <FiFolderMinus />
            <span>Chưa có dữ liệu</span>
          </button>
          <button
            type="button"
            className={`hq-switcher-pill ${dashboardState === 'error' ? 'active' : ''}`}
            onClick={() => setDashboardState('error')}
          >
            <FiAlertCircle />
            <span>Lỗi tải (Error)</span>
          </button>
        </div>
      </header>
      )}

      {/* 2. MAIN LAYOUT (SIDEBAR + MAIN VIEWPORT) */}
      <div className="hq-layout-container">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            className="hq-sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* 3. SIDEBAR NAVIGATION */}
        <aside className={`hq-sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
          <div>
            <div className="hq-sidebar-brand">
              <div className="hq-brand-logo-box">
                <FiShield />
              </div>
              <div className="hq-brand-text-col">
                <div className="hq-brand-name">HISTORY QUEST</div>
                <div className="hq-brand-badge">
                  <FiCheck className="hq-brand-badge-icon" />
                  <span>Admin Portal</span>
                </div>
              </div>
            </div>

            <nav className="hq-nav-section">
              <div className="hq-nav-header">Danh mục Quản trị</div>
              <ul className="hq-nav-list">
                <li>
                  <button
                    type="button"
                    className={`hq-nav-item ${activeNav === 'overview' ? 'active' : ''}`}
                    onClick={() => goToNav('overview')}
                  >
                    <span className="hq-nav-icon"><FiBarChart2 /></span>
                    <span>Tổng quan</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`hq-nav-item ${activeNav === 'users' ? 'active' : ''}`}
                    onClick={() => goToNav('users')}
                  >
                    <span className="hq-nav-icon"><FiUsers /></span>
                    <span>Người dùng</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`hq-nav-item ${activeNav === 'packages' ? 'active' : ''}`}
                    onClick={() => goToNav('packages')}
                  >
                    <span className="hq-nav-icon"><FiFolder /></span>
                    <span>Gói câu hỏi</span>
                    <span className="hq-nav-count-badge">24</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`hq-nav-item ${activeNav === 'sets' ? 'active' : ''}`}
                    onClick={() => goToNav('sets')}
                  >
                    <span className="hq-nav-icon"><FiLayers /></span>
                    <span>Bộ câu hỏi</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`hq-nav-item ${activeNav === 'bank' ? 'active' : ''}`}
                    onClick={() => goToNav('bank')}
                  >
                    <span className="hq-nav-icon"><FiHelpCircle /></span>
                    <span>Ngân hàng câu hỏi</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`hq-nav-item ${activeNav === 'leaderboard' ? 'active' : ''}`}
                    onClick={() => goToNav('leaderboard')}
                  >
                    <span className="hq-nav-icon"><FiAward /></span>
                    <span>Bảng xếp hạng</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`hq-nav-item ${activeNav === 'stats' ? 'active' : ''}`}
                    onClick={() => goToNav('stats')}
                  >
                    <span className="hq-nav-icon"><FiTrendingUp /></span>
                    <span>Thống kê</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          <div className="hq-sidebar-footer">
            <div className="hq-server-status">
              <div className="hq-server-pulse-wrap">
                <span className="hq-server-pulse-dot" />
                <span>Máy chủ ổn định</span>
              </div>
              <span className="hq-version-tag">v2.4</span>
            </div>
            <button type="button" className="hq-logout-btn" onClick={onLogout}>
              <FiLogOut />
              <span>Đăng xuất an toàn</span>
            </button>
          </div>
        </aside>

        {/* 4. MAIN CONTENT AREA */}
        <main className="hq-main-content">
          {/* Top Navbar */}
          <div className="hq-top-navbar">
            <div className="hq-navbar-inner">
              <div className="hq-title-area">
                <button
                  type="button"
                  className="hq-menu-toggle-btn"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  aria-label="Toggle Navigation Menu"
                >
                  <FiMenu />
                </button>
                <div>
                  <div className="hq-breadcrumb-bar">
                    <span>Hệ thống quản trị</span>
                    <FiChevronRight />
                    <span>{navMeta.breadcrumb}</span>
                    <FiChevronRight />
                    <span className="hq-breadcrumb-active">{navMeta.title}</span>
                  </div>
                  <div className="hq-page-heading-row">
                    <h1 className="hq-page-title">{navMeta.title}</h1>
                    <span className="hq-live-pill">
                      <span className="hq-live-dot" />
                      Cập nhật trực tiếp: 2 phút trước
                    </span>
                  </div>
                </div>
              </div>

              <div className="hq-header-actions">
                <div className="hq-search-box">
                  <FiSearch className="hq-search-icon" />
                  <input
                    id="hq-global-search"
                    type="text"
                    className="hq-search-input"
                    placeholder={navMeta.placeholder}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                  <span className="hq-search-kbd">Ctrl+K</span>
                </div>

                <button
                  type="button"
                  className="hq-btn-primary-tactile"
                  onClick={() => openSection(activeNav === 'overview' ? 'packages' : activeNav)}
                >
                  <FiPlusCircle />
                  <span>{navMeta.cta}</span>
                </button>

                <div className="hq-notif-btn-wrap">
                  <button
                    type="button"
                    className="hq-icon-button"
                    onClick={() => setShowNotifications(!showNotifications)}
                    aria-label="Notifications"
                  >
                    <FiBell />
                  </button>
                  <span className="hq-notif-badge">3</span>
                </div>

                <div className="hq-admin-profile">
                  <div className="hq-avatar-box">AD</div>
                  <div className="hq-profile-meta">
                    <div className="hq-profile-name">{admin?.name || admin?.email || 'Nguyễn Quốc Toản'}</div>
                    <div className="hq-profile-role">Quản trị viên trưởng</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Body: trang con hoặc dashboard theo trạng thái demo */}
          <div className="hq-body-wrap">
            {activeNav !== 'overview' && (
              <AdminSectionPage section={activeNav} onNavigate={onNavigate} />
            )}

            {activeNav === 'overview' && (
              <>
            {/* STATE 1: DEFAULT LIVE VIEW */}
            {dashboardState === 'default' && (
              <>
                {/* 4 Stat Cards */}
                <div className="hq-stats-grid">
                  {mockStats.map((item) => {
                    let iconNode = <FiUsers />;
                    let iconClass = 'hq-icon-purple';
                    if (item.iconType === 'folder') {
                      iconNode = <FiFolder />;
                      iconClass = 'hq-icon-teal';
                    } else if (item.iconType === 'sets') {
                      iconNode = <FiCheckSquare />;
                      iconClass = 'hq-icon-amber';
                    } else if (item.iconType === 'database') {
                      iconNode = <FiDatabase />;
                      iconClass = 'hq-icon-secondary';
                    }

                    return (
                      <div
                        key={item.id}
                        className="hq-stat-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => openSection(item.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openSection(item.id);
                          }
                        }}
                      >
                        <div className="hq-stat-header">
                          <span className="hq-stat-title">{item.title}</span>
                          <div className={`hq-stat-icon-wrap ${iconClass}`}>{iconNode}</div>
                        </div>
                        <div className="hq-stat-value">{item.value}</div>
                        <div className="hq-stat-footer">
                          {item.badgeType === 'trend' && (
                            <span className="hq-pill-trend-up">
                              <FiTrendingUp /> {item.badge}
                            </span>
                          )}
                          {item.badgeType === 'teal' && (
                            <span className="hq-pill-trend-up">
                              <FiPlus /> {item.badge}
                            </span>
                          )}
                          {item.badgeType === 'amber' && (
                            <span className="hq-pill-amber">{item.badge}</span>
                          )}
                          {item.badgeType === 'purple' && (
                            <span className="hq-pill-purple">{item.badge}</span>
                          )}
                          <span className="hq-stat-subtext">{item.subtext}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Analytics Row: Chart & Distribution */}
                <div className="hq-analytics-row">
                  {/* Left Chart Card */}
                  <div className="hq-card">
                    <div className="hq-card-header">
                      <div>
                        <h2 className="hq-card-title">Biểu đồ hoạt động & Tăng trưởng người học</h2>
                        <div className="hq-card-subtitle">
                          Số lượt làm bài trắc nghiệm và kích hoạt tài khoản trong tuần
                        </div>
                      </div>
                      <div className="hq-time-toggle">
                        <button
                          type="button"
                          className={`hq-time-btn ${timeRange === '7days' ? 'active' : ''}`}
                          onClick={() => setTimeRange('7days')}
                        >
                          7 ngày qua
                        </button>
                        <button
                          type="button"
                          className={`hq-time-btn ${timeRange === '30days' ? 'active' : ''}`}
                          onClick={() => setTimeRange('30days')}
                        >
                          30 ngày qua
                        </button>
                      </div>
                    </div>

                    <div className="hq-chart-container">
                      <div className="hq-chart-legend">
                        <div className="hq-legend-group">
                          <span className="hq-legend-item">
                            <span className="hq-legend-bullet-primary" />
                            Lượt hoàn thành đề thi
                          </span>
                          <span className="hq-legend-item">
                            <span className="hq-legend-bullet-mint" />
                            Tài khoản kích hoạt mới
                          </span>
                        </div>
                        <span className="hq-peak-indicator">Đỉnh điểm: 12.400 lượt/ngày</span>
                      </div>

                      <div className="hq-svg-chart-wrap">
                        <svg className="hq-svg-chart" viewBox="0 0 700 200" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="hqGradientArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4d41df" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#4d41df" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          <line x1="0" y1="30" x2="700" y2="30" stroke="#EEECFF" strokeDasharray="4 4" strokeWidth="1" />
                          <line x1="0" y1="80" x2="700" y2="80" stroke="#EEECFF" strokeDasharray="4 4" strokeWidth="1" />
                          <line x1="0" y1="130" x2="700" y2="130" stroke="#EEECFF" strokeDasharray="4 4" strokeWidth="1" />
                          <line x1="0" y1="180" x2="700" y2="180" stroke="#E7EAF3" strokeWidth="1.5" />

                          {/* Shaded Area under Curve */}
                          <path
                            d="M 30,150 Q 130,110 210,130 T 380,70 T 520,40 T 670,25 L 670,180 L 30,180 Z"
                            fill="url(#hqGradientArea)"
                          />

                          {/* Primary Quiz Trend Line */}
                          <path
                            d="M 30,150 Q 130,110 210,130 T 380,70 T 520,40 T 670,25"
                            fill="none"
                            stroke="#4d41df"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />

                          {/* Secondary Dashed Line for New Accounts */}
                          <path
                            d="M 30,170 Q 130,150 210,160 T 380,120 T 520,95 T 670,80"
                            fill="none"
                            stroke="#008470"
                            strokeWidth="2.5"
                            strokeDasharray="6 3"
                            strokeLinecap="round"
                          />

                          {/* Interactive milestone dots */}
                          <circle cx="210" cy="130" r="5" fill="#FFFFFF" stroke="#4d41df" strokeWidth="3" />
                          <circle cx="380" cy="70" r="5" fill="#FFFFFF" stroke="#4d41df" strokeWidth="3" />
                          <circle cx="520" cy="40" r="5" fill="#FFFFFF" stroke="#4d41df" strokeWidth="3" />
                          <circle cx="670" cy="25" r="7" fill="#4d41df" stroke="#FFFFFF" strokeWidth="3" />
                        </svg>
                      </div>

                      <div className="hq-chart-x-axis">
                        <span>Thứ 2</span>
                        <span>Thứ 3</span>
                        <span>Thứ 4</span>
                        <span>Thứ 5</span>
                        <span>Thứ 6</span>
                        <span>Thứ 7</span>
                        <span className="hq-x-highlight">Chủ Nhật</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Distribution Progress Card */}
                  <div className="hq-card hq-distrib-card">
                    <div>
                      <div className="hq-card-header">
                        <div>
                          <h3 className="hq-card-title">Phân bổ câu hỏi</h3>
                          <div className="hq-card-subtitle">
                            Phân bố 2.450 câu theo 4 thời kỳ lịch sử
                          </div>
                        </div>
                        <FiBookOpen className="hq-callout-icon" />
                      </div>

                      <div className="hq-distrib-list">
                        {/* 1. Dựng nước & Giữ nước */}
                        <div>
                          <div className="hq-distrib-meta">
                            <span className="hq-distrib-label">Thời kỳ Dựng nước & Giữ nước</span>
                            <span className="hq-distrib-val-p1">25% (612 câu)</span>
                          </div>
                          <div className="hq-progress-track">
                            <div className="hq-progress-fill hq-progress-dung-nuoc" />
                          </div>
                        </div>

                        {/* 2. Kháng chiến Pháp */}
                        <div>
                          <div className="hq-distrib-meta">
                            <span className="hq-distrib-label">Kháng chiến chống thực dân Pháp</span>
                            <span className="hq-distrib-val-p2">35% (857 câu)</span>
                          </div>
                          <div className="hq-progress-track">
                            <div className="hq-progress-fill hq-progress-chong-phap" />
                          </div>
                        </div>

                        {/* 3. Kháng chiến Mỹ */}
                        <div>
                          <div className="hq-distrib-meta">
                            <span className="hq-distrib-label">Kháng chiến chống đế quốc Mỹ</span>
                            <span className="hq-distrib-val-p3">25% (612 câu)</span>
                          </div>
                          <div className="hq-progress-track">
                            <div className="hq-progress-fill hq-progress-chong-my" />
                          </div>
                        </div>

                        {/* 4. Cận - Hiện đại */}
                        <div>
                          <div className="hq-distrib-meta">
                            <span className="hq-distrib-label">Thời kỳ Cận - Hiện đại & Đổi mới</span>
                            <span className="hq-distrib-val-p4">15% (369 câu)</span>
                          </div>
                          <div className="hq-progress-track">
                            <div className="hq-progress-fill hq-progress-can-hien-dai" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="hq-insight-callout">
                      <FiHelpCircle className="hq-callout-icon" />
                      <div className="hq-callout-text">
                        Gợi ý: Cần bổ sung thêm 50 câu hỏi tư liệu cho phần{' '}
                        <strong className="hq-callout-strong">Cận - Hiện đại</strong> để cân bằng lộ trình quest.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Packages Table + Activity Timeline */}
                <div className="hq-bottom-row">
                  {/* Left Column: Recent Quiz Packages Table */}
                  <div className="hq-card">
                    <div className="hq-card-header">
                      <div>
                        <h3 className="hq-card-title">Gói câu hỏi mới cập nhật</h3>
                        <div className="hq-card-subtitle">
                          Lộ trình kiến thức và thử thách lịch sử mới nhất
                        </div>
                      </div>
                      <a
                        href="/admin/packages"
                        className="hq-link-viewall"
                        onClick={(event) => {
                          event.preventDefault();
                          goToNav('packages');
                        }}
                      >
                        <span>Xem tất cả</span>
                        <FiArrowRight />
                      </a>
                    </div>

                    <div className="hq-table-wrap">
                      <table className="hq-data-table">
                        <thead className="hq-table-head">
                          <tr>
                            <th>Tên gói thử thách</th>
                            <th>Quy mô</th>
                            <th>Trạng thái</th>
                            <th>Tỷ lệ đạt</th>
                            <th className="hq-actions-cell">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPackages.map((pkg) => (
                            <tr key={pkg.id} className="hq-table-row">
                              <td>
                                <div className="hq-package-title">{pkg.title}</div>
                                <div className="hq-package-date">{pkg.updatedAt}</div>
                              </td>
                              <td>
                                <span className="hq-scale-main">{pkg.sets}</span>
                                <span className="hq-scale-sub">• {pkg.questions}</span>
                              </td>
                              <td>
                                {pkg.status === 'active' ? (
                                  <span className="hq-badge-active">
                                    <span className="hq-badge-active-dot" /> Đang mở
                                  </span>
                                ) : (
                                  <span className="hq-badge-draft">
                                    <span className="hq-badge-draft-dot" /> Bản nháp
                                  </span>
                                )}
                              </td>
                              <td>
                                <span className="hq-pass-rate">{pkg.passRate}</span>
                              </td>
                              <td className="hq-actions-cell">
                                <button
                                  type="button"
                                  className="hq-btn-edit"
                                  onClick={() => goToNav('packages')}
                                >
                                  Chỉnh sửa
                                </button>
                                <button
                                  type="button"
                                  className="hq-btn-view"
                                  aria-label="Xem chi tiết"
                                  onClick={() => goToNav('packages')}
                                >
                                  <FiEye />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Column: Activity Timeline */}
                  <div className="hq-card">
                    <div className="hq-card-header">
                      <div>
                        <h3 className="hq-card-title">Nhật ký hoạt động</h3>
                        <div className="hq-card-subtitle">
                          Nhật ký thao tác và sự kiện hệ thống
                        </div>
                      </div>
                      <button
                        type="button"
                        className="hq-icon-button"
                        onClick={simulateReload}
                        aria-label="Refresh Timeline"
                      >
                        <FiRefreshCw />
                      </button>
                    </div>

                    <div className="hq-activity-list">
                      {mockActivities.map((act) => {
                        let iconBoxClass = 'hq-icon-purple';
                        let icon = <FiUploadCloud />;
                        if (act.type === 'achievement') {
                          iconBoxClass = 'hq-icon-amber';
                          icon = <FiAward />;
                        } else if (act.type === 'update') {
                          iconBoxClass = 'hq-icon-teal';
                          icon = <FiFolder />;
                        } else if (act.type === 'report') {
                          iconBoxClass = 'hq-icon-secondary';
                          icon = <FiCheckCircle />;
                        }

                        return (
                          <div key={act.id} className="hq-activity-item">
                            <div className={`hq-activity-icon-box ${iconBoxClass}`}>{icon}</div>
                            <div className="hq-activity-body">
                              <p className="hq-activity-text">
                                {act.prefix}{' '}
                                <span className={`hq-activity-target ${act.targetColor}`}>
                                  {act.target}
                                </span>
                              </p>
                              <div className="hq-activity-meta">{act.timeMeta}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* STATE 2: LOADING / SKELETON STATE */}
            {dashboardState === 'loading' && (
              <>
                <div className="hq-stats-grid">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="hq-stat-card hq-skeleton-card">
                      <div className="hq-skeleton-header">
                        <div className="hq-skeleton-shimmer hq-skeleton-line-sm" />
                        <div className="hq-skeleton-shimmer hq-skeleton-icon" />
                      </div>
                      <div className="hq-skeleton-shimmer hq-skeleton-line-lg" />
                      <div className="hq-skeleton-shimmer hq-skeleton-line-sub" />
                    </div>
                  ))}
                </div>

                <div className="hq-analytics-row">
                  <div className="hq-card">
                    <div className="hq-skeleton-shimmer hq-skeleton-line-sm" />
                    <div className="hq-skeleton-shimmer hq-skeleton-chart-box" />
                  </div>
                  <div className="hq-card">
                    <div className="hq-skeleton-shimmer hq-skeleton-line-sm" />
                    <div className="hq-skeleton-shimmer hq-skeleton-progress-row" />
                    <div className="hq-skeleton-shimmer hq-skeleton-progress-row" />
                    <div className="hq-skeleton-shimmer hq-skeleton-progress-row" />
                  </div>
                </div>
              </>
            )}

            {/* STATE 3: EMPTY STATE */}
            {dashboardState === 'empty' && (
              <div className="hq-state-message-card">
                <div className="hq-state-illustration-box">
                  <FiBookOpen />
                </div>
                <h2 className="hq-state-title">Chưa có dữ liệu thống kê</h2>
                <p className="hq-state-desc">
                  Hệ thống quản trị HISTORY QUEST chưa ghi nhận gói câu hỏi hoặc lượt làm bài nào trong giai đoạn này.
                  Hãy khởi tạo gói dữ liệu đầu tiên để xem thống kê.
                </p>
                <div className="hq-state-cta-group">
                  <button type="button" className="hq-btn-primary-tactile">
                    <FiPlus />
                    <span>Tạo gói câu hỏi đầu tiên</span>
                  </button>
                  <button
                    type="button"
                    className="hq-btn-secondary"
                    onClick={() => setDashboardState('default')}
                  >
                    Quay lại xem mẫu
                  </button>
                </div>
              </div>
            )}

            {/* STATE 4: ERROR STATE */}
            {dashboardState === 'error' && (
              <div className="hq-state-message-card error-card">
                <div className="hq-state-illustration-box error-box">
                  <FiWifiOff />
                </div>
                <h2 className="hq-state-title error-text">Lỗi đồng bộ dữ liệu quản trị</h2>
                <p className="hq-state-desc">
                  Không thể tải dữ liệu thời gian thực từ máy chủ HISTORY QUEST (Mã lỗi:{' '}
                  <span className="hq-error-code">ERR_503_SERVICE_UNAVAILABLE</span>). Vui lòng kiểm tra lại kết nối mạng hoặc thử lại.
                </p>
                <div className="hq-state-cta-group">
                  <button
                    type="button"
                    className="hq-btn-primary-tactile"
                    onClick={simulateReload}
                  >
                    <FiRefreshCw />
                    <span>Thử tải lại ngay</span>
                  </button>
                  <button
                    type="button"
                    className="hq-btn-secondary"
                    onClick={() => setDashboardState('default')}
                  >
                    Bỏ qua và xem bộ nhớ cache
                  </button>
                </div>
              </div>
            )}
              </>
            )}
          </div>

          {/* 5. MANDATORY FOOTER */}
          <footer className="hq-footer">
            <div className="hq-footer-inner">
              <div className="hq-footer-brand-side">
                <div className="hq-footer-brand-name">History Quest</div>
                <span className="hq-footer-divider">•</span>
                <div className="hq-footer-copyright">
                  © 2026 History Quest. Nền tảng học Lịch sử Việt Nam tương tác hàng đầu.
                </div>
              </div>
              <div className="hq-footer-links">
                <a href="#terms" className="hq-footer-link">Điều khoản sử dụng</a>
                <a href="#privacy" className="hq-footer-link">Chính sách bảo mật</a>
                <a href="#support" className="hq-footer-link">Liên hệ hỗ trợ</a>
                <a href="#missions" className="hq-footer-link">Hệ thống nhiệm vụ</a>
                <a href="#community" className="hq-footer-link">Cộng đồng học tập</a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
