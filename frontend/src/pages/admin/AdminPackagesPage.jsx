// src/pages/admin/AdminPackagesPage.jsx
// Trang quản trị Gói câu hỏi — dữ liệu thật từ GET /api/admin/packages.
// Số bộ đề / số câu hỏi của mỗi gói được đếm từ questionSets & questions trong MongoDB,
// không còn dữ liệu mẫu; thêm / sửa / xóa ghi trực tiếp vào collection `packages`.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Anchor,
  ArrowUpDown,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Landmark,
  Layers,
  Pencil,
  Percent,
  Plus,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Shield,
  Ship,
  Trash2,
  Zap
} from "lucide-react";
import AdminConsoleLayout from "./AdminConsoleLayout.jsx";
import AdminTopActions from "./AdminTopActions.jsx";
import AdminFormModal from "./AdminFormModal.jsx";
import { adminApi } from "../../lib/api.js";
import "./AdminPackages.css";

const numberFormat = new Intl.NumberFormat("vi-VN");
const percentFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const PAGE_SIZE = 10;

// Gói không lưu màu/biểu tượng trong DB: giao diện gán luân phiên theo thứ tự để hiển thị đồng nhất.
const PACKAGE_TONES = ["violet", "green", "amber", "blue", "purple"];
const PACKAGE_ICONS = [Flag, Ship, Landmark, Shield, ScrollText, Anchor, BookOpenCheck, Layers];

const difficultyOptions = [
  { value: "all", label: "Tất cả độ khó" },
  { value: "easy", label: "Cơ bản" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Nâng cao" }
];

const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Đang mở" },
  { value: "draft", label: "Bản nháp" },
  { value: "inactive", label: "Lưu trữ" }
];

const sortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "mostSets", label: "Nhiều bộ đề nhất" },
  { value: "mostXp", label: "Điểm XP cao nhất" },
  { value: "name", label: "Tên A → Z" }
];

const difficultyMeta = {
  easy: { label: "Cơ bản", tone: "green" },
  medium: { label: "Trung bình", tone: "amber" },
  hard: { label: "Nâng cao", tone: "violet" }
};

const statusMeta = {
  active: { label: "Đang mở", badge: "is-open" },
  draft: { label: "Bản nháp", badge: "is-draft" },
  inactive: { label: "Lưu trữ", badge: "is-archived" }
};

const EMPTY_PAGINATION = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 };
const EMPTY_FORM = {
  name: "",
  categoryId: "",
  description: "",
  difficulty: "medium",
  order: "0",
  totalScore: "0",
  estimatedTime: "0",
  status: "draft"
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
export default function AdminPackagesPage({ admin, onLogout, onNavigate }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [packageModal, setPackageModal] = useState(null); // "create" | "edit" | null
  const [activePackage, setActivePackage] = useState(null);
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

  // Nạp danh sách chủ đề thật để chọn cho gói câu hỏi (bộ lọc + biểu mẫu).
  useEffect(() => {
    let cancelled = false;
    adminApi("/admin/categories?page=1&limit=50")
      .then((payload) => {
        if (cancelled) return;
        setCategoryOptions(Array.isArray(payload.items) ? payload.items : []);
      })
      .catch(() => {
        if (!cancelled) setCategoryOptions([]);
      });
    return () => { cancelled = true; };
  }, []);

  const loadPackages = useCallback(async ({ silent = false } = {}) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoadError(null);
    if (!silent && !hasDataRef.current) setLoadState("loading");

    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort: sortOrder });
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (difficultyFilter !== "all") params.set("difficulty", difficultyFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("categoryId", categoryFilter);

    try {
      const payload = await adminApi(`/admin/packages?${params.toString()}`, { signal: controller.signal });
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
  }, [page, debouncedQuery, difficultyFilter, statusFilter, categoryFilter, sortOrder]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  async function handleRefresh() {
    setRefreshing(true);
    const result = await loadPackages();
    setRefreshing(false);
    if (result.ok) showToast("Đã làm mới danh sách gói câu hỏi.");
    else if (result.error) showToast(`Không tải được danh sách: ${result.error.message}`);
  }

  function resetFilters() {
    setQuery("");
    setDebouncedQuery("");
    setDifficultyFilter("all");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSortOrder("newest");
    setPage(1);
    showToast("Đã đặt lại bộ lọc danh sách gói câu hỏi.");
  }

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreatePackage() {
    setActivePackage(null);
    setForm(EMPTY_FORM);
    setPackageModal("create");
  }

  function handleEditPackage(row) {
    setActivePackage(row);
    setForm({
      name: row.name,
      categoryId: row.categoryId || "",
      description: row.description || "",
      difficulty: row.difficulty,
      order: String(row.order),
      totalScore: String(row.totalScore),
      estimatedTime: String(row.estimatedTime),
      status: row.status
    });
    setPackageModal("edit");
  }

  function closePackageModal() {
    setPackageModal(null);
    setActivePackage(null);
  }
  function closePackageModal() {
    setPackageModal(null);
    setActivePackage(null);
  }

  async function handlePackageSubmit(event) {
    event.preventDefault();
    if (saving) return;

    const name = form.name.trim();
    if (name.length < 2) {
      showToast("Vui lòng nhập tên gói câu hỏi (ít nhất 2 ký tự).");
      return;
    }

    const payload = {
      name,
      categoryId: form.categoryId || null,
      description: form.description.trim(),
      difficulty: form.difficulty,
      order: Number(form.order) || 0,
      totalScore: Number(form.totalScore) || 0,
      estimatedTime: Number(form.estimatedTime) || 0,
      status: form.status
    };

    setSaving(true);
    try {
      if (packageModal === "edit" && activePackage) {
        await adminApi(`/admin/packages/${activePackage.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        showToast(`Đã cập nhật gói “${name}”.`);
      } else {
        await adminApi("/admin/packages", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        showToast(`Đã tạo gói “${name}”.`);
        setPage(1);
      }
      closePackageModal();
      await loadPackages({ silent: true });
    } catch (error) {
      showToast(error.message || "Không lưu được gói câu hỏi.");
    } finally {
      setSaving(false);
    }
  }

  function requestDeletePackage(row) {
    setDeleteTarget(row);
  }

  async function handleDeleteSubmit(event) {
    event.preventDefault();
    if (saving || !deleteTarget) return;

    setSaving(true);
    try {
      await adminApi(`/admin/packages/${deleteTarget.id}`, { method: "DELETE" });
      const deletedName = deleteTarget.name;
      setDeleteTarget(null);
      showToast(`Đã xóa gói “${deletedName}”.`);
      if (items.length === 1 && pagination.page > 1) setPage(pagination.page - 1);
      else await loadPackages({ silent: true });
    } catch (error) {
      showToast(error.message || "Không xóa được gói câu hỏi.");
    } finally {
      setSaving(false);
    }
  }

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      {
        id: "total",
        label: "Tổng số gói",
        value: stats.total,
        unit: "Gói đề",
        icon: Layers,
        tone: "violet",
        legend: [
          { tone: "open", text: `${numberFormat.format(stats.active)} Đang mở` },
          { tone: "draft", text: `${numberFormat.format(stats.draft)} Nháp` },
          { tone: "archived", text: `${numberFormat.format(stats.inactive)} Lưu trữ` }
        ]
      },
      {
        id: "sets",
        label: "Bộ đề liên kết",
        value: stats.totalSets,
        unit: "Bộ đề",
        icon: BookOpenCheck,
        tone: "blue",
        pill: `${numberFormat.format(stats.totalQuestions)} câu hỏi trong ngân hàng`,
        pillTone: "green",
        pillIcon: CheckCircle2
      },
      {
        id: "xp",
        label: "Tổng XP phân bố",
        value: stats.totalXp,
        unit: "XP",
        icon: Zap,
        tone: "amber",
        pill: `TB ${numberFormat.format(stats.averageXp)} XP mỗi gói`,
        pillTone: "amber",
        pillIcon: Zap
      },
      {
        id: "rate",
        label: "Tỷ lệ hoàn thành TB",
        value: stats.completionRate,
        unit: "% bài làm",
        icon: Percent,
        tone: "green",
        format: "percent",
        percent: stats.completionRate,
        percentHint: stats.totalAttempts
          ? `${numberFormat.format(stats.completedAttempts)}/${numberFormat.format(stats.totalAttempts)} lượt làm bài đã hoàn thành`
          : "chưa có lượt làm bài nào được ghi nhận"
      }
    ];
  }, [stats]);

  const pageList = useMemo(
    () => buildPageList(pagination.page, pagination.totalPages),
    [pagination]
  );

  const startItem = pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);
  const hasFilters = Boolean(debouncedQuery.trim())
    || difficultyFilter !== "all"
    || statusFilter !== "all"
    || categoryFilter !== "all";

  return (
    <AdminConsoleLayout
      admin={admin}
      onLogout={onLogout}
      onNavigate={onNavigate}
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
          <h2>Không tải được danh sách gói câu hỏi</h2>
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
                            width: `${Math.min(100, Math.max(0, item.percent))}%`,
                            background: "linear-gradient(90deg, #34d399, #10b981)"
                          }}
                        />
                      </span>
                      <small>{item.percentHint}</small>
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

          <section className="adm-filter-bar is-packages" aria-label="Bộ lọc gói câu hỏi">
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
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo trạng thái"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              className="adm-filter-select"
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo chủ đề"
            >
              <option value="all">Tất cả chủ đề</option>
              <option value="none">Chưa gán chủ đề</option>
              {categoryOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>

            <div className="adm-filter-actions">
              <label className="adm-sort">
                <ArrowUpDown size={15} aria-hidden="true" />
                <span className="adm-sort-label">Sắp xếp thứ tự hiển thị</span>
                <select
                  value={sortOrder}
                  onChange={(event) => {
                    setSortOrder(event.target.value);
                    setPage(1);
                  }}
                  aria-label="Sắp xếp thứ tự hiển thị"
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

              <button type="button" className="adm-primary" onClick={openCreatePackage}>
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
                    <th scope="col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="adm-empty-row">
                        {hasFilters
                          ? "Không tìm thấy gói câu hỏi phù hợp với bộ lọc hiện tại."
                          : "Chưa có gói câu hỏi nào. Hãy tạo gói đầu tiên để bắt đầu xây dựng nội dung."}
                      </td>
                    </tr>
                  ) : (
                    items.map((row, index) => {
                      const ThumbIcon = PACKAGE_ICONS[index % PACKAGE_ICONS.length];
                      const tone = PACKAGE_TONES[index % PACKAGE_TONES.length];
                      const difficulty = difficultyMeta[row.difficulty] || difficultyMeta.medium;
                      const status = statusMeta[row.status] || statusMeta.active;
                      const isLocked = row.setCount > 0;
                      return (
                        <tr key={row.id}>
                          <td>
                            <span className={`adm-pkg-thumb is-${tone}`} aria-hidden="true">
                              <ThumbIcon size={18} />
                            </span>
                          </td>
                          <td>
                            <span className="adm-pkg-name">
                              <strong>{row.name}</strong>
                              <small>
                                <Landmark size={11} aria-hidden="true" />
                                {row.categoryName || "Chưa gán chủ đề"}
                              </small>
                            </span>
                          </td>
                          <td>
                            <p className="adm-pkg-desc">
                              {row.description || "Chưa có mô tả cho gói câu hỏi này."}
                            </p>
                          </td>
                          <td>
                            <span className={`adm-diff-pill is-${difficulty.tone}`}>
                              {difficulty.label}
                            </span>
                          </td>
                          <td>
                            <span className="adm-pkg-count">
                              {numberFormat.format(row.setCount)} Bộ đề
                              <small>{numberFormat.format(row.questionCount)} Câu hỏi</small>
                            </span>
                          </td>
                          <td>
                            <span className="adm-pkg-points">
                              <strong>
                                <Zap size={11} aria-hidden="true" /> +{numberFormat.format(row.totalScore)} XP
                              </strong>
                              <small>~{numberFormat.format(row.estimatedTime)} phút</small>
                            </span>
                          </td>
                          <td>
                            <span className={`adm-badge ${status.badge}`}>
                              <i aria-hidden="true" />
                              {status.label}
                            </span>
                          </td>
                          <td>
                            <span className="adm-pkg-date">{formatShortDate(row.updatedAt)}</span>
                          </td>
                          <td>
                            <div className="adm-table-actions">
                              <button
                                type="button"
                                className="adm-eye-btn"
                                onClick={() => handleEditPackage(row)}
                                aria-label={`Chỉnh sửa ${row.name}`}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                className="adm-eye-btn is-danger"
                                onClick={() => requestDeletePackage(row)}
                                title={isLocked ? "Gói còn bộ đề, không thể xóa" : "Xóa gói câu hỏi"}
                                aria-label={`Xóa ${row.name}`}
                              >
                                {isLocked ? <AlertTriangle size={15} /> : <Trash2 size={15} />}
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
                <b>{numberFormat.format(pagination.total)}</b> gói câu hỏi
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

      {packageModal ? (
        <AdminFormModal
          title={packageModal === "edit" ? "Chỉnh sửa gói câu hỏi" : "Tạo gói câu hỏi mới"}
          subtitle={packageModal === "edit"
            ? "Thay đổi được lưu trực tiếp vào cơ sở dữ liệu."
            : "Gói mới sẽ xuất hiện ở cổng học tập khi trạng thái là “Đang mở”."}
          size="lg"
          onSubmit={handlePackageSubmit}
          onClose={closePackageModal}
          footer={
            <>
              <button type="button" className="adm-ghost" onClick={closePackageModal}>Hủy bỏ</button>
              <button type="submit" className="adm-primary" disabled={saving}>
                {saving
                  ? "Đang lưu..."
                  : packageModal === "edit" ? "Lưu thay đổi" : "Tạo gói ngay"}
              </button>
            </>
          }
        >
          <div className="adm-field">
            <label htmlFor="adm-pkg-name">Tên gói câu hỏi</label>
            <input
              id="adm-pkg-name"
              className="adm-input"
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="Ví dụ: Chiến dịch Điện Biên Phủ 1954"
              autoFocus
            />
          </div>

          <div className="adm-field-row">
            <div className="adm-field">
              <label htmlFor="adm-pkg-category">Chủ đề / thời kỳ</label>
              <select
                id="adm-pkg-category"
                className="adm-select"
                value={form.categoryId}
                onChange={(event) => updateForm("categoryId", event.target.value)}
              >
                <option value="">Chưa gán chủ đề</option>
                {categoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
              <span className="adm-field-hint">
                {categoryOptions.length
                  ? "Danh sách lấy từ trang quản lý Chủ đề."
                  : "Chưa có chủ đề nào — hãy tạo chủ đề trước để gán cho gói."}
              </span>
            </div>
            <div className="adm-field">
              <label htmlFor="adm-pkg-difficulty">Độ khó</label>
              <select
                id="adm-pkg-difficulty"
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

          <div className="adm-field">
            <label htmlFor="adm-pkg-description">Mô tả tóm tắt</label>
            <textarea
              id="adm-pkg-description"
              className="adm-textarea"
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              placeholder="Tóm tắt nội dung, bối cảnh lịch sử của gói câu hỏi..."
            />
          </div>

          <div className="adm-field-row is-3">
            <div className="adm-field">
              <label htmlFor="adm-pkg-xp">Điểm XP thưởng</label>
              <input
                id="adm-pkg-xp"
                type="number"
                min="0"
                className="adm-input"
                value={form.totalScore}
                onChange={(event) => updateForm("totalScore", event.target.value)}
              />
            </div>
            <div className="adm-field">
              <label htmlFor="adm-pkg-minutes">Thời lượng (phút)</label>
              <input
                id="adm-pkg-minutes"
                type="number"
                min="0"
                className="adm-input"
                value={form.estimatedTime}
                onChange={(event) => updateForm("estimatedTime", event.target.value)}
              />
            </div>
            <div className="adm-field">
              <label htmlFor="adm-pkg-order">Thứ tự hiển thị</label>
              <input
                id="adm-pkg-order"
                type="number"
                min="0"
                className="adm-input"
                value={form.order}
                onChange={(event) => updateForm("order", event.target.value)}
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
              <option value="active">Đang mở</option>
              <option value="draft">Bản nháp</option>
              <option value="inactive">Lưu trữ</option>
            </select>
            <span className="adm-field-hint">Bản nháp và lưu trữ sẽ không hiển thị với học viên ở cổng học tập.</span>
          </div>

          <div className="adm-note">
            <span className="adm-note-icon" aria-hidden="true"><BookOpenCheck size={18} /></span>
            <p>
              {packageModal === "edit" && activePackage
                ? <>Gói đang có <b>{numberFormat.format(activePackage.setCount)} bộ đề</b> và{" "}
                  <b>{numberFormat.format(activePackage.questionCount)} câu hỏi</b>. Hai chỉ số này được đếm tự động
                  từ ngân hàng câu hỏi, nên muốn thay đổi hãy quản lý ở trang Bộ câu hỏi.</>
                : <>Số bộ đề và số câu hỏi được đếm tự động từ ngân hàng câu hỏi sau khi bạn thêm bộ đề cho gói này.</>}
            </p>
          </div>
        </AdminFormModal>
      ) : null}

      {deleteTarget ? (
        <AdminFormModal
          title="Xóa gói câu hỏi"
          subtitle="Hành động này không thể hoàn tác."
          onSubmit={handleDeleteSubmit}
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button type="button" className="adm-ghost" onClick={() => setDeleteTarget(null)}>Hủy bỏ</button>
              <button
                type="submit"
                className="adm-primary"
                disabled={saving || deleteTarget.setCount > 0}
              >
                {saving ? "Đang xóa..." : "Xóa gói câu hỏi"}
              </button>
            </>
          }
        >
          <div className="adm-note">
            <span className="adm-note-icon" aria-hidden="true"><AlertTriangle size={18} /></span>
            <p>
              Gói <b>{deleteTarget.name}</b> sẽ bị xóa khỏi hệ thống. Chỉ xóa được gói không còn bộ câu hỏi nào.
            </p>
          </div>

          {deleteTarget.setCount > 0 ? (
            <div className="adm-note">
              <span className="adm-note-icon" aria-hidden="true"><AlertTriangle size={18} /></span>
              <p>
                Gói đang chứa <b>{numberFormat.format(deleteTarget.setCount)} bộ đề</b> và{" "}
                <b>{numberFormat.format(deleteTarget.questionCount)} câu hỏi</b>. Hãy xóa hoặc chuyển các bộ đề
                sang gói khác trước khi xóa gói này.
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
