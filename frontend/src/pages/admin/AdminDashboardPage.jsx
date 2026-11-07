// src/pages/admin/AdminDashboardPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  FolderX,
  Lightbulb,
  MessageSquare,
  Package,
  Plus,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  TrendingUp,
  Users,
  X
} from "lucide-react";
import AdminConsoleLayout, { buildInitials } from "./AdminConsoleLayout.jsx";
import AdminTopActions from "./AdminTopActions.jsx";

const numberFormat = new Intl.NumberFormat("vi-VN");

const CHART_WIDTH = 700;
const CHART_HEIGHT = 180;

const demoStats = [
  {
    id: "users",
    label: "Tổng người dùng",
    value: 42850,
    unit: "",
    icon: Users,
    tone: "blue",
    pill: "+8.4%",
    pillTone: "green",
    note: "+1.240 học viên tuần này"
  },
  {
    id: "packages",
    label: "Tổng gói câu hỏi",
    value: 24,
    unit: "Gói",
    icon: Package,
    tone: "green",
    pill: "+ 4 gói",
    pillTone: "green",
    note: "đang xuất bản mới"
  },
  {
    id: "sets",
    label: "Tổng bộ câu hỏi",
    value: 186,
    unit: "Bộ",
    icon: ClipboardList,
    tone: "amber",
    pill: "98.5%",
    pillTone: "amber",
    note: "tỷ lệ hoàn thành tốt"
  },
  {
    id: "questions",
    label: "Tổng câu hỏi trắc nghiệm",
    value: 2450,
    unit: "Câu",
    icon: BookOpenCheck,
    tone: "purple",
    pill: "+150 câu",
    pillTone: "blue",
    note: "vừa thẩm định lịch sử"
  }
];

const chartSeries = {
  "7d": {
    labels: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"],
    attempts: [8200, 9100, 8600, 10400, 11200, 9800, 12400],
    users: [2100, 2400, 2300, 2900, 3200, 3100, 3800],
    peakLabel: "12.400"
  },
  "30d": {
    labels: ["01/10", "06/10", "11/10", "16/10", "21/10", "26/10", "31/10"],
    attempts: Array.from({ length: 30 }, (_, index) => 7600 + Math.round(2500 * Math.sin(index / 3.4)) + index * 80),
    users: Array.from({ length: 30 }, (_, index) => 1900 + Math.round(900 * Math.sin(index / 4.2)) + index * 45),
    peakLabel: "13.900"
  }
};

const demoDistribution = [
  { id: "period-1", name: "Thời kỳ Dựng nước & Giữ nước", percent: 25, count: 612, color: "#4c6ef5" },
  { id: "period-2", name: "Kháng chiến chống thực dân Pháp", percent: 35, count: 857, color: "#10b981" },
  { id: "period-3", name: "Kháng chiến chống đế quốc Mỹ", percent: 25, count: 612, color: "#8b5cf6" },
  { id: "period-4", name: "Thời kỳ Cận - Hiện đại & Đổi mới", percent: 15, count: 369, color: "#f5a524" }
];

const demoActivities = [
  {
    id: "activity-1",
    icon: PlusCircle,
    tone: "blue",
    before: "Admin Nguyễn Quốc Toàn vừa xuất bản ",
    highlight: "Bộ 08 Gói Điện Biên Phủ",
    after: "",
    meta: "10 phút trước • Thao tác quản trị"
  },
  {
    id: "activity-2",
    icon: Award,
    tone: "amber",
    before: "Hệ thống ghi nhận ",
    highlight: "1.500 lượt thi đua",
    after: " mở khoá huy hiệu học tập mới",
    meta: "35 phút trước • Thành tích người học"
  },
  {
    id: "activity-3",
    icon: FileText,
    tone: "green",
    before: "Cập nhật ngân hàng 20 câu hỏi tư liệu ",
    highlight: "trận Bạch Đằng Giang",
    after: "",
    meta: "2 giờ trước • Thẩm định dữ liệu"
  },
  {
    id: "activity-4",
    icon: MessageSquare,
    tone: "purple",
    before: "Kiểm tra báo cáo câu hỏi ",
    highlight: "#1042",
    after: " đã được xử lý và phản hồi",
    meta: "4 giờ trước • Góp ý người dùng"
  }
];

const initialStatePackages = [
  {
    id: "package-1",
    name: "Chiến dịch Điện Biên Phủ 1954",
    updatedLabel: "Cập nhật: 10 phút trước",
    setCount: 8,
    questionCount: 80,
    status: "open",
    passRate: 92
  },
  {
    id: "package-2",
    name: "Chiến dịch Hồ Chí Minh 1975",
    updatedLabel: "Cập nhật: Hôm qua",
    setCount: 10,
    questionCount: 100,
    status: "open",
    passRate: 88
  },
  {
    id: "package-3",
    name: "Ba lần đại thắng Nguyên Mông",
    updatedLabel: "Cập nhật: 2 ngày trước",
    setCount: 6,
    questionCount: 60,
    status: "draft",
    passRate: null
  },
  {
    id: "package-4",
    name: "Thời kỳ Hùng Vương & Văn Lang",
    updatedLabel: "Cập nhật: 3 ngày trước",
    setCount: 4,
    questionCount: 40,
    status: "open",
    passRate: 95
  }
];

const demoPeriods = demoDistribution.map((item) => item.name);

const emptyPackageForm = {
  name: "",
  period: demoPeriods[0],
  setCount: 6,
  questionCount: 60,
  status: "open"
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


export default function AdminDashboardPage({ admin, onLogout, onNavigate }) {
  const [viewState, setViewState] = useState("default");
  const [chartRange, setChartRange] = useState("7d");
  const [searchQuery, setSearchQuery] = useState("");
  const [packages, setPackages] = useState(initialStatePackages);
  const [unreadCount, setUnreadCount] = useState(3);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyPackageForm);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") setIsModalOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  function showToast(message) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3200);
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyPackageForm);
    setIsModalOpen(true);
  }

  function openEditModal(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      period: item.period || demoPeriods[0],
      setCount: item.setCount,
      questionCount: item.questionCount,
      status: item.status
    });
    setIsModalOpen(true);
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function simulateReload() {
    setViewState("loading");
    window.setTimeout(() => {
      setViewState("default");
      showToast("Đã làm mới số liệu tổng quan.");
    }, 900);
  }

  function handleBellClick() {
    setUnreadCount(0);
    showToast("Đã đánh dấu toàn bộ thông báo là đã đọc.");
  }

  const filteredPackages = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return packages;
    return packages.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [packages, searchQuery]);

  const series = chartSeries[chartRange];
  const chart = useMemo(() => {
    const maxValue = Math.max(...series.attempts, ...series.users) * 1.08;
    const attemptPoints = buildPoints(series.attempts, maxValue);
    const userPoints = buildPoints(series.users, maxValue);
    const attemptPath = smoothPath(attemptPoints);
    return {
      attemptPath,
      userPath: smoothPath(userPoints),
      areaPath: `${attemptPath} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`,
      dots: attemptPoints.filter(
        (_, index) => chartRange === "7d" || index % 5 === 0 || index === attemptPoints.length - 1
      )
    };
  }, [series, chartRange]);

  function handleSubmit(event) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      showToast("Vui lòng nhập tên gói câu hỏi trước khi lưu.");
      return;
    }

    if (editingId) {
      setPackages((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                name,
                period: form.period,
                setCount: Number(form.setCount) || 0,
                questionCount: Number(form.questionCount) || 0,
                status: form.status,
                updatedLabel: "Cập nhật: vừa xong"
              }
            : item
        )
      );
      showToast(`Đã cập nhật gói “${name}”.`);
    } else {
      setPackages((current) => [
        {
          id: `package-${Date.now()}`,
          name,
          period: form.period,
          setCount: Number(form.setCount) || 0,
          questionCount: Number(form.questionCount) || 0,
          status: form.status,
          passRate: null,
          updatedLabel: "Cập nhật: vừa xong"
        },
        ...current
      ]);
      showToast(`Đã tạo gói “${name}” (chế độ giao diện, chưa lưu máy chủ).`);
    }
    setIsModalOpen(false);
  }

  const topActions = (
    <AdminTopActions
      admin={admin}
      onLogout={onLogout}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
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
      {/* <div className="adm-page-head-row">
        <span className="adm-live-chip">
          <span className="adm-pulse" aria-hidden="true" /> Cập nhật trực tiếp: 2 phút trước
        </span>
        <div className="adm-user-chip">
          <span className="adm-user-avatar" aria-hidden="true">{buildInitials(admin?.name)}</span>
          <span className="adm-user-chip-text">
            <strong>{admin?.name || "Quản trị viên"}</strong>
            <small>Quản trị viên trường</small>
          </span>
        </div>
      </div> */}

      {viewState === "loading" ? (
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

      {viewState === "error" ? (
        <div className="adm-state-card is-error">
          <span className="adm-state-icon"><AlertTriangle size={30} /></span>
          <h2>Không tải được số liệu tổng quan</h2>
          <p>
            Máy chủ trả về ERR_503 (service unavailable). Bạn có thể thử tải lại hoặc xem dữ liệu đã lưu tạm
            trên trình duyệt.
          </p>
          <div className="adm-state-actions">
            <button type="button" className="adm-primary" onClick={simulateReload}>
              <RotateCcw size={15} /> Thử tải lại ngay
            </button>
            <button type="button" className="adm-ghost" onClick={() => setViewState("default")}>
              Bỏ qua và xem bộ nhớ cache
            </button>
          </div>
        </div>
      ) : null}

      {viewState === "empty" ? (
        <div className="adm-state-card is-empty">
          <span className="adm-state-icon"><FolderX size={30} /></span>
          <h2>Chưa có dữ liệu quản trị</h2>
          <p>
            Hệ thống chưa ghi nhận gói câu hỏi nào. Tạo gói đầu tiên để bắt đầu theo dõi lượt học và tỷ lệ đạt
            của học viên.
          </p>
          <div className="adm-state-actions">
            <button type="button" className="adm-primary" onClick={openCreateModal}>
              <Plus size={15} /> Tạo gói câu hỏi đầu tiên
            </button>
            <button type="button" className="adm-ghost" onClick={() => setViewState("default")}>
              Xem lại dữ liệu mẫu
            </button>
          </div>
        </div>
      ) : null}

      {viewState === "default" ? (
        <>
          <div className="adm-stat-grid">
            {demoStats.map((stat) => {
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

          <div className="adm-grid-main">
            <section className="adm-panel" aria-label="Tăng trưởng người học">
              <div className="adm-panel-head">
                <div className="adm-panel-title">
                  <h2>Tăng trưởng người học</h2>
                  <p>Số lượt làm bài và số khoản kích hoạt mới trong tuần</p>
                </div>
                <div className="adm-tab-group" role="group" aria-label="Chọn khoảng thời gian">
                  {[
                    { id: "7d", label: "7 ngày qua" },
                    { id: "30d", label: "30 ngày qua" }
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`adm-tab${chartRange === option.id ? " is-active" : ""}`}
                      onClick={() => setChartRange(option.id)}
                      aria-pressed={chartRange === option.id}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="adm-chart-meta">
                <div className="adm-legend">
                  <span><i style={{ background: "#6a5af9" }} /> Lượt hoàn thành đề thi</span>
                  <span><i className="is-dashed" /> Tài khoản kích hoạt mới</span>
                </div>
                <span>Đỉnh điểm: {series.peakLabel} lượt/ngày</span>
              </div>

              <div className="adm-chart-wrap">
                <svg
                  viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + 14}`}
                  role="img"
                  aria-label={`Biểu đồ tăng trưởng người học ${chartRange === "7d" ? "7" : "30"} ngày qua`}
                >
                  <defs>
                    <linearGradient id="admChartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6a5af9" stopOpacity="0.26" />
                      <stop offset="100%" stopColor="#6a5af9" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0, 1, 2, 3].map((line) => {
                    const y = (CHART_HEIGHT / 3) * line;
                    return (
                      <line key={line} x1="0" y1={y} x2={CHART_WIDTH} y2={y} stroke="#eeedf8" strokeWidth="1" />
                    );
                  })}
                  <path d={chart.areaPath} fill="url(#admChartGradient)" />
                  <path d={chart.attemptPath} fill="none" stroke="#6a5af9" strokeWidth="3" strokeLinecap="round" />
                  <path
                    d={chart.userPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                  />
                  {chart.dots.map(([x, y], index) => (
                    <circle
                      key={`${x}-${y}`}
                      cx={x}
                      cy={y}
                      r={index === chart.dots.length - 1 ? 6 : 4}
                      fill="#fff"
                      stroke="#6a5af9"
                      strokeWidth="3"
                    />
                  ))}
                </svg>
              </div>

              <div className="adm-chart-axis">
                {series.labels.map((label, index) => (
                  <span
                    key={label}
                    className={index === series.labels.length - 1 ? "is-last" : undefined}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </section>

            <section className="adm-panel" aria-label="Phân bổ câu hỏi">
              <div className="adm-panel-head">
                <div className="adm-panel-title">
                  <h2>Phân bổ câu hỏi</h2>
                  <p>Phân bố {numberFormat.format(2450)} câu theo 4 thời kỳ lịch sử</p>
                </div>
                <button
                  type="button"
                  className="adm-icon-btn"
                  onClick={() => showToast("Bộ lọc phân bổ câu hỏi sẽ có ở bước nối API.")}
                  aria-label="Bộ lọc phân bổ câu hỏi"
                >
                  <SlidersHorizontal size={16} />
                </button>
              </div>

              <div className="adm-dist-list">
                {demoDistribution.map((item) => (
                  <div className="adm-dist-item" key={item.id}>
                    <div className="adm-dist-row">
                      <span className="adm-dist-name">{item.name}</span>
                      <span className="adm-dist-value" style={{ color: item.color }}>
                        {item.percent}%<small>({numberFormat.format(item.count)} câu)</small>
                      </span>
                    </div>
                    <div className="adm-track">
                      <i style={{ width: `${item.percent}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="adm-hint">
                <Lightbulb size={16} />
                <span>
                  Gợi ý: Cần bổ sung thêm 50 câu hỏi tư liệu cho phần <b>Cận - Hiện đại</b> để cân bằng tổng
                  trọng số kiến thức.
                </span>
              </div>
            </section>

          </div>

          <div className="adm-grid-bottom">
            <section className="adm-panel" aria-label="Gói câu hỏi mới cập nhật">
              <div className="adm-panel-head">
                <div className="adm-panel-title">
                  <h3>Gói câu hỏi mới cập nhật</h3>
                  <p>Lộ trình kiến thức và thử thách lịch sử mới nhất</p>
                </div>
                <button type="button" className="adm-link-btn" onClick={() => onNavigate("/admin/packages")}>
                  Xem tất cả <ArrowRight size={13} style={{ verticalAlign: "-2px" }} />
                </button>
              </div>

              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th scope="col">Tên gói thử thách</th>
                      <th scope="col">Quy mô</th>
                      <th scope="col">Trạng thái</th>
                      <th scope="col">Tỷ lệ đạt</th>
                      <th scope="col">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPackages.length === 0 ? (
                      <tr>
                        <td className="adm-empty-row" colSpan={5}>
                          Không tìm thấy gói câu hỏi nào khớp với “{searchQuery.trim()}”.
                        </td>
                      </tr>
                    ) : (
                      filteredPackages.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <span className="adm-pkg-name">
                              <strong>{item.name}</strong>
                              <small>{item.updatedLabel}</small>
                            </span>
                          </td>
                          <td>
                            {numberFormat.format(item.setCount)} bộ • {numberFormat.format(item.questionCount)} câu
                          </td>
                          <td>
                            <span className={`adm-badge ${item.status === "open" ? "is-open" : "is-draft"}`}>
                              <i aria-hidden="true" />
                              {item.status === "open" ? "Đang mở" : "Bản nháp"}
                            </span>
                          </td>
                          <td>{formatPassRate(item.passRate)}</td>
                          <td>
                            <span className="adm-table-actions">
                              <button type="button" className="adm-link-btn" onClick={() => openEditModal(item)}>
                                Chỉnh sửa
                              </button>
                              <button
                                type="button"
                                className="adm-eye-btn"
                                onClick={() => onNavigate("/admin/packages")}
                                aria-label={`Xem chi tiết gói ${item.name}`}
                              >
                                <Eye size={15} />
                              </button>
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="adm-panel" aria-label="Nhật ký hoạt động">
              <div className="adm-panel-head">
                <div className="adm-panel-title">
                  <h3>Nhật ký hoạt động</h3>
                  <p>Nhật ký thao tác và sự kiện hệ thống</p>
                </div>
                <button
                  type="button"
                  className="adm-icon-btn"
                  onClick={() => showToast("Nhật ký hoạt động đã được làm mới (dữ liệu mẫu).")}
                  aria-label="Làm mới nhật ký hoạt động"
                >
                  <RefreshCw size={15} />
                </button>
              </div>

              <div className="adm-activity">
                {demoActivities.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article className="adm-activity-item" key={item.id}>
                      <span className={`adm-activity-icon is-${item.tone}`}><Icon size={17} /></span>
                      <p className="adm-activity-text">
                        {item.before}
                        <b>{item.highlight}</b>
                        {item.after}
                        <span className="adm-activity-meta">{item.meta}</span>
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

        </>
      ) : null}

      {isModalOpen ? (
        <div className="adm-modal-overlay" role="presentation" onClick={() => setIsModalOpen(false)}>
          <form
            className="adm-modal"
            onSubmit={handleSubmit}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="adm-modal-title"
          >
            <div className="adm-modal-head">
              <div>
                <h2 id="adm-modal-title">{editingId ? "Chỉnh sửa gói câu hỏi" : "Tạo gói câu hỏi mới"}</h2>
                <p>Giao diện mẫu — dữ liệu chưa được lưu lên máy chủ.</p>
              </div>
              <button type="button" className="adm-modal-close" onClick={() => setIsModalOpen(false)} aria-label="Đóng hộp thoại">
                <X size={16} />
              </button>
            </div>

            <div className="adm-modal-body">
              <div className="adm-field">
                <label htmlFor="adm-pkg-name">Tên gói thử thách</label>
                <input
                  id="adm-pkg-name"
                  className="adm-input"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="Ví dụ: Chiến dịch Điện Biên Phủ 1954"
                  autoFocus
                />
              </div>

              <div className="adm-field">
                <label htmlFor="adm-pkg-period">Thời kỳ lịch sử</label>
                <select
                  id="adm-pkg-period"
                  className="adm-select"
                  value={form.period}
                  onChange={(event) => updateForm("period", event.target.value)}
                >
                  {demoPeriods.map((period) => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
              </div>

              <div className="adm-field-row">
                <div className="adm-field">
                  <label htmlFor="adm-pkg-sets">Số bộ đề</label>
                  <input
                    id="adm-pkg-sets"
                    type="number"
                    min="0"
                    className="adm-input"
                    value={form.setCount}
                    onChange={(event) => updateForm("setCount", event.target.value)}
                  />
                </div>
                <div className="adm-field">
                  <label htmlFor="adm-pkg-questions">Số câu trắc nghiệm</label>
                  <input
                    id="adm-pkg-questions"
                    type="number"
                    min="0"
                    className="adm-input"
                    value={form.questionCount}
                    onChange={(event) => updateForm("questionCount", event.target.value)}
                  />
                </div>
              </div>

              <div className="adm-field">
                <label htmlFor="adm-pkg-status">Trạng thái xuất bản</label>
                <select
                  id="adm-pkg-status"
                  className="adm-select"
                  value={form.status}
                  onChange={(event) => updateForm("status", event.target.value)}
                >
                  <option value="open">Đang mở</option>
                  <option value="draft">Bản nháp</option>
                </select>
                <span className="adm-field-hint">Bản nháp sẽ không hiển thị với học viên ở cổng học tập.</span>
              </div>
            </div>

            <div className="adm-modal-foot">
              <button type="button" className="adm-ghost" onClick={() => setIsModalOpen(false)}>Hủy bỏ</button>
              <button type="submit" className="adm-primary">
                {editingId ? "Lưu thay đổi" : "Tạo gói ngay"}
              </button>
            </div>
          </form>
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

