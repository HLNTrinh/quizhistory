// src/pages/admin/AdminQuestionSetsPage.jsx
// Trang quản trị Bộ câu hỏi — dựng trên khung AdminConsoleLayout (sidebar + topbar + footer giống Dashboard).
// Hiện tại là giao diện với dữ liệu mẫu, chưa gọi API.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderOpen,
  Hourglass,
  Info,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Workflow
} from "lucide-react";
import AdminConsoleLayout from "./AdminConsoleLayout.jsx";
import AdminTopActions from "./AdminTopActions.jsx";
import "./AdminQuestionSets.css";

const numberFormat = new Intl.NumberFormat("vi-VN");
const percentFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

const TOTAL_SETS = 8;
const CURRENT_PACKAGE = "Chiến dịch Điện Biên Phủ";

const questionSetStats = [
  {
    id: "total",
    label: "Tổng số bộ câu hỏi",
    value: 186,
    unit: "Bộ",
    icon: FolderOpen,
    tone: "violet",
    legend: [
      { tone: "open", text: "172 Đang mở" },
      { tone: "draft", text: "14 Bản nháp" }
    ]
  },
  {
    id: "avgQuestions",
    label: "TB câu hỏi / bộ",
    value: 10,
    unit: "Câu",
    icon: Hourglass,
    tone: "amber",
    note: "Chuẩn thời lượng 10 – 15 phút ôn",
    noteIcon: Clock
  },
  {
    id: "sequential",
    label: "Điều kiện tuần tự",
    value: 100,
    unit: "%",
    icon: Lock,
    tone: "green",
    pill: "Khóa tuần tự nghiêm ngặt",
    pillTone: "green",
    pillIcon: Lock
  },
  {
    id: "passRate",
    label: "Tỷ lệ vượt qua TB",
    value: 82.4,
    unit: "%",
    icon: Award,
    tone: "amber",
    format: "percent",
    note: "Học viên đạt mốc xuất sắc",
    noteIcon: Info
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
  { value: "locked", label: "Tạm khóa" }
];

const sortOptions = [
  { value: "order", label: "Thứ tự chặng" },
  { value: "newest", label: "Mới cập nhật" },
  { value: "mostQuestions", label: "Nhiều câu hỏi nhất" },
  { value: "hardest", label: "Độ khó tăng dần" }
];

const difficultyMeta = {
  easy: { label: "Cơ bản", tone: "green", rank: 1 },
  medium: { label: "Trung bình", tone: "amber", rank: 2 },
  hard: { label: "Nâng cao", tone: "violet", rank: 3 }
};

const initialQuestionSets = [
  {
    id: "qs-01",
    order: 1,
    legCode: "DBP-STG-01",
    name: "Kéo pháo vào trận địa & Hậu cần chuẩn bị",
    description: "Hậu cần gian khổ, mở đường huyết mạch vận chuyển lương thực, vũ khí tới trận địa.",
    parentPackage: CURRENT_PACKAGE,
    term: "Kỳ 1954",
    unlock: "Mở tự động (Chặng đầu)",
    difficulty: "easy",
    questionCount: 10,
    questionType: "Trắc nghiệm",
    status: "open",
    sortDate: "2026-02-14"
  },
  {
    id: "qs-02",
    order: 2,
    legCode: "DBP-STG-02",
    name: "Tiêu diệt cụm cứ điểm Him Lam",
    description: "Trận mở màn đợt 1, tấm gương anh hùng Phan Đình Giót lấy thân mình lấp lỗ châu mai.",
    parentPackage: CURRENT_PACKAGE,
    term: "Kỳ 1954",
    unlock: "Hoàn thành Bộ #01 (≥ 80% điểm)",
    difficulty: "easy",
    questionCount: 10,
    questionType: "Trắc nghiệm",
    status: "open",
    sortDate: "2026-02-13"
  },
  {
    id: "qs-03",
    order: 3,
    legCode: "DBP-STG-03",
    name: "Cứ điểm Độc Lập & Bản Kéo",
    description: "Hạ cứ điểm Độc Lập trong đêm, bức hàng quân địch ở Bản Kéo, mở rộng khu vực kiểm soát.",
    parentPackage: CURRENT_PACKAGE,
    term: "Kỳ 1954",
    unlock: "Hoàn thành Bộ #02 (≥ 80% điểm)",
    difficulty: "medium",
    questionCount: 10,
    questionType: "Trắc nghiệm",
    status: "open",
    sortDate: "2026-02-12"
  },
  {
    id: "qs-04",
    order: 4,
    legCode: "DBP-STG-04",
    name: "Chiến sự đồi C1 & Cắt đứt sân bay Mường Thanh",
    description: "Giao tranh ác liệt từng tấc đất trên đồi C1, hỏa lực ta khống chế hoàn toàn sân bay địch.",
    parentPackage: CURRENT_PACKAGE,
    term: "Kỳ 1954",
    unlock: "Hoàn thành Bộ #03 (≥ 80% điểm)",
    difficulty: "medium",
    questionCount: 10,
    questionType: "Trắc nghiệm",
    status: "open",
    sortDate: "2026-02-11"
  },
  {
    id: "qs-05",
    order: 5,
    legCode: "DBP-STG-05",
    name: "Đợt tổng công kích tiêu diệt tập đoàn cứ điểm",
    description: "Khối bộc phá nghìn cân phát nổ tại đồi A1, mở màn đợt công kích cuối cùng của chiến dịch.",
    parentPackage: CURRENT_PACKAGE,
    term: "Kỳ 1954",
    unlock: "Hoàn thành Bộ #04 (≥ 80% điểm)",
    difficulty: "hard",
    questionCount: 10,
    questionType: "Trắc nghiệm",
    status: "open",
    sortDate: "2026-02-10"
  },
  {
    id: "qs-06",
    order: 6,
    legCode: "DBP-STG-06",
    name: "Bắt sống tướng De Castries & Toàn thắng Điện Biên",
    description: "Lá cờ quyết chiến quyết thắng tung bay trên hầm tướng địch, kết thúc thắng lợi chiến dịch.",
    parentPackage: CURRENT_PACKAGE,
    term: "Kỳ 1954",
    unlock: "Hoàn thành Bộ #05 (≥ 80% điểm)",
    difficulty: "hard",
    questionCount: 10,
    questionType: "Trắc nghiệm",
    status: "open",
    sortDate: "2026-02-09"
  },
  {
    id: "qs-07",
    order: 7,
    legCode: "DBP-STG-07",
    name: "Hiệp định Genève & Rút quân tập kết",
    description: "Những điều khoản cơ bản của Hiệp định Genève 1954 và công cuộc chuyển quân tập kết.",
    parentPackage: CURRENT_PACKAGE,
    term: "Kỳ 1954",
    unlock: "Hoàn thành Bộ #06 (≥ 80% điểm)",
    difficulty: "medium",
    questionCount: 10,
    questionType: "Trắc nghiệm",
    status: "draft",
    sortDate: "2026-02-08"
  },
  {
    id: "qs-08",
    order: 8,
    legCode: "DBP-STG-08",
    name: "Tổng kết chiến dịch & Bài học lịch sử",
    description: "Ý nghĩa lịch sử, nguyên nhân thắng lợi và bài học kinh nghiệm của chiến thắng Điện Biên Phủ.",
    parentPackage: CURRENT_PACKAGE,
    term: "Kỳ 1954",
    unlock: "Hoàn thành Bộ #07 (≥ 80% điểm)",
    difficulty: "hard",
    questionCount: 10,
    questionType: "Trắc nghiệm",
    status: "locked",
    sortDate: "2026-02-07"
  }
];

export default function AdminQuestionSetsPage({ admin, onLogout, onNavigate }) {
  const [query, setQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("order");
  const [unreadCount, setUnreadCount] = useState(3);
  const [toast, setToast] = useState("");
  const [questionSets, setQuestionSets] = useState(initialQuestionSets);
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

  const filteredSets = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const rows = questionSets.filter((row) => {
      const matchKeyword = !keyword
        || row.name.toLowerCase().includes(keyword)
        || row.description.toLowerCase().includes(keyword)
        || row.legCode.toLowerCase().includes(keyword);
      const matchDifficulty = difficultyFilter === "all" || row.difficulty === difficultyFilter;
      const matchStatus = statusFilter === "all" || row.status === statusFilter;
      return matchKeyword && matchDifficulty && matchStatus;
    });

    const sorted = [...rows];
    if (sortOrder === "newest") {
      sorted.sort((a, b) => b.sortDate.localeCompare(a.sortDate) || a.order - b.order);
    } else if (sortOrder === "mostQuestions") {
      sorted.sort((a, b) => b.questionCount - a.questionCount || a.order - b.order);
    } else if (sortOrder === "hardest") {
      sorted.sort((a, b) => difficultyMeta[b.difficulty].rank - difficultyMeta[a.difficulty].rank || a.order - b.order);
    } else {
      sorted.sort((a, b) => a.order - b.order);
    }
    return sorted;
  }, [questionSets, query, difficultyFilter, statusFilter, sortOrder]);

  function handleEditSet(row) {
    showToast(`Chỉnh sửa bộ “${row.name}” sẽ có ở bước nối API.`);
  }

  function handleDeleteSet(row) {
    setQuestionSets((current) => current.filter((item) => item.id !== row.id));
    showToast(`Đã xóa bộ “${row.name}” (dữ liệu mẫu).`);
  }

  return (
    <AdminConsoleLayout
      admin={admin}
      onLogout={onLogout}
      onNavigate={onNavigate}
      activePath="/admin/question-sets"
      breadcrumb="Quản trị / Quản lý bộ câu hỏi"
      actions={
        <AdminTopActions
          admin={admin}
          onLogout={onLogout}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Tìm tên bộ, mã chặng..."
          searchLabel="Tìm kiếm bộ câu hỏi"
          unreadCount={unreadCount}
          onBellClick={handleBellClick}
        />
      }
      onFooterAction={(label) => showToast(`${label}: nội dung đang được hoàn thiện.`)}
    >
      <div className="adm-stat-grid">
        {questionSetStats.map((item) => {
          const Icon = item.icon;
          const PillIcon = item.pillIcon;
          const NoteIcon = item.noteIcon;
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
                <div className="adm-qset-stat-legend">
                  {item.legend.map((entry) => (
                    <span key={entry.text} className={`is-${entry.tone}`}>
                      <i aria-hidden="true" />
                      {entry.text}
                    </span>
                  ))}
                </div>
              ) : null}

              {item.note ? (
                <div className="adm-qset-note">
                  {NoteIcon ? <NoteIcon size={12} aria-hidden="true" /> : null}
                  <span>{item.note}</span>
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

      <section className="adm-filter-bar is-qsets" aria-label="Bộ lọc bộ câu hỏi">
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

        <div className="adm-filter-actions">
          <label className="adm-sort">
            <ArrowUpDown size={15} aria-hidden="true" />
            <span className="adm-sort-label">Sắp xếp lại thứ tự</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              aria-label="Sắp xếp lại thứ tự bộ câu hỏi"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="adm-ghost"
            onClick={() => showToast("Kiểm tra luồng mở khóa tuần tự sẽ được nối API ở bước tiếp theo.")}
          >
            <Workflow size={15} /> Kiểm tra luồng mở khóa
          </button>

          <button
            type="button"
            className="adm-primary"
            onClick={() => showToast("Biểu mẫu tạo bộ câu hỏi sẽ được nối API ở bước tiếp theo.")}
          >
            <Plus size={16} /> Tạo bộ câu hỏi mới
          </button>
        </div>
      </section>

      <section className="adm-panel adm-panel-flush" aria-label="Danh sách bộ câu hỏi">
        <div className="adm-table-wrap">
          <table className="adm-table adm-table-qsets">
            <thead>
              <tr>
                <th scope="col">Thứ tự</th>
                <th scope="col">Tên bộ &amp; mô tả tóm tắt</th>
                <th scope="col">Gói cha</th>
                <th scope="col">Điều kiện mở khóa</th>
                <th scope="col">Độ khó</th>
                <th scope="col">Số câu</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="adm-empty-row">
                    Không tìm thấy bộ câu hỏi phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredSets.map((row) => {
                  const difficulty = difficultyMeta[row.difficulty];
                  const orderLabel = String(row.order).padStart(2, "0");
                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="adm-qset-order">
                          <span className="adm-qset-index" aria-hidden="true">{orderLabel}</span>
                          <span className="adm-qset-order-meta">
                            <small>Chặng #{orderLabel}</small>
                            <span className="adm-qset-code"># Mã: {row.legCode}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="adm-qset-name">
                          <strong>{row.name}</strong>
                          <small>{row.description}</small>
                        </span>
                      </td>
                      <td>
                        <span className="adm-qset-parent">
                          <strong>{row.parentPackage}</strong>
                          <span className="adm-qset-term">{row.term}</span>
                        </span>
                      </td>
                      <td>
                        <span className="adm-qset-unlock">
                          <Lock size={12} aria-hidden="true" />
                          {row.unlock}
                        </span>
                      </td>
                      <td>
                        <span className={`adm-qset-diff is-${difficulty.tone}`}>{difficulty.label}</span>
                      </td>
                      <td>
                        <span className="adm-qset-count">
                          {row.questionCount} câu
                          <small>{row.questionType}</small>
                        </span>
                      </td>
                      <td>
                        <div className="adm-table-actions">
                          <button
                            type="button"
                            className="adm-eye-btn"
                            onClick={() => handleEditSet(row)}
                            aria-label={`Chỉnh sửa ${row.name}`}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="adm-eye-btn is-danger"
                            onClick={() => handleDeleteSet(row)}
                            aria-label={`Xóa ${row.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
            Hiển thị <b>1 – {filteredSets.length}</b> trong tổng số <b>{numberFormat.format(TOTAL_SETS)}</b> bộ đề của gói hiện tại
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
