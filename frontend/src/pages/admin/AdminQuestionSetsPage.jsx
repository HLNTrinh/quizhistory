// src/pages/admin/AdminQuestionSetsPage.jsx
// Trang quản trị Bộ câu hỏi (chặng) — dữ liệu thật từ GET /api/admin/question-sets.
// Số câu hỏi, số lượt làm bài và độ chính xác của từng bộ được backend đếm từ
// collection `questions` / `attempts`, không còn dữ liệu mẫu.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
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
  LockOpen,
  Pencil,
  Percent,
  Plus,
  RotateCcw,
  Trash2
} from "lucide-react";
import AdminConsoleLayout from "./AdminConsoleLayout.jsx";
import AdminTopActions from "./AdminTopActions.jsx";
import AdminFormModal from "./AdminFormModal.jsx";
import { adminApi } from "../../lib/api.js";
import "./AdminQuestionSets.css";

const numberFormat = new Intl.NumberFormat("vi-VN");
const percentFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const PAGE_SIZE = 10;

const sortOptions = [
  { value: "order", label: "Thứ tự chặng" },
  { value: "newest", label: "Mới cập nhật" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "mostQuestions", label: "Nhiều câu hỏi nhất" },
  { value: "hardest", label: "Độ khó tăng dần" },
  { value: "name", label: "Tên A → Z" }
];

const difficultyMeta = {
  easy: { label: "Cơ bản", tone: "green" },
  medium: { label: "Trung bình", tone: "amber" },
  hard: { label: "Nâng cao", tone: "violet" }
};

const statusMeta = {
  active: { label: "Đang mở", tone: "green" },
  draft: { label: "Bản nháp", tone: "amber" },
  locked: { label: "Tạm khóa", tone: "violet" },
  inactive: { label: "Lưu trữ", tone: "blue" }
};

const unlockOptions = [
  { value: "open", label: "Mở tự động (không cần chặng trước)" },
  { value: "complete_previous_set", label: "Hoàn thành chặng trước" }
];

const EMPTY_PAGINATION = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 };
const EMPTY_FORM = {
  packageId: "",
  name: "",
  description: "",
  order: "0",
  difficulty: "medium",
  timeLimit: "0",
  status: "draft",
  unlockType: "open"
};

function formatShortDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  const now = new Date();
  const options = { day: "2-digit", month: "2-digit" };
  if (date.getFullYear() !== now.getFullYear()) options.year = "numeric";
  return new Intl.DateTimeFormat("vi-VN", options).format(date);
}

function buildPageList(current, totalPages) {
  const total = Math.max(1, totalPages);
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const list = [];
  for (let page = start; page < start + 5 && page <= total; page += 1) list.push(page);
  return list;
}

function describeUnlock(unlockType) {
  return unlockType === "complete_previous_set"
    ? "Hoàn thành chặng trước"
    : "Mở tự động";
}

export default function AdminQuestionSetsPage({ admin, onLogout, onNavigate }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [packageFilter, setPackageFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("order");
  const [page, setPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState("");
  const [packageOptions, setPackageOptions] = useState([]);
  const [questionOptions, setQuestionOptions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionRelationFilter, setQuestionRelationFilter] = useState("all");
  const [setModal, setSetModal] = useState(null); // "create" | "edit" | null
  const [activeSet, setActiveSet] = useState(null);
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

  // Nạp danh sách gói câu hỏi thật để chọn gói cha (bộ lọc + biểu mẫu).
  useEffect(() => {
    let cancelled = false;
    adminApi("/admin/packages?page=1&limit=50&sort=name")
      .then((payload) => {
        if (cancelled) return;
        setPackageOptions(Array.isArray(payload.items) ? payload.items : []);
      })
      .catch(() => {
        if (!cancelled) setPackageOptions([]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    adminApi("/admin/questions?page=1&limit=50&sort=order")
      .then((payload) => {
        if (!cancelled) setQuestionOptions(Array.isArray(payload.items) ? payload.items : []);
      })
      .catch(() => {
        if (!cancelled) setQuestionOptions([]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!setModal) return undefined;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ page: "1", limit: "50", sort: "order" });
      if (questionSearch.trim()) params.set("q", questionSearch.trim());
      if (questionRelationFilter === "none") params.set("questionSetId", "none");
      if (questionRelationFilter === "current" && activeSet?.id) {
        params.set("questionSetId", activeSet.id);
      }
      adminApi(`/admin/questions?${params.toString()}`)
        .then((payload) => {
          if (cancelled) return;
          let options = Array.isArray(payload.items) ? payload.items : [];
          if (questionRelationFilter === "other") {
            options = options.filter((question) => (
              !question.questionSetId || question.questionSetId !== activeSet?.id
            ));
          }
          setQuestionOptions(options);
        })
        .catch(() => {
          if (!cancelled) setQuestionOptions([]);
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [setModal, activeSet?.id, questionSearch, questionRelationFilter]);

  const loadQuestionSets = useCallback(async ({ silent = false } = {}) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoadError(null);
    if (!silent && !hasDataRef.current) setLoadState("loading");

    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort: sortOrder });
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (packageFilter !== "all") params.set("packageId", packageFilter);

    try {
      const payload = await adminApi(`/admin/question-sets?${params.toString()}`, { signal: controller.signal });
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
  }, [page, debouncedQuery, packageFilter, sortOrder]);

  useEffect(() => {
    loadQuestionSets();
  }, [loadQuestionSets]);

  async function handleRefresh() {
    const result = await loadQuestionSets();
    if (result.ok) showToast("Đã làm mới danh sách bộ câu hỏi.");
    else if (result.error) showToast(`Không tải được danh sách: ${result.error.message}`);
  }

  function resetFilters() {
    setQuery("");
    setDebouncedQuery("");
    setPackageFilter("all");
    setSortOrder("order");
    setPage(1);
    showToast("Đã đặt lại bộ lọc danh sách bộ câu hỏi.");
  }

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const defaultPackageId = packageFilter !== "all"
    ? packageFilter
    : (packageOptions[0]?.id || "");

  function openCreateSet() {
    setActiveSet(null);
    setSelectedQuestionIds([]);
    setQuestionSearch("");
    setQuestionRelationFilter("none");
    setForm({
      ...EMPTY_FORM,
      packageId: defaultPackageId,
      order: String(items.length ? Math.max(...items.map((row) => row.order)) + 1 : 1)
    });
    setSetModal("create");
  }

  function handleEditSet(row) {
    setActiveSet(row);
    setQuestionSearch("");
    setQuestionRelationFilter("all");
    setForm({
      packageId: row.packageId || "",
      name: row.name,
      description: row.description || "",
      order: String(row.order),
      difficulty: row.difficulty,
      timeLimit: String(row.timeLimit),
      status: row.status,
      unlockType: row.unlockType
    });
    setSelectedQuestionIds([]);
    setSetModal("edit");
    adminApi("/admin/questions?page=1&limit=50&sort=order")
      .then((payload) => {
        const options = Array.isArray(payload.items) ? payload.items : [];
        setQuestionOptions(options);
        setSelectedQuestionIds(
          options
            .filter((question) => question.questionSetId === row.id)
            .map((question) => question.id)
        );
      })
      .catch(() => setQuestionOptions([]));
  }

  function closeSetModal() {
    setSetModal(null);
    setActiveSet(null);
  }

  async function handleSetSubmit(event) {
    event.preventDefault();
    if (saving) return;

    const name = form.name.trim();
    if (!form.packageId) {
      showToast("Hãy chọn gói câu hỏi (gói cha) cho bộ này.");
      return;
    }
    if (name.length < 2) {
      showToast("Vui lòng nhập tên bộ câu hỏi (ít nhất 2 ký tự).");
      return;
    }

    const payload = {
      packageId: form.packageId,
      name,
      description: form.description.trim(),
      order: Number(form.order) || 0,
      difficulty: form.difficulty,
      timeLimit: Number(form.timeLimit) || 0,
      questionIds: selectedQuestionIds,
      status: form.status,
      unlockType: form.unlockType
    };

    setSaving(true);
    try {
      if (setModal === "edit" && activeSet) {
        await adminApi(`/admin/question-sets/${activeSet.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        showToast(`Đã cập nhật bộ “${name}”.`);
      } else {
        await adminApi("/admin/question-sets", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        showToast(`Đã tạo bộ “${name}”.`);
        setPage(1);
      }
      closeSetModal();
      await loadQuestionSets({ silent: true });
    } catch (error) {
      showToast(error.message || "Không lưu được bộ câu hỏi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSubmit(event) {
    event.preventDefault();
    if (saving || !deleteTarget) return;

    setSaving(true);
    try {
      const payload = await adminApi(`/admin/question-sets/${deleteTarget.id}`, { method: "DELETE" });
      const deletedName = deleteTarget.name;
      const removedQuestions = Number(payload.deletedQuestions) || 0;
      setDeleteTarget(null);
      showToast(removedQuestions > 0
        ? `Đã xóa bộ “${deletedName}” cùng ${numberFormat.format(removedQuestions)} câu hỏi.`
        : `Đã xóa bộ “${deletedName}”.`);
      if (items.length === 1 && pagination.page > 1) setPage(pagination.page - 1);
      else await loadQuestionSets({ silent: true });
    } catch (error) {
      showToast(error.message || "Không xóa được bộ câu hỏi.");
    } finally {
      setSaving(false);
    }
  }

  const hasFilters = Boolean(debouncedQuery.trim())
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
        label: "Tổng số bộ câu hỏi",
        value: stats.total,
        unit: "Bộ",
        icon: FolderOpen,
        tone: "violet",
        legend: [
          { tone: "open", text: `${numberFormat.format(stats.active)} Đang mở` },
          { tone: "draft", text: `${numberFormat.format(stats.draft)} Nháp` },
          { tone: "locked", text: `${numberFormat.format(stats.locked)} Tạm khóa` }
        ]
      },
      {
        id: "avgQuestions",
        label: "TB câu hỏi / bộ",
        value: stats.averageQuestions,
        unit: "Câu",
        icon: Hourglass,
        tone: "amber",
        note: `${numberFormat.format(stats.totalQuestions)} câu hỏi trong ${numberFormat.format(stats.setsWithQuestions)} bộ đã có nội dung`,
        noteIcon: Clock
      },
      {
        id: "sequential",
        label: "Điều kiện tuần tự",
        value: stats.sequentialRatio,
        unit: "%",
        format: "percent",
        icon: Lock,
        tone: "green",
        pill: `${numberFormat.format(stats.sequentialSets)} bộ khóa theo chặng trước`,
        pillTone: "green",
        pillIcon: Lock
      },
      {
        id: "passRate",
        label: "Tỷ lệ vượt qua TB",
        value: stats.passRate,
        unit: "%",
        format: "percent",
        icon: Award,
        tone: "amber",
        note: stats.totalAttempts
          ? `${numberFormat.format(stats.passedAttempts)}/${numberFormat.format(stats.totalAttempts)} lượt đạt ≥ ${numberFormat.format(stats.passThreshold)}%`
          : "Chưa có lượt làm bài nào được ghi nhận",
        noteIcon: stats.totalAttempts ? Info : Percent
      }
    ];
  }, [stats]);

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
          searchPlaceholder="Tìm tên bộ, tên gói..."
          searchLabel="Tìm kiếm bộ câu hỏi"
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
          <h2>Không tải được danh sách bộ câu hỏi</h2>
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
            <label className="adm-sort">
              <ArrowUpDown size={15} aria-hidden="true" />
              <span className="adm-sort-label">Sắp xếp thứ tự</span>
              <select
                value={sortOrder}
                onChange={(event) => {
                  setSortOrder(event.target.value);
                  setPage(1);
                }}
                aria-label="Sắp xếp lại thứ tự bộ câu hỏi"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

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

            <button type="button" className="adm-ghost adm-filter-reset" onClick={resetFilters} disabled={!hasFilters}>
              <RotateCcw size={15} /> Đặt lại bộ lọc
            </button>

            <div className="adm-filter-actions">
              <button type="button" className="adm-primary" onClick={openCreateSet}>
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
                    <th scope="col">Nội dung</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="adm-empty-row">
                        {hasFilters
                          ? "Không tìm thấy bộ câu hỏi phù hợp với bộ lọc hiện tại."
                          : "Chưa có bộ câu hỏi nào. Hãy tạo bộ đầu tiên cho gói câu hỏi."}
                      </td>
                    </tr>
                  ) : (
                    items.map((row) => {
                      const difficulty = difficultyMeta[row.difficulty] || difficultyMeta.medium;
                      const status = statusMeta[row.status] || statusMeta.active;
                      const orderLabel = String(row.order).padStart(2, "0");
                      const UnlockIcon = row.unlockType === "complete_previous_set" ? Lock : LockOpen;
                      return (
                        <tr key={row.id}>
                          <td>
                            <div className="adm-qset-order">
                              <span className="adm-qset-index" aria-hidden="true">{orderLabel}</span>
                              <span className="adm-qset-order-meta">
                                <small>Chặng #{orderLabel}</small>
                                <span className="adm-qset-code">Cập nhật {formatShortDate(row.updatedAt)}</span>
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="adm-qset-name">
                              <strong>{row.name}</strong>
                              <small>{row.description || "Chưa có mô tả cho bộ câu hỏi này."}</small>
                            </span>
                          </td>
                          <td>
                            <span className="adm-qset-parent">
                              <strong>{row.packageName}</strong>
                              <span className="adm-qset-term">{row.categoryName || "Chưa gán chủ đề"}</span>
                            </span>
                          </td>
                          <td>
                            <span className={`adm-qset-unlock${row.unlockType === "open" ? " is-open" : ""}`}>
                              <UnlockIcon size={12} aria-hidden="true" />
                              {describeUnlock(row.unlockType)}
                            </span>
                          </td>
                          <td>
                            <span className={`adm-qset-diff is-${difficulty.tone}`}>{difficulty.label}</span>
                          </td>
                          <td>
                            <span className="adm-qset-count">
                              {numberFormat.format(row.questionCount)} câu
                              <small>
                                {numberFormat.format(row.score)} điểm
                                {" · "}
                                {row.timeLimit > 0 ? `${numberFormat.format(row.timeLimit)} phút` : "không giới hạn"}
                              </small>
                            </span>
                          </td>
                          <td>
                            <span className="adm-qset-status">
                              <span className={`adm-pill is-${status.tone}`}>{status.label}</span>
                              <small>
                                {row.attemptCount > 0
                                  ? `${numberFormat.format(row.attemptCount)} lượt · ${percentFormat.format(row.averageAccuracy)}% đúng`
                                  : "Chưa có lượt làm bài"}
                              </small>
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
                                className={`adm-eye-btn${row.attemptCount > 0 ? "" : " is-danger"}`}
                                onClick={() => setDeleteTarget(row)}
                                disabled={row.attemptCount > 0}
                                aria-label={`Xóa ${row.name}`}
                                title={row.attemptCount > 0
                                  ? "Bộ đã có lượt làm bài của học viên nên không thể xóa."
                                  : "Xóa bộ câu hỏi"}
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
                <b>{numberFormat.format(pagination.total)}</b> bộ câu hỏi
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

      {setModal ? (
        <AdminFormModal
          title={setModal === "edit" ? "Chỉnh sửa bộ câu hỏi" : "Tạo bộ câu hỏi mới"}
          subtitle={setModal === "edit"
            ? "Thay đổi được lưu trực tiếp vào cơ sở dữ liệu."
            : "Bộ mới sẽ hiển thị ở cổng học tập khi trạng thái là “Đang mở”."}
          size="lg"
          onSubmit={handleSetSubmit}
          onClose={closeSetModal}
          footer={
            <>
              <button type="button" className="adm-ghost" onClick={closeSetModal}>Hủy bỏ</button>
              <button type="submit" className="adm-primary" disabled={saving || !packageOptions.length}>
                {saving
                  ? "Đang lưu..."
                  : setModal === "edit" ? "Lưu thay đổi" : "Tạo bộ ngay"}
              </button>
            </>
          }
        >
          <div className="adm-field">
            <label htmlFor="adm-set-package">Gói câu hỏi (gói cha)</label>
            <select
              id="adm-set-package"
              className="adm-select"
              value={form.packageId}
              onChange={(event) => updateForm("packageId", event.target.value)}
            >
              <option value="">— Chọn gói câu hỏi —</option>
              {packageOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
            <span className="adm-field-hint">
              {packageOptions.length
                ? "Bộ câu hỏi thuộc một gói và tuân theo thứ tự chặng của gói đó."
                : "Chưa có gói câu hỏi nào — hãy tạo gói ở trang Gói câu hỏi trước."}
            </span>
          </div>

          <div className="adm-field">
            <label htmlFor="adm-set-name">Tên bộ câu hỏi</label>
            <input
              id="adm-set-name"
              className="adm-input"
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="Ví dụ: Chặng 1: Buổi đầu dựng nước"
              autoFocus
            />
          </div>

          <div className="adm-field">
            <label htmlFor="adm-set-description">Mô tả tóm tắt</label>
            <textarea
              id="adm-set-description"
              className="adm-textarea"
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              placeholder="Tóm tắt nội dung trọng tâm của bộ câu hỏi..."
            />
          </div>

          <div className="adm-field-row is-3">
            <div className="adm-field">
              <label htmlFor="adm-set-order">Thứ tự chặng</label>
              <input
                id="adm-set-order"
                type="number"
                min="0"
                className="adm-input"
                value={form.order}
                onChange={(event) => updateForm("order", event.target.value)}
              />
            </div>
            <div className="adm-field">
              <label>Điểm của bộ</label>
              <input className="adm-input" value={setModal === "edit" ? `${activeSet?.score || 0} điểm (tự động)` : "Tự động tính từ điểm các câu hỏi"} readOnly />
            </div>
            <div className="adm-field">
              <label htmlFor="adm-set-time">Thời lượng (phút)</label>
              <input
                id="adm-set-time"
                type="number"
                min="0"
                className="adm-input"
                value={form.timeLimit}
                onChange={(event) => updateForm("timeLimit", event.target.value)}
              />
            </div>
          </div>

          <div className="adm-field">
            <label>Câu hỏi thuộc bộ</label>
            <div className="adm-inline-filters">
              <input
                className="adm-input"
                value={questionSearch}
                onChange={(event) => setQuestionSearch(event.target.value)}
                placeholder="Tìm nội dung hoặc mã câu hỏi..."
              />
              <select
                className="adm-select"
                value={questionRelationFilter}
                onChange={(event) => setQuestionRelationFilter(event.target.value)}
              >
                <option value="all">Tất cả câu hỏi</option>
                <option value="none">Chưa thuộc bộ nào</option>
                <option value="current">Thuộc bộ hiện tại</option>
                <option value="other">Thuộc bộ khác</option>
              </select>
            </div>
            <div className="adm-inline-selection">
              {questionOptions.length ? questionOptions.map((question) => (
                <label key={question.id} className="adm-inline-option">
                  <input
                    type="checkbox"
                    checked={selectedQuestionIds.includes(question.id)}
                    onChange={(event) => {
                      setSelectedQuestionIds((current) => event.target.checked
                        ? [...current, question.id]
                        : current.filter((id) => id !== question.id));
                    }}
                  />
                  <span>
                    <strong>{question.content}</strong>
                    <small>{question.code} · {question.score} điểm</small>
                  </span>
                  {question.questionSetId && question.questionSetId !== activeSet?.id ? (
                    <em>Đang thuộc bộ khác</em>
                  ) : null}
                </label>
              )) : (
                <span className="adm-field-hint">Chưa có câu hỏi nào trong hệ thống.</span>
              )}
            </div>
          </div>

          <div className="adm-field-row">
            <div className="adm-field">
              <label htmlFor="adm-set-difficulty">Độ khó</label>
              <select
                id="adm-set-difficulty"
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
              <label htmlFor="adm-set-status">Trạng thái</label>
              <select
                id="adm-set-status"
                className="adm-select"
                value={form.status}
                onChange={(event) => updateForm("status", event.target.value)}
              >
                <option value="active">Đang mở</option>
                <option value="draft">Bản nháp</option>
                <option value="locked">Tạm khóa</option>
                <option value="inactive">Lưu trữ</option>
              </select>
            </div>
          </div>

          <div className="adm-field">
            <label htmlFor="adm-set-unlock">Điều kiện mở khóa</label>
            <select
              id="adm-set-unlock"
              className="adm-select"
              value={form.unlockType}
              onChange={(event) => updateForm("unlockType", event.target.value)}
            >
              {unlockOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <span className="adm-field-hint">
              “Hoàn thành chặng trước” giữ luồng học tuần tự: học viên phải làm xong chặng đứng trước mới mở được chặng này.
            </span>
          </div>

          <div className="adm-note">
            <span className="adm-note-icon" aria-hidden="true"><FolderOpen size={18} /></span>
            <p>
              {setModal === "edit" && activeSet
                ? <>Bộ này hiện có <b>{numberFormat.format(activeSet.questionCount)} câu hỏi</b> và{" "}
                  <b>{numberFormat.format(activeSet.attemptCount)} lượt làm bài</b>. Số câu hỏi được đếm tự động
                  từ ngân hàng câu hỏi, nên muốn thêm câu hãy quản lý ở trang Câu hỏi.</>
                : <>Số câu hỏi của bộ được đếm tự động từ ngân hàng câu hỏi sau khi bạn thêm câu hỏi cho bộ này.</>}
            </p>
          </div>
        </AdminFormModal>
      ) : null}

      {deleteTarget ? (
        <AdminFormModal
          title="Xóa bộ câu hỏi"
          subtitle="Hành động này không thể hoàn tác."
          onSubmit={handleDeleteSubmit}
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button type="button" className="adm-ghost" onClick={() => setDeleteTarget(null)}>Hủy bỏ</button>
              <button
                type="submit"
                className="adm-primary"
                disabled={saving || deleteTarget.attemptCount > 0}
              >
                {saving ? "Đang xóa..." : "Xóa bộ câu hỏi"}
              </button>
            </>
          }
        >
          <div className="adm-note">
            <span className="adm-note-icon" aria-hidden="true"><AlertTriangle size={18} /></span>
            <p>
              Bộ <b>{deleteTarget.name}</b> (gói <b>{deleteTarget.packageName}</b>) sẽ bị xóa khỏi hệ thống
              cùng <b>{numberFormat.format(deleteTarget.questionCount)} câu hỏi</b> bên trong.
            </p>
          </div>

          {deleteTarget.attemptCount > 0 ? (
            <div className="adm-note">
              <span className="adm-note-icon" aria-hidden="true"><AlertTriangle size={18} /></span>
              <p>
                Bộ đã có <b>{numberFormat.format(deleteTarget.attemptCount)} lượt làm bài</b> của học viên nên
                không thể xóa để giữ lịch sử học tập. Hãy chuyển trạng thái sang <b>Tạm khóa</b> hoặc{" "}
                <b>Lưu trữ</b> thay vì xóa.
              </p>
            </div>
          ) : null}
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

