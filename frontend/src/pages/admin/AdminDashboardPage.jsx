// src/pages/admin/AdminDashboardPage.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Eye,
  FolderX,
  Lightbulb,
  Package,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  TrendingUp,
  UserPlus,
  Users
} from "lucide-react";
import AdminConsoleLayout from "./AdminConsoleLayout.jsx";
import AdminTopActions from "./AdminTopActions.jsx";
import { adminApi } from "../../lib/api.js";

const numberFormat = new Intl.NumberFormat("vi-VN");

const CHART_WIDTH = 700;
const CHART_HEIGHT = 180;

// Chuỗi rỗng dùng khi chưa tải xong hoặc khoảng thời gian không có dữ liệu.
const EMPTY_SERIES = { labels: [], attempts: [], users: [], peak: 0 };

const PACKAGE_STATUS = {
  active: { label: "Đang mở", className: "is-open" },
  draft: { label: "Bản nháp", className: "is-draft" },
  inactive: { label: "Tạm ẩn", className: "is-draft" }
};

const ACTIVITY_ICONS = {
  user: UserPlus,
  attempt: Award,
  package: PlusCircle
};

function buildPoints(values, maxValue) {
  const safeMax = Math.max(maxValue, 1);
  const stepX = values.length > 1 ? CHART_WIDTH / (values.length - 1) : CHART_WIDTH;
  return values.map((value, index) => [
    index * stepX,
    CHART_HEIGHT - (value / safeMax) * (CHART_HEIGHT - 12)
  ]);
}

function smoothPath(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;
  let path = `M ${points[0][0]} ${points[0][1]}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] || points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] || p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2[0]} ${p2[1]}`;
  }
  return path;
}

function formatPassRate(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${value}%`;
}

// Nhãn thời gian tương đối cho cột "Cập nhật" của bảng gói câu hỏi.
function formatRelative(value) {
  if (!value) return "--";
  const elapsed = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(elapsed / 60000));
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric"
  }).format(new Date(value));
}

export default function AdminDashboardPage({ admin, onLogout, onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState(null);
  const [chartRange, setChartRange] = useState("7d");
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const requestRef = useRef(null);
  const hasDataRef = useRef(false);

  useEffect(() => () => {
    window.clearTimeout(toastTimer.current);
    requestRef.current?.abort();
  }, []);

  function showToast(message) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3200);
  }

  // Tải toàn bộ số liệu tổng quan từ API quản trị (không còn dữ liệu mẫu).
  const loadOverview = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoadError(null);

    try {
      const payload = await adminApi("/admin/overview", { signal: controller.signal });
      if (controller.signal.aborted) return { ok: false };
      hasDataRef.current = true;
      setDashboard(payload);
      setLoadState("ready");
      setUnreadCount(Array.isArray(payload.activities) ? payload.activities.length : 0);
      return { ok: true };
    } catch (error) {
      if (controller.signal.aborted) return { ok: false };
      setLoadError(error);
      if (!hasDataRef.current) setLoadState("error");
      return { ok: false, error };
    }
  }, []);

  useEffect(() => {
    setLoadState("loading");
    loadOverview();
  }, [loadOverview]);

  async function handleRefresh() {
    const result = await loadOverview();
    if (result.ok) {
      showToast("Đã làm mới số liệu tổng quan.");
    } else if (result.error) {
      showToast(`Không làm mới được số liệu: ${result.error.message}`);
    }
  }

  function handleBellClick() {
    setUnreadCount(0);
    showToast("Đã đánh dấu toàn bộ thông báo là đã đọc.");
  }

  const totals = dashboard?.totals;
  const series = dashboard?.growth?.[chartRange] || EMPTY_SERIES;
  const distribution = dashboard?.distribution || [];
  const latestPackages = dashboard?.latestPackages || [];
  const activities = dashboard?.activities || [];
  const isEmpty = loadState === "ready" && totals && totals.packages === 0;

  const statCards = useMemo(() => {
    if (!totals) return [];
    return [
      {
        id: "users",
        label: "Tổng người dùng",
        value: totals.users,
        unit: "",
        icon: Users,
        tone: "blue",
        pill: `+${numberFormat.format(totals.newUsers7d)}`,
        pillTone: "green",
        note: "tài khoản mới trong 7 ngày"
      },
      {
        id: "packages",
        label: "Tổng gói câu hỏi",
        value: totals.packages,
        unit: "Gói",
        icon: Package,
        tone: "green",
        pill: `${numberFormat.format(totals.activePackages)} mở`,
        pillTone: "green",
        note: "đang xuất bản cho học viên"
      },
      {
        id: "sets",
        label: "Tổng bộ câu hỏi",
        value: totals.questionSets,
        unit: "Bộ",
        icon: ClipboardList,
        tone: "amber",
        pill: `${numberFormat.format(totals.activeQuestionSets)} bộ`,
        pillTone: "amber",
        note: `trên ${numberFormat.format(totals.packages)} gói câu hỏi`
      },
      {
        id: "questions",
        label: "Tổng câu hỏi trắc nghiệm",
        value: totals.questions,
        unit: "Câu",
        icon: BookOpenCheck,
        tone: "purple",
        pill: `${numberFormat.format(totals.completedAttempts)} lượt`,
        pillTone: "blue",
        note: "bài thi đã hoàn thành"
      }
    ];
  }, [totals]);

  const chart = useMemo(() => {
    const maxValue = Math.max(1, ...series.attempts, ...series.users) * 1.08;
    const attemptPoints = buildPoints(series.attempts, maxValue);
    const userPoints = buildPoints(series.users, maxValue);
    const attemptPath = smoothPath(attemptPoints);
    return {
      attemptPath,
      userPath: smoothPath(userPoints),
      areaPath: attemptPath ? `${attemptPath} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z` : "",
      dots: attemptPoints.filter(
        (_, index) => chartRange === "7d" || index % 5 === 0 || index === attemptPoints.length - 1
      )
    };
  }, [series, chartRange]);

  const filteredPackages = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return latestPackages;
    return latestPackages.filter((item) => (
      item.name.toLowerCase().includes(keyword)
      || String(item.category || "").toLowerCase().includes(keyword)
    ));
  }, [latestPackages, searchQuery]);

  // Chủ đề có tỷ trọng câu hỏi thấp nhất dùng cho gợi ý cân bằng nội dung.
  const weakestCategory = useMemo(() => {
    if (!distribution.length) return null;
    return distribution.reduce(
      (lowest, item) => (item.percent < lowest.percent ? item : lowest),
      distribution[0]
    );
  }, [distribution]);

  const topActions = (
    <AdminTopActions
      admin={admin}
      onLogout={onLogout}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Tìm gói câu hỏi vừa cập nhật..."
      searchLabel="Tìm gói câu hỏi trong trang tổng quan"
      unreadCount={unreadCount}
      onBellClick={handleBellClick}
    />
  );

  return (
    <AdminConsoleLayout
      admin={admin}
      onLogout={onLogout}
      onNavigate={onNavigate}
      activePath="/admin"
      breadcrumb="Tổng quan hệ thống"
      actions={topActions}
      onFooterAction={(label) => showToast(`${label}: nội dung đang được hoàn thiện.`)}
    >
      {loadState === "loading" && !dashboard ? (
        <>
          <div className="adm-stat-grid">
            {[0, 1, 2, 3].map((key) => (
              <div className="adm-stat" key={key}>
                <div className="adm-skeleton" style={{ height: 14, width: "60%" }} />
                <div className="adm-skeleton" style={{ height: 28, width: "45%" }} />
                <div className="adm-skeleton" style={{ height: 12, width: "70%" }} />
              </div>
            ))}
          </div>
          <div className="adm-grid-main">
            <div className="adm-panel">
              <div className="adm-skeleton" style={{ height: 16, width: "40%" }} />
              <div className="adm-skeleton" style={{ height: 220, marginTop: 16 }} />
            </div>
            <div className="adm-panel">
              <div className="adm-skeleton" style={{ height: 16, width: "50%" }} />
              <div className="adm-skeleton" style={{ height: 200, marginTop: 16 }} />
            </div>
          </div>
        </>
      ) : null}

      {loadState === "error" && !dashboard ? (
        <div className="adm-state-card is-error">
          <span className="adm-state-icon"><AlertTriangle size={30} /></span>
          <h2>Không tải được số liệu tổng quan</h2>
          <p>
            {loadError?.message || "Không thể kết nối đến máy chủ API quản trị."}
            {" "}Vui lòng kiểm tra backend và kết nối cơ sở dữ liệu rồi thử lại.
          </p>
          <div className="adm-state-actions">
            <button type="button" className="adm-primary" onClick={handleRefresh}>
              <RotateCcw size={15} /> Thử tải lại ngay
            </button>
            {loadError?.status === 401 ? (
              <button type="button" className="adm-ghost" onClick={onLogout}>
                Đăng nhập lại
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {totals ? (
        <>
          <div className="adm-stat-grid">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <article className="adm-stat" key={stat.id}>
                  <div className="adm-stat-head">
                    <span className="adm-stat-label">{stat.label}</span>
                    <span className={`adm-stat-icon is-${stat.tone}`}><Icon size={18} /></span>
                  </div>
                  <p className="adm-stat-value">
                    {numberFormat.format(stat.value)}
                    {stat.unit ? <span>{stat.unit}</span> : null}
                  </p>
                  <div className="adm-stat-footer">
                    <span className={`adm-pill is-${stat.pillTone}`}>
                      <TrendingUp size={11} /> {stat.pill}
                    </span>
                    <span>{stat.note}</span>
                  </div>
                </article>
              );
            })}
          </div>

          {isEmpty ? (
            <div className="adm-state-card is-empty">
              <span className="adm-state-icon"><FolderX size={30} /></span>
              <h2>Chưa có dữ liệu quản trị</h2>
              <p>
                Hệ thống chưa ghi nhận gói câu hỏi nào. Tạo gói đầu tiên để bắt đầu theo dõi lượt học và
                tỷ lệ đạt của học viên.
              </p>
              <div className="adm-state-actions">
                <button type="button" className="adm-primary" onClick={() => onNavigate("/admin/packages")}>
                  <PlusCircle size={15} /> Tạo gói câu hỏi đầu tiên
                </button>
                <button type="button" className="adm-ghost" onClick={handleRefresh}>
                  <RefreshCw size={15} /> Tải lại số liệu
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {totals && !isEmpty ? (
        <div className="adm-grid-main">
          <section className="adm-panel">
            <header className="adm-panel-head">
              <div className="adm-panel-title">
                <h2>Tăng trưởng người dùng</h2>
                <p>Lượt làm bài hoàn thành và tài khoản học viên đăng ký mới</p>
              </div>
              <div className="adm-tab-group" role="group" aria-label="Chọn khoảng thời gian">
                {[
                  { id: "7d", label: "7 ngày" },
                  { id: "30d", label: "30 ngày" }
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`adm-tab${chartRange === option.id ? " is-active" : ""}`}
                    onClick={() => setChartRange(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </header>

            <div className="adm-chart-meta">
              <div className="adm-legend">
                <span><i className="is-blue" style={{ background: "#4f7dfb" }} /> Lượt làm bài</span>
                <span><i className="is-dashed" /> Học viên mới</span>
              </div>
              <span>Đỉnh điểm {numberFormat.format(series.peak)} lượt/ngày • Độ chính xác TB {numberFormat.format(totals.avgAccuracy)}%</span>
            </div>

            {series.attempts.length ? (
              <div className="adm-chart-wrap">
                <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none" role="img"
                  aria-label={`Biểu đồ tăng trưởng ${chartRange === "7d" ? "7" : "30"} ngày gần nhất`}>
                  <defs>
                    <linearGradient id="adminOverviewFade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f7dfb" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#4f7dfb" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {chart.areaPath ? <path d={chart.areaPath} fill="url(#adminOverviewFade)" /> : null}
                  {chart.userPath ? (
                    <path d={chart.userPath} fill="none" stroke="#41c98a" strokeWidth="2"
                      strokeDasharray="6 5" strokeLinecap="round" />
                  ) : null}
                  {chart.attemptPath ? (
                    <path d={chart.attemptPath} fill="none" stroke="#4f7dfb" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round" />
                  ) : null}
                  {chart.dots.map(([x, y], index) => (
                    <circle key={index} cx={x} cy={y} r="3.4" fill="#ffffff" stroke="#4f7dfb" strokeWidth="2" />
                  ))}
                </svg>
                <div className="adm-chart-axis">
                  {series.labels.map((label, index) => (
                    <span
                      key={`${label}-${index}`}
                      className={index === series.labels.length - 1 ? "is-last" : ""}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="adm-empty-row">Chưa có dữ liệu lượt làm bài trong khoảng thời gian này.</p>
            )}
          </section>

          <section className="adm-panel">
            <header className="adm-panel-head">
              <div className="adm-panel-title">
                <h2>Phân bổ câu hỏi theo chủ đề</h2>
                <p>{numberFormat.format(totals.questions)} câu hỏi trong {numberFormat.format(totals.categories)} chủ đề</p>
              </div>
            </header>

            {distribution.length ? (
              <>
                <div className="adm-dist-list">
                  {distribution.map((item) => (
                    <div className="adm-dist-item" key={item.id}>
                      <div className="adm-dist-row">
                        <span className="adm-dist-name">{item.name}</span>
                        <span className="adm-dist-value">
                          {item.percent}% <small>{numberFormat.format(item.count)} câu</small>
                        </span>
                      </div>
                      <div className="adm-track">
                        <i style={{ width: `${Math.max(item.percent, 2)}%`, background: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="adm-hint" style={{ marginTop: 16 }}>
                  <Lightbulb size={16} />
                  <span>
                    {weakestCategory && weakestCategory.percent < 25
                      ? `Gợi ý: chủ đề ${weakestCategory.name} chỉ chiếm ${weakestCategory.percent}% (${numberFormat.format(weakestCategory.count)} câu), nên bổ sung thêm câu hỏi để cân bằng.`
                      : `Nội dung đang phân bổ khá đều giữa ${distribution.length} chủ đề, tiếp tục duy trì khi thêm câu hỏi mới.`}
                  </span>
                </div>
              </>
            ) : (
              <p className="adm-empty-row">Chưa có câu hỏi nào được gắn với chủ đề để thống kê phân bổ.</p>
            )}
          </section>
        </div>
      ) : null}

      {totals && !isEmpty ? (
        <div className="adm-grid-bottom">
          <section className="adm-panel adm-panel-flush">
            <header className="adm-panel-head" style={{ padding: "18px 20px 0" }}>
              <div className="adm-panel-title">
                <h2>Gói câu hỏi mới cập nhật</h2>
                <p>{numberFormat.format(totals.packages)} gói • {numberFormat.format(totals.activePackages)} đang mở</p>
              </div>
              <button type="button" className="adm-link-btn" onClick={() => onNavigate("/admin/packages")}>
                Xem tất cả <ArrowRight size={13} />
              </button>
            </header>

            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Gói câu hỏi</th>
                    <th>Quy mô</th>
                    <th>Trạng thái</th>
                    <th>Tỷ lệ đạt</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredPackages.length ? filteredPackages.map((item) => {
                    const status = PACKAGE_STATUS[item.status] || PACKAGE_STATUS.inactive;
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="adm-pkg-name">
                            <strong>{item.name}</strong>
                            <small>{item.category} • Cập nhật {formatRelative(item.updatedAt)}</small>
                          </div>
                        </td>
                        <td>{numberFormat.format(item.setCount)} bộ • {numberFormat.format(item.questionCount)} câu</td>
                        <td>
                          <span className={`adm-badge ${status.className}`}>
                            <i /> {status.label}
                          </span>
                        </td>
                        <td>{formatPassRate(item.passRate)}</td>
                        <td>
                          <div className="adm-table-actions">
                            <button
                              type="button"
                              className="adm-eye-btn"
                              title="Quản lý gói câu hỏi"
                              aria-label={`Quản lý gói ${item.name}`}
                              onClick={() => onNavigate("/admin/packages")}
                            >
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5}>
                        <p className="adm-empty-row">
                          {searchQuery.trim()
                            ? `Không tìm thấy gói câu hỏi nào khớp "${searchQuery.trim()}".`
                            : "Chưa có gói câu hỏi nào để hiển thị."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="adm-table-foot">
              <span>
                Hiển thị <b>{filteredPackages.length}</b> / {numberFormat.format(latestPackages.length)} gói mới nhất
              </span>
              <button type="button" className="adm-link-btn" onClick={handleRefresh}>
                <RefreshCw size={13} /> Làm mới số liệu
              </button>
            </div>
          </section>

          <section className="adm-panel">
            <header className="adm-panel-head">
              <div className="adm-panel-title">
                <h2>Hoạt động gần đây</h2>
                <p>Tổng hợp từ đăng ký, lượt làm bài và cập nhật nội dung</p>
              </div>
              <button type="button" className="adm-link-btn" onClick={handleRefresh}>
                <RefreshCw size={13} /> Làm mới
              </button>
            </header>

            <div className="adm-activity">
              {activities.length ? activities.map((item) => {
                const Icon = ACTIVITY_ICONS[item.type] || PlusCircle;
                return (
                  <div className="adm-activity-item" key={item.id}>
                    <span className={`adm-activity-icon is-${item.tone}`}><Icon size={17} /></span>
                    <div>
                      <p className="adm-activity-text">
                        {item.before}<b>{item.highlight}</b>{item.after}
                      </p>
                      <span className="adm-activity-meta">{item.meta}</span>
                    </div>
                  </div>
                );
              }) : (
                <p className="adm-empty-row">Chưa có hoạt động nào được ghi nhận trên hệ thống.</p>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {toast ? (
        <div className="adm-toast" role="status">
          <CheckCircle2 size={16} /> {toast}
        </div>
      ) : null}
    </AdminConsoleLayout>
  );
}
