// src/pages/admin/AdminQuestionsPage.jsx
// Trang quản trị Ngân hàng câu hỏi — dữ liệu thật từ GET /api/admin/questions.
// Mọi số liệu (tổng câu hỏi, độ phủ bộ đề, tỷ lệ có giải thích, điểm trung bình)
// được backend đếm từ collection `questions`, không dùng dữ liệu mẫu.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  Award,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  FolderOpen,
  GraduationCap,
  Info,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  TrendingUp
} from "lucide-react";
import AdminConsoleLayout from "./AdminConsoleLayout.jsx";
import AdminTopActions from "./AdminTopActions.jsx";
import AdminFormModal from "./AdminFormModal.jsx";
import { adminApi } from "../../lib/api.js";
import "./AdminQuestions.css";

const numberFormat = new Intl.NumberFormat("vi-VN");
const percentFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const PAGE_SIZE = 10;

const answerLetters = ["A", "B", "C", "D"];

const difficultyOptions = [
  { value: "all", label: "Tất cả độ khó" },
  { value: "easy", label: "Cơ bản" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Nâng cao" }
];

const explanationOptions = [
  { value: "all", label: "Mọi trạng thái giải thích" },
  { value: "has", label: "Đã có giải thích" },
  { value: "missing", label: "Chưa có giải thích" }
];

const sortOptions = [
  { value: "order", label: "Thứ tự trong bộ" },
  { value: "newest", label: "Mới cập nhật" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "difficulty", label: "Độ khó giảm dần" },
  { value: "score", label: "Điểm cao nhất" }
];

const difficultyMeta = {
  easy: { label: "Cơ bản", tone: "green" },
  medium: { label: "Trung bình", tone: "amber" },
  hard: { label: "Nâng cao", tone: "red" }
};

const dateFormat = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

const EMPTY_PAGINATION = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 };
const EMPTY_FORM = {
  questionSetId: "",
  content: "",
  options: ["", "", "", ""],
  answerIndex: "0",
  explanation: "",
  difficulty: "medium",
  score: "1",
  order: ""
};

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return dateFormat.format(date);
}

function buildPageList(current, totalPages) {
  const total = Math.max(1, totalPages);
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const list = [];
  for (let page = start; page < start + 5 && page <= total; page += 1) list.push(page);
  return list;
}

export default function AdminQuestionsPage({ admin, onLogout, onNavigate }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [explanationFilter, setExplanationFilter] = useState("all");
  const [setFilter, setSetFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("order");
  const [page, setPage] = useState(1);

  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState("");
  const [setOptions, setSetOptions] = useState([]);
  const [packageOptions, setPackageOptions] = useState([]);

  const [questionModal, setQuestionModal] = useState(null); // "create" | "edit" | null
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

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
    toastTimer.current = window.setTimeout(() => setToast(""), 3600);
  }

  function handleBellClick() {
    setUnreadCount(0);
    showToast("Đã đánh dấu toàn bộ thông báo là đã đọc.");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Nạp danh sách bộ đề + gói câu hỏi thật để dựng bộ lọc và ô chọn trong biểu mẫu.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      adminApi("/admin/question-sets?page=1&limit=50&sort=order"),
      adminApi("/admin/packages?page=1&limit=50&sort=name")
    ])
      .then(([setPayload, packagePayload]) => {
        if (cancelled) return;
        setSetOptions(Array.isArray(setPayload.items) ? setPayload.items : []);
        setPackageOptions(Array.isArray(packagePayload.items) ? packagePayload.items : []);
      })
      .catch(() => {
        if (cancelled) return;
        setSetOptions([]);
        setPackageOptions([]);
      });
    return () => { cancelled = true; };
  }, []);

  const loadQuestions = useCallback(async ({ silent = false } = {}) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoadError(null);
    if (!silent && !hasDataRef.current) setLoadState("loading");

    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort: sortOrder });
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (difficultyFilter !== "all") params.set("difficulty", difficultyFilter);
    if (explanationFilter !== "all") params.set("explanation", explanationFilter);
    if (setFilter !== "all") params.set("questionSetId", setFilter);
    if (packageFilter !== "all") params.set("packageId", packageFilter);

    try {
      const payload = await adminApi(`/admin/questions?${params.toString()}`, { signal: controller.signal });
      if (controller.signal.aborted) return { ok: false };
      hasDataRef.current = true;
      setItems(Array.isArray(payload.items) ? payload.items : []);
      setStats(payload.stats || null);
      setPagination(payload.pagination || EMPTY_PAGINATION);
      setLoadState("ready");
      return { ok: true };
    } catch (error) {
      if (controller.signal.aborted) return { ok: false };
      setLoadError(error);
      if (!hasDataRef.current) setLoadState("error");
      return { ok: false, error };
    }
  }, [page, debouncedQuery, difficultyFilter, explanationFilter, setFilter, packageFilter, sortOrder]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  async function handleRefresh() {
    setRefreshing(true);
    const result = await loadQuestions();
    setRefreshing(false);
    if (result.ok) showToast("Đã làm mới danh sách câu hỏi.");
    else if (result.error) showToast(`Không tải được danh sách: ${result.error.message}`);
  }

  function resetFilters() {
    setQuery("");
    setDebouncedQuery("");
    setDifficultyFilter("all");
    setExplanationFilter("all");
    setSetFilter("all");
    setPackageFilter("all");
    setSortOrder("order");
    setPage(1);
    showToast("Đã đặt lại bộ lọc câu hỏi.");
  }

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateOption(index, value) {
    setForm((current) => ({
      ...current,
      options: current.options.map((item, position) => (position === index ? value : item))
    }));
  }

  const defaultSetId = setFilter !== "all"
    ? setFilter
    : (setOptions[0]?.id || "");

  function openCreateQuestion() {
    setActiveQuestion(null);
    setForm({ ...EMPTY_FORM, questionSetId: defaultSetId });
    setQuestionModal("create");
  }

  function handleEditQuestion(row) {
    setActiveQuestion(row);
    setForm({
      questionSetId: row.questionSetId || defaultSetId,
      content: row.content,
      options: [0, 1, 2, 3].map((index) => row.options[index] || ""),
      answerIndex: String(row.answerIndex ?? 0),
      explanation: row.explanation || "",
      difficulty: row.difficulty,
      score: String(row.score),
      order: String(row.order)
    });
    setQuestionModal("edit");
  }

  function closeQuestionModal() {
    setQuestionModal(null);
    setActiveQuestion(null);
  }

  async function handleQuestionSubmit(event) {
    event.preventDefault();
    if (saving) return;

    const content = form.content.trim();
    if (!form.questionSetId) {
      showToast("Hãy chọn bộ đề cho câu hỏi này.");
      return;
    }
    if (content.length < 5) {
      showToast("Nội dung câu hỏi cần có ít nhất 5 ký tự.");
      return;
    }

    const options = form.options.map((item) => item.trim());
    if (options.some((item) => !item.length)) {
      showToast("Vui lòng nhập đủ 4 phương án A, B, C, D.");
      return;
    }
    if (new Set(options).size !== 4) {
      showToast("Bốn phương án phải khác nhau, không được trùng nội dung.");
      return;
    }

    const payload = {
      questionSetId: form.questionSetId,
      content,
      options,
      answerIndex: Number(form.answerIndex) || 0,
      explanation: form.explanation.trim(),
      difficulty: form.difficulty,
      score: Number(form.score) || 0
    };
    if (form.order.trim() !== "") payload.order = Math.max(0, Number(form.order) || 0);

    setSaving(true);
    try {
      if (questionModal === "edit" && activeQuestion) {
        await adminApi(`/admin/questions/${activeQuestion.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        showToast(`Đã cập nhật câu hỏi ${activeQuestion.code}.`);
      } else {
        await adminApi("/admin/questions", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        showToast("Đã thêm câu hỏi mới vào ngân hàng câu hỏi.");
        setPage(1);
      }
      closeQuestionModal();
      await loadQuestions({ silent: true });
    } catch (error) {
      showToast(error.message || "Không lưu được câu hỏi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSubmit(event) {
    event.preventDefault();
    if (saving || !deleteTarget) return;

    setSaving(true);
    try {
      const payload = await adminApi(`/admin/questions/${deleteTarget.id}`, { method: "DELETE" });
      const referenced = Number(payload.referencedAttempts) || 0;
      setDeleteTarget(null);
      showToast(referenced > 0
        ? `Đã xóa câu hỏi ${deleteTarget.code}. Lịch sử ${numberFormat.format(referenced)} lượt làm bài vẫn được giữ nguyên điểm số.`
        : `Đã xóa câu hỏi ${deleteTarget.code}.`);
      if (items.length === 1 && pagination.page > 1) setPage(pagination.page - 1);
      else await loadQuestions({ silent: true });
    } catch (error) {
      showToast(error.message || "Không xóa được câu hỏi.");
    } finally {
      setSaving(false);
    }
  }

  const hasFilters = Boolean(debouncedQuery.trim())
    || difficultyFilter !== "all"
    || explanationFilter !== "all"
    || setFilter !== "all"
    || packageFilter !== "all"
    || sortOrder !== "order";

  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);
  const pageList = buildPageList(pagination.page, pagination.totalPages);

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      {
        id: "total",
        label: "Tổng số câu hỏi",
        value: stats.total,
        unit: "Câu",
        icon: Database,
        tone: "violet",
        legend: [
          { tone: "green", text: `${numberFormat.format(stats.easy)} Cơ bản` },
          { tone: "amber", text: `${numberFormat.format(stats.medium)} Trung bình` },
          { tone: "red", text: `${numberFormat.format(stats.hard)} Nâng cao` }
        ]
      },
      {
        id: "explained",
        label: "Có giải thích chi tiết",
        value: stats.explanationRatio,
        unit: "%",
        format: "percent",
        icon: GraduationCap,
        tone: "green",
        note: `${numberFormat.format(stats.withExplanation)}/${numberFormat.format(stats.total)} câu đã có giải thích đáp án`,
        noteIcon: Info
      },
      {
        id: "coverage",
        label: "Độ phủ bộ đề",
        value: stats.setCoverage,
        unit: "%",
        format: "percent",
        icon: FolderOpen,
        tone: "blue",
        pill: `${numberFormat.format(stats.coveredSets)}/${numberFormat.format(stats.totalSets)} bộ đề đã có câu hỏi`,
        pillTone: "violet",
        pillIcon: FolderOpen
      },
      {
        id: "score",
        label: "Điểm trung bình / câu",
        value: stats.averageScore,
        unit: "điểm",
        icon: Award,
        tone: "amber",
        note: `${numberFormat.format(stats.updated7d)} câu được cập nhật trong 7 ngày gần nhất`,
        noteIcon: TrendingUp
      }
    ];
  }, [stats]);

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
          searchPlaceholder="Tìm nội dung câu hỏi..."
          searchLabel="Tìm kiếm câu hỏi"
          unreadCount={unreadCount}
          onBellClick={handleBellClick}
        />
      }
      onFooterAction={(label) => showToast(`${label}: nội dung đang được hoàn thiện.`)}
    >
      {loadState === "loading" && !stats ? (
        <>
          <div className="adm-stat-grid">
            {[0, 1, 2, 3].map((key) => (
              <div className="adm-stat" key={key}>
                <div className="adm-skeleton" style={{ height: 14, width: "58%" }} />
                <div className="adm-skeleton" style={{ height: 28, width: "45%" }} />
                <div className="adm-skeleton" style={{ height: 12, width: "70%" }} />
              </div>
            ))}
          </div>
          <div className="adm-panel adm-panel-flush">
            <div style={{ padding: 20 }}>
              <div className="adm-skeleton" style={{ height: 16, width: "36%" }} />
              <div className="adm-skeleton" style={{ height: 260, marginTop: 16 }} />
            </div>
          </div>
        </>
      ) : null}

      {loadState === "error" && !stats ? (
        <div className="adm-state-card is-error">
          <span className="adm-state-icon"><AlertTriangle size={30} /></span>
          <h2>Không tải được ngân hàng câu hỏi</h2>
          <p>
            {loadError?.message || "Không thể kết nối đến máy chủ API quản trị."}
            {" "}Vui lòng kiểm tra backend và kết nối cơ sở dữ liệu rồi thử lại.
          </p>
          <div className="adm-state-actions">
            <button type="button" className="adm-primary" onClick={handleRefresh}>
              <RotateCcw size={15} /> Thử tải lại ngay
            </button>
            {loadError?.status === 401 ? (
              <button type="button" className="adm-ghost" onClick={onLogout}>Đăng nhập lại</button>
            ) : null}
          </div>
        </div>
      ) : null}

      {stats ? (
        <>
          <div className="adm-stat-grid">
            {statCards.map((item) => {
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
                    {item.format === "percent"
                      ? percentFormat.format(item.value)
                      : numberFormat.format(item.value)}
                    <span>{item.unit}</span>
                  </p>

                  {item.legend ? (
                    <div className="adm-q-stat-legend">
                      {item.legend.map((entry) => (
                        <span key={entry.text} className={`is-${entry.tone}`}>
                          <i aria-hidden="true" />
                          {entry.text}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {item.note ? (
                    <div className="adm-q-stat-note">
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

          <section className="adm-filter-bar" aria-label="Bộ lọc câu hỏi">
            <select
              className="adm-filter-select"
              value={setFilter}
              onChange={(event) => {
                setSetFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo bộ đề"
            >
              <option value="all">Tất cả bộ đề</option>
              {setOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>

            <select
              className="adm-filter-select"
              value={packageFilter}
              onChange={(event) => {
                setPackageFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo gói câu hỏi"
            >
              <option value="all">Tất cả gói câu hỏi</option>
              {packageOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>

            <select
              className="adm-filter-select"
              value={difficultyFilter}
              onChange={(event) => {
                setDifficultyFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo độ khó"
            >
              {difficultyOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              className="adm-filter-select"
              value={explanationFilter}
              onChange={(event) => {
                setExplanationFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo trạng thái giải thích"
            >
              {explanationOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <div className="adm-filter-actions">
              <label className="adm-sort">
                <ArrowUpDown size={15} aria-hidden="true" />
                <span className="adm-sort-label">Sắp xếp thứ tự</span>
                <select
                  value={sortOrder}
                  onChange={(event) => {
                    setSortOrder(event.target.value);
                    setPage(1);
                  }}
                  aria-label="Sắp xếp danh sách câu hỏi"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <button type="button" className="adm-ghost" onClick={resetFilters} disabled={!hasFilters}>
                <RotateCcw size={15} /> Đặt lại lọc
              </button>

              <button type="button" className="adm-ghost" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw size={15} /> {refreshing ? "Đang tải..." : "Làm mới"}
              </button>

              <button type="button" className="adm-primary" onClick={openCreateQuestion}>
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
                    <th scope="col">Bộ đề đang dùng</th>
                    <th scope="col">Chủ đề</th>
                    <th scope="col">Độ khó</th>
                    <th scope="col">Đáp án đúng</th>
                    <th scope="col">Ngày tạo / Sửa</th>
                    <th scope="col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="adm-empty-row">
                        {hasFilters
                          ? "Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại."
                          : "Chưa có câu hỏi nào trong ngân hàng câu hỏi. Hãy thêm câu hỏi đầu tiên cho một bộ đề."}
                      </td>
                    </tr>
                  ) : (
                    items.map((row) => {
                      const difficulty = difficultyMeta[row.difficulty] || difficultyMeta.medium;
                      return (
                        <tr key={row.id}>
                          <td>
                            <div className="adm-q-cell">
                              <div className="adm-q-meta">
                                <span className="adm-q-code">{row.code}</span>
                                <span className="adm-q-type">
                                  Trắc nghiệm · {numberFormat.format(row.score)} điểm
                                </span>
                              </div>
                              <strong className="adm-q-content">{row.content}</strong>
                            </div>
                          </td>
                          <td>
                            <div className="adm-q-cell">
                              {row.questionSetName ? (
                                <span className="adm-q-set">
                                  <Bookmark size={12} aria-hidden="true" />
                                  {row.questionSetName}
                                </span>
                              ) : (
                                <span className="adm-q-set is-empty">Chưa gắn bộ đề</span>
                              )}
                              <span className="adm-q-date">{row.packageName || "Chưa rõ gói câu hỏi"}</span>
                            </div>
                          </td>
                          <td>
                            <span className="adm-q-topic">{row.categoryName || "Chưa gán chủ đề"}</span>
                          </td>
                          <td>
                            <span className={`adm-q-diff is-${difficulty.tone}`}>{difficulty.label}</span>
                          </td>
                          <td>
                            <span className="adm-q-answer">
                              <span className="adm-q-answer-letter">{row.answerLetter}</span>
                              <span className="adm-q-answer-text">{row.answerText || "Chưa có đáp án"}</span>
                              {row.hasExplanation ? (
                                <CheckCircle2 size={13} className="adm-q-verified" aria-hidden="true" />
                              ) : (
                                <Clock size={13} className="adm-q-pending" aria-hidden="true" />
                              )}
                            </span>
                          </td>
                          <td>
                            <span className="adm-q-date">{formatDate(row.updatedAt)}</span>
                          </td>
                          <td>
                            <div className="adm-table-actions">
                              <button
                                type="button"
                                className="adm-eye-btn"
                                onClick={() => handleEditQuestion(row)}
                                aria-label={`Chỉnh sửa ${row.code}`}
                                title="Chỉnh sửa câu hỏi"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                className="adm-eye-btn is-danger"
                                onClick={() => setDeleteTarget(row)}
                                aria-label={`Xóa ${row.code}`}
                                title="Xóa câu hỏi"
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
                Hiển thị <b>{numberFormat.format(startItem)} – {numberFormat.format(endItem)}</b> trong tổng số{" "}
                <b>{numberFormat.format(pagination.total)}</b> câu hỏi
              </span>
              <div className="adm-pager">
                <button
                  type="button"
                  className="adm-pager-btn"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={pagination.page <= 1}
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={15} />
                </button>
                {pageList.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`adm-pager-btn${item === pagination.page ? " is-active" : ""}`}
                    aria-current={item === pagination.page ? "page" : undefined}
                    onClick={() => setPage(item)}
                  >
                    {numberFormat.format(item)}
                  </button>
                ))}
                <button
                  type="button"
                  className="adm-pager-btn"
                  onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  aria-label="Trang sau"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

          </section>


        </>
      ) : null}

      {questionModal ? (
        <AdminFormModal
          size="lg"
          title={questionModal === "edit" ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
          subtitle={
            questionModal === "edit" && activeQuestion
              ? `Mã ${activeQuestion.code} · đang lưu trong bộ “${activeQuestion.questionSetName || "chưa xác định"}”.`
              : "Câu hỏi trắc nghiệm 4 lựa chọn được lưu trực tiếp vào ngân hàng câu hỏi."
          }
          submitLabel={saving ? "Đang lưu..." : (questionModal === "edit" ? "Lưu thay đổi" : "Thêm câu hỏi")}
          onSubmit={handleQuestionSubmit}
          onClose={closeQuestionModal}
          footer={
            <>
              <button type="button" className="adm-ghost" onClick={closeQuestionModal} disabled={saving}>Hủy bỏ</button>
              <button type="submit" className="adm-primary" disabled={saving}>
                {saving ? "Đang lưu..." : (questionModal === "edit" ? "Lưu thay đổi" : "Thêm câu hỏi")}
              </button>
            </>
          }
        >
          <div className="adm-field-row">
            <div className="adm-field">
              <label htmlFor="adm-q-set">Bộ đề sử dụng</label>
              <select
                id="adm-q-set"
                className="adm-select"
                value={form.questionSetId}
                onChange={(event) => updateForm("questionSetId", event.target.value)}
                required
              >
                <option value="">— Chọn bộ đề —</option>
                {setOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </div>
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
          </div>

          <div className="adm-field adm-field-full">
            <label htmlFor="adm-q-content">Nội dung câu hỏi</label>
            <textarea
              id="adm-q-content"
              className="adm-textarea"
              rows={3}
              value={form.content}
              onChange={(event) => updateForm("content", event.target.value)}
              placeholder="Ví dụ: Chiến dịch Điện Biên Phủ diễn ra trong bao nhiêu ngày đêm?"
              required
            />
            <span className="adm-field-hint">Tối thiểu 5 ký tự, tối đa 2000 ký tự.</span>
          </div>

          <div className="adm-field-row">
            <div className="adm-field">
              <label htmlFor="adm-q-score">Điểm của câu</label>
              <input
                id="adm-q-score"
                className="adm-input"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.score}
                onChange={(event) => updateForm("score", event.target.value)}
              />
            </div>
            <div className="adm-field">
              <label htmlFor="adm-q-order">Thứ tự trong bộ</label>
              <input
                id="adm-q-order"
                className="adm-input"
                type="number"
                min="0"
                step="1"
                value={form.order}
                onChange={(event) => updateForm("order", event.target.value)}
                placeholder="Tự động nếu để trống"
              />
            </div>
          </div>

          <div className="adm-form-section">
            <strong>Phương án trả lời &amp; đáp án đúng</strong>
            <small>Chọn nút tròn bên trái để đánh dấu phương án đúng (dùng để chấm điểm tự động).</small>
          </div>

          {answerLetters.map((letter, index) => {
            const isCorrect = form.answerIndex === String(index);
            return (
              <div className={`adm-q-option${isCorrect ? " is-correct" : ""}`} key={letter}>
                <label className="adm-q-option-pick">
                  <input
                    type="radio"
                    name="adm-q-correct"
                    checked={isCorrect}
                    onChange={() => updateForm("answerIndex", String(index))}
                  />
                  <span className="adm-q-option-letter" aria-hidden="true">{letter}</span>
                  <span className="adm-q-option-label">{isCorrect ? "Đáp án đúng" : `Phương án ${letter}`}</span>
                </label>
                <input
                  className="adm-input"
                  value={form.options[index]}
                  onChange={(event) => updateOption(index, event.target.value)}
                  placeholder={`Nhập nội dung phương án ${letter}`}
                  aria-label={`Nội dung phương án ${letter}`}
                />
              </div>
            );
          })}

          <div className="adm-field adm-field-full">
            <label htmlFor="adm-q-explanation">Giải thích đáp án</label>
            <textarea
              id="adm-q-explanation"
              className="adm-textarea"
              rows={3}
              value={form.explanation}
              onChange={(event) => updateForm("explanation", event.target.value)}
              placeholder="Ví dụ: Chiến dịch kéo dài 56 ngày đêm, từ 13/3 đến 7/5/1954."
            />
            <span className="adm-field-hint">
              {form.explanation.trim()
                ? "Câu hỏi sẽ được tính vào nhóm “đã có giải thích”."
                : "Để trống nếu chưa biên soạn giải thích."}
            </span>
          </div>

          <div className="adm-note">
            <span className="adm-note-icon" aria-hidden="true"><Info size={18} /></span>
            <p>
              {questionModal === "edit" && activeQuestion
                ? <>Câu hỏi này hiện thuộc bộ <b>{activeQuestion.questionSetName || "chưa xác định"}</b>
                  {activeQuestion.packageName ? <> của gói <b>{activeQuestion.packageName}</b></> : null}. Đổi đáp án đúng
                  chỉ ảnh hưởng các lượt làm bài mới, điểm đã ghi nhận trước đó được giữ nguyên.</>
                : <>Câu hỏi mới sẽ được thêm vào cuối bộ đề đã chọn nếu bạn không nhập thứ tự riêng.</>}
            </p>
          </div>

        </AdminFormModal>
      ) : null}

      {deleteTarget ? (
        <AdminFormModal
          title="Xóa câu hỏi"
          subtitle="Hành động này không thể hoàn tác."
          onSubmit={handleDeleteSubmit}
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button type="button" className="adm-ghost" onClick={() => setDeleteTarget(null)}>Hủy bỏ</button>
              <button type="submit" className="adm-primary" disabled={saving}>
                {saving ? "Đang xóa..." : "Xóa câu hỏi"}
              </button>
            </>
          }
        >
          <div className="adm-note">
            <span className="adm-note-icon" aria-hidden="true"><AlertTriangle size={18} /></span>
            <p>
              Câu hỏi <b>{deleteTarget.code}</b> thuộc bộ <b>{deleteTarget.questionSetName || "chưa xác định"}</b> sẽ bị
              xóa khỏi ngân hàng câu hỏi. Nội dung câu hỏi:
            </p>
          </div>

          <div className="adm-field adm-field-full">
            <span className="adm-q-content">{deleteTarget.content}</span>
            <span className="adm-field-hint">
              Đáp án đúng hiện tại: {deleteTarget.answerLetter} — {deleteTarget.answerText || "chưa có nội dung"}.
            </span>
          </div>

          <div className="adm-note">
            <span className="adm-note-icon" aria-hidden="true"><Info size={18} /></span>
            <p>
              Điểm số và lịch sử làm bài đã ghi nhận <b>không thay đổi</b>, nhưng câu hỏi sẽ không còn xuất hiện trong
              bộ đề và các bài kiểm tra mới.
            </p>
          </div>
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



