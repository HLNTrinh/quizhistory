// src/pages/admin/AdminQuestionsPage.jsx
// Trang quản trị Ngân hàng câu hỏi — dựng trên khung AdminConsoleLayout (sidebar + topbar + footer giống Dashboard).
// Hiện tại là giao diện với dữ liệu mẫu, chưa gọi API.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Database,
  GraduationCap,
  ListChecks,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  TrendingUp,
  Upload
} from "lucide-react";
import AdminConsoleLayout from "./AdminConsoleLayout.jsx";
import AdminTopActions from "./AdminTopActions.jsx";
import AdminFormModal from "./AdminFormModal.jsx";
import "./AdminQuestions.css";

const numberFormat = new Intl.NumberFormat("vi-VN");
const percentFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

const TOTAL_QUESTIONS = 2450;

const questionStats = [
  {
    id: "total",
    label: "Tổng số câu hỏi",
    value: 2450,
    icon: Database,
    tone: "violet",
    note: "+150 câu mới tuần này",
    noteTone: "green",
    noteIcon: TrendingUp
  },
  {
    id: "attached",
    label: "Đã gắn vào bộ đề",
    value: 1860,
    icon: ListChecks,
    tone: "blue",
    progress: { percent: 76, label: "Tỷ lệ sử dụng", value: "76%" }
  },
  {
    id: "available",
    label: "Khả dụng (chưa gắn)",
    value: 590,
    icon: Compass,
    tone: "violet",
    note: "Sẵn sàng tạo bộ đề mới",
    noteIcon: Compass
  },
  {
    id: "explained",
    label: "Có giải thích chi tiết",
    value: 94.2,
    unit: "%",
    format: "percent",
    icon: GraduationCap,
    tone: "green",
    note: "Chuẩn sư phạm chất lượng cao",
    noteIcon: Award
  }
];

const topicOptions = [
  { value: "all", label: "Tất cả chủ đề lịch sử" },
  { value: "Kháng chiến chống Pháp", label: "Kháng chiến chống Pháp" },
  { value: "Ngoại giao Lịch sử", label: "Ngoại giao Lịch sử" },
  { value: "Phong trào Cách mạng", label: "Phong trào Cách mạng" },
  { value: "Chống Bắc thuộc", label: "Chống Bắc thuộc" }
];

const difficultyOptions = [
  { value: "all", label: "Tất cả độ khó" },
  { value: "easy", label: "Cơ bản" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Nâng cao" }
];

const setOptions = [
  { value: "all", label: "Tất cả bộ đề" },
  { value: "Bộ 01 - Kéo pháo Điện Biên", label: "Bộ 01 - Kéo pháo Điện Biên" },
  { value: "Bộ 02 - Đồi Him Lam", label: "Bộ 02 - Đồi Him Lam" },
  { value: "Bộ 06 - Hiệp định Genève", label: "Bộ 06 - Hiệp định Genève" },
  { value: "Bộ Bạch Đằng 938", label: "Bộ Bạch Đằng 938" },
  { value: "none", label: "Chưa gắn bộ đề" }
];

const difficultyMeta = {
  easy: { label: "Cơ bản", tone: "green" },
  medium: { label: "Trung bình", tone: "amber" },
  hard: { label: "Nâng cao", tone: "red" }
};

const questionTypeChoices = [
  "Trắc nghiệm (4 lựa chọn)",
  "Điền khuyết",
  "Đúng / Sai"
];

const answerLetters = ["A", "B", "C", "D"];

const emptyQuestionForm = {
  content: "",
  type: "Trắc nghiệm (4 lựa chọn)",
  topic: "Kháng chiến chống Pháp",
  difficulty: "medium",
  setName: "none",
  answerLetter: "A",
  answerText: "",
  verified: false
};

const initialQuestions = [
  {
    id: "1042",
    code: "#Q-1042",
    type: "Trắc nghiệm (4 lựa chọn)",
    content: "Chiến dịch Điện Biên Phủ diễn ra trong bao nhiêu ngày đêm?",
    topic: "Kháng chiến chống Pháp",
    difficulty: "hard",
    setName: "Bộ 01 - Kéo pháo Điện Biên",
    answer: { letter: "C", text: "56 ngày đêm", verified: true },
    updatedAt: "24/02/2026"
  },
  {
    id: "1043",
    code: "#Q-1043",
    type: "Trắc nghiệm (4 lựa chọn)",
    content: "Ai là vị tướng chỉ huy chiến dịch Điện Biên Phủ năm 1954?",
    topic: "Kháng chiến chống Pháp",
    difficulty: "easy",
    setName: "Bộ 01 - Kéo pháo Điện Biên",
    answer: { letter: "A", text: "Đại tướng Võ Nguyên Giáp", verified: true },
    updatedAt: "23/02/2026"
  },
  {
    id: "1044",
    code: "#Q-1044",
    type: "Trắc nghiệm (4 lựa chọn)",
    content: "Hiệp định Genève về Đông Dương được ký kết vào năm nào?",
    topic: "Ngoại giao Lịch sử",
    difficulty: "medium",
    setName: "Bộ 06 - Hiệp định Genève",
    answer: { letter: "B", text: "Năm 1954", verified: true },
    updatedAt: "22/02/2026"
  },
  {
    id: "1045",
    code: "#Q-1045",
    type: "Trắc nghiệm (4 lựa chọn)",
    content: "Tổ chức nào lãnh đạo phong trào cách mạng Việt Nam giai đoạn 1930 - 1945?",
    topic: "Phong trào Cách mạng",
    difficulty: "medium",
    setName: null,
    answer: { letter: "D", text: "Đảng Cộng sản VN", verified: false },
    updatedAt: "20/02/2026"
  },
  {
    id: "1046",
    code: "#Q-1046",
    type: "Trắc nghiệm (4 lựa chọn)",
    content: "Trận quyết chiến trên sông Bạch Đằng năm 938 do ai chỉ huy?",
    topic: "Chống Bắc thuộc",
    difficulty: "easy",
    setName: "Bộ Bạch Đằng 938",
    answer: { letter: "A", text: "Ngô Quyền", verified: true },
    updatedAt: "18/02/2026"
  },
  {
    id: "1047",
    code: "#Q-1047",
    type: "Trắc nghiệm (4 lựa chọn)",
    content: "Cứ điểm Him Lam bị quân ta tiêu diệt trong trận đánh mở màn nào?",
    topic: "Kháng chiến chống Pháp",
    difficulty: "hard",
    setName: "Bộ 02 - Đồi Him Lam",
    answer: { letter: "B", text: "13/3/1954", verified: true },
    updatedAt: "17/02/2026"
  }
];

export default function AdminQuestionsPage({ admin, onLogout, onNavigate }) {
  const [query, setQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [setFilter, setSetFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(3);
  const [toast, setToast] = useState("");
  const [questions, setQuestions] = useState(initialQuestions);
  const toastTimer = useRef(null);
  const [questionModal, setQuestionModal] = useState(null); // "create" | "edit" | null
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [form, setForm] = useState(emptyQuestionForm);

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

  function handleResetFilters() {
    setTopicFilter("all");
    setDifficultyFilter("all");
    setSetFilter("all");
    setQuery("");
    showToast("Đã đặt lại toàn bộ bộ lọc câu hỏi.");
  }

  const filteredQuestions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return questions.filter((row) => {
      const matchKeyword = !keyword
        || row.content.toLowerCase().includes(keyword)
        || row.code.toLowerCase().includes(keyword)
        || row.topic.toLowerCase().includes(keyword)
        || (row.setName || "").toLowerCase().includes(keyword);
      const matchTopic = topicFilter === "all" || row.topic === topicFilter;
      const matchDifficulty = difficultyFilter === "all" || row.difficulty === difficultyFilter;
      const matchSet = setFilter === "all"
        || (setFilter === "none" ? !row.setName : row.setName === setFilter);
      return matchKeyword && matchTopic && matchDifficulty && matchSet;
    });
  }, [questions, query, topicFilter, difficultyFilter, setFilter]);

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreateQuestion() {
    setActiveQuestion(null);
    setForm(emptyQuestionForm);
    setQuestionModal("create");
  }

  function handleEditQuestion(row) {
    setActiveQuestion(row);
    setForm({
      content: row.content,
      type: row.type,
      topic: row.topic,
      difficulty: row.difficulty,
      setName: row.setName || "none",
      answerLetter: row.answer.letter,
      answerText: row.answer.text,
      verified: row.answer.verified
    });
    setQuestionModal("edit");
  }

  function closeQuestionModal() {
    setQuestionModal(null);
    setActiveQuestion(null);
  }

  function handleQuestionSubmit(event) {
    event.preventDefault();
    const content = form.content.trim();
    if (!content) {
      showToast("Vui lòng nhập nội dung câu hỏi trước khi lưu.");
      return;
    }

    const now = new Date();
    const updatedAt = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
    const payload = {
      type: form.type,
      content,
      topic: form.topic,
      difficulty: form.difficulty,
      setName: form.setName === "none" ? null : form.setName,
      answer: {
        letter: form.answerLetter,
        text: form.answerText.trim() || "Chưa cập nhật đáp án",
        verified: Boolean(form.verified)
      },
      updatedAt
    };

    if (questionModal === "edit" && activeQuestion) {
      setQuestions((current) => current.map((row) => (row.id === activeQuestion.id
        ? { ...row, ...payload }
        : row)));
      showToast(`Đã cập nhật câu hỏi ${activeQuestion.code} (dữ liệu mẫu).`);
    } else {
      const nextId = questions.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
      setQuestions((current) => [{
        id: String(nextId),
        code: `#Q-${nextId}`,
        ...payload
      }, ...current]);
      showToast(`Đã thêm câu hỏi #Q-${nextId} (dữ liệu mẫu, chưa lưu máy chủ).`);
    }
    closeQuestionModal();
  }

  function handleDeleteQuestion(row) {
    setQuestions((current) => current.filter((item) => item.id !== row.id));
    showToast(`Đã xóa câu hỏi ${row.code} (dữ liệu mẫu).`);
  }

  return (
    <AdminConsoleLayout
      admin={admin}
      onLogout={onLogout}
      onNavigate={onNavigate}
      activePath="/admin/questions"
      breadcrumb="Quản trị / Ngân hàng câu hỏi"
      actions={
        <AdminTopActions
          admin={admin}
          onLogout={onLogout}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Tìm nội dung, mã câu hỏi..."
          searchLabel="Tìm kiếm câu hỏi"
          unreadCount={unreadCount}
          onBellClick={handleBellClick}
        />
      }
      onFooterAction={(label) => showToast(`${label}: nội dung đang được hoàn thiện.`)}
    >
      <div className="adm-stat-grid">
        {questionStats.map((item) => {
          const Icon = item.icon;
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
                {item.unit ? <span>{item.unit}</span> : null}
              </p>

              {item.note ? (
                <div className={`adm-q-stat-note${item.noteTone ? ` is-${item.noteTone}` : ""}`}>
                  {NoteIcon ? <NoteIcon size={13} aria-hidden="true" /> : null}
                  <span>{item.note}</span>
                </div>
              ) : null}

              {item.progress ? (
                <div className="adm-q-stat-progress">
                  <div className="adm-q-stat-progress-top">
                    <span>{item.progress.label}</span>
                    <b>{item.progress.value}</b>
                  </div>
                  <span className="adm-track">
                    <i style={{ width: `${item.progress.percent}%`, background: "linear-gradient(90deg, #8b7bff, #5b46f5)" }} />
                  </span>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <section className="adm-filter-bar is-questions" aria-label="Bộ lọc câu hỏi">
        <select
          className="adm-filter-select"
          value={topicFilter}
          onChange={(event) => setTopicFilter(event.target.value)}
          aria-label="Lọc theo chủ đề lịch sử"
        >
          {topicOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

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
          value={setFilter}
          onChange={(event) => setSetFilter(event.target.value)}
          aria-label="Lọc theo bộ đề"
        >
          {setOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <button type="button" className="adm-filter-reset" onClick={handleResetFilters}>
          <RotateCcw size={15} /> Đặt lại
        </button>

        <div className="adm-filter-actions">
          <button
            type="button"
            className="adm-ghost"
            onClick={() => showToast("Nhập câu hỏi từ tệp CSV sẽ được nối API ở bước tiếp theo.")}
          >
            <Upload size={15} /> Nhập từ tệp CSV
          </button>

          <button
            type="button"
            className="adm-primary"
            onClick={openCreateQuestion}
          >
            <Plus size={16} /> Thêm câu hỏi mới
          </button>
        </div>
      </section>

      <section className="adm-panel adm-panel-flush" aria-label="Danh sách câu hỏi">
        <div className="adm-table-wrap">
          <table className="adm-table adm-table-questions">
            <thead>
              <tr>
                <th scope="col">Mã ID &amp; nội dung câu hỏi</th>
                <th scope="col">Thời kỳ / Chủ đề</th>
                <th scope="col">Độ khó</th>
                <th scope="col">Bộ đang sử dụng</th>
                <th scope="col">Đáp án đúng</th>
                <th scope="col">Ngày tạo / Sửa</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="adm-empty-row">
                    Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((row) => {
                  const difficulty = difficultyMeta[row.difficulty];
                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="adm-q-cell">
                          <div className="adm-q-meta">
                            <span className="adm-q-code">{row.code}</span>
                            <span className="adm-q-type">{row.type}</span>
                          </div>
                          <strong className="adm-q-content">{row.content}</strong>
                        </div>
                      </td>
                      <td>
                        <span className="adm-q-topic">{row.topic}</span>
                      </td>
                      <td>
                        <span className={`adm-q-diff is-${difficulty.tone}`}>{difficulty.label}</span>
                      </td>
                      <td>
                        {row.setName ? (
                          <span className="adm-q-set">
                            <Bookmark size={12} aria-hidden="true" />
                            {row.setName}
                          </span>
                        ) : (
                          <span className="adm-q-set is-empty">Chưa gắn bộ đề</span>
                        )}
                      </td>
                      <td>
                        <span className="adm-q-answer">
                          <span className="adm-q-answer-letter">{row.answer.letter}</span>
                          <span className="adm-q-answer-text">{row.answer.text}</span>
                          {row.answer.verified ? (
                            <CheckCircle2 size={13} className="adm-q-verified" aria-hidden="true" />
                          ) : (
                            <Clock size={13} className="adm-q-pending" aria-hidden="true" />
                          )}
                        </span>
                      </td>
                      <td>
                        <span className="adm-q-date">{row.updatedAt}</span>
                      </td>
                      <td>
                        <div className="adm-table-actions">
                          <button
                            type="button"
                            className="adm-eye-btn"
                            onClick={() => handleEditQuestion(row)}
                            aria-label={`Chỉnh sửa câu hỏi ${row.code}`}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="adm-eye-btn is-danger"
                            onClick={() => handleDeleteQuestion(row)}
                            aria-label={`Xóa câu hỏi ${row.code}`}
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
            Hiển thị <b>1 – {filteredQuestions.length}</b> trong tổng số <b>{numberFormat.format(TOTAL_QUESTIONS)}</b> câu hỏi
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
            <span className="adm-pager-gap" aria-hidden="true">…</span>
            <button type="button" className="adm-pager-btn" onClick={() => showToast("Phân trang sẽ được nối API ở bước tiếp theo.")}>408</button>
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

      {questionModal ? (
        <AdminFormModal
          title={questionModal === "edit" ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
          subtitle="Giao diện mẫu — dữ liệu chưa được lưu lên máy chủ."
          size="lg"
          submitLabel={questionModal === "edit" ? "Lưu thay đổi" : "Thêm câu hỏi"}
          onSubmit={handleQuestionSubmit}
          onClose={closeQuestionModal}
        >
          <div className="adm-field">
            <label htmlFor="adm-q-content">Nội dung câu hỏi</label>
            <textarea
              id="adm-q-content"
              className="adm-textarea"
              value={form.content}
              onChange={(event) => updateForm("content", event.target.value)}
              placeholder="Ví dụ: Chiến dịch Điện Biên Phủ diễn ra trong bao nhiêu ngày đêm?"
              autoFocus
            />
          </div>

          <div className="adm-field-row">
            <div className="adm-field">
              <label htmlFor="adm-q-type">Loại câu hỏi</label>
              <select
                id="adm-q-type"
                className="adm-select"
                value={form.type}
                onChange={(event) => updateForm("type", event.target.value)}
              >
                {questionTypeChoices.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label htmlFor="adm-q-topic">Chủ đề lịch sử</label>
              <select
                id="adm-q-topic"
                className="adm-select"
                value={form.topic}
                onChange={(event) => updateForm("topic", event.target.value)}
              >
                {topicOptions.filter((option) => option.value !== "all").map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="adm-field-row">
            <div className="adm-field">
              <label htmlFor="adm-q-difficulty">Độ khó</label>
              <select
                id="adm-q-difficulty"
                className="adm-select"
                value={form.difficulty}
                onChange={(event) => updateForm("difficulty", event.target.value)}
              >
                <option value="easy">Cơ bản</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Nâng cao</option>
              </select>
            </div>
            <div className="adm-field">
              <label htmlFor="adm-q-set">Bộ đề sử dụng</label>
              <select
                id="adm-q-set"
                className="adm-select"
                value={form.setName}
                onChange={(event) => updateForm("setName", event.target.value)}
              >
                {setOptions.filter((option) => option.value !== "all").map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="adm-form-section">
            <strong>Đáp án đúng</strong>
            <small>Dùng để chấm điểm tự động khi học viên làm bài.</small>
          </div>

          <div className="adm-field-row">
            <div className="adm-field">
              <label htmlFor="adm-q-letter">Phương án</label>
              <select
                id="adm-q-letter"
                className="adm-select"
                value={form.answerLetter}
                onChange={(event) => updateForm("answerLetter", event.target.value)}
              >
                {answerLetters.map((letter) => (
                  <option key={letter} value={letter}>{letter}</option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label htmlFor="adm-q-answer">Nội dung đáp án</label>
              <input
                id="adm-q-answer"
                className="adm-input"
                value={form.answerText}
                onChange={(event) => updateForm("answerText", event.target.value)}
                placeholder="Ví dụ: 56 ngày đêm"
              />
            </div>
          </div>

          <label className="adm-check">
            <input
              type="checkbox"
              checked={form.verified}
              onChange={(event) => updateForm("verified", event.target.checked)}
            />
            Đáp án đã được biên tập viên thẩm định
          </label>
        </AdminFormModal>
      ) : null}

      {toast ? (
        <div className="adm-toast" role="status">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      ) : null}
    </AdminConsoleLayout>
  );
}
