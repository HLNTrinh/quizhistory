// src/pages/admin/AdminCategoriesPage.jsx
// Trang quản trị Chủ đề / Thời kỳ lịch sử — dữ liệu thật từ GET /api/admin/categories.
// Số gói và số câu hỏi của mỗi chủ đề được tổng hợp từ package/questionSet/question trong MongoDB.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  FolderTree,
  Globe2,
  Landmark,
  Layers,
  Package,
  Pencil,
  Percent,
  Plus,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Trash2
} from "lucide-react";
import AdminConsoleLayout from "./AdminConsoleLayout.jsx";
import AdminTopActions from "./AdminTopActions.jsx";
import AdminFormModal from "./AdminFormModal.jsx";
import { adminApi } from "../../lib/api.js";
import "./AdminCategories.css";

const numberFormat = new Intl.NumberFormat("vi-VN");
const percentFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const PAGE_SIZE = 10;

// Chủ đề không lưu màu/biểu tượng trong DB: giao diện gán luân phiên theo thứ tự để hiển thị đồng nhất.
const CATEGORY_TONES = ["amber", "violet", "green", "blue", "purple"];
const CATEGORY_ICONS = [Landmark, Flag, ScrollText, Globe2, BookOpenCheck, Layers, FolderTree];

const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Đang hoạt động" },
  { value: "inactive", label: "Tạm ẩn" }
];

const sortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "mostPackages", label: "Nhiều gói nhất" },
  { value: "mostQuestions", label: "Nhiều câu hỏi nhất" }
];

const statusMeta = {
  active: { label: "Đang hoạt động", badge: "is-open" },
  inactive: { label: "Tạm ẩn", badge: "is-inactive" }
};

const EMPTY_PAGINATION = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 };
const EMPTY_FORM = { name: "", description: "", status: "active" };

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

export default function AdminCategoriesPage({ admin, onLogout, onNavigate }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState("");
  const [categoryModal, setCategoryModal] = useState(null); // "create" | "edit" | null
  const [activeCategory, setActiveCategory] = useState(null);
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

  const loadCategories = useCallback(async ({ silent = false } = {}) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoadError(null);
    if (!silent && !hasDataRef.current) setLoadState("loading");

    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort: sortOrder });
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (statusFilter !== "all") params.set("status", statusFilter);

    try {
      const payload = await adminApi(`/admin/categories?${params.toString()}`, { signal: controller.signal });
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
  }, [page, debouncedQuery, statusFilter, sortOrder]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  async function handleRefresh() {
    setRefreshing(true);
    const result = await loadCategories();
    setRefreshing(false);
    if (result.ok) showToast("Đã làm mới danh sách chủ đề.");
    else if (result.error) showToast(`Không tải được danh sách: ${result.error.message}`);
  }

  function resetFilters() {
    setQuery("");
    setDebouncedQuery("");
    setStatusFilter("all");
    setSortOrder("newest");
    setPage(1);
    showToast("Đã đặt lại bộ lọc danh sách chủ đề.");
  }

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreateCategory() {
    setActiveCategory(null);
    setForm(EMPTY_FORM);
    setCategoryModal("create");
  }

  function handleEditCategory(row) {
    setActiveCategory(row);
    setForm({ name: row.name, description: row.description, status: row.status });
    setCategoryModal("edit");
  }

  function closeCategoryModal() {
    setCategoryModal(null);
    setActiveCategory(null);
  }


  async function handleCategorySubmit(event) {
    event.preventDefault();
    if (saving) return;

    const name = form.name.trim();
    if (name.length < 2) {
      showToast("Vui lòng nhập tên chủ đề (ít nhất 2 ký tự).");
      return;
    }

    setSaving(true);
    try {
      if (categoryModal === "edit" && activeCategory) {
        await adminApi(`/admin/categories/${activeCategory.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name, description: form.description.trim(), status: form.status })
        });
        showToast(`Đã cập nhật chủ đề “${name}”.`);
      } else {
        await adminApi("/admin/categories", {
          method: "POST",
          body: JSON.stringify({ name, description: form.description.trim(), status: form.status })
        });
        showToast(`Đã tạo chủ đề “${name}”.`);
      }
      closeCategoryModal();
      await loadCategories({ silent: true });
    } catch (error) {
      showToast(error.message || "Không lưu được chủ đề.");
    } finally {
      setSaving(false);
    }
  }

  function requestDeleteCategory(row) {
    if (row.packageCount > 0) {
      showToast(`Chủ đề “${row.name}” đang chứa ${row.packageCount} gói — hãy chuyển các gói sang chủ đề khác trước khi xóa.`);
      return;
    }
    setDeleteTarget(row);
  }

  async function handleDeleteSubmit(event) {
    event.preventDefault();
    if (!deleteTarget || saving) return;

    setSaving(true);
    try {
      await adminApi(`/admin/categories/${deleteTarget.id}`, { method: "DELETE" });
      const deletedName = deleteTarget.name;
      setDeleteTarget(null);
      showToast(`Đã xóa chủ đề “${deletedName}”.`);
      if (items.length === 1 && pagination.page > 1) setPage(pagination.page - 1);
      else await loadCategories({ silent: true });
    } catch (error) {
      showToast(error.message || "Không xóa được chủ đề.");
    } finally {
      setSaving(false);
    }
  }

  const statCards = useMemo(() => {
    if (!stats) return [];
    const coverage = stats.packages ? Math.round((stats.assignedPackages / stats.packages) * 100) : 100;
    return [
      {
        id: "total",
        label: "Tổng số chủ đề",
        value: stats.total,
        unit: "Chủ đề",
        icon: FolderTree,
        tone: "violet",
        legend: [
          { tone: "open", text: `${numberFormat.format(stats.active)} Hoạt động` },
          { tone: "archived", text: `${numberFormat.format(stats.inactive)} Tạm ẩn` }
        ]
      },
      {
        id: "packages",
        label: "Gói thuộc chủ đề",
        value: stats.assignedPackages,
        unit: "Gói đề",
        icon: Package,
        tone: "blue",
        pill: `${coverage}% gói đã gán chủ đề`,
        pillTone: coverage === 100 ? "green" : "amber",
        pillIcon: coverage === 100 ? CheckCircle2 : AlertTriangle
      },
      {
        id: "questions",
        label: "Câu hỏi phân bố",
        value: stats.questions,
        unit: "Câu hỏi",
        icon: BookOpenCheck,
        tone: "amber",
        pill: stats.unassignedPackages
          ? `${numberFormat.format(stats.unassignedPackages)} gói chưa gán chủ đề`
          : `${numberFormat.format(stats.categoriesWithQuestions)}/${numberFormat.format(stats.total)} chủ đề có câu hỏi`,
        pillTone: stats.unassignedPackages ? "amber" : "green",
        pillIcon: BookOpenCheck
      },
      {
        id: "rate",
        label: "Tỷ lệ chủ đề đang mở",
        value: stats.openRatio,
        unit: "% chủ đề",
        icon: Percent,
        tone: "green",
        format: "percent",
        percent: stats.openRatio
      }
    ];
  }, [stats]);

  const pageList = useMemo(
    () => buildPageList(pagination.page, pagination.totalPages),
    [pagination]
  );

  const startItem = pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);
  const hasFilters = Boolean(debouncedQuery.trim()) || statusFilter !== "all";


  return (
    <AdminConsoleLayout
      admin={admin}
      onLogout={onLogout}
      onNavigate={onNavigate}
      activePath="/admin/categories"
      breadcrumb="Quản trị / Quản lý chủ đề"
      actions={
        <AdminTopActions
          admin={admin}
          onLogout={onLogout}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Tìm tên chủ đề, thời kỳ lịch sử..."
          searchLabel="Tìm kiếm chủ đề lịch sử"
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
          <h2>Không tải được danh sách chủ đề</h2>
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
                    <div className="adm-cat-stat-legend">
                      {item.legend.map((entry) => (
                        <span key={entry.text} className={`is-${entry.tone}`}>
                          <i aria-hidden="true" />
                          {entry.text}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {item.percent !== undefined ? (
                    <div className="adm-cat-stat-progress">
                      <span className="adm-track">
                        <i
                          style={{
                            width: `${Math.min(100, Math.max(0, item.percent))}%`,
                            background: "linear-gradient(90deg, #34d399, #10b981)"
                          }}
                        />
                      </span>
                      <small>trên tổng số chủ đề đã tạo</small>
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


          <section className="adm-filter-bar is-categories" aria-label="Bộ lọc chủ đề">
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

            <button type="button" className="adm-ghost adm-filter-reset" onClick={resetFilters}>
              <RefreshCw size={15} /> Đặt lại bộ lọc
            </button>

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

              <button type="button" className="adm-ghost" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw size={15} /> {refreshing ? "Đang tải..." : "Làm mới"}
              </button>

              <button type="button" className="adm-primary" onClick={openCreateCategory}>
                <Plus size={16} /> Tạo chủ đề mới
              </button>
            </div>
          </section>

          <section className="adm-panel adm-panel-flush" aria-label="Danh sách chủ đề">
            <div className="adm-table-wrap">
              <table className="adm-table adm-table-categories">
                <thead>
                  <tr>
                    <th scope="col">Biểu tượng</th>
                    <th scope="col">Tên chủ đề</th>
                    <th scope="col">Mô tả tóm tắt</th>
                    <th scope="col">Số gói</th>
                    <th scope="col">Số câu hỏi</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Cập nhật</th>
                    <th scope="col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="adm-empty-row">
                        {hasFilters
                          ? "Không tìm thấy chủ đề phù hợp với bộ lọc hiện tại."
                          : "Chưa có chủ đề nào. Hãy tạo chủ đề đầu tiên để phân loại gói câu hỏi."}
                      </td>
                    </tr>
                  ) : (
                    items.map((row, index) => {
                      const ThumbIcon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];
                      const tone = CATEGORY_TONES[index % CATEGORY_TONES.length];
                      const status = statusMeta[row.status] || statusMeta.active;
                      const isLocked = row.packageCount > 0;
                      return (
                        <tr key={row.id}>
                          <td>
                            <span className={`adm-cat-thumb is-${tone}`} aria-hidden="true">
                              <ThumbIcon size={18} />
                            </span>
                          </td>
                          <td>
                            <span className="adm-cat-name">
                              <strong>{row.name}</strong>
                              <small>
                                <Landmark size={11} aria-hidden="true" />
                                Giai đoạn lịch sử
                              </small>
                            </span>
                          </td>
                          <td>
                            <p className="adm-cat-desc">{row.description || "Chưa có mô tả cho chủ đề này."}</p>
                          </td>

                          <td>
                            <span className="adm-cat-count">
                              {numberFormat.format(row.packageCount)} Gói
                              <small>thuộc chủ đề</small>
                            </span>
                          </td>
                          <td>
                            <span className="adm-cat-count">
                              {numberFormat.format(row.questionCount)} Câu
                              <small>câu hỏi</small>
                            </span>
                          </td>
                          <td>
                            <span className={`adm-badge ${status.badge}`}>
                              <i aria-hidden="true" />
                              {status.label}
                            </span>
                          </td>
                          <td>
                            <span className="adm-cat-date">{formatShortDate(row.updatedAt)}</span>
                          </td>
                          <td>
                            <div className="adm-table-actions">
                              <button
                                type="button"
                                className="adm-eye-btn"
                                onClick={() => handleEditCategory(row)}
                                aria-label={`Chỉnh sửa ${row.name}`}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                className="adm-eye-btn is-danger"
                                onClick={() => requestDeleteCategory(row)}
                                title={isLocked ? "Chủ đề còn gói, không thể xóa" : "Xóa chủ đề"}
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
                <b>{numberFormat.format(pagination.total)}</b> chủ đề
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


      {categoryModal ? (
        <AdminFormModal
          title={categoryModal === "edit" ? "Chỉnh sửa chủ đề" : "Tạo chủ đề mới"}
          subtitle={categoryModal === "edit"
            ? "Thay đổi được lưu trực tiếp vào cơ sở dữ liệu."
            : "Chủ đề mới sẽ xuất hiện trong bộ lọc của trang quản lý gói câu hỏi."}
          size="lg"
          onSubmit={handleCategorySubmit}
          onClose={closeCategoryModal}
          footer={
            <>
              <button type="button" className="adm-ghost" onClick={closeCategoryModal}>Hủy bỏ</button>
              <button type="submit" className="adm-primary" disabled={saving}>
                {saving
                  ? "Đang lưu..."
                  : categoryModal === "edit" ? "Lưu thay đổi" : "Tạo chủ đề ngay"}
              </button>
            </>
          }
        >
          <div className="adm-field">
            <label htmlFor="adm-cat-name">Tên chủ đề / thời kỳ</label>
            <input
              id="adm-cat-name"
              className="adm-input"
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="Ví dụ: Kháng chiến chống Pháp (1945 - 1954)"
              autoFocus
            />
          </div>

          <div className="adm-field">
            <label htmlFor="adm-cat-description">Mô tả chủ đề</label>
            <textarea
              id="adm-cat-description"
              className="adm-textarea"
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              placeholder="Tóm tắt phạm vi thời kỳ, sự kiện trọng tâm của chủ đề..."
            />
          </div>

          <div className="adm-field">
            <label htmlFor="adm-cat-status">Trạng thái</label>
            <select
              id="adm-cat-status"
              className="adm-select"
              value={form.status}
              onChange={(event) => updateForm("status", event.target.value)}
            >
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm ẩn</option>
            </select>
            <span className="adm-field-hint">Chủ đề tạm ẩn sẽ không hiển thị ở cổng học tập.</span>
          </div>
        </AdminFormModal>
      ) : null}

      {deleteTarget ? (
        <AdminFormModal
          title="Xóa chủ đề"
          subtitle="Hành động này không thể hoàn tác."
          onSubmit={handleDeleteSubmit}
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button type="button" className="adm-ghost" onClick={() => setDeleteTarget(null)}>Hủy bỏ</button>
              <button type="submit" className="adm-primary" disabled={saving}>
                {saving ? "Đang xóa..." : "Xóa chủ đề"}
              </button>
            </>
          }
        >
          <div className="adm-note">
            <span className="adm-note-icon" aria-hidden="true"><AlertTriangle size={18} /></span>
            <p>
              Chủ đề <b>{deleteTarget.name}</b> sẽ bị xóa khỏi hệ thống. Chỉ xóa được chủ đề không còn gói câu hỏi nào.
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
