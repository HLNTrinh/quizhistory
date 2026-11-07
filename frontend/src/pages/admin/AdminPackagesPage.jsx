// src/pages/admin/AdminPackagesPage.jsx
// Trang quản trị Gói câu hỏi — dựng trên khung AdminConsoleLayout (sidebar + topbar + footer giống Dashboard).
// Hiện tại là giao diện với dữ liệu mẫu, chưa gọi API.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Anchor,
  ArrowUpDown,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Landmark,
  Layers,
  Percent,
  Plus,
  ScrollText,
  Ship,
  Shield,
  SlidersHorizontal,
  Zap
} from "lucide-react";
import AdminConsoleLayout from "./AdminConsoleLayout.jsx";
import AdminTopActions from "./AdminTopActions.jsx";
import "./AdminPackages.css";

const numberFormat = new Intl.NumberFormat("vi-VN");
const percentFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

const TOTAL_PACKAGES = 24;

const packageStats = [
  {
    id: "total",
    label: "Tổng số gói",
    value: 24,
    unit: "Gói đề",
    icon: Layers,
    tone: "violet",
    legend: [
      { tone: "open", text: "18 Mở" },
      { tone: "draft", text: "4 Nháp" },
      { tone: "archived", text: "2 Lưu trữ" }
    ]
  },
  {
    id: "sets",
    label: "Bộ đề liên kết",
    value: 186,
    unit: "Bộ đề",
    icon: BookOpenCheck,
    tone: "blue",
    pill: "100% đạt chuẩn kiến thức",
    pillTone: "green",
    pillIcon: CheckCircle2
  },
  {
    id: "xp",
    label: "Tổng XP phân bố",
    value: 18500,
    unit: "XP",
    icon: Zap,
    tone: "amber",
    pill: "Kích thích học tập cao",
    pillTone: "amber",
    pillIcon: Zap
  },
  {
    id: "rate",
    label: "Tỷ lệ hoàn thành TB",
    value: 74.8,
    unit: "học viên",
    icon: Percent,
    tone: "green",
    format: "percent",
    percent: 74.8
  }
];

const difficultyOptions = [
  { value: "all", label: "Tất cả độ khó" },
  { value: "easy", label: "Cơ bản" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Nâng cao" }
];

const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "open", label: "Đang mở" },
  { value: "draft", label: "Bản nháp" },
  { value: "archived", label: "Lưu trữ" }
];

const sortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "mostSets", label: "Nhiều bộ đề nhất" },
  { value: "mostXp", label: "Điểm XP cao nhất" }
];

const difficultyMeta = {
  easy: { label: "Cơ bản", tone: "green" },
  medium: { label: "Trung bình", tone: "amber" },
  hard: { label: "Nâng cao", tone: "violet" }
};

const statusMeta = {
  open: { label: "Đang mở", badge: "is-open" },
  draft: { label: "Bản nháp", badge: "is-draft" },
  archived: { label: "Lưu trữ", badge: "is-archived" }
};

const initialPackages = [
  {
    id: "pk-01",
    name: "Chiến dịch Điện Biên Phủ 1954",
    period: "Kháng chiến chống Pháp (1945 - 1954)",
    description: "Tái hiện 56 ngày đêm khoét núi, ngủ hầm, mưa dầm cùng ý chí quyết chiến quyết thắng Điện Biên Phủ.",
    difficulty: "hard",
    icon: Flag,
    tone: "violet",
    setCount: 8,
    questionCount: 80,
    xp: 850,
    minutes: 40,
    status: "open",
    updatedAt: "14/02",
    sortDate: "2026-02-14"
  },
  {
    id: "pk-02",
    name: "Chiến dịch Hồ Chí Minh lịch sử 1975",
    period: "Kháng chiến chống Mỹ (1954 - 1975)",
    description: "Đại thắng mùa Xuân 1975 giải phóng hoàn toàn miền Nam, thống nhất non sông với chiến dịch Hồ Chí Minh.",
    difficulty: "hard",
    icon: Ship,
    tone: "green",
    setCount: 10,
    questionCount: 100,
    xp: 950,
    minutes: 45,
    status: "open",
    updatedAt: "12/02",
    sortDate: "2026-02-12"
  },
  {
    id: "pk-03",
    name: "Thời kỳ Dựng nước Văn Lang - Âu Lạc",
    period: "Thời kỳ Cổ đại Việt Nam",
    description: "Nguồn cội con Rồng cháu Tiên, 18 đời Hùng Vương và sự tích nỏ thần An Dương Vương.",
    difficulty: "easy",
    icon: Landmark,
    tone: "amber",
    setCount: 6,
    questionCount: 60,
    xp: 500,
    minutes: 25,
    status: "open",
    updatedAt: "10/02",
    sortDate: "2026-02-10"
  },
  {
    id: "pk-04",
    name: "Ba lần đại thắng quân Nguyên Mông",
    period: "Thời nhà Trần (1258 - 1288)",
    description: "Khí phách Trần Hưng Đạo với Hịch tướng sĩ, Hội nghị Diên Hồng và các cọc nhọn Bạch Đằng.",
    difficulty: "medium",
    icon: Shield,
    tone: "purple",
    setCount: 10,
    questionCount: 100,
    xp: 900,
    minutes: 45,
    status: "open",
    updatedAt: "08/02",
    sortDate: "2026-02-08"
  },
  {
    id: "pk-05",
    name: "Kháng chiến chống Tống - Lý Thường Kiệt",
    period: "Thời nhà Lý (1075 - 1077)",
    description: "Phòng tuyến sông Như Nguyệt kiên cố và bản tuyên ngôn độc lập đầu tiên “Nam quốc sơn hà”.",
    difficulty: "medium",
    icon: ScrollText,
    tone: "blue",
    setCount: 6,
    questionCount: 60,
    xp: 600,
    minutes: 30,
    status: "draft",
    updatedAt: "04/02",
    sortDate: "2026-02-04"
  },
  {
    id: "pk-06",
    name: "Chiến thắng Bạch Đằng 938",
    period: "Thời kỳ Bắc thuộc & Độc lập",
    description: "Trận thủy chiến lừng danh trên sông Bạch Đằng, chấm dứt hơn 1000 năm Bắc thuộc, mở ra kỷ nguyên độc lập.",
    difficulty: "easy",
    icon: Anchor,
    tone: "green",
    setCount: 6,
    questionCount: 60,
    xp: 600,
    minutes: 30,
    status: "open",
    updatedAt: "01/02",
    sortDate: "2026-02-01"
  }
];

export default function AdminPackagesPage({ admin, onLogout }) {
  const [query, setQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [unreadCount, setUnreadCount] = useState(3);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  function showToast(message) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3200);
  }

  function handleBellClick() {
    setUnreadCount(0);
    showToast("Đã đánh dấu toàn bộ thông báo là đã đọc.");
  }

  const filteredPackages = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const rows = initialPackages.filter((row) => {
      const matchKeyword = !keyword
        || row.name.toLowerCase().includes(keyword)
        || row.period.toLowerCase().includes(keyword)
        || row.description.toLowerCase().includes(keyword);
      const matchDifficulty = difficultyFilter === "all" || row.difficulty === difficultyFilter;
      const matchStatus = statusFilter === "all" || row.status === statusFilter;
      return matchKeyword && matchDifficulty && matchStatus;
    });

    const sorted = [...rows];
    if (sortOrder === "oldest") {
      sorted.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    } else if (sortOrder === "mostSets") {
      sorted.sort((a, b) => b.setCount - a.setCount);
    } else if (sortOrder === "mostXp") {
      sorted.sort((a, b) => b.xp - a.xp);
    } else {
      sorted.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
    }
    return sorted;
  }, [query, difficultyFilter, statusFilter, sortOrder]);

  return (
    <AdminConsoleLayout
      admin={admin}
      onLogout={onLogout}
      activePath="/admin/packages"
      breadcrumb="Quản trị / Quản lý gói câu hỏi"
      actions={
        <AdminTopActions
          admin={admin}
          onLogout={onLogout}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Tìm tên gói, thời kỳ lịch sử..."
          searchLabel="Tìm kiếm gói câu hỏi"
          unreadCount={unreadCount}
          onBellClick={handleBellClick}
        />
      }
      onFooterAction={(label) => showToast(`${label}: nội dung đang được hoàn thiện.`)}
    >
      <div className="adm-stat-grid">
        {packageStats.map((item) => {
          const Icon = item.icon;
          const PillIcon = item.pillIcon;
          return (
            <article className="adm-stat" key={item.id}>
              <div className="adm-stat-head">
                <p className="adm-stat-label">{item.label}</p>
                <span className={`adm-stat-icon is-${item.tone}`} aria-hidden="true">
                  <Icon size={18} />
                </span>
              </div>
              <p className="adm-stat-value">
                {item.format === "percent" ? percentFormat.format(item.value) : numberFormat.format(item.value)}
                <span>{item.unit}</span>
              </p>

              {item.legend ? (
                <div className="adm-pkg-stat-legend">
                  {item.legend.map((entry) => (
                    <span key={entry.text} className={`is-${entry.tone}`}>
                      <i aria-hidden="true" />
                      {entry.text}
                    </span>
                  ))}
                </div>
              ) : null}

              {item.percent !== undefined ? (
                <div className="adm-pkg-stat-progress">
                  <span className="adm-track">
                    <i
                      style={{
                        width: `${item.percent}%`,
                        background: "linear-gradient(90deg, #34d399, #10b981)"
                      }}
                    />
                  </span>
                  <small>trung bình trên toàn bộ gói đang mở</small>
                </div>
              ) : null}

              {item.pill ? (
                <div className="adm-stat-footer">
                  <span className={`adm-pill is-${item.pillTone}`}>
                    {PillIcon ? <PillIcon size={11} aria-hidden="true" /> : null} {item.pill}
                  </span>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <section className="adm-filter-bar" aria-label="Bộ lọc gói câu hỏi">
        <select
          className="adm-filter-select"
          value={difficultyFilter}
          onChange={(event) => setDifficultyFilter(event.target.value)}
          aria-label="Lọc theo độ khó"
        >
          {difficultyOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <select
          className="adm-filter-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Lọc theo trạng thái"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <button
          type="button"
          className="adm-icon-btn"
          onClick={() => showToast("Bộ lọc nâng cao (thời kỳ, số bộ đề) sẽ có ở bước nối API.")}
          aria-label="Bộ lọc nâng cao"
        >
          <SlidersHorizontal size={16} />
        </button>

        <div className="adm-filter-actions">
          <label className="adm-sort">
            <ArrowUpDown size={15} aria-hidden="true" />
            <span className="adm-sort-label">Sắp xếp thứ tự hiển thị</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              aria-label="Sắp xếp thứ tự hiển thị"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="adm-primary"
            onClick={() => showToast("Biểu mẫu tạo gói câu hỏi sẽ được nối API ở bước tiếp theo.")}
          >
            <Plus size={16} /> Tạo gói câu hỏi mới
          </button>
        </div>
      </section>

      <section className="adm-panel adm-panel-flush" aria-label="Danh sách gói câu hỏi">
        <div className="adm-table-wrap">
          <table className="adm-table adm-table-packages">
            <thead>
              <tr>
                <th scope="col">Ảnh</th>
                <th scope="col">Tên gói &amp; thời kỳ</th>
                <th scope="col">Mô tả tóm tắt</th>
                <th scope="col">Độ khó</th>
                <th scope="col">Số bộ đề</th>
                <th scope="col">Điểm &amp; lượng</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Ngày</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="adm-empty-row">
                    Không tìm thấy gói câu hỏi phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredPackages.map((row) => {
                  const ThumbIcon = row.icon;
                  const difficulty = difficultyMeta[row.difficulty];
                  const status = statusMeta[row.status];
                  return (
                    <tr key={row.id}>
                      <td>
                        <span className={`adm-pkg-thumb is-${row.tone}`} aria-hidden="true">
                          <ThumbIcon size={18} />
                        </span>
                      </td>
                      <td>
                        <span className="adm-pkg-name">
                          <strong>{row.name}</strong>
                          <small>
                            <Landmark size={11} aria-hidden="true" />
                            {row.period}
                          </small>
                        </span>
                      </td>
                      <td>
                        <p className="adm-pkg-desc">{row.description}</p>
                      </td>
                      <td>
                        <span className={`adm-diff-pill is-${difficulty.tone}`}>{difficulty.label}</span>
                      </td>
                      <td>
                        <span className="adm-pkg-count">
                          {row.setCount} Bộ đề
                          <small>{row.questionCount} Câu hỏi</small>
                        </span>
                      </td>
                      <td>
                        <span className="adm-pkg-points">
                          <strong>
                            <Zap size={11} aria-hidden="true" /> +{numberFormat.format(row.xp)} XP
                          </strong>
                          <small>~{row.minutes} phút</small>
                        </span>
                      </td>
                      <td>
                        <span className={`adm-badge ${status.badge}`}>
                          <i aria-hidden="true" />
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <span className="adm-pkg-date">{row.updatedAt}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="adm-table-foot">
          <span>
            Hiển thị <b>1 – {filteredPackages.length}</b> trong tổng số <b>{numberFormat.format(TOTAL_PACKAGES)}</b> gói câu hỏi
          </span>
          <div className="adm-pager">
            <button
              type="button"
              className="adm-pager-btn"
              onClick={() => showToast("Bạn đang ở trang đầu tiên.")}
              aria-label="Trang trước"
            >
              <ChevronLeft size={15} />
            </button>
            <button type="button" className="adm-pager-btn is-active" aria-current="page">1</button>
            <button type="button" className="adm-pager-btn" onClick={() => showToast("Phân trang sẽ được nối API ở bước tiếp theo.")}>2</button>
            <button type="button" className="adm-pager-btn" onClick={() => showToast("Phân trang sẽ được nối API ở bước tiếp theo.")}>3</button>
            <button type="button" className="adm-pager-btn" onClick={() => showToast("Phân trang sẽ được nối API ở bước tiếp theo.")}>4</button>
            <button
              type="button"
              className="adm-pager-btn"
              onClick={() => showToast("Phân trang sẽ được nối API ở bước tiếp theo.")}
              aria-label="Trang sau"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {toast ? (
        <div className="adm-toast" role="status">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      ) : null}
    </AdminConsoleLayout>
  );
}

